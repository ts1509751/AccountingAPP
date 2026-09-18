import { useState } from 'react';
import { Settings, Sun, Moon, LogOut, FileSpreadsheet } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import ExportModal from './ExportModal';

export default function SettingsModal() {
  const { theme, toggleTheme, logout, user } = useExpense();
  const [open, setOpen] = useState(false);
  const [showExport, setShowExport] = useState(false);

  return (
    <>
      <button className="icon-btn" onClick={() => setOpen(true)} aria-label="設定">
        <Settings size={20} />
      </button>

      {open && (
        <>
          <div className="settings-overlay" onClick={() => setOpen(false)} />
          <div className="settings-sheet">
            {/* User info */}
            <div style={{ padding: '0.8rem 1rem 0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>已登入</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || user?.email || '使用者'}
              </div>
            </div>

            {/* Theme toggle */}
            <button className="settings-item" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              {theme === 'dark' ? '切換亮色模式' : '切換深色模式'}
              <label className="toggle-switch" style={{ pointerEvents: 'none' }}>
                <input type="checkbox" checked={theme === 'light'} readOnly />
                <span className="toggle-slider" />
              </label>
            </button>

            {/* Export Excel */}
            <button className="settings-item" onClick={() => { setShowExport(true); setOpen(false); }}>
              <FileSpreadsheet size={18} style={{ color: 'var(--accent-green)' }} />
              匯出 Excel 報表 (.xlsx)
            </button>

            <div className="settings-divider" />

            {/* Logout */}
            <button className="settings-item danger" onClick={() => { logout(); setOpen(false); }}>
              <LogOut size={18} />
              登出帳號
            </button>
          </div>
        </>
      )}

      {/* Export Modal */}
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </>
  );
}

