const { post, put, uploadimage } = require('../../../utils/request');

Page({
  data: {
    phone: '', code: '',
    name: '', number: '', images: [],
    countdown: 0, sending: false,
    useFixedOtp: true // 如果后端 sendCaptcha 返回 hint:'fixed'，将置为 true
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }); },
  onCodeInput(e) { this.setData({ code: e.detail.value }); },
  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onNumberInput(e) { this.setData({ number: e.detail.value }); },

  sendCaptcha() {
    const phone = (this.data.phone || '').trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' }); return;
    }
    if (this.data.sending || this.data.countdown > 0) return;

    this.setData({ sending: true });
    post('/users/captcha/send', { phone, scene: 'reapply' })
      .then(res => {
        wx.showToast({ title: '验证码已发送', icon: 'success' });
        if (res && res.hint === 'fixed') this.setData({ useFixedOtp: true });
        // 简单倒计时
        this.setData({ countdown: 60 });
        const timer = setInterval(() => {
          const n = this.data.countdown - 1;
          if (n <= 0) { clearInterval(timer); this.setData({ countdown: 0 }); }
          else { this.setData({ countdown: n }); }
        }, 1000);
      })
      .catch(err => {
        wx.showToast({ title: err.message || '发送失败', icon: 'none' });
      })
      .finally(() => this.setData({ sending: false }));
  },

  chooseImage() {
    const self = this;
    wx.chooseImage({
      count: 3,
      success(res) {
        const files = res.tempFilePaths || [];
        if (!files.length) return;
        const uploaded = [];
        const next = (i) => {
          if (i >= files.length) {
            self.setData({ images: (self.data.images || []).concat(uploaded) });
            return;
          }
          uploadimage(files[i])
            .then(url => { if (url) uploaded.push(url); })
            .catch(() => wx.showToast({ title: '上传失败', icon: 'none' }))
            .finally(() => next(i + 1));
        };
        next(0);
      }
    });
  },

  submitResubmit() {
    const phone = (this.data.phone || '').trim();
    const code = (this.data.code || '').trim();
    const name = (this.data.name || '').trim();
    const number = (this.data.number || '').trim();
    const photos = this.data.images || [];

    if (!/^1[3-9]\d{9}$/.test(phone)) { wx.showToast({ title: '手机号格式错误', icon: 'none' }); return; }
    if (!code) { wx.showToast({ title: '请输入验证码', icon: 'none' }); return; }
    if (!name || !number) { wx.showToast({ title: '请填写姓名与身份证号', icon: 'none' }); return; }

    put('/users/review/resubmit-public', {
      phone, code,
      idCard: { name, number, photos }
    })
      .then(() => {
        wx.showModal({
          title: '提交成功',
          content: '您的资料已重新提交，请等待管理员审核。',
          showCancel: false,
          success: () => wx.reLaunch({ url: '/pages/auth/login/login' })
        });
      })
      .catch(err => {
        wx.showToast({ title: err.message || '提交失败', icon: 'none' });
      });
  }
});
