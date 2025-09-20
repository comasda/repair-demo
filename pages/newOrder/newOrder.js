Page({
  data: {
    device: '',
    issue: '',
    image: '',
    location: ''
  },
  onDeviceInput(e) { this.setData({ device: e.detail.value }) },
  onIssueInput(e) { this.setData({ issue: e.detail.value }) },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: res => this.setData({ image: res.tempFilePaths[0] })
    })
  },

  getLocation() {
    wx.getLocation({
      type: 'wgs84',
      success: res => {
        this.setData({ location: `经度:${res.longitude.toFixed(4)}, 纬度:${res.latitude.toFixed(4)}` })
        wx.showToast({ title: '已获取', icon: 'success' })
      },
      fail: () => wx.showToast({ title: '定位失败', icon: 'none' })
    })
  },

  submitOrder() {
    if (!this.data.device || !this.data.issue) {
      wx.showToast({ title: '设备与描述必填', icon: 'none' })
      return
    }
    const uid = wx.getStorageSync('uid') || 'cust-unknown'
    const now = new Date().toLocaleString()
    const newOrder = {
      id: `ORD-${Date.now()}`,
      customer: `客户-${uid.slice(0,8)}`,
      customerId: uid,
      device: this.data.device,
      issue: this.data.issue,
      time: now,
      status: 'pending',
      technicianId: null,
      technicianName: null,
      location: this.data.location || '',
      imageUrl: this.data.image || '',
      history: [{ time: now, note: '客户发起报修' }]
    }
    const orders = wx.getStorageSync('orders') || []
    orders.push(newOrder)
    wx.setStorageSync('orders', orders)
    wx.showToast({ title: '报修已提交', icon: 'success' })
    wx.navigateBack()
  }
})
