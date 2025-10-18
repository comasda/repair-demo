// 订单、技师等公共类型
export type OrderStatus =
  | 'pending'
  | 'offered'
  | 'assigned'
  | 'checkedIn'
  | 'awaitingConfirm'
  | 'done';

export interface Order {
  _id: string;
  id?: string;
  customer?: string;
  customerId?: string;
  device?: string;
  issue?: string;
  phone?: string;
  address?: string;
  images?: string[];
  time?: string;
  status: OrderStatus;
  technicianId?: string | null;
  technicianName?: string | null;
  offerFlow?: {
    offeredAt?: string;
    offeredBy?: string;
    acceptedAt?: string;
    declinedAt?: string;
    declineNote?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TechnicianUser {
  _id: string;
  username: string; // 从 User.js 返回
}
