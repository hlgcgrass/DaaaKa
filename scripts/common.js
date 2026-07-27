// 公共模块：读取配置、获取 access_token、发起微信开放接口请求
const fs = require('fs')
const path = require('path')
const https = require('https')

// 若本地存在 .env.local，则将其中的 WX_APPID / WX_SECRET 载入环境变量
// （.env.local 含密钥，已被 .gitignore 忽略，请勿提交到任何仓库）
try {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    lines.forEach(function (line) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (m) {
        const k = m[1]
        let v = m[2]
        if (v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') v = v.slice(1, -1)
        if (process.env[k] === undefined) process.env[k] = v
      }
    })
  }
} catch (e) {
  // 忽略本地配置读取错误
}

const APPID = process.env.WX_APPID
const SECRET = process.env.WX_SECRET

if (!APPID || !SECRET) {
  console.error('❌ 未找到 WX_APPID / WX_SECRET。请设置环境变量，或在 scripts/.env.local 中配置（参考 .env.example）')
  process.exit(1)
}

// 发起 HTTPS 请求，返回解析后的 JSON
function request(method, apiPath, body) {
  return new Promise(function (resolve, reject) {
    const data = body ? JSON.stringify(body) : null
    const options = {
      hostname: 'api.weixin.qq.com',
      path: apiPath,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    }
    const req = https.request(options, function (res) {
      let buf = ''
      res.on('data', function (c) { buf += c })
      res.on('end', function () {
        try {
          resolve(JSON.parse(buf))
        } catch (e) {
          reject(new Error('解析响应失败: ' + buf))
        }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

// 获取接口调用凭证 access_token
function getAccessToken() {
  return new Promise(function (resolve, reject) {
    const url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' +
      APPID + '&secret=' + SECRET
    https.get(url, function (res) {
      let buf = ''
      res.on('data', function (c) { buf += c })
      res.on('end', function () {
        const r = JSON.parse(buf)
        if (r.errcode) reject(new Error('获取 access_token 失败: ' + JSON.stringify(r)))
        else resolve(r.access_token)
      })
    }).on('error', reject)
  })
}

module.exports = {
  APPID: APPID,
  SECRET: SECRET,
  request: request,
  getAccessToken: getAccessToken
}
