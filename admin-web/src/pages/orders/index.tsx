import React, { useState, useEffect } from 'react';
import { useOrders } from './hooks/useOrders';
import OrdersTable from './components/OrdersTable';
import AssignModal from './components/AssignModal';
import type { Order } from './types';

export default function OrdersPage() {
  const { orders, loading, status, setStatus, load, handleAssign, assigningId } = useOrders();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // ✅ 登录检查：若无 token，提示并跳回登录页
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录管理员账号');
      window.location.href = '/'; // 或你的登录页路由
    }
  }, []);
  function openAssign(order: Order) {
    setCurrentOrder(order);
    setModalVisible(true);
  }

  async function confirmAssign(technicianId: string, technicianName: string) {
    if (!currentOrder) return;
    await handleAssign(currentOrder._id, technicianId, technicianName);
    setModalVisible(false);
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>订单管理</h2>

      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <label>
          状态：
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ marginLeft: 8, padding: '6px 8px' }}
          >
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="offered">待接收</option>
            <option value="assigned">已指派</option>
            <option value="checkedIn">已到场</option>
            <option value="awaitingConfirm">待确认</option>
            <option value="done">已完成</option>
          </select>
        </label>
        <button onClick={load} disabled={loading} style={{ padding: '6px 12px' }}>
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* 表格 */}
      <OrdersTable data={orders || []} assigningId={assigningId} onAssignClick={openAssign} />

      {/* 指派弹窗 */}
      <AssignModal
        visible={modalVisible}
        onOk={confirmAssign}
        onCancel={() => setModalVisible(false)}
      />
    </div>
  );
}
