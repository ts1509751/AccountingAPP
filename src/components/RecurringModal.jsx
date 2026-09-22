import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryIcon } from '../utils/categories';
import { X, Plus, Edit2, Trash2, Calendar, Clock, Play, CheckCircle, AlertCircle, Banknote, CreditCard } from 'lucide-react';

const formatRaw = (n) =>
  new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(n);

export default function RecurringModal({ isOpen, onClose }) {
  const {
    recurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    triggerRecurringItem,
    categories,
    categoryIcons,
    creditCards,
  } = useExpense();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState(categories[0] || '生活');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cardId, setCardId] = useState(creditCards[0]?.id || '');
  const [dayOfMonth, setDayOfMonth] = useState(1);

  if (!isOpen) return null;

  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const resetForm = () => {
    setName('');
    setAmount('');
    setType('expense');
    setCategory(categories[0] || '生活');
    setPaymentMethod('cash');
    setCardId(creditCards[0]?.id || '');
    setDayOfMonth(1);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setAmount(item.amount ? String(item.amount) : '');
    setType(item.type || 'expense');
    setCategory(item.category || categories[0] || '生活');
    setPaymentMethod(item.paymentMethod || 'cash');
    setCardId(item.cardId || creditCards[0]?.id || '');
    setDayOfMonth(item.dayOfMonth || 1);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !amount || Number(amount) <= 0) return;
    const selectedCard = creditCards.find(c => c.id === cardId);

    const payload = {
      name: name.trim(),
      amount: Number(amount),
      type,
      category,
      paymentMethod,
      cardId: paymentMethod === 'credit' ? cardId : null,
      cardName: paymentMethod === 'credit' && selectedCard ? selectedCard.name : null,
      dayOfMonth: Number(dayOfMonth) || 1,
    };

    if (editingId) {
      await updateRecurringExpense(editingId, payload);
    } else {
      await addRecurringExpense(payload);
    }
    resetForm();
  };

  const handleDelete = async (item) => {
    if (window.confirm(`確定要刪除固定支出「${item.name}」嗎？（已產生的歷史紀錄不會被刪除）`)) {
      await deleteRecurringExpense(item.id);
      if (editingId === item.id) resetForm();
    }
  };

  const handleToggleActive = async (item) => {
    await updateRecurringExpense(item.id, { active: item.active === false });
  };

  const handleTriggerNow = async (item) => {
    if (window.confirm(`確定要立即為「${item.name}」記一筆 NT$ ${formatRaw(item.amount)} 嗎？`)) {
      await triggerRecurringItem(item.id);
    }
  };

  // Calculate monthly total fixed expenses
  const monthlyFixedTotal = recurringExpenses
    .filter(r => r.active !== false && r.type !== 'income')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet recurring-manage-modal" onClick={e => e.stopPropagation()}>
        <div className="panel-handle" />

        {/* Header */}
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Clock size={22} style={{ color: 'var(--accent-green)' }} />
            <div className="modal-title" style={{ margin: 0 }}>固定支出 (自動記帳)</div>
          </div>
          <button className="icon-btn modal-close-btn" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        </div>
        <p className="modal-sub-hint">
          設定每月固定扣款項目（如房租、電信費、定期訂閱），到達指定日期系統將自動寫入記帳，省去每月手動輸入的麻煩。
        </p>

        {/* Total Banner */}
        <div className="recurring-summary-banner">
          <div>
            <div className="banner-sub">每月固定支出總計</div>
            <div className="banner-num">NT$ {formatRaw(monthlyFixedTotal)}</div>
          </div>
          <div className="banner-badge">
            {recurringExpenses.filter(r => r.active !== false).length} 筆項目啟用中
          </div>
        </div>

        {/* Add / Edit Form */}
        {(isAdding || editingId) ? (
          <div className="editor-card recurring-form-card">
            <div className="editor-header">
              <span className="editor-title">
                {editingId ? '✏️ 編輯固定項目' : '✨ 設定新固定項目'}
              </span>
              <button type="button" className="btn-ghost" onClick={resetForm}>
                取消
              </button>
            </div>

            <div className="recurring-form-grid">
              {/* Type toggle */}
              <div className="modal-field" style={{ margin: 0, gridColumn: 'span 2' }}>
                <label className="modal-label">收支類型</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`type-btn ${type === 'expense' ? 'active-expense' : ''}`}
                    onClick={() => setType('expense')}
                  >💸 固定支出</button>
                  <button
                    type="button"
                    className={`type-btn ${type === 'income' ? 'active-income' : ''}`}
                    onClick={() => setType('income')}
                  >💵 固定收入 (如薪水)</button>
                </div>
              </div>

              {/* Name */}
              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">項目名稱 *</label>
                <input
                  className="modal-input"
                  placeholder="例: 房租、電信費、Netflix"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Amount */}
              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">扣款金額 (NT$) *</label>
                <input
                  className="modal-input"
                  type="number"
                  inputMode="decimal"
                  placeholder="例: 15000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">分類</label>
                <select
                  className="modal-input"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {getCategoryIcon(cat, categoryIcons)} {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day of Month */}
              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">每月記帳日 (1~31 號)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>每月</span>
                  <input
                    className="modal-input"
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={e => setDayOfMonth(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
                    style={{ width: '80px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>號自動記帳</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="modal-field" style={{ margin: 0, gridColumn: 'span 2' }}>
                <label className="modal-label">付款方式</label>
                <div className="payment-method-row" style={{ margin: '0 0 0.5rem 0' }}>
                  <button
                    type="button"
                    className={`payment-method-btn ${paymentMethod === 'cash' ? 'active-cash' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <Banknote size={15} />
                    <span>現金 (Cash)</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-method-btn ${paymentMethod === 'credit' ? 'active-credit' : ''}`}
                    onClick={() => setPaymentMethod('credit')}
                  >
                    <CreditCard size={15} />
                    <span>信用卡 (Card)</span>
                  </button>
                </div>

                {paymentMethod === 'credit' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label className="modal-label" style={{ fontSize: '0.75rem' }}>扣款信用卡</label>
                    {creditCards.length > 0 ? (
                      <select
                        className="modal-input"
                        value={cardId}
                        onChange={e => setCardId(e.target.value)}
                      >
                        {creditCards.map(c => (
                          <option key={c.id} value={c.id}>
                            💳 {c.name} {c.bank ? `(${c.bank})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-orange)' }}>
                        尚未設定信用卡，請至「信用卡管理」新增卡片。
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.2rem' }}>
              <button type="button" className="btn-ghost" onClick={resetForm}>取消</button>
              <button
                type="button"
                className="btn-blue"
                onClick={handleSave}
                disabled={!name.trim() || !amount || Number(amount) <= 0}
              >
                {editingId ? '儲存修改' : '建立固定項目'}
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
            <span>設定新固定支出</span>
          </button>
        )}

        {/* Recurring List */}
        <div className="recurring-items-list">
          {recurringExpenses.length === 0 ? (
            <div className="empty-state-box">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏰</div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>尚未設定固定支出</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                點擊上方按鈕建立房租、水電費等每月定期自動扣款項目
              </p>
            </div>
          ) : (
            recurringExpenses.map(item => {
              const isRecordedThisMonth = item.lastRecordedMonth === currentMonthStr;
              const isInactive = item.active === false;

              return (
                <div key={item.id} className={`recurring-item-card ${isInactive ? 'inactive' : ''}`}>
                  <div className="rec-card-main">
                    <div className="rec-icon-box">
                      {getCategoryIcon(item.category, categoryIcons)}
                    </div>
                    <div className="rec-info-col">
                      <div className="rec-title-row">
                        <span className="rec-title">{item.name}</span>
                        {item.type === 'income' ? (
                          <span className="rec-type-badge income">收入</span>
                        ) : null}
                      </div>

                      <div className="rec-meta-row">
                        <span className="rec-meta-chip">
                          <Calendar size={12} /> 每月 {item.dayOfMonth} 號
                        </span>
                        <span className="rec-meta-chip">
                          {item.paymentMethod === 'credit' ? (item.cardName ? `💳 ${item.cardName}` : '💳 信用卡') : '💵 現金'}
                        </span>
                      </div>
                    </div>

                    <div className="rec-amount-col">
                      <div className={`rec-amount ${item.type === 'income' ? 'income' : 'expense'}`}>
                        {item.type === 'income' ? '+' : '-'}NT$ {formatRaw(item.amount)}
                      </div>

                      {/* Status indicator */}
                      <div className="rec-status-indicator">
                        {isInactive ? (
                          <span className="status-badge inactive">已暫停</span>
                        ) : isRecordedThisMonth ? (
                          <span className="status-badge recorded">
                            <CheckCircle size={11} /> 本月已記帳
                          </span>
                        ) : (
                          <span className="status-badge pending">
                            <Clock size={11} /> 本月待記帳
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom action toolbar */}
                  <div className="rec-card-footer">
                    <button
                      type="button"
                      className="rec-tool-btn active-toggle"
                      onClick={() => handleToggleActive(item)}
                    >
                      {isInactive ? '▶ 啟用自動記帳' : '⏸ 暫停自動記帳'}
                    </button>

                    <button
                      type="button"
                      className="rec-tool-btn trigger-now"
                      onClick={() => handleTriggerNow(item)}
                      title="立即新增一筆此項目的記帳紀錄"
                    >
                      <Play size={12} /> 立即記帳
                    </button>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="rec-tool-btn edit"
                        onClick={() => handleStartEdit(item)}
                        title="編輯"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="rec-tool-btn delete"
                        onClick={() => handleDelete(item)}
                        title="刪除"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
