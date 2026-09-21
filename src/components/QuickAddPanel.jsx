import { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryIcon, POPULAR_ICONS } from '../utils/categories';
import { useDragScroll } from '../hooks/useDragScroll';
import { parseNaturalLanguageInput } from '../utils/nlpParser';
import { Plus, X, Calendar, CreditCard, Banknote, Smile, Sparkles, Check, Send } from 'lucide-react';
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

  // Natural language bookkeeping states
  const [nlpInput, setNlpInput] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [nlpApplied, setNlpApplied] = useState(false);

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

  const quickExamples = [
    '今天中午牛肉麵 150 刷卡',
    '昨天搭計程車 220 現金',
    '全聯生活用品 480 刷卡',
  ];

  const handleNlpParse = (textToParse = nlpInput, autoSubmit = false) => {
    const text = (textToParse || '').trim();
    if (!text) return;

    const res = parseNaturalLanguageInput(text, {
      categories,
      creditCards,
      referenceDate: new Date(),
    });

    if (res) {
      setParsedResult(res);
      setNlpApplied(true);
      setType(res.type);
      if (res.amount > 0) setAmount(String(res.amount));
      if (res.description) setDescription(res.description);
      if (res.date) setDate(res.date);
      if (res.category) setSelectedCategory(res.category);
      if (res.paymentMethod) setPaymentMethod(res.paymentMethod);
      if (res.cardId) setSelectedCardId(res.cardId);

      if (autoSubmit && res.amount > 0) {
        handleSubmitDirect(res);
      }
    }
  };

  const handleSubmitDirect = async (res) => {
    let cardName = null;
    let cardIdToSave = null;
    if (res.paymentMethod === 'credit') {
      cardIdToSave = res.cardId || (creditCards[0]?.id || null);
      const matched = creditCards.find(c => c.id === cardIdToSave);
      if (matched) cardName = matched.name;
    }

    await addTransaction({
      type: res.type,
      amount: Number(res.amount),
      category: res.category || selectedCategory || categories[0] || '生活',
      description: (res.description || '').trim(),
      date: res.date || today,
      paymentMethod: res.paymentMethod,
      cardId: cardIdToSave,
      cardName,
    });
    setAmount('');
    setDescription('');
    setDate(today);
    setNlpInput('');
    onClose();
  };

  return (
    <>
      <div className="quick-add-overlay" onClick={onClose} />
      <div className="quick-add-panel">
        <div className="panel-handle" />

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>快速記帳</span>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Natural Language Smart Bookkeeping Input ── */}
        <div className="nlp-input-card">
          <div className="nlp-input-header">
            <span className="nlp-label">
              <Sparkles size={14} style={{ color: 'var(--accent-blue)', verticalAlign: 'middle', marginRight: '4px' }} />
              自然語言智慧記帳
            </span>
            <span className="nlp-sub-hint">輸入一句話自動辨識所有欄位</span>
          </div>

          <div className="nlp-input-row">
            <input
              className="nlp-input"
              value={nlpInput}
              onChange={e => {
                setNlpInput(e.target.value);
                setNlpApplied(false);
              }}
              placeholder="例: 今天中午牛肉麵 150 刷卡"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleNlpParse(nlpInput, false);
                }
              }}
            />
            <button
              type="button"
              className="nlp-parse-btn"
              onClick={() => handleNlpParse(nlpInput, false)}
              title="自動解析並填入"
            >
              <Sparkles size={14} />
              <span>辨識</span>
            </button>
          </div>

          {/* Quick example tags */}
          <div className="nlp-examples-row">
            <span className="nlp-ex-label">💡 範例：</span>
            <div className="nlp-examples-scroll">
              {quickExamples.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="nlp-ex-chip"
                  onClick={() => {
                    setNlpInput(ex);
                    handleNlpParse(ex, false);
                  }}
                  title="點擊帶入此範例"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Result Preview Banner */}
          {parsedResult && nlpApplied && (
            <div className="nlp-result-banner">
              <div className="nlp-result-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                  <Check size={14} />
                  <span>已自動辨識並填入表單：</span>
                </div>
                {parsedResult.amount > 0 && (
                  <button
                    type="button"
                    className="nlp-oneclick-submit-btn"
                    onClick={() => handleSubmitDirect(parsedResult)}
                    title="直接以此資料記帳送出"
                  >
                    <Send size={12} />
                    <span>⚡ 一鍵直接記帳</span>
                  </button>
                )}
              </div>

              <div className="nlp-chips-grid">
                <span className="nlp-pill">📅 {parsedResult.date}</span>
                <span className={`nlp-pill type ${parsedResult.type}`}>
                  {parsedResult.type === 'expense' ? '💸 支出' : '💵 收入'}
                </span>
                <span className="nlp-pill">🏷️ {parsedResult.category}</span>
                <span className="nlp-pill amount">💰 NT$ {formatRaw(parsedResult.amount)}</span>
                <span className="nlp-pill">
                  {parsedResult.paymentMethod === 'credit'
                    ? `💳 ${parsedResult.cardName || '信用卡'}`
                    : '💵 現金'}
                </span>
                <span className="nlp-pill note">📝 {parsedResult.description}</span>
              </div>
            </div>
          )}
        </div>

        {/* 1. 支出 / 收入 */}
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

        {/* 2. 金額 */}
        <div className="panel-amount-card">
          <span className="panel-amount-prefix">NT$</span>
          <input
            className="panel-amount-field"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            inputMode="decimal"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* 3. 現金 \ 信用卡 */}
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

        {/* 4. 分類（兩排顯示，方便選擇） */}
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
            className={`category-scroll two-rows ${isDragging ? 'is-dragging' : ''}`}
            {...dragProps}
            title="可使用滑鼠左右拖曳或滑動查看更多分類"
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

        {/* 5. 備註 */}
        <div className="panel-desc-row">
          <input
            className="panel-input"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="備註（例如：晚餐、電影票...選填）"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* 6. 日期 */}
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

        {/* 確定記帳按鈕 */}
        <button
          type="button"
          className="panel-submit-btn"
          onClick={handleSubmit}
          disabled={!amount || Number(amount) <= 0}
        >
          <Plus size={20} />
          <span>確定記帳</span>
        </button>
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

