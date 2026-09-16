import { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { X, DollarSign } from 'lucide-react';

export default function BudgetModal({ onClose }) {
  const { monthStr, viewYear, viewMonth, currentBudget, setBudget } = useExpense();
  const [amount, setAmount] = useState(currentBudget > 0 ? String(currentBudget) : '');

  const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  const handleSave = async (e) => {
    e.preventDefault();
    const val = Number(amount) || 0;
    await setBudget(monthStr, val);
    onClose();
  };

  const handleClear = async () => {
    await setBudget(monthStr, 0);
    onClose();
  };

  const addPreset = (increment) => {
    const current = Number(amount) || 0;
    setAmount(String(current + increment));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet budget-modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="panel-handle" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              設定每月預算
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
              目標月份：{viewYear} 年 {MONTH_NAMES[viewMonth]}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-field">
            <label className="modal-label">預算金額 (TWD)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>NT$</span>
              <input
                type="number"
                className="modal-input"
                style={{ paddingLeft: '3.2rem', fontSize: '1.15rem', fontWeight: 700 }}
                placeholder="例如：20000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
                min="0"
                step="100"
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <button type="button" className="cat-pill" style={{ padding: '0.4rem 0.8rem' }} onClick={() => addPreset(5000)}>
              + $5,000
            </button>
            <button type="button" className="cat-pill" style={{ padding: '0.4rem 0.8rem' }} onClick={() => addPreset(10000)}>
              + $10,000
            </button>
            <button type="button" className="cat-pill" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setAmount('15000')}>
              $15,000
            </button>
            <button type="button" className="cat-pill" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setAmount('20000')}>
              $20,000
            </button>
          </div>

          <div className="modal-btn-row">
            {currentBudget > 0 ? (
              <button type="button" className="modal-btn cancel" onClick={handleClear} style={{ color: 'var(--accent-red)' }}>
                清除預算
              </button>
            ) : (
              <button type="button" className="modal-btn cancel" onClick={onClose}>
                取消
              </button>
            )}
            <button type="submit" className="modal-btn save">
              儲存預算
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
