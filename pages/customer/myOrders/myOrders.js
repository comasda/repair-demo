const { get } = require('../../../utils/request')

Page({
  data: {
    orders: []
  },

  onShow() {
    const user = wx.getStorageSync('currentUser')
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    // 调用后端接口获取当前用户的工单
    get(`/orders?customerId=${user.id}`).then(res => {
      this.setData({ orders: res })
    }).catch(err => {
      wx.showToast({ title: '获取工单失败', icon: 'none' })
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${id}`
    })
  }
})
