import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from '../utils/categories';

const ExpenseContext = createContext();
export const useExpense = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // Derived month navigation state
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Categories persistence
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Firestore listener
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setDataLoading(false);
      return;
    }
    setDataLoading(true);
    const q = query(collection(db, 'transactions'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        return dateDiff !== 0 ? dateDiff : (b.createdAt || 0) - (a.createdAt || 0);
      });
      setTransactions(data);
      setDataLoading(false);
    });
    return unsub;
  }, [user]);

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');
  const logout = () => signOut(auth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  const filteredTransactions = useMemo(
    () => transactions.filter(t => t.date.startsWith(monthStr)),
    [transactions, monthStr]
  );

  const income  = useMemo(() => filteredTransactions.filter(t => t.type === 'income' ).reduce((s, t) => s + Number(t.amount), 0), [filteredTransactions]);
  const expense = useMemo(() => filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [filteredTransactions]);
  const balance = income - expense;

  const addTransaction = async (tx) => {
    if (!user) return;
    await addDoc(collection(db, 'transactions'), { ...tx, uid: user.uid, createdAt: Date.now() });
  };

  const updateTransaction = async (id, data) => {
    await updateDoc(doc(db, 'transactions', id), data);
  };

  const deleteTransaction = async (id) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  const addCategory = (cat) => {
    if (cat && !categories.includes(cat)) setCategories(prev => [...prev, cat]);
  };

  const value = {
    user, authLoading, dataLoading, logout,
    theme, toggleTheme,
    transactions, filteredTransactions,
    addTransaction, updateTransaction, deleteTransaction,
    categories, addCategory,
    income, expense, balance,
    viewYear, viewMonth, prevMonth, nextMonth, monthStr,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};
