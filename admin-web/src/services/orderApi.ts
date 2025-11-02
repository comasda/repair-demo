import http from './http';

export const listOrders = (status?: string) =>
  http.get(`/admin/orders${status ? `?status=${status}` : ''}`);

export const assignOrder = (id: string, technicianId: string, technicianName: string) =>
  http.post(`/admin/orders/${id}/assign`, { technicianId, technicianName });

export async function updateOrderStatus(id: string, status: string, reason?: string) {
  return http.post(`/admin/orders/${id}/status`, { status, reason });
}
