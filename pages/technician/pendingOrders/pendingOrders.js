const { get, post } = require('../../../utils/request')

Page({
  data: {
    orders: []
  },

  onShow() {
    const user = wx.getStorageSync('currentUser')
    if (!user || user.role !== 'technician') {
      wx.showToast({ title: '请用师傅账号登录', icon: 'none' })
      return
    }
    const technicianId = user.id || user._id

    // 只拉取“指派给我”的工单集合（offered/assigned/…）
    get(`/technicians/mine?status=offered`, { loading: true })
      .then(list => {
        const mapped = (list || []).map(o => ({
          ...o,
          statusText: '待接收' // offered 的显示文案
        }))
        this.setData({ orders: mapped })
      }).catch(err => {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  // 师傅接单
  acceptOrder(e) {
    const id = e.currentTarget.dataset.id
    post(`/technicians/${id}/accept`, {})
      .then(() => {
        wx.showToast({ title: '已接受' })
        this.onShow()
      })
      .catch(err => {
        wx.showToast({ title: err.message || '接受失败', icon: 'none' })
      })
  },

  //拒绝指派
  declineOrder(e) {
    const id = e.currentTarget.dataset.id
    post(`/technicians/${id}/decline`, { reason: '不方便' })
      .then(() => { wx.showToast({ title: '已拒绝' }); this.onShow() })
      .catch(err => wx.showToast({ title: err.message || '操作失败', icon: 'none' }))
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` })
  }
})
