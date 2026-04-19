Page({
  data: {
    isGuest: false,
    stats: {
      pending: 0,
      balance: 0,
      frozen: 0
    }
  },

  onShow() {
    const app = getApp()
    const user = wx.getStorageSync('currentUser')
    const isGuest = app.isGuestUser(user)

    this.setData({
      isGuest,
      stats: {
        pending: isGuest ? 1 : 2,
        balance: isGuest ? 0 : 100,
        frozen: isGuest ? 0 : 20
      }
    })
  },

  ensureRegistered(actionText) {
    return getApp().requireRealUser(actionText)
  },

  goNewOrder() {
    wx.navigateTo({ url: '/pages/customer/newOrder/newOrder' })
  },
  goRecharge() {
    if (!this.ensureRegistered('账户充值')) return
    wx.showToast({ title: '跳转账户充值', icon: 'none' })
  },
  goRecords() {
    if (!this.ensureRegistered('查看我的工单')) return
    wx.showToast({ title: '跳转维修记录', icon: 'none' })
    wx.navigateTo({ url: '/pages/customer/myOrders/myOrders' })
  },
  goEvaluate() {
     if (!this.ensureRegistered('评价工单')) return
     wx.navigateTo({ url: '/pages/customer/evaluate/evaluate' })
  },
  goProfile() {
    if (!this.ensureRegistered('查看我的账户')) return
    wx.showToast({ title: '跳转我的账户', icon: 'none' })
  },
  goComplaint() {
    wx.showToast({ title: '跳转投诉建议', icon: 'none' })
  },
  goBills() {
    if (!this.ensureRegistered('查看账务明细')) return
    wx.showToast({ title: '跳转账务明细', icon: 'none' })
  },
  goAbout() {
    wx.showToast({ title: '跳转关于我们', icon: 'none' })
  }
})
