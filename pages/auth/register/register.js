const { post } = require('../../../utils/request')

Page({
  data: {
    role: 'customer', // 'customer' | 'technician'
    roles: ['客户', '师傅'],
    roleIndex: 0,
    roleText: '客户',
    onboardingToken: '',
    displayName: '',
    submitting: false,
  },

  onLoad(options) {
    const onboardingToken = decodeURIComponent(options?.onboardingToken || '')
    if (!onboardingToken) {
      wx.showToast({ title: '登录态已失效', icon: 'none' })
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/auth/login/login' })
      }, 500)
      return
    }

    this.setData({
      onboardingToken,
    })
  },

  onRoleChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      roleIndex: idx,
      roleText: this.data.roles[idx],
      role: idx === 1 ? 'technician' : 'customer'
    })
  },

  onNameInput(e) {
    this.setData({ displayName: e.detail.value })
  },

  async handleGetPhoneNumber(e) {
    if (this.data.submitting) return
    if (!this.data.onboardingToken) {
      wx.showToast({ title: '登录态已失效', icon: 'none' })
      return
    }

    const phoneCode = e.detail?.code
    if (!phoneCode) {
      wx.showToast({ title: '请先授权手机号', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      const res = await post('/users/wechat/complete-profile', {
        onboardingToken: this.data.onboardingToken,
        phoneCode,
        role: this.data.role,
        displayName: this.data.displayName,
      }, { auth: false, loading: true })

      wx.setStorageSync('currentUser', res.user)
      wx.setStorageSync('token', res.accessToken)
      wx.showToast({ title: '已完成登录', icon: 'success' })
      setTimeout(() => {
        this.jumpByRole(res.user.role)
      }, 300)
    } catch (err) {
      wx.showToast({ title: err.message || '完善资料失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  jumpByRole(role) {
    let target = '/pages/customer/home/home'
    if (role === 'technician') target = '/pages/technician/home/home'
    else if (role === 'admin') target = '/pages/admin/home/home'
    wx.reLaunch({ url: target })
  }
})
