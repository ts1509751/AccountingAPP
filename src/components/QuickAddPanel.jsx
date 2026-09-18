import { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryIcon, POPULAR_ICONS } from '../utils/categories';
import { useDragScroll } from '../hooks/useDragScroll';
import { Plus, X, Calendar, CreditCard, Banknote, Smile } from 'lucide-react';

export default function QuickAddPanel({ onClose }) {
  const { categories, categoryIcons, addCategory, addTransaction } = useExpense();

  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'credit'
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');

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
    await addTransaction({
      type,
      amount: Number(amount),
      category: selectedCategory,
      description: description.trim(),
      date: date || today,
      paymentMethod,
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
    </>
  );
}

