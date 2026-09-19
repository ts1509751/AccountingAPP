/**
 * Natural Language Bookkeeping Parser for Traditional Chinese (Taiwanese context)
 *
 * Example input:
 * "今天中午吃牛肉麵 150 元，刷賴點卡"
 * =>
 * Date: 2026/09/19
 * Type: expense
 * Category: 餐飲
 * Amount: 150
 * PaymentMethod: credit
 * Card: 聯邦賴點卡
 * Description: 午餐牛肉麵
 */

// Category dictionary mapping keywords to standard categories
const CATEGORY_KEYWORDS = {
  '餐飲': [
    '吃', '喝', '早餐', '早午餐', '午餐', '晚餐', '宵夜', '下午茶', '點心',
    '牛肉麵', '麵', '飯', '便當', '排骨飯', '雞排', '滷肉飯', '水餃', '鍋貼', '拉麵', '烏龍麵',
    '火鍋', '麻辣鍋', '涮涮鍋', '牛排', '鐵板燒', '壽司', '生魚片', '日料', '燒肉', '居酒屋',
    '披薩', '義大利麵', '漢堡', '薯條', '速食', '麥當勞', '肯德基', '摩斯', '漢堡王', '頂呱呱',
    '咖啡', '拿鐵', '美式', '星巴克', '路易莎', 'cama', '飲料', '手搖', '手搖杯', '珍奶', '奶茶', '綠茶', '紅茶', '青茶', '四季春',
    '麵包', '吐司', '蛋糕', '甜點', '豆花', '剉冰', '冰淇淋', '小吃', '夜市', '餐廳', '熱炒', '熱炒店',
    '超商吃', '7-11吃', '全家吃', '買菜', '食材', '水果', '零食', '餅乾', '泡麵', '茶葉蛋',
  ],
  '交通': [
    '捷運', '公車', '巴士', '客運', '計程車', '小黃', 'Uber', 'uber', '高鐵', '台鐵', '火車', '機票', '飛機',
    '加油', '加95', '加98', '加92', '柴油', '油錢', '停車', '停車費', '路邊停車', '車位',
    '悠遊卡加值', '一卡通加值', '過路費', 'eTag', 'etag', '洗車', '保養', '修車', '輪胎', '機油',
    '機車', '汽車', '換機油', '租車', 'iRent', 'irent', 'Wemo', 'wemo', 'GoShare', 'goshare',
    '罰單', '違規', '拖吊',
  ],
  '購物': [
    '買', '網購', '蝦皮', 'shopee', 'Momo', 'momo', 'PChome', 'pchome', '淘寶', 'Amazon', 'amazon',
    '全聯', '家樂福', '好市多', 'Costco', 'costco', '大潤發', '愛買', '特力屋', 'IKEA', 'ikea',
    '衣服', '褲子', '外套', '襯衫', 'T恤', '鞋子', '球鞋', '包包', '皮夾', '飾品', '手錶',
    '化妝品', '美妝', '保養品', '面膜', '防曬', '香水', '屈臣氏', '康是美', '寶雅',
    '3C', '手機', 'iPhone', 'iphone', '電腦', '筆電', 'iPad', 'ipad', '耳機', 'AirPods', '充電線',
    '書店', '博客來', '誠品', '文具', '筆記本',
  ],
  '娛樂': [
    '電影', '威秀', '國賓', '秀泰', 'KTV', 'ktv', '錢櫃', '好樂迪', '唱歌', '遊戲', 'Steam', 'steam',
    'Switch', 'switch', 'PS5', 'ps5', '課金', '手遊', '演唱會', '門票', '展覽', '看展', '舞台劇',
    '旅遊', '出遊', '住宿', '飯店', '民宿', '露營', '溫泉', '機加酒',
    'Netflix', 'netflix', 'Disney+', 'disney', 'Spotify', 'spotify', 'YouTube', 'youtube',
    '遊樂園', '密室逃脫', '桌遊', '保齡球', '健身房', '重訓', '瑜珈', '運動',
  ],
  '生活': [
    '生活用品', '水費', '電費', '瓦斯', '瓦斯費', '天然氣', '電信費', '電話費', '手機費', '網路費', '寬頻',
    '房租', '租金', '管理費', '清潔費', '垃圾袋', '專用垃圾袋',
    '日用品', '衛生紙', '濕紙巾', '洗衣精', '洗碗精', '沐浴乳', '洗髮精', '牙膏', '牙刷',
    '理髮', '剪髮', '燙髮', '染髮', '洗頭', '美甲', '按摩',
    '五金', '水電', '修繕', '燈泡', '電池', '貓砂', '飼料', '寵物',
  ],
  '醫療': [
    '看病', '看醫生', '診所', '醫院', '掛號', '掛號費', '醫藥費', '藥局', '買藥', '止痛藥', '感冒藥', '成藥',
    '牙醫', '洗牙', '補牙', '拔牙', '健檢', '健康檢查', '體檢', '抽血',
    '眼科', '配眼鏡', '隱形眼鏡', '復健', '中醫', '針灸', '推拿',
    '保健食品', '保健品', '維他命', '益生菌', '魚油', 'B群', '口罩',
  ],
  '投資': [
    '股票', '證券', '台股', '美股', '零股', '定期定額', 'ETF', 'etf', '基金', '存股',
    '加密貨幣', '比特幣', '以太幣', '買進', '開戶', '外幣', '換匯',
  ],
  '教育': [
    '學費', '雜費', '補習', '補習費', '家教', '書籍', '參考書', '教科書',
    '線上課程', 'Udemy', 'udemy', 'Hahow', 'hahow', '考照', '考試費', '報名費', '多益', '托福',
  ],
  '薪資': [
    '薪水', '薪資', '月薪', '本薪', '工讀', '兼職', '接案', '外包', '加班費', '分紅', '年終', '獎金',
    '發票中獎', '發票', '中獎', '利息', '股息', '退稅', '回饋金',
  ],
};

