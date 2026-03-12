const { post, uploadimage } = require('../../../utils/request')
const smartFillConfig = require('./smartFillConfig')

Page({
  data: {
    title: '',     // 设备名称
    desc: '',      // 故障描述
    images: [],    // 先存临时路径
    phone: '',
    address: '',   // 文字地址（手填或选择位置返回的 address）
    location: null,           // { lat, lng }
    locationDesc: '',         // 展示给用户看的地址
    smartText: '',
    smartFillSummary: [],
    smartFillPreviewVisible: false,
    smartFillPreviewItems: [],
    smartFillDraft: null
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onDescInput(e)  { this.setData({ desc: e.detail.value }) },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onAddressInput(e){ this.setData({ address: e.detail.value }) },

  onSmartTextInput(e) {
    this.setData({ smartText: e.detail.value })
  },

  confirmSmartFill() {
    const draft = this.data.smartFillDraft || {}
    const previewItems = this.data.smartFillPreviewItems || []

    this.setData({
      ...draft,
      smartFillSummary: previewItems,
      smartFillPreviewVisible: false,
      smartFillPreviewItems: [],
      smartFillDraft: null
    })

    wx.showToast({ title: '已自动填充', icon: 'success' })
  },

  cancelSmartFill() {
    this.setData({
      smartFillPreviewVisible: false,
      smartFillPreviewItems: [],
      smartFillDraft: null
    })
  },

  chooseImage() {
    wx.chooseImage({
      count: 3, sizeType: ['compressed'],
      success: res => {
        // 选择图片后立即上传到云存储
        this.uploadImagesToCloud(res.tempFilePaths);
      }
    })
  },

  // 新增：上传图片到云存储
  async uploadImagesToCloud(tempFilePaths) {
    wx.showLoading({ title: '上传中...', mask: true });

    try {
      const uploadPromises = tempFilePaths.map(filePath =>
        uploadimage(filePath, null, true) // 使用云存储上传
      );

      const results = await Promise.all(uploadPromises);
      const cloudFileIDs = results.map(r => r.fileID);

      // 更新页面数据，存储云存储的fileID
      this.setData({
        images: [...this.data.images, ...cloudFileIDs]
      });

      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (error) {
      console.error('上传失败:', error);
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 预览大图 - 直接使用COS URL
  previewImage(e) {
    const current = e.currentTarget.dataset.src;
    const urls = this.data.images;

    wx.previewImage({ current, urls });
  },

  // 移除某一张
  removeImage(e) {
    const idx = Number(e.currentTarget.dataset.index)
    if (Number.isNaN(idx)) return
    const arr = this.data.images.slice()
    arr.splice(idx, 1)
    this.setData({ images: arr })
  },

  // 选择地图位置（优先方案）
  chooseLocation() {
    const doChoose = () => {
      wx.chooseLocation({
        success: (loc) => {
          this.setData({
            location: { lat: loc.latitude, lng: loc.longitude },
            locationDesc: loc.address || loc.name || '',
            address: loc.address || loc.name || this.data.address
          })
        },
        fail: () => {
          // 兜底：只拿坐标
          this.getCurrentLocation()
        }
      })
    }

    // 隐私合规模块（如果未开启也不影响）
    wx.getPrivacySetting?.({
      success: (ps) => {
        if (ps.needAuthorization) {
          wx.requirePrivacyAuthorize({
            success: doChoose,
            fail: () => wx.showToast({ title: '未同意隐私协议，无法获取位置', icon: 'none' })
          })
        } else {
          doChoose()
        }
      },
      fail: doChoose
    })
  },

  // 兜底：仅获取当前坐标（无可读地址）
  getCurrentLocation() {
    const run = () => {
      wx.getLocation({
        type: 'gcj02',
        isHighAccuracy: true,
        highAccuracyExpireTime: 5000,
        success: (loc) => {
          this.setData({
            location: { lat: loc.latitude, lng: loc.longitude },
            locationDesc: this.data.locationDesc || '' // 没有可读地址就不覆盖
          })
          wx.showToast({ title: '已获取当前位置', icon: 'none' })
        },
        fail: (e) => {
          console.error('getLocation fail', e)
          wx.showModal({
            title: '无法获取定位',
            content: '请在设置中开启定位权限或手动填写详细地址',
            confirmText: '去设置',
            success: r => { if (r.confirm) wx.openSetting({}) }
          })
        }
      })
    }

    wx.getSetting({
      success: s => {
        if (s.authSetting['scope.userLocation']) return run()
        wx.authorize({
          scope: 'scope.userLocation',
          success: run,
          fail: () => wx.openSetting({})
        })
      }
    })
  },

  submitOrder() {
    const user = wx.getStorageSync('currentUser')
    if (!user) { wx.showToast({ title: '请先登录', icon: 'none' }); return }
    this._doSubmit()
  },

  createSmartFillState(rawText) {
    return {
      next: {},
      summary: [],
      workingText: rawText.replace(/\s+/g, ' ').trim()
    }
  },

  escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  },

  createAlternationPattern(words) {
    return (words || []).map(word => this.escapeRegex(word)).join('|')
  },

  buildSmartFillPatterns() {
   const addressPrefixPattern = this.createAlternationPattern(smartFillConfig.address.prefixes)
   const devicePrefixPattern = this.createAlternationPattern(smartFillConfig.device.prefixes)
   const issuePrefixPattern = this.createAlternationPattern(smartFillConfig.issue.prefixes)
   const addressKeywordPattern = this.createAlternationPattern(smartFillConfig.address.keywords)
    const issueStopPattern = this.createAlternationPattern([
    ...smartFillConfig.issue.prefixes,
    ...smartFillConfig.address.stopKeywords
    ])
   const deviceHintPattern = this.createAlternationPattern(smartFillConfig.device.hintKeywords)
   const issueHintPattern = this.createAlternationPattern(smartFillConfig.issue.hintKeywords)

    return {
    phoneRegex: new RegExp(smartFillConfig.phone.regex),
      addressKeywordRegex: new RegExp(`(?:${addressPrefixPattern})[：:\\s]*([^，。、；\\n]+)`, 'i'),
      deviceKeywordRegex: new RegExp(`(?:${devicePrefixPattern})[：:\\s]*([^，。、；\\n]+)`, 'i'),
      issueKeywordRegex: new RegExp(`(?:${issuePrefixPattern})[：:\\s]*([^\\n]+)`, 'i'),
      genericAddressRegex: new RegExp(`([^，。、；\\n]*?(?:${addressKeywordPattern})[^，。、；\\n]*?)(?=(?:${issueStopPattern}|$))`, 'iu'),
      deviceHintRegex: new RegExp(deviceHintPattern, 'i'),
      issueHintRegex: new RegExp(issueHintPattern, 'i')
    }
  },

  addSmartFillField(state, field, label, value) {
    if (!value || state.next[field]) return
    const normalizedValue = value.trim()
    if (!normalizedValue) return

    state.next[field] = normalizedValue
    state.summary.push({ field, label, value: normalizedValue })
  },

  consumeSmartFillText(state, fragment) {
    if (!fragment) return
    state.workingText = state.workingText
      .replace(fragment, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  },

  trimIssueTail(text) {
    if (!text) return ''
    const normalized = text.replace(/\s+/g, ' ').trim()
    const stopPattern = this.createAlternationPattern(smartFillConfig.address.stopKeywords)
    const splitMatch = normalized.match(new RegExp(`^(.*?)(?=(?:${stopPattern}))`, 'i'))
    return (splitMatch ? splitMatch[1] : normalized).trim()
  },

  normalizeAddress(text) {
    if (!text) return ''
    let normalized = this.trimIssueTail(text)
    const addressEndPattern = this.createAlternationPattern(smartFillConfig.address.endKeywords)
    const numberEndMatch = normalized.match(new RegExp(`^([\\s\\S]*?\\d+(?:${addressEndPattern})(?:[A-Za-z0-9一二三四五六七八九十甲乙丙丁单元室层栋座#\\-]*)?)`, 'u'))
    if (numberEndMatch) {
      normalized = numberEndMatch[1].trim()
    }
    return normalized.replace(/\s+/g, ' ').trim()
  },

  extractPhone(rawText, state, patterns) {
    const phoneMatch = rawText.match(patterns.phoneRegex)
    if (!phoneMatch) return

    this.addSmartFillField(state, 'phone', smartFillConfig.ui.labels.phone, phoneMatch[1] || phoneMatch[0])
    this.consumeSmartFillText(state, phoneMatch[0])
  },

  extractAddress(state, patterns) {
    const addressKeywordMatch = state.workingText.match(patterns.addressKeywordRegex)
    if (addressKeywordMatch) {
      const normalizedAddress = this.normalizeAddress(addressKeywordMatch[1])
      this.addSmartFillField(state, 'address', smartFillConfig.ui.labels.address, normalizedAddress)
      this.consumeSmartFillText(state, addressKeywordMatch[0])
      return
    }

    const genericAddressMatch = state.workingText.match(patterns.genericAddressRegex)
    if (!genericAddressMatch) return

    const normalizedAddress = this.normalizeAddress(genericAddressMatch[1])
    this.addSmartFillField(state, 'address', smartFillConfig.ui.labels.address, normalizedAddress)
    this.consumeSmartFillText(state, normalizedAddress)
  },

  extractDevice(state, patterns) {
    const deviceKeywordMatch = state.workingText.match(patterns.deviceKeywordRegex)
    if (deviceKeywordMatch) {
      this.addSmartFillField(state, 'title', smartFillConfig.ui.labels.title, deviceKeywordMatch[1])
      this.consumeSmartFillText(state, deviceKeywordMatch[0])
      return
    }

    const segments = state.workingText
      .split(/[，。、；;\n\r\s]+/)
      .map(segment => segment.trim())
      .filter(Boolean)

    const deviceSegment = segments.find(segment => patterns.deviceHintRegex.test(segment) && !patterns.issueHintRegex.test(segment))
    if (!deviceSegment) return

    this.addSmartFillField(state, 'title', smartFillConfig.ui.labels.title, deviceSegment)
    this.consumeSmartFillText(state, deviceSegment)
  },

  extractIssue(state, patterns) {
    const issueKeywordMatch = state.workingText.match(patterns.issueKeywordRegex)
    if (issueKeywordMatch) {
      this.addSmartFillField(state, 'desc', smartFillConfig.ui.labels.desc, issueKeywordMatch[1])
      this.consumeSmartFillText(state, issueKeywordMatch[0])
    }

    const remainingText = state.workingText
      .replace(/\s+/g, ' ')
      .trim()

    if (!state.next.desc && remainingText) {
      this.addSmartFillField(state, 'desc', smartFillConfig.ui.labels.desc, remainingText)
    }
  },

  buildSmartFillResult(rawText) {
    const state = this.createSmartFillState(rawText)
    const patterns = this.buildSmartFillPatterns()

    this.extractPhone(rawText, state, patterns)
    this.extractAddress(state, patterns)
    this.extractDevice(state, patterns)
    this.extractIssue(state, patterns)

    return state
  },

  autoFillFromText() {
    const raw = (this.data.smartText || '').trim()
    if (!raw) {
      wx.showToast({ title: '请输入识别内容', icon: 'none' })
      return
    }

    const { next, summary } = this.buildSmartFillResult(raw)

    if (!summary.length) {
      wx.showToast({ title: '未识别到有效信息，请手动填写', icon: 'none' })
      return
    }

    this.setData({
      smartFillPreviewVisible: true,
      smartFillPreviewItems: summary,
      smartFillDraft: next
    })
  },

  _doSubmit() {
    const user = wx.getStorageSync('currentUser')
    if (!user) { wx.showToast({ title: '请先登录', icon: 'none' }); return }

    const { title, desc, phone, address, images, location, locationDesc } = this.data

    // 图片已在选择时上传到云存储，直接使用fileID提交订单
    post('/customer', {
      customer: user.username,
      customerId: user.id || user._id,
      device: title || '',
      issue: desc || '',
      phone: phone || '',
      address: address || '',
      images: images,           // 直接使用云存储的fileID列表
      location: location || null,                 // { lat, lng }
      locationAddress: locationDesc || ''
    }, { loading: true })
      .then(() => {
        wx.showToast({
          title: '工单提交成功', icon: 'success', duration: 1000,
          success: () => setTimeout(() => wx.reLaunch({ url: '/pages/customer/home/home' }), 1000)
        })
      })
      .catch(err => {
        wx.showToast({ title: err?.message || '提交失败', icon: 'none' })
      })
  }
})
