import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryIcon, POPULAR_ICONS } from '../utils/categories';
import { X, Edit2, Trash2, Plus, Smile, Check, ArrowLeft } from 'lucide-react';

export default function CategoryModal({ isOpen, onClose }) {
  const { categories, categoryIcons, addCategory, updateCategory, deleteCategory } = useExpense();

  // State for creating new category
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📌');
  const [showNewIconPicker, setShowNewIconPicker] = useState(false);

  // State for editing existing category
  const [editingCat, setEditingCat] = useState(null); // original category name
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('📌');
  const [showEditIconPicker, setShowEditIconPicker] = useState(false);

  if (!isOpen) return null;

  const handleStartEdit = (cat) => {
    setEditingCat(cat);
    setEditName(cat);
    setEditIcon(getCategoryIcon(cat, categoryIcons));
    setShowEditIconPicker(false);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    await updateCategory(editingCat, editName.trim(), editIcon);
    setEditingCat(null);
  };

  const handleCreate = async () => {
    if (!newCatName.trim()) return;
    await addCategory(newCatName.trim(), newCatIcon);
    setNewCatName('');
    setNewCatIcon('📌');
    setIsAdding(false);
    setShowNewIconPicker(false);
  };

  const handleDelete = async (cat) => {
    if (window.confirm(`確定要刪除「${cat}」分類嗎？（已記帳之紀錄仍會保留）`)) {
      await deleteCategory(cat);
      if (editingCat === cat) setEditingCat(null);
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet category-manage-modal" onClick={e => e.stopPropagation()}>
        <div className="panel-handle" />

        {/* Header */}
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🏷️</span>
            <div className="modal-title" style={{ margin: 0 }}>分類與圖示管理</div>
          </div>
          <button className="icon-btn modal-close-btn" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        </div>
        <p className="modal-sub-hint">
          修改分類圖示或名稱，所有更動均自動同步至手機與電腦端。
        </p>

        {/* Add new category accordion */}
        {!isAdding ? (
          <button
            type="button"
            className="add-item-action-btn"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={16} />
            <span>新增自訂分類</span>
          </button>
        ) : (
          <div className="editor-card new-cat-editor">
            <div className="editor-header">
              <span className="editor-title">✨ 新增分類</span>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                onClick={() => { setIsAdding(false); setShowNewIconPicker(false); }}
              >
                取消
              </button>
            </div>

            <div className="cat-form-row">
              <button
                type="button"
                className="icon-select-trigger"
                onClick={() => setShowNewIconPicker(!showNewIconPicker)}
                title="點擊選擇圖示"
              >
                <span className="trigger-emoji">{newCatIcon}</span>
                <span className="trigger-label">選圖示 ▾</span>
              </button>
              <input
                className="modal-input"
                style={{ flex: 1 }}
                placeholder="分類名稱 (例: 咖啡、外送、健身)"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <button className="btn-blue" onClick={handleCreate} disabled={!newCatName.trim()}>
                新增
              </button>
            </div>

            {showNewIconPicker && (
              <div className="emoji-picker-container" style={{ marginTop: '0.6rem' }}>
                <div className="emoji-picker-title">
                  <Smile size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  選擇分類圖示：
                </div>
                <div className="emoji-picker-grid">
                  {POPULAR_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`emoji-pick-btn ${newCatIcon === icon ? 'active' : ''}`}
                      onClick={() => { setNewCatIcon(icon); setShowNewIconPicker(false); }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Existing Categories List */}
        <div className="cat-manage-list">
          {categories.map(cat => {
            const currentIcon = getCategoryIcon(cat, categoryIcons);
            const isThisEditing = editingCat === cat;

            return (
              <div key={cat} className={`cat-manage-card ${isThisEditing ? 'editing' : ''}`}>
                {isThisEditing ? (
                  <div className="cat-inline-edit-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%' }}>
                      <button
                        type="button"
                        className="icon-select-trigger"
                        onClick={() => setShowEditIconPicker(!showEditIconPicker)}
                        title="更換圖示"
                      >
                        <span className="trigger-emoji">{editIcon}</span>
                        <span className="trigger-label">換圖示 ▾</span>
                      </button>
                      <input
                        className="modal-input"
                        style={{ flex: 1 }}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="分類名稱"
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                      />
                      <button className="btn-blue" onClick={handleSaveEdit} title="儲存">
                        <Check size={16} />
                      </button>
                      <button className="btn-ghost" onClick={() => setEditingCat(null)} title="取消">
                        <ArrowLeft size={16} />
                      </button>
                    </div>

                    {showEditIconPicker && (
                      <div className="emoji-picker-container" style={{ marginTop: '0.6rem', width: '100%' }}>
                        <div className="emoji-picker-title">
                          <Smile size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                          點選新圖示：
                        </div>
                        <div className="emoji-picker-grid">
                          {POPULAR_ICONS.map(icon => (
                            <button
                              key={icon}
                              type="button"
                              className={`emoji-pick-btn ${editIcon === icon ? 'active' : ''}`}
                              onClick={() => { setEditIcon(icon); setShowEditIconPicker(false); }}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="cat-row-display">
                    <div className="cat-row-left">
                      <span className="cat-display-icon">{currentIcon}</span>
                      <span className="cat-display-name">{cat}</span>
                    </div>
                    <div className="cat-row-actions">
                      <button
                        type="button"
                        className="cat-action-btn edit"
                        onClick={() => handleStartEdit(cat)}
                        title="修改圖示或名稱"
                      >
                        <Edit2 size={14} />
                        <span>修改</span>
                      </button>
                      <button
                        type="button"
                        className="cat-action-btn delete"
                        onClick={() => handleDelete(cat)}
                        title="刪除此分類"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="modal-footer" style={{ marginTop: '1rem' }}>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
