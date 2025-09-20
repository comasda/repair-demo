Page({
  data: {
    title: '',
    desc: '',
    images: [],
    phone: '',
    address: ''
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onDescInput(e) { this.setData({ desc: e.detail.value }) },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onAddressInput(e) { this.setData({ address: e.detail.value }) },

  chooseImage() {
    wx.chooseImage({
      count: 3,
      sizeType: ['compressed'],
      success: res => {
        this.setData({ images: this.data.images.concat(res.tempFilePaths) })
      }
    })
  },

  submitOrder() {
    const { title, desc, phone, address, images } = this.data
    if (!title || !desc || !phone || !address) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    // 模拟本地存储订单
    let orders = wx.getStorageSync('orders') || []
    const newOrder = {
      id: Date.now(),
      title,
      desc,
      phone,
      address,
      images,
      status: '待接单',
      createdAt: new Date().toLocaleString()
    }
    orders.push(newOrder)
    wx.setStorageSync('orders', orders)

    wx.showToast({ title: '工单提交成功' })
    wx.reLaunch({ url: '/pages/customer/home/home' })
  }
})
