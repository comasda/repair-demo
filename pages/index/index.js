Page({
  data: {
    roles: ['管理员', '维修师傅', '客户'],
    currentRole: 'admin',
    currentRoleName: '管理员'
  },
  onLoad() {
    const role = wx.getStorageSync('role') || 'admin'
    const map = { admin:'管理员', technician:'维修师傅', customer:'客户' }
    this.setData({ currentRole: role, currentRoleName: map[role] })
  },
  onRoleChange(e) {
    const roleMap = ['admin', 'technician', 'customer']
    const index = e.detail.value
    const role = roleMap[index]
    this.setData({
      currentRole: role,
      currentRoleName: this.data.roles[index]
    })
    wx.setStorageSync('role', role)
    wx.showToast({ title: '身份已切换', icon: 'success' })
  },
  goOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' })
  },
  goDashboard() {
    wx.navigateTo({ url: '/pages/dashboard/dashboard' })
  },
  goNewOrder() {
    wx.navigateTo({ url: '/pages/newOrder/newOrder' })
  }
})
