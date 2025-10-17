// utils/request.js
const withAuthHeader = (headers = {}) => {
  const token = wx.getStorageSync('token')
  return token
    ? { ...headers, Authorization: `Bearer ${token}` }
    : headers
}

// 可选：全局 loading（根据需要打开/关闭）
const showLoading = () => wx.showLoading({ title: '加载中', mask: true })
const hideLoading = () => { try { wx.hideLoading() } catch (e) {} }

const request = (url, method = 'GET', data = {}, options = {}) => {
  // options:
  //   header: {}          额外头
  //   auth: true|false    是否自动加 token（默认 true）
  //   loading: true|false 是否显示全局 loading（默认 false）
  const { header = {}, auth = true, loading = true } = options

  const baseUrl = getApp().globalData.API || '' // 例如 "http://115.190.87.111/api"
  const finalHeaders = auth ? withAuthHeader(header) : header

  if (loading) showLoading()

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...finalHeaders
      },
      success: (res) => {
        const { statusCode, data } = res || {}
        if (statusCode >= 200 && statusCode < 300) {
          resolve(data)
        } else if (statusCode === 401) {
          // 未登录或 token 过期：清理、本地跳登录
          wx.removeStorageSync('token')
          wx.removeStorageSync('currentUser')
          wx.showToast({ title: (data && data.message) || '请先登录', icon: 'none' })
          // 这里用 reLaunch 避免返回再次进入无权页
          wx.reLaunch({ url: '/pages/auth/login/login' })
          reject(data || { message: '未授权', statusCode })
        } else {
          reject(data || { message: '请求失败', statusCode })
        }
      },
      fail: (err) => reject(err),
      complete: () => { if (loading) hideLoading() }
    })
  })
}

// 常用方法简化
const get  = (url, data, options) => request(url, 'GET',    data, options)
const post = (url, data, options) => request(url, 'POST',   data, options)
const put  = (url, data, options) => request(url, 'PUT',    data, options)
const del  = (url, data, options) => request(url, 'DELETE', data, options)

module.exports = { request, get, post, put, del }
