import React, { useState, useEffect } from 'react';
import { useOrders } from './hooks/useOrders';
import OrdersTable from './components/OrdersTable';
import StatusModal from './components/StatusModal';
import AssignModal from './components/AssignModal';
import CompleteReviewModal from './components/CompleteReviewModal';
import type { Order, CheckinMedia } from './types';
import { exportOrders } from './services/orderApi';
import CheckinMediaModal from './components/CheckinMediaModal';

export default function OrdersPage() {
  const { orders, loading, status, setStatus, load, handleAssign, assigningId } = useOrders();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [completeReviewVisible, setCompleteReviewVisible] = useState(false);
  const [checkinMediaVisible, setCheckinMediaVisible] = useState(false);
  const [checkinMedia, setCheckinMedia] = useState<CheckinMedia | null>(null);

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

  function openStatusModal(order: Order) {
    setCurrentOrder(order);
    setStatusModalVisible(true);
  }

  async function confirmStatusChange() {
    await load(); // 刷新订单列表
    setStatusModalVisible(false);
  }

  function openCompleteReview(order: Order) {
    setCurrentOrder(order);
    setCompleteReviewVisible(true);
  }

  function openCheckinMedia(order: Order) {
    setCheckinMedia(order.checkinMedia || null);
    setCheckinMediaVisible(true);
  }

  async function handleCompleteReviewOk() {
    setCompleteReviewVisible(false);
    await load(); // 审核操作在弹窗里完成，这里只负责刷新
  }

  async function confirmAssign(technicianId: string, technicianName: string) {
    if (!currentOrder) return;
    await handleAssign(currentOrder._id, technicianId, technicianName);
    setModalVisible(false);
  }

  // 导出逻辑函数
  async function onExport() {
    try {
      setExporting(true);
      await exportOrders({ status }); // 可传入状态或日期筛选
    } finally {
      setExporting(false);
    }
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

        {/* ✅ 新增：导出按钮 */}
        <button
          onClick={onExport}
          disabled={exporting}
          style={{
            padding: '6px 12px',
            background: '#16a34a',
            color: '#fff',
            border: 0,
            borderRadius: 6,
          }}
        >
          {exporting ? '导出中…' : '导出 Excel'}
        </button>
      </div>

      {/* 表格 */}
      <OrdersTable
      data={orders || []}
      assigningId={assigningId}
      onAssignClick={openAssign}
      onStatusClick={openStatusModal}
      onCompleteReview={openCompleteReview}
      onViewCheckinMedia={openCheckinMedia}
      />

      {/* 指派弹窗 */}
      <AssignModal
        visible={modalVisible}
        onOk={confirmAssign}
        onCancel={() => setModalVisible(false)}
      />

      {/* 修改状态弹窗 */}
      <StatusModal
        visible={statusModalVisible}
        order={currentOrder}
        onOk={confirmStatusChange}
        onCancel={() => setStatusModalVisible(false)}
      />

      {/* 完成审核弹窗 */}
      <CompleteReviewModal
        visible={completeReviewVisible}
        order={currentOrder}
        onOk={handleCompleteReviewOk}
        onCancel={() => setCompleteReviewVisible(false)}
      />

      {/* 查看签到佐证 Modal */}
      <CheckinMediaModal
        visible={checkinMediaVisible}
        media={checkinMedia}
        onClose={() => setCheckinMediaVisible(false)}
      />
    </div>
  );
}
