const { post } = require('../../../utils/request')

Page({
  data: {
    orderId: '',
    rating: 5,
    content: '',
    images: [],
    mode: 'first',     // 新增：first | append
    btnText: '提交评价',
    navTitle: '提交评价'
  },

  onLoad(options) {
    const mode = options.mode || 'first'
    const navTitle = mode === 'append' ? '追加评价' : '提交评价'
    const btnText = mode === 'append' ? '提交追加评价' : '提交评价'
    this.setData({ orderId: options.id || '', mode, navTitle, btnText })
    wx.setNavigationBarTitle({ title: navTitle })
  },

  onRate(e) { this.setData({ rating: Number(e.currentTarget.dataset.value) }) },
  onInput(e) { this.setData({ content: e.detail.value }) },

  chooseImage() {
    wx.chooseImage({
      count: 3, sizeType: ['compressed'],
      success: res => this.setData({ images: this.data.images.concat(res.tempFilePaths) })
    })
  },

  async submit() {
    const user = wx.getStorageSync('currentUser')
    if (!user) { wx.showToast({ title: '请先登录', icon: 'none' }); return }

    const { orderId, rating, content, images } = this.data
    if (!orderId) return wx.showToast({ title: '参数缺失', icon: 'none' })
    if (!rating || rating < 1 || rating > 5) {
      return wx.showToast({ title: '请先评分(1-5)', icon: 'none' })
    }

    // 这里仍然直接提交；若要上线存图，请先把 tmp 转成 URL 再提交
    await post(`/customer/${orderId}/reviews`, {
      customerId: user.id || user._id,
      customerName: user.username || user.nickname || '',
      rating,
      content: content || '',
      images
    })

    wx.showToast({ title: this.data.mode === 'append' ? '追加成功' : '评价成功' })
    this.refreshPrevPage()
    setTimeout(() => wx.navigateBack(), 800)
  },

  /** 🔁 通用刷新函数 **/
  refreshPrevPage() {
    try {
      // ① eventChannel（优先）
      const ec = this.getOpenerEventChannel?.()
      if (ec && ec.emit) {
        ec.emit('review:refresh', { need: true })
        return
      }
      // ② 直接调用上一页的刷新函数
      const pages = getCurrentPages()
      const prev = pages[pages.length - 2]
      if (prev) {
        if (typeof prev.loadOrder === 'function') prev.loadOrder(prev.data.order?._id)
        else if (typeof prev.fetchOrders === 'function') prev.fetchOrders()
      }
    } catch (e) {
      console.error('refreshPrevPage fail', e)
    }
  }
})
