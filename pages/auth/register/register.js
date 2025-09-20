Page({
  data: {
    phone: '',
    code: '',
    password: '',
    confirmPwd: '',
    roles: ['客户', '师傅'],   // 只允许选择这两类
    roleIndex: 0,              // 默认选中客户
    roleText: '客户'
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  // onCodeInput(e) { this.setData({ code: e.detail.value }) },
  onCodeInput(e) { this.setData({ code: e.detail?.code ?? e.detail?.value ?? '' }) },
  onPwdInput(e) { this.setData({ password: e.detail.value }) },
  onConfirmPwdInput(e) { this.setData({ confirmPwd: e.detail.value }) },
  onRoleChange(e) {
    this.setData({ roleIndex: e.detail.value, roleText: this.data.roles[e.detail.value] })
  },

  registerUser() {
    const { phone, code, password, confirmPwd, roleText } = this.data
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' })
      return
    }
    if (!code) {
      wx.showToast({ title: '验证码错误1', icon: 'none' }); 
      return
    }

    if (!code || code !== '123456') {
      wx.showToast({ title: '验证码错误', icon: 'none' }); 
      return
    }
    if (!password || password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' }); return
    }
    if (password !== confirmPwd) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' }); return
    }
    let users = wx.getStorageSync('users') || []
    if (users.find(u => u.phone === phone)) {
      wx.showToast({ title: '手机号已注册', icon: 'none' })
      return
    }

    // 映射身份到内部角色
    let role = 'customer'
    if (roleText === '师傅') role = 'technician'

    const newUser = { id: Date.now(), phone, password, role }
    users.push(newUser)
    wx.setStorageSync('users', users)
    wx.setStorageSync('currentUser', newUser)

    wx.showToast({ 
      title: '注册成功',
      icon: 'success',
      duration: 1000,
      success: () => {
        setTimeout(() => {
          this.jumpByRole(role)
        }, 1000)
      }
    })
    // 注册成功后跳转不同首页

  },
  jumpByRole(role) {
      let target = '/pages/customer/home/home'
      if (role === 'technician') target = '/pages/technician/home/home'
      else if (role === 'admin') target = '/pages/admin/home/home'
      wx.reLaunch({ url: target })   // ✅ reLaunch / navigateTo / switchTab 三选一
    }
})
