import React, { useEffect, useState } from 'react';
import type { Order } from '../types';
import { approveOrderComplete, rejectOrderComplete } from '../services/orderApi';
import MediaViewer from './MediaViewer';

// 签到佐证的五个分类
const CHECKIN_CATEGORIES = [
  { key: 'front', label: '设备正面' },
  { key: 'circuit', label: '电路图' },
  { key: 'qrcode', label: '二维码' },
  { key: 'site', label: '维修点' },
  { key: 'finish', label: '维修完成图' },
] as const;
type CheckinCategoryKey = (typeof CHECKIN_CATEGORIES)[number]['key'];

interface Props {
  visible: boolean;
  order: Order | null;
  onOk: () => void;
  onCancel: () => void;
}

export default function CompleteReviewModal({ visible, order, onOk, onCancel }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerItems, setViewerItems] = useState<any[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

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

  const openMediaViewer = (items: any[], index: number) => {
    setViewerItems(items);
    setViewerIndex(index);
    setViewerVisible(true);
  };

  return (
    <>
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
            borderRadius: 12,
            padding: 24,
            maxWidth: '90vw',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 20, fontWeight: 700 }}>
            ✅ 审核订单完成申请
          </h3>

          <div style={{ marginBottom: 12 }}>
            <span style={{ color: '#6b7280', fontWeight: 500 }}>订单号：</span>
            <span style={{ fontWeight: 700, marginLeft: 8, fontSize: 15 }}>
              {order.id || order._id?.slice(-6)}
            </span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <span style={{ color: '#6b7280', fontWeight: 500 }}>当前状态：</span>
            <span style={{ fontWeight: 700, marginLeft: 8, fontSize: 15, color: '#dc2626' }}>
              {order.status === 'awaitingConfirm' ? '⏳ 待完成审核' : order.status}
            </span>
          </div>

          {/* 签到媒体预览（可点击放大） */}
          {order.checkinMedia && (
            <div style={{ marginBottom: 24, padding: '16px', background: '#f9fafb', borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600, color: '#111827' }}>
                📸 签到佐证
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
                {CHECKIN_CATEGORIES.map(({ key, label }) => {
                  const list = order.checkinMedia?.[key] ?? [];
                  if (!list.length) return null;
                  
                  return (
                    <div key={key}>
                      <div style={{ fontSize: 12, marginBottom: 6, color: '#6b7280', fontWeight: 500 }}>
                        {label} ({list.length})
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {list.map((item: any, idx: number) =>
                          item.type === 'image' ? (
                            <div
                              key={idx}
                              onClick={() => openMediaViewer(list, idx)}
                              style={{
                                width: 90,
                                height: 90,
                                borderRadius: 6,
                                overflow: 'hidden',
                                border: '1px solid #e5e7eb',
                                background: '#f3f4f6',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'transform 200ms ease, box-shadow 200ms ease',
                                transform: 'scale(1)'
                              }}
                            >
                              <img
                                src={item.url}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 18,
                                  color: 'rgba(255,255,255,0.9)'
                                }}
                              >
                                🔍
                              </div>
                            </div>
                          ) : (
                            <div
                              key={idx}
                              onClick={() => openMediaViewer(list, idx)}
                              style={{
                                width: 90,
                                height: 60,
                                borderRadius: 6,
                                overflow: 'hidden',
                                border: '2px solid #e5e7eb',
                                background: '#000',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'transform 200ms ease, box-shadow 200ms ease',
                                transform: 'scale(1)'
                              }}
                            >
                              <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 20,
                                  color: '#fff'
                                }}
                              >
                                ▶️
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 驳回理由输入框 */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                color: '#374151',
                marginBottom: 8,
                display: 'block',
                fontWeight: 500,
              }}
            >
              驳回理由（可选）：
            </label>
            <textarea
              placeholder="若驳回，请输入驳回理由..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                color: '#111827',
                outline: 'none',
                background: '#fff',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                fontSize: 14,
              }}
            />
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={onCancel}
              style={{
                background: '#e5e7eb',
                color: '#111827',
                borderRadius: 8,
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: '500',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = '#e5e7eb';
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
                borderRadius: 8,
                padding: '8px 16px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: '500',
                minWidth: 90,
                opacity: loading ? 0.7 : 1,
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.background = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = '#dc2626';
              }}
            >
              {loading ? '提交中…' : '🚫 驳回'}
            </button>

            <button
              onClick={handleApprove}
              disabled={loading}
              style={{
                background: '#16a34a',
                color: '#fff',
                borderRadius: 8,
                padding: '8px 16px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: '500',
                minWidth: 90,
                opacity: loading ? 0.7 : 1,
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.background = '#15803d';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = '#16a34a';
              }}
            >
              {loading ? '提交中…' : '✅ 通过'}
            </button>
          </div>
        </div>
      </div>

      {/* 媒体全屏预览器 */}
      <MediaViewer
        visible={viewerVisible}
        items={viewerItems}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
      />
    </>
  );
}
