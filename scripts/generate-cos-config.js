const fs = require('node:fs')
const path = require('node:path')
const dotenv = require('dotenv')

const projectRoot = path.resolve(__dirname, '..')
const envPath = path.resolve(projectRoot, '.env')

const result = dotenv.config({ path: envPath })
if (result.error) {
  console.warn('.env 文件不存在或无法解析，未写入 cos.private.json')
}

const parsed = result.parsed || {}
const cosConfig = {
  SecretId: parsed.COS_SECRET_ID || '',
  SecretKey: parsed.COS_SECRET_KEY || '',
  Bucket: parsed.COS_BUCKET || 'repair-bucket-1361223212',
  Region: parsed.COS_REGION || 'ap-beijing'
}

const targetDir = path.resolve(projectRoot, 'config')
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}
const jsonTargetPath = path.resolve(targetDir, 'cos.private.json')
const jsTargetPath = path.resolve(targetDir, 'cos.private.js')
fs.writeFileSync(jsonTargetPath, JSON.stringify(cosConfig, null, 2) + '\n', 'utf8')
fs.writeFileSync(jsTargetPath, `module.exports = ${JSON.stringify(cosConfig, null, 2)};\n`, 'utf8')
console.log('生成了 config/cos.private.{json,js}，确保这两个文件都被 .gitignore 忽略。')
