// pages/technician/review/review.js
const { get } = require('../../../utils/request')

Page({
  data: {
    orderId: '',
    reviews: [],
    hasReview: false
  },

  onLoad(options) {
    const user = wx.getStorageSync('currentUser')
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.reLaunch({ url: '/pages/auth/login/login' })
      return
    }
    const orderId = options.id
    this.setData({ orderId })
    this.loadReviews(orderId, user.id || user._id)
  },

  loadReviews(orderId, technicianId) {
    get(`/technicians/${orderId}/review`)
      .then(res => {
        const list = Array.isArray(res.reviews) ? res.reviews : []
        this.setData({ reviews: list, hasReview: list.length > 0 })
      })
      .catch(err => {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.src
    const urls = (this.data.reviews || [])
      .flatMap(r => r.images || [])
    wx.previewImage({ current, urls })
  }
})
