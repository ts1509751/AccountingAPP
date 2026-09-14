import { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryIcon } from '../utils/categories';

export default function EditModal({ transaction, onClose }) {
  const { updateTransaction, categories } = useExpense();
  const [form, setForm] = useState({ ...transaction });

  useEffect(() => {
    setForm({ ...transaction });
  }, [transaction]);

  const handleSave = async () => {
    if (!form.amount || !form.category || !form.date) return;
    await updateTransaction(transaction.id, {
      type: form.type,
      amount: Number(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="panel-handle" />
        <div className="modal-title">編輯紀錄</div>

        {/* Type */}
        <div className="modal-field">
          <label className="modal-label">類型</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              className={`type-btn ${form.type === 'expense' ? 'active-expense' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
            >💸 支出</button>
            <button
              className={`type-btn ${form.type === 'income' ? 'active-income' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'income' }))}
            >💵 收入</button>
          </div>
        </div>

        {/* Category pills */}
        <div className="modal-field">
          <label className="modal-label">分類</label>
          <div className="category-scroll">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-pill ${form.category === cat ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, category: cat }))}
              >
                <span className="cat-icon">{getCategoryIcon(cat)}</span>
                <span className="cat-name">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="modal-field">
          <label className="modal-label">金額</label>
          <input
            className="modal-input"
            type="number"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            inputMode="decimal"
          />
        </div>

        {/* Date */}
        <div className="modal-field">
          <label className="modal-label">日期</label>
          <input
            className="modal-input"
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>

        {/* Description */}
        <div className="modal-field">
          <label className="modal-label">備註（選填）</label>
          <input
            className="modal-input"
            type="text"
            value={form.description || ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="例如：午餐、電影票..."
          />
        </div>

        <div className="modal-btn-row">
          <button className="modal-btn cancel" onClick={onClose}>取消</button>
          <button className="modal-btn save" onClick={handleSave}>儲存</button>
        </div>
      </div>
    </div>
  );
}
