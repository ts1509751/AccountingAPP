import { useExpense } from '../context/ExpenseContext';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function Dashboard() {
  const { income, expense, balance } = useExpense();

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="dashboard-grid">
      <div className="glass summary-card">
        <div className="card-header">
          <h3>總結餘</h3>
          <div className="icon-wrapper balance-icon">
            <DollarSign size={24} />
          </div>
        </div>
        <h2 className={balance >= 0 ? 'text-primary' : 'text-danger'}>{formatMoney(balance)}</h2>
      </div>

      <div className="glass summary-card">
        <div className="card-header">
          <h3>總收入</h3>
          <div className="icon-wrapper success-icon">
            <TrendingUp size={24} />
          </div>
        </div>
        <h2 className="text-success">{formatMoney(income)}</h2>
      </div>

      <div className="glass summary-card">
        <div className="card-header">
          <h3>總支出</h3>
          <div className="icon-wrapper danger-icon">
            <TrendingDown size={24} />
          </div>
        </div>
        <h2 className="text-danger">{formatMoney(expense)}</h2>
      </div>
    </div>
  );
}
