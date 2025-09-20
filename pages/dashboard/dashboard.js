Page({
  data: {
    total: 0,
    inProgress: 0,
    completed: 0
  },
  onShow() {
    const orders = wx.getStorageSync('orders') || []
    const inProgress = orders.filter(o => ['assigned','accepted','on-site'].includes(o.status)).length
    const completed = orders.filter(o => o.status === 'completed').length
    this.setData({
      total: orders.length,
      inProgress,
      completed
    })
  }
})
