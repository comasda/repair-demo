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
    // 统一实名信息（客户/师傅一致）
    // 真实姓名 + 身份证号
    idName: '',
    idNumber: '',
    // 验证码倒计时
    countdown: 0,
    sending: false,
    // ✅ 是否启用固定验证码模式（由后端返回 hint:'fixed' 控制）
    useFixedOtp: true,
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

  // 统一实名输入
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
      const res = await post('/users/captcha/send', { phone: cleanPhone, scene: 'register' })
      wx.showToast({ title: '验证码已发送' })

      // ✅ 检测是否为固定验证码模式
      if (res && res.hint === 'fixed') {
        this.setData({ useFixedOtp: true });
        wx.showToast({
          title: '测试环境验证码：123456',
          icon: 'none',
          duration: 3000
        });
      }
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
      role, roleText, idName, idNumber
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
    // 统一实名校验：客户/师傅均需姓名+身份证号
    if (!idName || !idNumber) {
      wx.showToast({ title: '请填写姓名与身份证号', icon: 'none' }); return
    }

    // 调用后端接口注册（验证码注册）
    post('/users/register', {
      phone: cleanPhone,
      password,
      code,
      role,
      // 兼容老接口：把姓名也放到 profile.name 中（无性别）
      profile: { name: idName },
      idCard: { name: idName, number: idNumber }
    }).then(async (res) => {
      // ✅ 新规则：提交成功 → 进入审核，不自动登录、不跳转首页
      wx.showToast({
        title: '提交成功，待审核',
        icon: 'success',
        duration: 1500
      })
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/auth/login/login' })
      }, 1500)
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
