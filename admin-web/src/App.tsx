import React, { useEffect, useState } from 'react';
import { auth } from './store/auth';
import OrdersPage from './pages/orders'; // 引入我们刚写好的 orders 模块

// 简单判断是否已登录（存在 token 即视为已登录）
const isAuthed = () => Boolean(localStorage.getItem('token'));

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 后端登录接口（保持你当前 api 逻辑或 fetch）
      const res = await fetch('/api/users/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || '登录失败');
      if (data.user?.role !== 'admin') throw new Error('该账号不是管理员');

      // 登录成功：保存 accessToken 到 localStorage（作为登录守卫依据）
      const token = (data.accessToken || '').trim();
      if (!token) throw new Error('登录接口未返回 token');
      localStorage.setItem('token', token);

      // 保存用户信息并跳转
      auth.setUser(data.user);
      onLogin();
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={submit} className="login-box">
        <h2>管理员登录</h2>
        {error && <div className="error">{error}</div>}
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="用户名" />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="密码"
        />
        <button disabled={loading}>{loading ? '登录中...' : '登录'}</button>
      </form>
    </div>
  );
}

export default function App() {
  // 用本地 token 作为是否登录的单一事实来源
  const [authed, setAuthed] = useState(isAuthed());

  // 监听本地 token 变化（跨标签页同步 & 清缓存后自动回到登录页）
  useEffect(() => {
    const sync = () => setAuthed(isAuthed());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // 进入应用时再校验一次（防止首次渲染时状态不同步）
  useEffect(() => {
    setAuthed(isAuthed());
  }, []);
  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  // 已登录：渲染后台页面；可选提供一个登出按钮
  return (
    <>
      {/* 轻量登出（可删） */}
      <div style={{ padding: 8, textAlign: 'right' }}>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            setAuthed(false);
          }}
        >
          退出登录
        </button>
      </div>
      <OrdersPage />
    </>
  );
}
