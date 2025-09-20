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
  goTaskList() {
    wx.showToast({ title: '跳转到工单列表（待开发）', icon: 'none' })
  },
  goProfile() {
    wx.showToast({ title: '跳转到个人资料页面（待开发）', icon: 'none' })
  },
  logout() {
    wx.removeStorageSync('currentUser')
    wx.reLaunch({ url: '/pages/auth/login/login' })
  }
})
