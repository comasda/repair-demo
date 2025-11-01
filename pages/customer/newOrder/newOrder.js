const { post, uploadimage } = require('../../../utils/request')

Page({
  data: {
    title: '',     // 设备名称
    desc: '',      // 故障描述
    images: [],    // 先存临时路径
    phone: '',
    address: '',   // 文字地址（手填或选择位置返回的 address）
    location: null,           // { lat, lng }
    locationDesc: ''          // 展示给用户看的地址
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onDescInput(e)  { this.setData({ desc: e.detail.value }) },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onAddressInput(e){ this.setData({ address: e.detail.value }) },

  chooseImage() {
    wx.chooseImage({
      count: 3, sizeType: ['compressed'],
      success: res => this.setData({ images: this.data.images.concat(res.tempFilePaths) })
    })
  },

  // 预览大图
  previewImage(e) {
    const current = e.currentTarget.dataset.src
    wx.previewImage({ current, urls: this.data.images })
  },

  // 移除某一张
  removeImage(e) {
    const idx = Number(e.currentTarget.dataset.index)
    if (Number.isNaN(idx)) return
    const arr = this.data.images.slice()
    arr.splice(idx, 1)
    this.setData({ images: arr })
  },

  // 选择地图位置（优先方案）
  chooseLocation() {
    const doChoose = () => {
      wx.chooseLocation({
        success: (loc) => {
          this.setData({
            location: { lat: loc.latitude, lng: loc.longitude },
            locationDesc: loc.address || loc.name || '',
            // 如果地址为空，用选择位置填充一下你的 address 输入
            address: this.data.address || loc.address || ''
          })
        },
        fail: () => {
          // 兜底：只拿坐标
          this.getCurrentLocation()
        }
      })
    }

    // 隐私合规模块（如果未开启也不影响）
    wx.getPrivacySetting?.({
      success: (ps) => {
        if (ps.needAuthorization) {
          wx.requirePrivacyAuthorize({
            success: doChoose,
            fail: () => wx.showToast({ title: '未同意隐私协议，无法获取位置', icon: 'none' })
          })
        } else {
          doChoose()
        }
      },
      fail: doChoose
    })
  },

  // 兜底：仅获取当前坐标（无可读地址）
  getCurrentLocation() {
    const run = () => {
      wx.getLocation({
        type: 'gcj02',
        isHighAccuracy: true,
        highAccuracyExpireTime: 5000,
        success: (loc) => {
          this.setData({
            location: { lat: loc.latitude, lng: loc.longitude },
            locationDesc: this.data.locationDesc || '' // 没有可读地址就不覆盖
          })
          wx.showToast({ title: '已获取当前位置', icon: 'none' })
        },
        fail: (e) => {
          console.error('getLocation fail', e)
          wx.showModal({
            title: '无法获取定位',
            content: '请在设置中开启定位权限或手动填写详细地址',
            confirmText: '去设置',
            success: r => { if (r.confirm) wx.openSetting({}) }
          })
        }
      })
    }

    wx.getSetting({
      success: s => {
        if (s.authSetting['scope.userLocation']) return run()
        wx.authorize({
          scope: 'scope.userLocation',
          success: run,
          fail: () => wx.openSetting({})
        })
      }
    })
  },

  submitOrder() {
    const { title, desc, phone, address, images, location } = this.data
    if (!title || !desc || !phone || !address) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' }); return
    }

    // 提醒采集位置（不是强制，但推荐）
    if (!location) {
      wx.showModal({
        title: '提示',
        content: '建议选择服务位置，以便师傅到场签到与路径规划。是否继续提交？',
        success: (r) => { if (r.confirm) this._doSubmit(); }
      })
    } else {
      this._doSubmit()
    }
  },

  _doSubmit() {
    const user = wx.getStorageSync('currentUser')
    if (!user) { wx.showToast({ title: '请先登录', icon: 'none' }); return }

    const { title, desc, phone, address, images, location, locationDesc } = this.data

    // 1) 先把本地临时图全部上传到后端，拿到可访问 URL
    wx.showLoading({ title: '正在上传图片…', mask: true })
    const tasks = (images || []).map(p => uploadimage(p))

    Promise.all(tasks)
      .then((urls) => {
        wx.hideLoading()
        // 2) 用服务器 URL 提交订单
        return post('/customer', {
          customer: user.username,
          customerId: user.id || user._id,
          device: title,
          issue: desc,
          phone,
          address,
          images: urls,           // 使用服务器返回的 URL 列表
          location,               // { lat, lng }
          locationAddress: locationDesc
        }, { loading: true })
      })
      .then(() => {
        wx.showToast({
          title: '工单提交成功', icon: 'success', duration: 1000,
          success: () => setTimeout(() => wx.reLaunch({ url: '/pages/customer/home/home' }), 1000)
        })
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({ title: err?.message || '上传或提交失败', icon: 'none' })
      })
  }
})
