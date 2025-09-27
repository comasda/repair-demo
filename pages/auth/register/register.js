// pages/auth/register/register.js
const { post } = require('../../../utils/request')

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
  onCodeInput(e) { this.setData({ code: e.detail?.code ?? e.detail?.value ?? '' }) },
  onPwdInput(e) { this.setData({ password: e.detail.value }) },
  onConfirmPwdInput(e) { this.setData({ confirmPwd: e.detail.value }) },
  onRoleChange(e) {
    this.setData({ roleIndex: e.detail.value, roleText: this.data.roles[e.detail.value] })
  },

  registerUser() {
    const { phone, code, password, confirmPwd, roleText } = this.data
    const cleanPhone = (phone || '').trim()

    if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' })
      return
    }
    if (!code || code !== '123456') {
      wx.showToast({ title: '验证码错误', icon: 'none' })
      return
    }
    if (!password || password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' }); return
    }
    if (password !== confirmPwd) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' }); return
    }

    // 映射身份到内部角色
    let role = 'customer'
    if (roleText === '师傅') role = 'technician'

    // 调用后端接口注册
    post('/users/register', {
      username: cleanPhone,   // 用手机号作为 username
      password,
      role
    }).then(res => {
      wx.setStorageSync('currentUser', res.user)
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
    }).catch(err => {
      wx.showToast({ title: err.message || '注册失败', icon: 'none' })
    })
  },

  jumpByRole(role) {
    let target = '/pages/customer/home/home'
    if (role === 'technician') target = '/pages/technician/home/home'
    else if (role === 'admin') target = '/pages/admin/home/home'
    wx.reLaunch({ url: target })
  }
})
