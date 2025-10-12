// pages/technician/reviewList/reviewList.js
const { get } = require('../../../utils/request')

Page({
  data: {
    loading: true,
    list: []
  },

  onLoad() { this.loadData() },
  onShow() { /* 如需实时刷新可再次调用 */ },

  async loadData() {
    const user = wx.getStorageSync('currentUser')
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.reLaunch({ url: '/pages/auth/login/login' })
      return
    }
    this.setData({ loading: true })
    try {
      const ret = await get('/orders', {
        technicianId: user.id || user._id,
        status: 'done' // 只拿已完成订单
      })
      // 后端 list 会返回完整订单对象数组（含 reviews）:contentReference[oaicite:4]{index=4}
      const list = (ret || []).map(o => ({
        _id: o._id,
        device: o.device,
        issue: o.issue,
        address: o.address || o.locationAddress || '',
        time: o.time,
        status: o.status,
        statusText: o.statusText || '已完成',
        hasReview: Array.isArray(o.reviews) && o.reviews.length > 0,
        firstReview: (Array.isArray(o.reviews) && o.reviews.length > 0) ? o.reviews[0] : null
      }))
      this.setData({ list })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 进入该订单的评价详情
  goReviewDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/technician/review/review?id=${id}` })
  }
})
