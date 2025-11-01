import React, { useEffect, useState } from 'react';
import { getTechnician, approveTechnician, rejectTechnician, TechnicianItem } from '../../../services/technicianApi';

interface Props {
  id: string | null;
  visible: boolean;
  onClose: () => void;
  onChanged: () => void; // 审核后刷新父列表
}

const pill = (status?: string): React.CSSProperties => ({
  display: 'inline-block',
  minWidth: 56,
  textAlign: 'center',
  padding: '2px 8px',
  borderRadius: 9999,
  background:
    status === 'approved' ? '#dcfce7' :
    status === 'rejected' ? '#fee2e2' : '#e5e7eb',
  color:
    status === 'approved' ? '#166534' :
    status === 'rejected' ? '#991b1b' : '#374151',
  fontSize: 12
});

export default function ReviewDrawer({ id, visible, onClose, onChanged }: Props) {
  const [detail, setDetail] = useState<TechnicianItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!visible || !id) return;
    setLoading(true);
    getTechnician(id)
      .then((d) => {
        setDetail(d);
        setReason(''); // 打开时清空
      })
      .finally(() => setLoading(false));
  }, [visible, id]);

  if (!visible) return null;

  const doApprove = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await approveTechnician(id);
      onChanged();
      onClose();
    } catch (e: any) {
      alert(e?.message || '审核失败');
    } finally {
      setLoading(false);
    }
  };

  const doReject = async () => {
    if (!id) return;
    if (!reason.trim()) return alert('请输入驳回原因');
    setRejecting(true);
    try {
      await rejectTechnician(id, reason.trim());
      onChanged();
      onClose();
    } catch (e: any) {
      alert(e?.message || '操作失败');
    } finally {
      setRejecting(false);
    }
  };

  // 尝试从 detail 中取到可能存在的图片数组（没有就不显示）
  const photos: string[] = (detail as any)?.profile?.photos
    || (detail as any)?.idCard?.photos
    || [];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex',
      justifyContent: 'flex-end', zIndex: 1000
    }}>
      <div style={{
        width: 460, height: '100%', background: '#fff', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 24px rgba(0,0,0,0.18)', borderLeft: '1px solid #e5e7eb'
      }}>
        {/* 顶部深色标题条（与订单页风格统一） */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0f172a', color: '#fff'
        }}>
          <div style={{ fontWeight: 600 }}>技师详情</div>
          <button
            onClick={onClose}
            style={{ background: '#111827', color: '#fff', padding: '6px 10px', borderRadius: 6 }}
          >
            关闭
          </button>
        </div>

        {/* 内容区 */}
        <div style={{ padding: 16, overflowY: 'auto', flex: 1, background: '#f3f4f6' }}>
          {loading && <div style={{ padding: 12 }}>加载中...</div>}
          {!loading && detail && (
            <>
              {/* 基本信息（白色卡片） */}
              <div style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 16,
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
              }}>
                <div style={{ fontWeight: 600, color: '#111827', marginBottom: 8 }}>基本信息</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  rowGap: 10, columnGap: 10, fontSize: 14, color: '#111827'
                }}>
                  <div style={{ color: '#6b7280' }}>用户名</div><div style={{ fontWeight: 500 }}>{detail.username || '-'}</div>
                  <div style={{ color: '#6b7280' }}>手机号</div><div style={{ fontWeight: 500 }}>{detail.phone || '-'}</div>
                  <div style={{ color: '#6b7280' }}>实名</div><div style={{ fontWeight: 500 }}>{detail.idCard?.name || '-'}</div>
                  <div style={{ color: '#6b7280' }}>证件号</div><div style={{ fontWeight: 500 }}>{detail.idCard?.number || '-'}</div>
                  <div style={{ color: '#6b7280' }}>状态</div>
                  <div><span style={pill(detail.reviewStatus)}>{detail.reviewStatus}</span></div>
                  {detail.createdAt && (
                    <>
                      <div style={{ color: '#6b7280' }}>创建时间</div>
                      <div style={{ fontWeight: 500 }}>{new Date(detail.createdAt).toLocaleString()}</div>
                    </>
                  )}
                  {detail.reviewAudit?.result && (
                    <>
                      <div style={{ color: '#6b7280' }}>最近审核</div>
                      <div style={{ fontWeight: 500 }}>
                        {detail.reviewAudit.result}
                        {detail.reviewAudit.reason ? `（${detail.reviewAudit.reason}）` : ''}
                        {detail.reviewAudit.auditedAt ? ` · ${new Date(detail.reviewAudit.auditedAt).toLocaleString()}` : ''}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 证件/资质图片（有才显示） */}
              {!!photos.length && (
                <div style={{
                  marginTop: 16,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: '#111827' }}>证件/资质</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {photos.map((url, i) => (
                      <div key={i} style={{
                        position: 'relative', width: '100%', paddingTop: '100%',
                        background: '#f3f4f6', borderRadius: 10, overflow: 'hidden',
                        border: '1px solid #e5e7eb'
                      }}>
                        <img
                          src={url}
                          alt=""
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          onClick={() => window.open(url, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* 审核操作（仅 pending 可操作） */}
              {detail.reviewStatus === 'pending' && (
                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={doApprove}
                    disabled={loading}
                    style={{
                      width: '100%', padding: '10px 12px',
                      background: '#111827', color: '#fff', borderRadius: 8,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}
                  >
                    通过
                  </button>

                  <div style={{ marginTop: 12 }}>
                    <textarea
                      rows={4}
                      placeholder="驳回原因（必填）"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      style={{
                        width: '100%', padding: 10, boxSizing: 'border-box',
                        borderRadius: 8, border: '1px solid #d1d5db', outline: 'none',
                        background: '#fff'
                      }}
                    />
                    <button
                      onClick={doReject}
                      disabled={rejecting}
                      style={{
                        marginTop: 8, width: '100%', padding: '10px 12px',
                        background: '#ef4444', color: '#fff', borderRadius: 8,
                        boxShadow: '0 2px 6px rgba(239,68,68,0.25)'
                      }}
                    >
                      驳回
                    </button>
                    <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>
                      提示：驳回后可在“已驳回”筛选中查看，原因会显示给申请人。
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
