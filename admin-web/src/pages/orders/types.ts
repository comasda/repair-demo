// 订单、技师等公共类型
export type OrderStatus =
  | 'pending'
  | 'offered'
  | 'assigned'
  | 'checkedIn'
  | 'awaitingConfirm'
  | 'done'
  | 'cancelled'

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
  checkinImages?: string[];
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
  name: string;   // 身份证姓名
  phone: string;
}
