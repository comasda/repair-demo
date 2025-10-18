export type OrderStatus = 'pending'|'offered'|'assigned'|'checkedIn'|'awaitingConfirm'|'done'
export interface Order {
  _id: string
  device?: string
  issue?: string
  address?: string
  locationAddress?: string
  customerName?: string
  customerId?: string
  technicianId?: string | null
  technicianName?: string | null
  status: OrderStatus
  statusText?: string
  time?: string
}

