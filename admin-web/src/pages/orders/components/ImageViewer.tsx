import React, { useEffect, useState } from 'react';

interface Props {
  visible: boolean;
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function ImageViewer({ visible, images, index, onClose, onPrev, onNext }: Props) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose, onPrev, onNext]);

  // 当切换图片或打开时复位缩放
  useEffect(() => { if (visible) setScale(1); }, [visible, index]);

  if (!visible) return null;
  const src = images[index] || '';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
        cursor: 'zoom-out'
      }}
    >
      {/* 阻止冒泡，点击图片不关闭；支持滚轮缩放 */}
      <div
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY;
          setScale(s => {
            const next = delta > 0 ? s * 0.9 : s * 1.1;
            return Math.min(3, Math.max(0.5, parseFloat(next.toFixed(2))));
          });
        }}
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
      >
        <img
          src={src}
          alt=""
          onDoubleClick={() => setScale(1)}   // 双击复位到 1x
          style={{
            maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain',
            transform: `scale(${scale})`,
            transition: 'transform 80ms ease-out',
            transformOrigin: 'center center',
            borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.35)', background: '#111'
          }}
        />
        {/* 左右箭头 */}
        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              title="上一张 ←"
              style={{
                position: 'absolute', left: -56, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '999px', background: 'rgba(255,255,255,0.9)',
                border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 18
              }}
            >‹</button>
            <button
              onClick={onNext}
              title="下一张 →"
              style={{
                position: 'absolute', right: -56, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '999px', background: 'rgba(255,255,255,0.9)',
                border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 18
              }}
            >›</button>
          </>
        )}
        {/* 右上角关闭 */}
        <button
          onClick={onClose}
          title="关闭 (Esc)"
          style={{
            position: 'absolute', right: -56, top: -56,
            background: '#e5e7eb', color: '#111', borderRadius: 8, padding: '6px 10px', cursor: 'pointer'
          }}
        >关闭</button>
        {/* 底部序号 */}
        <div style={{
          position: 'absolute', bottom: -36, left: '50%', transform: 'translateX(-50%)',
          color: '#fff', fontSize: 12, opacity: 0.85
        }}>
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
