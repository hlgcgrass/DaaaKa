// 习惯打卡数据层 —— 参考《原子习惯》：身份认同、习惯堆叠、不打破链条、可视化追踪
const STORAGE_KEY = 'atomic_habits_v1'
const MAX_HABITS = 30

// ===== 分类系统：左侧侧边栏导航 =====
// 每个分类包含 id/name/icon/color；特殊 type='tool' 的项（记账/便签）不是习惯分组，而是功能入口
const CATEGORIES = [
  { id: 'fitness', name: '增肌运动', icon: '💪', color: '#FF6B6B', type: 'group' },
  { id: 'health',  name: '健健康康', icon: '❤️', color: '#4ECDC4', type: 'group' },
  { id: 'growth',  name: '自我提升', icon: '📚', color: '#A29BFE', type: 'group' },
  { id: 'account', name: '记账',   icon: '📝', color: '#FDCB6E', type: 'tool' },
  { id: 'notes',   name: '便签',   icon: '📌', color: '#74B9FF', type: 'tool' }
]

// 图标：清新可爱卡通 PNG，存放于 assets/icons/
// h21~h34 用户定制事项（排最前）；h01~h20 通用；h35~h50 扩展通用
const ICONS = [
  '/assets/icons/h21.png', // 练背
  '/assets/icons/h22.png', // 哑铃
  '/assets/icons/h23.png', // 练核心
  '/assets/icons/h24.png', // 垫脚尖
  '/assets/icons/h25.png', // 腹式呼吸
  '/assets/icons/h26.png', // 练臀腿
  '/assets/icons/h27.png', // 头皮按摩
  '/assets/icons/h28.png', // 穴位按摩
  '/assets/icons/h29.png', // 喝水
  '/assets/icons/h30.png', // 吃钙片
  '/assets/icons/h31.png', // 吃vd
  '/assets/icons/h32.png', // 阅读
  '/assets/icons/h33.png', // 备课
  '/assets/icons/h34.png', // 听课
  '/assets/icons/h01.png', // 跑步
  '/assets/icons/h02.png', // 健身
  '/assets/icons/h03.png', // 瑜伽
  '/assets/icons/h04.png', // 骑行
  '/assets/icons/h05.png', // 阅读
  '/assets/icons/h06.png', // 写作
  '/assets/icons/h07.png', // 画画
  '/assets/icons/h08.png', // 练琴
  '/assets/icons/h09.png', // 喝水
  '/assets/icons/h10.png', // 饮食
  '/assets/icons/h11.png', // 早睡
  '/assets/icons/h12.png', // 早起
  '/assets/icons/h13.png', // 服药
  '/assets/icons/h14.png', // 打扫
  '/assets/icons/h15.png', // 记账
  '/assets/icons/h16.png', // 复盘
  '/assets/icons/h17.png', // 戒手机
  '/assets/icons/h18.png', // 戒烟
  '/assets/icons/h19.png', // 目标
  '/assets/icons/h20.png', // 成长
  '/assets/icons/h35.png', // 冥想
  '/assets/icons/h36.png', // 拉伸
  '/assets/icons/h37.png', // 散步
  '/assets/icons/h38.png', // 早睡(新版)
  '/assets/icons/h39.png', // 早起(新版)
  '/assets/icons/h40.png', // 写日记
  '/assets/icons/h41.png', // 护肤
  '/assets/icons/h42.png', // 做饭
  '/assets/icons/h43.png', // 整理房间
  '/assets/icons/h44.png', // 听播客
  '/assets/icons/h45.png', // 学英语
  '/assets/icons/h46.png', // 游泳
  '/assets/icons/h47.png', // 跳绳
  '/assets/icons/h48.png', // 看书
  '/assets/icons/h49.png', // 运动
  '/assets/icons/h50.png'  // 洗澡
]

