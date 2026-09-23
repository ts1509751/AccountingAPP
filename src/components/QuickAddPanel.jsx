import { useState, useEffect, useMemo, useRef } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryIcon, POPULAR_ICONS } from '../utils/categories';
import { useDragScroll } from '../hooks/useDragScroll';
import { parseNaturalLanguageInput } from '../utils/nlpParser';
import { safeEvaluateExpression } from '../utils/calc';
import { Plus, X, Calendar, CreditCard, Banknote, Smile, Sparkles, Check, Send, Calculator, AlertTriangle } from 'lucide-react';
import CategoryModal from './CategoryModal';
import CreditCardModal from './CreditCardModal';

const formatRaw = (n) =>
  new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(n);

export default function QuickAddPanel({ onClose }) {
  const {
    categories,
    categoryIcons,
    addCategory,
    addTransaction,
    transactions,
    creditCards,
    cardUsageMap,
  } = useExpense();

  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'credit'
  const [selectedCardId, setSelectedCardId] = useState(creditCards[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');

  // Calculator states
  const [showCalculator, setShowCalculator] = useState(false);
  const hasFormula = /[+\-*\/×÷−]/.test(amount);
  const evaluatedValue = useMemo(() => safeEvaluateExpression(amount), [amount]);

  // Duplicate prevention states
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const lastRecordedRef = useRef(null);

  // Natural language bookkeeping states
  const [nlpInput, setNlpInput] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [nlpApplied, setNlpApplied] = useState(false);

  // Submodals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);

  // Sync default card if none selected and cards exist
  useEffect(() => {
    if (!selectedCardId && creditCards.length > 0) {
      setSelectedCardId(creditCards[0].id);
    }
  }, [creditCards, selectedCardId]);

  // Custom Category Creation State
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📌');
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Drag-to-scroll hook for desktop mouse drag & wheel
  const { dragProps, isDragging, hasMoved } = useDragScroll();

  const amountInputRef = useRef(null);
  const [activeKey, setActiveKey] = useState(null);

  const flashKey = (k) => {
    setActiveKey(k);
    setTimeout(() => setActiveKey(null), 150);
  };

  const handleKeypadPress = (k) => {
    flashKey(k);
    if (k === 'C') {
      setAmount('');
      return;
    }
    if (k === 'DEL') {
      setAmount(prev => (prev ? String(prev).slice(0, -1) : ''));
      return;
    }
    if (k === '=') {
      const res = safeEvaluateExpression(amount);
      if (typeof res === 'number' && !isNaN(res)) setAmount(String(res));
      return;
    }
    if (k === 'DONE') {
      const res = safeEvaluateExpression(amount);
      if (typeof res === 'number' && !isNaN(res) && res > 0) setAmount(String(res));
      setShowCalculator(false);
      return;
    }
    if (['+', '-', '×', '÷'].includes(k)) {
      setAmount(prev => {
        const trimmed = (prev ? String(prev) : '').trim();
        if (!trimmed) return '';
        if (/[+\-*\/×÷−]$/.test(trimmed)) {
          return trimmed.slice(0, -1) + k;
        }
        return trimmed + k;
      });
      return;
    }
    // Numbers or dot
    setAmount(prev => {
      const str = prev ? String(prev) : '';
      if (str === '0' && k !== '.') return k;
      if (k === '.' && str.endsWith('.')) return str;
      return str + k;
    });
  };

  // Keyboard event handler on the amount field itself
  const handleAmountKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      flashKey('DONE');
      handleSubmit();
      return;
    }
    if (e.key === '=') {
      e.preventDefault();
      handleKeypadPress('=');
      return;
    }
    if (e.key === '+') {
      e.preventDefault();
      handleKeypadPress('+');
      return;
    }
    if (e.key === '-') {
      e.preventDefault();
      handleKeypadPress('-');
      return;
    }
    if (e.key === '*' || e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      handleKeypadPress('×');
      return;
    }
    if (e.key === '/') {
      e.preventDefault();
      handleKeypadPress('÷');
      return;
    }
    if (e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      handleKeypadPress('C');
      return;
    }
    if (e.key === 'Backspace') {
      flashKey('DEL');
      return;
    }
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
      flashKey(e.key);
      return;
    }
  };

  // Auto-focus amount input on desktop when opening panel
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Global keyboard listener on desktop to capture calculator keys seamlessly
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (showCategoryModal || showCreditCardModal || duplicateWarning) return;

      const activeEl = document.activeElement;
      const tag = activeEl?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea';
      const isOtherInput = isInput && activeEl !== amountInputRef.current;

      // Don't intercept if user is typing in another text field (NLP or Description or New Category)
      if (isOtherInput) return;

      // Handle Escape: close calculator if open, or close panel
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showCalculator) {
          setShowCalculator(false);
          amountInputRef.current?.focus();
        } else {
          onClose();
        }
        return;
      }

      // If focus is outside amountInputRef, capture calculator/numpad keystrokes
      if (activeEl !== amountInputRef.current) {
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          handleKeypadPress(e.key);
          amountInputRef.current?.focus();
        } else if (e.key === '.') {
          e.preventDefault();
          handleKeypadPress('.');
          amountInputRef.current?.focus();
        } else if (e.key === '+') {
          e.preventDefault();
          handleKeypadPress('+');
          amountInputRef.current?.focus();
        } else if (e.key === '-') {
          e.preventDefault();
          handleKeypadPress('-');
          amountInputRef.current?.focus();
        } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          handleKeypadPress('×');
          amountInputRef.current?.focus();
        } else if (e.key === '/') {
          e.preventDefault();
          handleKeypadPress('÷');
          amountInputRef.current?.focus();
        } else if (e.key === '=') {
          e.preventDefault();
          handleKeypadPress('=');
          amountInputRef.current?.focus();
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          handleKeypadPress('C');
          amountInputRef.current?.focus();
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          handleKeypadPress('DEL');
          amountInputRef.current?.focus();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          flashKey('DONE');
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [amount, showCalculator, showCategoryModal, showCreditCardModal, duplicateWarning, onClose, type, selectedCategory, description, date, paymentMethod, selectedCardId]);

  const checkDuplicate = (candidate) => {
    const now = Date.now();
    const THIRTY_SECONDS = 30 * 1000;

    // 1. Check in-memory ref
    if (lastRecordedRef.current) {
      const { time, tx } = lastRecordedRef.current;
      if (now - time < THIRTY_SECONDS) {
        const sameType = tx.type === candidate.type;
        const sameAmount = Number(tx.amount) === Number(candidate.amount);
        const sameCategory = tx.category === candidate.category;
        const sameDesc = (tx.description || '').trim() === (candidate.description || '').trim();
        if (sameType && sameAmount && sameCategory && sameDesc) {
          return tx;
        }
      }
    }

    // 2. Check context transactions
    const match = (transactions || []).find(t => {
      if (!t.createdAt) return false;
      const isWithin30s = (now - t.createdAt) < THIRTY_SECONDS;
      if (!isWithin30s) return false;
      const sameType = t.type === candidate.type;
      const sameAmount = Number(t.amount) === Number(candidate.amount);
      const sameCategory = t.category === candidate.category;
      const sameDesc = (t.description || '').trim() === (candidate.description || '').trim();
      return sameType && sameAmount && sameCategory && sameDesc;
    });

    return match || null;
  };

  const executeAddTransaction = async (payload) => {
    lastRecordedRef.current = { time: Date.now(), tx: payload };
    await addTransaction(payload);
    setAmount('');
    setDescription('');
    setDate(today);
    setNlpInput('');
    onClose();
  };

  const handleAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (trimmed) {
      await addCategory(trimmed, newCatIcon);
      setSelectedCategory(trimmed);
      setNewCatName('');
      setNewCatIcon('📌');
      setShowIconPicker(false);
      setIsAddingCat(false);
    }
  };

  const handleSubmit = async (force = false) => {
    const finalAmount = safeEvaluateExpression(amount);
    if (!finalAmount || finalAmount <= 0 || !selectedCategory) return;
    
    let cardName = null;
    let cardIdToSave = null;
    if (paymentMethod === 'credit') {
      cardIdToSave = selectedCardId || (creditCards[0]?.id || null);
      const matched = creditCards.find(c => c.id === cardIdToSave);
      if (matched) cardName = matched.name;
    }

    const payload = {
      type,
      amount: Number(finalAmount),
      category: selectedCategory,
      description: description.trim(),
      date: date || today,
      paymentMethod,
      cardId: cardIdToSave,
      cardName,
    };

    if (!force) {
      const dup = checkDuplicate(payload);
      if (dup) {
        setDuplicateWarning({ candidate: payload, duplicate: dup });
        return;
      }
    }

    await executeAddTransaction(payload);
  };

  const quickExamples = [
    '今天中午牛肉麵 150 刷卡',
    '昨天搭計程車 220 現金',
    '全聯生活用品 480 刷卡',
  ];

  const handleNlpParse = (textToParse = nlpInput, autoSubmit = false) => {
    const text = (textToParse || '').trim();
    if (!text) return;

    const res = parseNaturalLanguageInput(text, {
      categories,
      creditCards,
      referenceDate: new Date(),
    });

    if (res) {
      setParsedResult(res);
      setNlpApplied(true);
      setType(res.type);
      if (res.amount > 0) setAmount(String(res.amount));
      if (res.description) setDescription(res.description);
      if (res.date) setDate(res.date);
      if (res.category) setSelectedCategory(res.category);
      if (res.paymentMethod) setPaymentMethod(res.paymentMethod);
      if (res.cardId) setSelectedCardId(res.cardId);

      if (autoSubmit && res.amount > 0) {
        handleSubmitDirect(res);
      }
    }
  };

  const handleSubmitDirect = async (res, force = false) => {
    let cardName = null;
    let cardIdToSave = null;
    if (res.paymentMethod === 'credit') {
      cardIdToSave = res.cardId || (creditCards[0]?.id || null);
      const matched = creditCards.find(c => c.id === cardIdToSave);
      if (matched) cardName = matched.name;
    }

    const payload = {
      type: res.type,
      amount: Number(res.amount),
      category: res.category || selectedCategory || categories[0] || '生活',
      description: (res.description || '').trim(),
      date: res.date || today,
      paymentMethod: res.paymentMethod,
      cardId: cardIdToSave,
      cardName,
    };

    if (!force) {
      const dup = checkDuplicate(payload);
      if (dup) {
        setDuplicateWarning({ candidate: payload, duplicate: dup });
        return;
      }
    }

    await executeAddTransaction(payload);
  };

  return (
    <>
      <div className="quick-add-overlay" onClick={onClose} />
      <div className="quick-add-panel">
        <div className="panel-handle" />

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>快速記帳</span>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Natural Language Smart Bookkeeping Input ── */}
        <div className="nlp-input-card">
          <div className="nlp-input-header">
            <span className="nlp-label">
              <Sparkles size={14} style={{ color: 'var(--accent-blue)', verticalAlign: 'middle', marginRight: '4px' }} />
              自然語言智慧記帳
            </span>
            <span className="nlp-sub-hint">輸入一句話自動辨識所有欄位</span>
          </div>

          <div className="nlp-input-row">
            <input
              className="nlp-input"
              value={nlpInput}
              onChange={e => {
                setNlpInput(e.target.value);
                setNlpApplied(false);
              }}
              placeholder="例: 今天中午牛肉麵 150 刷卡"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleNlpParse(nlpInput, false);
                }
              }}
            />
            <button
              type="button"
              className="nlp-parse-btn"
              onClick={() => handleNlpParse(nlpInput, false)}
              title="自動解析並填入"
            >
              <Sparkles size={14} />
              <span>辨識</span>
            </button>
          </div>

          {/* Quick example tags */}
          <div className="nlp-examples-row">
            <span className="nlp-ex-label">💡 範例：</span>
            <div className="nlp-examples-scroll">
              {quickExamples.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="nlp-ex-chip"
                  onClick={() => {
                    setNlpInput(ex);
                    handleNlpParse(ex, false);
                  }}
                  title="點擊帶入此範例"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Result Preview Banner */}
          {parsedResult && nlpApplied && (
            <div className="nlp-result-banner">
              <div className="nlp-result-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                  <Check size={14} />
                  <span>已自動辨識並填入表單：</span>
                </div>
                {parsedResult.amount > 0 && (
                  <button
                    type="button"
                    className="nlp-oneclick-submit-btn"
                    onClick={() => handleSubmitDirect(parsedResult)}
                    title="直接以此資料記帳送出"
                  >
                    <Send size={12} />
                    <span>⚡ 一鍵直接記帳</span>
                  </button>
                )}
              </div>

              <div className="nlp-chips-grid">
                <span className="nlp-pill">📅 {parsedResult.date}</span>
                <span className={`nlp-pill type ${parsedResult.type}`}>
                  {parsedResult.type === 'expense' ? '💸 支出' : '💵 收入'}
                </span>
                <span className="nlp-pill">🏷️ {parsedResult.category}</span>
                <span className="nlp-pill amount">💰 NT$ {formatRaw(parsedResult.amount)}</span>
                <span className="nlp-pill">
                  {parsedResult.paymentMethod === 'credit'
                    ? `💳 ${parsedResult.cardName || '信用卡'}`
                    : '💵 現金'}
                </span>
                <span className="nlp-pill note">📝 {parsedResult.description}</span>
              </div>
            </div>
          )}
        </div>

        {/* 1. 支出 / 收入 */}
        <div className="panel-type-row">
          <button
            type="button"
            className={`type-btn ${type === 'expense' ? 'active-expense' : ''}`}
            onClick={() => setType('expense')}
          >
            💸 支出
          </button>
          <button
            type="button"
            className={`type-btn ${type === 'income' ? 'active-income' : ''}`}
            onClick={() => setType('income')}
          >
            💵 收入
          </button>
        </div>

        {/* 2. 金額 (支援數字鍵盤計算機與鍵盤直接輸入) */}
        <div className="panel-amount-card">
          <span className="panel-amount-prefix">NT$</span>
          <input
            ref={amountInputRef}
            className="panel-amount-field"
            type="text"
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^0-9.+\-*\/×÷−]/g, ''))}
            placeholder="0"
            inputMode="text"
            onKeyDown={handleAmountKeyDown}
          />
          <button
            type="button"
            className={`calc-toggle-btn ${showCalculator ? 'active' : ''}`}
            onClick={() => {
              setShowCalculator(prev => !prev);
              setTimeout(() => amountInputRef.current?.focus(), 60);
            }}
            title="開啟/關閉數字鍵盤計算機 (支援電腦鍵盤直接按)"
          >
            <Calculator size={17} />
            <span className="calc-toggle-text">計算機</span>
          </button>
        </div>

        {/* 即時計算預覽列 */}
        {hasFormula && (
          <div className="calc-preview-bar">
            <span className="calc-preview-label">計算結果：</span>
            <span className="calc-preview-val">NT$ {formatRaw(evaluatedValue)}</span>
            <button
              type="button"
              className="calc-apply-btn"
              onClick={() => {
                setAmount(String(evaluatedValue));
                amountInputRef.current?.focus();
              }}
              title="將計算結果直接填入金額欄位 (鍵盤按 = 亦可直接計算)"
            >
              = 帶入數值
            </button>
          </div>
        )}

        {/* 數字鍵盤計算機 */}
        {showCalculator && (
          <div className="calculator-keypad">
            <div className="calc-keyboard-hint desktop-only">
              <span>⌨️ 支援鍵盤直接輸入</span>
              <span className="calc-hint-shortcuts">(= 計算 / Enter 記帳 / C 清除 / Esc 關閉)</span>
            </div>
            <div className="calc-grid">
              <button type="button" className={`calc-btn op c-btn ${activeKey === 'C' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('C')}>C</button>
              <button type="button" className={`calc-btn op del-btn ${activeKey === 'DEL' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('DEL')}>⌫</button>
              <button type="button" className={`calc-btn op ${activeKey === '÷' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('÷')}>÷</button>
              <button type="button" className={`calc-btn op ${activeKey === '×' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('×')}>×</button>

              <button type="button" className={`calc-btn num ${activeKey === '7' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('7')}>7</button>
              <button type="button" className={`calc-btn num ${activeKey === '8' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('8')}>8</button>
              <button type="button" className={`calc-btn num ${activeKey === '9' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('9')}>9</button>
              <button type="button" className={`calc-btn op ${activeKey === '-' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('-')}>-</button>

              <button type="button" className={`calc-btn num ${activeKey === '4' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('4')}>4</button>
              <button type="button" className={`calc-btn num ${activeKey === '5' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('5')}>5</button>
              <button type="button" className={`calc-btn num ${activeKey === '6' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('6')}>6</button>
              <button type="button" className={`calc-btn op ${activeKey === '+' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('+')}>+</button>

              <button type="button" className={`calc-btn num ${activeKey === '1' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('1')}>1</button>
              <button type="button" className={`calc-btn num ${activeKey === '2' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('2')}>2</button>
              <button type="button" className={`calc-btn num ${activeKey === '3' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('3')}>3</button>
              <button type="button" className={`calc-btn eq-btn ${activeKey === '=' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('=')}>=</button>

              <button type="button" className={`calc-btn num ${activeKey === '0' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('0')}>0</button>
              <button type="button" className={`calc-btn num ${activeKey === '.' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('.')}>.</button>
              <button type="button" className={`calc-btn done-btn ${activeKey === 'DONE' ? 'keyboard-active' : ''}`} onClick={() => handleKeypadPress('DONE')}>完成</button>
            </div>
          </div>
        )}

        {/* 3. 現金 \ 信用卡 */}
        <div className="payment-method-row">
          <button
            type="button"
            className={`payment-method-btn ${paymentMethod === 'cash' ? 'active-cash' : ''}`}
            onClick={() => setPaymentMethod('cash')}
          >
            <Banknote size={15} />
            <span>現金 (Cash)</span>
          </button>
          <button
            type="button"
            className={`payment-method-btn ${paymentMethod === 'credit' ? 'active-credit' : ''}`}
            onClick={() => setPaymentMethod('credit')}
          >
            <CreditCard size={15} />
            <span>信用卡 (Card)</span>
          </button>
        </div>

        {/* If Credit Card selected: Show Card Selector with real-time remaining limit */}
        {paymentMethod === 'credit' && (
          <div className="quick-add-credit-section">
            <div className="quick-add-credit-header">
              <span className="section-subtitle">選擇卡片 (查看剩餘額度)：</span>
              <button
                type="button"
                className="text-link-btn"
                onClick={() => setShowCreditCardModal(true)}
              >
                ⚙️ 管理 / 新增卡片
              </button>
            </div>

            {creditCards.length === 0 ? (
              <div className="card-empty-prompt" onClick={() => setShowCreditCardModal(true)}>
                <span>💳 尚未設定信用卡，點此建立卡片以即時追蹤額度</span>
              </div>
            ) : (
              <div className="quick-card-scroll">
                {creditCards.map(c => {
                  const usage = cardUsageMap[c.id] || {
                    used: 0,
                    limit: c.limit || 0,
                    remaining: c.limit || 0,
                    percent: 0,
                    isOver: false,
                  };
                  const isSelected = selectedCardId === c.id;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`quick-card-chip ${isSelected ? 'selected' : ''}`}
                      style={{ '--chip-accent': c.color || '#2563eb' }}
                      onClick={() => setSelectedCardId(c.id)}
                    >
                      <div className="chip-name-row">
                        <span className="chip-dot" />
                        <span className="chip-name">{c.name}</span>
                      </div>
                      <div className="chip-limit-info">
                        <span>剩餘 NT${formatRaw(usage.remaining)}</span>
                        <span className="chip-used-label">(已用 {usage.percent}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. 分類（兩排顯示，方便選擇） */}
        {isAddingCat ? (
          <div className="new-cat-box">
            <div className="new-cat-input-row">
              <button
                type="button"
                className="new-cat-icon-select-btn"
                onClick={() => setShowIconPicker(!showIconPicker)}
                title="點擊自選圖示"
              >
                <span className="selected-icon-preview">{newCatIcon}</span>
                <span className="icon-pick-hint">選圖示 ▾</span>
              </button>
              <input
                className="panel-input"
                style={{ flex: 1 }}
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="輸入新分類名稱 (如: 咖啡、寵物)"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              />
              <button className="btn-blue" onClick={handleAddCategory}>新增</button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setIsAddingCat(false);
                  setShowIconPicker(false);
                }}
              >
                取消
              </button>
            </div>

            {/* Icon Picker Grid */}
            {showIconPicker && (
              <div className="emoji-picker-container">
                <div className="emoji-picker-title">
                  <Smile size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                  點選自訂圖示：
                </div>
                <div className="emoji-picker-grid">
                  {POPULAR_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`emoji-pick-btn ${newCatIcon === icon ? 'active' : ''}`}
                      onClick={() => {
                        setNewCatIcon(icon);
                        setShowIconPicker(false);
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`category-scroll two-rows ${isDragging ? 'is-dragging' : ''}`}
            {...dragProps}
            title="可使用滑鼠左右拖曳或滑動查看更多分類"
          >
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  if (!hasMoved()) setSelectedCategory(cat);
                }}
              >
                <span className="cat-icon">{getCategoryIcon(cat, categoryIcons)}</span>
                <span className="cat-name">{cat}</span>
              </button>
            ))}
            <button
              type="button"
              className="cat-pill add-new"
              onClick={() => {
                if (!hasMoved()) setIsAddingCat(true);
              }}
            >
              <span className="cat-icon">＋</span>
              <span className="cat-name">新分類</span>
            </button>
            <button
              type="button"
              className="cat-pill manage-cat"
              onClick={() => {
                if (!hasMoved()) setShowCategoryModal(true);
              }}
              title="管理與修改現有分類圖示"
            >
              <span className="cat-icon">⚙️</span>
              <span className="cat-name">管理</span>
            </button>
          </div>
        )}

        {/* 5. 備註 */}
        <div className="panel-desc-row">
          <input
            className="panel-input"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="備註（例如：晚餐、電影票...選填）"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* 6. 日期 */}
        <div className="panel-date-picker-row">
          <div className="panel-date-left">
            <Calendar size={16} className="text-muted" />
            <span className="panel-date-label">記帳日期：</span>
            <input
              type="date"
              className="panel-date-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          {date === today ? (
            <span className="panel-date-badge">今日 (預設)</span>
          ) : (
            <button
              type="button"
              className="panel-date-today-btn"
              onClick={() => setDate(today)}
            >
              重設為今日
            </button>
          )}
        </div>

        {/* 確定記帳按鈕 */}
        <button
          type="button"
          className="panel-submit-btn"
          onClick={() => handleSubmit(false)}
          disabled={!evaluatedValue || evaluatedValue <= 0}
        >
          <Plus size={20} />
          <span>確定記帳</span>
        </button>
      </div>

      {/* Submodals */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />

      <CreditCardModal
        isOpen={showCreditCardModal}
        onClose={() => setShowCreditCardModal(false)}
      />

      {/* ── 防止 30 秒內重複記帳提示對話框 ── */}
      {duplicateWarning && (
        <div className="duplicate-modal-overlay" onClick={() => setDuplicateWarning(null)}>
          <div className="confirm-delete-sheet duplicate-warning-sheet" onClick={e => e.stopPropagation()}>
            <div className="confirm-delete-icon duplicate-warning-icon">
              <AlertTriangle size={28} />
            </div>
            <h3 className="confirm-delete-title">發現可能重複記帳</h3>
            <p className="confirm-delete-desc" style={{ marginBottom: '1rem' }}>
              系統偵測到您在 <strong>30 秒內</strong> 剛記錄過完全相同的一筆交易：
            </p>
            <div className="duplicate-candidate-card">
              <div className="dup-field-row">
                <span className="dup-field-label">類型</span>
                <span className={`dup-field-val ${duplicateWarning.candidate.type}`}>
                  {duplicateWarning.candidate.type === 'expense' ? '💸 支出' : '💵 收入'}
                </span>
              </div>
              <div className="dup-field-row">
                <span className="dup-field-label">金額</span>
                <span className="dup-field-val amount">
                  NT$ {formatRaw(duplicateWarning.candidate.amount)}
                </span>
              </div>
              <div className="dup-field-row">
                <span className="dup-field-label">分類</span>
                <span className="dup-field-val">{duplicateWarning.candidate.category}</span>
              </div>
              {duplicateWarning.candidate.description && (
                <div className="dup-field-row">
                  <span className="dup-field-label">備註</span>
                  <span className="dup-field-val">{duplicateWarning.candidate.description}</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              請問您是否仍要再次記錄這筆相同交易？
            </p>
            <div className="confirm-delete-actions">
              <button
                type="button"
                className="confirm-btn cancel"
                onClick={() => setDuplicateWarning(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="confirm-btn confirm-anyway"
                onClick={async () => {
                  const toAdd = duplicateWarning.candidate;
                  setDuplicateWarning(null);
                  await executeAddTransaction(toAdd);
                }}
              >
                確認仍要記錄
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

