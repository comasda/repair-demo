Page({
  data: {
    orders: []
  },

  onShow() {
    const user = wx.getStorageSync('currentUser')
    if (!user || user.role !== 'technician') {
      wx.showToast({ title: '请用师傅账号登录', icon: 'none' })
      wx.reLaunch({ url: '/pages/auth/login/login' })
      return
    }

    let orders = wx.getStorageSync('orders') || []
    // 过滤出当前师傅的工单
    this.setData({
      orders: orders.filter(o => o.technician && o.technician.id === user.id)
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` })
  }
})
