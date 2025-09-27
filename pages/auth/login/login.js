// pages/auth/login/login.js
const { post } = require('../../../utils/request')

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

  // 密码登录
  loginWithPassword() {
    const { phone, password } = this.data
    console.log('手机号原始值：', JSON.stringify(this.data.phone))
    // if (!phone == "15224210903") {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号错误', icon: 'none' }); return
    }
    console.log('手机号原始值：', JSON.stringify(this.data.phone))
    post('/users/login', {
      username: phone,
      password
    }).then(res => {
      wx.setStorageSync('currentUser', res.user)
      wx.showToast({ title: '登录成功' })
      this.jumpByRole(res.user.role)
    }).catch(err => {
      wx.showToast({ title: err.message || '账号或密码错误', icon: 'none' })
    })
  },

  // 验证码登录（模拟）
  loginWithCode() {
    const { phone, code } = this.data
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号错误', icon: 'none' }); return
    }
    if (code !== '123456') {
      wx.showToast({ title: '验证码错误', icon: 'none' }); return
    }

    // 调用后端登录，如果失败则自动注册
    post('/users/login', {
      username: phone,
      password: 'default'  // 用一个固定密码作为验证码登录的标记
    }).then(res => {
      wx.setStorageSync('currentUser', res.user)
      wx.showToast({ title: '登录成功' })
      this.jumpByRole(res.user.role)
    }).catch(() => {
      // 如果没有账号，则自动注册
      post('/users/register', {
        username: phone,
        password: 'default',
        role: 'customer'
      }).then(res => {
        wx.setStorageSync('currentUser', res.user)
        wx.showToast({ title: '首次登录成功' })
        this.jumpByRole(res.user.role)
      }).catch(err => {
        wx.showToast({ title: err.message || '注册失败', icon: 'none' })
      })
    })
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
