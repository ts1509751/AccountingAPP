import { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryIcon } from '../utils/categories';
import { Trash2, Edit2 } from 'lucide-react';

const formatMoney = (n) =>
  new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(n);

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
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

export default function TransactionList({ onEdit }) {
  const { filteredTransactions, deleteTransaction } = useExpense();
  const grouped = groupByDate(filteredTransactions);

  if (filteredTransactions.length === 0) {
    return (
      <div className="empty-tx">
        <div style={{ fontSize: '3rem' }}>📭</div>
        <p>這個月還沒有任何紀錄</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>點擊右下角的 + 開始記帳吧！</p>
      </div>
    );
  }

  return (
    <div className="tx-section">
      {grouped.map(([date, txs]) => (
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
      ))}
    </div>
  );
}
