import { useState, useMemo } from 'react';
import { useInvestment } from '../../context/InvestmentContext';
import { findStockByCode, searchStocks } from '../../utils/stockDatabase';
import { X, Plus, Edit2, Trash2, Calendar, Clock, DollarSign, Play, Sparkles } from 'lucide-react';

const formatRaw = (n) =>
  new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(n);

export default function DcaPlanModal({ isOpen, onClose, onQuickDcaBuy }) {
  const {
    dcaPlans,
    addDcaPlan,
    updateDcaPlan,
    deleteDcaPlan,
    investmentAccounts,
  } = useInvestment();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form fields
  const [symbol, setSymbol] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [detectedStock, setDetectedStock] = useState(null);
  const [assetType, setAssetType] = useState('stock');
  const [accountId, setAccountId] = useState(investmentAccounts[0]?.id || 'default');
  const [fixedAmount, setFixedAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState(6);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const suggestions = useMemo(() => {
    if (!symbol || !showSuggestions) return [];
    return searchStocks(symbol, 5);
  }, [symbol, showSuggestions]);

  const handleSymbolChange = (val) => {
    setSymbol(val);
    setShowSuggestions(true);
    const matched = findStockByCode(val);
    if (matched) {
      setDetectedStock(matched);
      if (matched.type) setAssetType(matched.type);
    } else {
      setDetectedStock(null);
    }
  };

  const selectStock = (item) => {
    setSymbol(`${item.code} ${item.name}`);
    setAssetType(item.type);
    setDetectedStock(item);
    setShowSuggestions(false);
  };

  const resetForm = () => {
    setSymbol('');
    setDetectedStock(null);
    setAssetType('stock');
    setAccountId(investmentAccounts[0]?.id || 'default');
    setFixedAmount('');
    setDayOfMonth(6);
    setNotes('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (plan) => {
    setEditingId(plan.id);
    setSymbol(plan.symbol);
    setAssetType(plan.assetType || 'stock');
    setAccountId(plan.accountId || investmentAccounts[0]?.id || 'default');
    setFixedAmount(plan.fixedAmount ? String(plan.fixedAmount) : '');
    setDayOfMonth(plan.dayOfMonth || 6);
    setNotes(plan.notes || '');
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!symbol.trim() || !fixedAmount || Number(fixedAmount) <= 0) return;

    const matched = findStockByCode(symbol) || detectedStock;
    const finalSymbol = matched && !symbol.includes(matched.name)
      ? `${matched.code} ${matched.name}`
      : symbol.trim();

    const selectedAcc = investmentAccounts.find(a => a.id === accountId);
    const accountName = selectedAcc?.name || '預設主帳戶';

    const payload = {
      symbol: finalSymbol,
      assetType,
      accountId,
      accountName,
      fixedAmount: Math.floor(Number(fixedAmount)),
      dayOfMonth: Number(dayOfMonth) || 1,
      notes: notes.trim(),
    };

    if (editingId) {
      await updateDcaPlan(editingId, payload);
    } else {
      await addDcaPlan(payload);
    }
    resetForm();
  };

  const handleDelete = async (plan) => {
    if (window.confirm(`確定要刪除定期定額計劃「${plan.symbol}」嗎？`)) {
      await deleteDcaPlan(plan.id);
      if (editingId === plan.id) resetForm();
    }
  };

  const handleToggleActive = async (plan) => {
    await updateDcaPlan(plan.id, { active: plan.active === false });
  };

  const totalMonthlyDca = dcaPlans
    .filter(p => p.active !== false)
    .reduce((sum, p) => sum + Number(p.fixedAmount || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet recurring-manage-modal" onClick={e => e.stopPropagation()}>
        <div className="panel-handle" />

        {/* Header */}
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Calendar size={22} style={{ color: 'var(--accent-green)' }} />
            <div className="modal-title" style={{ margin: 0 }}>定期定額存股計劃 (DCA)</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        </div>
        <p className="modal-sub-hint">
          設定每月定期定額存股標的與扣款金額，方便規劃長期存股投資，隨時一鍵帶入記帳。
        </p>

        {/* Summary Banner */}
        <div className="recurring-summary-banner">
          <div>
            <div className="banner-sub">每月定期定額預計投入</div>
            <div className="banner-num">NT$ {formatRaw(totalMonthlyDca)}</div>
          </div>
          <div className="banner-badge">
            {dcaPlans.filter(p => p.active !== false).length} 檔計劃執行中
          </div>
        </div>

        {/* Form */}
        {(isAdding || editingId) ? (
          <div className="editor-card recurring-form-card">
            <div className="editor-header">
              <span className="editor-title">
                {editingId ? '✏️ 修改定期定額計劃' : '✨ 新增定期定額計劃'}
              </span>
              <button type="button" className="btn-ghost" onClick={resetForm}>
                取消
              </button>
            </div>

            <div className="recurring-form-grid">
              {/* Target Symbol */}
              <div className="modal-field" style={{ margin: 0, position: 'relative' }}>
                <label className="modal-label">標的代號或名稱 *</label>
                <input
                  className="modal-input"
                  placeholder="例: 0050 或 台積電"
                  value={symbol}
                  onChange={e => handleSymbolChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  autoFocus
                />
                {suggestions.length > 0 && (
                  <div className="stock-autocomplete-dropdown">
                    {suggestions.map(s => (
                      <div
                        key={s.code}
                        className="stock-autocomplete-item"
                        onMouseDown={() => selectStock(s)}
                      >
                        <span className="stock-item-code">{s.code}</span>
                        <span className="stock-item-name">{s.name}</span>
                        <span className="stock-item-market">{s.market} · {s.type.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub Account */}
              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">所屬分帳戶</label>
                <select
                  className="modal-input"
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                >
                  {investmentAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      💼 {a.name} ({a.broker || '證券戶'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fixed Amount */}
              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">約定扣款金額 (NT$) *</label>
                <input
                  className="modal-input"
                  type="number"
                  inputMode="decimal"
                  placeholder="例: 5000"
                  value={fixedAmount}
                  onChange={e => setFixedAmount(e.target.value)}
                />
              </div>

              {/* Day of Month */}
              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">每月扣款日</label>
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
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>號</span>
                </div>
              </div>

              {/* Notes */}
              <div className="modal-field" style={{ margin: 0, gridColumn: 'span 2' }}>
                <label className="modal-label">備註 (選填)</label>
                <input
                  className="modal-input"
                  placeholder="例: 國泰證券每月6號自動扣款"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.2rem' }}>
              <button type="button" className="btn-ghost" onClick={resetForm}>取消</button>
              <button
                type="button"
                className="btn-blue"
                onClick={handleSave}
                disabled={!symbol.trim() || !fixedAmount || Number(fixedAmount) <= 0}
              >
                {editingId ? '儲存修改' : '建立計劃'}
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
            <span>新增定期定額計劃</span>
          </button>
        )}

        {/* Plans List */}
        <div className="recurring-items-list">
          {dcaPlans.length === 0 ? (
            <div className="empty-state-box">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📅</div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>尚未建立定期定額計劃</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                點擊上方按鈕建立 0050、00878 或個股的定期存股設定
              </p>
            </div>
          ) : (
            dcaPlans.map(plan => {
              const isInactive = plan.active === false;

              return (
                <div key={plan.id} className={`recurring-item-card ${isInactive ? 'inactive' : ''}`}>
                  <div className="rec-card-main">
                    <div className="rec-icon-box" style={{ background: 'var(--accent-blue-dim)' }}>
                      📈
                    </div>
                    <div className="rec-info-col">
                      <div className="rec-title-row">
                        <span className="rec-title">{plan.symbol}</span>
                        <span className="status-badge recorded" style={{ fontSize: '0.68rem' }}>
                          定期定額
                        </span>
                      </div>

                      <div className="rec-meta-row">
                        <span className="rec-meta-chip">
                          <Calendar size={12} /> 每月 {plan.dayOfMonth} 號
                        </span>
                        <span className="rec-meta-chip">
                          💼 {plan.accountName || '預設帳戶'}
                        </span>
                      </div>
                    </div>

                    <div className="rec-amount-col">
                      <div className="rec-amount" style={{ color: 'var(--text-primary)' }}>
                        NT$ {formatRaw(plan.fixedAmount)}
                      </div>
                      <div className="rec-status-indicator">
                        {isInactive ? (
                          <span className="status-badge inactive">已暫停</span>
                        ) : (
                          <span className="status-badge recorded">執行中</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action toolbar */}
                  <div className="rec-card-footer">
                    <button
                      type="button"
                      className="rec-tool-btn active-toggle"
                      onClick={() => handleToggleActive(plan)}
                    >
                      {isInactive ? '▶ 啟用計劃' : '⏸ 暫停計劃'}
                    </button>

                    {onQuickDcaBuy && (
                      <button
                        type="button"
                        className="rec-tool-btn trigger-now"
                        onClick={() => {
                          onQuickDcaBuy(plan);
                          onClose();
                        }}
                        title="帶入此定期定額計劃快速記帳"
                      >
                        <Play size={12} /> 一鍵記買進
                      </button>
                    )}

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="rec-tool-btn edit"
                        onClick={() => handleStartEdit(plan)}
                        title="編輯"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="rec-tool-btn delete"
                        onClick={() => handleDelete(plan)}
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
}
