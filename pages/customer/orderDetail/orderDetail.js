Page({
  data: {
    order: {}
  },

  onLoad(options) {
    const id = Number(options.id)
    const orders = wx.getStorageSync('orders') || []
    const order = orders.find(o => o.id === id) || {}
    this.setData({ order })
  }
})
