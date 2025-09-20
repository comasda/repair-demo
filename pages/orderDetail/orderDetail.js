Page({
  data: {
    order: {},
    role: '' // 当前用户角色
  },

  onLoad(options) {
    const id = Number(options.id)
    const orders = wx.getStorageSync('orders') || []
    const order = orders.find(o => o.id === id) || {}

    const user = wx.getStorageSync('currentUser')
    const role = user ? user.role : ''

    this.setData({ order, role })
  },

  // 客户端：去评价
  goReview() {
    wx.navigateTo({ url: `/pages/customer/review/review?id=${this.data.order.id}` })
  },

  // 师傅端：完成工单
  markCompleted() {
    const orders = wx.getStorageSync('orders') || []
    const idx = orders.findIndex(o => o.id === this.data.order.id)
    if (idx !== -1) {
      orders[idx].status = '已完成'
      wx.setStorageSync('orders', orders)
      wx.showToast({ title: '工单已完成' })
      this.setData({ order: orders[idx] })
    }
  }
})
