Page({
  data: {
    role: 'admin',
    roleName: '管理员',
    order: {},
    statusMap: {
      'pending': '待派发',
      'assigned': '已派发',
      'accepted': '已接单',
      'on-site': '维修中',
      'completed': '已完成'
    },
    assignVisible: false,
    techs: [],
    techNames: [],
    pickedTechIndex: -1,
    pickedTechName: ''
  },

  onLoad(options) {
    const role = wx.getStorageSync('role') || 'admin'
    const map = { admin:'管理员', technician:'维修师傅', customer:'客户' }
    this.setData({ role, roleName: map[role] })

    const orders = wx.getStorageSync('orders') || []
    const order = orders.find(o => o.id === options.id)
    if (order) this.setData({ order })

    const techs = wx.getStorageSync('technicians') || []
    this.setData({ techs, techNames: techs.map(t => t.name) })
  },

  // —— 管理员：派发工单 ——
  openAssign() {
    if (this.data.order.status !== 'pending') {
      wx.showToast({ title: '仅待派发工单可派发', icon: 'none' })
      return
    }
    this.setData({ assignVisible: true })
  },
  closeAssign() {
    this.setData({ assignVisible: false, pickedTechIndex: -1, pickedTechName: '' })
  },
  onPickTech(e) {
    const i = +e.detail.value
    this.setData({ pickedTechIndex: i, pickedTechName: this.data.techNames[i] })
  },
  confirmAssign() {
    if (this.data.pickedTechIndex < 0) {
      wx.showToast({ title: '请选择师傅', icon: 'none' })
      return
    }
    const tech = this.data.techs[this.data.pickedTechIndex]
    this.updateStatus('assigned', { technicianId: tech.id, technicianName: tech.name }, `工单已指派给${tech.name}`)
    this.closeAssign()
  },

  // —— 技师操作 ——
  accept() {
    this.updateStatus('accepted', null, `${this.data.order.technicianName}已接单`)
  },
  checkIn() {
    // 获取定位
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        const note = `${this.data.order.technicianName}已上门签到，开始维修（经度:${res.longitude.toFixed(4)}，纬度:${res.latitude.toFixed(4)}）`
        this.updateStatus('on-site', null, note)
      },
      fail: () => {
        const note = `${this.data.order.technicianName}已上门签到，开始维修（位置获取失败）`
        this.updateStatus('on-site', null, note)
      }
    })
  },
  complete() {
    this.updateStatus('completed', null, `${this.data.order.technicianName}已完成维修`)
  },
  reject() {
    // 退回 pending，清空技师
    const extra = { technicianId: null, technicianName: null }
    this.updateStatus('pending', extra, `${this.data.order.technicianName}已拒单或超时`)
  },

  // —— 通用状态更新 ——
  updateStatus(newStatus, extraFields = null, historyNote = '') {
    let orders = wx.getStorageSync('orders') || []
    const idx = orders.findIndex(o => o.id === this.data.order.id)
    if (idx === -1) return

    const now = new Date().toLocaleString()
    orders[idx].status = newStatus
    if (extraFields) {
      Object.assign(orders[idx], extraFields)
    }
    orders[idx].history = orders[idx].history || []
    orders[idx].history.push({ time: now, note: historyNote || `状态更新为：${newStatus}` })

    wx.setStorageSync('orders', orders)
    this.setData({ order: orders[idx] })
    wx.showToast({ title: '已更新', icon: 'success' })
  },

  // —— 管理员：导出该客户所有工单（复制到剪贴板） ——
  exportCustomerOrders() {
    const customerId = this.data.order.customerId
    const statusMap = this.data.statusMap
    const orders = (wx.getStorageSync('orders') || []).filter(o => o.customerId === customerId)
    if (orders.length === 0) {
      wx.showToast({ title: '无数据可导出', icon: 'none' })
      return
    }
    let text = `客户ID: ${customerId}\n\n`
    orders.forEach(order => {
      text += `工单ID: ${order.id}\n`
      text += `设备: ${order.device}\n`
      text += `故障描述: ${order.issue}\n`
      text += `状态: ${statusMap[order.status]}\n`
      text += `报修时间: ${order.time}\n`
      if (order.technicianName) text += `指派师傅: ${order.technicianName}\n`
      if (order.location) text += `报修位置: ${order.location}\n`
      if (order.imageUrl) text += `图片链接: ${order.imageUrl}\n`
      text += `--------------\n`
    })
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
    })
  }
})
