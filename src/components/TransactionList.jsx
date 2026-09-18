import { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryIcon } from '../utils/categories';
import { Trash2, Edit2, Search, X } from 'lucide-react';

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
  const { transactions, filteredTransactions, deleteTransaction } = useExpense();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('month'); // 'month' | 'all'

  const normalizedQ = normalizeQuery(searchQuery);
  const isSearching = normalizedQ.length > 0;

  // Search filter matcher
  const matchTx = (tx) => {
    if (!normalizedQ) return true;
    const desc = normalizeQuery(tx.description || '');
    const cat = normalizeQuery(tx.category || '');
    const amtStr = normalizeQuery(tx.amount || '');
    const dateStr = normalizeQuery(tx.date || '');
    return desc.includes(normalizedQ) || cat.includes(normalizedQ) || amtStr.includes(normalizedQ) || dateStr.includes(normalizedQ);
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

  // Active display list
  const displayList = isSearching
    ? (searchScope === 'all' ? allMatches : monthMatches)
    : (filteredTransactions || []);

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
      {/* ── Search Bar ── */}
      <div className="list-search-container">
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
                  <div className="tx-icon">{getCategoryIcon(tx.category)}</div>
                  <div className="tx-info">
                    <div className="tx-name">{tx.description || tx.category}</div>
                    <div className="tx-meta">{tx.category} · {tx.date}</div>
                  </div>
                  <div className="tx-right">
                    <div className={`tx-amount ${tx.type}`}>
                      {tx.type === 'expense' ? '-' : '+'}{formatMoney(tx.amount)}
                    </div>
                    <div className="tx-action-btns">
                      <button className="tx-mini-btn edit" onClick={() => onEdit(tx)} aria-label="編輯">
                        <Edit2 size={13} />
                      </button>
                      <button className="tx-mini-btn" onClick={() => deleteTransaction(tx.id)} aria-label="刪除">
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
    </div>
  );
}

