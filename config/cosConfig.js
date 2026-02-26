let cosConfig = {}
const loadCosJson = () => {
  try {
    return require('./cos.private.json')
  } catch (err) {
    console.warn('cos.private.json 未找到或解析失败：', err?.message || '')
  }
  return null
}
const loadCosJs = () => {
  try {
    return require('./cos.private.js')
  } catch (err) {
    return null
  }
}

cosConfig = loadCosJs() || loadCosJson() || {}
if (!Object.keys(cosConfig).length) {
  console.warn('cos.private.js/json 均缺失，请运行 npm run generate-cos-config 或手动创建')
}
module.exports = cosConfig
