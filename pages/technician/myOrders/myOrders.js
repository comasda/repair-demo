const { get } = require('../../../utils/request')

const statusMap = {
  pending: '待接单',
  assigned: '已接单',
  done: '已完成'
}

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

    // 兼容 _id / id
    const technicianId = user.id || user._id

    // 调用后端接口获取该师傅的工单
    get(`/orders?technicianId=${technicianId}`).then(res => {
      const mapped = res.map(o => ({
        ...o,
        statusText: statusMap[o.status] || o.status
      }))
      console.log('我的工单数据:', mapped)
      this.setData({ orders: mapped })
    }).catch(err => {
      wx.showToast({ title: '获取工单失败', icon: 'none' })
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` })
  }
})