// 习惯名 -> 图标路径（添加习惯时自动预选对应图标）
const ICON_BY_NAME = {
  '练背': '/assets/icons/h21.png',
  '哑铃': '/assets/icons/h22.png',
  '练核心': '/assets/icons/h23.png',
  '垫脚尖': '/assets/icons/h24.png',
  '腹式呼吸': '/assets/icons/h25.png',
  '练臀腿': '/assets/icons/h26.png',
  '头皮按摩': '/assets/icons/h27.png',
  '穴位按摩': '/assets/icons/h28.png',
  '喝水': '/assets/icons/h29.png',
  '吃钙片': '/assets/icons/h30.png',
  '吃vd': '/assets/icons/h31.png',
  '阅读': '/assets/icons/h32.png',
  '备课': '/assets/icons/h33.png',
  '听课': '/assets/icons/h34.png',
  '冥想': '/assets/icons/h35.png',
  '拉伸': '/assets/icons/h36.png',
  '散步': '/assets/icons/h37.png',
  '早睡': '/assets/icons/h38.png',
  '早起': '/assets/icons/h39.png',
  '写日记': '/assets/icons/h40.png',
  '护肤': '/assets/icons/h41.png',
  '做饭': '/assets/icons/h42.png',
  '整理': '/assets/icons/h43.png',
  '听播客': '/assets/icons/h44.png',
  '学英语': '/assets/icons/h45.png',
  '游泳': '/assets/icons/h46.png',
  '跳绳': '/assets/icons/h47.png',
  '看书': '/assets/icons/h48.png',
  '运动': '/assets/icons/h49.png',
  '洗澡': '/assets/icons/h50.png'
}
const COLORS = ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#FAE3B5', '#B5EAD7', '#C7CEEA', '#A8E6CF', '#FFAAA5', '#FFD3B6', '#C8E6FF']
// 兼容旧字段名（部分代码仍引用 EMOJIS）
const EMOJIS = ICONS

function pad(n) { return String(n).padStart(2, '0') }

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

function diffDays(a, b) {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((new Date(ay, am - 1, ad) - new Date(by, bm - 1, bd)) / 86400000)
}

function load() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || { identity: '', habits: [] }
  } catch (e) {
    return { identity: '', habits: [] }
  }
}

function save(data) {
  wx.setStorageSync(STORAGE_KEY, data)
}

function getIdentity() { return load().identity || '' }
function setIdentity(text) { const d = load(); d.identity = (text || '').trim(); save(d) }

// 用户头像（圆形）：来源为微信头像或相册上传
const AVATAR_KEY = 'atomic_habits_avatar'
function getAvatar() { try { return wx.getStorageSync(AVATAR_KEY) || '' } catch (e) { return '' } }
function setAvatar(p) { try { wx.setStorageSync(AVATAR_KEY, p || '') } catch (e) {} }

function getHabits() { return load().habits || [] }

function addHabit(opts) {
  const d = load()
  if (d.habits.length >= MAX_HABITS) return { ok: false, reason: 'limit' }
  const habit = {
    id: 'h_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: (opts.name || '').trim(),
    emoji: opts.emoji || EMOJIS[0],
    color: opts.color || COLORS[0],
    cue: (opts.cue || '').trim(), // 情境 / 地点
    time: (opts.time || '').trim(), // 时间
    category: opts.category || 'fitness', // 所属分类（默认增肌运动）
    createdAt: todayStr(),
    timerMin: opts.timerMin || 0, // 计时打卡时长（分钟），0 = 不用计时
    timerStart: 0, // 计时开始的时间戳（ms），0 = 未在计时
    timerDate: '', // 计时开始的日期（todayStr），用于跨天失效判断
    records: {}
  }
  if (!habit.name) return { ok: false, reason: 'empty' }
  d.habits.push(habit)
  save(d)
  return { ok: true, habit: habit }
}

function removeHabit(id) {
  const d = load()
  d.habits = d.habits.filter(h => h.id !== id)
  save(d)
}

function updateHabit(id, patch) {
  const d = load()
  const h = d.habits.find(x => x.id === id)
  if (h) { Object.assign(h, patch); save(d) }
}

function toggleToday(id) {
  const d = load()
  const h = d.habits.find(x => x.id === id)
  if (!h) return
  const t = todayStr()
  if (h.records[t]) delete h.records[t]
  else h.records[t] = true
  save(d)
}

