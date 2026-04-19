Page({
  data: {
    isGuest: false,
    stats: {
      pending: 3,
      completed: 12,
      income: 560
    }
  },

  onShow() {
    const app = getApp()
    const user = wx.getStorageSync('currentUser')
    const isGuest = app.isGuestUser(user)

    this.setData({
      isGuest,
      stats: isGuest
        ? { pending: 2, completed: 3, income: 0 }
        : { pending: 3, completed: 12, income: 560 }
    })
  },

  ensureRegistered(actionText) {
    return getApp().requireRealUser(actionText)
  },

  goTasks() {
    if (!this.ensureRegistered('接单')) return
    wx.navigateTo({ url: '/pages/technician/pendingOrders/pendingOrders' })
  },
  gomyOrders() {
    if (!this.ensureRegistered('查看我的工单')) return
    wx.navigateTo({ url: '/pages/technician/myOrders/myOrders' })
  },
  goIncome() {
    if (!this.ensureRegistered('查看收益记录')) return
    wx.showToast({ title: '跳转收益记录', icon: 'none' })
  },
  goProfile() {
    if (!this.ensureRegistered('查看我的资料')) return
    wx.showToast({ title: '跳转我的资料', icon: 'none' })
  },

  goEvaluate() {
    if (!this.ensureRegistered('查看工单评价')) return
    wx.navigateTo({ url: '/pages/technician/reviewList/reviewList' })
  },

  goComplaint() { wx.showToast({ title: '跳转投诉处理', icon: 'none' }) },
  goBills() {
    if (!this.ensureRegistered('查看账务明细')) return
    wx.showToast({ title: '跳转账务明细', icon: 'none' })
  },
  goAbout() { wx.showToast({ title: '跳转关于我们', icon: 'none' }) }
})
