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
    setOrders(prev => {
      if (!Array.isArray(prev)) return prev ?? [];
      return prev.map(o => {
        // 如果后端返回的对象结构不完整（没有 _id），做“就地补丁”，避免渲染崩溃
        if (o._id !== orderId) return o;
        if (!updated || typeof updated !== 'object') {
          return { ...o, technicianId, technicianName };
        }
        if (!('_id' in updated) || !updated._id) {
          return { ...o, ...updated, technicianId, technicianName };
        }
        // 正常情况：用后端返回整条记录覆盖
        return { ...o, ...updated };
      });
    });
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
