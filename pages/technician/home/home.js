Page({
  data: {
    isGuest: false,
    currentUser: null,
    stats: {
      pending: 3,
      completed: 12,
      income: 560
    }
  },

  onShow() {
    const app = getApp()
    const user = wx.getStorageSync('currentUser')

    if (user && !user.isGuest && user.role === 'customer') {
      wx.reLaunch({ url: '/pages/customer/home/home' })
      return
    }

    const isGuest = !user || app.isGuestUser(user)

    this.setData({
      currentUser: user || null,
      isGuest,
      stats: isGuest
        ? { pending: 2, completed: 3, income: 0 }
        : { pending: 3, completed: 12, income: 560 }
    })
  },

  ensureRegistered(actionText) {
    return getApp().requireRealUser(actionText)
  },

  goAuthEntry() {
    wx.navigateTo({ url: '/pages/auth/login/login' })
  },

  goCustomerExperience() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('currentUser')
    wx.reLaunch({ url: '/pages/customer/home/home' })
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
