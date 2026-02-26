const cosConfig = require('./config/cosConfig')

App({
  onLaunch: function () {
    // 不再写死本地数据，所有初始化交给后端
    if (!wx.getStorageSync('uid')) {
      const uid = 'uid-' + Math.random().toString(36).slice(2, 10)
      wx.setStorageSync('uid', uid)
    }

    // 建立 WebSocket 连接
    this.connectWebSocket();
  },

  connectWebSocket: function() {
    const that = this;
    // WebSocket URL 需要使用 ws:// 或 wss:// 协议
    const wsUrl = 'wss://www.lihewasher.com'; // 直接使用 wss 协议
    wx.connectSocket({
      url: wsUrl,
      success: function() {
        console.log('WebSocket 连接成功');
      },
      fail: function(err) {
        console.error('WebSocket 连接失败:', err);
      }
    });

    // 监听连接打开
    wx.onSocketOpen(function() {
      console.log('WebSocket 连接已打开');
      // 如果用户已登录，立即注册用户ID
      const user = wx.getStorageSync('currentUser');
      if (user && user.id) {
        that.registerUser(user.id);
      }
    });

    // 监听消息
    wx.onSocketMessage(function(res) {
      try {
        const data = JSON.parse(res.data);
        console.log('收到 WebSocket 消息:', data);
        // 后端直接发送通知对象，event 字段是 'new_order'
        if (data.orderId && data.device) { // 检查是否是新订单通知
          wx.showModal({
            title: '新订单提醒',
            content: `设备: ${data.device}\n问题: ${data.issue}\n客户: ${data.customer}`,
            showCancel: false,
            confirmText: '知道了'
          });
        }
      } catch (e) {
        console.error('解析 WebSocket 消息失败:', e);
      }
    });

    // 监听连接关闭
    wx.onSocketClose(function() {
      console.log('WebSocket 连接已关闭');
      // 可以在这里实现重连逻辑
    });

    // 监听连接错误
    wx.onSocketError(function(err) {
      console.error('WebSocket 连接错误:', err);
    });
  },

  registerUser: function(userId) {
    wx.sendSocketMessage({
      data: JSON.stringify({
        event: 'register',
        userId: userId
      }),
      success: function() {
        console.log('用户注册成功:', userId);
      },
      fail: function(err) {
        console.error('用户注册失败:', err);
      }
    });
  },

  // globalData:{ API: 'https://api.anyixiu1.com/api'},
  // globalData:{ API: 'http://115.190.87.111:8080/api'},
  globalData:{
    API: 'https://www.lihewasher.com/api',
    cosConfig
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
