import * as XLSX from 'xlsx';

/**
 * Exports expense tracking data and optional investment history into a formatted Excel (.xlsx) workbook.
 *
 * @param {Object} options
 * @param {Array} options.transactions - List of transactions to export
 * @param {string} options.rangeLabel - Label for the range (e.g., '2026年09月' or '2026年度' or '全部歷史')
 * @param {Array} [options.investments] - Optional list of investment transactions
 * @param {boolean} [options.includeInvestments] - Whether to include investment records
 */
export function exportExpenseToExcel({
  transactions = [],
  rangeLabel = '記帳資料',
  investments = [],
  includeInvestments = false,
}) {
  const wb = XLSX.utils.book_new();

  // ──────────────────────────────────────────────────────────
  // Sheet 1: 記帳收支明細
  // ──────────────────────────────────────────────────────────
  let totalExpense = 0;
  let totalIncome = 0;

  const sortedTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const txRows = sortedTx.map(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'expense') totalExpense += amt;
    else totalIncome += amt;

    const payMethod = t.paymentMethod === 'credit' ? '信用卡' : '現金';

    return [
      t.date,
      t.type === 'expense' ? '支出' : '收入',
      t.category || '未分類',
      payMethod,
      t.description || '',
      amt,
    ];
  });

  const txData = [
    ['日期', '收支類型', '類別', '付款方式', '說明 / 備註', '金額 (NT$)'],
    ...txRows,
    [],
    ['', '', '', '', '總支出合計', totalExpense],
    ['', '', '', '', '總收入合計', totalIncome],
    ['', '', '', '', '期間淨結餘', totalIncome - totalExpense],
  ];

  const wsTx = XLSX.utils.aoa_to_sheet(txData);
  wsTx['!cols'] = [
    { wch: 14 }, // 日期
    { wch: 10 }, // 類型
    { wch: 14 }, // 分類
    { wch: 12 }, // 付款方式
    { wch: 30 }, // 備註
    { wch: 14 }, // 金額
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, '記帳收支明細');


  // ──────────────────────────────────────────────────────────
  // Sheet 2: 收支月報彙整
  // ──────────────────────────────────────────────────────────
  const monthMap = {};
  transactions.forEach(t => {
    const m = (t.date || '').substring(0, 7);
    if (!m) return;
    if (!monthMap[m]) monthMap[m] = { month: m, income: 0, expense: 0, count: 0 };
    const amt = Number(t.amount) || 0;
    if (t.type === 'expense') monthMap[m].expense += amt;
    else monthMap[m].income += amt;
    monthMap[m].count++;
  });

  const sortedMonths = Object.keys(monthMap).sort((a, b) => b.localeCompare(a));
  const monthRows = sortedMonths.map(m => {
    const item = monthMap[m];
    return [
      item.month,
      item.income,
      item.expense,
      item.income - item.expense,
      item.count,
    ];
  });

  const monthData = [
    ['月份 (YYYY-MM)', '總收入 (NT$)', '總支出 (NT$)', '當月結餘 (NT$)', '記帳筆數'],
    ...monthRows,
    [],
    ['合計', totalIncome, totalExpense, totalIncome - totalExpense, transactions.length],
  ];

  const wsMonth = XLSX.utils.aoa_to_sheet(monthData);
  wsMonth['!cols'] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMonth, '收支月報彙整');

  // ──────────────────────────────────────────────────────────
  // Sheet 3: 分類支出統計
  // ──────────────────────────────────────────────────────────
  const catMap = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const cat = t.category || '未分類';
      if (!catMap[cat]) catMap[cat] = { category: cat, total: 0, count: 0 };
      catMap[cat].total += Number(t.amount) || 0;
      catMap[cat].count++;
    });

  const sortedCategories = Object.values(catMap).sort((a, b) => b.total - a.total);
  const catRows = sortedCategories.map(c => [
    c.category,
    c.total,
    totalExpense > 0 ? Number(((c.total / totalExpense) * 100).toFixed(1)) + '%' : '0%',
    c.count,
  ]);

  const catData = [
    ['支出分類', '支出總額 (NT$)', '花費佔比', '消費筆數'],
    ...catRows,
    [],
    ['總計', totalExpense, '100%', transactions.filter(t => t.type === 'expense').length],
  ];

  const wsCat = XLSX.utils.aoa_to_sheet(catData);
  wsCat['!cols'] = [
    { wch: 16 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCat, '分類支出統計');

  // ──────────────────────────────────────────────────────────
  // (選填) Sheet 4: 投資股票明細
  // ──────────────────────────────────────────────────────────
  if (includeInvestments && investments && investments.length > 0) {
    const sortedInv = [...investments].sort((a, b) => new Date(b.date) - new Date(a.date));
    const invRows = sortedInv.map(t => [
      t.date,
      t.symbol,
      t.assetType === 'etf' ? 'ETF' : t.assetType === 'fund' ? '基金' : '股票',
      t.action === 'buy' ? '買進' : '賣出',
      Number(t.price) || 0,
      Number(t.shares) || 0,
      Number(t.fee) || 0,
      Number(t.tax) || 0,
      Number(t.totalAmount) || 0,
      t.notes || '',
    ]);

    const invData = [
      ['交易日期', '標的代號/名稱', '資產類型', '買賣操作', '成交單價', '成交股數', '手續費', '證交稅', '總結算金額 (NT$)', '備註'],
      ...invRows,
    ];

    const wsInv = XLSX.utils.aoa_to_sheet(invData);
    wsInv['!cols'] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 16 },
      { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, wsInv, '投資理財明細');
  }

  // ──────────────────────────────────────────────────────────
  // Write & Download
  // ──────────────────────────────────────────────────────────
  const now = new Date();
  const dateSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const cleanRange = rangeLabel.replace(/[\/\\:*?"<>|]/g, '_');
  const fileName = `我的記帳本_${cleanRange}_${dateSuffix}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
