import { useState } from 'react';
import { auth, googleProvider } from '../firebase/config';
import {
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import appLogo from '../assets/logo.png';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';

export default function Login() {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('google'); // 'google' | 'email'
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signInWithGoogle = async () => {
    try {
      setErrorMsg('');
      setLoading(true);

      if (Capacitor.isNativePlatform()) {
        // Native Android login via Play Services / Credential Manager
        const authPromise = FirebaseAuthentication.signInWithGoogle();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('登入操作逾時，請重試或改用其他登入方式')), 25000)
        );

        const result = await Promise.race([authPromise, timeoutPromise]);
        const idToken = result.credential?.idToken;

        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);
        } else {
          throw new Error('未取得 Google 登入授權憑證');
        }
      } else {
        // Web browser popup flow
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setLoading(false);

      const code = error.code || '';
      const message = error.message || '';

      // User closed popup or cancelled dialog
      if (
        code === 'auth/popup-closed-by-user' ||
        message.includes('cancel') ||
        message.includes('16') ||
        message.includes('Canceled')
      ) {
        return;
      }

      if (code === 'auth/operation-not-allowed') {
        setErrorMsg('請先至 Firebase 控制台啟用 Google 登入功能');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMsg('目前的網域尚未在 Firebase 授權，請檢查設定');
      } else if (Capacitor.isNativePlatform()) {
        setErrorMsg(
          '手機端 Google 登入需綁定 Firebase 憑證。建議您切換「Email 帳號」或點擊下方「訪客體驗」立即進入記帳本！'
        );
      } else {
        setErrorMsg(`登入失敗：${message || code || '請稍後重試'}`);
      }
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('請輸入電子信箱與密碼');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('密碼請至少輸入 6 位字元');
      return;
    }

    try {
      setErrorMsg('');
      setLoading(true);
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      console.error('Email Auth Error:', error);
      setLoading(false);
      const code = error.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('帳號或密碼不正確，若尚未註冊請切換為「註冊」');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('此信箱已被註冊，請直接點選登入');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('密碼強度不足，請輸入至少 6 位字元');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('請輸入有效的電子信箱格式');
      } else {
        setErrorMsg(`登入失敗：${error.message || code}`);
      }
    }
  };

  const handleGuestLogin = async () => {
    try {
      setErrorMsg('');
      setLoading(true);
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Guest Sign-In Error:', error);
      setLoading(false);
      if (error.code === 'auth/operation-not-allowed') {
        setErrorMsg('Firebase 尚未啟用匿名登入，請使用 Email 或 Google 登入');
      } else {
        setErrorMsg(`訪客登入失敗：${error.message || error.code}`);
      }
    }
  };

  return (
    <div className="app-shell">
      <div className="login-page">
        <img src={appLogo} alt="我的記帳本" className="login-logo-img" />
        <h1 className="login-title">我的記帳本</h1>
        <p className="login-sub">您的個人記帳助理，資料即時同步到雲端，電腦手機都能用</p>

        {/* Tab switch between Google and Email */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'google' ? 'active' : ''}`}
            onClick={() => { setActiveTab('google'); setErrorMsg(''); }}
          >
            Google 登入
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => { setActiveTab('email'); setErrorMsg(''); }}
          >
            Email 帳號
          </button>
        </div>

        {errorMsg && <div className="login-error">{errorMsg}</div>}

        {activeTab === 'google' ? (
          <button
            type="button"
            className="login-btn"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>G</span>
            {loading ? '登入中...' : '使用 Google 帳號登入'}
          </button>
        ) : (
          <form className="login-form" onSubmit={handleEmailAuth}>
            <div className="login-input-group">
              <Mail size={18} />
              <input
                type="email"
                className="login-input"
                placeholder="電子信箱 (Email)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="login-input-group">
              <Lock size={18} />
              <input
                type="password"
                className="login-input"
                placeholder="密碼 (至少 6 位字元)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              <ArrowRight size={18} />
              {loading ? '處理中...' : isRegister ? '註冊並登入' : '登入帳號'}
            </button>

            <button
              type="button"
              className="login-toggle-link"
              onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }}
            >
              {isRegister ? '已有帳號？點此登入' : '尚未有帳號？點此免費註冊'}
            </button>
          </form>
        )}

        <div className="login-divider">或</div>

        <button
          type="button"
          className="login-secondary-btn"
          onClick={handleGuestLogin}
          disabled={loading}
        >
          <Sparkles size={16} style={{ color: 'var(--accent-yellow)' }} />
          訪客體驗 (免登入直接使用)
        </button>
      </div>
    </div>
  );
}
