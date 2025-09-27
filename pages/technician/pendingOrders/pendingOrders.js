const { get, put } = require('../../../utils/request')

Page({
  data: {
    orders: []
  },

  onShow() {
    const user = wx.getStorageSync('currentUser')
    if (!user || user.role !== 'technician') {
      wx.showToast({ title: '请用师傅账号登录', icon: 'none' })
      return
    }

    // 获取待接单工单
    get('/orders').then(res => {
      console.log('后端返回的订单:', res)
      const statusMap = { pending: '待接单', assigned: '已接单', done: '已完成' }
      const pending = res.filter(o => o.status === 'pending')
      pending.forEach(o => { o.statusText = statusMap[o.status] || o.status })
      this.setData({ orders: pending })
    })
  },

  // 师傅接单
  acceptOrder(e) {
    const id = e.currentTarget.dataset.id
    const user = wx.getStorageSync('currentUser')

    put(`/orders/${id}/assign`, {
      technicianId: user.id || user._id,   // 确保取到师傅的ID
      technicianName: user.username || user.nickname || '师傅'
    }).then(() => {
      wx.showToast({ title: '接单成功' })
      this.onShow() // 刷新列表
    }).catch(err => {
      wx.showToast({ title: err.message || '接单失败', icon: 'none' })
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` })
  }
})
