import http from '@/services/http'; // axios 实例封装
import { Order, TechnicianUser } from '../types';

// 获取订单列表
export async function fetchOrders(status?: string): Promise<Order[]> {
  const url = `/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`;
  const res = await http.get<Order[] | { ok: boolean; data: Order[] }>(url);
  if (Array.isArray(res)) return res;
  if ('data' in res && Array.isArray(res.data)) return res.data;
  return [];
}

// 分配订单
export async function assignOrder(
  id: string,
  technicianId: string,
  technicianName: string
): Promise<Order> {
  const res = await http.post<Order | { ok: boolean; data: Order; message?: string }>(
    `/admin/orders/${id}/assign`,
    { technicianId, technicianName }
  );

  // 类型守卫：如果是 {ok,data}
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: Order }).data;
  }
  // 如果后端直接返回 Order 对象
  return res as Order;
}

// 获取技师列表
export async function fetchTechnicians(q?: string): Promise<TechnicianUser[]> {
  const url = `/technicians${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  const res = await http.get<TechnicianUser[] | { ok: boolean; data: TechnicianUser[] }>(url);
  if (Array.isArray(res)) return res;
  if ('data' in res && Array.isArray(res.data)) return res.data;
  return [];
}