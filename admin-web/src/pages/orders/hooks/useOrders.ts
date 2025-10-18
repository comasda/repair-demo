import { useCallback, useEffect, useMemo, useState } from 'react';
import { assignOrder, fetchOrders } from '../services/orderApi';
import type { Order } from '../types';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>('pending'); // 默认只看待处理
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const queryKey = useMemo(() => status || '', [status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrders(queryKey);
      setOrders(data ?? []);
    } catch (e) {
      console.error(e);
      alert(`加载订单失败：${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAssign(orderId: string, technicianId: string, technicianName: string) {
    setAssigningId(orderId);
    try {
      const updated = await assignOrder(orderId, technicianId, technicianName);

      // ✅ 1) 本地即时更新：如果当前筛选是 pending，而返回状态不是 pending，就把该条从列表移除
      setOrders(prev => {
        if (!Array.isArray(prev)) return prev ?? [];
        const next = (() => {
          if (updated && typeof updated === 'object') {
            const newStatus = (updated as any).status;
            if (status === 'pending' && newStatus && newStatus !== 'pending') {
              return prev.filter(o => o._id !== orderId);
            }
            // 常规：就地替换为后端返回
            return prev.map(o => (o._id === orderId ? { ...o, ...updated } : o));
          }
          // 兜底：后端没回完整对象，也别让 UI 崩 —— 最少把技师信息打补丁
          return prev.map(o =>
            o._id === orderId ? { ...o, technicianId, technicianName } : o
          );
        })();
        return next;
      });

      // ✅ 2) 静默刷新：再拉一次，保证与后端完全一致（避免并发/其它字段没更新到）
      // 不阻塞 UI；如果你想等它完成再提示，把 await 去掉即可
      void load();

      // ✅ 3) 轻提示
      alert('指派成功');
    } catch (e) {
      console.error(e);
      alert(`指派失败：${(e as Error).message}`);
    } finally {
      setAssigningId(null);
    }
  }

  return {
    orders,
    loading,
    status,
    setStatus,
    load,
    handleAssign,
    assigningId,
  };
}
