const { post } = require('../../../utils/request')

Page({
  data: {
    orderId: '',
    rating: 5,
    content: '',
    images: []
  },

  onLoad(options) {
    this.setData({ orderId: options.id || '' })
  },

  onRate(e) {
    this.setData({ rating: Number(e.currentTarget.dataset.value) })
  },

  onInput(e) {
    this.setData({ content: e.detail.value })
  },

  chooseImage() {
    wx.chooseImage({
      count: 3, sizeType: ['compressed'],
      success: res => this.setData({ images: this.data.images.concat(res.tempFilePaths) })
    })
  },

  submit() {
    const user = wx.getStorageSync('currentUser')
    if (!user) { wx.showToast({ title: '请先登录', icon: 'none' }); return }

    const { orderId, rating, content, images } = this.data
    if (!orderId) return wx.showToast({ title: '参数缺失', icon: 'none' })
    if (!rating || rating < 1 || rating > 5) {
      return wx.showToast({ title: '请先评分(1-5)', icon: 'none' })
    }

    post(`/orders/${orderId}/reviews`, {
      customerId: user.id || user._id,
      customerName: user.username || user.nickname || '',
      rating,
      content: content || '',
      images // 如需真正上传到服务器/云存储，这里可改为上传后得到 URL 再提交
    }).then(() => {
      wx.showToast({ title: '评价成功' })
      setTimeout(() => wx.navigateBack(), 800)
    }).catch(err => {
      wx.showToast({ title: err.message || '提交失败', icon: 'none' })
    })
  }
})
