import { useExpense } from '../context/ExpenseContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const formatMoney = (n) =>
  new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(Math.abs(n));

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function BalanceHero() {
  const { balance, income, expense, viewYear, viewMonth, prevMonth, nextMonth } = useExpense();

  return (
    <>
      {/* Balance */}
      <div className="balance-hero">
        <div className="balance-amount">{formatMoney(balance)}</div>
        <div className="balance-sub">
          <span><span className="dot-green" /> 收入 {formatMoney(income)}</span>
          <span><span className="dot-red" /> 支出 {formatMoney(expense)}</span>
        </div>
      </div>

      {/* Month navigator */}
      <div className="month-nav">
        <button className="month-nav-btn" onClick={prevMonth}>
          <ChevronLeft size={16} />
        </button>
        <span className="month-nav-label">{viewYear} 年 {MONTH_NAMES[viewMonth]}</span>
        <button className="month-nav-btn" onClick={nextMonth}>
          <ChevronRight size={16} />
        </button>
      </div>
    </>
  );
}
