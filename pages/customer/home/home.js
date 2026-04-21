Page({
  data: {
    isGuest: false,
    currentUser: null,
    stats: {
      pending: 0,
      balance: 0,
      frozen: 0
    }
  },

  onShow() {
    const app = getApp()
    const user = wx.getStorageSync('currentUser')

    if (user && !user.isGuest && user.role === 'technician') {
      wx.reLaunch({ url: '/pages/technician/home/home' })
      return
    }

    const isGuest = !user || app.isGuestUser(user)

    this.setData({
      currentUser: user || null,
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

  goAuthEntry() {
    wx.navigateTo({ url: '/pages/auth/login/login' })
  },

  goTechnicianExperience() {
    const technicianGuest = {
      id: 'guest-technician',
      username: '访客师傅',
      role: 'technician',
      isGuest: true,
      registerSource: 'guest'
    }

    wx.removeStorageSync('token')
    wx.setStorageSync('currentUser', technicianGuest)
    wx.reLaunch({ url: '/pages/technician/home/home' })
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
