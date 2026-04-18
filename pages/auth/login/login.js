// pages/auth/login/login.js
const { post } = require('../../../utils/request')

Page({
  data: {
    loggingIn: false,
  },

  async handleWechatLogin() {
    if (this.data.loggingIn) return
    this.setData({ loggingIn: true })

    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        })
      })

      if (!loginRes.code) {
        throw new Error('获取微信登录凭证失败')
      }

      const res = await post('/users/wechat/login', { code: loginRes.code }, { auth: false, loading: true })

      if (res.nextAction === 'LOGIN_SUCCESS') {
        this.finishLogin(res)
        return
      }

      if (res.nextAction === 'NEED_ONBOARDING' && res.onboardingToken) {
        wx.navigateTo({
          url: `/pages/auth/register/register?onboardingToken=${encodeURIComponent(res.onboardingToken)}`,
        })
        return
      }

      wx.showToast({ title: '登录结果异常', icon: 'none' })
    } catch (err) {
      wx.showToast({ title: err.message || '微信登录失败', icon: 'none' })
    } finally {
      this.setData({ loggingIn: false })
    }
  },

  finishLogin(res) {
    wx.setStorageSync('currentUser', res.user)
    wx.setStorageSync('token', res.accessToken)
    wx.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      this.jumpByRole(res.user.role)
    }, 300)
  },

  jumpByRole(role) {
    let target = '/pages/customer/home/home'
    if (role === 'technician') target = '/pages/technician/home/home'
    wx.reLaunch({ url: target })
  }
})