// Income-specific intent indicators
const INCOME_KEYWORDS = [
  '薪水', '薪資', '月薪', '工讀', '兼職', '收入', '獎金', '分紅', '年終', '退稅',
  '發票中獎', '發票', '中獎', '利息', '股息', '配息', '現金回饋', '回饋金', '補助', '津貼',
  '賣出', '收到', '進帳', '匯入', '賺了',
];

/**
 * Parses a relative or absolute date from text
 * @param {string} text 
 * @param {Date} referenceDate 
 * @returns {{ dateStr: string, matchedToken: string | null }}
 */
function extractDate(text, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const pad = (n) => String(n).padStart(2, '0');
  const formatYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // 1. Explicit ISO / slash date: 2026/09/19 or 2026-09-19
  const fullDateMatch = text.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (fullDateMatch) {
    const y = parseInt(fullDateMatch[1], 10);
    const m = parseInt(fullDateMatch[2], 10);
    const d = parseInt(fullDateMatch[3], 10);
    const parsed = new Date(y, m - 1, d);
    return { dateStr: formatYMD(parsed), matchedToken: fullDateMatch[0] };
  }

  // 2. Relative day tokens (order: 大前天 before 前天, 大後天 before 後天)
  const relPatterns = [
    { regex: /(大前天)/, offset: -3 },
    { regex: /(前天|前日)/, offset: -2 },
    { regex: /(昨天|昨日)/, offset: -1 },
    { regex: /(大後天)/, offset: 3 },
    { regex: /(後天)/, offset: 2 },
    { regex: /(明天|明日)/, offset: 1 },
    { regex: /(今天|今日)/, offset: 0 },
  ];

  for (const { regex, offset } of relPatterns) {
    const m = text.match(regex);
    if (m) {
      const target = new Date(ref);
      target.setDate(target.getDate() + offset);
      return { dateStr: formatYMD(target), matchedToken: m[0] };
    }
  }

  // 3. Month & Day: 9/19, 9-19, 9月19日, 9月19號, 09/19
  const mdMatch = text.match(/(\d{1,2})[月/-](\d{1,2})(?:[日號號])?/);
  if (mdMatch) {
    const m = parseInt(mdMatch[1], 10);
    const d = parseInt(mdMatch[2], 10);
    const y = ref.getFullYear();
    const parsed = new Date(y, m - 1, d);
    return { dateStr: formatYMD(parsed), matchedToken: mdMatch[0] };
  }

  // Default to today
  return { dateStr: formatYMD(ref), matchedToken: null };
}

/**
 * Parses monetary amount from text (ignoring date tokens)
 * @param {string} text 
 * @param {string | null} dateToken
 * @returns {{ amount: number | null, matchedToken: string | null }}
 */
