App({
  onLaunch: function () {
    // 不再写死本地数据，所有初始化交给后端
    if (!wx.getStorageSync('uid')) {
      const uid = 'uid-' + Math.random().toString(36).slice(2, 10)
      wx.setStorageSync('uid', uid)
    }
  },

  // globalData:{ API: 'https://api.anyixiu1.com/api'},
  globalData:{ API: 'http://115.190.87.111:8080/api'},
  checkLogin: function() {
    const user = wx.getStorageSync('currentUser')
    if (!user) {
      wx.redirectTo({ url: '/pages/auth/login/login' })
      return false
    }
    return true
  }
})
