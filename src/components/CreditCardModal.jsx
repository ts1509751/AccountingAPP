import { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { X, Plus, Edit2, Trash2, CreditCard, Check, AlertCircle } from 'lucide-react';

const CARD_COLORS = [
  '#2563eb', // Blue
  '#4f46e5', // Indigo
  '#7c3aed', // Purple
  '#059669', // Emerald
  '#e11d48', // Rose
  '#d97706', // Amber
  '#334155', // Slate
  '#0891b2', // Cyan
];

const formatRaw = (n) =>
  new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(n);

export default function CreditCardModal({ isOpen, onClose }) {
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard, cardUsageMap } = useExpense();

  const [isAdding, setIsAdding] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [limit, setLimit] = useState('');
  const [color, setColor] = useState(CARD_COLORS[0]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setBank('');
    setLimit('');
    setColor(CARD_COLORS[0]);
    setIsAdding(false);
    setEditingCardId(null);
  };

  const handleStartEdit = (card) => {
    setEditingCardId(card.id);
    setName(card.name);
    setBank(card.bank || '');
    setLimit(card.limit ? String(card.limit) : '');
    setColor(card.color || CARD_COLORS[0]);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const numLimit = Number(limit) || 0;

    if (editingCardId) {
      await updateCreditCard(editingCardId, {
        name: name.trim(),
        bank: bank.trim(),
        limit: numLimit,
        color,
      });
    } else {
      await addCreditCard({
        name: name.trim(),
        bank: bank.trim(),
        limit: numLimit,
        color,
      });
    }
    resetForm();
  };

  const handleDelete = async (card) => {
    if (window.confirm(`確定要刪除信用卡「${card.name}」嗎？（已發生的刷卡紀錄仍會保留）`)) {
      await deleteCreditCard(card.id);
      if (editingCardId === card.id) resetForm();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet credit-card-manage-modal" onClick={e => e.stopPropagation()}>
        <div className="panel-handle" />

        {/* Header */}
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <CreditCard size={22} style={{ color: 'var(--accent-blue)' }} />
            <div className="modal-title" style={{ margin: 0 }}>信用卡額度管理</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        </div>
        <p className="modal-sub-hint">
          設定您的信用卡與信用額度，記帳時選擇該卡片即可即時查看本月已使用及剩餘可用額度。
        </p>

        {/* Add / Edit Card Form */}
        {(isAdding || editingCardId) ? (
          <div className="editor-card card-form-card">
            <div className="editor-header">
              <span className="editor-title">
                {editingCardId ? '✏️ 修改信用卡' : '✨ 新增信用卡'}
              </span>
              <button type="button" className="btn-ghost" onClick={resetForm}>
                取消
              </button>
            </div>

            <div className="card-form-grid">
              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">卡片名稱 *</label>
                <input
                  className="modal-input"
                  placeholder="例: 國泰 CUBE 卡、富邦 J 卡"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">發卡銀行 (選填)</label>
                <input
                  className="modal-input"
                  placeholder="例: 國泰世華、台北富邦"
                  value={bank}
                  onChange={e => setBank(e.target.value)}
                />
              </div>

              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">信用額度 (NT$) *</label>
                <input
                  className="modal-input"
                  type="number"
                  inputMode="decimal"
                  placeholder="例: 100000"
                  value={limit}
                  onChange={e => setLimit(e.target.value)}
                />
              </div>

              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">卡面代表顏色</label>
                <div className="color-picker-palette">
                  {CARD_COLORS.map(c => (
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
              <button type="button" className="btn-ghost" onClick={resetForm}>取消</button>
              <button type="button" className="btn-blue" onClick={handleSave} disabled={!name.trim()}>
                {editingCardId ? '儲存修改' : '建立卡片'}
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
            <span>新增信用卡</span>
          </button>
        )}

        {/* Card List with live limit tracking */}
        <div className="credit-cards-list">
          {creditCards.length === 0 ? (
            <div className="empty-state-box">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💳</div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>尚無信用卡設定</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                點擊上方「新增信用卡」開始管理額度
              </p>
            </div>
          ) : (
            creditCards.map(card => {
              const usage = cardUsageMap[card.id] || {
                used: 0,
                limit: card.limit || 0,
                remaining: card.limit || 0,
                percent: 0,
                isOver: false,
              };

              return (
                <div
                  key={card.id}
                  className="credit-card-visual-card"
                  style={{ '--card-accent': card.color || '#2563eb' }}
                >
                  <div className="cc-card-top">
                    <div>
                      <div className="cc-bank-label">{card.bank || '信用卡'}</div>
                      <div className="cc-name-label">{card.name}</div>
                    </div>
                    <div className="cc-card-actions">
                      <button
                        type="button"
                        className="cc-action-btn"
                        onClick={() => handleStartEdit(card)}
                        title="編輯卡片"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="cc-action-btn delete"
                        onClick={() => handleDelete(card)}
                        title="刪除卡片"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Limit numbers row */}
                  <div className="cc-limit-row">
                    <div className="cc-limit-metric">
                      <span className="metric-label">本月已刷</span>
                      <span className="metric-num">NT$ {formatRaw(usage.used)}</span>
                    </div>
                    <div className="cc-limit-metric">
                      <span className="metric-label">剩餘可用</span>
                      <span className={`metric-num ${usage.isOver ? 'danger' : 'success'}`}>
                        NT$ {formatRaw(usage.remaining)}
                      </span>
                    </div>
                    <div className="cc-limit-metric right">
                      <span className="metric-label">信用額度</span>
                      <span className="metric-num-muted">NT$ {formatRaw(card.limit || 0)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="cc-progress-track">
                    <div
                      className={`cc-progress-fill ${usage.percent >= 90 ? 'danger' : usage.percent >= 75 ? 'warning' : ''}`}
                      style={{ width: `${usage.percent}%` }}
                    />
                  </div>

                  <div className="cc-card-bottom-info">
                    <span className="cc-percent-txt">
                      額度使用率: <strong>{usage.percent}%</strong>
                    </span>
                    {usage.isOver && (
                      <span className="cc-alert-txt">
                        <AlertCircle size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> 已超出額度
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="modal-footer" style={{ marginTop: '1.2rem' }}>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={onClose}>
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
