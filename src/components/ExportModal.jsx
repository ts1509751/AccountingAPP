import { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { useInvestment } from '../context/InvestmentContext';
import { exportExpenseToExcel } from '../utils/exportExcel';
import { X, FileSpreadsheet, Download, Check, Calendar, Layers } from 'lucide-react';

const formatMoney = (n) =>
  new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(n);

const formatRaw = (n) =>
  new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(n);

export default function ExportModal({ isOpen, onClose }) {
  const { transactions, filteredTransactions, yearlyTransactions, viewYear, viewMonth } = useExpense();
  const { investments } = useInvestment();

  const [range, setRange] = useState('month'); // 'month' | 'year' | 'all'
  const [includeInvestments, setIncludeInvestments] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  // Month label
  const monthStr = `${viewYear}年${String(viewMonth + 1).padStart(2, '0')}月`;
  const yearStr = `${viewYear}年度`;

  // Compute selected data based on range
  const { targetTxs, rangeLabel } = useMemo(() => {
    if (range === 'month') {
      return { targetTxs: filteredTransactions || [], rangeLabel: monthStr };
    }
    if (range === 'year') {
      return { targetTxs: yearlyTransactions || [], rangeLabel: yearStr };
    }
    return { targetTxs: transactions || [], rangeLabel: '全部歷史紀錄' };
  }, [range, filteredTransactions, yearlyTransactions, transactions, monthStr, yearStr]);

  // Preview stats
  const previewStats = useMemo(() => {
    const totalExp = targetTxs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalInc = targetTxs.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    return {
      count: targetTxs.length,
      expense: totalExp,
      income: totalInc,
      balance: totalInc - totalExp,
    };
  }, [targetTxs]);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    try {
      exportExpenseToExcel({
        transactions: targetTxs,
        rangeLabel,
        investments: investments || [],
        includeInvestments,
      });
      setExportedSuccess(true);
      setTimeout(() => {
        setExportedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('匯出 Excel 失敗:', err);
      alert('匯出 Excel 發生錯誤，請稍後再試');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content export-modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="export-modal-icon-badge">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem' }}>匯出 Excel 彙整報表</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                產生標準 .xlsx 試算表，包含明細、月報與分類統計
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* Section 1: Range selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="modal-label" style={{ marginBottom: '0.5rem' }}>1. 選擇匯出時間範圍</label>
            <div className="export-range-grid">
              <button
                type="button"
                className={`export-range-card ${range === 'month' ? 'active' : ''}`}
                onClick={() => setRange('month')}
              >
                <div className="range-card-title">本月紀錄</div>
                <div className="range-card-sub">{monthStr}</div>
                <div className="range-card-count">{(filteredTransactions || []).length} 筆</div>
              </button>

              <button
                type="button"
                className={`export-range-card ${range === 'year' ? 'active' : ''}`}
                onClick={() => setRange('year')}
              >
                <div className="range-card-title">本年度紀錄</div>
                <div className="range-card-sub">{yearStr}</div>
                <div className="range-card-count">{(yearlyTransactions || []).length} 筆</div>
              </button>

              <button
                type="button"
                className={`export-range-card ${range === 'all' ? 'active' : ''}`}
                onClick={() => setRange('all')}
              >
                <div className="range-card-title">全部歷史</div>
                <div className="range-card-sub">完整備份</div>
                <div className="range-card-count">{(transactions || []).length} 筆</div>
              </button>
            </div>
          </div>

          {/* Section 2: Data summary preview */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="modal-label" style={{ marginBottom: '0.5rem' }}>2. 匯出內容預覽摘要</label>
            <div className="export-preview-card">
              <div className="export-preview-row">
                <span className="prev-label">匯出範圍</span>
                <span className="prev-val font-semibold">{rangeLabel}</span>
              </div>
              <div className="export-preview-row">
                <span className="prev-label">收支筆數</span>
                <span className="prev-val">{formatRaw(previewStats.count)} 筆</span>
              </div>
              <div className="export-preview-row">
                <span className="prev-label">總支出</span>
                <span className="prev-val text-danger">-{formatMoney(previewStats.expense)}</span>
              </div>
              <div className="export-preview-row">
                <span className="prev-label">總收入</span>
                <span className="prev-val text-success">+{formatMoney(previewStats.income)}</span>
              </div>
              <div className="export-preview-row" style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.4rem' }}>
                <span className="prev-label">期間結餘</span>
                <span className={`prev-val font-bold ${previewStats.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                  {previewStats.balance >= 0 ? '+' : ''}{formatMoney(previewStats.balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Included sheets & options */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="modal-label" style={{ marginBottom: '0.5rem' }}>3. 試算表包含之工作表 (Sheets)</label>
            <div className="export-sheets-list">
              <div className="export-sheet-item checked">
                <Check size={14} className="check-icon" />
                <span>工作表 1：【記帳收支明細】(日期/類型/分類/說明/金額)</span>
              </div>
              <div className="export-sheet-item checked">
                <Check size={14} className="check-icon" />
                <span>工作表 2：【收支月報彙整】(月份/總收入/總支出/當月結餘)</span>
              </div>
              <div className="export-sheet-item checked">
                <Check size={14} className="check-icon" />
                <span>工作表 3：【分類支出統計】(分類名稱/支出總額/花費佔比)</span>
              </div>

              {/* Optional investment checkbox if user has investment data */}
              {investments && investments.length > 0 && (
                <label className="export-sheet-item clickable" style={{ marginTop: '0.4rem' }}>
                  <input
                    type="checkbox"
                    checked={includeInvestments}
                    onChange={e => setIncludeInvestments(e.target.checked)}
                    style={{ accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
                  />
                  <span>工作表 4：一併匯出【投資股票明細】({investments.length} 筆交易)</span>
                </label>
              )}
            </div>
          </div>

          {/* Submit download button */}
          <button
            type="button"
            className="export-download-btn"
            onClick={handleExport}
            disabled={isExporting || previewStats.count === 0}
          >
            {exportedSuccess ? (
              <>
                <Check size={18} />
                <span>匯出完成！正在下載...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>一鍵下載 Excel 檔案 (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
