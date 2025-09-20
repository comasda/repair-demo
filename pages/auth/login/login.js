Page({
  data: {
    phone: '',
    password: '',
    code: '',
    mode: 'password' // password 或 code
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPwdInput(e) { this.setData({ password: e.detail.value }) },
  onCodeInput(e) { this.setData({ code: e.detail?.code ?? e.detail?.value ?? '' }) },

  switchMode() {
    this.setData({ mode: this.data.mode === 'password' ? 'code' : 'password' })
  },

  loginWithPassword() {
    const { phone, password } = this.data
    let users = wx.getStorageSync('users') || []
    let user = users.find(u => u.phone === phone && u.password === password)
    if (!user) {
      wx.showToast({ title: '账号或密码错误', icon: 'none' }); return
    }
    wx.setStorageSync('currentUser', user)
    wx.showToast({ title: '登录成功' })
    this.jumpByRole(user.role)
  },

  loginWithCode() {
    const { phone, code } = this.data
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号错误', icon: 'none' }); return
    }
    if (code !== '123456') {
      wx.showToast({ title: '验证码错误', icon: 'none' }); return
    }
    let users = wx.getStorageSync('users') || []
    let user = users.find(u => u.phone === phone)
    if (!user) {
      user = { id: Date.now(), phone, role: 'customer' }
      users.push(user)
      wx.setStorageSync('users', users)
    }
    wx.setStorageSync('currentUser', user)
    wx.showToast({ title: '登录成功' })
    this.jumpByRole(user.role)
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/auth/register/register' })
  },

  jumpByRole(role) {
    let target = '/pages/customer/home/home'
    if (role === 'technician') target = '/pages/technician/home/home'
    wx.reLaunch({ url: target })
  }
})
