Page({
  data: {
    phone: '',
    password: '',
    roles: ['客户', '师傅'],   // 只允许选择这两类
    roleIndex: 0,              // 默认选中客户
    roleText: '客户'
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPwdInput(e) { this.setData({ password: e.detail.value }) },

  onRoleChange(e) {
    const index = e.detail.value
    this.setData({
      roleIndex: index,
      roleText: this.data.roles[index]
    })
  },

  registerUser() {
    const { phone, password, roleText } = this.data
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' })
      return
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
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

    wx.showToast({ title: '注册成功' })

    // 注册成功后跳转不同首页
    if (role === 'customer') {
      wx.switchTab({ url: '/pages/customer/home/home' })
    } else if (role === 'technician') {
      wx.switchTab({ url: '/pages/technician/home/home' })
    }
  }
})
