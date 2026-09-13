import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ExpenseContext = createContext();

export const useExpense = () => useContext(ExpenseContext);

const DEFAULT_CATEGORIES = [
  '餐飲', '交通', '娛樂', '購物', '薪水', '生活', '投資'
];

export const ExpenseProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addTransaction = (transaction) => {
    setTransactions([{ ...transaction, id: uuidv4() }, ...transactions]);
  };

  const updateTransaction = (id, updatedData) => {
    setTransactions(transactions.map(t => t.id === id ? { ...updatedData, id } : t));
    setEditingTransaction(null);
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
    if (editingTransaction?.id === id) setEditingTransaction(null);
  };

  const addCategory = (category) => {
    if (category && !categories.includes(category)) setCategories([...categories, category]);
  };

  const deleteCategory = (category) => setCategories(categories.filter(c => c !== category));

  const availableMonths = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort().reverse();

  const filteredTransactions = selectedMonth === 'all' 
    ? transactions 
    : transactions.filter(t => t.date.startsWith(selectedMonth));

  const income = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const expense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const balance = income - expense;

  const value = {
    theme, toggleTheme,
    transactions, filteredTransactions, 
    addTransaction, updateTransaction, deleteTransaction,
    editingTransaction, setEditingTransaction,
    categories, addCategory, deleteCategory,
    income, expense, balance,
    selectedMonth, setSelectedMonth, availableMonths
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};
