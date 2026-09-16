import { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryIcon } from '../utils/categories';
import { Plus, X, Calendar } from 'lucide-react';

export default function QuickAddPanel({ onClose }) {
  const { categories, addCategory, addTransaction } = useExpense();

  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (trimmed) {
      addCategory(trimmed);
      setSelectedCategory(trimmed);
      setNewCatName('');
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
            className={`type-btn ${type === 'expense' ? 'active-expense' : ''}`}
            onClick={() => setType('expense')}
          >
            💸 支出
          </button>
          <button
            className={`type-btn ${type === 'income' ? 'active-income' : ''}`}
            onClick={() => setType('income')}
          >
            💵 收入
          </button>
        </div>

        {/* Category pills */}
        {isAddingCat ? (
          <div className="new-cat-input-row">
            <input
              className="panel-input"
              style={{ flex: 1 }}
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="輸入新分類名稱"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            />
            <button className="btn-blue" onClick={handleAddCategory}>新增</button>
            <button className="btn-ghost" onClick={() => setIsAddingCat(false)}>取消</button>
          </div>
        ) : (
          <div className="category-scroll">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <span className="cat-icon">{getCategoryIcon(cat)}</span>
                <span className="cat-name">{cat}</span>
              </button>
            ))}
            <button className="cat-pill add-new" onClick={() => setIsAddingCat(true)}>
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
