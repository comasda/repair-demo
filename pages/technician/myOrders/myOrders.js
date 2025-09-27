const { get } = require('../../../utils/request')

Page({
  data: {
    orders: []
  },

  onShow() {
    const user = wx.getStorageSync('currentUser')
    if (!user || user.role !== 'technician') {
      wx.showToast({ title: '请用师傅账号登录', icon: 'none' })
      wx.reLaunch({ url: '/pages/auth/login/login' })
      return
    }

    // 调用后端接口获取该师傅的工单
    get(`/orders?technicianId=${user.id}`).then(res => {
      this.setData({ orders: res })
    }).catch(err => {
      wx.showToast({ title: '获取工单失败', icon: 'none' })
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` })
  }
})
