const { post } = require('../../../utils/request')

Page({
  data: {
    // 基础
    phone: '',
    code: '',
    password: '',
    confirmPwd: '',
    role: 'customer', // 'customer' | 'technician'
    roles: ['客户', '师傅'],
    roleIndex: 0,
    roleText: '客户',
    // 客户
    name: '',
    gender: '', // 'male' | 'female'
    // 师傅
    idName: '',
    idNumber: '',
    // 验证码倒计时
    countdown: 0,
    sending: false,
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onCodeInput(e) { this.setData({ code: e.detail?.code ?? e.detail?.value ?? '' }) },
  onPwdInput(e) { this.setData({ password: e.detail.value }) },
  onConfirmPwdInput(e) { this.setData({ confirmPwd: e.detail.value }) },
  onRoleChange(e) {
    const idx = Number(e.detail.value)
    this.setData({
      roleIndex: idx,
      roleText: this.data.roles[idx],
      role: idx === 1 ? 'technician' : 'customer'
    })
  },
  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onGenderChange(e) {
    const idx = Number(e.detail.value)
    this.setData({ gender: idx === 0 ? 'male' : 'female' })
  },
  onIdNameInput(e) { this.setData({ idName: e.detail.value }) },
  onIdNumberInput(e) { this.setData({ idNumber: e.detail.value }) },

  // 发送验证码（带倒计时）
  async sendCaptcha() {
    const { phone, sending, countdown } = this.data
    if (sending || countdown > 0) return
    const cleanPhone = (phone || '').trim()
    if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' }); return
    }
    try {
      this.setData({ sending: true })
      await post('/users/captcha/send', { phone: cleanPhone, scene: 'register' })
      wx.showToast({ title: '验证码已发送' })
      this.setData({ countdown: 60 })
      this.__timer && clearInterval(this.__timer)
      this.__timer = setInterval(() => {
        const n = this.data.countdown - 1
        if (n <= 0) { clearInterval(this.__timer); this.setData({ countdown: 0 }) }
        else this.setData({ countdown: n })
      }, 1000)
    } catch (err) {
      wx.showToast({ title: err?.message || '发送失败', icon: 'none' })
    } finally {
      this.setData({ sending: false })
    }
  },

  registerUser() {
    const {
      phone, code, password, confirmPwd,
      role, roleText, name, gender, idName, idNumber
    } = this.data
    const cleanPhone = (phone || '').trim()

    if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' })
      return
    }
    if (!code) { wx.showToast({ title: '请输入验证码', icon: 'none' }); return }
    if (!password || password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' }); return
    }
    if (password !== confirmPwd) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' }); return
    }

    // 映射身份到内部角色
    // 角色必填项校验
    if (role === 'customer') {
      if (!name || !gender) {
        wx.showToast({ title: '请填写姓名与性别', icon: 'none' }); return
      }
    } else if (role === 'technician') {
      if (!idName || !idNumber) {
        wx.showToast({ title: '请填写身份证姓名与号码', icon: 'none' }); return
      }
    }

    // 调用后端接口注册
    // 调用后端接口注册（验证码注册）
    post('/users/register', {
      phone: cleanPhone,
      password,
      code,
      role,
      profile: { name, gender },
      idCard: { name: idName, number: idNumber }
    }).then(async (res) => {
      wx.setStorageSync('currentUser', res.user)
      if (res.accessToken) {
        wx.setStorageSync('token', res.accessToken)      // 注册即得 token
      } else {
        // 兼容后端未返回 token 的老版本：注册后自动登录一次
        const loginRes = await post('/users/login', { username: cleanPhone, password })
        wx.setStorageSync('token', loginRes.accessToken)
      }
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
