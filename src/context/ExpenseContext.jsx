import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, writeBatch, getDocs } from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from '../utils/categories';

const ExpenseContext = createContext();
export const useExpense = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [transactions, setTransactions] = useState([]);
  
  // Categories (synced with Firestore)
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  // Custom Category Icons map: { '咖啡': '☕', ... }
  const [categoryIcons, setCategoryIcons] = useState(() => {
    try {
      const saved = localStorage.getItem('categoryIcons');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Credit Cards: [{ id, name, bank, limit, color }]
  const [creditCards, setCreditCards] = useState(() => {
    try {
      const saved = localStorage.getItem('creditCards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Recurring Expenses: [{ id, name, amount, type, category, paymentMethod, cardId, dayOfMonth, active, lastRecordedMonth }]
  const [recurringExpenses, setRecurringExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('recurringExpenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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

  // Privacy / Hide Amounts Mode
  const [hideAmounts, setHideAmounts] = useState(() => {
    try {
      return localStorage.getItem('hideAmounts') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHideAmounts = () => {
    setHideAmounts(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hideAmounts', String(next));
      } catch (e) {
        console.error('Failed to save hideAmounts to localStorage', e);
      }
      return next;
    });
  };

  // Derived month navigation state
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Local storage caching
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('categoryIcons', JSON.stringify(categoryIcons));
  }, [categoryIcons]);

  useEffect(() => {
    localStorage.setItem('creditCards', JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

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

  // Firestore transactions & user settings (budgets, categories, cards, recurring) listener
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

    // User settings (budgets, categories, icons, cards, recurring) listener
    const budgetDocRef = doc(db, 'user_budgets', user.uid);
    const unsubBudget = onSnapshot(budgetDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          }
          if (data.categoryIcons) {
            setCategoryIcons(data.categoryIcons);
          }
          if (data.budgets) {
            setBudgets(prev => ({ ...prev, ...data.budgets }));
          }
          if (Array.isArray(data.creditCards)) {
            setCreditCards(data.creditCards);
          }
          if (Array.isArray(data.recurringExpenses)) {
            setRecurringExpenses(data.recurringExpenses);
          }
        }
      } else {
        // Initialize Firestore with current default categories if not existing
        setDoc(budgetDocRef, {
          categories: categories.length ? categories : DEFAULT_CATEGORIES,
          categoryIcons: categoryIcons,
          creditCards: [],
          recurringExpenses: [],
        }, { merge: true }).catch(err => console.error('Failed to init user settings:', err));
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

  const [successAnim, setSuccessAnim] = useState(null);

  const addTransaction = async (tx) => {
    if (!user) return;
    const paymentMethod = tx.paymentMethod || 'cash';
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...tx,
      paymentMethod,
      uid: user.uid,
      createdAt: Date.now(),
    });
    setSuccessAnim({
      id: docRef?.id,
      category: tx.category,
      type: tx.type,
      amount: tx.amount,
      key: Date.now(),
    });
    setTimeout(() => {
      setSuccessAnim(null);
    }, 2400);
    return docRef;
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
    const updatedCats = categories.includes(trimmed) ? categories : [...categories, trimmed];
    const updatedIcons = { ...categoryIcons, [trimmed]: icon || '📌' };

    setCategories(updatedCats);
    setCategoryIcons(updatedIcons);

    if (user) {
      try {
        const budgetDocRef = doc(db, 'user_budgets', user.uid);
        await setDoc(budgetDocRef, {
          categories: updatedCats,
          categoryIcons: updatedIcons,
        }, { merge: true });
      } catch (err) {
        console.error('Failed to sync category to Firebase:', err);
      }
    }
  };

  const updateCategory = async (oldName, newName, newIcon) => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedNew) return;

    let updatedCats = categories.map(c => c === trimmedOld ? trimmedNew : c);
    // Remove duplicates if renaming to existing
    updatedCats = Array.from(new Set(updatedCats));

    const updatedIcons = { ...categoryIcons };
    if (trimmedOld !== trimmedNew) {
      delete updatedIcons[trimmedOld];
    }
    updatedIcons[trimmedNew] = newIcon || '📌';

    setCategories(updatedCats);
    setCategoryIcons(updatedIcons);

    if (user) {
      try {
        const budgetDocRef = doc(db, 'user_budgets', user.uid);
        await setDoc(budgetDocRef, {
          categories: updatedCats,
          categoryIcons: updatedIcons,
        }, { merge: true });

        // If category was renamed, update all associated transactions
        if (trimmedOld !== trimmedNew) {
          const q = query(
            collection(db, 'transactions'),
            where('uid', '==', user.uid),
            where('category', '==', trimmedOld)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.docs.forEach(d => {
              batch.update(d.ref, { category: trimmedNew });
            });
            await batch.commit();
          }
        }
      } catch (err) {
        console.error('Failed to update category in Firebase:', err);
      }
    }
  };

  const deleteCategory = async (catName) => {
    const updatedCats = categories.filter(c => c !== catName);
    const updatedIcons = { ...categoryIcons };
    delete updatedIcons[catName];

    setCategories(updatedCats);
    setCategoryIcons(updatedIcons);

    if (user) {
      try {
        const budgetDocRef = doc(db, 'user_budgets', user.uid);
        await setDoc(budgetDocRef, {
          categories: updatedCats,
          categoryIcons: updatedIcons,
        }, { merge: true });
      } catch (err) {
        console.error('Failed to delete category in Firebase:', err);
      }
    }
  };

  // ── Credit Card Management ──
  const addCreditCard = async ({ name, bank, limit, color }) => {
    const newCard = {
      id: 'card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      bank: (bank || '').trim(),
      limit: Number(limit) || 0,
      color: color || '#3b82f6',
    };
    const updated = [...creditCards, newCard];
    setCreditCards(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { creditCards: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to add credit card:', err);
      }
    }
    return newCard;
  };

  const updateCreditCard = async (id, data) => {
    const updated = creditCards.map(c => c.id === id ? { ...c, ...data, limit: Number(data.limit) || c.limit } : c);
    setCreditCards(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { creditCards: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to update credit card:', err);
      }
    }
  };

  const deleteCreditCard = async (id) => {
    const updated = creditCards.filter(c => c.id !== id);
    setCreditCards(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { creditCards: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to delete credit card:', err);
      }
    }
  };

  // Monthly credit card usage calculation
  const cardUsageMap = useMemo(() => {
    const usage = {};
    creditCards.forEach(card => {
      // Sum transactions in current viewing month for this card
      const used = filteredTransactions
        .filter(t => t.paymentMethod === 'credit' && t.cardId === card.id)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const limit = Number(card.limit) || 0;
      const remaining = Math.max(0, limit - used);
      const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
      const isOver = limit > 0 && used > limit;

      usage[card.id] = {
        card,
        used,
        limit,
        remaining,
        percent,
        isOver,
      };
    });
    return usage;
  }, [creditCards, filteredTransactions]);

  // ── Recurring / Fixed Expenses Management ──
  const addRecurringExpense = async (item) => {
    const newRec = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: item.name.trim(),
      amount: Number(item.amount) || 0,
      type: item.type || 'expense',
      category: item.category || (categories[0] || '生活'),
      paymentMethod: item.paymentMethod || 'cash',
      cardId: item.cardId || null,
      cardName: item.cardName || null,
      dayOfMonth: Number(item.dayOfMonth) || 1,
      active: item.active !== false,
      lastRecordedMonth: null,
    };
    const updated = [...recurringExpenses, newRec];
    setRecurringExpenses(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { recurringExpenses: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to add recurring expense:', err);
      }
    }
    return newRec;
  };

  const updateRecurringExpense = async (id, data) => {
    const updated = recurringExpenses.map(r => r.id === id ? { ...r, ...data } : r);
    setRecurringExpenses(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { recurringExpenses: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to update recurring expense:', err);
      }
    }
  };

  const deleteRecurringExpense = async (id) => {
    const updated = recurringExpenses.filter(r => r.id !== id);
    setRecurringExpenses(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { recurringExpenses: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to delete recurring expense:', err);
      }
    }
  };

  // Manual immediate recording of a recurring item for testing or instant bookkeeping
  const triggerRecurringItem = async (recId) => {
    if (!user) return;
    const rec = recurringExpenses.find(r => r.id === recId);
    if (!rec) return;

    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const curDayStr = String(now.getDate()).padStart(2, '0');
    const txDate = `${curMonth}-${curDayStr}`;

    await addDoc(collection(db, 'transactions'), {
      type: rec.type || 'expense',
      amount: Number(rec.amount),
      category: rec.category || '生活',
      description: `[固定支出] ${rec.name}`,
      date: txDate,
      paymentMethod: rec.paymentMethod || 'cash',
      cardId: rec.cardId || null,
      cardName: rec.cardName || null,
      recurringId: rec.id,
      uid: user.uid,
      createdAt: Date.now(),
    });

    const updated = recurringExpenses.map(r => r.id === recId ? { ...r, lastRecordedMonth: curMonth } : r);
    setRecurringExpenses(updated);

    try {
      await setDoc(doc(db, 'user_budgets', user.uid), { recurringExpenses: updated }, { merge: true });
    } catch (err) {
      console.error('Failed to sync triggered recurring item:', err);
    }
  };

  // ── Auto-Bookkeeping Engine (Automatic Execution on App Load) ──
  const hasRunRecurringEngineRef = useRef(false);
  useEffect(() => {
    if (!user || dataLoading || recurringExpenses.length === 0) return;
    if (hasRunRecurringEngineRef.current) return;
    hasRunRecurringEngineRef.current = true;

    const runAutoBookkeeping = async () => {
      const now = new Date();
      const curYear = now.getFullYear();
      const curMonthNum = now.getMonth() + 1;
      const curMonthStr = `${curYear}-${String(curMonthNum).padStart(2, '0')}`;
      const curDay = now.getDate();

      let modified = false;
      const updatedRecs = [...recurringExpenses];

      for (let i = 0; i < updatedRecs.length; i++) {
        const rec = updatedRecs[i];
        if (rec.active === false) continue;

        const scheduledDay = Number(rec.dayOfMonth) || 1;
        // Check if date condition met and not yet recorded this month
        if (curDay >= scheduledDay && rec.lastRecordedMonth !== curMonthStr) {
          // Double check transactions to avoid duplicate
          const alreadyRecorded = transactions.some(
            t => (t.recurringId === rec.id && t.date?.startsWith(curMonthStr)) ||
                 (t.description === `[固定支出] ${rec.name}` && t.date?.startsWith(curMonthStr))
          );

          if (!alreadyRecorded) {
            const dayStr = String(Math.min(scheduledDay, 28)).padStart(2, '0');
            const txDate = `${curMonthStr}-${dayStr}`;

            try {
              await addDoc(collection(db, 'transactions'), {
                type: rec.type || 'expense',
                amount: Number(rec.amount),
                category: rec.category || '生活',
                description: `[固定支出] ${rec.name}`,
                date: txDate,
                paymentMethod: rec.paymentMethod || 'cash',
                cardId: rec.cardId || null,
                cardName: rec.cardName || null,
                recurringId: rec.id,
                uid: user.uid,
                createdAt: Date.now(),
              });
            } catch (err) {
              console.error(`Auto-bookkeeping failed for ${rec.name}:`, err);
            }
          }

          updatedRecs[i] = { ...rec, lastRecordedMonth: curMonthStr };
          modified = true;
        }
      }

      if (modified) {
        setRecurringExpenses(updatedRecs);
        try {
          await setDoc(doc(db, 'user_budgets', user.uid), { recurringExpenses: updatedRecs }, { merge: true });
        } catch (err) {
          console.error('Failed to sync updated recurring status:', err);
        }
      }
    };

    runAutoBookkeeping();
  }, [user, dataLoading, recurringExpenses, transactions]);

  const value = {
    user, authLoading, dataLoading, logout,
    theme, toggleTheme,
    transactions, filteredTransactions,
    addTransaction, updateTransaction, deleteTransaction,
    successAnim,
    // Categories & Custom Icons
    categories, addCategory, updateCategory, deleteCategory, categoryIcons,
    // Credit Cards & Limits
    creditCards, addCreditCard, updateCreditCard, deleteCreditCard, cardUsageMap,
    // Recurring / Fixed Expenses (Auto Bookkeeping)
    recurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense, triggerRecurringItem,
    income, expense, balance,
    hideAmounts, toggleHideAmounts,
    viewYear, viewMonth, setViewYear, setViewMonth, prevMonth, nextMonth, prevYear, nextYear, monthStr,
    // Budget & Analysis
    budgets, setBudget, currentBudget, budgetRemaining, budgetUsedPercent,
    yearlyIncome, yearlyExpense, yearlyBalance, yearlyMonthlyBreakdown, allYearsSummary,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};
