import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { auth } from './store/auth';
import OrdersPage from './pages/orders';
import TechnicianReviewPage from './pages/technicians';
import CustomerReviewPage from './pages/customers';

// 定义新订单通知的数据结构
interface NewOrderNotification {
  orderId: string;
  device: string;
  issue: string;
  customer: string;
  time: string;
  status: string;
}

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
  const [authed, setAuthed] = useState(isAuthed());
  const [tab, setTab] = useState<'orders' | 'techs' | 'customers'>('orders'); // 👈 当前页
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setAuthed(Boolean(token));

    // 建立 Socket.IO 连接 - 连接到后端服务器
    // 可以通过环境变量或配置来指定后端地址
    const backendUrl = (import.meta.env as any).VITE_BACKEND_URL || 'https://www.lihewasher.com';
    const newSocket = io(backendUrl, {
      path: '/socket.io',
      transports: ['polling', 'websocket'], // 优先使用轮询
      timeout: 20000, // 20秒超时
      forceNew: true
    });
    setSocket(newSocket);

    // 监听连接事件
    newSocket.on('connect', () => {
    });

    newSocket.on('connect_error', (error: any) => {
    });

    newSocket.on('disconnect', (reason: any) => {
    });

    // 监听新订单通知
    newSocket.on('new_order', (data: NewOrderNotification) => {
      // 显示浏览器原生通知（如果用户允许）
      if (Notification.permission === 'granted') {
        new Notification('新订单提醒', {
          body: `设备: ${data.device}\n问题: ${data.issue}\n客户: ${data.customer}`,
          icon: '/favicon.ico' // 可以替换为您的应用图标
        });
      } else if (Notification.permission !== 'denied') {
        // 请求通知权限
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('新订单提醒', {
              body: `设备: ${data.device}\n问题: ${data.issue}\n客户: ${data.customer}`,
              icon: '/favicon.ico'
            });
          }
        });
      }

      // 也可以显示一个简单的 alert 作为备用
      alert(`新订单提醒!\n设备: ${data.device}\n问题: ${data.issue}\n客户: ${data.customer}`);
    });

    // 组件卸载时断开连接
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 当用户登录后，注册用户ID到 Socket.IO
  useEffect(() => {
    if (authed && socket) {
      const user = auth.user;
      if (user && user.id) {
        socket.emit('register', user.id);
      }
    }
  }, [authed, socket]);

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  return (
    <>
      {/* 顶栏：左右布局 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        background: '#fff',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setTab('orders')}
            style={{ padding: '8px 12px', borderRadius: 6, background: tab === 'orders' ? '#111827' : '#f3f4f6', color: tab === 'orders' ? '#fff' : '#111' }}
          >
            订单管理
          </button>
          <button
            onClick={() => setTab('techs')}
            style={{ padding: '8px 12px', borderRadius: 6, background: tab === 'techs' ? '#111827' : '#f3f4f6', color: tab === 'techs' ? '#fff' : '#111' }}
          >
            技师审核
          </button>
          <button
            onClick={() => setTab('customers')}
            style={{ padding: '8px 12px', borderRadius: 6, background: tab === 'customers' ? '#111827' : '#f3f4f6', color: tab === 'customers' ? '#fff' : '#111' }}
          >
            客户审核
          </button>
        </div>
        <div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              setAuthed(false);
            }}
          >
            退出登录
          </button>
        </div>
      </div>

      {/* 页面主体 */}
      {tab === 'orders' && <OrdersPage />}
      {tab === 'techs' && <TechnicianReviewPage />}
      {tab === 'customers' && <CustomerReviewPage />}
    </>
  );
}
