import { useState } from 'react';
import { useExpense } from './context/ExpenseContext';
import Login from './components/Login';
import BalanceHero from './components/BalanceHero';
import TransactionList from './components/TransactionList';
import QuickAddPanel from './components/QuickAddPanel';
import EditModal from './components/EditModal';
import ChartPage from './components/Chart';
import AnalysisPage from './components/AnalysisPage';
import InvestmentPage from './components/investment/InvestmentPage';
import SettingsModal from './components/SettingsModal';
import { Home, BarChart2, FileText, TrendingUp, Plus, Sparkles, Check } from 'lucide-react';
import appLogo from './assets/logo.png';

const formatMoney = (n) =>
  new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(Math.abs(n));

function App() {
  const { user, authLoading, dataLoading, successAnim } = useExpense();
  const [tab, setTab] = useState('ledger');
  const [showAdd, setShowAdd] = useState(false);
  const [showInvestmentAdd, setShowInvestmentAdd] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  if (authLoading) {
    return (
      <div className="app-shell">
        <div className="loading-screen">
          <div className="spinner" />
          <span>載入中...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="app-shell">
      {/* ── Top App Bar ── */}
      <header className="app-bar">
        <div className="app-bar-left">
          <img src={appLogo} alt="Logo" className="app-bar-logo-img" />
          <span className="app-bar-title">我的記帳本</span>
        </div>


        {/* Desktop Navigation Tabs */}
        <nav className="desktop-nav-tabs">
          <button
            className={`desktop-tab ${tab === 'ledger' ? 'active' : ''}`}
            onClick={() => setTab('ledger')}
          >
            <Home size={18} />
            <span>首頁</span>
          </button>
          <button
            className={`desktop-tab ${tab === 'chart' ? 'active' : ''}`}
            onClick={() => setTab('chart')}
          >
            <BarChart2 size={18} />
            <span>統計圖表</span>
          </button>
          <button
            className={`desktop-tab ${tab === 'analysis' ? 'active' : ''}`}
            onClick={() => setTab('analysis')}
          >
            <FileText size={18} />
            <span>分析預算</span>
          </button>
          <button
            className={`desktop-tab ${tab === 'investment' ? 'active' : ''}`}
            onClick={() => setTab('investment')}
          >
            <TrendingUp size={18} />
            <span>投資理財</span>
          </button>
        </nav>

        {/* Right action group */}
        <div className="app-bar-right">
          {tab === 'investment' ? (
            <button
              className="desktop-add-btn"
              onClick={() => setShowInvestmentAdd(true)}
              title="新增投資紀錄"
            >
              <Plus size={18} />
              <span>投資</span>
            </button>
          ) : (
            <button
              className="desktop-add-btn"
              onClick={() => setShowAdd(true)}
              title="新增記帳"
            >
              <Plus size={18} />
              <span>記帳</span>
            </button>
          )}
          <SettingsModal />
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <main className="app-body">
        {dataLoading ? (
          <div className="loading-screen" style={{ height: '60vh' }}>
            <div className="spinner" />
            <span>同步雲端資料...</span>
          </div>
        ) : tab === 'ledger' ? (
          <div className="ledger-layout">
            <aside className="ledger-summary-col">
              <div className="desktop-card hero-card">
                <BalanceHero />
              </div>
              <div className="desktop-quick-prompt desktop-only">
                <p className="prompt-title">快捷操作</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                  <button className="desktop-prompt-btn" onClick={() => setShowAdd(true)}>
                    <Plus size={18} />
                    <span>記帳</span>
                  </button>
                  <button
                    className="desktop-prompt-btn"
                    onClick={() => setShowAdd(true)}
                    style={{ background: 'var(--accent-blue-dim)', borderColor: 'rgba(74, 158, 255, 0.3)', color: 'var(--accent-blue)' }}
                    title="輸入一句話自動辨識記帳"
                  >
                    <Sparkles size={16} />
                    <span>智慧記帳</span>
                  </button>
                </div>
              </div>
            </aside>
            <section className="ledger-tx-col">
              <div className="desktop-card tx-card">
                <TransactionList onEdit={(tx) => setEditingTx(tx)} />
              </div>
            </section>
          </div>
        ) : tab === 'chart' ? (
          <div className="chart-layout">
            <div className="desktop-card hero-card chart-hero-card">
              <BalanceHero />
            </div>
            <div className="chart-content-area">
              <ChartPage />
            </div>
          </div>
        ) : tab === 'analysis' ? (
          <div className="analysis-layout">
            <AnalysisPage />
          </div>
        ) : (
          <div className="investment-layout">
            <InvestmentPage
              externalOpenAdd={showInvestmentAdd}
              onCloseExternalAdd={() => setShowInvestmentAdd(false)}
            />
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Navigation (Hidden on Desktop) ── */}
      <nav className="bottom-nav mobile-only">
        <button className={`nav-tab ${tab === 'ledger' ? 'active' : ''}`} onClick={() => setTab('ledger')}>
          <Home size={19} />
          <span>首頁</span>
        </button>

        <button className={`nav-tab ${tab === 'chart' ? 'active' : ''}`} onClick={() => setTab('chart')}>
          <BarChart2 size={19} />
          <span>圖表</span>
        </button>

        {/* FAB-style Add button */}
        <button
          onClick={() => {
            if (tab === 'investment') {
              setShowInvestmentAdd(true);
            } else {
              setShowAdd(true);
            }
          }}
          className="mobile-fab-btn"
          aria-label={tab === 'investment' ? '新增投資紀錄' : '新增記帳'}
        >
          <Plus size={26} />
        </button>

        <button className={`nav-tab ${tab === 'analysis' ? 'active' : ''}`} onClick={() => setTab('analysis')}>
          <FileText size={19} />
          <span>報告</span>
        </button>

        <button className={`nav-tab ${tab === 'investment' ? 'active' : ''}`} onClick={() => setTab('investment')}>
          <TrendingUp size={19} />
          <span>投資</span>
        </button>
      </nav>

      {/* ── Micro-animation Success Toast ── */}
      {successAnim && (
        <div className="success-toast-banner" key={successAnim.key}>
          <div className="success-toast-icon-wrapper">
            <Check size={17} strokeWidth={3} />
          </div>
          <div className="success-toast-text">
            <span className="success-toast-title">記帳成功！</span>
            <span className="success-toast-sub">
              {successAnim.category} · {successAnim.type === 'expense' ? '-' : '+'}NT$ {formatMoney(successAnim.amount)}
            </span>
          </div>
        </div>
      )}

      {/* ── Overlays ── */}
      {showAdd && <QuickAddPanel onClose={() => setShowAdd(false)} />}
      {editingTx && <EditModal transaction={editingTx} onClose={() => setEditingTx(null)} />}
    </div>
  );
}

export default App;
