// 待办清单数据层 —— 与「习惯打卡」相互独立，仅本地存储
// 每条待办：{ id, text, done, createdAt }
const TODO_KEY = 'atomic_todos_v1'

function todayStr() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function load() {
  try { return wx.getStorageSync(TODO_KEY) || [] } catch (e) { return [] }
}
function save(list) {
  try { wx.setStorageSync(TODO_KEY, list) } catch (e) {}
}

function getTodos() { return load() }

function addTodo(text) {
  text = (text || '').trim()
  if (!text) return { ok: false, reason: 'empty' }
  const list = load()
  list.push({
    id: 't_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    text: text,
    done: false,
    createdAt: todayStr()
  })
  save(list)
  return { ok: true }
}

function toggleTodo(id) {
  const list = load()
  const t = list.find(x => x.id === id)
  if (t) { t.done = !t.done; save(list) }
}

function removeTodo(id) {
  const list = load()
  save(list.filter(x => x.id !== id))
}

// 清除所有已完成项
function clearDone() {
  const list = load()
  save(list.filter(x => !x.done))
}

// 清空全部（保留接口，UI 暂未暴露）
function clearAll() {
  save([])
}

module.exports = { getTodos, addTodo, toggleTodo, removeTodo, clearDone, clearAll }
