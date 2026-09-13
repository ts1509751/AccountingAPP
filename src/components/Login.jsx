import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';
import { LogIn } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Login() {
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <ThemeToggle />
      <div className="glass" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <h1 className="title-glass" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Expense Tracker</h1>
        <p className="subtitle" style={{ marginBottom: '2rem' }}>請登入以同步您的專屬雲端記帳資料</p>
        <button className="btn btn-primary" onClick={signInWithGoogle} style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <LogIn size={20} /> 使用 Google 帳號一鍵登入
        </button>
      </div>
    </div>
  );
}
