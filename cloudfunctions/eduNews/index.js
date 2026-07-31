// 教育时政 · 每日政策新闻抓取云函数
// 触发器每天 08:00（北京时间）调用一次，抓取并写入云数据库集合 edu_news。
// 前端打开「教育时政」页时也调用本函数：优先返回当天已缓存数据，否则实时抓取。
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const https = require('https')

// 公开教育政策新闻源（云函数侧可访问任意 https，不受小程序端域名白名单限制）
const SOURCES = [
  { name: '新华网·教育', url: 'https://www.news.cn/edu/' },
  { name: '教育部·新闻', url: 'http://www.moe.gov.cn/jyb_xwfb/s5147/' }
]

// 兜底示例（仅在真实抓取全部失败时使用，保证页面不空白）
const FALLBACK = [
  { title: '关于深化教育教学改革全面提高义务教育质量的意见（示例数据）', url: 'https://www.moe.gov.cn', source: '示例' },
  { title: '推进教育数字化，加快建设国家智慧教育平台（示例数据）', url: 'https://www.moe.gov.cn', source: '示例' },
  { title: '加强中小学心理健康教育的指导意见（示例数据）', url: 'https://www.moe.gov.cn', source: '示例' }
]

function fetchText(url) {
  return new Promise(function (resolve) {
    const req = https.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; eduNewsBot/1.0)' }
    }, function (res) {
      if (res.statusCode !== 200) { res.resume(); return resolve('') }
      res.setEncoding('utf8')
      let data = ''
      res.on('data', function (c) { data += c })
      res.on('end', function () { resolve(data) })
    })
    req.on('error', function () { resolve('') })
    req.on('timeout', function () { req.destroy(); resolve('') })
  })
}

function cleanTitle(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
}

// 通用解析：从 HTML 中提取 <a href>标题</a>，过滤非中文/导航类文本
function parseItems(html, sourceUrl) {
  const items = []
  const seen = {}
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{4,60})<\/a>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    let href = m[1]
    const title = cleanTitle(m[2])
    if (!title || !/[一-龥]/.test(title)) continue
    if (/登录|注册|首页|更多|版权|关于我们|客户端|微信|微博|邮箱|网站地图|无障碍/.test(title)) continue
    if (href.indexOf('//') === 0) href = 'https:' + href
    else if (href.charAt(0) === '/') {
      try { const u = new URL(sourceUrl); href = u.origin + href } catch (e) { href = sourceUrl }
    } else if (!/^https?:\/\//.test(href)) continue
    if (seen[title]) continue
    seen[title] = 1
    items.push({ title: title, url: href, source: '教育部/新华网' })
    if (items.length >= 12) break
  }
  return items
}

async function grab() {
  for (let i = 0; i < SOURCES.length; i++) {
    const s = SOURCES[i]
    const html = await fetchText(s.url)
    if (!html) continue
    const items = parseItems(html, s.url)
    if (items.length >= 5) return items
  }
  return []
}

function todayStr() {
  const d = new Date()
  const p = function (n) { return (n < 10 ? '0' : '') + n }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

exports.main = async function (event) {
  const today = todayStr()
  let items = []
  let source = 'fallback'

  try {
    const coll = db.collection('edu_news')
    const rec = await coll.doc('latest').get().catch(function () { return null })
    if (rec && rec.data && rec.data.date === today && rec.data.items && rec.data.items.length) {
      return { date: today, items: rec.data.items, source: rec.data.source, cached: true }
    }
    items = await grab()
    if (items.length) {
      source = 'real'
      await coll.doc('latest').set({ data: { date: today, items: items, source: source, updatedAt: Date.now() } }).catch(function () {})
    }
  } catch (e) {
    // 数据库暂不可用（如未开通云数据库）时，退化为实时抓取
    if (!items.length) items = await grab()
    if (items.length) source = 'real'
  }

  if (!items.length) { items = FALLBACK; source = 'fallback' }
  return { date: today, items: items, source: source, cached: false }
}
