import { useExpense } from '../context/ExpenseContext';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

const formatMoney = (n) =>
  new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(Math.abs(n));

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function BalanceHero() {
  const { balance, income, expense, viewYear, viewMonth, prevMonth, nextMonth, hideAmounts, toggleHideAmounts } = useExpense();

  return (
    <>
      {/* Balance */}
      <div className="balance-hero">
        <div className="balance-header-row">
          <span className="balance-title-label">本月總結餘</span>
          <button
            type="button"
            className="privacy-toggle-btn"
            onClick={toggleHideAmounts}
            title={hideAmounts ? '點擊顯示金額' : '點擊隱藏金額'}
            aria-label={hideAmounts ? '點擊顯示金額' : '點擊隱藏金額'}
          >
            {hideAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{hideAmounts ? '隱藏中' : '顯示中'}</span>
          </button>
        </div>
        <div className={`balance-amount ${hideAmounts ? 'masked' : ''} ${balance < 0 ? 'negative' : ''}`}>
          {hideAmounts ? '••••••' : (balance < 0 ? `-${formatMoney(balance)}` : formatMoney(balance))}
        </div>
        <div className="balance-sub">
          <span><span className="dot-green" /> 收入 {hideAmounts ? '••••' : formatMoney(income)}</span>
          <span><span className="dot-red" /> 支出 {hideAmounts ? '••••' : formatMoney(expense)}</span>
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
