const { get } = require('../../../utils/request')

const statusMap = { pending: '待接单', assigned: '已接单', checkedIn: '已接单', done: '已完成' }

Page({
  data: {
    orders: [],
    loading: true
  },

  onShow() {
    const user = wx.getStorageSync('currentUser')
    if (!user || user.role !== 'customer') {
      wx.showToast({ title: '请用客户账号登录', icon: 'none' })
      wx.reLaunch({ url: '/pages/auth/login/login' })
      return
    }

    // 优先：后端支持 status=done
    get(`/customer?&status=done`).then(list => {
      const mapped = (list || []).map(o => ({ ...o, statusText: statusMap[o.status] || o.status }))
      this.setData({ orders: mapped, loading: false })
    }).catch(() => {
      // 兜底：后端暂不支持时，前端过滤
      get(`/customer`).then(list => {
        const filtered = (list || []).filter(o => o.status === 'done')
        const mapped = filtered.map(o => ({ ...o, statusText: statusMap[o.status] || o.status }))
        this.setData({ orders: mapped, loading: false })
      }).catch(() => {
        wx.showToast({ title: '获取工单失败', icon: 'none' })
        this.setData({ loading: false })
      })
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` })
  }
})
