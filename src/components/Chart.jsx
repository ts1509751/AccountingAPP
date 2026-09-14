import { useExpense } from '../context/ExpenseContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#4a9eff','#f87171','#34d399','#fbbf24','#a78bfa','#ec4899','#06b6d4','#f97316'];

const fmt = (v) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(v);

export default function ChartPage() {
  const { filteredTransactions, theme, viewYear, viewMonth } = useExpense();
  const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  const textColor = theme === 'dark' ? '#8888aa' : '#5a5a7a';
  const tooltipBg = theme === 'dark' ? '#1f1f2e' : '#ffffff';

  const expenseByCat = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const f = acc.find(x => x.name === t.category);
      if (f) f.value += Number(t.amount);
      else acc.push({ name: t.category, value: Number(t.amount) });
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  const incomeByCat = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      const f = acc.find(x => x.name === t.category);
      if (f) f.value += Number(t.amount);
      else acc.push({ name: t.category, value: Number(t.amount) });
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  const tooltipStyle = {
    backgroundColor: tooltipBg,
    border: '1px solid var(--border)',
    borderRadius: '12px',
    color: textColor,
  };

  if (filteredTransactions.length === 0) {
    return (
      <div className="chart-page">
        <div className="empty-tx" style={{ marginTop: '3rem' }}>
          <div style={{ fontSize: '3rem' }}>📊</div>
          <p>此月份尚無資料</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-page">
      {expenseByCat.length > 0 && (
        <div className="chart-card">
          <h3>💸 支出分佈（{viewYear} 年 {MONTH_NAMES[viewMonth]}）</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={expenseByCat} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value">
                {expenseByCat.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip formatter={fmt} contentStyle={tooltipStyle} itemStyle={{ color: textColor }} />
              <Legend wrapperStyle={{ color: textColor, fontSize: '0.8rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {incomeByCat.length > 0 && (
        <div className="chart-card">
          <h3>💵 收入分佈（{viewYear} 年 {MONTH_NAMES[viewMonth]}）</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={incomeByCat} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value">
                {incomeByCat.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip formatter={fmt} contentStyle={tooltipStyle} itemStyle={{ color: textColor }} />
              <Legend wrapperStyle={{ color: textColor, fontSize: '0.8rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
