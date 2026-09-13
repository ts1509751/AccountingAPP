import { useExpense } from '../context/ExpenseContext';
import { Trash2, Edit2 } from 'lucide-react';

export default function TransactionList() {
  const { filteredTransactions, deleteTransaction, setEditingTransaction } = useExpense();

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(amount);
  };

  if (filteredTransactions.length === 0) {
    return (
      <div className="glass list-container empty-state">
        <p>此區間還沒有任何記帳紀錄哦！</p>
      </div>
    );
  }

  return (
    <div className="glass list-container">
      <h3>紀錄明細</h3>
      <div className="transaction-list">
        {filteredTransactions.map((t) => (
          <div key={t.id} className="transaction-item">
            <div className="t-info">
              <div className="t-top-row">
                <span className="t-category">{t.category}</span>
                <span className="t-date">{t.date}</span>
              </div>
              {t.description && <div className="t-desc">{t.description}</div>}
            </div>
            <div className="t-actions">
              <div className={`t-amount ${t.type === 'expense' ? 'text-danger' : 'text-success'}`}>
                {t.type === 'expense' ? '-' : '+'}{formatMoney(t.amount)}
              </div>
              <button className="btn-icon" onClick={() => setEditingTransaction(t)} aria-label="編輯">
                <Edit2 size={18} />
              </button>
              <button className="btn-icon" onClick={() => deleteTransaction(t.id)} aria-label="刪除">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
