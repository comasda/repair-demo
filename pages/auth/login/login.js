Page({
  data: {
    step: 'choose',
    phone: '',
    password: ''
  },

  choosePhoneLogin() {
    this.setData({ step: 'phone' })
  },

  backToChoose() {
    this.setData({ step: 'choose', phone: '', password: '' })
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPwdInput(e) { this.setData({ password: e.detail.value }) },

  loginWithPhone() {
    const phone = this.data.phone.trim()
    const password = this.data.password
    // 简单手机号正则，可替换成你需要的
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' })
      return
    }
    const users = wx.getStorageSync('users') || []
    const user = users.find(u => u.phone === phone && u.password === password)
    if (user) {
      wx.setStorageSync('currentUser', user)
      wx.showToast({ title: '登录成功' })
      this.jumpByRole(user.role)   // 根据角色自动跳转
      this.jumpByRole(user.role)
    } else {
      wx.showToast({ title: '账号或密码错误', icon: 'none' })
    }
  },

  loginWithWechat() {
    wx.getUserProfile({
      desc: '用于登录',
      success: (res) => {
        wx.login({
          success: (loginRes) => {
            const openid = 'openid-' + loginRes.code
            let users = wx.getStorageSync('users') || []
            let user = users.find(u => u.openid === openid)
            if (!user) {
              user = {
                id: Date.now(),
                openid,
                nickname: res.userInfo.nickName,
                avatar: res.userInfo.avatarUrl,
                role: 'customer'
              }
              users.push(user)
              wx.setStorageSync('users', users)
            }
            wx.setStorageSync('currentUser', user)
            wx.showToast({ title: '微信登录成功' })
            this.jumpByRole(user.role)
          }
        })
      }
    })
  },

  jumpByRole(role) {
    let target = '/pages/customer/home/home'
    if (role === 'technician') target = '/pages/technician/home/home'
    else if (role === 'admin') target = '/pages/admin/home/home'
    // 用 switchTab 如果这些角色首页是 tab 页，否则用 navigateTo
    wx.reLaunch({ url: target })
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/auth/register/register' })
  }
})
