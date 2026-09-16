import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const InvestmentContext = createContext();
export const useInvestment = () => useContext(InvestmentContext);

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

  // Local storage persistence
  useEffect(() => {
    localStorage.setItem('investments', JSON.stringify(investments));
  }, [investments]);

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
      setLoading(false);
      return;
    }
    setLoading(true);

    const q = query(collection(db, 'investments'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by date descending, then createdAt descending
      data.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        return dateDiff !== 0 ? dateDiff : (b.createdAt || 0) - (a.createdAt || 0);
      });
      setInvestments(data);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  // Add transaction
  const addInvestment = async (item) => {
    if (!user) return;
    await addDoc(collection(db, 'investments'), {
      ...item,
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
    const sanitized = {
      ...data,
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

  // Portfolio calculations (Holdings & Realized PnL)
  const { holdings, totalCostBasis, totalRealizedPnL } = useMemo(() => {
    // Sort chronological (oldest to newest) to correctly compute weighted avg cost & realized PnL
    const chronoSorted = [...investments].sort((a, b) => {
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
        };
      }

      const item = symbolMap[sym];
      const shares = Number(tx.shares) || 0;
      const price = Number(tx.price) || 0;
      const fee = Math.floor(Number(tx.fee) || 0);
      const tax = Math.floor(Number(tx.tax) || 0);
      const turnover = Math.floor(price * shares);

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
  }, [investments]);

  const value = {
    investments,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    holdings,
    totalCostBasis,
    totalRealizedPnL,
  };

  return <InvestmentContext.Provider value={value}>{children}</InvestmentContext.Provider>;
};
