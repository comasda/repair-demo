Component({
  properties: {
    phone: {
      type: String,
      value: ''
    }
  },
  data: {
    code: '',
    timer: 0
  },
  methods: {
    // 输入验证码
    onCodeInput(e) {
      this.setData({ code: e.detail.value })
      this.triggerEvent('codeinput', { code: e.detail.value })
    },

    // 发送验证码
    sendCode() {
      const { phone, timer } = this.data
      if (!/^1[3-9]\d{9}$/.test(this.properties.phone)) {
        wx.showToast({ title: '手机号格式错误', icon: 'none' })
        return
      }
      if (timer > 0) return

      // 模拟发送验证码（真实情况要调后端/云函数）
      this.setData({ timer: 60 })
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
      // 通知父组件验证码已发送
      this.triggerEvent('codesent')
    }
  }
})
