const { get, put } = require('../../utils/request')

Page({
  data: {
    order: null,
    role: ''
  },

  onLoad(options) {
    const user = wx.getStorageSync('currentUser')
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.reLaunch({ url: '/pages/auth/login/login' })
      return
    }

    this.setData({ role: user.role })
    this.loadOrder(options.id)
  },

  // 获取单条工单详情
  loadOrder(id) {
    get(`/orders/${id}`).then(res => {
      this.setData({ order: res })
    }).catch(err => {
      wx.showToast({ title: '获取工单失败', icon: 'none' })
    })
  },

  // 客户端：去评价
  goReview() {
    const id = this.data.order._id
    wx.navigateTo({ url: `/pages/customer/review/review?id=${id}` })
  },

  // 师傅端：标记工单完成
  markCompleted() {
    const id = this.data.order._id
    put(`/orders/${id}/status`, {
      status: 'done',
      note: '工单已完成'
    }).then(() => {
      wx.showToast({ title: '工单已完成' })
      this.loadOrder(id) // 刷新详情
    }).catch(err => {
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  }
})