function extractAmount(text, dateToken = null) {
  // Strip date token first so e.g. "9/15" isn't matched as amount 9
  let cleanText = text;
  if (dateToken) {
    cleanText = cleanText.replace(dateToken, ' ');
  }

  // 1. Try pattern with explicit currency or amount suffix/prefix:
  // e.g. "150 元", "150元", "150塊", "NT$150", "$150", "NT 150", "150 TWD", "150$"
  const explicitPatterns = [
    /(?:NT\$?|\$)\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /([0-9,]+(?:\.[0-9]+)?)\s*(?:元|塊|台幣|TWD|NTD|NT|\$)/i,
  ];

  for (const regex of explicitPatterns) {
    const m = cleanText.match(regex);
    if (m) {
      const rawNum = m[1].replace(/,/g, '');
      const val = parseFloat(rawNum);
      if (!isNaN(val) && val > 0) {
        return { amount: Math.round(val), matchedToken: m[0] };
      }
    }
  }

  // 2. Large numbers with "萬": e.g. "1.5萬", "2萬"
  const wanMatch = cleanText.match(/([0-9]+(?:\.[0-9]+)?)\s*萬/);
  if (wanMatch) {
    const val = parseFloat(wanMatch[1]) * 10000;
    if (!isNaN(val) && val > 0) {
      return { amount: Math.round(val), matchedToken: wanMatch[0] };
    }
  }

  // 3. Standalone numbers in text that look like prices
  // (avoid matching numbers followed by 年/月/日/號)
  const standaloneMatch = cleanText.match(/(?<!\d)(?:[1-9]\d{0,6})(?!\s*[年月號日\d])/);
  if (standaloneMatch) {
    const val = parseFloat(standaloneMatch[0]);
    if (!isNaN(val) && val > 0) {
      return { amount: Math.round(val), matchedToken: standaloneMatch[0] };
    }
  }

  return { amount: null, matchedToken: null };
}

/**
 * Infers category based on text content, available categories in user's profile, and income state
 * @param {string} text 
 * @param {string[]} userCategories 
 * @param {boolean} isIncome
 * @returns {string} matched category name
 */
function inferCategory(text, userCategories = [], isIncome = false) {
  const norm = text.toLowerCase();

  // If income, prioritize user category named "薪資" or "收入"
  if (isIncome) {
    const incomeCat = userCategories.find(c => /薪資|薪水|收入|投資/.test(c));
    if (incomeCat) return incomeCat;
  }

  // 1. Direct match with user's category names
  for (const cat of userCategories) {
    if (cat && norm.includes(cat.toLowerCase())) {
      return cat;
    }
  }

  // 2. Score match based on keyword dictionary
  const scores = {};
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[catName] = 0;
    for (const kw of keywords) {
      if (norm.includes(kw.toLowerCase())) {
        scores[catName] += kw.length >= 3 ? 3 : 2;
      }
    }
  }

  // Find best scoring category
  let bestCat = null;
  let maxScore = 0;
  for (const [catName, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCat = catName;
    }
  }

  // Map inferred standard category to user's available categories if possible
  if (bestCat && maxScore > 0) {
    const found = userCategories.find(c =>
      c.toLowerCase() === bestCat.toLowerCase() ||
      c.toLowerCase().includes(bestCat.toLowerCase()) ||
      bestCat.toLowerCase().includes(c.toLowerCase())
    );
    if (found) return found;
    return bestCat;
  }

  // Fallback to user's first category or '生活'
  return userCategories[0] || '生活';
}

/**
 * Matches credit cards from user's creditCards list
 * @param {string} text 
 * @param {Array<{ id: string, name: string, bank?: string }>} creditCards 
 * @returns {{ paymentMethod: 'cash' | 'credit', cardId: string | null, cardName: string | null, matchedToken: string | null }}
 */
function extractPaymentMethod(text, creditCards = []) {
  const norm = text.toLowerCase();

  // Check for cash keywords first
  if (norm.includes('現金') || norm.includes('付現') || norm.includes('掏現') || norm.includes('現金支付')) {
    const m = text.match(/(現金支付|掏現金|付現|現金)/);
    return {
      paymentMethod: 'cash',
      cardId: null,
      cardName: null,
      matchedToken: m ? m[0] : '現金',
    };
  }

  // Check for specific credit cards in user's saved list
  const sortedCards = [...creditCards].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

  for (const card of sortedCards) {
    if (!card.name) continue;
    const cardNameNorm = card.name.toLowerCase();

    // Check full name match (e.g. "刷聯邦賴點卡" or "聯邦賴點卡")
    const fullNameRegex = new RegExp(`(?:刷|用|使用|付)?\\s*${card.name}`, 'i');
    const fullMatch = text.match(fullNameRegex);
    if (fullMatch) {
      return {
        paymentMethod: 'credit',
        cardId: card.id,
        cardName: card.name,
        matchedToken: fullMatch[0],
      };
    }

    // Check simplified card name keywords (e.g. "賴點卡" in "聯邦賴點卡", "J卡" in "富邦J卡", "CUBE" in "國泰CUBE")
    const simplifiedNames = [
      cardNameNorm.replace(/(銀行|商業銀行|國際商業銀行)/g, ''),
      cardNameNorm.replace(/(聯邦|富邦|國泰世華|國泰|玉山|台新|中信|中國信託|永豐|渣打|星展|元大)/g, ''),
    ].filter(s => s && s.length >= 2);

    for (const s of simplifiedNames) {
      const subRegex = new RegExp(`(?:刷|用|使用|付)?\\s*${s}`, 'i');
      const subMatch = text.match(subRegex);
      if (subMatch) {
        return {
          paymentMethod: 'credit',
          cardId: card.id,
          cardName: card.name,
          matchedToken: subMatch[0],
        };
      }
    }
  }

  // Generic card indicators: "刷卡", "信用卡", "刷"
  const cardMatch = text.match(/(刷信用卡|刷卡|信用卡|刷)/);
  if (cardMatch) {
    const defaultCard = creditCards[0] || null;
    return {
      paymentMethod: 'credit',
      cardId: defaultCard ? defaultCard.id : null,
      cardName: defaultCard ? defaultCard.name : null,
      matchedToken: cardMatch[0],
    };
  }

  // Default to cash
  return {
    paymentMethod: 'cash',
    cardId: null,
    cardName: null,
    matchedToken: null,
  };
}

