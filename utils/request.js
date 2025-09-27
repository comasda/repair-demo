// utils/request.js
const request = (url, method = 'GET', data = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getApp().globalData.API}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(options.header || {})
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(res.data || { message: '请求失败', statusCode: res.statusCode })
        }
      },
      fail: (err) => reject(err)
    })
  })
}

// 常用方法简化
const get = (url, data, options) => request(url, 'GET', data, options)
const post = (url, data, options) => request(url, 'POST', data, options)
const put = (url, data, options) => request(url, 'PUT', data, options)
const del = (url, data, options) => request(url, 'DELETE', data, options)

module.exports = { request, get, post, put, del }
