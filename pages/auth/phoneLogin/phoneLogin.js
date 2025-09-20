Page({
  data: {
    phone: '',
    password: ''
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },
  onPwdInput(e) {
    this.setData({ password: e.detail.value })
  },

  loginWithPhone() {
    const { phone, password } = this.data
    if (!phone || !password) {
      wx.showToast({ title: '请输入手机号和密码', icon: 'none' })
      return
    }

    let users = wx.getStorageSync('users') || []
    let user = users.find(u => u.phone === phone && u.password === password)

    if (!user) {
      wx.showToast({ title: '账号或密码错误', icon: 'none' })
      return
    }

    wx.setStorageSync('currentUser', user)
    wx.showToast({ title: '登录成功' })
    this.jumpByRole(user.role)
  },

  backToLogin() {
    wx.navigateBack()
  },

  jumpByRole(role) {
    let target = '/pages/customer/home/home'
    if (role === 'technician') target = '/pages/technician/home/home'
    else if (role === 'admin') target = '/pages/admin/home/home'
    wx.reLaunch({ url: target })
  }
})
