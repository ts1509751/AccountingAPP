import { useExpense } from '../context/ExpenseContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Chart() {
  const { filteredTransactions, theme } = useExpense();

  // Calculate expenses by category
  const expenseData = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += Number(t.amount);
      } else {
        acc.push({ name: t.category, value: Number(t.amount) });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (expenseData.length === 0) {
    return null;
  }

  const textColor = theme === 'dark' ? '#f8fafc' : '#1f2937';

  return (
    <div className="glass chart-container">
      <h3>支出分佈</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={expenseData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {expenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.2)" />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(value)}
              contentStyle={{ 
                backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                color: textColor
              }}
              itemStyle={{ color: textColor }}
            />
            <Legend wrapperStyle={{ color: textColor }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
