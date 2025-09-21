// utils/request.js
const BASE_URL = "http://localhost:8080/api"; // ⚠️ 上线要改成你的域名

function request({ url, method = "GET", data = {}, auth = true }) {
  return new Promise((resolve, reject) => {
    const header = { "Content-Type": "application/json" };
    if (auth) {
      const token = wx.getStorageSync("token");
      if (token) header.Authorization = "Bearer " + token;
    }

    wx.request({
      url: BASE_URL + url,
      method,
      data,
      header,
      success: (res) => {
        if (res.statusCode === 401) {
          wx.removeStorageSync("token");
          wx.showToast({ title: "请先登录", icon: "none" });
          wx.reLaunch({ url: "/pages/auth/login/login" });
          reject(res.data);
        } else if (res.statusCode >= 400) {
          wx.showToast({ title: res.data.message || "请求错误", icon: "none" });
          reject(res.data);
        } else {
          resolve(res.data);
        }
      },
      fail: reject,
    });
  });
}

module.exports = { request };
