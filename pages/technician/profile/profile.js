const { get } = require('../../../utils/request')

const roleMap = {
  customer: '客户',
  technician: '师傅',
  admin: '管理员'
}

const registerSourceMap = {
  phone: '手机号注册',
  wechat: '微信注册',
  guest: '访客体验'
}

const reviewStatusMap = {
  pending: '审核中',
  approved: '正常',
  rejected: '审核未通过'
}

function formatTime(value) {
  if (!value) return '暂无记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '暂无记录'
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

Page({
  data: {
    loading: true,
    profile: null,
    basicItems: [],
    statusItems: []
  },

  onShow() {
    this.loadProfile()
  },

  buildView(user) {
    const displayName = user?.profile?.name || user?.idCard?.name || user?.username || '师傅用户'
    const phone = user?.phone || '未绑定'
    const roleText = roleMap[user?.role] || '师傅'
    const registerSource = registerSourceMap[user?.registerSource] || '未知'
    const reviewStatus = reviewStatusMap[user?.reviewStatus] || '正常'
    const wechatLinked = user?.wechat?.openid || user?.registerSource === 'wechat'
    const wechatStatus = wechatLinked ? '已绑定微信' : '未绑定微信'
    const joinedAt = formatTime(user?.createdAt)

    return {
      profile: {
        displayName,
        phone,
        roleText,
        registerSource,
        reviewStatus,
        wechatStatus,
        joinedAt
      },
      basicItems: [
        { label: '显示名称', value: displayName },
        { label: '手机号', value: phone },
        { label: '身份角色', value: roleText }
      ],
      statusItems: [
        { label: '资料状态', value: reviewStatus },
        { label: '注册方式', value: registerSource },
        { label: '微信绑定', value: wechatStatus },
        { label: '加入时间', value: joinedAt }
      ]
    }
  },

  ensureAllowedUser() {
    const user = wx.getStorageSync('currentUser')
    if (!user || user.isGuest) {
      wx.showToast({ title: '请先登录师傅账号', icon: 'none' })
      wx.reLaunch({ url: '/pages/auth/login/login' })
      return null
    }
    if (user.role !== 'technician') {
      wx.showToast({ title: '请使用师傅账号查看', icon: 'none' })
      wx.reLaunch({ url: user.role === 'customer' ? '/pages/customer/home/home' : '/pages/technician/home/home' })
      return null
    }
    return user
  },

  async loadProfile() {
    const user = this.ensureAllowedUser()
    if (!user) return

    const localView = this.buildView(user)
    this.setData({
      loading: true,
      ...localView
    })

    try {
      const userId = user.id || user._id
      const detail = await get(`/users/${userId}`, {}, { loading: true })
      const detailView = this.buildView(detail)
      const nextUser = {
        ...user,
        ...detail,
        profile: {
          ...(user.profile || {}),
          ...(detail.profile || {})
        }
      }
      wx.setStorageSync('currentUser', nextUser)
      this.setData({
        ...detailView,
        loading: false
      })
    } catch (err) {
      wx.showToast({ title: err?.message || '加载资料失败', icon: 'none' })
      this.setData({ loading: false })
    }
  }
})
