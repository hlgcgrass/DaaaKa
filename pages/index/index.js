var store = require('../../utils/store.js')
var accStore = require('../../utils/accountStore.js')
var noteStore = require('../../utils/noteStore.js')

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
    currentView: 'habits',   // habits | account | notes
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
    noteForm: { text: '', colorId: 'yellow' }
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

    var view = cat.type === 'tool' ? (catId === 'account' ? 'account' : 'notes') : 'habits'

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
    }
  },

  // ===== 习惯视图：刷新列表 =====
  refreshHabits: function (catId) {
    catId = catId || this.data.currentCat
    var habits = store.getHabitsByCategory(catId)
    var t = store.todayStr()
    var list = habits.map(function (h) {
      var tm = h.timerMin || 0
      var running = tm > 0 && h.timerStart && h.timerDate === t && !h.records[t]
      var timing = false, remainingSec = 0, remainingText = '', timerPct = 0
      if (running) {
        var elapsed = Date.now() - h.timerStart
        var totalMs = tm * 60000
        var rem = totalMs - elapsed
        timing = true
        if (rem <= 0) { remainingSec = 0; remainingText = '00:00'; timerPct = 100 }
        else { remainingSec = Math.ceil(rem / 1000); remainingText = fmtSec(remainingSec); timerPct = Math.min(100, Math.round(elapsed / totalMs * 100)) }
      }
      return {
        id: h.id, name: h.name, emoji: h.emoji, color: h.color,
        cue: h.cue, time: h.time,
        doneToday: !!h.records[t],
        timerMin: tm, timerStart: h.timerStart || 0, timerDate: h.timerDate || '',
        timing: timing, remainingSec: remainingSec, remainingText: remainingText, timerPct: timerPct
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
    var list = this.data.habits, updates = {}, needRefresh = false
    for (var i = 0; i < list.length; i++) {
      var h = list[i]
      if (h.timerMin > 0 && h.timerStart && h.timerDate === t && !h.doneToday) {
        var elapsed = now - h.timerStart, totalMs = h.timerMin * 60000, rem = totalMs - elapsed
        if (rem <= 0) {
          store.completeTimer(h.id)
          updates['habits[' + i + '].doneToday'] = true
          updates['habits[' + i + '].timing'] = false
          updates['habits[' + i + '].timerStart'] = 0
          updates['habits[' + i + '].timerDate'] = ''
          updates['habits[' + i + '].remainingText'] = '00:00'
          updates['habits[' + i + '].timerPct'] = 100
          needRefresh = true
        } else {
          var sec = Math.ceil(rem / 1000)
          updates['habits[' + i + '].remainingSec'] = sec
          updates['habits[' + i + '].remainingText'] = fmtSec(sec)
          updates['habits[' + i + '].timerPct'] = Math.min(100, Math.round(elapsed / totalMs * 100))
        }
      }
    }
    if (Object.keys(updates).length) this.setData(updates)
    if (needRefresh) {
      this.refreshHabits(this.data.currentCat)
      wx.showToast({ title: '⏰ 计时结束，打卡成功', icon: 'success' })
    }
  },

  // ===== 打卡/计时操作 =====
  onToggle: function (e) {
    var id = e.currentTarget.dataset.id
    var idx = this.data.habits.findIndex(function (h) { return h.id === id })
    if (idx < 0) return
    var h = this.data.habits[idx]

    if (h.timerMin > 0) {
      var t = store.todayStr()
      if (h.doneToday) {
        store.toggleToday(id)
        store.updateHabit(id, { timerStart: 0, timerDate: '' })
        this.refreshHabits(this.data.currentCat)
        return
      }
      if (h.timing) {
        store.updateHabit(id, { timerStart: 0, timerDate: '' })
        this.setData({ ['habits[' + idx + '].timerStart']: 0, ['habits[' + idx + '].timerDate']: '', ['habits[' + idx + '].timing']: false })
        wx.showToast({ title: '已取消计时', icon: 'none' })
        return
      }
      var start = Date.now()
      store.updateHabit(id, { timerStart: start, timerDate: t })
      this.setData({
        ['habits[' + idx + '].timerStart']: start, ['habits[' + idx + '].timerDate']: t,
        ['habits[' + idx + '].timing']: true,
        ['habits[' + idx + '].remainingSec']: h.timerMin * 60,
        ['habits[' + idx + '].remainingText']: fmtSec(h.timerMin * 60),
        ['habits[' + idx + '].timerPct']: 0
      })
      this.ensureTimer()
      wx.showToast({ title: '开始计时', icon: 'none' })
      return
    }

    var wasDone = !!h.doneToday
    store.toggleToday(id)
    this.refreshHabits(this.data.currentCat)
    if (!wasDone) this.triggerStars(id)
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
        timerEnabled: false, timerMin: 30
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
  selectCategory: function (e) { this.setData({ 'form.category': e.currentTarget.dataset.v }) },
  selectEmoji: function (e) { this.setData({ 'form.emoji': e.currentTarget.dataset.v }) },
  selectColor: function (e) { this.setData({ 'form.color': e.currentTarget.dataset.v }) },
  onTimerToggle: function (e) { this.setData({ 'form.timerEnabled': e.detail.value }) },
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
      timerMin: f.timerEnabled ? (parseInt(f.timerMin, 10) || 0) : 0
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
  }
})
