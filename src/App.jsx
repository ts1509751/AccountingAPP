import ThemeToggle from './components/ThemeToggle';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Chart from './components/Chart';
import MonthFilter from './components/MonthFilter';

function App() {
  return (
    <>
      <ThemeToggle />
      <main className="app-container">
        <header className="app-header">
          <h1 className="title-glass">My Expense Tracker</h1>
          <p className="subtitle">為您量身打造的專屬記帳網頁</p>
        </header>

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
      </main>
    </>
  );
}

export default App;
