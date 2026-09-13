import { useExpense } from '../context/ExpenseContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useExpense();

  return (
    <button className="theme-toggle glass" onClick={toggleTheme} aria-label="切換主題">
      {theme === 'dark' ? <Sun size={20} color="#f8fafc" /> : <Moon size={20} color="#1f2937" />}
    </button>
  );
}
