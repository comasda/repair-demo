import React, { useEffect, useMemo, useState } from 'react';
import { fetchTechnicians } from '../services/orderApi';
import type { TechnicianUser } from '../types';

interface Props {
  visible: boolean;
  onOk: (id: string, name: string) => void;
  onCancel: () => void;
}

export default function AssignModal({ visible, onOk, onCancel }: Props) {
  const [technicians, setTechnicians] = useState<TechnicianUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [q, setQ] = useState(''); // 关键字过滤（前端本地过滤 + 可选后端 q）

  // 本地关键字过滤（不打扰后端）
  const filtered = useMemo(() => {
    if (!q.trim()) return technicians;
    const kw = q.trim();
    return technicians.filter(t => t.username.includes(kw));
  }, [technicians, q]);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchTechnicians(); // 若要后端搜索：传入 q
        setTechnicians(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        alert(`加载技师失败：${(e as Error).message}`);
        setTechnicians([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  if (!visible) return null;

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
          background: '#fff',
          borderRadius: 8,
          padding: 20,
          minWidth: 360,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>指派技师</h3>

        {loading ? (
          <p>加载中...</p>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <input
                placeholder="输入关键词过滤（本地）"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ width: '100%', padding: 6 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>选择技师：</label>
              <select
                style={{ width: '100%', padding: 6 }}
                value={selectedId}
                onChange={(e) => {
                  const id = e.target.value;
                  const name = filtered.find(t => t._id === id)?.username || '';
                  setSelectedId(id);
                  setSelectedName(name);
                }}
              >
                <option value="">请选择技师</option>
                {filtered.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.username}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel}>取消</button>
          <button
            onClick={() => onOk(selectedId, selectedName)}
            disabled={!selectedId}
            style={{
              background: selectedId ? '#111827' : '#9ca3af',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: selectedId ? 'pointer' : 'not-allowed',
            }}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
