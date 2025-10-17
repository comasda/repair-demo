const { get } = require('../../../utils/request')

// 为师傅端补齐 offered；pending 在师傅端不可见
const statusMap = {
  offered: '待接单',
  assigned: '待签到',
  checkedIn: '已签到',
  awaitingConfirm: '待确认',
  done: '已完成'
}

const tabs = [
  { key: 'all', label: '全部', status: '' },
  { key: 'assigned', label: '待签到', status: 'assigned' },
  { key: 'checkedIn', label: '已签到', status: 'checkedIn' },
  { key: 'awaitingConfirm', label: '待确认', status: 'awaitingConfirm' },
  { key: 'done', label: '已完成', status: 'done' }
]

Page({
  data: {
    tabs,
    currentTab: 0,
    orders: [],
    loading: false
  },

  fetchOrders() {
    const user = wx.getStorageSync('currentUser')
    if (!user || user.role !== 'technician') {
      wx.showToast({ title: '请用师傅账号登录', icon: 'none' })
      wx.reLaunch({ url: '/pages/auth/login/login' })
      return
    }

    const tab = this.data.tabs[this.data.currentTab]
    const url = tab.status ? `/technicians/mine?status=${tab.status}` : '/technicians/mine'
    this.setData({ loading: true })

    get(url)
      .then(res => {
        const mapped = (res || []).map(o => ({
          ...o,
          statusText: statusMap[o.status] || o.status
        }))
        this.setData({ orders: mapped, loading: false })
      })
      .catch(() => {
        wx.showToast({ title: '获取工单失败', icon: 'none' })
        this.setData({ loading: false })
      })
  },

  // 切换 tab 后拉取
  onTabChange(e) {
    const index = Number(e.currentTarget.dataset.index)
    if (index === this.data.currentTab) return
    this.setData({ currentTab: index }, () => this.fetchOrders())
  },

  // 生命周期：进入页面或返回时刷新
  onShow() { this.fetchOrders() },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` })
  }
})
