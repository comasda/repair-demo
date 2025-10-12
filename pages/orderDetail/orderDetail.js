// pages/orderDetail/orderDetail.js
const { get, put, post } = require('../../utils/request')

const statusMap = { pending: '待接单', assigned: '已接单', done: '已完成' }
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
    hasMyReview: false
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
    get(`/orders/${id}`).then(res => {
      // 兼容两种写法：order.location = {lat,lng} 或 order.lat/order.lng
      const loc = res.location || {}
      res._lat = loc.lat != null ? loc.lat : res.lat
      res._lng = loc.lng != null ? loc.lng : res.lng

      // ↓ 评价处理：把 reviews 放进 data，并判断是否有我自己的评价
      const reviews = Array.isArray(res.reviews) ? res.reviews : []
      const me = this.data.userId
      const hasMyReview = reviews.some(r => r.customerId === me)
      
      let statusText
      if (res.status === 'checkedIn') {
        statusText = (this.data.role === 'technician') ? '已签到' : '已接单'
      } else {
        statusText = statusMap[res.status] || res.status
      }
      this.setData({
        order: res,
        statusText,
        reviews,
        hasMyReview
      })
    }).catch(() => wx.showToast({ title: '获取工单失败', icon: 'none' }))
  },

  // —— 客户端：去评价 ——（未评价时显示）
  goReview() {
    const id = this.data.order._id
    wx.navigateTo({ url: `/pages/customer/review/review?id=${id}&mode=first` })
  },

  // —— 客户端：追加评价 ——（已评价时显示）
  goAppendReview() {
    const id = this.data.order._id
    wx.navigateTo({ url: `/pages/customer/review/review?id=${id}&mode=append` })
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
    post(`/orders/${orderId}/checkin`, {
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

  // —— 师傅端：标记完成（仅本人&已接单）——
  markCompleted() {
    const id = this.data.order._id
    put(`/orders/${id}/status`, { status: 'done', note: '工单已完成' })
      .then(() => { wx.showToast({ title: '工单已完成' }); this.loadOrder(id) })
      .catch(() => wx.showToast({ title: '操作失败', icon: 'none' }))
  },
  // —— 师傅端：查看用户评价（仅在已完成时展示按钮）——
   goTechViewReview() {
    const { order, role } = this.data
    if (!order || !order._id) return
    if (role !== 'technician') {
      wx.showToast({ title: '仅师傅可查看', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/technician/review/review?id=${order._id}` })
    }
})
