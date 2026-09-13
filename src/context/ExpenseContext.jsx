import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const ExpenseContext = createContext();
export const useExpense = () => useContext(ExpenseContext);

const DEFAULT_CATEGORIES = ['餐飲', '交通', '娛樂', '購物', '薪水', '生活', '投資'];

export const ExpenseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Firestore Listener
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(document => ({ id: document.id, ...document.data() }));
      // Sort by date (descending) then by createdAt
      data.sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);
      setTransactions(data);
      setDataLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addTransaction = async (transaction) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        uid: user.uid,
        createdAt: Date.now()
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const updateTransaction = async (id, updatedData) => {
    try {
      const docRef = doc(db, 'transactions', id);
      await updateDoc(docRef, updatedData);
      setEditingTransaction(null);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      if (editingTransaction?.id === id) setEditingTransaction(null);
    } catch (e) {
      console.error("Error deleting document: ", e);
    }
  };

  const addCategory = (category) => {
    if (category && !categories.includes(category)) setCategories([...categories, category]);
  };

  const deleteCategory = (category) => setCategories(categories.filter(c => c !== category));
  
  const logout = () => signOut(auth);

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
    user, authLoading, dataLoading, logout,
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
