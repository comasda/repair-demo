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

// 新增：腾讯云COS上传（长期方案）
// 直接上传到腾讯云COS，返回公开可访问的URL
let COS
try {
  COS = require('cos-wx-sdk-v5')
} catch (err) {
  console.warn('COS SDK 未加载，回退到后端上传', err.message || err)
}

const uploadViaHttp = (filePath, onProgress) => {
  const baseUrl = getApp().globalData.API || ''
  const token = wx.getStorageSync('token')
  return new Promise((resolve, reject) => {
    const uploadTask = wx.uploadFile({
      url: `${baseUrl}/upload`,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
        success(res) {
          try {
            const data = JSON.parse(res.data || '{}')
            const mockedUrl = data?.fileID || data?.url
            if (mockedUrl) return resolve({ fileID: mockedUrl, url: mockedUrl })
            reject(data || { message: '上传失败' })
          } catch (e) {
            reject(e)
          }
        },
      fail: reject
    })

    if (onProgress && typeof onProgress === 'function') {
      uploadTask.onProgressUpdate(res => onProgress(res.progress))
    }
  })
}

const uploadToCos = (filePath, type = 'image') => {
  if (!COS) {
    return uploadViaHttp(filePath)
  }

  const app = getApp()
  const cosOptions = (app && app.globalData && app.globalData.cosConfig) || {}
  const secretId = cosOptions.SecretId
  const secretKey = cosOptions.SecretKey

  if (!secretId || !secretKey) {
    console.warn('缺少 COS SecretId/SecretKey，切换到后端上传')
    return uploadViaHttp(filePath)
  }

  return new Promise((resolve, reject) => {
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${filePath.substring(filePath.lastIndexOf('.'))}`
    const cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    })

    let contentType = 'image/jpeg'
    if (type === 'video') {
      contentType = 'video/mp4'
    } else if (filePath.toLowerCase().endsWith('.png')) {
      contentType = 'image/png'
    } else if (filePath.toLowerCase().endsWith('.gif')) {
      contentType = 'image/gif'
    } else if (filePath.toLowerCase().endsWith('.webp')) {
      contentType = 'image/webp'
    } else if (filePath.toLowerCase().endsWith('.mp4')) {
      contentType = 'video/mp4'
    } else if (filePath.toLowerCase().endsWith('.webm')) {
      contentType = 'video/webm'
    } else if (filePath.toLowerCase().endsWith('.mov')) {
      contentType = 'video/quicktime'
    }

    cos.putObject({
      Bucket: cosOptions.Bucket || 'repair-bucket-1361223212',
      Region: cosOptions.Region || 'ap-beijing',
      Key: `${type}/${fileName}`,
      FilePath: filePath,
      Headers: { 'x-cos-acl': 'public-read' },
      ContentType: contentType,
      onProgress: function (progressData) {
        console.log('上传进度:', JSON.stringify(progressData))
      }
    }, function (err, data) {
      if (err) {
        console.error('COS上传失败:', err)
        reject(err)
      } else {
        console.log('COS上传成功:', data)
        const bucket = cosOptions.Bucket || 'repair-bucket-1361223212'
        const region = cosOptions.Region || 'ap-beijing'
        const cosUrl = `https://${bucket}.cos.${region}.myqcloud.com/${type}/${fileName}`
        resolve({ fileID: cosUrl, url: cosUrl })
      }
    })
  })
}

// 修改原有的 uploadimage 函数，支持COS和传统上传
const uploadimage = (filePath, onProgress, useCos = true) => {
  // 优先使用腾讯云COS（长期方案）
  if (useCos) {
    return uploadToCos(filePath, 'image');
  }

  return uploadViaHttp(filePath, onProgress)
};

// 新增：上传媒体文件（支持图片和视频）
const uploadMedia = (filePath, mediaType = 'image', onProgress, useCos = true) => {
  // 优先使用腾讯云COS（长期方案）
  if (useCos) {
    return uploadToCos(filePath, mediaType);
  }

  return uploadViaHttp(filePath, onProgress)
};

// 常用方法简化
const get  = (url, data, options) => request(url, 'GET',    data, options)
const post = (url, data, options) => request(url, 'POST',   data, options)
const put  = (url, data, options) => request(url, 'PUT',    data, options)
const del  = (url, data, options) => request(url, 'DELETE', data, options)

module.exports = { request, get, post, put, del, uploadimage, uploadMedia }
