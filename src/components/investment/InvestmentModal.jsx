import { useState, useMemo } from 'react';
import { useInvestment } from '../../context/InvestmentContext';
import { X, Calculator, ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { findStockByCode, searchStocks } from '../../utils/stockDatabase';

export default function InvestmentModal({ transaction, onClose }) {
  const { addInvestment, updateInvestment, investmentAccounts, dcaPlans } = useInvestment();

  const accounts = Array.isArray(investmentAccounts) ? investmentAccounts : [];
  const plans = Array.isArray(dcaPlans) ? dcaPlans : [];

  const isEditing = Boolean(transaction);
  const today = new Date().toISOString().split('T')[0];

  const [action, setAction] = useState(transaction?.action || 'buy');
  const [isDCA, setIsDCA] = useState(Boolean(transaction?.isDCA));
  const [accountId, setAccountId] = useState(transaction?.accountId || (accounts[0]?.id || 'default'));
  const [assetType, setAssetType] = useState(transaction?.assetType || 'stock');
  const [symbol, setSymbol] = useState(transaction?.symbol || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [detectedStock, setDetectedStock] = useState(() => {
    return transaction?.symbol ? findStockByCode(transaction.symbol) : null;
  });

  const [date, setDate] = useState(transaction?.date || today);
  const [price, setPrice] = useState(transaction?.price ? String(transaction.price) : '');
  const [shares, setShares] = useState(transaction?.shares ? String(transaction.shares) : '');
  const [fee, setFee] = useState(transaction?.fee !== undefined ? String(transaction.fee) : '20');
  const [tax, setTax] = useState(transaction?.tax !== undefined ? String(transaction.tax) : '0');
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [discountRate, setDiscountRate] = useState(1); // 1 = 100%, 0.6 = 6折, 0.28 = 2.8折, 0 = 免手續費

  // Filter autocomplete suggestions based on input
  const suggestions = useMemo(() => {
    if (!symbol || !showSuggestions) return [];
    return searchStocks(symbol, 6);
  }, [symbol, showSuggestions]);

  // Handle symbol change & auto-detection
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

  const handleBlur = () => {
    // Delay slightly to let clicks/touches on suggestions register
    setTimeout(() => {
      setShowSuggestions(false);
      // Auto format e.g. 2330 -> "2330 台積電"
      const matched = findStockByCode(symbol) || detectedStock;
      if (matched && !symbol.includes(matched.name)) {
        setSymbol(`${matched.code} ${matched.name}`);
        setAssetType(matched.type);
        setDetectedStock(matched);
      }
    }, 250);
  };

  // Compute base trade value - 無條件捨去至個位數
  const numPrice = Number(price) || 0;
  const numShares = Number(shares) || 0;
  const turnover = Math.floor(numPrice * numShares);

  // Auto calculate fee & tax when price, shares, action, assetType or discountRate changes (if user hasn't typed a completely custom one)
  const autoCalculate = (rate = discountRate) => {
    if (turnover <= 0) {
      setFee('0');
      setTax('0');
      return;
    }

    // Fee: turnover * 0.001425 * rate, min 20 TWD (unless rate is 0), 無條件捨去至個位數
    let rawFee = 0;
    if (rate > 0) {
      rawFee = Math.max(20, Math.floor(turnover * 0.001425 * rate));
    }
    setFee(String(rawFee));

    // Tax: only for sell, 無條件捨去至個位數
    if (action === 'sell') {
      if (assetType === 'stock') {
        setTax(String(Math.floor(turnover * 0.003))); // 0.3%
      } else if (assetType === 'etf') {
        setTax(String(Math.floor(turnover * 0.001))); // 0.1%
      } else {
        setTax('0');
      }
    } else {
      setTax('0');
    }
  };

  const applyDiscount = (rate) => {
    setDiscountRate(rate);
    autoCalculate(rate);
  };

  // Compute final total amount - 無條件捨去至個位數
  const numFee = Math.floor(Number(fee) || 0);
  const numTax = Math.floor(Number(tax) || 0);
  const totalAmount = Math.floor(
    action === 'buy'
      ? turnover + numFee
      : Math.max(0, turnover - numFee - numTax)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol.trim() || numPrice <= 0 || numShares <= 0 || !date) return;

    // Resolve symbol with auto-recognized stock name if code only
    const matched = findStockByCode(symbol) || detectedStock;
    const finalSymbol = matched && !symbol.includes(matched.name)
      ? `${matched.code} ${matched.name}`
      : symbol.trim();

    const selectedAcc = investmentAccounts.find(a => a.id === accountId);
    const accountName = selectedAcc?.name || '預設主帳戶';

    const data = {
      action,
      assetType,
      symbol: finalSymbol,
      accountId,
      accountName,
      isDCA: action === 'buy' ? isDCA : false,
      date,
      price: numPrice,
      shares: numShares,
      fee: Math.floor(numFee),
      tax: Math.floor(numTax),
      turnover: Math.floor(turnover),
      totalAmount: Math.floor(totalAmount),
      notes: notes.trim(),
    };

    if (isEditing) {
      await updateInvestment(transaction.id, data);
    } else {
      await addInvestment(data);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet investment-modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="panel-handle" />

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {isEditing ? '編輯投資交易' : '新增投資紀錄'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              股票 · ETF · 基金交易明細
            </span>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Action Toggle: 買進 (綠) vs 賣出 (紅) */}
          <div className="panel-type-row" style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              className={`type-btn ${action === 'buy' ? 'active-income' : ''}`}
              onClick={() => {
                setAction('buy');
                setTax('0');
              }}
            >
              <ArrowDownRight size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              買進 (Buy)
            </button>
            <button
              type="button"
              className={`type-btn ${action === 'sell' ? 'active-expense' : ''}`}
              onClick={() => {
                setAction('sell');
                if (assetType === 'stock') setTax(String(Math.round(turnover * 0.003)));
                else if (assetType === 'etf') setTax(String(Math.round(turnover * 0.001)));
              }}
            >
              <ArrowUpRight size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              賣出 (Sell)
            </button>
          </div>

          {/* Asset Type selection */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { id: 'stock', label: '📈 股票' },
              { id: 'etf', label: '📊 ETF' },
              { id: 'fund', label: '🌱 基金' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`cat-pill ${assetType === t.id ? 'active' : ''}`}
                style={{ flex: 1, padding: '0.55rem' }}
                onClick={() => setAssetType(t.id)}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Sub-account selection & DCA Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
            {/* Account Selector */}
            <div className="modal-field" style={{ margin: 0 }}>
              <label className="modal-label">所屬投資分帳戶</label>
              <select
                className="modal-input"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                style={{ padding: '0.65rem 0.75rem', fontSize: '0.88rem' }}
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    💼 {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade Method: 單筆 vs 定期定額 (only for buy) */}
            <div className="modal-field" style={{ margin: 0 }}>
              <label className="modal-label">交易類型</label>
              {action === 'buy' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className={`payment-method-btn ${!isDCA ? 'active-cash' : ''}`}
                    style={{ padding: '0.65rem 0.2rem', fontSize: '0.8rem' }}
                    onClick={() => setIsDCA(false)}
                  >
                    🛒 單筆
                  </button>
                  <button
                    type="button"
                    className={`payment-method-btn ${isDCA ? 'active-credit' : ''}`}
                    style={{ padding: '0.65rem 0.2rem', fontSize: '0.8rem' }}
                    onClick={() => setIsDCA(true)}
                  >
                    📅 定期定額
                  </button>
                </div>
              ) : (
                <div style={{ padding: '0.65rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  賣出結算
                </div>
              )}
            </div>
          </div>

          {/* Quick pick from active DCA plans */}
          {action === 'buy' && isDCA && plans.length > 0 && (
            <div style={{ marginBottom: '1rem', background: 'var(--bg-card)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                ⚡ 點擊快速帶入設定的定期定額計劃：
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {plans.filter(p => p && p.active !== false).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="inv-account-pill"
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                    onClick={() => {
                      setSymbol(p.symbol);
                      if (p.assetType) setAssetType(p.assetType);
                      if (p.accountId) setAccountId(p.accountId);
                    }}
                  >
                    📅 {p.symbol} (${formatMoney(p.fixedAmount).replace('TWD', '').replace('$', '').trim()})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Symbol / Name */}
          <div className="modal-field" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="modal-label" style={{ margin: 0 }}>標的代號或名稱</label>
              {detectedStock && (
                <span
                  className="stock-detected-tag"
                  onPointerDown={(e) => { e.preventDefault(); selectStock(detectedStock); }}
                  onClick={() => selectStock(detectedStock)}
                  title="點擊自動補全代碼與名稱"
                >
                  <Sparkles size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                  {detectedStock.name}
                </span>
              )}
            </div>

            <input
              type="text"
              className="modal-input"
              placeholder="輸入代號 (如 2330, 0050, NVDA) 或名稱"
              value={symbol}
              onChange={e => handleSymbolChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={handleBlur}
              autoComplete="off"
              required
            />

            {/* Mobile-friendly detected stock banner right below input */}
            {detectedStock && (
              <div
                className="stock-mobile-detected-banner"
                onPointerDown={(e) => {
                  e.preventDefault();
                  selectStock(detectedStock);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  selectStock(detectedStock);
                }}
                onClick={() => selectStock(detectedStock)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    已識別：<strong>{detectedStock.code} {detectedStock.name}</strong> ({detectedStock.type === 'etf' ? 'ETF' : '股票'})
                  </span>
                </div>
                <span className="stock-auto-apply-btn">點擊套用</span>
              </div>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="stock-autocomplete-dropdown">
                {suggestions.map(s => (
                  <div
                    key={s.code}
                    className="stock-autocomplete-item"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      selectStock(s);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      selectStock(s);
                    }}
                    onClick={() => selectStock(s)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="stock-code-badge">{s.code}</span>
                      <span className="stock-name-text">{s.name}</span>
                    </div>
                    <span className="stock-type-badge">
                      {s.type === 'etf' ? 'ETF' : '股票'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="modal-field">
            <label className="modal-label">交易日期</label>
            <input
              type="date"
              className="modal-input"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {/* Price & Shares Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label className="modal-label">成交股價 / 淨值</label>
              <input
                type="number"
                step="any"
                min="0.01"
                className="modal-input"
                placeholder="例如：600"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="modal-label">成交股數 / 單位</label>
              <input
                type="number"
                step="any"
                min="1"
                className="modal-input"
                placeholder="例如：1000"
                value={shares}
                onChange={e => setShares(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Fee & Tax Section */}
          <div className="desktop-card" style={{ padding: '1rem', marginBottom: '1rem', background: 'var(--bg-pill)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                手續費與稅金試算
              </span>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => autoCalculate()}
              >
                <Calculator size={13} style={{ display: 'inline', marginRight: '3px' }} />
                自動試算
              </button>
            </div>

            {/* Fee discount pills */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.2rem' }}>券商折數:</span>
              {[
                { r: 1, label: '原價' },
                { r: 0.6, label: '6折' },
                { r: 0.28, label: '2.8折' },
                { r: 0, label: '免手續費' },
              ].map(d => (
                <button
                  key={d.r}
                  type="button"
                  className="cat-pill"
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.72rem',
                    background: discountRate === d.r ? 'var(--accent-blue)' : 'var(--bg-input)',
                    color: discountRate === d.r ? '#fff' : 'var(--text-secondary)',
                  }}
                  onClick={() => applyDiscount(d.r)}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: action === 'sell' ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
              <div>
                <label className="modal-label" style={{ fontSize: '0.72rem' }}>手續費 (TWD)</label>
                <input
                  type="number"
                  min="0"
                  className="modal-input"
                  style={{ padding: '0.6rem' }}
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                />
              </div>
              {action === 'sell' && (
                <div>
                  <label className="modal-label" style={{ fontSize: '0.72rem' }}>證券交易稅 (TWD)</label>
                  <input
                    type="number"
                    min="0"
                    className="modal-input"
                    style={{ padding: '0.6rem' }}
                    value={tax}
                    onChange={e => setTax(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Real-time preview of Total Amount */}
          <div style={{
            background: action === 'buy' ? 'var(--accent-blue-dim)' : 'var(--accent-green-dim)',
            border: `1px solid ${action === 'buy' ? 'var(--accent-blue)' : 'var(--accent-green)'}`,
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {action === 'buy' ? '預計扣款總金額 (含手續費)' : '預計實收總金額 (扣除稅費)'}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                NT$ {new Intl.NumberFormat('zh-TW').format(Math.round(totalAmount))}
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              本金: ${new Intl.NumberFormat('zh-TW').format(Math.round(turnover))}
            </div>
          </div>

          {/* Notes */}
          <div className="modal-field">
            <label className="modal-label">交易備註（選填）</label>
            <input
              type="text"
              className="modal-input"
              placeholder="例如：定期定額、波段停利..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-btn-row">
            <button type="button" className="modal-btn cancel" onClick={onClose}>
              取消
            </button>
            <button
              type="submit"
              className="modal-btn save"
              style={{
                background: action === 'buy' ? 'var(--accent-blue)' : 'var(--accent-red)',
              }}
            >
              {isEditing ? '儲存修改' : action === 'buy' ? '確認買進' : '確認賣出'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
