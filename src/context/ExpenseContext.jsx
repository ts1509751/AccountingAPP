import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
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

  // Monthly budgets map: { '2026-09': 20000, ... }
  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem('budgets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
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

  // Custom Category Icons map: { '咖啡': '☕', ... }
  const [categoryIcons, setCategoryIcons] = useState(() => {
    try {
      const saved = localStorage.getItem('categoryIcons');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('categoryIcons', JSON.stringify(categoryIcons));
  }, [categoryIcons]);

  // Budgets persistence (local cache)
  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }, [budgets]);


  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Firestore transactions & budgets listener
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setDataLoading(false);
      return;
    }
    setDataLoading(true);

    // Transactions listener
    const q = query(collection(db, 'transactions'), where('uid', '==', user.uid));
    const unsubTx = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        return dateDiff !== 0 ? dateDiff : (b.createdAt || 0) - (a.createdAt || 0);
      });
      setTransactions(data);
      setDataLoading(false);
    });

    // Budgets listener
    const budgetDocRef = doc(db, 'user_budgets', user.uid);
    const unsubBudget = onSnapshot(budgetDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          if (data.budgets) {
            setBudgets(prev => ({ ...prev, ...data.budgets }));
          }
          if (data.categoryIcons) {
            setCategoryIcons(prev => ({ ...prev, ...data.categoryIcons }));
          }
        }
      }
    });

    return () => {
      unsubTx();
      unsubBudget();
    };
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

  const prevYear = () => setViewYear(y => y - 1);
  const nextYear = () => setViewYear(y => y + 1);

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  // Monthly filtered transactions
  const filteredTransactions = useMemo(
    () => transactions.filter(t => t.date.startsWith(monthStr)),
    [transactions, monthStr]
  );

  const income  = useMemo(() => filteredTransactions.filter(t => t.type === 'income' ).reduce((s, t) => s + Number(t.amount), 0), [filteredTransactions]);
  const expense = useMemo(() => filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [filteredTransactions]);
  const balance = income - expense;

  // Yearly filtered transactions for viewYear
  const yearStr = String(viewYear);
  const yearlyTransactions = useMemo(
    () => transactions.filter(t => t.date.startsWith(yearStr)),
    [transactions, yearStr]
  );
  const yearlyIncome  = useMemo(() => yearlyTransactions.filter(t => t.type === 'income' ).reduce((s, t) => s + Number(t.amount), 0), [yearlyTransactions]);
  const yearlyExpense = useMemo(() => yearlyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [yearlyTransactions]);
  const yearlyBalance = yearlyIncome - yearlyExpense;

  // Monthly breakdown for selected year (all 12 months)
  const yearlyMonthlyBreakdown = useMemo(() => {
    const list = [];
    for (let m = 0; m < 12; m++) {
      const mPrefix = `${viewYear}-${String(m + 1).padStart(2, '0')}`;
      const mTx = transactions.filter(t => t.date.startsWith(mPrefix));
      const mIncome = mTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const mExpense = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const mBalance = mIncome - mExpense;
      list.push({
        monthIndex: m,
        monthName: `${m + 1}月`,
        monthStr: mPrefix,
        income: mIncome,
        expense: mExpense,
        balance: mBalance,
        count: mTx.length,
      });
    }
    return list;
  }, [transactions, viewYear]);

  // All years summary
  const allYearsSummary = useMemo(() => {
    const yearMap = {};
    transactions.forEach(t => {
      const y = t.date.substring(0, 4);
      if (!yearMap[y]) yearMap[y] = { year: y, income: 0, expense: 0, count: 0 };
      if (t.type === 'income') yearMap[y].income += Number(t.amount);
      if (t.type === 'expense') yearMap[y].expense += Number(t.amount);
      yearMap[y].count++;
    });
    return Object.values(yearMap)
      .map(y => ({ ...y, balance: y.income - y.expense }))
      .sort((a, b) => Number(b.year) - Number(a.year));
  }, [transactions]);

  // Budget calculations for current month
  const currentBudget = Number(budgets[monthStr] || 0);
  const budgetRemaining = currentBudget > 0 ? currentBudget - expense : 0;
  const budgetUsedPercent = currentBudget > 0 ? Math.round((expense / currentBudget) * 100) : 0;

  const setBudget = async (targetMonthStr, amount) => {
    const numAmount = Number(amount) || 0;
    const updated = { ...budgets, [targetMonthStr]: numAmount };
    setBudgets(updated);

    if (user) {
      try {
        const budgetDocRef = doc(db, 'user_budgets', user.uid);
        await setDoc(budgetDocRef, { budgets: { [targetMonthStr]: numAmount } }, { merge: true });
      } catch (err) {
        console.error('Failed to sync budget to Firebase:', err);
      }
    }
  };

  const addTransaction = async (tx) => {
    if (!user) return;
    const paymentMethod = tx.paymentMethod || 'cash';
    await addDoc(collection(db, 'transactions'), {
      ...tx,
      paymentMethod,
      uid: user.uid,
      createdAt: Date.now(),
    });
  };

  const updateTransaction = async (id, data) => {
    await updateDoc(doc(db, 'transactions', id), data);
  };

  const deleteTransaction = async (id) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  const addCategory = async (cat, icon = '📌') => {
    if (!cat) return;
    const trimmed = cat.trim();
    if (!categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed]);
    }
    if (icon) {
      setCategoryIcons(prev => ({ ...prev, [trimmed]: icon }));
      if (user) {
        try {
          const budgetDocRef = doc(db, 'user_budgets', user.uid);
          await setDoc(budgetDocRef, { categoryIcons: { [trimmed]: icon } }, { merge: true });
        } catch (err) {
          console.error('Failed to sync category icon to Firebase:', err);
        }
      }
    }
  };

  const value = {
    user, authLoading, dataLoading, logout,
    theme, toggleTheme,
    transactions, filteredTransactions,
    addTransaction, updateTransaction, deleteTransaction,
    categories, addCategory, categoryIcons,
    income, expense, balance,
    viewYear, viewMonth, setViewYear, setViewMonth, prevMonth, nextMonth, prevYear, nextYear, monthStr,
    // Budget & Analysis additions
    budgets, setBudget, currentBudget, budgetRemaining, budgetUsedPercent,
    yearlyIncome, yearlyExpense, yearlyBalance, yearlyMonthlyBreakdown, allYearsSummary,
  };


  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};
