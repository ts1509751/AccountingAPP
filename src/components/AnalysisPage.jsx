import { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import BudgetModal from './BudgetModal';
import { ChevronRight, ChevronLeft, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const formatMoney = (n) =>
  new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(n);

const formatRaw = (n) =>
  new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(n);

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function AnalysisPage() {
  const {
    viewYear,
    viewMonth,
    setViewMonth,
    prevMonth,
    nextMonth,
    prevYear,
    nextYear,
    income,
    expense,
    balance,
    currentBudget,
    budgetRemaining,
    budgetUsedPercent,
    yearlyIncome,
    yearlyExpense,
    yearlyBalance,
    yearlyMonthlyBreakdown,
    allYearsSummary,
  } = useExpense();

  // Mode: 'month' (月度分析) or 'year' (年度分析)
  const [analysisMode, setAnalysisMode] = useState('month');
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Circular gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const percentClamped = Math.min(Math.max(budgetUsedPercent, 0), 100);
  const strokeDashoffset = currentBudget > 0
    ? circumference - (percentClamped / 100) * circumference
    : circumference;

  const isOverBudget = currentBudget > 0 && expense > currentBudget;

  return (
    <div className="analysis-page-container">
      {/* ── Top Segmented Toggle (Matching Image: 分析 / 帳戶 or 月度 / 年度) ── */}
      <div className="analysis-top-toggle">
        <button
          className={`analysis-toggle-btn ${analysisMode === 'month' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('month')}
        >
          月度分析
        </button>
        <button
          className={`analysis-toggle-btn ${analysisMode === 'year' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('year')}
        >
          年度分析
        </button>
      </div>

      {/* ── Mode 1: 月度分析 ── */}
      {analysisMode === 'month' && (
        <>
          {/* Card 1: 每月統計 */}
          <div className="analysis-card">
            <div className="analysis-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="card-title-main">每月統計 - {MONTH_NAMES[viewMonth]}</span>
              </div>
              <div className="card-month-stepper">
                <button className="stepper-btn" onClick={prevMonth} title="上一月">
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {viewYear}年
                </span>
                <button className="stepper-btn" onClick={nextMonth} title="下一月">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="analysis-stats-row">
              <div className="stats-col">
                <span className="stats-label">支出</span>
                <span className="stats-val expense-val">{formatRaw(expense)}</span>
              </div>
              <div className="stats-col">
                <span className="stats-label">收入</span>
                <span className="stats-val income-val">{formatRaw(income)}</span>
              </div>
              <div className="stats-col">
                <span className="stats-label">結餘</span>
                <span className={`stats-val ${balance >= 0 ? 'balance-pos' : 'balance-neg'}`}>
                  {formatRaw(balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: 每月預算 (Styled directly from screenshot) */}
          <div className="analysis-card budget-card-interactive" onClick={() => setShowBudgetModal(true)}>
            <div className="analysis-card-header">
              <span className="card-title-main">每月預算</span>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {currentBudget > 0 ? '點擊修改' : '點擊設定'} <ChevronRight size={16} />
              </span>
            </div>

            <div className="budget-content-grid">
              {/* Left Column: 預算、支出、虛線、剩餘 */}
              <div className="budget-left-details">
                <div className="budget-detail-item">
                  <span className="b-label">預算：</span>
                  <span className="b-val">{currentBudget > 0 ? formatRaw(currentBudget) : '0'}</span>
                </div>
                <div className="budget-detail-item">
                  <span className="b-label">支出：</span>
                  <span className="b-val">{formatRaw(expense)}</span>
                </div>

                <div className="budget-dashed-line" />

                <div className="budget-detail-item">
                  <span className="b-label">{isOverBudget ? '超支：' : '剩餘：'}</span>
                  <span className={`b-val ${isOverBudget ? 'text-danger' : currentBudget > 0 ? 'text-success' : ''}`}>
                    {currentBudget > 0 ? formatRaw(Math.abs(budgetRemaining)) : '0'}
                  </span>
                </div>
              </div>

              {/* Right Column: Circular Progress Gauge */}
              <div className="budget-right-gauge">
                <div className="gauge-wrapper">
                  <svg width="104" height="104" viewBox="0 0 104 104">
                    {/* Track Circle */}
                    <circle
                      cx="52"
                      cy="52"
                      r={radius}
                      fill="transparent"
                      stroke="var(--bg-pill)"
                      strokeWidth="8"
                    />
                    {/* Progress Circle */}
                    {currentBudget > 0 && (
                      <circle
                        cx="52"
                        cy="52"
                        r={radius}
                        fill="transparent"
                        stroke={isOverBudget ? 'var(--accent-red)' : 'var(--accent-blue)'}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 52 52)"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    )}
                  </svg>
                  <div className="gauge-center-text">
                    {currentBudget > 0 ? (
                      <>
                        <span className={`gauge-pct ${isOverBudget ? 'text-danger' : ''}`}>
                          {budgetUsedPercent}%
                        </span>
                        <span className="gauge-sub">
                          {isOverBudget ? '已超支' : '預算使用'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="gauge-pct" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>--</span>
                        <span className="gauge-sub">預算設定</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 各月份收支歷程 (該年 1~12 月趨勢一覽) */}
          <div className="analysis-card">
            <div className="analysis-card-header">
              <span className="card-title-main">{viewYear} 年度各月結餘明細</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>點擊切換月份</span>
            </div>

            <div className="monthly-history-list">
              {yearlyMonthlyBreakdown.map(item => (
                <div
                  key={item.monthStr}
                  className={`month-history-row ${item.monthIndex === viewMonth ? 'selected-month-row' : ''}`}
                  onClick={() => setViewMonth(item.monthIndex)}
                >
                  <div className="mh-left">
                    <span className="mh-month-name">{item.monthName}</span>
                    <span className="mh-count">{item.count} 筆紀錄</span>
                  </div>
                  <div className="mh-right">
                    <div className="mh-amount-pair">
                      <span className="mh-expense">支 {formatRaw(item.expense)}</span>
                      <span className="mh-income">收 {formatRaw(item.income)}</span>
                    </div>
                    <span className={`mh-balance ${item.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                      {item.balance >= 0 ? '+' : ''}{formatMoney(item.balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Mode 2: 年度分析 ── */}
      {analysisMode === 'year' && (
        <>
          {/* Card 1: 年度總計 */}
          <div className="analysis-card">
            <div className="analysis-card-header">
              <span className="card-title-main">年度總計 - {viewYear} 年</span>
              <div className="card-month-stepper">
                <button className="stepper-btn" onClick={prevYear} title="前一年">
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {viewYear}
                </span>
                <button className="stepper-btn" onClick={nextYear} title="後一年">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="analysis-stats-row">
              <div className="stats-col">
                <span className="stats-label">整年支出</span>
                <span className="stats-val expense-val">{formatMoney(yearlyExpense)}</span>
              </div>
              <div className="stats-col">
                <span className="stats-label">整年收入</span>
                <span className="stats-val income-val">{formatMoney(yearlyIncome)}</span>
              </div>
              <div className="stats-col">
                <span className="stats-label">整年淨結餘</span>
                <span className={`stats-val ${yearlyBalance >= 0 ? 'balance-pos' : 'balance-neg'}`}>
                  {formatMoney(yearlyBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: 歷年結餘匯總列表 */}
          <div className="analysis-card">
            <div className="analysis-card-header">
              <span className="card-title-main">歷年收支結餘概覽</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>全紀錄匯總</span>
            </div>

            <div className="monthly-history-list">
              {allYearsSummary.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  目前尚無記帳資料
                </div>
              ) : (
                allYearsSummary.map(y => (
                  <div key={y.year} className="month-history-row">
                    <div className="mh-left">
                      <span className="mh-month-name" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                        {y.year} 年
                      </span>
                      <span className="mh-count">累計 {y.count} 筆紀錄</span>
                    </div>
                    <div className="mh-right">
                      <div className="mh-amount-pair">
                        <span className="mh-expense">總支出 {formatMoney(y.expense)}</span>
                        <span className="mh-income">總收入 {formatMoney(y.income)}</span>
                      </div>
                      <span className={`mh-balance ${y.balance >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.05rem' }}>
                        {y.balance >= 0 ? '+' : ''}{formatMoney(y.balance)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Budget modal */}
      {showBudgetModal && <BudgetModal onClose={() => setShowBudgetModal(false)} />}
    </div>
  );
}
