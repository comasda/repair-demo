const { get } = require('../../../utils/request')

const statusMap = {
  pending: '待接单',
  offered: '待接单',
  assigned: '已接单',
  checkedIn: '已接单',
  awaitingConfirm: '待确认',
  done: '已完成'
}

const tabs = [
  { key: 'all', label: '全部', status: '' },
  { key: 'pending', label: '待接单', status: 'pending' },
  { key: 'assigned', label: '已接单', status: 'assigned' },
  { key: 'awaitingConfirm', label: '待确认', status: 'awaitingConfirm' },
  { key: 'done', label: '已完成', status: 'done' }
]

Page({
  data: {
    // 当前选中
    tabs,
    currentTab: 0,
    // 订单列表
    orders: [],
    // 加载态
    loading: true
  },

  // 通用拉取函数：根据当前 tab 携带 status 请求
 async fetchOrders() {
    const user = wx.getStorageSync('currentUser')
    if (!user || user.role !== 'customer') {
      wx.showToast({ title: '请用客户账号登录', icon: 'none' })
      wx.reLaunch({ url: '/pages/auth/login/login' })
      return
    }
    const customerId = user.id || user._id

    const tab = this.data.tabs[this.data.currentTab]
    this.setData({ loading: true })
    try {
      let list = []

      if (tab.key === 'assigned') {
        const [a, c] = await Promise.all([
          get(`/customer?customerId=${customerId}&status=assigned`, { loading: true }),
          get(`/customer?customerId=${customerId}&status=checkedIn`, { loading: true })
        ])
        // 合并（按 _id 去重）
        const map = new Map()
        ;[...(a||[]), ...(c||[])].forEach(o => map.set(o._id, o))
        list = Array.from(map.values())
      } else if (tab.key === 'pending') {
      // ➜ 待接单 = pending + offered
      const [p, o] = await Promise.all([
        get(`/customer?customerId=${customerId}&status=pending`, { loading: true }),
        get(`/customer?customerId=${customerId}&status=offered`, { loading: true })
      ])
      const map = new Map()
      ;[...(p||[]), ...(o||[])].forEach(x => map.set(x._id, x))
      list = Array.from(map.values())
      }else {
        const statusQuery = tab.status ? `&status=${tab.status}` : ''
        list = await get(`/customer?customerId=${customerId}${statusQuery}`, { loading: true })
      }

      const mapped = (list || []).map(o => ({
        ...o,
        statusText: statusMap[o.status] || o.status
      }))
      this.setData({ orders: mapped, loading: false })
    } catch (e) {
      wx.showToast({ title: '获取工单失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 生命周期：进入页面/返回显示时都按当前 tab 拉取
  onShow() {
    this.fetchOrders()
  },

  // 切换 tab
  onTabChange(e) {
    const index = Number(e.currentTarget.dataset.index)
    if (index === this.data.currentTab) return
    this.setData({ currentTab: index }, () => this.fetchOrders())
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` })
  }
})
