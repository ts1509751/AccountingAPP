import { useState } from 'react';
import { useInvestment } from '../../context/InvestmentContext';
import { X, Plus, Edit2, Trash2, Check, Briefcase, Layers } from 'lucide-react';

const ACCOUNT_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#e11d48', // Rose
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#475569', // Slate
];

const formatRaw = (n) =>
  new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(n);

export default function InvestmentAccountModal({ isOpen, onClose }) {
  const {
    investmentAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    accountStatsMap,
  } = useInvestment();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [broker, setBroker] = useState('');
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setBroker('');
    setColor(ACCOUNT_COLORS[0]);
    setNotes('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (acc) => {
    setEditingId(acc.id);
    setName(acc.name);
    setBroker(acc.broker || '');
    setColor(acc.color || ACCOUNT_COLORS[0]);
    setNotes(acc.notes || '');
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    if (editingId) {
      await updateAccount(editingId, {
        name: name.trim(),
        broker: broker.trim(),
        color,
        notes: notes.trim(),
      });
    } else {
      await addAccount({
        name: name.trim(),
        broker: broker.trim(),
        color,
        notes: notes.trim(),
      });
    }
    resetForm();
  };

  const handleDelete = async (acc) => {
    if (investmentAccounts.length <= 1) {
      alert('請至少保留一個投資分帳戶');
      return;
    }
    if (window.confirm(`確定要刪除分帳戶「${acc.name}」嗎？（該帳戶內的歷史交易紀錄仍會保留）`)) {
      await deleteAccount(acc.id);
      if (editingId === acc.id) resetForm();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet category-manage-modal" onClick={e => e.stopPropagation()}>
        <div className="panel-handle" />

        {/* Header */}
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Briefcase size={22} style={{ color: 'var(--accent-blue)' }} />
            <div className="modal-title" style={{ margin: 0 }}>投資分帳戶管理</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        </div>
        <p className="modal-sub-hint">
          依不同券商或投資目標（如富邦證券、國泰定期存股、美股專戶）建立分帳戶，分開追蹤各自的持股庫存與績效。
        </p>

        {/* Add / Edit Form */}
        {(isAdding || editingId) ? (
          <div className="editor-card card-form-card">
            <div className="editor-header">
              <span className="editor-title">
                {editingId ? '✏️ 修改分帳戶' : '✨ 建立新分帳戶'}
              </span>
              <button type="button" className="btn-ghost" onClick={resetForm}>
                取消
              </button>
            </div>

            <div className="card-form-grid">
              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">帳戶名稱 *</label>
                <input
                  className="modal-input"
                  placeholder="例: 國泰定期存股、富邦短線波段"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">券商名稱 (選填)</label>
                <input
                  className="modal-input"
                  placeholder="例: 國泰世華、台北富邦、元大證券"
                  value={broker}
                  onChange={e => setBroker(e.target.value)}
                />
              </div>

              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">代表標籤顏色</label>
                <div className="color-picker-palette">
                  {ACCOUNT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`color-pick-circle ${color === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    >
                      {color === c && <Check size={14} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">帳戶備註 (選填)</label>
                <input
                  className="modal-input"
                  placeholder="例: 手續費 2.8 折、退休專用"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
              <button type="button" className="btn-ghost" onClick={resetForm}>取消</button>
              <button type="button" className="btn-blue" onClick={handleSave} disabled={!name.trim()}>
                {editingId ? '儲存修改' : '建立帳戶'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="add-item-action-btn"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={16} />
            <span>新增投資分帳戶</span>
          </button>
        )}

        {/* Accounts List */}
        <div className="credit-cards-list">
          {investmentAccounts.map(acc => {
            const stats = accountStatsMap[acc.id] || { totalCost: 0, holdingsCount: 0, txCount: 0 };

            return (
              <div
                key={acc.id}
                className="credit-card-visual-card"
                style={{ '--card-accent': acc.color || '#2563eb' }}
              >
                <div className="cc-card-top">
                  <div>
                    <div className="cc-bank-label">{acc.broker || '證券戶'}</div>
                    <div className="cc-name-label">{acc.name}</div>
                  </div>
                  <div className="cc-card-actions">
                    <button
                      type="button"
                      className="cc-action-btn"
                      onClick={() => handleStartEdit(acc)}
                      title="編輯帳戶"
                    >
                      <Edit2 size={14} />
                    </button>
                    {investmentAccounts.length > 1 && (
                      <button
                        type="button"
                        className="cc-action-btn delete"
                        onClick={() => handleDelete(acc)}
                        title="刪除帳戶"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="cc-limit-row">
                  <div className="cc-limit-metric">
                    <span className="metric-label">持有股票成本</span>
                    <span className="metric-num">NT$ {formatRaw(stats.totalCost)}</span>
                  </div>
                  <div className="cc-limit-metric">
                    <span className="metric-label">庫存標的</span>
                    <span className="metric-num-muted">{stats.holdingsCount} 檔</span>
                  </div>
                  <div className="cc-limit-metric right">
                    <span className="metric-label">累計交易</span>
                    <span className="metric-num-muted">{stats.txCount} 筆</span>
                  </div>
                </div>

                {acc.notes && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    備註: {acc.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="modal-footer" style={{ marginTop: '1.2rem' }}>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
