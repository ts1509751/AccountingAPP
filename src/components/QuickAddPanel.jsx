import { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryIcon, POPULAR_ICONS } from '../utils/categories';
import { useDragScroll } from '../hooks/useDragScroll';
import { Plus, X, Calendar, CreditCard, Banknote, Smile, Settings } from 'lucide-react';
import CategoryModal from './CategoryModal';
import CreditCardModal from './CreditCardModal';

const formatRaw = (n) =>
  new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(n);

export default function QuickAddPanel({ onClose }) {
  const {
    categories,
    categoryIcons,
    addCategory,
    addTransaction,
    creditCards,
    cardUsageMap,
  } = useExpense();

  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'credit'
  const [selectedCardId, setSelectedCardId] = useState(creditCards[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');

  // Submodals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);

  // Sync default card if none selected and cards exist
  useEffect(() => {
    if (!selectedCardId && creditCards.length > 0) {
      setSelectedCardId(creditCards[0].id);
    }
  }, [creditCards, selectedCardId]);

  // Custom Category Creation State
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📌');
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Drag-to-scroll hook for desktop mouse drag & wheel
  const { dragProps, isDragging, hasMoved } = useDragScroll();

  const handleAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (trimmed) {
      await addCategory(trimmed, newCatIcon);
      setSelectedCategory(trimmed);
      setNewCatName('');
      setNewCatIcon('📌');
      setShowIconPicker(false);
      setIsAddingCat(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !selectedCategory) return;
    
    let cardName = null;
    let cardIdToSave = null;
    if (paymentMethod === 'credit') {
      cardIdToSave = selectedCardId || (creditCards[0]?.id || null);
      const matched = creditCards.find(c => c.id === cardIdToSave);
      if (matched) cardName = matched.name;
    }

    await addTransaction({
      type,
      amount: Number(amount),
      category: selectedCategory,
      description: description.trim(),
      date: date || today,
      paymentMethod,
      cardId: cardIdToSave,
      cardName,
    });
    setAmount('');
    setDescription('');
    setDate(today);
    onClose();
  };

  return (
    <>
      <div className="quick-add-overlay" onClick={onClose} />
      <div className="quick-add-panel">
        <div className="panel-handle" />

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>快速記帳</span>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}>
            <X size={18} />
          </button>
        </div>

        {/* Type toggle */}
        <div className="panel-type-row">
          <button
            type="button"
            className={`type-btn ${type === 'expense' ? 'active-expense' : ''}`}
            onClick={() => setType('expense')}
          >
            💸 支出
          </button>
          <button
            type="button"
            className={`type-btn ${type === 'income' ? 'active-income' : ''}`}
            onClick={() => setType('income')}
          >
            💵 收入
          </button>
        </div>

        {/* Payment Method Selector (現金 or 信用卡) */}
        <div className="payment-method-row">
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

        {/* If Credit Card selected: Show Card Selector with real-time remaining limit */}
        {paymentMethod === 'credit' && (
          <div className="quick-add-credit-section">
            <div className="quick-add-credit-header">
              <span className="section-subtitle">選擇卡片 (查看剩餘額度)：</span>
              <button
                type="button"
                className="text-link-btn"
                onClick={() => setShowCreditCardModal(true)}
              >
                ⚙️ 管理 / 新增卡片
              </button>
            </div>

            {creditCards.length === 0 ? (
              <div className="card-empty-prompt" onClick={() => setShowCreditCardModal(true)}>
                <span>💳 尚未設定信用卡，點此建立卡片以即時追蹤額度</span>
              </div>
            ) : (
              <div className="quick-card-scroll">
                {creditCards.map(c => {
                  const usage = cardUsageMap[c.id] || {
                    used: 0,
                    limit: c.limit || 0,
                    remaining: c.limit || 0,
                    percent: 0,
                    isOver: false,
                  };
                  const isSelected = selectedCardId === c.id;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`quick-card-chip ${isSelected ? 'selected' : ''}`}
                      style={{ '--chip-accent': c.color || '#2563eb' }}
                      onClick={() => setSelectedCardId(c.id)}
                    >
                      <div className="chip-name-row">
                        <span className="chip-dot" />
                        <span className="chip-name">{c.name}</span>
                      </div>
                      <div className="chip-limit-info">
                        <span>剩餘 NT${formatRaw(usage.remaining)}</span>
                        <span className="chip-used-label">(已用 {usage.percent}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Category pills with mouse drag-to-scroll & custom icon picker */}
        {isAddingCat ? (
          <div className="new-cat-box">
            <div className="new-cat-input-row">
              <button
                type="button"
                className="new-cat-icon-select-btn"
                onClick={() => setShowIconPicker(!showIconPicker)}
                title="點擊自選圖示"
              >
                <span className="selected-icon-preview">{newCatIcon}</span>
                <span className="icon-pick-hint">選圖示 ▾</span>
              </button>
              <input
                className="panel-input"
                style={{ flex: 1 }}
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="輸入新分類名稱 (如: 咖啡、寵物)"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              />
              <button className="btn-blue" onClick={handleAddCategory}>新增</button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setIsAddingCat(false);
                  setShowIconPicker(false);
                }}
              >
                取消
              </button>
            </div>

            {/* Icon Picker Grid */}
            {showIconPicker && (
              <div className="emoji-picker-container">
                <div className="emoji-picker-title">
                  <Smile size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                  點選自訂圖示：
                </div>
                <div className="emoji-picker-grid">
                  {POPULAR_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`emoji-pick-btn ${newCatIcon === icon ? 'active' : ''}`}
                      onClick={() => {
                        setNewCatIcon(icon);
                        setShowIconPicker(false);
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`category-scroll ${isDragging ? 'is-dragging' : ''}`}
            {...dragProps}
            title="可使用滑鼠按住左右拖曳或滾動滾輪"
          >
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  if (!hasMoved()) setSelectedCategory(cat);
                }}
              >
                <span className="cat-icon">{getCategoryIcon(cat, categoryIcons)}</span>
                <span className="cat-name">{cat}</span>
              </button>
            ))}
            <button
              type="button"
              className="cat-pill add-new"
              onClick={() => {
                if (!hasMoved()) setIsAddingCat(true);
              }}
            >
              <span className="cat-icon">＋</span>
              <span className="cat-name">新分類</span>
            </button>
            <button
              type="button"
              className="cat-pill manage-cat"
              onClick={() => {
                if (!hasMoved()) setShowCategoryModal(true);
              }}
              title="管理與修改現有分類圖示"
            >
              <span className="cat-icon">⚙️</span>
              <span className="cat-name">管理</span>
            </button>
          </div>
        )}

        {/* Amount + description row + add button */}
        <div className="panel-input-row">
          <input
            className="panel-input"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="金額"
            inputMode="decimal"
            style={{ maxWidth: '110px' }}
          />
          <input
            className="panel-input"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="備註（晚餐、電影...）"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button className="panel-add-btn" onClick={handleSubmit} title="新增紀錄">
            <Plus size={24} />
          </button>
        </div>

        {/* Date Selector Row */}
        <div className="panel-date-picker-row">
          <div className="panel-date-left">
            <Calendar size={16} className="text-muted" />
            <span className="panel-date-label">記帳日期：</span>
            <input
              type="date"
              className="panel-date-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          {date === today ? (
            <span className="panel-date-badge">今日 (預設)</span>
          ) : (
            <button
              type="button"
              className="panel-date-today-btn"
              onClick={() => setDate(today)}
            >
              重設為今日
            </button>
          )}
        </div>
      </div>

      {/* Submodals */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />

      <CreditCardModal
        isOpen={showCreditCardModal}
        onClose={() => setShowCreditCardModal(false)}
      />
    </>
  );
}

