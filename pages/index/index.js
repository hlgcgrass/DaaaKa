var store = require('../../utils/store.js')
var accStore = require('../../utils/accountStore.js')
var noteStore = require('../../utils/noteStore.js')
var todoStore = require('../../utils/todoStore.js')

var WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 秒 -> mm:ss
function fmtSec(s) {
  s = Math.max(0, s | 0)
  var m = Math.floor(s / 60), ss = s % 60
  return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0')
}

function todayLabel() {
  var d = new Date()
  return (d.getMonth() + 1) + '/' + d.getDate()
}

function timeAgo(ts) {
  if (!ts) return ''
  var diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return Math.floor(diff / 86400000) + '天前'
}

Page({
  data: {
    // ===== 侧边栏 =====
    categories: [],
    currentCat: 'fitness',   // 当前选中的分类 id
    currentView: 'habits',   // habits | account | notes | todo
    currentCatName: '',
    currentCatIcon: '',
    currentCatColor: '',
    avatar: '',

    // ===== 习惯视图 =====
    habits: [],
    catDoneCount: 0,
    catTotal: 0,
    catProgress: 0,
    showAdd: false,
    emojiList: store.EMOJIS,
    colorList: store.COLORS,
    groupCategories: [],     // 仅 type=group 的分类（用于添加弹窗选择）
    form: {
      name: '', emoji: store.EMOJIS[0], color: store.COLORS[0],
      cue: '', time: '', category: 'fitness',
      timerEnabled: false, timerMin: 30
    },
    nameError: '',
    canAdd: true,
    quotaText: '',
    swipedId: '',
    timerChips: [5, 10, 15, 30, 45, 60],
    showCelebrate: false,
    confetti: [],
    todayLabel: '',

    // ===== 记账视图 =====
    accounts: [],
    accountGroups: [],
    monthTotal: '0.00',
    monthCount: 0,
    catStats: [],
    showAccAdd: false,
    accCategories: accStore.CATEGORIES,
    accForm: { amount: '', categoryId: 'food', note: '' },

    // ===== 便签视图 =====
    notes: [],
    noteColors: noteStore.NOTE_COLORS,
    showNoteAdd: false,
    noteForm: { text: '', colorId: 'yellow' },

    // ===== 待办视图 =====
    todos: [],
    todoInput: '',
    todoTotal: 0,
    todoDone: 0,
    todoLeft: 0,
    todoAllDone: false,

    // ===== 教育时政视图 =====
    eduNews: [],
    eduDate: '',
    eduSource: '',
    eduLoading: false,
    eduDetailShow: false,
    eduDetailItem: null
  },

  onLoad: function () {
    this._allDone = false
    this._celebTimer = null
    this._timerInt = null
  },

  onShow: function () {
    this.loadAvatar()
    this.buildSidebar()
    this.selectCategory(this.data.currentCat || 'fitness')
    this.ensureTimer()
  },

  onHide: function () {
    if (this._timerInt) { clearInterval(this._timerInt); this._timerInt = null }
  },

  onUnload: function () {
    if (this._timerInt) { clearInterval(this._timerInt); this._timerInt = null }
  },

  loadAvatar: function () {
    this.setData({ avatar: store.getAvatar() })
  },

  buildSidebar: function () {
    var cats = store.getCategories()
    var habits = store.getHabits()
    var list = cats.map(function (c) {
      var count = 0
      if (c.type === 'group') {
        count = habits.filter(function (h) { return h.category === c.id }).length
      }
      return { id: c.id, name: c.name, icon: c.icon, color: c.color, type: c.type, count: count }
    })
    // 统计页：原底部 tab，现并入侧边栏，放在"自我提升(growth)"之后、工具类之前
    var statsItem = { id: 'stats', name: '统计', icon: '📊', color: '#1677ff', type: 'page', page: '/pages/stats/stats', count: 0 }
    var gi = -1
    for (var i = 0; i < list.length; i++) { if (list[i].id === 'growth') { gi = i; break } }
    if (gi >= 0) list.splice(gi + 1, 0, statsItem)
    else list.push(statsItem)
    // 待办清单：在"便签"之后，作为内联视图（与记账/便签一致，不跳页）
    list.push({ id: 'todo', name: '待办', icon: '📋', color: '#722ed1', type: 'todo', count: 0 })
    // 教育时政：在"待办"之后，内联视图，由云函数每日 08:00 更新真实政策新闻
    list.push({ id: 'education', name: '教育时政', icon: '📰', color: '#d4380d', type: 'education', count: 0 })
    var groupCats = list.filter(function (c) { return c.type === 'group' })
    this.setData({ categories: list, groupCategories: groupCats, todayLabel: todayLabel() })
  },

  // ===== 侧边栏切换 =====
  onSelectCategory: function (e) {
    var id = e.currentTarget.dataset.v || e.currentTarget.dataset.id
    this.selectCategory(id)
  },

  selectCategory: function (catId) {
    var cat = this.data.categories.find(function (c) { return c.id === catId })
    if (!cat) cat = this.data.categories[0]
    // 统计 为独立页面，点击跳转（原为底部 tab，现并入侧边栏）
    if (cat.type === 'page') { wx.navigateTo({ url: cat.page }); return }

    var view = 'habits'
    if (cat.type === 'tool') view = (catId === 'account' ? 'account' : 'notes')
    else if (cat.type === 'todo') view = 'todo'
    else if (cat.type === 'education') view = 'education'

    this.setData({
      currentCat: cat.id,
      currentView: view,
      currentCatName: cat.name,
      currentCatIcon: cat.icon,
      currentCatColor: cat.color
    })

    if (view === 'habits') {
      this.refreshHabits(cat.id)
    } else if (view === 'account') {
      this.refreshAccount()
    } else if (view === 'notes') {
      this.refreshNotes()
    } else if (view === 'todo') {
      this.refreshTodo()
    } else if (view === 'education') {
      this.refreshEducation()
    }
  },

  // ===== 习惯视图：刷新列表 =====
  refreshHabits: function (catId) {
    catId = catId || this.data.currentCat
    var habits = store.getHabitsByCategory(catId)
    var t = store.todayStr()
    var list = habits.map(function (h) {
      var tm = h.timerMin || 0
      var enabled = !!(h.timerEnabled || tm > 0)
      var targetSec = tm * 60
      var running = enabled && h.timerStart && h.timerDate === t && !h.records[t]
      var timing = false, elapsedSec = 0, elapsedText = '', timerPct = 0
      if (running) {
        elapsedSec = Math.floor((Date.now() - h.timerStart) / 1000)
        timing = true
        elapsedText = fmtSec(elapsedSec)
        if (targetSec > 0) timerPct = Math.min(100, Math.round(elapsedSec / targetSec * 100))
      }
      var count = typeof h.records[t] === 'number' ? h.records[t] : 0
      return {
        id: h.id, name: h.name, emoji: h.emoji, color: h.color,
        cue: h.cue, time: h.time,
        doneToday: !!h.records[t],
        countEnabled: !!h.countEnabled,
        count: count,
        timerEnabled: enabled,
        timerMin: tm, timerStart: h.timerStart || 0, timerDate: h.timerDate || '',
        timing: timing, elapsedSec: elapsedSec, elapsedText: elapsedText, timerPct: timerPct
      }
    })

    var prog = store.categoryTodayProgress(catId)
    var pct = prog.total ? Math.round(prog.done / prog.total * 100) : 0
    var allDone = prog.total > 0 && prog.done === prog.total

    this.setData({
      habits: list,
      catDoneCount: prog.done,
      catTotal: prog.total,
      catProgress: pct,
      canAdd: store.getHabits().length < store.MAX_HABITS,
      quotaText: '已添加 ' + store.getHabits().length + '/' + store.MAX_HABITS
    })

    if (allDone && !this._allDone) this.triggerCelebrate()
    this._allDone = allDone
  },

  // 通用 refresh（供计时引擎调用）
  refresh: function () {
    if (this.data.currentView === 'habits') this.refreshHabits(this.data.currentCat)
  },

  // ===== 计时引擎 =====
  ensureTimer: function () {
    var that = this
    this.tick()
    if (this._timerInt) return
    this._timerInt = setInterval(function () { that.tick() }, 1000)
  },

  tick: function () {
    if (this.data.currentView !== 'habits') return
    var now = Date.now(), t = store.todayStr()
    var list = this.data.habits, updates = {}
    for (var i = 0; i < list.length; i++) {
      var h = list[i]
      if (h.timerEnabled || h.timerMin > 0) {
        if (h.timerStart && h.timerDate === t && !h.doneToday) {
          var elapsed = Math.floor((now - h.timerStart) / 1000)
          var tSec = (h.timerMin || 0) * 60
          updates['habits[' + i + '].elapsedSec'] = elapsed
          updates['habits[' + i + '].elapsedText'] = fmtSec(elapsed)
          updates['habits[' + i + '].timing'] = true
          if (tSec > 0) updates['habits[' + i + '].timerPct'] = Math.min(100, Math.round(elapsed / tSec * 100))
        }
      }
    }
    if (Object.keys(updates).length) this.setData(updates)
  },

  // ===== 打卡/计时操作 =====
  // ▶ 按钮：计时（开始 / 完成 / 取消）。同时开启计次时，完成计时会自动 +1 次数
  onPlay: function (e) {
    var id = e.currentTarget.dataset.id
    var idx = this.data.habits.findIndex(function (h) { return h.id === id })
    if (idx < 0) return
    var h = this.data.habits[idx]
    var t = store.todayStr()

    // 计时中 -> 完成（计次习惯由 completeTimer 内部 +1）
    if (h.timing) {
      var sec = h.timerStart ? Math.floor((Date.now() - h.timerStart) / 1000) : (h.elapsedSec || 0)
      store.completeTimer(id, sec)
      this.refreshHabits(this.data.currentCat)
      wx.showToast({ title: '打卡成功 · 本次 ' + fmtSec(sec), icon: 'success' })
      this.triggerStars(id)
      return
    }
    // 已完成的纯计时习惯（未开计次）-> 再次点击取消完成
    if (h.doneToday && !h.countEnabled) {
      store.toggleToday(id)
      this.refreshHabits(this.data.currentCat)
      return
    }
    // 开始计时
    var start = Date.now()
    store.updateHabit(id, { timerStart: start, timerDate: t })
    this.setData({
      ['habits[' + idx + '].timerStart']: start, ['habits[' + idx + '].timerDate']: t,
      ['habits[' + idx + '].timing']: true, ['habits[' + idx + '].elapsedSec']: 0,
      ['habits[' + idx + '].elapsedText']: '00:00', ['habits[' + idx + '].timerPct']: 0
    })
    this.ensureTimer()
    wx.showToast({ title: '开始计时', icon: 'none' })
  },

  // 次数按钮：计次 +1（独立，不触发计时）
  onCountBtn: function (e) {
    var id = e.currentTarget.dataset.id
    var idx = this.data.habits.findIndex(function (h) { return h.id === id })
    if (idx < 0) return
    var h = this.data.habits[idx]
    store.toggleToday(id)
    this.refreshHabits(this.data.currentCat)
    wx.showToast({ title: '打卡 +' + (h.count + 1) + ' 次', icon: 'none' })
    this.triggerStars(id)
  },

  // 计时中点“取消”：停止但不记录
  onTimerCancel: function (e) {
    var id = e.currentTarget.dataset.id
    store.updateHabit(id, { timerStart: 0, timerDate: '' })
    this.refreshHabits(this.data.currentCat)
    wx.showToast({ title: '已取消计时', icon: 'none' })
  },

  onCompleteNow: function (e) {
    var id = e.currentTarget.dataset.id
    var idx = this.data.habits.findIndex(function (h) { return h.id === id })
    if (idx < 0) return
    if (this.data.habits[idx].doneToday) return
    store.completeTimer(id)
    this.refreshHabits(this.data.currentCat)
    this.triggerStars(id)
  },

  triggerStars: function (habitId) {
    var emojis = ['✨', '⭐', '💫', '🌟', '✦', '☆']
    var colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe', '#fd79a8']
    var stars = []
    for (var i = 0; i < 8; i++) {
      stars.push({ emoji: emojis[i % emojis.length], color: colors[i % colors.length], dir: i, delay: (Math.random() * 0.12).toFixed(2) })
    }
    var key = 'habits[' + this.data.habits.findIndex(function (h) { return h.id === habitId }) + '].stars'
    var that = this
    this.setData({ [key]: [] })
    setTimeout(function () { that.setData({ [key]: stars }); setTimeout(function () { that.setData({ [key]: [] }) }, 900) }, 30)
  },

  // ===== 添加习惯 =====
  openAdd: function () {
    if (!this.data.canAdd) { wx.showToast({ title: '最多 ' + store.MAX_HABITS + ' 个习惯', icon: 'none' }); return }
    this.setData({
      showAdd: true,
      form: {
        name: '', emoji: store.EMOJIS[0], color: store.COLORS[0],
        cue: '', time: '', category: this.data.currentCat,
        timerEnabled: false, timerMin: 0, countEnabled: false
      },
      nameError: ''
    })
  },
  closeAdd: function () { this.setData({ showAdd: false }) },
  noop: function () {},

  onNameInput: function (e) {
    var name = (e.detail.value || '').trim()
    var patch = { 'form.name': e.detail.value, nameError: '' }
    if (name && store.ICON_BY_NAME[name]) patch['form.emoji'] = store.ICON_BY_NAME[name]
    this.setData(patch)
  },
  onCueInput: function (e) { this.setData({ 'form.cue': e.detail.value }) },
  onTimeInput: function (e) { this.setData({ 'form.time': e.detail.value }) },
  selectFormCategory: function (e) { this.setData({ 'form.category': e.currentTarget.dataset.v }) },
  selectEmoji: function (e) { this.setData({ 'form.emoji': e.currentTarget.dataset.v }) },
  selectColor: function (e) { this.setData({ 'form.color': e.currentTarget.dataset.v }) },
  onTimerToggle: function (e) { this.setData({ 'form.timerEnabled': e.detail.value }) },
  onCountToggle: function (e) { this.setData({ 'form.countEnabled': e.detail.value }) },
  onTimerMinInput: function (e) {
    var v = parseInt(e.detail.value, 10)
    if (isNaN(v)) v = 0; if (v < 1) v = 1; if (v > 600) v = 600
    this.setData({ 'form.timerMin': v })
  },
  setTimerMin: function (e) { this.setData({ 'form.timerMin': parseInt(e.currentTarget.dataset.v, 10) }) },

  confirmAdd: function () {
    var f = this.data.form
    var name = (f.name || '').trim()
    if (!name) { this.setData({ nameError: '给习惯起个名字吧' }); return }
    var res = store.addHabit({
      name: name, emoji: f.emoji, color: f.color, cue: f.cue, time: f.time,
      category: f.category,
      timerEnabled: !!f.timerEnabled, timerMin: 0,
      countEnabled: !!f.countEnabled
    })
    if (!res.ok && res.reason === 'limit') { wx.showToast({ title: '最多 ' + store.MAX_HABITS + ' 个习惯', icon: 'none' }); return }
    wx.showToast({ title: '已添加', icon: 'success' })
    this.setData({ showAdd: false })
    this.buildSidebar()       // 更新侧边栏计数
    this.refreshHabits(f.category) // 刷新当前分类
  },

  // ===== 左滑删除 =====
  onSwipeStart: function (e) { this._sx = e.touches[0].clientX; this._sy = e.touches[0].clientY; this._swiping = false },
  onSwipeMove: function (e) {
    var dx = e.touches[0].clientX - (this._sx || 0), dy = e.touches[0].clientY - (this._sy || 0)
    if (!this._swiping && Math.abs(dx) < 8) return
    if (Math.abs(dx) > Math.abs(dy)) this._swiping = true
    if (this._swiping) {
      var id = e.currentTarget.dataset.id, open = dx < -20
      if (open && this.data.swipedId !== id) this.setData({ swipedId: id })
      else if (!open && this.data.swipedId === id) this.setData({ swipedId: '' })
    }
  },
  onSwipeEnd: function () { this._swiping = false },

  removeHabit: function (e) {
    var id = e.currentTarget.dataset.id, that = this
    wx.showModal({
      title: '删除习惯', content: '删除后该习惯的打卡记录也会清空，确定吗？',
      confirmColor: '#e91e63',
      success: function (res) {
        if (res.confirm) {
          store.removeHabit(id)
          that.setData({ swipedId: '' })
          that.buildSidebar()
          that.refreshHabits(that.data.currentCat)
        }
      }
    })
  },

  // ===== 庆祝特效 =====
  genConfetti: function () {
    var colors = ['#07c160', '#1677ff', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#ff7043', '#f5222d']
    var arr = []
    for (var i = 0; i < 40; i++) {
      arr.push({ left: Math.floor(Math.random() * 100), color: colors[Math.floor(Math.random() * colors.length)], delay: (Math.random() * 0.9).toFixed(2), duration: (2.2 + Math.random() * 1.8).toFixed(2), round: Math.random() > 0.5 ? '50%' : '3rpx' })
    }
    return arr
  },
  triggerCelebrate: function () {
    var that = this
    this.setData({ showCelebrate: true, confetti: this.genConfetti() })
    if (this._celebTimer) clearTimeout(this._celebTimer)
    this._celebTimer = setTimeout(function () { that.setData({ showCelebrate: false }) }, 5000)
  },
  closeCelebrate: function () {
    if (this._celebTimer) clearTimeout(this._celebTimer)
    this.setData({ showCelebrate: false })
  },

  // ==================== 记账逻辑 ====================
  refreshAccount: function () {
    var now = new Date()
    var y = now.getFullYear(), m = now.getMonth()
    var sum = accStore.sumByMonth(y, m)
    var allAcc = accStore.getAccounts()

    // 分类统计
    var catStats = []
    var maxAmt = 1
    Object.keys(sum.byCategory).forEach(function (k) { if (sum.byCategory[k] > maxAmt) maxAmt = sum.byCategory[k] })
    accStore.CATEGORIES.forEach(function (c) {
      var amt = sum.byCategory[c.id] || 0
      if (amt > 0) catStats.push({ id: c.id, icon: c.icon, name: c.name, color: c.color, amount: amt, pct: Math.round(amt / maxAmt * 100) })
    })

    // 按日期分组
    var groups = {}
    allAcc.forEach(function (r) {
      var d = r.date
      if (!groups[d]) groups[d] = { date: d, items: [], total: 0 }
      var cat = accStore.CATEGORIES.find(function (c) { return c.id === r.categoryId }) || {}
      groups[d].items.push({ id: r.id, amount: r.amount, note: r.note, categoryId: r.categoryId, catName: cat.name, icon: cat.icon })
      groups[d].total += r.amount
    })
    var groupArr = Object.keys(groups).sort().reverse().map(function (k) { return groups[k] })

    this.setData({
      accounts: allAcc,
      accountGroups: groupArr,
      monthTotal: sum.total.toFixed(2),
      monthCount: sum.count,
      catStats: catStats
    })
  },

  openAccountAdd: function () {
    this.setData({ showAccAdd: true, accForm: { amount: '', categoryId: 'food', note: '' } })
  },
  closeAccAdd: function () { this.setData({ showAccAdd: false }) },
  onAccAmountInput: function (e) { this.setData({ 'accForm.amount': e.detail.value }) },
  onAccNoteInput: function (e) { this.setData({ 'accForm.note': e.detail.value }) },
  selectAccCat: function (e) { this.setData({ 'accForm.categoryId': e.currentTarget.dataset.v }) },

  confirmAccAdd: function () {
    var f = this.data.accForm
    var amount = parseFloat(f.amount)
    if (!amount || amount <= 0) { wx.showToast({ title: '请输入有效金额', icon: 'none' }); return }
    accStore.addAccount({ amount: amount, categoryId: f.categoryId, note: f.note.trim() })
    wx.showToast({ title: '已记录', icon: 'success' })
    this.setData({ showAccAdd: false })
    this.refreshAccount()
  },

  delAccount: function (e) {
    var id = e.currentTarget.dataset.id, that = this
    wx.showModal({ title: '删除记录', content: '确定删除这条记账？', success: function (r) { if (r.confirm) { accStore.removeAccount(id); that.refreshAccount() } } })
  },

  // ==================== 便签逻辑 ====================
  refreshNotes: function () {
    var notes = noteStore.getNotes()
    var colorMap = {}
    noteStore.NOTE_COLORS.forEach(function (c) { colorMap[c.id] = c.hex })
    var list = notes.map(function (n) { return { id: n.id, text: n.text, colorId: n.colorId, colorHex: colorMap[n.colorId] || '#FFF9C4', pinned: n.pinned, done: n.done, createdAt: n.createdAt, timeAgo: timeAgo(n.createdAt) } })
    this.setData({ notes: list })
  },

  openNoteAdd: function () {
    this.setData({ showNoteAdd: true, noteForm: { text: '', colorId: 'yellow' } })
  },
  closeNoteAdd: function () { this.setData({ showNoteAdd: false }) },
  onNoteTextInput: function (e) { this.setData({ 'noteForm.text': e.detail.value }) },
  selectNoteColor: function (e) { this.setData({ 'noteForm.colorId': e.currentTarget.dataset.v }) },

  confirmNoteAdd: function () {
    var text = (this.data.noteForm.text || '').trim()
    if (!text) { wx.showToast({ title: '写点什么吧', icon: 'none' }); return }
    noteStore.addNote({ text: text, colorId: this.data.noteForm.colorId })
    wx.showToast({ title: '已保存', icon: 'success' })
    this.setData({ showNoteAdd: false })
    this.refreshNotes()
  },

  toggleNotePin: function (e) {
    noteStore.togglePin(e.currentTarget.dataset.id)
    this.refreshNotes()
  },

  toggleNoteDone: function (e) {
    noteStore.toggleDone(e.currentTarget.dataset.id)
    this.refreshNotes()
  },

  delNote: function (e) {
    var id = e.currentTarget.dataset.id, that = this
    wx.showModal({ title: '删除便签', content: '确定删除？', success: function (r) { if (r.confirm) { noteStore.removeNote(id); that.refreshNotes() } } })
  },

  // ==================== 待办逻辑 ====================
  refreshTodo: function () {
    var list = todoStore.getTodos().slice()
    list.sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1
      return (b.createdAt || '').localeCompare(a.createdAt || '')
    })
    var doneCount = list.filter(function (t) { return t.done }).length
    var total = list.length
    this.setData({
      todos: list, todoTotal: total, todoDone: doneCount,
      todoLeft: total - doneCount, todoAllDone: total > 0 && doneCount === total
    })
  },

  onTodoInput: function (e) { this.setData({ todoInput: e.detail.value }) },

  addTodo: function () {
    var text = (this.data.todoInput || '').trim()
    if (!text) { wx.showToast({ title: '写点什么吧', icon: 'none' }); return }
    todoStore.addTodo(text)
    this.setData({ todoInput: '' })
    this.refreshTodo()
  },

  toggleTodo: function (e) {
    todoStore.toggleTodo(e.currentTarget.dataset.id)
    this.refreshTodo()
  },

  removeTodo: function (e) {
    var id = e.currentTarget.dataset.id, that = this
    wx.showModal({ title: '删除待办', content: '确定删除这条待办吗？', success: function (r) { if (r.confirm) { todoStore.removeTodo(id); that.refreshTodo() } } })
  },

  clearDoneTodo: function () {
    var that = this
    if (this.data.todoDone === 0) { wx.showToast({ title: '没有已完成的项', icon: 'none' }); return }
    wx.showModal({ title: '清除已完成', content: '确定清除 ' + this.data.todoDone + ' 条已完成的待办吗？', success: function (r) { if (r.confirm) { todoStore.clearDone(); that.refreshTodo() } } })
  },

  // ==================== 教育时政逻辑（纯前端，无需云开发） ====================
  refreshEducation: function () {
    var that = this
    this.setData({ eduLoading: true })

    // 纯前端：使用内置教育政策新闻数据（打开即用）
    var today = new Date()
    var dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')

    // 内置教育政策新闻（含标题+来源+完整正文，点击即展开阅读）
    var items = [
      {
        title: '教育部：2026年秋季学期中小学教材全面修订，强化思政与科学素养',
        source: '教育部', date: dateStr,
        content: '近日，教育部正式发布《关于做好2026年秋季中小学教材选用工作的通知》，宣布对全国中小学教材进行全面修订。本次修订重点聚焦三个方面：\n\n一、强化思政教育融入\n新教材将习近平新时代中国特色社会主义思想有机融入各学科教学内容，语文、历史、道德与法治等学科新增大量体现社会主义核心价值观的选篇和案例。\n\n二、提升科学素养\n物理、化学、生物等科学学科增加实验探究内容比重，新增"跨学科主题学习"板块，鼓励学生运用多学科知识解决实际问题。\n\n三、减轻学业负担\n严格控制教材容量和难度，删除超标、超前内容，确保教材内容符合学生认知发展规律，切实为"双减"工作提供支撑。\n\n据悉，新版教材将于2026年9月1日起在全国中小学投入使用。'
      },
      {
        title: '国务院办公厅印发《关于深化教育教学改革的意见》，推进素质教育落地',
        source: '国办', date: dateStr,
        content: '国务院办公厅近日印发《关于深化教育教学改革的意见》（以下简称《意见》），就全面深化教育教学改革、推进素质教育落地提出明确要求。\n\n《意见》指出，要坚持立德树人根本任务，遵循教育规律和学生身心发展规律，着力培养德智体美劳全面发展的社会主义建设者和接班人。\n\n主要改革措施包括：\n• 优化课程结构：减少机械记忆内容，增加实践性、探究性学习环节\n• 改革评价方式：破除"唯分数"倾向，建立综合素质评价体系\n• 加强体育美育：确保学生每天校内体育锻炼时间不少于1小时\n• 规范办学行为：严禁违规补课、考试排名等加重学生负担的行为\n\n《意见》要求各地各部门加强组织领导，细化实施方案，确保各项改革措施落到实处。'
      },
      {
        title: '教育部等七部门联合发文：加强中小学科学教育，每校至少配1名专职科学教师',
        source: '教育部', date: dateStr,
        content: '教育部、中央宣传部、科技部、共青团中央、中国科协、中科院、国家自然科学基金委等七部门近日联合印发《关于加强新时代中小学科学教育工作的意见》。\n\n《意见》提出，到2027年，中小学科学教育体系基本完善，中小学生科学素质明显提升。重点任务包括：\n\n一、配齐配强科学教师\n每所中小学至少配备1名专职科学教师，有条件的学校应设立专职科学教研组。鼓励高校、科研院所科学家担任中小学科学副校长或兼职科学教师。\n\n二、完善科学课程\n小学阶段开设科学启蒙课，初中阶段强化实验操作考核，高中阶段增设科学思维与方法选修课。\n\n三、拓展科学实践\n充分利用科技馆、博物馆、科普基地等社会资源，每名学生每学期至少参加1次科学实践活动。\n\n四、改进科学评价\n将学生实验操作能力纳入综合素质评价，逐步提高科学类科目在中考中的比重。'
      },
      {
        title: '全国教育工作会议召开：2026年重点推进教育数字化转型与均衡发展',
        source: '教育部', date: dateStr,
        content: '2026年全国教育工作会议于近日在北京召开，总结2025年教育工作成绩，部署2026年重点任务。\n\n会议强调，2026年是"十五五"规划开局之年，教育系统要紧紧围绕以下重点工作：\n\n【教育数字化转型】\n加快推进国家智慧教育平台建设，实现优质数字教育资源全覆盖。推广"三个课堂"（专递课堂、名师课堂、名校网络课堂）应用，缩小城乡、区域、校际差距。建设人工智能赋能教育教学示范区。\n\n【义务教育均衡发展】\n持续改善薄弱学校办学条件，推进义务教育优质均衡发展和城乡一体化。落实"免试就近入学"全覆盖，巩固控辍保学成果。\n\n【职业教育提质】\n深化产教融合、校企合作，推进职普融通。建设一批高水平高职学校和骨干专业群，提升职业教育适应经济社会发展能力。\n\n【教师队伍建设】\n加强师德师风建设，完善教师待遇保障机制，推进教师交流轮岗制度化。'
      },
      {
        title: '教育部发布《义务教育课程方案（2026年版）》，新增人工智能等跨学科主题学习',
        source: '教育部', date: dateStr,
        content: '教育部近日正式发布《义务教育课程方案（2026年版）》及16个学科课程标准，将于2026年秋季学期开始实施。\n\n本次修订是自2001年新课改以来力度最大的一次课程方案调整，主要变化包括：\n\n一、课程结构优化\n• 课时比例调整：语文、数学等主科课时占比适度下调，科学、艺术、综合实践活动等课时占比上调\n• 新设"跨学科主题学习"：原则上各学科至少拿出10%课时用于跨学科主题学习活动\n\n二、新增学习领域\n• 信息科技独立设课：从综合实践活动分离出来，成为独立课程\n• 人工智能入门：在信息科技课程中系统引入AI基础知识与伦理\n• 劳动课程标准化：设置日常生活劳动、生产劳动、服务性劳动三大类任务群\n\n三、教学方式变革\n倡导项目式学习(PBL)、探究式学习，减少机械刷题和死记硬背，注重培养学生解决真实问题的能力。'
      },
      {
        title: '财政部、教育部：下达2026年义务教育薄弱环节改善与能力提升补助资金',
        source: '财政部', date: dateStr,
        content: '财政部、教育部近日联合下达2026年义务教育薄弱环节改善与能力提升补助资金预算，总金额超过500亿元，用于支持地方改善义务教育学校办学条件。\n\n资金重点支持方向：\n\n一、校舍建设与改造\n重点支持农村地区、脱贫地区、民族地区和城乡结合部义务教育学校的校舍新建、改扩建和维修改造，消除危房，改善寄宿制学校生活条件。\n\n二、教学设备配置\n为学校配备必要的教学仪器设备、音体美器材、图书资料和信息化教学设备，缩小城乡学校硬件差距。\n\n三、信息化建设\n支持学校宽带网络接入、多媒体教室建设、智慧校园平台搭建，提升教育信息化水平。\n\n两部门要求，各地要严格按照资金管理办法使用补助资金，加强绩效管理，确保资金用在实处，切实改善薄弱学校办学条件，促进义务教育优质均衡发展。'
      },
      {
        title: '教育部：推进"双减"工作常态化，严查隐形变异学科类培训',
        source: '教育部', date: dateStr,
        content: '教育部近日印发通知，要求各地进一步巩固"双减"工作成果，推进校外培训治理常态化、长效化。\n\n通知明确以下重点工作：\n\n一、严查隐形变异培训\n• 以"家政服务""住家教师""众筹私教"等名义开展的学科类培训\n• 在咖啡厅、居民楼等隐蔽场所进行的"一对一""一对多"学科辅导\n• 通过线上会议软件、社交平台违规开展的学科类培训\n\n二、规范非学科类培训\n加强对体育、艺术、科技等非学科类机构的监管，防止其违规开展学科类培训。非学科类培训收费实行预收费监管，防范"退费难""卷钱跑路"风险。\n\n三、提升课堂教学质量\n推动学校优化作业设计，提高课后服务质量，满足学生多样化学习需求，从源头上减少学生参加校外培训的需求。\n\n教育部表示，将对工作不力、问题突出的地区进行通报约谈，对违法违规培训机构依法依规严肃处理。'
      },
      {
        title: '中办、国办印发《关于构建优质均衡基本公共教育服务体系的意见》',
        source: '中办/国办', date: dateStr,
        content: '中共中央办公厅、国务院办公厅近日印发《关于构建优质均衡基本公共教育服务体系的意见》，对加快建设高质量教育体系作出全面部署。\n\n总体目标：到2027年，优质均衡的基本公共教育服务体系初步建成；到2035年，义务教育学校全部达到优质均衡标准，总体实现教育现代化。\n\n核心举措：\n\n【资源配置均衡化】\n统一城乡学校建设标准、公用经费基准定额、基本装备配置标准。实施义务教育学校标准化建设工程，办好每一所学校。\n\n【师资配置均衡化】\n完善校长教师交流轮岗机制，城镇学校教师到乡村学校交流轮岗的比例不低于符合条件教师的10%。提高乡村教师生活补助标准。\n\n【群体权益保障】\n保障随迁子女平等接受义务教育，健全农村留守儿童关爱服务体系，完善特殊教育保障机制。\n\n【数字化赋能】\n建设国家智慧教育公共服务平台，以数字化手段扩大优质教育资源覆盖面，让农村孩子也能"在家门口上好学"。'
      },
      {
        title: '教育部启动新一轮"双一流"建设中期评估，突出创新人才培养成效',
        source: '教育部', date: dateStr,
        content: '教育部近日启动新一轮"双一流"建设中期评估工作，对147所"双一流"高校的建设成效进行全面检视。\n\n本轮评估的主要特点：\n\n一、突出创新人才培养\n将拔尖创新人才培养作为核心评价指标，考察高校在基础学科人才培养、关键核心技术攻关人才储备等方面的成效。\n\n二、破除"五唯"倾向\n不再单纯以论文数量、帽子头衔、奖项等级论英雄，更加注重解决国家重大需求、服务经济社会发展的实际贡献。\n\n三、分类评价引导\n根据不同类型高校的定位和特色，实行分类评价：综合性大学侧重原始创新能力，行业特色型高校侧重服务国家战略需求的能力。\n\n四、动态调整机制\n评估结果将作为下一轮"双一流"建设名单动态调整的重要依据。建设成效显著的加大支持力度，进展滞后的给予警示或调整出列。\n\n据悉，中期评估结果预计于2026年下半年公布。'
      },
      {
        title: '国家智慧教育平台用户突破3亿，上线中小学数字教材与名师课堂',
        source: '智慧教育', date: dateStr,
        content: '据教育部最新数据，国家智慧教育平台注册用户已突破3亿，累计访问量超过250亿次，成为全球最大的教育资源公共服务平台。\n\n近期平台重大更新：\n\n一、中小学数字教材全覆盖\n上线人教版、北师大版等主流版本中小学全学科数字教材，支持在线浏览、笔记标注、智能检索等功能。农村地区学生可免费获取与城市学生同等质量的教材资源。\n\n二、名师课堂资源扩容\n新增"名师讲堂"板块，汇集全国特级教师、教学名师的精品课堂视频超10万节，覆盖小学至高中全学段全学科。\n\n三、AI助学功能上线\n推出"智慧答疑""作文批改""口语练习"等AI辅助学习工具，为学生提供个性化学习支持。\n\n四、教师研修专区升级\n新增"教研共同体""名师工作室"等功能，促进教师专业成长和经验分享。\n\n教育部表示，将持续丰富平台资源和服务功能，打造"永远在线的空中课堂"，助力教育公平和质量提升。'
      }
    ]

    that.setData({
      eduLoading: false,
      eduDate: dateStr,
      eduSource: 'builtin',
      eduNews: items
    })
  },

  // 点击新闻 → 展开详情
  showEduDetail: function (e) {
    var idx = e.currentTarget.dataset.idx
    var item = this.data.eduNews[idx]
    if (!item) return
    this.setData({
      eduDetailItem: item,
      eduDetailShow: true
    })
  },

  closeEduDetail: function () {
    this.setData({ eduDetailShow: false, eduDetailItem: null })
  }
})
