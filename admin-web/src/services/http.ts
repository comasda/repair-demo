import axios from 'axios';

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// ---- 请求拦截器：自动清洗 token 并注入 Authorization 头 ----
http.interceptors.request.use(cfg => {
  let raw =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    '';

  // 若误存了 JSON 对象，解析出 accessToken/token
  if (raw && (raw.startsWith('{') || raw.startsWith('['))) {
    try {
      const obj = JSON.parse(raw);
      raw = (obj?.accessToken || obj?.token || '').trim();
    } catch {
      raw = '';
    }
  }

  // 去掉重复 Bearer 前缀
  raw = raw.replace(/^Bearer\s+/i, '').trim();

  // 若包含非 ASCII，直接忽略（避免 setRequestHeader 报错）
  if (raw && !/^[\x00-\x7F]+$/.test(raw)) {
    console.warn('[auth] token contains non-ASCII chars, ignored');
    raw = '';
  }

  if (raw) {
    cfg.headers.Authorization = `Bearer ${raw}`;
  }

  return cfg;
});

export default http;
