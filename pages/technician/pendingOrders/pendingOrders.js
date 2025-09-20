Page({
  data: {
    orders: []
  },

  onShow() {
    const app = getApp()
    if (!app.checkLogin()) return

    // 当前师傅用户
    const user = wx.getStorageSync('currentUser')
    if (user.role !== 'technician') {
      wx.showToast({ title: '无权限', icon: 'none' })
      return
    }

    // 所有订单
    let allOrders = wx.getStorageSync('orders') || []
    // 筛选 status = 待接单 的
    this.setData({
      orders: allOrders.filter(o => o.status === '待接单')
    })
  },

  acceptOrder(e) {
    const id = e.currentTarget.dataset.id
    let orders = wx.getStorageSync('orders') || []
    const idx = orders.findIndex(o => o.id === id)
    if (idx === -1) {
      wx.showToast({ title: '订单不存在', icon: 'none' })
      return
    }

    // 更新状态和师傅信息
    const user = wx.getStorageSync('currentUser')
    orders[idx].status = '已接单'
    orders[idx].technician = {
      id: user.id,
      phone: user.phone,
      name: user.nickname || ''
    }
    wx.setStorageSync('orders', orders)

    wx.showToast({ title: '接单成功' })
    // 刷新页面
    this.onShow()
  }
})
