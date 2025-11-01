const { get, post } = require('../../../utils/request')

const statusMap = {
  pending: '待接单',
  offered: '待接单',
  assigned: '已接单',
  checkedIn: '已接单',
  awaitingConfirm: '待确认',
  done: '已完成',
  cancelled: '已取消'
}

const tabs = [
  { key: 'all', label: '全部', status: '' },
  { key: 'pending', label: '待接单', status: 'pending' },
  { key: 'assigned', label: '已接单', status: 'assigned' },
  { key: 'awaitingConfirm', label: '待确认', status: 'awaitingConfirm' },
  { key: 'done', label: '已完成', status: 'done' },
  { key: 'cancelled', label: '已取消', status: 'cancelled' }
]

const TAB_KEY = 'myOrders.currentTab'
Page({
  data: {
    // 当前选中
    tabs,
    currentTab: 0,
    // 订单列表
    orders: [],
    // 加载态
    loading: true,
    cancelingId: ''
  },

  // 恢复上次停留的分类（若有记录）
  onLoad() {
    const saved = wx.getStorageSync(TAB_KEY)
    if (saved !== '' && saved !== undefined && saved !== null) {
      const i = Number(saved)
      if (!Number.isNaN(i)) this.setData({ currentTab: i })
    }
  },

  // 通用拉取函数：根据当前 tab 携带 status 请求
 async fetchOrders() {
    const user = wx.getStorageSync('currentUser')
    if (!user || user.role !== 'customer') {
      wx.showToast({ title: '请用客户账号登录', icon: 'none' })
      wx.reLaunch({ url: '/pages/auth/login/login' })
      return
    }

    const tab = this.data.tabs[this.data.currentTab]
    this.setData({ loading: true })
    try {
      let list = []

      if (tab.key === 'assigned') {
        const [a, c] = await Promise.all([
          get(`/customer?status=assigned`, { loading: true }),
          get(`/customer?status=checkedIn`, { loading: true })
        ])
        // 合并（按 _id 去重）
        const map = new Map()
        ;[...(a||[]), ...(c||[])].forEach(o => map.set(o._id, o))
        list = Array.from(map.values())
      } else if (tab.key === 'pending') {
        // ➜ 待接单 = pending + offered
        const [p, o] = await Promise.all([
          get(`/customer?status=pending`, { loading: true }),
          get(`/customer?status=offered`, { loading: true })
        ])
        const map = new Map()
        ;[...(p||[]), ...(o||[])].forEach(x => map.set(x._id, x))
        list = Array.from(map.values())
      } else {
        // 其它单一状态（含 cancelled）或全部
        const status = tab.status
        const url = status ? `/customer?status=${status}` : `/customer`
        list = await get(url, { loading: true })
      }

      const mapped = (list || []).map(o => ({
        ...o,
        statusText: statusMap[o.status] || o.status,
        cancelable: ['pending', 'offered'].includes(o.status)
      }))
      this.setData({ orders: mapped, loading: false })
    } catch (e) {
      wx.showToast({ title: '获取工单失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 取消订单
  async onCancelTap(e) {
    const id = e.currentTarget.dataset.id
    if (!id || this.data.cancelingId) return
    const idx = this.data.orders.findIndex(it => it._id === id)
    if (idx < 0) return
    const item = this.data.orders[idx]
    if (!item.cancelable) {
      wx.showToast({ icon: 'none', title: '当前状态不可取消' })
      return
    }
    const { confirm } = await wx.showModal({
      title: '确认取消',
      content: '确定要取消该订单吗？',
      confirmText: '确定',
      cancelText: '返回'
    }).catch(() => ({ confirm: false }))
    if (!confirm) return

    const origin = this.data.orders.slice()
    const next = origin.slice()
    next.splice(idx, 1)
    this.setData({ orders: next, cancelingId: id })

    try {
      await post(`/customer/${id}/cancel`, {}, { loading: true })
      wx.showToast({ title: '已取消订单' })
      if (!next.length) this.setData({ empty: true })
    } catch (err) {
      this.setData({ orders: origin })
      wx.showToast({ icon: 'none', title: err?.message || '取消失败' })
    } finally {
      this.setData({ cancelingId: '' })
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
    this.setData({ currentTab: index }, () => {
      try { wx.setStorageSync(TAB_KEY, index) } catch(e){}
      this.fetchOrders()
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    // 进入详情前也备份一次，防止外部跳转或页面被重建
    try { wx.setStorageSync(TAB_KEY, this.data.currentTab) } catch(e){}
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` })
  }
})
