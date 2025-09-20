App({
 onLaunch: function() {
    // 初始化用户存储
    if (!wx.getStorageSync('users')) {
      wx.setStorageSync('users', [])
    }
    // 简单的“登录”与 UID 初始化
    if (!wx.getStorageSync('uid')) {
      const uid = 'uid-' + Math.random().toString(36).slice(2, 10)
      wx.setStorageSync('uid', uid)
    }
    // 默认角色：管理员（可在首页切换）
    if (!wx.getStorageSync('role')) {
      wx.setStorageSync('role', 'admin')
    }
    // 初始化技术员列表
    if (!wx.getStorageSync('technicians')) {
      wx.setStorageSync('technicians', [
        { id: 'tech-001', name: '陈师傅' },
        { id: 'tech-002', name: '林师傅' },
        { id: 'tech-003', name: '周师傅' }
      ])
    }
    // 首次运行写入示例工单
    const existing = wx.getStorageSync('orders') || []
    if (existing.length === 0) {
      const mockOrders = [
        { id: '20240810-001', customer: '张先生', customerId: 'cust-001', device: '制冷冰箱', issue: '不制冷', time: '2024-08-10 09:30', status: 'pending', technicianId: null, technicianName: null, history: [{ time: '2024-08-10 09:30', note: '客户发起报修' }] },
        { id: '20240809-002', customer: '王女士', customerId: 'cust-002', device: '燃气灶', issue: '打不着火', time: '2024-08-09 15:45', status: 'pending', technicianId: null, technicianName: null, history: [{ time: '2024-08-09 15:45', note: '客户发起报修' }] },
        { id: '20240809-001', customer: '李先生', customerId: 'cust-003', device: '油烟机', issue: '吸力弱', time: '2024-08-09 11:20', status: 'pending', technicianId: null, technicianName: null, history: [{ time: '2024-08-09 11:20', note: '客户发起报修' }] },
        { id: '20240808-001', customer: '张先生', customerId: 'cust-001', device: '消毒柜', issue: '无法开门', time: '2024-08-08 11:20', status: 'assigned', technicianId: 'tech-001', technicianName: '陈师傅', history: [{ time: '2024-08-08 11:20', note: '客户发起报修' }, { time: '2024-08-08 12:00', note: '工单已指派给陈师傅' }] }
      ]
      wx.setStorageSync('orders', mockOrders)
    }
  },

  checkLogin: function() {
    const user = wx.getStorageSync('currentUser')
    if (!user) {
      wx.redirectTo({ url: '/pages/auth/login/login' })
      return false
    }
    return true
  }
})
