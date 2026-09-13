import ThemeToggle from './components/ThemeToggle';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Chart from './components/Chart';
import MonthFilter from './components/MonthFilter';
import Login from './components/Login';
import { useExpense } from './context/ExpenseContext';
import { LogOut } from 'lucide-react';

function App() {
  const { user, authLoading, dataLoading, logout } = useExpense();

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>載入中...</h2>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <ThemeToggle />
      <main className="app-container">
        <header className="app-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ textAlign: 'left' }}>
              <h1 className="title-glass" style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>Expense Tracker</h1>
              <p className="subtitle" style={{ margin: 0 }}>歡迎，{user.displayName || '使用者'}</p>
            </div>
            <button className="btn btn-outline" onClick={logout}>
              <LogOut size={18} /> 登出
            </button>
          </div>
        </header>

        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>正在載入雲端資料...</div>
        ) : (
          <>
            <MonthFilter />
            <Dashboard />
            <div className="main-content-grid">
              <div className="left-column">
                <TransactionForm />
                <Chart />
              </div>
              <div className="right-column">
                <TransactionList />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default App;