/**
 * Extracts and cleans the description from text by stripping out
 * parsed date, amount, payment method tokens, and punctuation.
 * Also standardizes time+food tokens like "中午吃牛肉麵" -> "午餐牛肉麵"
 */
function cleanDescription(rawText, { dateToken, amountToken, paymentToken }) {
  let cleaned = rawText;

  // Remove date token (e.g. "今天", "昨天", "9/19")
  if (dateToken) {
    cleaned = cleaned.replace(dateToken, ' ');
  }

  // Remove amount token (e.g. "150 元", "150元", "150")
  if (amountToken) {
    cleaned = cleaned.replace(amountToken, ' ');
  }

  // Remove payment token (e.g. "刷賴點卡", "刷J卡", "刷卡", "現金")
  if (paymentToken) {
    const escaped = paymentToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const paymentRegex = new RegExp(`(?:刷|用|使用|付)?\\s*${escaped}`, 'gi');
    cleaned = cleaned.replace(paymentRegex, ' ');
  }

  // Remove generic filler particles and punctuation
  cleaned = cleaned
    .replace(/(?:刷卡|信用卡|付現|現金|掏現)/gi, ' ')
    .replace(/[，,。、！!？?~～\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Smart time-of-day normalization:
  // "中午吃牛肉麵" -> "午餐牛肉麵"
  // "早上吃漢堡" -> "早餐漢堡"
  // "晚上吃牛排" -> "晚餐牛排"
  // "下午吃鬆餅" -> "下午茶鬆餅"
  cleaned = cleaned
    .replace(/^(?:中午|午間)(?:吃|喝)?/, '午餐')
    .replace(/^(?:早上|早晨|晨間)(?:吃|喝)?/, '早餐')
    .replace(/^(?:晚上|晚間)(?:吃|喝)?/, '晚餐')
    .replace(/^(?:下午)(?:吃|喝)?/, '下午茶')
    .replace(/^(?:半夜|宵夜時間)(?:吃|喝)?/, '宵夜')
    .replace(/^(?:吃|喝|買|花|付了|花了|買了)\s*/, '')
    .trim();

  return cleaned || '日常消費';
}

/**
 * Main natural language bookkeeping parser
 * @param {string} text 
 * @param {object} options
 * @param {string[]} options.categories
 * @param {Array} options.creditCards
 * @param {Date} [options.referenceDate]
 */
export function parseNaturalLanguageInput(text, { categories = [], creditCards = [], referenceDate = new Date() } = {}) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return null;
  }

  const trimmed = text.trim();

  // 1. Date
  const { dateStr, matchedToken: dateToken } = extractDate(trimmed, referenceDate);

  // 2. Amount (pass dateToken to avoid matching numbers in date)
  const { amount, matchedToken: amountToken } = extractAmount(trimmed, dateToken);

  // 3. Type (Income vs Expense)
  const isIncome = INCOME_KEYWORDS.some(kw => trimmed.toLowerCase().includes(kw));
  const type = isIncome ? 'income' : 'expense';

  // 4. Category
  const category = inferCategory(trimmed, categories, isIncome);

  // 5. Payment Method & Credit Card
  const { paymentMethod, cardId, cardName, matchedToken: paymentToken } = extractPaymentMethod(trimmed, creditCards);

  // 6. Clean Description / Note
  const description = cleanDescription(trimmed, { dateToken, amountToken, paymentToken });

  return {
    success: Boolean(amount !== null && amount > 0),
    rawText: trimmed,
    date: dateStr,
    type,
    category,
    amount: amount || 0,
    paymentMethod,
    cardId,
    cardName,
    description,
  };
}
