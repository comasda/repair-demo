import http from '@/services/http'; // axios 实例封装
import { Order, TechnicianUser } from '../types';

// 导出参数类型定义
export type ExportParams = {
  status?: string;
  from?: string;
  to?: string;
};

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

export async function fetchApprovedTechnicians(keyword = '') {
  const res = await http.get('/technicians/approved', { params: { q: keyword } });
  return res.data?.list || [];
}

// 导出订单功能函数
export async function exportOrders(params?: ExportParams) {
  const res = await http.get('/admin/orders/export', {
    params,
    responseType: 'blob',
  });

  // 从响应头提取文件名
  const cd = (res.headers as any)['content-disposition'] as string | undefined;
  let filename = `订单导出_${new Date().toISOString().slice(0, 10)}.xlsx`;
  if (cd) {
    const m = cd.match(/filename\*?=(?:UTF-8'')?("?)([^";]+)\1/i);
    if (m && m[2]) filename = decodeURIComponent(m[2]);
  }

  const blob = new Blob([res.data], {
    type:
      (res.headers as any)['content-type'] ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // 创建下载链接并触发下载
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}