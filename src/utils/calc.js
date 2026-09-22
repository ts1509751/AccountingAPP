/**
 * Safe Mathematical Expression Evaluator for Calculator Keypad
 * Supports +, -, *, / with standard operator precedence.
 */
export function safeEvaluateExpression(expr) {
  if (!expr || typeof expr !== 'string') return 0;

  // Normalize operators: replace × with *, ÷ with /, and remove whitespace and currency symbols
  const clean = expr
    .replace(/NT\$|\$|,/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .trim();

  if (!clean) return 0;

  // Tokenize numbers and operators (+, -, *, /)
  const tokens = [];
  let currentNum = '';

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      currentNum += ch;
    } else if (['+', '-', '*', '/'].includes(ch)) {
      if (currentNum !== '') {
        tokens.push(parseFloat(currentNum));
        currentNum = '';
      } else if (ch === '-' && (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string')) {
        // Unary minus for negative number
        currentNum = '-';
        continue;
      }
      tokens.push(ch);
    }
  }

  if (currentNum !== '' && currentNum !== '-') {
    tokens.push(parseFloat(currentNum));
  }

  if (tokens.length === 0) return 0;
  // If ends with an operator, ignore the dangling operator
  if (typeof tokens[tokens.length - 1] === 'string') {
    tokens.pop();
  }
  if (tokens.length === 0) return 0;

  // First pass: Multiplication and Division (*, /)
  const pass1 = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === '*' || token === '/') {
      const prev = pass1.pop();
      const next = tokens[i + 1];
      if (typeof next === 'number') {
        const res = token === '*' ? prev * next : (next !== 0 ? prev / next : 0);
        pass1.push(res);
        i += 2;
      } else {
        pass1.push(prev);
        i++;
      }
    } else {
      pass1.push(token);
      i++;
    }
  }

  // Second pass: Addition and Subtraction (+, -)
  if (pass1.length === 0) return 0;
  let total = typeof pass1[0] === 'number' ? pass1[0] : 0;
  for (let j = 1; j < pass1.length; j += 2) {
    const op = pass1[j];
    const next = pass1[j + 1];
    if (typeof next === 'number') {
      if (op === '+') total += next;
      else if (op === '-') total -= next;
    }
  }

  // Round to 2 decimal places to prevent floating point quirks (e.g. 0.1 + 0.2 = 0.30000000000000004)
  return Math.round((total + Number.EPSILON) * 100) / 100;
}
