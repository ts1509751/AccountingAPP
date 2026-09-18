import { useState, useMemo } from 'react';
import { useInvestment } from '../../context/InvestmentContext';
import InvestmentModal from './InvestmentModal';
import { Plus, TrendingUp, TrendingDown, DollarSign, Edit2, Trash2, Layers, History, ArrowDownRight, ArrowUpRight, Search, X, ChevronRight } from 'lucide-react';

const formatMoney = (n) =>
  new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(n);

const formatRaw = (n) =>
  new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(n);

// Normalize query: full-width to half-width, lowercase, trim
function normalizeQuery(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\uFF10-\uFF19]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[\uFF21-\uFF3A]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[\uFF41-\uFF5A]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .trim()
    .toLowerCase();
}

export default function InvestmentPage({ externalOpenAdd, onCloseExternalAdd }) {
  const {
    investments,
    loading,
    holdings,
    totalCostBasis,
    totalRealizedPnL,
    deleteInvestment,
  } = useInvestment();

  const [activeTab, setActiveTab] = useState('holdings'); // 'holdings' | 'history'
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isModalOpen = showModal || Boolean(externalOpenAdd);

  const handleClose = () => {
    setShowModal(false);
    setEditingTx(null);
    if (onCloseExternalAdd) onCloseExternalAdd();
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setShowModal(true);
  };

  const handleOpenAdd = () => {
    setEditingTx(null);
    setShowModal(true);
  };

  // Switch to history tab and filter by stock symbol
  const handleViewStockHistory = (sym) => {
    setSearchQuery(sym);
    setActiveTab('history');
  };

  // Filter open holdings (currently holding shares > 0)
  const openHoldings = holdings.filter(h => h.currentShares > 0);
  const closedHoldings = holdings.filter(h => h.currentShares === 0 && (h.sellCount > 0));

  // Extract all unique stock symbols from investments
  const allSymbols = useMemo(() => {
    const set = new Set();
    investments.forEach(tx => {
      if (tx.symbol) set.add(tx.symbol);
    });
    return Array.from(set);
  }, [investments]);

  // Filter investments by search query (symbol or notes)
  const normalizedSearch = normalizeQuery(searchQuery);
  const filteredInvestments = useMemo(() => {
    if (!normalizedSearch) return investments;
    return investments.filter(tx => {
      const sym = normalizeQuery(tx.symbol || '');
      const notes = normalizeQuery(tx.notes || '');
      return sym.includes(normalizedSearch) || notes.includes(normalizedSearch);
    });
  }, [investments, normalizedSearch]);

  // Compute breakdown metrics for queried stock
  const summaryStats = useMemo(() => {
    if (!normalizedSearch || filteredInvestments.length === 0) return null;

    let buyShares = 0;
    let buyAmount = 0;
    let buyTurnover = 0;
    let sellShares = 0;
    let sellAmount = 0;
    let totalFees = 0;
    let totalTaxes = 0;

    filteredInvestments.forEach(tx => {
      const shares = Number(tx.shares || 0);
      const turnover = Number(tx.turnover || (tx.price * shares) || 0);
      const fee = Number(tx.fee || 0);
      const tax = Number(tx.tax || 0);
      totalFees += fee;
      totalTaxes += tax;

      if (tx.action === 'buy') {
        buyShares += shares;
        buyTurnover += turnover;
        buyAmount += Number(tx.totalAmount || (turnover + fee));
      } else if (tx.action === 'sell') {
        sellShares += shares;
        sellAmount += Number(tx.totalAmount || (turnover - fee - tax));
      }
    });

    const remainingShares = Math.max(0, buyShares - sellShares);
    const avgBuyPrice = buyShares > 0 ? (buyTurnover / buyShares) : 0;
    const estimatedHoldingCost = remainingShares > 0 ? Math.floor(avgBuyPrice * remainingShares) : 0;

    // Look for matching holding for realized PnL
    const matchedHolding = holdings.find(h =>
      normalizeQuery(h.symbol).includes(normalizedSearch) ||
      normalizedSearch.includes(normalizeQuery(h.symbol))
    );

    return {
      buyShares,
      buyAmount: Math.floor(buyAmount),
      buyTurnover: Math.floor(buyTurnover),
      avgBuyPrice,
      sellShares,
      sellAmount: Math.floor(sellAmount),
      remainingShares,
      estimatedHoldingCost,
      totalFees: Math.floor(totalFees),
      totalTaxes: Math.floor(totalTaxes),
      realizedPnL: matchedHolding ? matchedHolding.realizedPnL : null,
      matchedHolding,
    };
  }, [filteredInvestments, normalizedSearch, holdings]);

  return (
    <div className="investment-page-container">
      {/* ── Top Portfolio Overview Cards ── */}
      <div className="investment-hero-grid">
        <div className="desktop-card investment-hero-card">
          <div className="inv-hero-header">
            <span className="inv-hero-label">目前持股總成本</span>
            <span className="inv-badge-blue">庫存本金</span>
          </div>
          <div className="inv-hero-val">{formatMoney(totalCostBasis)}</div>
          <div className="inv-hero-sub">共持有 {openHoldings.length} 檔標的</div>
        </div>

        <div className="desktop-card investment-hero-card">
          <div className="inv-hero-header">
            <span className="inv-hero-label">累計已實現損益</span>
            <span className={totalRealizedPnL >= 0 ? 'inv-badge-green' : 'inv-badge-red'}>
              {totalRealizedPnL >= 0 ? '獲利結算' : '虧損結算'}
            </span>
          </div>
          <div className={`inv-hero-val ${totalRealizedPnL >= 0 ? 'text-success' : 'text-danger'}`}>
            {totalRealizedPnL >= 0 ? '+' : ''}{formatMoney(totalRealizedPnL)}
          </div>
          <div className="inv-hero-sub">已結算賣出之盈虧</div>
        </div>
      </div>

      {/* ── Action & Subtab Bar ── */}
      <div className="investment-nav-row">
        <div className="analysis-top-toggle" style={{ margin: 0, maxWidth: '280px' }}>
          <button
            className={`analysis-toggle-btn ${activeTab === 'holdings' ? 'active' : ''}`}
            onClick={() => setActiveTab('holdings')}
          >
            <Layers size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            持股庫存 ({openHoldings.length})
          </button>
          <button
            className={`analysis-toggle-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            交易明細 ({investments.length})
          </button>
        </div>

        <button className="inv-action-add-btn" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>記一筆投資</span>
        </button>
      </div>

      {/* ── Subtab 1: 目前持股庫存 (Holdings) ── */}
      {activeTab === 'holdings' && (
        <div className="holdings-view">
          {openHoldings.length === 0 ? (
            <div className="empty-tx desktop-card" style={{ padding: '3.5rem 1rem' }}>
              <div style={{ fontSize: '3rem' }}>📈</div>
              <p style={{ fontWeight: 600, marginTop: '0.75rem' }}>目前尚未持有任何股票或基金</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                點擊上方「記一筆投資」開始記錄您的第一筆買進吧！
              </p>
            </div>
          ) : (
            <div className="holdings-cards-grid">
              {openHoldings.map(h => (
                <div key={h.symbol} className="desktop-card holding-card">
                  <div className="holding-card-top">
                    <div>
                      <div className="holding-symbol">{h.symbol}</div>
                      <span className="holding-type-tag">
                        {h.assetType === 'etf' ? '📊 ETF' : h.assetType === 'fund' ? '🌱 基金' : '📈 股票'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="holding-shares-count">{formatRaw(h.currentShares)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>股</span></div>
                      <div className="holding-sub-label">持有股數</div>
                    </div>
                  </div>

                  <div className="holding-stats-grid">
                    <div className="holding-stat-item">
                      <span className="h-stat-label">平均成本價</span>
                      <span className="h-stat-val">${h.avgPrice.toFixed(2)}</span>
                    </div>
                    <div className="holding-stat-item">
                      <span className="h-stat-label">總持股成本</span>
                      <span className="h-stat-val">{formatMoney(h.totalCost)}</span>
                    </div>
                    <div className="holding-stat-item">
                      <span className="h-stat-label">已實現損益</span>
                      <span className={`h-stat-val ${h.realizedPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                        {h.realizedPnL >= 0 ? '+' : ''}{formatMoney(h.realizedPnL)}
                      </span>
                    </div>
                  </div>

                  {/* Quick drill-down to history */}
                  <button
                    type="button"
                    className="holding-view-detail-btn"
                    onClick={() => handleViewStockHistory(h.symbol)}
                  >
                    <span>查看各項交易明細</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Closed positions if any */}
          {closedHoldings.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <span className="prompt-title">已出清標的歷史</span>
              <div className="holdings-cards-grid" style={{ marginTop: '0.5rem' }}>
                {closedHoldings.map(h => (
                  <div key={h.symbol} className="desktop-card holding-card" style={{ opacity: 0.85 }}>
                    <div className="holding-card-top">
                      <div>
                        <div className="holding-symbol">{h.symbol}</div>
                        <span className="holding-type-tag" style={{ background: 'var(--bg-pill)' }}>已出清</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className={`holding-shares-count ${h.realizedPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                          {h.realizedPnL >= 0 ? '+' : ''}{formatMoney(h.realizedPnL)}
                        </div>
                        <div className="holding-sub-label">最終實現損益</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="holding-view-detail-btn"
                      onClick={() => handleViewStockHistory(h.symbol)}
                    >
                      <span>查看歷史買賣紀錄</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Subtab 2: 交易紀錄明細 (History) ── */}
      {activeTab === 'history' && (
        <div className="desktop-card investment-history-card">
          {/* Search bar & filter chips */}
          <div className="list-search-container" style={{ marginBottom: '0.85rem' }}>
            <div className="list-search-input-wrapper">
              <Search size={16} className="list-search-icon" />
              <input
                type="text"
                className="list-search-input"
                placeholder="輸入代號或名稱查詢 (例如: 2330, 0050, 台積電)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="list-search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="清除搜尋"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Quick stock chips */}
            {allSymbols.length > 0 && (
              <div className="stock-chips-scroll">
                <button
                  type="button"
                  className={`stock-filter-chip ${!searchQuery ? 'active' : ''}`}
                  onClick={() => setSearchQuery('')}
                >
                  全部 ({investments.length})
                </button>
                {allSymbols.map(sym => (
                  <button
                    key={sym}
                    type="button"
                    className={`stock-filter-chip ${searchQuery === sym ? 'active' : ''}`}
                    onClick={() => setSearchQuery(sym === searchQuery ? '' : sym)}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Queried Stock Detail Summary Card */}
          {summaryStats && (
            <div className="stock-detail-summary-card">
              <div className="stock-summary-header">
                <div className="stock-summary-title">
                  <span className="stock-summary-name">
                    {summaryStats.matchedHolding ? summaryStats.matchedHolding.symbol : searchQuery}
                  </span>
                  <span className="stock-summary-badge">各項明細彙整</span>
                </div>
                <span className="stock-summary-count">共 {filteredInvestments.length} 筆交易紀錄</span>
              </div>

              <div className="stock-summary-metrics-grid">
                <div className="stock-summary-metric">
                  <div className="metric-lbl">累計買進</div>
                  <div className="metric-val">{formatRaw(summaryStats.buyShares)} <span className="metric-unit">股</span></div>
                  <div className="metric-sub">總支出 {formatMoney(summaryStats.buyAmount)} (均價 ${summaryStats.avgBuyPrice.toFixed(2)})</div>
                </div>

                <div className="stock-summary-metric">
                  <div className="metric-lbl">累計賣出</div>
                  <div className="metric-val">{formatRaw(summaryStats.sellShares)} <span className="metric-unit">股</span></div>
                  <div className="metric-sub">實收回款 {formatMoney(summaryStats.sellAmount)}</div>
                </div>

                <div className="stock-summary-metric">
                  <div className="metric-lbl">目前剩餘庫存</div>
                  <div className={`metric-val ${summaryStats.remainingShares > 0 ? 'text-primary' : 'text-muted'}`}>
                    {formatRaw(summaryStats.remainingShares)} <span className="metric-unit">股</span>
                  </div>
                  <div className="metric-sub">
                    {summaryStats.remainingShares > 0
                      ? `庫存成本 ${formatMoney(summaryStats.estimatedHoldingCost)}`
                      : '已全數結清'}
                  </div>
                </div>

                <div className="stock-summary-metric">
                  <div className="metric-lbl">累計稅費支出</div>
                  <div className="metric-val">{formatMoney(summaryStats.totalFees + summaryStats.totalTaxes)}</div>
                  <div className="metric-sub">
                    手續費 ${formatRaw(summaryStats.totalFees)} {summaryStats.totalTaxes > 0 ? `· 證交稅 $${formatRaw(summaryStats.totalTaxes)}` : ''}
                  </div>
                </div>

                {summaryStats.realizedPnL !== null && (
                  <div className="stock-summary-metric" style={{ gridColumn: '1 / -1' }}>
                    <div className="metric-lbl">已結算實現損益</div>
                    <div className={`metric-val ${summaryStats.realizedPnL >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.25rem' }}>
                      {summaryStats.realizedPnL >= 0 ? '+' : ''}{formatMoney(summaryStats.realizedPnL)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transaction list */}
          {filteredInvestments.length === 0 ? (
            <div className="empty-tx" style={{ padding: '3rem 1rem' }}>
              <div style={{ fontSize: '3rem' }}>🔍</div>
              <p style={{ fontWeight: 600, marginTop: '0.6rem' }}>
                {normalizedSearch ? `找不到代號或名稱符合「${searchQuery}」的交易紀錄` : '尚無投資買賣紀錄'}
              </p>
              {normalizedSearch && (
                <button
                  type="button"
                  className="scope-switch-prompt-btn"
                  onClick={() => setSearchQuery('')}
                >
                  清除篩選，查看全部交易紀錄
                </button>
              )}
            </div>
          ) : (
            <div className="tx-list">
              {filteredInvestments.map(tx => (
                <div key={tx.id} className="tx-item investment-tx-item">
                  <div className={`tx-icon ${tx.action === 'buy' ? 'inv-action-buy' : 'inv-action-sell'}`}>
                    {tx.action === 'buy' ? <ArrowDownRight size={22} /> : <ArrowUpRight size={22} />}
                  </div>

                  <div className="tx-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="tx-name">{tx.symbol}</span>
                      <span className={tx.action === 'buy' ? 'inv-badge-green' : 'inv-badge-red'}>
                        {tx.action === 'buy' ? '買進' : '賣出'}
                      </span>
                    </div>
                    <div className="tx-meta">
                      {tx.date} · 單價 ${formatRaw(tx.price)} · {formatRaw(tx.shares)} 股
                    </div>
                    {(tx.fee > 0 || tx.tax > 0) && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        手續費: ${formatRaw(tx.fee)} {tx.tax > 0 ? `· 證交稅: $${formatRaw(tx.tax)}` : ''}
                      </div>
                    )}
                    {tx.notes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                        💬 {tx.notes}
                      </div>
                    )}
                  </div>

                  <div className="tx-right">
                    <div className={`tx-amount ${tx.action === 'buy' ? 'expense' : 'income'}`}>
                      {tx.action === 'buy' ? '-' : '+'}{formatMoney(tx.totalAmount)}
                    </div>
                    <div className="tx-action-btns">
                      <button className="tx-mini-btn edit" onClick={() => handleEdit(tx)} aria-label="編輯">
                        <Edit2 size={13} />
                      </button>
                      <button className="tx-mini-btn" onClick={() => deleteInvestment(tx.id)} aria-label="刪除">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Investment Modal */}
      {isModalOpen && (
        <InvestmentModal
          transaction={editingTx}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

