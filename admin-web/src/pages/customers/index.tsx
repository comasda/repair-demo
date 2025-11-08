// src/pages/customers/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { listCustomers, CustomerItem } from '../../services/customerApi';
import ReviewDrawer from './components/ReviewDrawer';

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#374151', borderBottom: '1px solid #eee' };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 14, color: '#111827' };

export default function CustomerReviewPage() {
  const [status, setStatus] = useState<'pending'|'approved'|'rejected'|''>('pending');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerItem[]>([]);
  const [total, setTotal] = useState(0);

  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listCustomers({ status: status || undefined, q: q || undefined, page, pageSize });
      setData(res.items || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      alert(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status, q, page, pageSize]);

  const openDrawer = (id: string) => { setDrawerId(id); setDrawerVisible(true); };
  const closeDrawer = () => setDrawerVisible(false);
  const onChanged = () => load();

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        color: '#fff'
      }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>客户审核</h2>
        <label>
          状态：
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} style={{ marginLeft: 8, padding: '6px 8px' }}>
            <option value="">全部</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
          </select>
        </label>

        <input
          placeholder="用户名/手机号/实名"
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
          style={{ padding: '6px 8px', width: 220 }}
        />
        <button
          onClick={() => { setPage(1); load(); }}
          style={{ background: '#111827', color: '#fff', padding: '6px 10px', borderRadius: 6 }}
        >搜索</button>
        <button
          onClick={() => { setQ(''); setPage(1); load(); }}
          style={{ background: '#e5e7eb', color: '#111', padding: '6px 10px', borderRadius: 6 }}
        >重置</button>
        <div style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 'auto' }}>{loading ? '加载中…' : `共 ${total} 人`}</div>
      </div>

      {/* 列表 */}
      <div style={{
        margin: 16,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>用户名</th>
              <th style={th}>手机号</th>
              <th style={th}>实名</th>
              <th style={th}>状态</th>
              <th style={th}>创建时间</th>
              <th style={th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {!data.length && (
              <tr>
                <td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#999' }}>暂无数据</td>
              </tr>
            )}
            {data.map(row => (
              <tr key={row._id} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={td}>{row._id?.slice(-6)}</td>
                <td style={td}>{row.username || '-'}</td>
                <td style={td}>{row.phone || '-'}</td>
                <td style={td}>{row.idCard?.name || '-'}</td>
                <td style={td}>
                  <span style={{
                    display: 'inline-block', minWidth: 56, textAlign: 'center',
                    padding: '2px 8px', borderRadius: 9999,
                    background:
                      row.reviewStatus === 'approved' ? '#dcfce7' :
                      row.reviewStatus === 'rejected' ? '#fee2e2' : '#e5e7eb',
                    color:
                      row.reviewStatus === 'approved' ? '#166534' :
                      row.reviewStatus === 'rejected' ? '#991b1b' : '#374151'
                  }}>{row.reviewStatus}</span>
                </td>
                <td style={td}>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</td>
                <td style={td}>
                  <button
                    onClick={() => openDrawer(row._id)}
                    style={{ background: '#0f172a', color: '#fff', padding: '6px 10px', borderRadius: 6 }}
                  >
                    查看/审核
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', padding: '0 16px 16px' }}>
        <button
          disabled={page <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          style={{ background: page <= 1 ? '#e5e7eb' : '#111827', color: page <= 1 ? '#9ca3af' : '#fff', padding: '6px 10px', borderRadius: 6 }}
        >上一页</button>
        <span style={{ color: '#fff' }}>{page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          style={{ background: page >= totalPages ? '#e5e7eb' : '#111827', color: page >= totalPages ? '#9ca3af' : '#fff', padding: '6px 10px', borderRadius: 6 }}
        >下一页</button>
      </div>

      <ReviewDrawer id={drawerId} visible={drawerVisible} onClose={closeDrawer} onChanged={onChanged} />
    </div>
  );
}
