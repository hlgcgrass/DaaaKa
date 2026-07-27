const store = require('../../utils/store.js')

Page({
  data: {
    identity: '',
    editingIdentity: false,
    identityDraft: '',
    avatar: '',
    total: 0,
    done: 0,
    rate: 0,
    habits: [],
    year: new Date().getFullYear(),
    weekHeads: ['日', '一', '二', '三', '四', '五', '六'],
    calYear: 0,
    calMonth: 0,
    monthLabel: '',
    calCells: [],
    calAnim: ''
  },

  onShow: function () {
    this.refresh()
  },

  refresh: function () {
    const habits = store.getHabits()
    const total = habits.length
    const prog = store.todayProgress()
    const rate = total ? Math.round(prog.done / total * 100) : 0
    const list = habits.map(h => {
      const streak = store.calcStreak(h.records)
      const count = Object.keys(h.records).filter(k => h.records[k]).length
      return {
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        color: h.color,
        streak: streak,
        best: store.calcBest(h.records),
        count: count,
        chain: store.habitChain(h.records, 14),
        msg: store.chainMessage(streak, count, h.name),
        badges: store.milestones(h.records)
      }
    })
    let y = this.data.calYear
    let m = this.data.calMonth
    if (!y) { const now = new Date(); y = now.getFullYear(); m = now.getMonth() }
    this.buildCalendar(y, m)
    this.setData({
      identity: store.getIdentity(),
      identityDraft: store.getIdentity(),
      avatar: store.getAvatar(),
      total: total,
      done: prog.done,
      rate: rate,
      habits: list,
      year: new Date().getFullYear()
    })
  },

  buildCalendar: function (y, m, anim) {
    const cells = store.monthStatus(y, m)
    const data = {
      calYear: y,
      calMonth: m,
      monthLabel: `${y}年${m + 1}月`,
      calCells: cells
    }
    if (anim) data.calAnim = anim
    this.setData(data)
    if (anim) {
      const that = this
      if (this._calAnimTimer) clearTimeout(this._calAnimTimer)
      this._calAnimTimer = setTimeout(function () { that.setData({ calAnim: '' }) }, 340)
    }
  },

  prevMonth: function () {
    let y = this.data.calYear
    let m = this.data.calMonth - 1
    if (m < 0) { m = 11; y-- }
    this.buildCalendar(y, m, 'slide-in-left')
  },

  nextMonth: function () {
    const now = new Date()
    const curY = now.getFullYear()
    const curM = now.getMonth()
    let y = this.data.calYear
    let m = this.data.calMonth + 1
    if (m > 11) { m = 0; y++ }
    if (y > curY || (y === curY && m > curM)) return
    this.buildCalendar(y, m, 'slide-in-right')
  },

  onCalTouchStart: function (e) {
    this._tx = e.changedTouches[0].clientX
  },

  onCalTouchEnd: function (e) {
    if (this._tx == null) return
    const dx = e.changedTouches[0].clientX - this._tx
    this._tx = null
    if (dx > 40) this.prevMonth()
    else if (dx < -40) this.nextMonth()
  },

  // ===== 头像设置 =====
  // 点头像 = 调用微信头像选择器（open-type=chooseAvatar）
  onChooseAvatar: function (e) {
    const url = e.detail.avatarUrl
    if (!url) return
    this.persistAvatar(url)
  },
  // 持久化：优先存为本地文件，避免临时路径失效
  persistAvatar: function (src) {
    const that = this
    const isTemp = src.indexOf('http://tmp/') === 0 || src.indexOf('wxfile://tmp/') === 0
    if (isTemp) {
      wx.getFileSystemManager().saveFile({
        tempFilePath: src,
        success: function (r) { that.commitAvatar(r.savedFilePath) },
        fail: function () { that.commitAvatar(src) }
      })
    } else {
      that.commitAvatar(src)
    }
  },
  commitAvatar: function (path) {
    store.setAvatar(path)
    this.setData({ avatar: path })
    wx.showToast({ title: '头像已更新', icon: 'success' })
  },

  // ===== 身份宣言 =====
  startEditIdentity: function () {
    this.setData({ editingIdentity: true, identityDraft: this.data.identity })
  },
  onIdentityInput: function (e) { this.setData({ identityDraft: e.detail.value }) },
  saveIdentity: function () {
    store.setIdentity(this.data.identityDraft)
    this.setData({ editingIdentity: false })
    wx.showToast({ title: '已保存', icon: 'success' })
    this.refresh()
  },
  cancelIdentity: function () { this.setData({ editingIdentity: false }) }
})
