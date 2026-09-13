import { useExpense } from '../context/ExpenseContext';
import { Calendar } from 'lucide-react';

export default function MonthFilter() {
  const { selectedMonth, setSelectedMonth, availableMonths } = useExpense();

  return (
    <div className="glass month-filter" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Calendar size={20} className="text-primary" />
        <h3 style={{ margin: 0 }}>選擇月份</h3>
      </div>
      <div className="select-wrapper">
        <select 
          className="input-glass"
          style={{ width: 'auto', minWidth: '150px' }}
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="all">全部時間</option>
          {availableMonths.map(month => (
            <option key={month} value={month}>{month.replace('-', '年 ')}月</option>
          ))}
        </select>
      </div>
    </div>
  );
}
