Page({
  data: {
    stats: {
      pending: 0,
      balance: 0,
      frozen: 0
    }
  },

  onShow() {
    const app = getApp()
    if (!app.checkLogin()) return
    const user = wx.getStorageSync('currentUser')

    // TODO: 这里可以请求服务器获取真实统计数据
    this.setData({
      stats: {
        pending: 2,
        balance: 100,
        frozen: 20
      }
    })
  },

  // 功能入口跳转（先用提示代替）
  goNewOrder() {
    wx.showToast({ title: '跳转新建工单', icon: 'none' })
    wx.navigateTo({ url: '/pages/customer/newOrder/newOrder' })
  },
  goRecharge() {
    wx.showToast({ title: '跳转账户充值', icon: 'none' })
  },
  goRecords() {
    wx.showToast({ title: '跳转维修记录', icon: 'none' })
    wx.navigateTo({ url: '/pages/customer/orders/orders' })
  },
  goEvaluate() {
    wx.showToast({ title: '跳转工单评价', icon: 'none' })
  },
  goProfile() {
    wx.showToast({ title: '跳转我的账户', icon: 'none' })
  },
  goComplaint() {
    wx.showToast({ title: '跳转投诉建议', icon: 'none' })
  },
  goBills() {
    wx.showToast({ title: '跳转账务明细', icon: 'none' })
  },
  goAbout() {
    wx.showToast({ title: '跳转关于我们', icon: 'none' })
  }
})
