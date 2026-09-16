// Comprehensive Taiwan Stocks, ETFs, and major US Stocks database for auto-identification
export const STOCK_DATABASE = [
  // ── 台灣指標龍頭與熱門股票 ──
  { code: '2330', name: '台積電', type: 'stock' },
  { code: '2317', name: '鴻海', type: 'stock' },
  { code: '2454', name: '聯發科', type: 'stock' },
  { code: '2308', name: '台達電', type: 'stock' },
  { code: '2382', name: '廣達', type: 'stock' },
  { code: '2881', name: '富邦金', type: 'stock' },
  { code: '2882', name: '國泰金', type: 'stock' },
  { code: '2891', name: '中信金', type: 'stock' },
  { code: '2886', name: '兆豐金', type: 'stock' },
  { code: '2884', name: '玉山金', type: 'stock' },
  { code: '2892', name: '第一金', type: 'stock' },
  { code: '2880', name: '華南金', type: 'stock' },
  { code: '2887', name: '台新金', type: 'stock' },
  { code: '2890', name: '永豐金', type: 'stock' },
  { code: '5880', name: '合庫金', type: 'stock' },
  { code: '2885', name: '元大金', type: 'stock' },
  { code: '2883', name: '開發金', type: 'stock' },
  { code: '2834', name: '臺企銀', type: 'stock' },
  { code: '5876', name: '上海商銀', type: 'stock' },
  { code: '5871', name: '中租-KY', type: 'stock' },

  // 電子、半導體、AI概念股
  { code: '3711', name: '日月光投控', type: 'stock' },
  { code: '2303', name: '聯電', type: 'stock' },
  { code: '3231', name: '緯創', type: 'stock' },
  { code: '6669', name: '緯穎', type: 'stock' },
  { code: '2356', name: '英業達', type: 'stock' },
  { code: '2357', name: '華碩', type: 'stock' },
  { code: '2379', name: '瑞昱', type: 'stock' },
  { code: '3034', name: '聯詠', type: 'stock' },
  { code: '2301', name: '光寶科', type: 'stock' },
  { code: '2395', name: '研華', type: 'stock' },
  { code: '3008', name: '大立光', type: 'stock' },
  { code: '2327', name: '國巨', type: 'stock' },
  { code: '3443', name: '創意', type: 'stock' },
  { code: '3661', name: '世芯-KY', type: 'stock' },
  { code: '2408', name: '南亞科', type: 'stock' },
  { code: '2344', name: '華邦電', type: 'stock' },
  { code: '2337', name: '旺宏', type: 'stock' },
  { code: '2409', name: '友達', type: 'stock' },
  { code: '3481', name: '群創', type: 'stock' },
  { code: '2474', name: '可成', type: 'stock' },
  { code: '4938', name: '和碩', type: 'stock' },
  { code: '2376', name: '技嘉', type: 'stock' },
  { code: '2377', name: '微星', type: 'stock' },
  { code: '3037', name: '欣興', type: 'stock' },
  { code: '8046', name: '南電', type: 'stock' },
  { code: '3189', name: '景碩', type: 'stock' },
  { code: '2049', name: '上銀', type: 'stock' },

  // 傳產、航運、塑化、重電
  { code: '2603', name: '長榮', type: 'stock' },
  { code: '2609', name: '陽明', type: 'stock' },
  { code: '2615', name: '萬海', type: 'stock' },
  { code: '2618', name: '長榮航', type: 'stock' },
  { code: '2610', name: '華航', type: 'stock' },
  { code: '1519', name: '華城', type: 'stock' },
  { code: '1513', name: '中興電', type: 'stock' },
  { code: '1504', name: '東元', type: 'stock' },
  { code: '1503', name: '士電', type: 'stock' },
  { code: '1609', name: '大亞', type: 'stock' },
  { code: '2002', name: '中鋼', type: 'stock' },
  { code: '1301', name: '台塑', type: 'stock' },
  { code: '1303', name: '南亞', type: 'stock' },
  { code: '1326', name: '台化', type: 'stock' },
  { code: '6505', name: '台塑化', type: 'stock' },
  { code: '1101', name: '台泥', type: 'stock' },
  { code: '1102', name: '亞泥', type: 'stock' },
  { code: '1216', name: '統一', type: 'stock' },
  { code: '2912', name: '統一超', type: 'stock' },
  { code: '2207', name: '和泰車', type: 'stock' },
  { code: '2412', name: '中華電', type: 'stock' },
  { code: '3045', name: '台灣大', type: 'stock' },
  { code: '4904', name: '遠傳', type: 'stock' },
  { code: '9904', name: '寶成', type: 'stock' },
  { code: '9910', name: '豐泰', type: 'stock' },
  { code: '8454', name: '富邦媒', type: 'stock' },

  // ── 熱門台灣 ETF ──
  { code: '0050', name: '元大台灣50', type: 'etf' },
  { code: '0056', name: '元大高股息', type: 'etf' },
  { code: '00878', name: '國泰永續高股息', type: 'etf' },
  { code: '00919', name: '群益台灣精選高息', type: 'etf' },
  { code: '00929', name: '復華台灣科技優息', type: 'etf' },
  { code: '00940', name: '元大台灣價值高息', type: 'etf' },
  { code: '006208', name: '富邦台50', type: 'etf' },
  { code: '00713', name: '元大台灣高息低波', type: 'etf' },
  { code: '00692', name: '富邦公司治理', type: 'etf' },
  { code: '00881', name: '國泰台灣5G+', type: 'etf' },
  { code: '00757', name: '統一FANG+', type: 'etf' },
  { code: '00939', name: '統一台灣高息動能', type: 'etf' },
  { code: '00935', name: '野村臺灣新科技50', type: 'etf' },
  { code: '00900', name: '富邦特選高股息30', type: 'etf' },
  { code: '00679B', name: '元大美債20年', type: 'etf' },
  { code: '00687B', name: '國泰20年美債', type: 'etf' },
  { code: '00937B', name: '群益ESG投等債20+', type: 'etf' },
  { code: '00720B', name: '元大投資級公司債', type: 'etf' },
  { code: '00933B', name: '國泰10Y+金融債', type: 'etf' },
  { code: '00772B', name: '中信高評級公司債', type: 'etf' },
  { code: '00646', name: '元大S&P500', type: 'etf' },
  { code: '00662', name: '富邦NASDAQ', type: 'etf' },
  { code: '00830', name: '國泰費城半導體', type: 'etf' },
  { code: '00631L', name: '元大台灣50正2', type: 'etf' },
  { code: '00632R', name: '元大台灣50反1', type: 'etf' },

  // ── 美股指標股票與 ETF ──
  { code: 'NVDA', name: '輝達 NVIDIA', type: 'stock' },
  { code: 'AAPL', name: '蘋果 Apple', type: 'stock' },
  { code: 'TSLA', name: '特斯拉 Tesla', type: 'stock' },
  { code: 'MSFT', name: '微軟 Microsoft', type: 'stock' },
  { code: 'GOOGL', name: 'Alphabet Google', type: 'stock' },
  { code: 'AMZN', name: '亞馬遜 Amazon', type: 'stock' },
  { code: 'META', name: 'Meta 臉書', type: 'stock' },
  { code: 'AMD', name: '超微 AMD', type: 'stock' },
  { code: 'TSM', name: '台積電 ADR', type: 'stock' },
  { code: 'INTC', name: '英特爾 Intel', type: 'stock' },
  { code: 'AVGO', name: '博通 Broadcom', type: 'stock' },
  { code: 'ARM', name: '安謀 ARM', type: 'stock' },
  { code: 'SMCI', name: '美超微 Supermicro', type: 'stock' },
  { code: 'COIN', name: 'Coinbase', type: 'stock' },
  { code: 'PLTR', name: 'Palantir', type: 'stock' },
  { code: 'SPY', name: 'SPDR 標普500 ETF', type: 'etf' },
  { code: 'QQQ', name: 'Invesco 那斯達克100 ETF', type: 'etf' },
  { code: 'VOO', name: 'Vanguard 標普500 ETF', type: 'etf' },
  { code: 'VT', name: 'Vanguard 全球股票 ETF', type: 'etf' },
  { code: 'VTI', name: 'Vanguard 整體股市 ETF', type: 'etf' },
  { code: 'SOXX', name: 'iShares 半導體 ETF', type: 'etf' },
  { code: 'SMH', name: 'VanEck 半導體 ETF', type: 'etf' },
  { code: 'TQQQ', name: 'ProShares 那斯達克三倍做多', type: 'etf' },
  { code: 'SOXL', name: 'Direxion 半導體三倍做多', type: 'etf' },
];

