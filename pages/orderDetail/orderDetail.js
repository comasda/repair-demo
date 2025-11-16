// pages/orderDetail/orderDetail.js
const { get, put, post, uploadimage } = require('../../utils/request')

const statusMap = {
  pending: '待接单',
  offered: '待接收',
  assigned: '已接单',
  checkedIn: '已签到',
  awaitingConfirm: '待完成审核',
  done: '已完成',
  cancelled: '已取消'
}
const CHECKIN_RADIUS_M = 200  // 你可以改为 300/500

// ★ 五个分类坑位的配置
const CHECKIN_SLOTS = [
  { key: 'front',   label: '设备正面图片', tips: '请上传设备正面整体照片' },
  { key: 'circuit', label: '电路图',       tips: '请上传电路图' },
  { key: 'qrcode',  label: '二维码',       tips: '请二维码照片' },
  { key: 'site',    label: '维修点图片',   tips: '请上传维修现场照片' },
  { key: 'finish',  label: '维修完成图片', tips: '请上传维修完成后的照片' }
]

const DRAFT_KEY_PREFIX = 'checkinDraft:'

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

    // ★ 五个分类坑位，每个坑位允许 1 个图片或视频
    checkinSlots: CHECKIN_SLOTS.map(s => ({
      key: s.key,
      label: s.label,
      tips: s.tips,
      filePath: '',   // 本地临时路径（图片或视频）
      fileType: '',   // image | video
      uploadedUrl: '' // 预留：如果后面要做断点续传可以用
    }))
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

      const reviews = Array.isArray(res.reviews) ? res.reviews : []
      const me = this.data.userId
      const hasMyReview = reviews.some(r => r.customerId === me)

      const statusText = statusMap[res.status] || res.status

      this.setData({
        order: res,
        statusText,
        reviews,
        hasMyReview
      })

      // ★ 读取本地暂存的签到媒资
      this._loadCheckinDraft(res._id || res.id)
    }).catch(() => wx.showToast({ title: '获取工单失败', icon: 'none' }))
  },

  // 预览报修图片（客户上传的）
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
        'review:refresh': () => this.loadOrder(id)
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
            this._postCheckin(order._id, lat, lng)
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
    }).then(() => {
      wx.showToast({ title: '签到成功' })
      this.loadOrder(orderId)
    }).catch(err => {
      wx.showToast({ title: err.message || '签到失败', icon: 'none' })
    })
  },

  // ★ 暂存到本地（不发起完成）
  saveCheckinDraft() {
    const { order, checkinSlots } = this.data
    if (!order || !order._id) {
      wx.showToast({ title: '订单信息缺失', icon: 'none' })
      return
    }
    try {
      wx.setStorageSync(DRAFT_KEY_PREFIX + order._id, checkinSlots)
      wx.showToast({ title: '已暂存，不会发起完成', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: '暂存失败', icon: 'none' })
    }
  },

  // 读取本地暂存
  _loadCheckinDraft(orderId) {
    if (!orderId) return
    try {
      const draft = wx.getStorageSync(DRAFT_KEY_PREFIX + orderId)
      if (Array.isArray(draft) && draft.length === CHECKIN_SLOTS.length) {
        this.setData({ checkinSlots: draft })
      } else {
        // 重置成默认空
        this.setData({
          checkinSlots: CHECKIN_SLOTS.map(s => ({
            key: s.key,
            label: s.label,
            tips: s.tips,
            filePath: '',
            fileType: '',
            uploadedUrl: ''
          }))
        })
      }
    } catch (e) {
      // ignore
    }
  },

  // —— 师傅端：发起完成（仅在已签到时可用）——
  requestComplete() {
    const { order, role, userId, checkinSlots } = this.data
    if (!order) return
    if (role !== 'technician') {
      wx.showToast({ title: '仅师傅可发起完成', icon: 'none' }); return
    }
    if (order.status !== 'checkedIn') {
      wx.showToast({ title: '需到场签到后才能发起完成', icon: 'none' }); return
    }

    // ★ 校验 5 个分类坑位都已上传
    const missingIndex = checkinSlots.findIndex(s => !s.filePath)
    if (missingIndex !== -1) {
      const slot = CHECKIN_SLOTS[missingIndex]
      wx.showToast({ title: `请先上传：${slot.label}`, icon: 'none' })
      return
    }

    const localPaths = checkinSlots.map(s => s.filePath)

    wx.showLoading({ title: '正在上传...', mask: true })
    const uploadTasks = localPaths.map(p => uploadimage(p))

    Promise.all(uploadTasks)
      .then(urls => {
        wx.hideLoading()
        // ★ 兼容后端：仍然传 checkinImages（数组），保持顺序
        const checkinImages = urls

        // ★ 额外带一份带分类的信息（后端现在即使忽略也没关系）
        const checkinMedia = {}
        urls.forEach((url, idx) => {
          const slotMeta = CHECKIN_SLOTS[idx]
          const slot = checkinSlots[idx]
          checkinMedia[slotMeta.key] = {
            url,
            type: slot.fileType || 'image'
          }
        })

        return post(`/technicians/${order._id}/complete-request`, {
          technicianId: userId,
          checkinImages,
          checkinMedia   // 后端改造时可用
        })
      })
      .then(() => {
        wx.showToast({ title: '已发起完成，等待管理员确认' })
        // 发起完成后，可以清理本地暂存
        try { wx.removeStorageSync(DRAFT_KEY_PREFIX + order._id) } catch (e) {}
        this.loadOrder(order._id)
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({ title: err.message || '操作失败', icon: 'none' })
      })
  },

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
    if (order.status !== 'done') {
      wx.showToast({ title: '仅已完成的订单可查看评价', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/technician/review/review?id=${order._id}` })
  },

  // ★ 选择某个分类坑位的图片/视频
  chooseCheckinMedia(e) {
    const index = Number(e.currentTarget.dataset.index)
    if (Number.isNaN(index)) return
    const slots = this.data.checkinSlots
    if (!slots || !slots[index]) return

    wx.chooseMedia({
      count: 1,
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        const filePath = file.tempFilePath
        const fileType = file.fileType || (filePath.endsWith('.mp4') ? 'video' : 'image')

        const newSlots = slots.slice()
        newSlots[index] = {
          ...newSlots[index],
          filePath,
          fileType
        }
        this.setData({ checkinSlots: newSlots })
      }
    })
  },

  // ★ 预览某个分类坑位的图片或视频
  previewCheckinSlot(e) {
    const index = Number(e.currentTarget.dataset.index)
    if (Number.isNaN(index)) return
    const slot = this.data.checkinSlots[index]
    if (!slot || !slot.filePath) return

    if (slot.fileType === 'video') {
      // 简单做法：用内置的视频预览
      wx.previewMedia({
        sources: [{
          url: slot.filePath,
          type: 'video'
        }]
      })
    } else {
      wx.previewImage({
        current: slot.filePath,
        urls: [slot.filePath]
      })
    }
  },

  // ★ 删除某个分类坑位的媒资
  removeCheckinSlot(e) {
    const index = Number(e.currentTarget.dataset.index)
    if (Number.isNaN(index)) return
    const slots = this.data.checkinSlots.slice()
    if (!slots[index]) return
    slots[index] = {
      ...slots[index],
      filePath: '',
      fileType: '',
      uploadedUrl: ''
    }
    this.setData({ checkinSlots: slots })
  }
})
