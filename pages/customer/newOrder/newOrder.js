// pages/orders/newOrder.js
const { post } = require('../../../utils/request')

Page({
  data: {
    title: '',     // 设备名称
    desc: '',      // 故障描述
    images: [],    // 上传图片（当前只是选择，还未对接后端上传）
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

    const user = wx.getStorageSync('currentUser')
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    // 调用后端接口创建订单
    post('/orders', {
      customer: user.username,   // 手机号 / 用户名
      customerId: user.id,
      device: title,
      issue: desc,
      phone,                     // 联系电话
      address,                   // 地址
      images                     // 图片（可以先存临时路径，后续改成上传到后端/OSS）
    }).then(res => {
      wx.showToast({
        title: '工单提交成功',
        icon: 'success',
        duration: 1000,
        success: () => {
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/customer/home/home' })
          }, 1000)
        }
      })
    }).catch(err => {
      wx.showToast({ title: err.message || '提交失败', icon: 'none' })
    })
  }
})