/**
 * Normalize input: converts full-width numbers and characters (common on mobile keyboards) to half-width
 */
export function normalizeQuery(str) {
  if (!str) return '';
  return String(str)
    // Full-width numbers ０-９ (0xFF10 - 0xFF19) -> 0-9 (0x30 - 0x39)
    .replace(/[\uFF10-\uFF19]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    // Full-width uppercase letters Ａ-Ｚ
    .replace(/[\uFF21-\uFF3A]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    // Full-width lowercase letters ａ-ｚ
    .replace(/[\uFF41-\uFF5A]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    // Remove invisible spaces / non-breaking spaces
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toUpperCase();
}

/**
 * Find exact stock match by code or prefix
 */
export function findStockByCode(code) {
  if (!code) return null;
  const clean = normalizeQuery(code);
  if (!clean) return null;

  // 1. Direct exact code match
  const exact = STOCK_DATABASE.find(s => s.code.toUpperCase() === clean);
  if (exact) return exact;

  // 2. Extract leading alphanumeric token (e.g. user typed "2330 " or "2330-")
  const leadingToken = clean.split(/[\s,\-_]+/)[0];
  if (leadingToken && leadingToken.length >= 3) {
    const tokenMatch = STOCK_DATABASE.find(s => s.code.toUpperCase() === leadingToken);
    if (tokenMatch) return tokenMatch;
  }

  // 3. Match by name if exact name matches
  const nameMatch = STOCK_DATABASE.find(s => s.name.toUpperCase() === clean);
  if (nameMatch) return nameMatch;

  return null;
}

/**
 * Search stocks by code or name
 */
export function searchStocks(query, maxResults = 8) {
  if (!query) return [];
  const q = normalizeQuery(query);
  if (q.length === 0) return [];

  const results = [];
  for (const item of STOCK_DATABASE) {
    const normCode = item.code.toUpperCase();
    const normName = item.name.toUpperCase();
    const codeMatch = normCode.includes(q);
    const nameMatch = normName.includes(q);
    if (codeMatch || nameMatch) {
      results.push(item);
      if (results.length >= maxResults) break;
    }
  }
  return results;
}

