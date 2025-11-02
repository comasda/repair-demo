import React, { useState } from 'react';
import { updateOrderStatus } from '../../../services/orderApi';
import type { Order } from '../types';
import { useEffect } from 'react';

interface Props {
  visible: boolean;
  order: Order | null;
  onOk: () => void;
  onCancel: () => void;
}

const statusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'offered', label: '待接收' },
  { value: 'assigned', label: '已指派' },
  { value: 'checkedIn', label: '已到场' },
  { value: 'awaitingConfirm', label: '待确认' },
  { value: 'done', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function StatusModal({ visible, order, onOk, onCancel }: Props) {
  const [nextStatus, setNextStatus] = useState(order?.status || '');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // 每次打开或切换订单时，同步初始值
  useEffect(() => {
    if (visible && order) {
      setNextStatus(order.status || '');
      setReason('');
    }
  }, [visible, order]);

  if (!visible || !order) return null;

  async function handleSubmit() {
    if (!nextStatus) return alert('请选择目标状态');
    try {
      setLoading(true);
      if (!order) return;
      const id = order._id;
      await updateOrderStatus(id, nextStatus, reason);
      alert('状态修改成功');
      onOk();
    } catch (e: any) {
      alert(`操作失败：${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          color: '#111827',
          borderRadius: 10,
          padding: 20,
          minWidth: 380,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 18, fontWeight: 600 }}>
          修改订单状态
        </h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ color: '#6b7280', marginRight: 6 }}>当前状态：</label>
          <span style={{ fontWeight: 600, color: '#111827' }}>{order.status}</span>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ color: '#6b7280', marginBottom: 4, display: 'block' }}>选择新状态：</label>
          <select
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              color: '#111827',
              background: '#fff'
            }}
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
          >
            <option value="">请选择</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#6b7280', marginBottom: 4, display: 'block' }}>备注：</label>
          <textarea
            placeholder="备注（可选）"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 6,
              border: '1px solid #d1d5db',
              color: '#111827',
              outline: 'none',
              background: '#fff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              background: '#e5e7eb',
              color: '#111827',
              borderRadius: 6,
              padding: '6px 12px',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: '#111827',
              color: '#fff',
              borderRadius: 6,
              padding: '6px 12px',
              minWidth: 70
            }}
          >
            {loading ? '提交中…' : '确定'}
          </button>
        </div>
      </div>
    </div>
  );
}
