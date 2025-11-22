import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import type { Order } from '../types';
import MediaViewer from './MediaViewer';

const isVideoAsset = (url: string) => /\.(mp4|mov|webm|ogg|m4v)$/i.test(url || '');

interface Props {
  data: Order[];
  assigningId?: string | null;
  onAssignClick: (row: Order) => void;
  onStatusClick: (row: Order) => void;
  onCompleteReview: (row: Order) => void;
  onViewCheckinMedia: (row: Order) => void;
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

export default function OrdersTable({
  data,
  assigningId,
  onAssignClick,
  onStatusClick,
  onCompleteReview,
  onViewCheckinMedia,
}: Props) {
  // 全屏预览
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerItems, setViewerItems] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    src: string;
    left: number;
    top: number;
    type: 'image' | 'video';
  }>({ visible: false, src: '', left: 0, top: 0, type: 'image' });
  const openViewer = (images: string[], idx: number) => {
    setViewerItems(images.map((url) => ({ url, type: isVideoAsset(url) ? 'video' : 'image' })));
    setViewerIndex(idx);
    setViewerVisible(true);
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const renderThumbContent = (src: string) => {
    if (isVideoAsset(src)) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#050b16',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            letterSpacing: 1,
          }}
        >
          ▶
        </div>
      );
    }
    return (
      <img
        src={src}
        loading="lazy"
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  };

  const updateTooltipPosition = (rect: DOMRect) => ({
    left: rect.right + 8,
    top: rect.top,
  });

  const handleThumbMouseEnter = (src: string) => (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      src,
      ...updateTooltipPosition(rect),
      type: isVideoAsset(src) ? 'video' : 'image',
    });
  };

  const handleThumbMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip((prev) => ({ ...prev, ...updateTooltipPosition(rect) }));
  };

  const handleThumbMouseLeave = () => setTooltip((prev) => ({ ...prev, visible: false }));

  const renderThumbStack = (images: string[]) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 140 }}>
      {images.slice(0, 3).map((src, i) => (
        <div
          key={i}
          title="点击查看大图"
          onClick={() => openViewer(images, i)}
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
          onMouseEnter={handleThumbMouseEnter(src)}
          onMouseMove={handleThumbMouseMove}
          onMouseLeave={handleThumbMouseLeave}
        >
          {renderThumbContent(src)}
        </div>
      ))}
      {images.length > 3 && (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#374151',
            background: '#fff',
          }}
        >
          +{images.length - 3}
        </div>
      )}
    </div>
  );

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
                  renderThumbStack(row.images as string[])
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
                  renderThumbStack(row.checkinImages as string[])
                ) : (
                  <span style={{ color: '#9ca3af' }}>—</span>
                )}
                {!!row.checkinMedia && (
                  <button
                    onClick={() => onViewCheckinMedia(row)}
                    style={{
                      display: 'block',
                      marginTop: 6,
                      padding: '4px 8px',
                      background: '#111827',
                      color: '#fff',
                      fontSize: 12,
                      borderRadius: 6,
                      cursor: 'pointer',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    查看佐证
                  </button>
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
                {/* 仅在 “待完成审核” 状态下显示完成审核按钮 */}
                {row.status === 'awaitingConfirm' && (
                  <button
                    onClick={() => onCompleteReview(row)}
                    style={{
                      marginLeft: 6,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #e5e7eb',
                      background: '#111827',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    完成审核
                  </button>
                )}
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
        {tooltip.type === 'video' ? (
          <video
            src={tooltip.src}
            muted
            autoPlay
            loop
            playsInline
            style={{
              width: 160,
              height: 160,
              objectFit: 'cover',
              borderRadius: 6,
              display: 'block',
            }}
          />
        ) : (
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
        )}
      </div>
    )}

    {/* 全屏图片查看器（支持滚轮缩放） */}
    <MediaViewer
      visible={viewerVisible}
      items={viewerItems}
      initialIndex={viewerIndex}
      onClose={() => setViewerVisible(false)}
    />
    </>
  );
}
