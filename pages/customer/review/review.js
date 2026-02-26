const { post, uploadimage } = require('../../../utils/request')

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
      success: res => {
        // 选择图片后立即上传到云存储
        this.uploadImagesToCloud(res.tempFilePaths);
      }
    })
  },

  // 新增：上传图片到云存储
  async uploadImagesToCloud(tempFilePaths) {
    wx.showLoading({ title: '上传中...', mask: true });

    try {
      const uploadPromises = tempFilePaths.map(filePath =>
        uploadimage(filePath, null, true) // 使用云存储上传
      );

      const results = await Promise.all(uploadPromises);
      const cloudFileIDs = results.map(r => r.fileID);

      // 更新页面数据，存储云存储的fileID
      this.setData({
        images: [...this.data.images, ...cloudFileIDs]
      });

      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (error) {
      console.error('上传失败:', error);
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 预览图片 - 直接使用COS URL
  previewImage(e) {
    const current = e.currentTarget.dataset.src;
    const urls = this.data.images;

    wx.previewImage({
      current: current,
      urls: urls
    });
  },

  // 删除某张
  removeImage(e) {
    const idx = Number(e.currentTarget.dataset.index)
    const arr = this.data.images.slice()
    arr.splice(idx, 1)
    this.setData({ images: arr })
  },

  async submit() {
    const user = wx.getStorageSync('currentUser')
    if (!user) { wx.showToast({ title: '请先登录', icon: 'none' }); return }

    const { orderId, rating, content, images } = this.data
    if (!orderId) return wx.showToast({ title: '参数缺失', icon: 'none' })
    if (!rating || rating < 1 || rating > 5) {
      return wx.showToast({ title: '请先评分(1-5)', icon: 'none' })
    }

    // 图片已在选择时上传到云存储，直接使用fileID提交评价
    try {
      await post(`/customer/${orderId}/reviews`, {
        customerId: user.id || user._id,
        customerName: user.username || user.nickname || '',
        rating,
        content: content || '',
        images: images  // 直接使用云存储的fileID列表
      })

      wx.showToast({ title: this.data.mode === 'append' ? '追加成功' : '评价成功' })
      this.refreshPrevPage()
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      wx.showToast({ icon: 'none', title: err.message || '提交失败' })
    }
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
