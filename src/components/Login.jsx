import { useState } from 'react';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';
import appLogo from '../assets/logo.png';

export default function Login() {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    try {
      setErrorMsg('');
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setLoading(false);
      if (error.code === 'auth/popup-closed-by-user') return;
      if (error.code === 'auth/operation-not-allowed') {
        setErrorMsg('請先至 Firebase 控制台啟用 Google 登入功能');
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMsg('目前的網域尚未在 Firebase 授權，請檢查設定');
      } else {
        setErrorMsg(`登入失敗：${error.code}`);
      }
    }
  };

  return (
    <div className="app-shell">
      <div className="login-page">
        <img src={appLogo} alt="我的記帳本" className="login-logo-img" />
        <h1 className="login-title">我的記帳本</h1>
        <p className="login-sub">您的個人記帳助理，資料即時同步到雲端，電腦手機都能用</p>
        {errorMsg && <div className="login-error">{errorMsg}</div>}
        <button className="login-btn" onClick={signInWithGoogle} disabled={loading}>
          <span style={{ fontSize: '1.2rem' }}>G</span>
          {loading ? '登入中...' : '使用 Google 帳號登入'}
        </button>
      </div>
    </div>
  );
}
