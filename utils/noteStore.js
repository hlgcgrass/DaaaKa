// 便签数据层 —— 本地存储，支持置顶/颜色/完成状态
var STORAGE_KEY = 'atomic_notes_v1'

// 便签颜色选项
var NOTE_COLORS = [
  { id: 'yellow', hex: '#FFF9C4', name: '浅黄' },
  { id: 'green',  hex: '#C8E6C9', name: '浅绿' },
  { id: 'blue',   hex: '#BBDEFB', name: '浅蓝' },
  { id: 'pink',   hex: '#F8BBD9', name: '浅粉' },
  { id: 'orange', hex: '#FFE0B2', name: '浅橙' },
  { id: 'purple', hex: '#E1BEE7', name: '浅紫' }
]

function load() {
  try { return wx.getStorageSync(STORAGE_KEY) || { notes: [] } }
  catch (e) { return { notes: [] } }
}

function save(d) { wx.setStorageSync(STORAGE_KEY, d) }

function getNotes() {
  var list = load().notes || []
  // 置顶排最前，然后按创建时间倒序
  list.sort(function (a, b) {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return (b.createdAt || 0) - (a.createdAt || 0)
  })
  return list
}

function addNote(opts) {
  var d = load()
  var text = (opts.text || '').trim()
  if (!text) return { ok: false, reason: 'empty' }
  if (d.notes.length >= 100) return { ok: false, reason: 'limit' }
  var note = {
    id: 'n_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    text: text,
    colorId: opts.colorId || 'yellow',
    pinned: false,
    done: false,
    createdAt: Date.now()
  }
  d.notes.push(note)
  save(d)
  return { ok: true, note: note }
}

function updateNote(id, patch) {
  var d = load()
  var n = d.notes.find(function (x) { return x.id === id })
  if (n) { Object.assign(n, patch); save(d) }
}

function removeNote(id) {
  var d = load()
  d.notes = (d.notes || []).filter(function (n) { return n.id !== id })
  save(d)
}

function togglePin(id) {
  var d = load()
  var n = d.notes.find(function (x) { return x.id === id })
  if (n) { n.pinned = !n.pinned; save(d) }
}

function toggleDone(id) {
  var d = load()
  var n = d.notes.find(function (x) { return x.id === id })
  if (n) { n.done = !n.done; save(d) }
}

module.exports = {
  NOTE_COLORS: NOTE_COLORS,
  getNotes: getNotes,
  addNote: addNote,
  updateNote: updateNote,
  removeNote: removeNote,
  togglePin: togglePin,
  toggleDone: toggleDone
}
