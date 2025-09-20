Page({
  data: {
    step: 'choose',
    phone: '',
    password: ''
  },

  choosePhoneLogin() {
    wx.navigateTo({
      url: '/pages/auth/phoneLogin/phoneLogin'
    })
  },

  backToChoose() {
    this.setData({ step: 'choose', phone: '', password: '' })
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPwdInput(e) { this.setData({ password: e.detail.value }) },

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
