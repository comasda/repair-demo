import React from 'react';
import StatusBadge from './StatusBadge';
import type { Order } from '../types';

interface Props {
  data: Order[];
  assigningId?: string | null;
  onAssignClick: (row: Order) => void;
  onStatusClick: (row: Order) => void;
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontWeight: 600,
  color: '#374151',
  borderBottom: '1px solid #eee',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '10px 12px',
  color: '#111827',
  verticalAlign: 'top',
};

export default function OrdersTable({ data, assigningId, onAssignClick, onStatusClick  }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #eee' }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            <th style={th}>工单号</th>
            <th style={th}>客户</th>
            <th style={th}>设备</th>
            <th style={th}>故障</th>
            <th style={th}>地址</th>
            <th style={th}>状态</th>
            <th style={th}>技师</th>
            <th style={th}>创建时间</th>
            <th style={th}>操作</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={9} style={{ padding: 16, textAlign: 'center', color: '#999' }}>
                暂无数据
              </td>
            </tr>
          )}
          {data.map(row => (
            <tr key={row._id} style={{ borderTop: '1px solid #f0f0f0' }}>
              <td style={td}>{row.id ?? (row._id ? row._id.slice(-6) : '—')}</td>
              <td style={td}>{row.customer ?? '-'}</td>
              <td style={td}>{row.device ?? '-'}</td>
              <td style={td}>{row.issue ?? '-'}</td>
              <td style={td}>{row.address ?? '-'}</td>
              <td style={td}><StatusBadge s={row.status} /></td>
              <td style={td}>{row.technicianName || row.technicianId || '-'}</td>
              <td style={td}>{row.time || row.createdAt || '-'}</td>
              <td style={td}>
                <button
                  onClick={() => onAssignClick(row)}
                  disabled={!['pending', 'offered'].includes(row.status) || assigningId === row._id}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: ['pending', 'offered'].includes(row.status) ? '#111827' : '#9ca3af',
                    color: '#fff',
                    cursor: ['pending', 'offered'].includes(row.status) ? 'pointer' : 'not-allowed',
                  }}
                >
                  {assigningId === row._id ? '指派中…' : '指派'}
                </button>
                <button
                  onClick={() => onStatusClick(row)}
                  style={{
                    marginLeft: 6,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: '#2563eb',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  修改状态
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
