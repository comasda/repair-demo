Page({
  data: {
    stats: {
      pending: 3,
      completed: 12,
      income: 560
    }
  },

  onShow() {
    const app = getApp()
    if (!app.checkLogin()) return
    const user = wx.getStorageSync('currentUser')

    // TODO: 请求后台，获取真实的工单/收益数据
  },

  goTasks() {wx.navigateTo({ url: '/pages/technician/pendingOrders/pendingOrders' }) },
  gomyOrders() {  wx.navigateTo({ url: '/pages/technician/myOrders/myOrders' }) },
  goIncome() { wx.showToast({ title: '跳转收益记录', icon: 'none' }) },
  goProfile() { wx.showToast({ title: '跳转我的资料', icon: 'none' }) },

  goEvaluate() { wx.navigateTo({ url: '/pages/technician/reviewList/reviewList' }) },

  goComplaint() { wx.showToast({ title: '跳转投诉处理', icon: 'none' }) },
  goBills() { wx.showToast({ title: '跳转账务明细', icon: 'none' }) },
  goAbout() { wx.showToast({ title: '跳转关于我们', icon: 'none' }) }
})
