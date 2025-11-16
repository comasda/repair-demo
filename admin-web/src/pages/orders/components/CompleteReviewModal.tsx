import React, { useEffect, useState } from 'react';
import type { Order } from '../types';
import { approveOrderComplete, rejectOrderComplete } from '../services/orderApi';

interface Props {
  visible: boolean;
  order: Order | null;
  onOk: () => void;
  onCancel: () => void;
}

export default function CompleteReviewModal({ visible, order, onOk, onCancel }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // 打开时清空输入
  useEffect(() => {
    if (visible) {
      setReason('');
    }
  }, [visible]);

  if (!visible || !order) return null;

  async function handleApprove() {
    if (!order) return;
    if (!window.confirm('确认审核通过该订单并标记为已完成？')) return;
    try {
      setLoading(true);
      await approveOrderComplete(order._id);
      alert('审核通过，订单已完成');
      onOk();
    } catch (e: any) {
      alert(e?.message || '审核失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!order) return;
    if (!window.confirm('确认要驳回该订单的完成申请？')) return;
    try {
      setLoading(true);
      await rejectOrderComplete(order._id, reason || '');
      alert('完成申请已驳回');
      onOk();
    } catch (e: any) {
      alert(e?.message || '操作失败');
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
          审核订单完成申请
        </h3>

        <div style={{ marginBottom: 8 }}>
          <span style={{ color: '#6b7280' }}>订单号：</span>
          <span style={{ fontWeight: 600, marginLeft: 4 }}>
            {order.id || order._id?.slice(-6)}
          </span>
        </div>

        <div style={{ marginBottom: 12 }}>
          <span style={{ color: '#6b7280' }}>当前状态：</span>
          <span style={{ fontWeight: 600, marginLeft: 4 }}>
            {order.status === 'awaitingConfirm' ? '待完成审核' : order.status}
          </span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              color: '#6b7280',
              marginBottom: 4,
              display: 'block',
            }}
          >
            驳回理由（可选）：
          </label>
          <textarea
            placeholder="请输入驳回理由（可留空）"
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
              boxSizing: 'border-box',
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
            onClick={handleReject}
            disabled={loading}
            style={{
              background: '#dc2626',
              color: '#fff',
              borderRadius: 6,
              padding: '6px 12px',
              minWidth: 80,
            }}
          >
            驳回
          </button>

          <button
            onClick={handleApprove}
            disabled={loading}
            style={{
              background: '#16a34a',
              color: '#fff',
              borderRadius: 6,
              padding: '6px 12px',
              minWidth: 80,
            }}
          >
            {loading ? '提交中…' : '通过'}
          </button>
        </div>
      </div>
    </div>
  );
}
