import { useState } from 'react';
import { useExpense } from './context/ExpenseContext';
import Login from './components/Login';
import BalanceHero from './components/BalanceHero';
import TransactionList from './components/TransactionList';
import QuickAddPanel from './components/QuickAddPanel';
import EditModal from './components/EditModal';
import ChartPage from './components/Chart';
import SettingsModal from './components/SettingsModal';
import { BookOpen, BarChart2, Plus } from 'lucide-react';

function App() {
  const { user, authLoading, dataLoading } = useExpense();
  const [tab, setTab] = useState('ledger');
  const [showAdd, setShowAdd] = useState(false);
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
      <div className="app-bar">
        <span className="app-bar-title">
          {tab === 'ledger' ? '我的帳本' : '統計圖表'}
        </span>
        <SettingsModal />
      </div>

      {/* ── Scrollable Body ── */}
      <div className="app-body">
        {dataLoading ? (
          <div className="loading-screen" style={{ height: '60vh' }}>
            <div className="spinner" />
            <span>同步雲端資料...</span>
          </div>
        ) : tab === 'ledger' ? (
          <>
            <BalanceHero />
            <TransactionList onEdit={(tx) => setEditingTx(tx)} />
          </>
        ) : (
          <>
            <BalanceHero />
            <ChartPage />
          </>
        )}
      </div>

      {/* ── Bottom Navigation ── */}
      <div className="bottom-nav">
        <button className={`nav-tab ${tab === 'ledger' ? 'active' : ''}`} onClick={() => setTab('ledger')}>
          <BookOpen size={22} />
          帳本
        </button>

        {/* FAB-style Add button */}
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'var(--accent-blue)',
            border: 'none',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(74,158,255,0.45)',
            alignSelf: 'center',
            flexShrink: 0,
            transition: 'var(--transition)',
            marginBottom: '4px',
          }}
          aria-label="新增記帳"
        >
          <Plus size={26} />
        </button>

        <button className={`nav-tab ${tab === 'chart' ? 'active' : ''}`} onClick={() => setTab('chart')}>
          <BarChart2 size={22} />
          圖表
        </button>
      </div>

      {/* ── Overlays ── */}
      {showAdd && <QuickAddPanel onClose={() => setShowAdd(false)} />}
      {editingTx && <EditModal transaction={editingTx} onClose={() => setEditingTx(null)} />}
    </div>
  );
}

export default App;
