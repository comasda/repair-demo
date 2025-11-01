// src/services/technicianApi.ts
import http from '../services/http';

export interface TechnicianItem {
  _id: string;
  username?: string;
  phone?: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  idCard?: { name?: string; number?: string };
  createdAt?: string;
  reviewAudit?: { auditedAt?: string; auditedBy?: string; result?: string; reason?: string };
}

export interface TechnicianListResp {
  items: TechnicianItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function listTechnicians(params: {
  status?: 'pending' | 'approved' | 'rejected';
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  return http.get<TechnicianListResp>('/admin/technicians', { params }).then(r => r.data);
}

export function getTechnician(id: string) {
  return http.get<TechnicianItem>(`/admin/technicians/${id}`).then(r => r.data);
}

export function approveTechnician(id: string) {
  return http.post(`/admin/technicians/${id}/approve`, {}).then(r => r.data);
}

export function rejectTechnician(id: string, reason: string) {
  return http.post(`/admin/technicians/${id}/reject`, { reason }).then(r => r.data);
}
