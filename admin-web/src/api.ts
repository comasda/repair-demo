const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || ''

async function http(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type','application/json')
  if (ADMIN_TOKEN) headers.set('X-Admin-Token', ADMIN_TOKEN)
  const res = await fetch(API_BASE + path, { ...options, headers })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const j = await res.json(); msg = j.message || msg } catch {}
    throw new Error(msg)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res.text()
}

import { auth } from "./store/auth";

async function request(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (auth.token) headers.set("Authorization", `Bearer ${auth.token}`);

  const res = await fetch(url, { ...options, headers });

  // 401 未授权
  if (res.status === 401) {
    auth.clear();
    location.replace("/admin/login");
    throw new Error("未登录或登录已过期");
  }

  // 403 权限不足
  if (res.status === 403) {
    throw new Error("无访问权限");
  }

  // 非 2xx 错误处理
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const data = raw ? JSON.parse(raw) : null;
      throw new Error(data?.message || raw || `请求失败(${res.status})`);
    } catch {
      throw new Error(raw || `请求失败(${res.status})`);
    }
  }

  // ✅ 成功返回 JSON
  try {
    return await res.json();
  } catch {
    return {}; // 防止后端没返回 JSON 时崩溃
  }
}

// 封装后台接口
export const api = {
  async adminLogin(username: string, password: string) {
    const data = await request("/api/users/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    return data;
  },

  async me() {
    return request("/api/admin/me");
  },

  async listOrders(qs: string) {
    return request(`/api/admin/orders?${qs}`);
  },

  async listTechnicians() {
    return request(`/api/technicians`);
  },

  async offer(id: string, payload: any) {
    return request(`/api/admin/orders/${id}/assign`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

