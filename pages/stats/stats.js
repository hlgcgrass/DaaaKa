const store = require('../../utils/store.js')

function fmtSec(s) {
  s = Math.max(0, s | 0)
  var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60
  if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0')
  return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0')
}

// YYYY-MM-DD 偏移 n 天
function dayOffset(dateStr, delta) {
  var p = function (n) { return String(n).padStart(2, '0') }
  var parts = dateStr.split('-').map(Number)
  var dt = new Date(parts[0], parts[1] - 1, parts[2])
  dt.setDate(dt.getDate() + delta)
  return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate())
}

Page({
  data: {
    total: 0,
    done: 0,
    rate: 0,
    categorySections: [],
    year: new Date().getFullYear(),
    weekHeads: ['日', '一', '二', '三', '四', '五', '六'],
    calYear: 0,
    calMonth: 0,
    monthLabel: '',
    calCells: [],
    calAnim: '',
    calendarExpanded: false
  },

  onShow: function () {
    this.refresh()
  },

  refresh: function () {
    const habits = store.getHabits()
    const total = habits.length
    const prog = store.todayProgress()
    const rate = total ? Math.round(prog.done / total * 100) : 0

    // 把单个习惯映射成展示对象
    function mapHabit(h) {
      const today = store.todayStr()
      const streak = store.calcStreak(h.records)
      const count = Object.keys(h.records).filter(k => h.records[k]).length
      const isTimer = !!(h.timerEnabled || (h.timerMin > 0))
      const isCount = !!h.countEnabled
      const durations = h.durations || {}
      const totalDurationSec = Object.keys(durations).reduce((sum, k) => sum + (durations[k] || 0), 0)
      const todayDurationSec = durations[today] || 0
      const week = []
      for (let i = 6; i >= 0; i--) {
        const ds = dayOffset(today, -i)
        const sec = durations[ds] || 0
        const dp = ds.split('-')
        week.push({
          label: i === 0 ? '今' : (parseInt(dp[1], 10) + '/' + parseInt(dp[2], 10)),
          sec: sec,
          text: fmtSec(sec),
          has: sec > 0
        })
      }
      const totalCount = isCount
        ? Object.keys(h.records).reduce((sum, k) => sum + (typeof h.records[k] === 'number' ? h.records[k] : 0), 0)
        : count
      return {
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        color: h.color,
        streak: streak,
        best: store.calcBest(h.records),
        count: count,
        doneToday: !!h.records[today],
        isTimer: isTimer,
        isCount: isCount,
        totalDurationSec: totalDurationSec,
        totalDurationText: fmtSec(totalDurationSec),
        todayDurationSec: todayDurationSec,
        todayDurationText: fmtSec(todayDurationSec),
        week: week,
        totalCount: totalCount,
        chain: store.habitChain(h.records, 14)
      }
    }

    // 按专题（分类）分组：仅取 type='group' 的三个习惯分组
    const cats = store.getCategories().filter(function (c) { return c.type === 'group' })
    const categorySections = cats.map(function (cat) {
      const list = habits.filter(function (h) { return h.category === cat.id }).map(mapHabit)
      const done = list.filter(function (h) { return h.doneToday }).length
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        total: list.length,
        done: done,
        expanded: true,
        habits: list
      }
    })

    let y = this.data.calYear
    let m = this.data.calMonth
    if (!y) { const now = new Date(); y = now.getFullYear(); m = now.getMonth() }
    this.buildCalendar(y, m)
    this.setData({
      total: total,
      done: prog.done,
      rate: rate,
      categorySections: categorySections,
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

  toggleCalendar: function () {
    this.setData({ calendarExpanded: !this.data.calendarExpanded })
  },

  // 专题折叠 / 展开
  toggleCat: function (e) {
    const idx = e.currentTarget.dataset.idx
    if (idx == null) return
    const key = 'categorySections[' + idx + '].expanded'
    this.setData({ [key]: !this.data.categorySections[idx].expanded })
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

  // ===== 数据重置 =====
  onClearAll: function () {
    const that = this
    wx.showModal({
      title: '清空所有数据',
      content: '确定要删除所有习惯、打卡记录和头像吗？此操作不可恢复。',
      confirmColor: '#FF6B6B',
      success: function (res) {
        if (!res.confirm) return
        store.clearAll()
        wx.showToast({ title: '已清空', icon: 'success' })
        that.refresh()
      }
    })
  }
})
