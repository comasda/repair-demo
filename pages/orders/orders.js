Page({
  data: {
    role: 'admin',
    roleName: '管理员',
    orders: [],
    statusMap: {
      'pending': '待派发',
      'assigned': '已派发',
      'accepted': '已接单',
      'on-site': '维修中',
      'completed': '已完成'
    }
  },
  onShow() {
    const role = wx.getStorageSync('role') || 'admin'
    const map = { admin:'管理员', technician:'维修师傅', customer:'客户' }
    this.setData({ role, roleName: map[role] })
    this.loadOrders()
  },
  loadOrders() {
    let orders = (wx.getStorageSync('orders') || []).slice().sort((a,b)=> new Date(b.time) - new Date(a.time))
    const uid = wx.getStorageSync('uid')

    if (this.data.role === 'admin') {
      // 管理员：显示所有
    } else if (this.data.role === 'technician') {
      // 演示：假设当前师傅是 tech-001
      orders = orders.filter(o => o.technicianId === 'tech-001')
    } else {
      // 客户：只看自己的
      orders = orders.filter(o => o.customerId === uid)
    }
    this.setData({ orders })
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${id}` })
  }
})
