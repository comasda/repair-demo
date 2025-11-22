import React, { useState } from 'react';
import MediaViewer from './MediaViewer';

interface Props {
  visible: boolean;
  media: any;  // order.checkinMedia
  onClose: () => void;
}

const LABELS: Record<string, string> = {
  front: '设备正面',
  circuit: '电路图',
  qrcode: '二维码',
  site: '维修点',
  finish: '维修完成图'
};

export default function CheckinMediaModal({ visible, media, onClose }: Props) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerItems, setViewerItems] = useState<any[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (!visible || !media) return null;

  const modalStyles: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const contentStyles: React.CSSProperties = {
    width: '85%',
    maxHeight: '85vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
  };

  const openMediaViewer = (items: any[], index: number) => {
    setViewerItems(items);
    setViewerIndex(index);
    setViewerVisible(true);
  };

  return (
    <>
      <div style={modalStyles} onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} style={contentStyles}>
          <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20, fontWeight: 700, color: '#111827' }}>
            📸 查看签到佐证
          </h3>

          {Object.keys(LABELS).map((key) => {
            const list = media[key] || [];
            return (
              <div key={key} style={{ marginBottom: 28 }}>
                <h4 style={{ marginBottom: 12, fontSize: 15, fontWeight: 600, color: '#374151' }}>
                  {LABELS[key]}
                  <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                    ({list.length})
                  </span>
                </h4>

                {list.length === 0 ? (
                  <div style={{ 
                    color: '#9ca3af', 
                    padding: '12px 16px', 
                    background: '#f9fafb',
                    borderRadius: 6,
                    fontSize: 13
                  }}>
                    暂无内容
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                    {list.map((item: any, i: number) =>
                      item.type === 'image' ? (
                        <div
                          key={i}
                          onClick={() => openMediaViewer(list, i)}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: 8,
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb',
                            background: '#f3f4f6',
                            cursor: 'pointer',
                            transition: 'transform 200ms ease, box-shadow 200ms ease',
                            position: 'relative',
                            transform: 'scale(1)',
                          }}
                        >
                          <img
                            src={item.url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 28,
                              color: 'rgba(255,255,255,0.9)'
                            }}
                          >
                            🔍
                          </div>
                        </div>
                      ) : (
                        <div
                          key={i}
                          onClick={() => openMediaViewer(list, i)}
                          style={{
                            width: '100%',
                            aspectRatio: '16/10',
                            borderRadius: 8,
                            overflow: 'hidden',
                            border: '2px solid #e5e7eb',
                            background: '#000',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'transform 200ms ease, box-shadow 200ms ease',
                            transform: 'scale(1)'
                          }}
                        >
                          <video
                            src={item.url}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0, 0, 0, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 24,
                              color: '#fff',
                            }}
                          >
                            ▶️
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* 关闭按钮 */}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#e5e7eb',
                color: '#111827',
                border: '1px solid #d1d5db',
                borderRadius: 8,
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
              关闭
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
