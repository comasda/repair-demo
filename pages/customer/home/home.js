Page({
  data: {
    user: {}
  },
  onShow() {
    const app = getApp()
    if (!app.checkLogin()) return
    const user = wx.getStorageSync('currentUser')
    this.setData({ user })
  },
  goOrders() {
    wx.showToast({ title: '跳转到订单页面（待开发）', icon: 'none' })
  },
  goNewOrder() {
    wx.showToast({ title: '跳转到报修页面（待开发）', icon: 'none' })
  },
  logout() {
    wx.removeStorageSync('currentUser')
    wx.reLaunch({ url: '/pages/auth/login/login' })
  }
})
