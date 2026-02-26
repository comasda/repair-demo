// pages/orderDetail/orderDetail.js
const { get, put, post, uploadimage } = require('../../utils/request')

const statusMap = {
  pending: '待接单',
  offered: '待接收',
  assigned: '已接单',
  checkedIn: '已签到',
  awaitingConfirm: '待审核',
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

// ★ 每个类别最多允许多少个文件（图片/视频）
const CHECKIN_SLOT_LIMIT = {
  front:  3,
  circuit: 3,
  qrcode: 3,
  site:   3,
  finish: 3,
};

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

    // ★ 五个分类坑位，每个坑位允许多个图片或视频
    checkinSlots: CHECKIN_SLOTS.map(s => ({
      key: s.key,
      label: s.label,
      tips: s.tips,
      files: []  // [{ filePath, fileType }]
    })),

    // 视频是否处于全屏状态（用于避免拦截返回/暂停）
    videoFullScreen: false,
    uploadProgress: 0,
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
            files: []
          }))
        })
      }
    } catch (e) {
      // ignore
    }
  },

  // —— 师傅端：发起完成（仅在已签到时可用）——
  async requestComplete() {
    const { order, role, userId, checkinSlots } = this.data
    if (!order) return
    if (role !== 'technician') {
      wx.showToast({ title: '仅师傅可发起完成', icon: 'none' }); return
    }
    if (order.status !== 'checkedIn') {
      wx.showToast({ title: '需到场签到后才能发起完成', icon: 'none' }); return
    }

    // 校验 5 个分类坑位都已达到最小数量
    const missingSlot = checkinSlots.find((slot) => {
      const files = slot.files || []
      const limit = CHECKIN_SLOT_LIMIT[slot.key] || 1
      const min = 1  // 也可以单独配一个 CHECKIN_SLOT_MIN
      return files.length < min
    })

    if (missingSlot) {
      wx.showToast({ title: `请先上传：${missingSlot.label}`, icon: 'none' })
      return
    }
    // 把所有文件展开成一个一维数组上传到云存储
    const localFiles = []
    checkinSlots.forEach(slot => {
      (slot.files || []).forEach(f => {
        localFiles.push({
          slotKey: slot.key,
          fileType: f.fileType,
          filePath: f.filePath
        })
      })
    })

    this.setData({ uploadProgress: 0 })

    // 上传到云存储
    wx.showLoading({ title: '上传中...', mask: true })
    try {
      const uploadPromises = localFiles.map((item, index) => {
        // 根据文件类型选择云存储路径
        const type = item.fileType === 'video' ? 'video' : 'image'
        return uploadimage(item.filePath, (progress) => {
          // 更新上传进度
          this.setData({ uploadProgress: Math.round((index + progress / 100) / localFiles.length * 100) })
        }, true) // 使用云存储
      })

      const results = await Promise.all(uploadPromises)
      const fileIDs = results.map(r => r.fileID)

      this.setData({ uploadProgress: 0 })
      wx.hideLoading()

      // 兼容旧字段：一维数组（按上传顺序）
      const checkinImages = fileIDs

      // 新字段：按类别整理
      const checkinMedia = {}
      CHECKIN_SLOTS.forEach(s => { checkinMedia[s.key] = [] })

      fileIDs.forEach((fileID, idx) => {
        const info = localFiles[idx]
        if (!info) return
        if (!checkinMedia[info.slotKey]) {
          checkinMedia[info.slotKey] = []
        }
        checkinMedia[info.slotKey].push({
          url: fileID,  // 云存储fileID
          type: info.fileType || 'image'
        })
      })

      wx.showLoading({ title: '正在提交...', mask: true })
      await post(`/technicians/${order._id}/complete-request`, {
        technicianId: userId,
        checkinImages,
        checkinMedia
      })

      wx.hideLoading()
      wx.showToast({ title: '已发起完成，等待管理员确认' })
      try { wx.removeStorageSync(DRAFT_KEY_PREFIX + order._id) } catch (e) {}
      this.loadOrder(order._id)
    } catch (err) {
      wx.hideLoading()
      this.setData({ uploadProgress: 0 })
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
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

    const slot = slots[index]
    const key = slot.key
    const limit = CHECKIN_SLOT_LIMIT[key] || 1
    const currentCount = (slot.files || []).length
    const canAdd = limit - currentCount

    if (canAdd <= 0) {
      wx.showToast({ title: `「${slot.label}」最多只能上传 ${limit} 个`, icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: canAdd,  // ✅ 一次最多还能选几个
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'], // 优先使用压缩图
      compressed: true, // 视频也开启压缩
      success: (res) => {
        const files = res.tempFiles || []
        if (!files.length) return

        const newSlots = slots.slice()
        const existFiles = newSlots[index].files || []

        const appended = files.map(file => {
          const filePath = file.tempFilePath
          const fileType = file.fileType || (filePath.endsWith('.mp4') ? 'video' : 'image')
          return { filePath, fileType }
        })

        newSlots[index] = {
          ...newSlots[index],
          files: existFiles.concat(appended).slice(0, limit) // 再保险一下截断到上限
        }
        this.setData({ checkinSlots: newSlots })
      }
    })
  },

  // ★ 预览某个分类坑位的图片或视频 - 修改为支持云存储
  previewCheckinSlot(e) {
    const slotIndex = Number(e.currentTarget.dataset.index)
    const fileIndex = Number(e.currentTarget.dataset.fileIndex || 0)
    if (Number.isNaN(slotIndex)) return
    const slot = this.data.checkinSlots[slotIndex]
    if (!slot || !slot.files || !slot.files.length) return

    const file = slot.files[fileIndex]
    if (!file || !file.filePath) return

    // 视频预览交给 <video> 的 previewVideo 事件，这里只处理图片
    if (file.fileType === 'video') {
      return
    }

    // 直接预览图片（现在是COS URL）
    const imageFiles = slot.files.filter(f => f.fileType !== 'video')
    const imageUrls = imageFiles.map(f => f.filePath)

    wx.previewImage({
      current: file.filePath,
      urls: imageUrls
    })
  },

  // ★ 删除某个分类坑位的媒资
  removeCheckinSlot(e) {
    const slotIndex = Number(e.currentTarget.dataset.index)
    const fileIndex = Number(e.currentTarget.dataset.fileIndex || 0)
    if (Number.isNaN(slotIndex)) return
    const slots = this.data.checkinSlots.slice()
    const slot = slots[slotIndex]
    if (!slot || !slot.files || !slot.files.length) return

    const files = slot.files.slice()
    files.splice(fileIndex, 1)  // 删除对应那一张

    slots[slotIndex] = {
      ...slot,
      files
    }
    this.setData({ checkinSlots: slots })
  },

  // ★ 预览视频：点击小窗 → 进入全屏，交给系统控件控制播放/暂停/返回
  previewVideo(e) {
    const { videoFullScreen } = this.data
    const id = e.currentTarget.id
    if (!id) return

    // 如果当前已经是全屏状态，就不要再拦截点击
    if (videoFullScreen) return

    try {
      const ctx = wx.createVideoContext(id, this)
      // 只负责切换到全屏，不自动 play，避免和暂停按钮冲突
      ctx.requestFullScreen({ direction: 0 }) // 0 竖屏，90 横屏
    } catch (err) {
      console.warn('createVideoContext 失败', id, err)
    }
  },

  // ★ 监听视频全屏状态变化（进入/退出）
  onVideoFullScreenChange(e) {
    const full = !!(e.detail && e.detail.fullScreen)
    this.setData({ videoFullScreen: full })
  },
})