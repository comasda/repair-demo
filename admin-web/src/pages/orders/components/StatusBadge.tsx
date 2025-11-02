import React from 'react';
import type { OrderStatus } from '../types';

const labelMap: Record<OrderStatus, string> = {
  pending: '待处理',
  offered: '待接收',
  assigned: '已指派',
  checkedIn: '已到场',
  awaitingConfirm: '待确认',
  done: '已完成',
  cancelled: '已取消',
};

const colorMap: Record<OrderStatus, string> = {
  pending: '#999999',
  offered: '#f59e0b',
  assigned: '#3b82f6',
  checkedIn: '#10b981',
  awaitingConfirm: '#a855f7',
  done: '#22c55e',
  cancelled: '#ef4444',
};

export default function StatusBadge({ s }: { s: OrderStatus }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 12,
        background: '#f5f5f5',
        color: colorMap[s] || '#666',
        fontSize: 12,
      }}
    >
      {labelMap[s] ?? s}
    </span>
  );
}
