// pages/orderDetail/orderDetail.js
const { get, put, post, uploadimage } = require('../../utils/request')

const statusMap = { pending: '待接单', offered: '待接收', assigned: '已接单', checkedIn: '已签到', awaitingConfirm: '待确认', done: '已完成', cancelled: '已取消' }
const CHECKIN_RADIUS_M = 200  // 你可以改为 300/500

// 计算两点经纬度的哈弗辛距离（米）
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = d => d * Math.PI / 180
  const R = 6371000 // 地球半径，米
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

Page({
  data: {
    order: null,
    role: '',
    userId: '',
    userName: '',
    statusText: '',
    reviews: [],
    hasMyReview: false,
    checkinImages: []
  },

  onLoad(options) {
    const user = wx.getStorageSync('currentUser')
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.reLaunch({ url: '/pages/auth/login/login' })
      return
    }
    this.setData({
      role: user.role,
      userId: user.id || user._id,
      userName: user.username || user.nickname || '师傅'
    })
    this.loadOrder(options.id)
  },

  loadOrder(id) {
    get(`/customer/${id}`, { loading: true }).then(res => {
      // 兼容两种写法：order.location = {lat,lng} 或 order.lat/order.lng
      const loc = res.location || {}
      res._lat = loc.lat != null ? loc.lat : res.lat
      res._lng = loc.lng != null ? loc.lng : res.lng

      // ↓ 评价处理：把 reviews 放进 data，并判断是否有我自己的评价
      const reviews = Array.isArray(res.reviews) ? res.reviews : []
      const me = this.data.userId
      const hasMyReview = reviews.some(r => r.customerId === me)
      
      let statusText
      // 统一用 statusMap（已含 checkedIn/awaitingConfirm），若无则回退原值
      statusText = statusMap[res.status] || res.status
      this.setData({
        order: res,
        statusText,
        reviews,
        hasMyReview
      })
    }).catch(() => wx.showToast({ title: '获取工单失败', icon: 'none' }))
  },

  // 预览第 idx 张图片
  previewAt(e) {
    const idx = Number(e.currentTarget.dataset.index) || 0
    const urls = (this.data.order && this.data.order.images) ? this.data.order.images : []
    if (!urls.length) return
    wx.previewImage({ current: urls[idx], urls })
  },

  // —— 客户端：去评价 ——（未评价时显示）
  goReview() {
    const id = this.data.order._id
    wx.navigateTo({
      url: `/pages/customer/review/review?id=${id}&mode=first`,
      events: {
        'review:refresh': () => this.loadOrder(id) // 收到事件后刷新详情
      }
    })
  },

  // —— 客户端：追加评价 ——（已评价时显示）
  goAppendReview() {
    const id = this.data.order._id
    wx.navigateTo({
      url: `/pages/customer/review/review?id=${id}&mode=append`,
      events: {
        'review:refresh': () => this.loadOrder(id)
      }
    })
  },

  // —— 师傅端：到场签到（自动获取定位 & 距离判断）——
  checkin() {
    const { order } = this.data
    if (!order) return

    // 订单必须有坐标
    if (order._lat == null || order._lng == null) {
      wx.showModal({
        title: '无法签到',
        content: '该工单未配置定位坐标，无法进行到场距离校验，请联系管理员或让客户下单时选择位置。',
        showCancel: false
      })
      return
    }

    const run = () => {
      wx.getLocation({
        type: 'gcj02',
        isHighAccuracy: true,
        highAccuracyExpireTime: 5000,
        success: (loc) => {
          const lat = loc.latitude
          const lng = loc.longitude
          const dist = Math.round(haversineDistance(lat, lng, order._lat, order._lng))

          if (dist <= CHECKIN_RADIUS_M) {
            this._postCheckin(order._id, lat, lng)  // 成功：提交签到
          } else {
            wx.showToast({
              title: `距工单位置约${dist}米，需在${CHECKIN_RADIUS_M}米内才能签到`,
              icon: 'none',
              duration: 2500
            })
          }
        },
        fail: (e) => {
          console.error('getLocation 失败：', e)
          let msg = '获取定位失败'
          const em = String(e.errMsg || '')
          if (em.includes('need to be declared')) {
            msg = '缺少 requiredPrivateInfos 配置，请联系管理员'
          } else if (em.includes('auth deny') || em.includes('authorize')) {
            msg = '未授权定位，请在设置里开启定位权限'
          }
          wx.showModal({
            title: '定位失败',
            content: msg,
            confirmText: '去设置',
            success: (r) => { if (r.confirm) wx.openSetting({}) }
          })
        }
      })
    }

    // 隐私/权限链路
    wx.getPrivacySetting?.({
      success: (ps) => {
        const go = () => {
          wx.getSetting({
            success: s => {
              if (s.authSetting['scope.userLocation']) run()
              else {
                wx.authorize({
                  scope: 'scope.userLocation',
                  success: run,
                  fail: () => wx.openSetting({})
                })
              }
            }
          })
        }
        if (ps.needAuthorization) {
          wx.requirePrivacyAuthorize({
            success: go,
            fail: () => wx.showToast({ title: '未同意隐私协议，无法定位', icon: 'none' })
          })
        } else {
          go()
        }
      },
      fail: () => run()
    })
  },

  _postCheckin(orderId, lat, lng) {
    const { userId, userName } = this.data
    post(`/technicians/${orderId}/checkin`, {
      lat, lng,
      technicianId: userId,
      technicianName: userName
      // 不再上传 address；后端根据订单坐标判断合规（见下文后端校验）
    }).then(() => {
      wx.showToast({ title: '签到成功' })
      this.loadOrder(orderId)
    }).catch(err => {
      // 若后端也做了半径校验，可能在这里被拒绝
      wx.showToast({ title: err.message || '签到失败', icon: 'none' })
    })
  },

  // —— 师傅端：发起完成（仅在已签到时可用）——
  requestComplete() {
    const { order, role, userId } = this.data
    if (!order) return
    if (role !== 'technician') {
      wx.showToast({ title: '仅师傅可发起完成', icon: 'none' }); return
    }
    if (order.status !== 'checkedIn') {
      wx.showToast({ title: '需到场签到后才能发起完成', icon: 'none' }); return
    }
    // ★ 必须上传签到照片
    if (this.data.checkinImages.length < 5) {
      wx.showToast({ title: '请上传 5 张签到照片', icon: 'none' })
      return
    }
    const uploadTasks = this.data.checkinImages.map(p => uploadimage(p))

    Promise.all(uploadTasks).then(urls => {
      // 2) 调用发起完成接口，并把签到图放进去
      return post(`/technicians/${order._id}/complete-request`, {
        technicianId: userId,
        checkinImages: urls    // ★ 发给后台
      })
    })
      .then(() => { wx.showToast({ title: '已发起完成，等待管理员确认' }); this.loadOrder(order._id) })
      .catch(err => wx.showToast({ title: err.message || '操作失败', icon: 'none' }))
  },

  // —— 客户端：确认完成（废弃）——
  // confirmComplete() {
  //   const { order, role, userId } = this.data
  //   if (!order) return
  //   if (role !== 'customer') {
  //     wx.showToast({ title: '仅客户可确认完成', icon: 'none' }); return
  //   }
  //   if (order.status !== 'awaitingConfirm') {
  //     wx.showToast({ title: '当前状态不可确认', icon: 'none' }); return
  //   }
  //   post(`/customer/${order._id}/complete-confirm`, { customerId: userId })
  //     .then(() => {
  //       wx.showToast({ title: '订单已完成' })
  //       // 可选：完成后引导去评价
  //       setTimeout(() => this.goReview(), 600)
  //     })
  //     .catch(err => wx.showToast({ title: err.message || '操作失败', icon: 'none' }))
  // },

  // —— 客户端：取消订单（仅在 pending/offered 时显示）——
  async cancelOrder() {
    const { order, role, userId } = this.data
    if (!order) return
    if (role !== 'customer') {
      wx.showToast({ title: '仅客户可取消', icon: 'none' }); return
    }
    if (!['pending', 'offered'].includes(order.status)) {
      wx.showToast({ title: '当前状态不可取消', icon: 'none' }); return
    }
    const { confirm } = await wx.showModal({
      title: '确认取消',
      content: '取消后将无法恢复，确定继续？',
      confirmText: '确定', cancelText: '返回'
    }).catch(() => ({ confirm: false }))
    if (!confirm) return
    try {
      await post(`/customer/${order._id}/cancel`, { customerId: userId }, { loading: true })
      wx.showToast({ title: '订单已取消' })
      const pages = getCurrentPages()
      const prev = pages[pages.length - 2]
      if (prev && typeof prev.fetchOrders === 'function') prev.fetchOrders()
      wx.navigateBack()
    } catch (err) {
      wx.showToast({ icon: 'none', title: err?.message || '取消失败' })
    }
  },

  // —— 师傅端：查看用户评价（仅在已完成时展示按钮）——
  goTechViewReview() {
  const { order, role } = this.data
  if (!order || !order._id) return
  if (role !== 'technician') {
    wx.showToast({ title: '仅师傅可查看', icon: 'none' })
    return
  }
  // 仅完成状态允许进入评价页
  if (order.status !== 'done') {
    wx.showToast({ title: '仅已完成的订单可查看评价', icon: 'none' })
    return
  }
  wx.navigateTo({ url: `/pages/technician/review/review?id=${order._id}` })
  },

  chooseCheckinImage() {
    const arr = this.data.checkinImages
    if (arr.length >= 5) {
      wx.showToast({ title: '最多上传 5 张', icon: 'none' })
      return
    }
    wx.chooseImage({
      count: 5 - arr.length,
      sizeType: ['compressed'],
      success: res => {
        this.setData({ checkinImages: arr.concat(res.tempFilePaths) })
      }
    })
  },

  // 预览签到图片
  previewCheckin(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.checkinImages[index],
      urls: this.data.checkinImages
    })
  },

  // 删除签到图片
  removeCheckin(e) {
    const index = e.currentTarget.dataset.index
    const arr = this.data.checkinImages.slice()
    arr.splice(index, 1)
    this.setData({ checkinImages: arr })
  }
})
