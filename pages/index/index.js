const store = require('../../utils/store.js')
const quotes = require('./quotes.js')

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 秒 -> mm:ss
function fmtSec(s) {
  s = Math.max(0, s | 0)
  const m = Math.floor(s / 60)
  const ss = s % 60
  return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0')
}

function dateLabel() {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${WEEK[d.getDay()]}`
}

Page({
  data: {
    dateLabel: '',
    identity: '',
    habits: [],
    doneCount: 0,
    total: 0,
    progress: 0,
    showAdd: false,
    emojiList: store.EMOJIS,
    colorList: store.COLORS,
    form: { name: '', emoji: store.EMOJIS[0], color: store.COLORS[0], cue: '', time: '', timerEnabled: false, timerMin: 30 },
    nameError: '',
    canAdd: true,
    quotaText: '',
    showCelebrate: false,
    confetti: [],
    quote: { text: '', from: '' },
    quoteFade: true,
    swipedId: '', // 当前左滑展开删除菜单的习惯 id
    timerChips: [5, 10, 15, 30, 45, 60]
  },

  onLoad: function () {
    this._allDone = false
    this._celebTimer = null
    this._quoteTimer = null
    this._timerInt = null
  },

  onShow: function () {
    this.refresh()
    this.initQuote()
    this.ensureTimer()
  },

  onHide: function () {
    if (this._quoteTimer) { clearInterval(this._quoteTimer); this._quoteTimer = null }
    if (this._timerInt) { clearInterval(this._timerInt); this._timerInt = null }
  },

  onUnload: function () {
    if (this._quoteTimer) { clearInterval(this._quoteTimer); this._quoteTimer = null }
    if (this._timerInt) { clearInterval(this._timerInt); this._timerInt = null }
  },

  // 励志语录：每 5 秒随机切换一条（带淡入淡出）
  initQuote: function () {
    if (this._quoteTimer) clearInterval(this._quoteTimer)
    this.setData({ quote: this.pickQuote(), quoteFade: true })
    const that = this
    this._quoteTimer = setInterval(function () { that.rotateQuote() }, 5000)
  },

  rotateQuote: function () {
    const that = this
    this.setData({ quoteFade: false })
    setTimeout(function () {
      that.setData({ quote: that.pickQuote(), quoteFade: true })
    }, 280)
  },

  pickQuote: function () {
    if (!quotes.length) return { text: '', from: '' }
    if (quotes.length === 1) return quotes[0]
    let q = quotes[0]
    let guard = 0
    do {
      q = quotes[Math.floor(Math.random() * quotes.length)]
      guard++
    } while (this.data.quote && q.text === this.data.quote.text && guard < 20)
    return q
  },

  refresh: function (opts) {
    opts = opts || {}
    const habits = store.getHabits()
    const total = habits.length
    const t = store.todayStr()
    const list = habits.map(h => {
      const streak = store.calcStreak(h.records)
      const timerMin = h.timerMin || 0
      const running = timerMin > 0 && h.timerStart && h.timerDate === t && !h.records[t]
      let timing = false, remainingSec = 0, remainingText = '', timerPct = 0
      if (running) {
        const elapsed = Date.now() - h.timerStart
        const totalMs = timerMin * 60000
        const rem = totalMs - elapsed
        timing = true
        if (rem <= 0) {
          remainingSec = 0; remainingText = '00:00'; timerPct = 100
        } else {
          remainingSec = Math.ceil(rem / 1000)
          remainingText = fmtSec(remainingSec)
          timerPct = Math.min(100, Math.round(elapsed / totalMs * 100))
        }
      }
      return {
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        color: h.color,
        cue: h.cue,
        time: h.time,
        streak: streak,
        doneToday: !!h.records[t],
        timerMin: timerMin,
        timerStart: h.timerStart || 0,
        timerDate: h.timerDate || '',
        timing: timing,
        remainingSec: remainingSec,
        remainingText: remainingText,
        timerPct: timerPct,
        recent7: store.recentDays(h.id, 7).map(r => ({ done: r.done }))
      }
    })
    const prog = store.todayProgress()
    const pct = prog.total ? Math.round(prog.done / prog.total * 100) : 0
    const allDone = prog.total > 0 && prog.done === prog.total
    this.setData({
      dateLabel: dateLabel(),
      identity: store.getIdentity(),
      habits: list,
      doneCount: prog.done,
      total: prog.total,
      progress: pct,
      canAdd: total < store.MAX_HABITS,
      quotaText: `已添加 ${total}/${store.MAX_HABITS}`
    })
    if (opts.trigger && allDone && !this._allDone) {
      this.triggerCelebrate()
    }
    this._allDone = allDone
  },

  // ===== 计时引擎 =====
  // 保证每秒 tick 一次；立即 tick 一次以处理「离开期间已到点」的情况
  ensureTimer: function () {
    const that = this
    this.tick()
    if (this._timerInt) return
    this._timerInt = setInterval(function () { that.tick() }, 1000)
  },

  // 每秒计算各计时习惯的剩余时间；到点则自动打卡
  tick: function () {
    const now = Date.now()
    const t = store.todayStr()
    const list = this.data.habits
    const updates = {}
    let needRefresh = false
    for (let i = 0; i < list.length; i++) {
      const h = list[i]
      if (h.timerMin > 0 && h.timerStart && h.timerDate === t && !h.doneToday) {
        const elapsed = now - h.timerStart
        const totalMs = h.timerMin * 60000
        const rem = totalMs - elapsed
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
          const sec = Math.ceil(rem / 1000)
          updates['habits[' + i + '].remainingSec'] = sec
          updates['habits[' + i + '].remainingText'] = fmtSec(sec)
          updates['habits[' + i + '].timerPct'] = Math.min(100, Math.round(elapsed / totalMs * 100))
        }
      }
    }
    if (Object.keys(updates).length) this.setData(updates)
    if (needRefresh) {
      // 有计时打卡完成：重建列表并更新顶部进度；若今日全完成会触发庆祝
      this.refresh({ trigger: true })
      wx.showToast({ title: '⏰ 计时结束，打卡成功', icon: 'success' })
    }
  },

  onToggle: function (e) {
    const id = e.currentTarget.dataset.id
    const idx = this.data.habits.findIndex(h => h.id === id)
    if (idx < 0) return
    const h = this.data.habits[idx]

    // 计时类习惯：开始 / 取消 / 撤销
    if (h.timerMin > 0) {
      const t = store.todayStr()
      if (h.doneToday) {
        // 撤销：取消今日打卡并清除计时状态
        store.toggleToday(id)
        store.updateHabit(id, { timerStart: 0, timerDate: '' })
        this.refresh({ trigger: false })
        return
      }
      if (h.timing) {
        // 取消进行中的计时
        store.updateHabit(id, { timerStart: 0, timerDate: '' })
        this.setData({
          ['habits[' + idx + '].timerStart']: 0,
          ['habits[' + idx + '].timerDate']: '',
          ['habits[' + idx + '].timing']: false
        })
        wx.showToast({ title: '已取消计时', icon: 'none' })
        return
      }
      // 开始计时
      const start = Date.now()
      store.updateHabit(id, { timerStart: start, timerDate: t })
      this.setData({
        ['habits[' + idx + '].timerStart']: start,
        ['habits[' + idx + '].timerDate']: t,
        ['habits[' + idx + '].timing']: true,
        ['habits[' + idx + '].remainingSec']: h.timerMin * 60,
        ['habits[' + idx + '].remainingText']: fmtSec(h.timerMin * 60),
        ['habits[' + idx + '].timerPct']: 0
      })
      this.ensureTimer()
      wx.showToast({ title: '开始计时', icon: 'none' })
      return
    }

    // 普通习惯：即时打卡
    const wasDone = !!h.doneToday
    store.toggleToday(id)
    this.refresh({ trigger: true })
    // refresh 重建了 habits 数组，必须在之后触发星星，否则会被冲掉
    if (!wasDone) {
      this.triggerStars(id)
    }
  },

  // 计时类习惯：跳过倒计时，直接记一笔完成
  onCompleteNow: function (e) {
    const id = e.currentTarget.dataset.id
    const idx = this.data.habits.findIndex(h => h.id === id)
    if (idx < 0) return
    const h = this.data.habits[idx]
    if (h.doneToday) return
    store.completeTimer(id)
    this.refresh({ trigger: true })
    // refresh 重建了 habits 数组，必须在之后触发星星，否则会被冲掉
    this.triggerStars(id)
  },

  // 单项打卡星星绽放
  triggerStars: function (habitId) {
    const emojis = ['✨', '⭐', '💫', '🌟', '✦', '☆']
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe', '#fd79a8']
    const stars = []
    for (let i = 0; i < 8; i++) {
      stars.push({
        emoji: emojis[i % emojis.length],
        color: colors[i % colors.length],
        dir: i,
        delay: (Math.random() * 0.12).toFixed(2)
      })
    }
    const key = 'habits[' + this.data.habits.findIndex(h => h.id === habitId) + '].stars'
    // 先清空再设置，确保动画重新触发
    this.setData({ [key]: [] })
    const that = this
    setTimeout(function () {
      that.setData({ [key]: stars })
      // 动画结束后清理
      setTimeout(function () { that.setData({ [key]: [] }) }, 900)
    }, 30)
  },

  openAdd: function () {
    if (!this.data.canAdd) {
      wx.showToast({ title: `最多 ${store.MAX_HABITS} 个习惯`, icon: 'none' })
      return
    }
    this.setData({
      showAdd: true,
      form: { name: '', emoji: store.EMOJIS[0], color: store.COLORS[0], cue: '', time: '', timerEnabled: false, timerMin: 30 },
      nameError: ''
    })
  },

  closeAdd: function () {
    this.setData({ showAdd: false })
  },

  noop: function () {},

  onNameInput: function (e) {
    const name = (e.detail.value || '').trim()
    const patch = { 'form.name': e.detail.value, nameError: '' }
    // 输入事项名时自动预选对应图标（精确匹配定制事项表）
    if (name && store.ICON_BY_NAME[name]) {
      patch['form.emoji'] = store.ICON_BY_NAME[name]
    }
    this.setData(patch)
  },
  onCueInput: function (e) { this.setData({ 'form.cue': e.detail.value }) },
  onTimeInput: function (e) { this.setData({ 'form.time': e.detail.value }) },
  // 计时打卡设置
  onTimerToggle: function (e) { this.setData({ 'form.timerEnabled': e.detail.value }) },
  onTimerMinInput: function (e) {
    let v = parseInt(e.detail.value, 10)
    if (isNaN(v)) v = 0
    if (v < 1) v = 1
    if (v > 600) v = 600
    this.setData({ 'form.timerMin': v })
  },
  setTimerMin: function (e) { this.setData({ 'form.timerMin': parseInt(e.currentTarget.dataset.v, 10) }) },
  selectEmoji: function (e) { this.setData({ 'form.emoji': e.currentTarget.dataset.v }) },
  selectColor: function (e) { this.setData({ 'form.color': e.currentTarget.dataset.v }) },

  confirmAdd: function () {
    const f = this.data.form
    const name = (f.name || '').trim()
    if (!name) {
      this.setData({ nameError: '给习惯起个名字吧' })
      return
    }
    const res = store.addHabit({
      name: name, emoji: f.emoji, color: f.color, cue: f.cue, time: f.time,
      timerMin: f.timerEnabled ? (parseInt(f.timerMin, 10) || 0) : 0
    })
    if (!res.ok && res.reason === 'limit') {
      wx.showToast({ title: `最多 ${store.MAX_HABITS} 个习惯`, icon: 'none' })
      return
    }
    wx.showToast({ title: '已添加', icon: 'success' })
    this.setData({ showAdd: false })
    this.refresh()
  },

  // ===== 左滑删除手势 =====
  onSwipeStart: function (e) {
    const t = e.touches[0]
    this._sx = t.clientX
    this._sy = t.clientY
    this._swiping = false
  },
  onSwipeMove: function (e) {
    const t = e.touches[0]
    const dx = t.clientX - (this._sx || 0)
    const dy = t.clientY - (this._sy || 0)
    // 横向滑动才算（避免与纵向滚动冲突）
    if (!this._swiping && Math.abs(dx) < 8) return
    if (Math.abs(dx) > Math.abs(dy)) this._swiping = true
    if (this._swiping) {
      const id = e.currentTarget.dataset.id
      // 左滑 -> 展开；右滑 -> 收起
      const open = dx < -20
      if (open && this.data.swipedId !== id) {
        this.setData({ swipedId: id })
      } else if (!open && this.data.swipedId === id) {
        this.setData({ swipedId: '' })
      }
    }
  },
  onSwipeEnd: function () {
    this._swiping = false
  },

  removeHabit: function (e) {
    const id = e.currentTarget.dataset.id
    const that = this
    wx.showModal({
      title: '删除习惯',
      content: '删除后该习惯的打卡记录也会清空，确定吗？',
      confirmColor: '#e91e63',
      success: function (res) {
        if (res.confirm) {
          store.removeHabit(id)
          that.setData({ swipedId: '' })
          that.refresh()
        }
      }
    })
  },

  genConfetti: function () {
    const colors = ['#07c160', '#1677ff', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#ff7043', '#f5222d']
    const arr = []
    for (let i = 0; i < 40; i++) {
      arr.push({
        left: Math.floor(Math.random() * 100),
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: (Math.random() * 0.9).toFixed(2),
        duration: (2.2 + Math.random() * 1.8).toFixed(2),
        round: Math.random() > 0.5 ? '50%' : '3rpx'
      })
    }
    return arr
  },

  triggerCelebrate: function () {
    const that = this
    this.setData({ showCelebrate: true, confetti: this.genConfetti() })
    if (this._celebTimer) clearTimeout(this._celebTimer)
    this._celebTimer = setTimeout(function () {
      that.setData({ showCelebrate: false })
    }, 5000)
  },

  closeCelebrate: function () {
    if (this._celebTimer) clearTimeout(this._celebTimer)
    this.setData({ showCelebrate: false })
  }
})