function isDoneToday(id) {
  const h = getHabits().find(x => x.id === id)
  return !!(h && h.records[todayStr()])
}

// 计时打卡：时间到自动完成。写入今日记录并清除计时状态
function completeTimer(id) {
  const d = load()
  const h = d.habits.find(x => x.id === id)
  if (!h) return
  const t = todayStr()
  if (!h.records[t]) h.records[t] = true
  h.timerStart = 0
  h.timerDate = ''
  save(d)
}

// 当前连击：今天未完成时从昨天起算（今天尚未结束，不视为中断）
function calcStreak(records) {
  const t = todayStr()
  let cursor = records[t] ? t : addDays(t, -1)
  let s = 0
  while (records[cursor]) { s++; cursor = addDays(cursor, -1) }
  return s
}

// 最长连击
function calcBest(records) {
  const dates = Object.keys(records).filter(k => records[k]).sort()
  if (!dates.length) return 0
  let best = 1, run = 1
  for (let i = 1; i < dates.length; i++) {
    if (diffDays(dates[i], dates[i - 1]) === 1) { run++; if (run > best) best = run }
    else run = 1
  }
  return best
}

// 最近 n 天圆点：从左到右按连续天数排列，第 1 个圆点 = 习惯创建日
// 起点取「习惯创建日」与「今天往前 n-1 天」中较晚者：
//   - 习惯较新（不足 n 天）：从创建日开始，昨天打卡→第 1 个实心，今天→第 2 个；
//   - 习惯较老：取最近 n 天（含今天），最旧在左、今天在最右。
function recentDays(id, n) {
  const h = getHabits().find(x => x.id === id)
  const rec = h ? h.records : {}
  const t = todayStr()
  const created = h ? h.createdAt : t
  let start = addDays(t, -(n - 1))
  if (created > start) start = created
  const arr = []
  for (let i = 0; i < n; i++) {
    const ds = addDays(start, i)
    arr.push({ date: ds, done: !!rec[ds], isFuture: ds > t })
  }
  return arr
}

// 今日总进度
function todayProgress() {
  const list = getHabits()
  const total = list.length
  const done = list.filter(h => h.records[todayStr()]).length
  return { done, total }
}

