import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';

interface MediaItem {
  url: string;
  type?: 'image' | 'video' | string;
  [k: string]: any;
}

interface Props {
  visible: boolean;
  items: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
}

export default function MediaViewer({ visible, items = [], initialIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  // 增大初始显示比例以在打开时更显眼
  const initialScale = 1.25;
  const [scale, setScale] = useState(initialScale);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPan = useRef<{ x: number; y: number } | null>(null);
  const startTouch = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setIndex(initialIndex), [initialIndex, visible]);

  // 在打开或切换图片时重置缩放与位移（保证每张图初始放大一致）
  useEffect(() => {
    if (!visible) return;
    setScale(initialScale);
    setTranslate({ x: 0, y: 0 });
  }, [index, visible]);

  useEffect(() => {
    if (!visible) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      setScale(initialScale);
      setTranslate({ x: 0, y: 0 });
    };
  }, [visible]);

  const clamp = (v: number, a = 1, b = 4) => Math.min(b, Math.max(a, v));

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setIndex((i) => Math.min(items.length - 1, i + 1)), [items.length]);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (!visible) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    },
    [visible, onClose, goPrev, goNext]
  );

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  // 鼠标滚轮缩放（滚轮时阻止默认滚动）
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 0.15;
    setScale((s) => {
      const next = clamp(s + delta);
      if (next === 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  };

  // 双击切换缩放（从初始 scale 切到更大，再回到初始）
  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((s) => (s <= initialScale ? Math.max(2, initialScale * 1.6) : initialScale));
    if (scale !== 1) setTranslate({ x: 0, y: 0 });
  };

  // 指针/鼠标拖拽平移（仅在 scale>1 时）
  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) {
      // 记录可能用于 swipe
      startTouch.current = { x: e.clientX, y: e.clientY };
      return;
    }
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsPanning(true);
    startPan.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning || !startPan.current) return;
    const x = e.clientX - startPan.current.x;
    const y = e.clientY - startPan.current.y;
    setTranslate({ x, y });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      startPan.current = null;
      return;
    }
    // 非缩放状态下检测水平滑动切换图片（移动端/鼠标）
    if (startTouch.current) {
      const dx = e.clientX - startTouch.current.x;
      if (Math.abs(dx) > 60) {
        if (dx > 0) goPrev();
        else goNext();
      }
      startTouch.current = null;
    }
  };

  // 触摸手势（兼容部分移动端）
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!startTouch.current) return;
    const dx = e.touches[0].clientX - startTouch.current.x;
    const dy = e.touches[0].clientY - startTouch.current.y;
    // 如果已缩放则进行平移（简单实现：调整 translate）
    if (scale > 1 && Math.abs(dx) + Math.abs(dy) > 2) {
      setTranslate((t) => ({ x: t.x + dx * 0.5, y: t.y + dy * 0.5 }));
      startTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!startTouch.current) return;
    const last = startTouch.current;
    // 无缩放：按水平滑动切换
    if (scale === 1 && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - last.x;
      if (Math.abs(dx) > 60) {
        if (dx > 0) goPrev();
        else goNext();
      }
    }
    startTouch.current = null;
  };

  if (!visible) return null;
  const curr = items[index] || {};

  const content = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxSizing: 'border-box',
        touchAction: 'none',
      }}
    >
      {/* 关闭按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: 'fixed',
          top: 18,
          right: 18,
          zIndex: 40010,
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          border: 'none',
          borderRadius: 18,
          width: 36,
          height: 36,
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
        aria-label="关闭"
      >
        ✕
      </button>

      {/* 左右切换按钮 */}
      {index > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          style={{
            position: 'fixed',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 40010,
            background: 'rgba(0,0,0,0.25)',
            border: 'none',
            color: '#fff',
            fontSize: 26,
            cursor: 'pointer',
            width: 48,
            height: 72,
            borderRadius: 8,
            pointerEvents: 'auto',
          }}
          aria-label="上一张"
        >
          ‹
        </button>
      )}
      {index < items.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          style={{
            position: 'fixed',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 40010,
            background: 'rgba(0,0,0,0.25)',
            border: 'none',
            color: '#fff',
            fontSize: 26,
            cursor: 'pointer',
            width: 48,
            height: 72,
            borderRadius: 8,
            pointerEvents: 'auto',
          }}
          aria-label="下一张"
        >
          ›
        </button>
      )}

      {/* 中央媒体区（扩大可用最大尺寸） */}
      <div
        ref={containerRef}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '98vw',
          maxHeight: '96vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {curr.type === 'video' || /\.mp4$|\.webm$|\.ogg$/i.test(curr.url || '') ? (
          <video
            key={curr.url}
            src={curr.url}
            controls
            autoPlay
            style={{ width: '80vw', maxHeight: '90vh', borderRadius: 8 }}
          />
        ) : (
          <img
            key={curr.url}
            src={curr.url}
            alt=""
            draggable={false}
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transition: isPanning ? 'none' : 'transform 150ms ease',
              width: '80vw',            // 强制占据更大视窗宽度，哪怕原图较小（可继续调整）
              height: 'auto',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 8,
              display: 'block',
              userSelect: 'none',
              touchAction: scale > 1 ? 'none' : 'pan-y',
            }}
          />
        )}
      </div>

      {/* 底部页码 */}
      <div
        style={{
          position: 'fixed',
          bottom: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontSize: 13,
          zIndex: 40010,
          background: 'rgba(0,0,0,0.28)',
          padding: '6px 10px',
          borderRadius: 6,
        }}
      >
        {index + 1} / {items.length}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}
