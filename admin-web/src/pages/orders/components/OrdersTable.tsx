import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import type { Order } from '../types';
import ImageViewer from './ImageViewer';

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
  // 全屏预览
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const openViewer = (images: string[], idx: number) => {
    setViewerImages(images);
    setViewerIndex(idx);
    setViewerOpen(true);
    // 打开全屏时，确保悬浮预览消失
    setTooltip(prev => ({ ...prev, visible: false }));
  };
  const closeViewer = () => setViewerOpen(false);
  const prevViewer = () => setViewerIndex(i => (i - 1 + viewerImages.length) % viewerImages.length);
  const nextViewer = () => setViewerIndex(i => (i + 1) % viewerImages.length);

  // 悬浮放大预览（160x160，跟随鼠标元素右侧）
  const [tooltip, setTooltip] = useState<{visible: boolean; src: string; left: number; top: number}>({
    visible: false, src: '', left: 0, top: 0
  });
  return (
    <>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #eee' }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            <th style={th}>工单号</th>
            <th style={th}>客户</th>
            <th style={th}>设备</th>
            <th style={th}>故障</th>
            <th style={th}>客户图片</th>
            <th style={th}>地址</th>
            <th style={th}>状态</th>
            <th style={th}>技师</th>
            <th style={th}>签到图片</th>
            <th style={th}>创建时间</th>
            <th style={th}>操作</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={11} style={{ padding: 16, textAlign: 'center', color: '#999' }}>
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
              <td style={td}>
                {Array.isArray(row.images) && row.images.length > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 140 }}>
                    {row.images.slice(0, 3).map((src: string, i: number) => (
                      <div
                        key={i}
                        title="点击查看大图"
                        onClick={() => openViewer(row.images as string[], i)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          overflow: 'hidden',
                          border: '1px solid #e5e7eb',
                          background: '#f3f4f6',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            visible: true,
                            src,
                            left: rect.right + 8,
                            top: rect.top
                          });
                        }}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip(t => ({
                            ...t,
                            left: rect.right + 8,
                            top: rect.top
                          }));
                        }}
                        onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}                        
                      >
                        <img
                          src={src}
                          loading="lazy"
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    ))}
                    {row.images.length > 3 && (
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: 6,
                          border: '1px solid #e5e7eb',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, color: '#374151', background: '#fff'
                        }}
                      >
                        +{row.images.length - 3}
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ color: '#9ca3af' }}>—</span>
                )}
              </td>
              <td style={td}>{row.address ?? '-'}</td>
              <td style={td}><StatusBadge s={row.status} /></td>
              <td style={td}>{row.technicianName || row.technicianId || '-'}</td>
              {/* 新增：签到图片 checkinImages 列 */}
              <td style={td}>
                {Array.isArray(row.checkinImages) && row.checkinImages.length > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 140 }}>
                    {row.checkinImages.slice(0, 3).map((src: string, i: number) => (
                      <div
                        key={i}
                        title="点击查看大图"
                        onClick={() => openViewer(row.checkinImages as string[], i)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          overflow: 'hidden',
                          border: '1px solid #e5e7eb',
                          background: '#f3f4f6',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            visible: true,
                            src,
                            left: rect.right + 8,
                            top: rect.top
                          });
                        }}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip(t => ({
                            ...t,
                            left: rect.right + 8,
                            top: rect.top
                          }));
                        }}
                        onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}                        
                      >
                        <img
                          src={src}
                          loading="lazy"
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    ))}
                      {/* 若多于 3 张显示 +N */}
                    {row.checkinImages.length > 3 && (
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: 6,
                          border: '1px solid #e5e7eb',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, color: '#374151', background: '#fff'
                        }}
                      >
                        +{row.checkinImages.length - 3}
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ color: '#9ca3af' }}>—</span>
                )}
              </td>              
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
    
    {/* 悬浮预览卡片（160x160） */}
    {tooltip.visible && (
      <div
        style={{
          position: 'fixed',
          left: tooltip.left,
          top: tooltip.top,
          zIndex: 2000,
          padding: 4,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <img
          src={tooltip.src}
          alt=""
          style={{
            width: 160,
            height: 160,
            objectFit: 'cover',
            borderRadius: 6,
            display: 'block',
          }}
        />
      </div>
    )}

    {/* 全屏图片查看器（支持滚轮缩放） */}
    <ImageViewer
      visible={viewerOpen}
      images={viewerImages}
      index={viewerIndex}
      onClose={closeViewer}
      onPrev={prevViewer}
      onNext={nextViewer}
    />
    </>
  );
}
