import { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryIcon } from '../utils/categories';
import { Trash2, Edit2, Search, X, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import ExportModal from './ExportModal';

const formatMoney = (n) =>
  new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(n);

const formatRaw = (n) =>
  new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(n);

// Normalize text for search: converts full-width digits and letters, lowercases, trims
function normalizeQuery(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\uFF10-\uFF19]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[\uFF21-\uFF3A]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[\uFF41-\uFF5A]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .trim()
    .toLowerCase();
}

// Group transactions by date
function groupByDate(txs) {
  const map = {};
  txs.forEach(tx => {
    if (!map[tx.date]) map[tx.date] = [];
    map[tx.date].push(tx);
  });
  return Object.entries(map).sort((a, b) => new Date(b[0]) - new Date(a[0]));
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return '今天';
  if (d.toDateString() === yesterday.toDateString()) return '昨天';
  return `${d.getFullYear() !== today.getFullYear() ? d.getFullYear() + '年' : ''}${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function TransactionList({ onEdit }) {
  const { transactions, filteredTransactions, deleteTransaction, categoryIcons, creditCards } = useExpense();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('month'); // 'month' | 'all'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'expense' | 'income'
  const [showExportModal, setShowExportModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const normalizedQ = normalizeQuery(searchQuery);
  const isSearching = normalizedQ.length > 0;

  // Search filter matcher (supports description, category, amount, date, paymentMethod, and cardName)
  const matchTx = (tx) => {
    if (!normalizedQ) return true;
    const desc = normalizeQuery(tx.description || '');
    const cat = normalizeQuery(tx.category || '');
    const amtStr = normalizeQuery(tx.amount || '');
    const dateStr = normalizeQuery(tx.date || '');
    const cardObj = creditCards.find(c => c.id === tx.cardId);
    const cardStr = normalizeQuery(tx.cardName || cardObj?.name || '');
    const payStr = (tx.paymentMethod === 'credit') ? `信用卡 刷卡 credit card ${cardStr}` : '現金 cash';
    return desc.includes(normalizedQ) || cat.includes(normalizedQ) || amtStr.includes(normalizedQ) || dateStr.includes(normalizedQ) || payStr.includes(normalizedQ);
  };

  // Compute matches for both scopes
  const monthMatches = useMemo(
    () => (filteredTransactions || []).filter(matchTx),
    [filteredTransactions, normalizedQ]
  );

  const allMatches = useMemo(
    () => (transactions || []).filter(matchTx),
    [transactions, normalizedQ]
  );

  // Base list depending on search query and scope
  const baseList = useMemo(() => {
    if (isSearching) {
      return searchScope === 'all' ? allMatches : monthMatches;
    }
    return filteredTransactions || [];
  }, [isSearching, searchScope, allMatches, monthMatches, filteredTransactions]);

  // Counts for type tabs (全部 / 支出 / 收入)
  const typeCounts = useMemo(() => {
    const all = baseList.length;
    const expense = baseList.filter(t => t.type === 'expense').length;
    const income = baseList.filter(t => t.type === 'income').length;
    return { all, expense, income };
  }, [baseList]);

  // Active display list filtered by type
  const displayList = useMemo(() => {
    if (typeFilter === 'all') return baseList;
    return baseList.filter(t => t.type === typeFilter);
  }, [baseList, typeFilter]);

  const grouped = useMemo(() => groupByDate(displayList), [displayList]);

  // Aggregate stats when searching
  const searchStats = useMemo(() => {
    if (!isSearching) return null;
    const expenseSum = displayList.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const incomeSum = displayList.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    return {
      count: displayList.length,
      expenseSum,
      incomeSum,
    };
  }, [displayList, isSearching]);

  return (
    <div className="tx-section">
      {/* ── Search Bar & Export Button ── */}
      <div className="list-search-container">
        <div className="list-search-header-row">
          <div className="list-search-input-wrapper">
            <Search size={16} className="list-search-icon" />
            <input
              type="text"
              className="list-search-input"
              placeholder="搜尋金額或名稱 (例如: 150 或 早餐)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="list-search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="清除搜尋"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="export-excel-action-btn"
            onClick={() => setShowExportModal(true)}
            title="匯出 Excel 彙整報表"
          >
            <FileSpreadsheet size={16} />
            <span className="export-excel-btn-text">匯出 Excel</span>
          </button>
        </div>

        {/* Search scope switch & stats */}
        {isSearching && (
          <div className="list-search-scope-bar">
            <div className="scope-pills-group">
              <button
                type="button"
                className={`scope-pill-btn ${searchScope === 'month' ? 'active' : ''}`}
                onClick={() => setSearchScope('month')}
              >
                本月 ({monthMatches.length})
              </button>
              <button
                type="button"
                className={`scope-pill-btn ${searchScope === 'all' ? 'active' : ''}`}
                onClick={() => setSearchScope('all')}
              >
                全部歷史 ({allMatches.length})
              </button>
            </div>

            {searchStats && searchStats.count > 0 && (
              <div className="search-stats-badge">
                找到 {searchStats.count} 筆 · 支出 NT$ {formatRaw(searchStats.expenseSum)}
                {searchStats.incomeSum > 0 ? ` · 收入 NT$ ${formatRaw(searchStats.incomeSum)}` : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Type Filter Tabs (全部 / 支出 / 收入 分開選擇) ── */}
      <div className="tx-type-filter-bar">
        <button
          type="button"
          className={`tx-type-tab ${typeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setTypeFilter('all')}
        >
          全部 ({typeCounts.all})
        </button>
        <button
          type="button"
          className={`tx-type-tab expense ${typeFilter === 'expense' ? 'active' : ''}`}
          onClick={() => setTypeFilter('expense')}
        >
          💸 支出 ({typeCounts.expense})
        </button>
        <button
          type="button"
          className={`tx-type-tab income ${typeFilter === 'income' ? 'active' : ''}`}
          onClick={() => setTypeFilter('income')}
        >
          💵 收入 ({typeCounts.income})
        </button>
      </div>

      {/* ── Empty states ── */}
      {displayList.length === 0 ? (
        <div className="empty-tx" style={{ padding: '3rem 1rem' }}>
          {isSearching ? (
            <>
              <div style={{ fontSize: '2.8rem' }}>🔍</div>
              <p style={{ fontWeight: 600, marginTop: '0.6rem' }}>找不到符合「{searchQuery}」的消費紀錄</p>
              {searchScope === 'month' && allMatches.length > 0 ? (
                <button
                  type="button"
                  className="scope-switch-prompt-btn"
                  onClick={() => setSearchScope('all')}
                >
                  歷史紀錄中找到 {allMatches.length} 筆，點此切換至「全部歷史」查看
                </button>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  請檢查輸入之金額或關鍵字是否有誤
                </p>
              )}
            </>
          ) : baseList.length > 0 ? (
            <>
              <div style={{ fontSize: '2.8rem' }}>📑</div>
              <p style={{ fontWeight: 600, marginTop: '0.6rem' }}>
                目前沒有{typeFilter === 'expense' ? '「支出」' : '「收入」'}紀錄
              </p>
              <button
                type="button"
                className="scope-switch-prompt-btn"
                style={{ marginTop: '0.8rem' }}
                onClick={() => setTypeFilter('all')}
              >
                查看全部 ({baseList.length} 筆)
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '3rem' }}>📭</div>
              <p>這個月還沒有任何紀錄</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                點擊右下角或頂部的「+ 記一筆」開始記帳吧！
              </p>
            </>
          )}
        </div>
      ) : (
        /* ── Transactions List ── */
        grouped.map(([date, txs]) => (
          <div key={date}>
            <div className="tx-section-title">{formatDateLabel(date)}</div>
            <div className="tx-list">
              {txs.map(tx => (
                <div key={tx.id} className="tx-item">
                  <div className="tx-icon">{getCategoryIcon(tx.category, categoryIcons)}</div>
                  <div className="tx-info">
                    {/* 左側：金額與付款方式標籤 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span className={`tx-amount-left ${tx.type}`}>
                        {tx.type === 'expense' ? '-' : '+'}{formatMoney(tx.amount)}
                      </span>
                      <span className={`tx-payment-tag ${tx.paymentMethod === 'credit' ? 'credit' : 'cash'}`}>
                        {tx.paymentMethod === 'credit'
                          ? (tx.cardName || creditCards.find(c => c.id === tx.cardId)?.name ? `💳 ${tx.cardName || creditCards.find(c => c.id === tx.cardId)?.name}` : '💳 信用卡')
                          : '💵 現金'}
                      </span>
                    </div>
                    <div className="tx-meta">{tx.category} · {tx.date}</div>
                  </div>
                  {/* 右側：備註內容與操作按鈕 */}
                  <div className="tx-right">
                    <div className="tx-desc-badge" title={tx.description || tx.category}>
                      {tx.description ? (
                        <span className="tx-desc-text">{tx.description}</span>
                      ) : (
                        <span className="tx-desc-placeholder">{tx.category}</span>
                      )}
                    </div>
                    <div className="tx-action-btns">
                      <button className="tx-mini-btn edit" onClick={() => onEdit(tx)} aria-label="編輯">
                        <Edit2 size={13} />
                      </button>
                      <button className="tx-mini-btn" onClick={() => setItemToDelete(tx)} aria-label="刪除">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {itemToDelete && (
        <div className="modal-overlay" onClick={() => setItemToDelete(null)}>
          <div className="confirm-delete-sheet" onClick={e => e.stopPropagation()}>
            <div className="confirm-delete-icon">
              <AlertTriangle size={26} />
            </div>
            <h3 className="confirm-delete-title">確定要刪除這筆紀錄？</h3>
            <p className="confirm-delete-desc">
              刪除「<strong>{itemToDelete.category}{itemToDelete.description ? ` - ${itemToDelete.description}` : ''}</strong>」
              <br />
              <span style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.4rem', display: 'inline-block', color: itemToDelete.type === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                {itemToDelete.type === 'expense' ? '-' : '+'}NT$ {formatMoney(itemToDelete.amount)}
              </span>
            </p>
            <div className="confirm-delete-actions">
              <button
                type="button"
                className="confirm-btn cancel"
                onClick={() => setItemToDelete(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="confirm-btn delete"
                onClick={async () => {
                  await deleteTransaction(itemToDelete.id);
                  setItemToDelete(null);
                }}
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Excel Export Modal ── */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}


