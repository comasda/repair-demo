// src/services/customerApi.ts
export interface CustomerItem {
  _id: string;
  username?: string;
  phone?: string;
  role?: 'customer' | string;
  idCard?: { name?: string; number?: string; photos?: string[] };
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  reviewAudit?: { result?: string; reason?: string; auditedAt?: string; auditedBy?: string };
  reviewHistory?: Array<{ time: string; result: string; reason?: string; admin?: string }>;
  createdAt?: string;
}

type Query = { status?: string; q?: string; page?: number; pageSize?: number };

async function http<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '请求失败');
  return data;
}

export async function listCustomers(params: Query) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return http<{ items: CustomerItem[]; total: number; page: number; pageSize: number }>(
    `/api/admin/customers?${qs.toString()}`
  );
}

export async function getCustomer(id: string) {
  return http<CustomerItem>(`/api/admin/customers/${id}`);
}

export async function approveCustomer(id: string) {
  return http(`/api/admin/customers/${id}/approve`, { method: 'POST' });
}

export async function rejectCustomer(id: string, reason: string) {
  return http(`/api/admin/customers/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
