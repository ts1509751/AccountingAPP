import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

const InvestmentContext = createContext();
export const useInvestment = () => useContext(InvestmentContext);

const DEFAULT_ACCOUNTS = [
  { id: 'default', name: '預設主帳戶', broker: '證券戶', color: '#2563eb', isDefault: true }
];

export const InvestmentProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [investments, setInvestments] = useState(() => {
    try {
      const saved = localStorage.getItem('investments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Investment sub-accounts: [{ id, name, broker, color, notes, isDefault }]
  const [investmentAccounts, setInvestmentAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('investmentAccounts');
      return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  });

  // Currently selected account filter: 'all' | accountId
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  // Regular fixed-amount DCA plans: [{ id, symbol, assetType, accountId, accountName, fixedAmount, dayOfMonth, active, notes }]
  const [dcaPlans, setDcaPlans] = useState(() => {
    try {
      const saved = localStorage.getItem('dcaPlans');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Local storage persistence
  useEffect(() => {
    localStorage.setItem('investments', JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem('investmentAccounts', JSON.stringify(investmentAccounts));
  }, [investmentAccounts]);

  useEffect(() => {
    localStorage.setItem('dcaPlans', JSON.stringify(dcaPlans));
  }, [dcaPlans]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsub;
  }, []);

  // Firestore listener
  useEffect(() => {
    if (!user) {
      setInvestments([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Investments transactions listener
    const q = query(collection(db, 'investments'), where('uid', '==', user.uid));
    const unsubInv = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by date descending, then createdAt descending
      data.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        return dateDiff !== 0 ? dateDiff : (b.createdAt || 0) - (a.createdAt || 0);
      });
      setInvestments(data);
      setLoading(false);
    });

    // Sub-accounts & DCA Plans listener (stored under user_budgets document)
    const userDocRef = doc(db, 'user_budgets', user.uid);
    const unsubSettings = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          if (Array.isArray(data.investmentAccounts) && data.investmentAccounts.length > 0) {
            setInvestmentAccounts(data.investmentAccounts);
          }
          if (Array.isArray(data.dcaPlans)) {
            setDcaPlans(data.dcaPlans);
          }
        }
      } else {
        // Initialize default account if not exists
        setDoc(userDocRef, {
          investmentAccounts: DEFAULT_ACCOUNTS,
          dcaPlans: [],
        }, { merge: true }).catch(err => console.error('Failed to init investment accounts:', err));
      }
    });

    return () => {
      unsubInv();
      unsubSettings();
    };
  }, [user]);

  // Sub-account CRUD
  const addAccount = async ({ name, broker, color, notes }) => {
    const newAccount = {
      id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      broker: (broker || '').trim(),
      color: color || '#2563eb',
      notes: (notes || '').trim(),
      isDefault: false,
    };
    const updated = [...investmentAccounts, newAccount];
    setInvestmentAccounts(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { investmentAccounts: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to add investment account:', err);
      }
    }
    return newAccount;
  };

  const updateAccount = async (id, data) => {
    const updated = investmentAccounts.map(a => a.id === id ? { ...a, ...data } : a);
    setInvestmentAccounts(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { investmentAccounts: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to update investment account:', err);
      }
    }
  };

  const deleteAccount = async (id) => {
    if (investmentAccounts.length <= 1) {
      alert('請至少保留一個投資帳戶');
      return;
    }
    const updated = investmentAccounts.filter(a => a.id !== id);
    setInvestmentAccounts(updated);
    if (selectedAccountId === id) {
      setSelectedAccountId('all');
    }

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { investmentAccounts: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to delete investment account:', err);
      }
    }
  };

  // DCA Plans CRUD
  const addDcaPlan = async (plan) => {
    const newPlan = {
      id: 'dca_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      symbol: plan.symbol.trim(),
      assetType: plan.assetType || 'stock',
      accountId: plan.accountId || investmentAccounts[0]?.id || 'default',
      accountName: plan.accountName || investmentAccounts[0]?.name || '預設主帳戶',
      fixedAmount: Math.floor(Number(plan.fixedAmount) || 0),
      dayOfMonth: Number(plan.dayOfMonth) || 1,
      active: plan.active !== false,
      notes: (plan.notes || '').trim(),
      createdAt: Date.now(),
    };
    const updated = [...dcaPlans, newPlan];
    setDcaPlans(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { dcaPlans: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to add DCA plan:', err);
      }
    }
    return newPlan;
  };

  const updateDcaPlan = async (id, data) => {
    const updated = dcaPlans.map(p => p.id === id ? { ...p, ...data } : p);
    setDcaPlans(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { dcaPlans: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to update DCA plan:', err);
      }
    }
  };

  const deleteDcaPlan = async (id) => {
    const updated = dcaPlans.filter(p => p.id !== id);
    setDcaPlans(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'user_budgets', user.uid), { dcaPlans: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to delete DCA plan:', err);
      }
    }
  };

  // Add transaction
  const addInvestment = async (item) => {
    if (!user) return;
    const accountId = item.accountId || investmentAccounts[0]?.id || 'default';
    const accountObj = investmentAccounts.find(a => a.id === accountId);
    const accountName = item.accountName || accountObj?.name || '預設主帳戶';

    await addDoc(collection(db, 'investments'), {
      ...item,
      accountId,
      accountName,
      isDCA: Boolean(item.isDCA),
      fee: Math.floor(Number(item.fee) || 0),
      tax: Math.floor(Number(item.tax) || 0),
      turnover: Math.floor(Number(item.price || 0) * Number(item.shares || 0)),
      totalAmount: Math.floor(Number(item.totalAmount) || 0),
      uid: user.uid,
      createdAt: Date.now(),
    });
  };

  // Update transaction
  const updateInvestment = async (id, data) => {
    const accountId = data.accountId || investmentAccounts[0]?.id || 'default';
    const accountObj = investmentAccounts.find(a => a.id === accountId);
    const accountName = data.accountName || accountObj?.name || '預設主帳戶';

    const sanitized = {
      ...data,
      accountId,
      accountName,
      isDCA: Boolean(data.isDCA),
      fee: Math.floor(Number(data.fee) || 0),
      tax: Math.floor(Number(data.tax) || 0),
      turnover: Math.floor(Number(data.price || 0) * Number(data.shares || 0)),
      totalAmount: Math.floor(Number(data.totalAmount) || 0),
    };
    await updateDoc(doc(db, 'investments', id), sanitized);
  };

  // Delete transaction
  const deleteInvestment = async (id) => {
    await deleteDoc(doc(db, 'investments', id));
  };

  // Filtered investments by currently selected account
  const activeInvestments = useMemo(() => {
    if (selectedAccountId === 'all') return investments;
    return investments.filter(t => (t.accountId || 'default') === selectedAccountId);
  }, [investments, selectedAccountId]);

  // Portfolio calculations (Holdings & Realized PnL) for active view
  const { holdings, totalCostBasis, totalRealizedPnL } = useMemo(() => {
    // Sort chronological (oldest to newest) to correctly compute weighted avg cost & realized PnL
    const chronoSorted = [...activeInvestments].sort((a, b) => {
      const d = new Date(a.date) - new Date(b.date);
      return d !== 0 ? d : (a.createdAt || 0) - (b.createdAt || 0);
    });

    const symbolMap = {};

    chronoSorted.forEach(tx => {
      const sym = tx.symbol.trim();
      if (!symbolMap[sym]) {
        symbolMap[sym] = {
          symbol: sym,
          assetType: tx.assetType || 'stock',
          currentShares: 0,
          totalCost: 0,
          realizedPnL: 0,
          totalBuyShares: 0,
          totalSellShares: 0,
          buyCount: 0,
          sellCount: 0,
          dcaCount: 0,
          dcaTotalAmount: 0,
        };
      }

      const item = symbolMap[sym];
      const shares = Number(tx.shares) || 0;
      const price = Number(tx.price) || 0;
      const fee = Math.floor(Number(tx.fee) || 0);
      const tax = Math.floor(Number(tx.tax) || 0);
      const turnover = Math.floor(price * shares);

      if (tx.isDCA) {
        item.dcaCount++;
        item.dcaTotalAmount += Math.floor(turnover + fee);
      }

      if (tx.action === 'buy') {
        const buyAmount = Math.floor(turnover + fee);
        item.totalCost += buyAmount;
        item.currentShares += shares;
        item.totalBuyShares += shares;
        item.buyCount++;
      } else if (tx.action === 'sell') {
        // Average cost before sell
        const avgCost = item.currentShares > 0 ? item.totalCost / item.currentShares : 0;
        const sharesToSell = Math.min(shares, item.currentShares);
        const costOfSold = Math.floor(avgCost * sharesToSell);
        const netSellProceeds = Math.floor(turnover - fee - tax);
        const pnl = Math.floor(netSellProceeds - costOfSold);

        item.realizedPnL += pnl;
        item.totalCost = Math.max(0, Math.floor(item.totalCost - costOfSold));
        item.currentShares = Math.max(0, item.currentShares - shares);
        item.totalSellShares += shares;
        item.sellCount++;
      }
    });

    let overallCost = 0;
    let overallPnL = 0;

    const list = Object.values(symbolMap).map(h => {
      const avgPrice = h.currentShares > 0 ? h.totalCost / h.currentShares : 0;
      const roundedTotalCost = Math.floor(h.totalCost);
      const roundedPnL = Math.floor(h.realizedPnL);
      overallCost += roundedTotalCost;
      overallPnL += roundedPnL;
      return {
        ...h,
        totalCost: roundedTotalCost,
        realizedPnL: roundedPnL,
        avgPrice,
      };
    });

    return {
      holdings: list,
      totalCostBasis: Math.floor(overallCost),
      totalRealizedPnL: Math.floor(overallPnL),
    };
  }, [activeInvestments]);

  // Overall account statistics map: { [accId]: { totalCost, holdingsCount, txCount } }
  const accountStatsMap = useMemo(() => {
    const stats = {};
    investmentAccounts.forEach(acc => {
      const accTxs = investments.filter(t => (t.accountId || 'default') === acc.id);
      
      // Calculate active holdings
      const symMap = {};
      const sorted = [...accTxs].sort((a, b) => new Date(a.date) - new Date(b.date));
      sorted.forEach(t => {
        const sym = t.symbol.trim();
        if (!symMap[sym]) symMap[sym] = { shares: 0, cost: 0 };
        const sh = Number(t.shares || 0);
        const fee = Math.floor(Number(t.fee || 0));
        const to = Math.floor(Number(t.price || 0) * sh);
        if (t.action === 'buy') {
          symMap[sym].shares += sh;
          symMap[sym].cost += (to + fee);
        } else if (t.action === 'sell') {
          const avg = symMap[sym].shares > 0 ? symMap[sym].cost / symMap[sym].shares : 0;
          const soldSh = Math.min(sh, symMap[sym].shares);
          symMap[sym].cost = Math.max(0, Math.floor(symMap[sym].cost - avg * soldSh));
          symMap[sym].shares = Math.max(0, symMap[sym].shares - sh);
        }
      });

      const activeCount = Object.values(symMap).filter(s => s.shares > 0).length;
      const accCost = Object.values(symMap).reduce((sum, s) => sum + (s.shares > 0 ? s.cost : 0), 0);

      stats[acc.id] = {
        totalCost: Math.floor(accCost),
        holdingsCount: activeCount,
        txCount: accTxs.length,
      };
    });
    return stats;
  }, [investmentAccounts, investments]);

  const value = {
    investments,
    activeInvestments,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    holdings,
    totalCostBasis,
    totalRealizedPnL,
    // Sub-accounts
    investmentAccounts,
    selectedAccountId,
    setSelectedAccountId,
    addAccount,
    updateAccount,
    deleteAccount,
    accountStatsMap,
    // Regular fixed-amount DCA
    dcaPlans,
    addDcaPlan,
    updateDcaPlan,
    deleteDcaPlan,
  };

  return <InvestmentContext.Provider value={value}>{children}</InvestmentContext.Provider>;
};
