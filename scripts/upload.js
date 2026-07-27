// 上传代码到微信后台（开发版）
// 依赖：miniprogram-ci
// 前置：把从微信公众平台下载的「上传代码密钥」放到 ../keys/upload.key
// 用法：WX_APPID=wxXXXX VERSION=1.0.0 DESC="自动化上传" node upload.js
const path = require('path')
const ci = require('miniprogram-ci')
const { APPID } = require('./common')

const projectPath = path.join(__dirname, '..')
const privateKeyPath = path.join(__dirname, '..', 'keys', 'upload.key')

const project = new ci.Project({
  appid: APPID,
  type: 'miniProgram',
  projectPath: projectPath,
  privateKeyPath: privateKeyPath,
  ignores: [
    'scripts/**',
    'node_modules/**',
    'keys/**',
    'README.md',
    '.gitignore',
    'package-lock.json'
  ]
})

const version = process.env.VERSION || '1.0.0'
const desc = process.env.DESC || '自动化上传'

console.log('开始上传到微信后台，AppID=' + APPID + '，版本=' + version)

ci.upload({
  project: project,
  version: version,
  desc: desc,
  onProgressUpdate: function (info) {
    console.log('[进度]', info)
  }
}).then(function (result) {
  console.log('✅ 上传成功（已生成开发版）')
  console.log(JSON.stringify(result, null, 2))
  console.log('下一步：运行 `node submit-audit.js` 提交审核')
}).catch(function (err) {
  console.error('❌ 上传失败：', err)
  process.exit(1)
})
