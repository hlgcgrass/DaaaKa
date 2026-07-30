// 记账数据层 —— 本地存储，简单收支记录
var STORAGE_KEY = 'atomic_accounts_v1'

var CATEGORIES = [
  { id: 'food', name: '餐饮', icon: '🍜', color: '#FF6B6B' },
  { id: 'transport', name: '交通', icon: '🚇', color: '#4ECDC4' },
  { id: 'shopping', name: '购物', icon: '🛒', color: '#A29BFE' },
  { id: 'fun', name: '娱乐', icon: '🎮', color: '#FDCB6E' },
  { id: 'home', name: '居家', icon: '🏠', color: '#74B9FF' },
  { id: 'medical', name: '医疗', icon: '💊', color: '#FF9AA2' },
  { id: 'other', name: '其他', icon: '📦', color: '#B5EAD7' }
]

function load() {
  try { return wx.getStorageSync(STORAGE_KEY) || { records: [] } }
  catch (e) { return { records: [] } }
}

function save(d) { wx.setStorageSync(STORAGE_KEY, d) }

function getAccounts() { return load().records || [] }

function addAccount(opts) {
  var d = load()
  var rec = {
    id: 'a_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    amount: parseFloat(opts.amount) || 0,
    categoryId: opts.categoryId || 'other',
    note: (opts.note || '').trim(),
    date: opts.date || todayStr(),
    createdAt: Date.now()
  }
  if (rec.amount <= 0) return { ok: false, reason: 'amount' }
  d.records.push(rec)
  save(d)
  return { ok: true, record: rec }
}

function removeAccount(id) {
  var d = load()
  d.records = (d.records || []).filter(function (r) { return r.id !== id })
  save(d)
}

// 按月筛选
function getByMonth(year, month) {
  var prefix = year + '-' + (month < 10 ? '0' : '') + month
  return getAccounts().filter(function (r) { return r.date.indexOf(prefix) === 0 })
}

// 月度汇总
function sumByMonth(year, month) {
  var list = getByMonth(year, month)
  var total = 0
  var byCat = {}
  for (var i = 0; i < list.length; i++) {
    total += list[i].amount
    var cid = list[i].categoryId
    byCat[cid] = (byCat[cid] || 0) + list[i].amount
  }
  return { total: total, count: list.length, byCategory: byCat }
}

function todayStr() {
  var d = new Date()
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}
function pad(n) { return String(n).padStart(2, '0') }

module.exports = {
  CATEGORIES: CATEGORIES,
  getAccounts: getAccounts,
  addAccount: addAccount,
  removeAccount: removeAccount,
  getByMonth: getByMonth,
  sumByMonth: sumByMonth,
  todayStr: todayStr
}
