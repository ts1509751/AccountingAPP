import { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { PlusCircle, Save, XCircle } from 'lucide-react';

export default function TransactionForm() {
  const { addTransaction, updateTransaction, editingTransaction, setEditingTransaction, categories, addCategory } = useExpense();
  
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: categories[0] || '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setFormData(editingTransaction);
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        category: categories[0] || '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
  }, [editingTransaction, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.date) return;
    
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, formData);
    } else {
      addTransaction(formData);
    }
    
    if (!editingTransaction) {
      setFormData({
        ...formData,
        amount: '',
        description: ''
      });
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim());
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory('');
      setIsAddingCategory(false);
    }
  };

  return (
    <div className="glass form-container">
      <h3>{editingTransaction ? '編輯紀錄' : '新增紀錄'}</h3>
      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-group type-toggle">
          <button 
            type="button"
            className={`btn ${formData.type === 'expense' ? 'btn-danger' : 'btn-outline'}`}
            onClick={() => setFormData({...formData, type: 'expense'})}
          >
            支出
          </button>
          <button 
            type="button"
            className={`btn ${formData.type === 'income' ? 'btn-success' : 'btn-outline'}`}
            onClick={() => setFormData({...formData, type: 'income'})}
          >
            收入
          </button>
        </div>

        <div className="form-group">
          <label>金額</label>
          <input 
            type="number" 
            className="input-glass" 
            value={formData.amount} 
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="輸入金額"
            required
            min="0"
          />
        </div>

        <div className="form-group">
          <label>分類</label>
          {isAddingCategory ? (
            <div className="add-category-group">
              <input 
                type="text" 
                className="input-glass"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="輸入新分類名稱"
                autoFocus
              />
              <button type="button" className="btn btn-primary" onClick={handleAddCategory}>新增</button>
              <button type="button" className="btn btn-outline" onClick={() => setIsAddingCategory(false)}>取消</button>
            </div>
          ) : (
            <div className="select-wrapper">
              <select 
                className="input-glass"
                value={formData.category}
                onChange={(e) => {
                  if (e.target.value === 'ADD_NEW') {
                    setIsAddingCategory(true);
                  } else {
                    setFormData({...formData, category: e.target.value});
                  }
                }}
                required
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="ADD_NEW">+ 自訂新分類</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>日期</label>
          <input 
            type="date" 
            className="input-glass"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>備註 (選填)</label>
          <input 
            type="text" 
            className="input-glass"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="例如：午餐、買書..."
          />
        </div>

        {editingTransaction ? (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Save size={20} /> 儲存修改
            </button>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditingTransaction(null)}>
              <XCircle size={20} /> 取消
            </button>
          </div>
        ) : (
          <button type="submit" className="btn btn-primary submit-btn">
            <PlusCircle size={20} /> 新增紀錄
          </button>
        )}
      </form>
    </div>
  );
}