// 某月的每日打卡总览（以「当天已存在」的习惯为分母）
// 全部完成=full 部分=part 完全没做=miss 未来/无习惯=none
function monthStatus(year, month0) {
  const habits = getHabits()
  const first = new Date(year, month0, 1)
  const startDow = first.getDay() // 0=周日
  const daysInMonth = new Date(year, month0 + 1, 0).getDate()
  const today = todayStr()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push({ empty: true })
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${pad(month0 + 1)}-${pad(d)}`
    const existed = habits.filter(h => h.createdAt <= key)
    const total = existed.length
    const done = existed.filter(h => h.records[key]).length
    let status = 'none'
    if (key > today) status = 'future'
    else if (total === 0) status = 'none'
    else if (done === total) status = 'full'
    else if (done === 0) status = 'miss'
    else status = 'part'
    cells.push({ empty: false, day: d, key: key, status: status, total: total, done: done, isToday: key === today })
  }
  return cells
}

// 最近 weeks 周的打卡热力图（列=周，行=周日..周六，最新一周在左）
// 设计为整屏可见、无需横向滚动；最左列含今天，today 高亮，避免「要滑动才看得到今天」
function trailingGrid(records, color, weeks) {
  weeks = weeks || 24
  const today = todayStr()
  const [yy, mm, dd] = today.split('-').map(Number)
  const tDow = new Date(yy, mm - 1, dd).getDay() // 0=周日
  const grid = []
  for (let c = 0; c < weeks; c++) grid.push(new Array(7).fill(null))
  const total = weeks * 7
  for (let i = 0; i < total; i++) {
    const ds = addDays(today, -i)
    const col = Math.floor(i / 7)
    const row = (tDow - (i % 7) + 7) % 7
    const done = !!records[ds]
    grid[col][row] = { done: done, bg: done ? color : '', isToday: i === 0, ds: ds }
  }
  return grid
}

// ===== 习惯轨迹：《原子习惯》"不要打断链条" =====

// 打卡链条：从今天往回追溯连续/近期的打卡记录，返回链条数组
// 每个节点 = {date, done, isToday, isFuture}
// 链条设计灵感来自 Jerry Seinfeld 的生产力秘诀（被《原子习惯》推崇）：
//   在日历上每天画一个大 X，唯一的目标就是"不要让链条断掉"
function habitChain(records, maxDays) {
  maxDays = maxDays || 14
  const today = todayStr()
  const chain = []
  for (let i = 0; i < maxDays; i++) {
    const ds = addDays(today, -i)
    chain.push({
      date: ds,
      done: !!records[ds],
      isToday: i === 0,
      isFuture: ds > today
    })
  }
  return chain // 索引0=今天，往右=过去
}

// 根据当前状态生成《原子习惯》风格的激励语
function chainMessage(streak, total, habitName) {
  if (total === 0) return { text: '开始打卡，建立你的第一条链条', sub: '每一次打卡都在重塑身份' }
  if (streak >= 30) return { text: `连续 ${streak} 天！这个习惯已成为你的一部分`, sub: '《原子习惯》：习惯一旦养成，就会自动运转' }
  if (streak >= 7) return { text: `已坚持 ${streak} 天，势头很好！`, sub: '保持链条不断，让习惯自然生长' }
  if (streak >= 3) return { text: `${streak} 天连续打卡，习惯正在形成`, sub: '前三天最难，你已经跨过了最大障碍' }
  if (streak === 1) return { text: '今天已完成，继续保持！', sub: '明天记得回来，不要打断链条' }
  if (streak === 0) return { text: '昨天断了，今天重新接上', sub: '错过一次没关系，关键是别连续错过两次' }
  return { text: `累计 ${total} 天，继续加油`, sub: '1%的进步，每天都在变好' }
}

// 里程碑成就（基于连续天数和累计天数）
function milestones(records) {
  const dates = Object.keys(records).filter(k => records[k]).sort()
  const totalDone = dates.length
  const streak = calcStreak(records)
  const best = calcBest(records)
  const achieved = []
  if (totalDone >= 1) achieved.push({ icon: '🌱', name: '首次打卡', desc: '迈出第一步' })
  if (streak >= 3 || best >= 3) achieved.push({ icon: '🔥', name: '3天连续', desc: '习惯正在形成' })
  if (streak >= 7 || best >= 7) achieved.push({ icon: '⚡', name: '7天连续', desc: '你已经坚持一周！' })
  if (streak >= 14 || best >= 14) achieved.push({ icon: '💪', name: '14天连续', desc: '两周不间断' })
  if (streak >= 30 || best >= 30) achieved.push({ icon: '🏆', name: '30天连续', desc: '习惯已成自然' })
  if (totalDone >= 10) achieved.push({ icon: '📅', name: '累计10天', desc: '积少成多' })
  if (totalDone >= 30) achieved.push({ icon: '⭐', name: '累计30天', desc: '一个月的坚持' })
  if (totalDone >= 60) achieved.push({ icon: '🎖️', name: '累计60天', desc: '两个月的不懈努力' })
  if (totalDone >= 100) achieved.push({ icon: '💎', name: '累计100天', desc: '百日达人！' })
  return achieved
}

// ===== 分类查询 =====
function getCategories() { return CATEGORIES }

function getHabitsByCategory(catId) {
  return getHabits().filter(h => h.category === catId)
}

// 某分类今日进度
function categoryTodayProgress(catId) {
  const list = getHabitsByCategory(catId)
  const total = list.length
  const done = list.filter(h => h.records[todayStr()]).length
  return { done, total }
}

module.exports = {
  MAX_HABITS, EMOJIS, COLORS, ICON_BY_NAME,
  CATEGORIES, getCategories, getHabitsByCategory, categoryTodayProgress,
  todayStr, addDays, diffDays,
  getIdentity, setIdentity, getAvatar, setAvatar,
  getHabits, addHabit, removeHabit, updateHabit,
  toggleToday, isDoneToday, completeTimer,
  calcStreak, calcBest, recentDays, todayProgress, monthStatus, trailingGrid,
  habitChain, chainMessage, milestones
}
