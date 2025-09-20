// 新文件： pages/auth/codeLogin/codeLogin.js
Page({
  data: {
    phone: '',
    code: '',
    codeSent: false,
    timer: 0
  },
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },
  onCodeInput(e) {
    this.setData({ code: e.detail.value })
  },
  sendCode() {
    const { phone, timer } = this.data
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }
    if (timer > 0) {
      return // 已经在倒计时中
    }
    // 模拟发送验证码，真实项目用云函数或后端 API
    // 假设成功后：
    this.setData({ codeSent: true, timer: 60 })
    const interval = setInterval(() => {
      let t = this.data.timer - 1
      if (t <= 0) {
        clearInterval(interval)
        this.setData({ timer: 0 })
      } else {
        this.setData({ timer: t })
      }
    }, 1000)
    wx.showToast({ title: '验证码已发送', icon: 'none' })
  },
  loginWithCode() {
    const { phone, code } = this.data
    if (!phone || !code) {
      wx.showToast({ title: '请输入手机号和验证码', icon: 'none' })
      return
    }
    // 验证码校验逻辑：这里假设本地模拟 correctCode = "123456"
    if (code !== '123456') {
      wx.showToast({ title: '验证码错误', icon: 'none' })
      return
    }
    // 检查用户是否已注册
    let users = wx.getStorageSync('users') || []
    let user = users.find(u => u.phone === phone)
    if (!user) {
      // 如果未注册，则注册为默认客户角色
      user = {
        id: Date.now(),
        phone,
        role: 'customer'
      }
      users.push(user)
      wx.setStorageSync('users', users)
    }
    wx.setStorageSync('currentUser', user)
    wx.showToast({ title: '登录成功' })
    // 跳转角色首页
    let target = '/pages/customer/home/home'
    if (user.role === 'technician') target = '/pages/technician/home/home'
    else if (user.role === 'admin') target = '/pages/admin/home/home'
    wx.reLaunch({ url: target })
  }
})
