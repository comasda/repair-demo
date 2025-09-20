Page({
  data: {
    orders: []
  },

  onShow() {
    const orders = wx.getStorageSync('orders') || []
    // 过滤出当前用户的工单
    const user = wx.getStorageSync('currentUser')
    this.setData({
      orders: orders.filter(o => o.phone === user.phone)
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` })
  }
})
