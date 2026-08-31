var timerStore = require('../../utils/timerStore.js')

// 注：微信同声传译插件申请失败（错误码 89260），TTS 已改为静默降级，
// 计时器核心功能（倒计时、秒针音、最后5秒提示、庆祝特效）完全不受影响。

function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec))
  var m = Math.floor(sec / 60), s = sec % 60
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
}

var EFFECTS = {
  tick: '/assets/audio/tick.wav',
  dong: '/assets/audio/dong.wav',
  cheer: '/assets/audio/cheer.wav'
}

var CONFETTI_COLORS = ['#ffd93d', '#6bcB77', '#4d96ff', '#ff6b6b', '#c780e8', '#ff9f43', '#00d2d3']

Page({
  data: {
    tasks: [],
    total: 0,
    currentIndex: 0,
    taskName: '',
    taskLabel: '',
    timeText: '00:00',
    ringDeg: 0,
    progressPct: 0,
    phase: 'preparing',     // preparing | running | paused | finished
    overallPct: 0,
    doneCount: 0,
    voiceName: '',
    tickOn: true,
    counting: false,        // 是否处于最后 5 秒倒数
    confetti: [],
    ttsReady: false
  },

  onLoad: function () {
    var state = timerStore.getState()
    var tasks = state.tasks || []
    if (!tasks.length) {
      wx.showToast({ title: '请先添加任务', icon: 'none' })
      setTimeout(function () { wx.navigateBack() }, 900)
      return
    }

    var list = tasks.map(function (t) {
      return {
        id: t.id,
        name: t.name,
        value: t.value,
        unit: t.unit,
        timeLabel: timerStore.taskLabel(t),
        sec: timerStore.taskSeconds(t)
      }
    })

    this._ttsCache = {}
    this._audioPool = []
    this._effectCtx = {}
    this._lastSec = -1
    this._lastCount = -1

    this.setData({
      tasks: list,
      total: list.length,
      voiceName: timerStore.getVoice(state.voice).name,
      tickOn: state.tick !== false
    })

    this.voiceId = state.voice || 'standard'
    this.start()
  },

  onUnload: function () {
    this._stopLoop()
    if (this._navTimer) clearTimeout(this._navTimer)
    // 销毁所有音频上下文
    var pool = this._audioPool || []
    for (var i = 0; i < pool.length; i++) { try { pool[i].destroy() } catch (e) {} }
    var keys = Object.keys(this._effectCtx || {})
    for (var j = 0; j < keys.length; j++) { try { this._effectCtx[keys[j]].destroy() } catch (e) {} }
  },

  // ==================== 语音/音效 ====================
  // 微信同声传译插件申请失败，TTS 静默降级；保留纯音效反馈。"
  _speak: function (text, cb) {
    // TTS 不可用：直接回调，UI 文字已承担提示作用
    cb && cb()
  },

  /** 播放音效（tick / dong / cheer） */
  _effect: function (name) {
    var src = EFFECTS[name]
    if (!src) return
    try {
      var a = this._effectCtx[name]
      if (!a) {
        a = wx.createInnerAudioContext()
        a.src = src
        this._effectCtx[name] = a
      }
      a.stop()
      a.play()
    } catch (e) {}
  },

  // ==================== 流程控制 ====================
  start: function () {
    // TTS 插件申请失败（89260），跳过预合成；直接开始任务流程
    this.setData({ ttsReady: true, phase: 'running' })
    this.beginTask(0)
  },

  beginTask: function (idx) {
    var that = this
    if (idx >= this.data.total) { this.finishAll(); return }

    var task = this.data.tasks[idx]
    var total = task.sec
    this._curTotal = total
    this._lastSec = -1
    this._lastCount = -1

    this.setData({
      currentIndex: idx,
      taskName: task.name,
      taskLabel: task.timeLabel,
      doneCount: idx,
      overallPct: Math.round(idx / this.data.total * 100),
      timeText: fmtTime(total),
      ringDeg: 0,
      progressPct: 0,
      counting: false
    })

    // 播报任务名后再开始倒计时
    this._speak('第' + (idx + 1) + '个任务，' + task.name, function () {
      if (that.data.phase !== 'running') return
      that._endAt = Date.now() + total * 1000
      that._startLoop()
    })
  },

  _startLoop: function () {
    var that = this
    this._stopLoop()
    this._loop = setInterval(function () { that._tick() }, 200)
    this._tick()
  },

  _stopLoop: function () {
    if (this._loop) { clearInterval(this._loop); this._loop = null }
  },

  _tick: function () {
    var that = this
    if (this.data.phase !== 'running' || !this._endAt) return

    var remain = (this._endAt - Date.now()) / 1000
    if (remain < 0) remain = 0
    var total = this._curTotal || 1
    var passed = Math.max(0, Math.min(1, 1 - remain / total))
    var cur = Math.ceil(remain)
    // 严格 <=5，保证 ceil 后最大为 5，倒数依次为 5 4 3 2 1
    var counting = remain > 0 && remain <= 5

    this.setData({
      timeText: fmtTime(remain),
      ringDeg: Math.round(passed * 360),
      progressPct: Math.round(passed * 100),
      counting: counting
    })

    // 秒针音（最后 5 秒让位给语音倒数）
    if (this.data.tickOn && remain > 5) {
      if (this._lastSec !== cur) {
        this._lastSec = cur
        this._effect('tick')
      }
    }

    // 最后 5 秒语音倒数：5 4 3 2 1
    if (counting && cur >= 1 && cur !== this._lastCount) {
      this._lastCount = cur
      this._speak(String(cur))
    }

    // 时间到 → 噔的一声 → 下一个任务
    if (remain <= 0) {
      this._lastSec = -1
      this._stopLoop()
      this._effect('dong')
      var next = this.data.currentIndex + 1
      this.setData({ timeText: '00:00', ringDeg: 360, progressPct: 100 })
      this._navTimer = setTimeout(function () {
        if (that.data.phase !== 'running') return
        that.beginTask(next)
      }, 950)
    }
  },

  finishAll: function () {
    var that = this
    this._stopLoop()
    this.setData({
      phase: 'finished',
      doneCount: this.data.total,
      overallPct: 100,
      timeText: '00:00',
      ringDeg: 360,
      counting: false,
      confetti: this._makeConfetti(46)
    })
    this._effect('cheer')
    this._speak('恭喜您完成任务')
  },

  _makeConfetti: function (n) {
    var arr = []
    for (var i = 0; i < n; i++) {
      arr.push({
        id: i,
        left: Math.round(Math.random() * 100),
        delay: (Math.random() * 1.2).toFixed(2),
        dur: (1.8 + Math.random() * 1.4).toFixed(2),
        size: Math.round(12 + Math.random() * 16),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: Math.round(Math.random() * 360)
      })
    }
    return arr
  },

  // ==================== 交互 ====================
  togglePause: function () {
    if (this.data.phase === 'running') {
      this._pauseRemain = Math.max(0, (this._endAt - Date.now()) / 1000)
      this._stopLoop()
      this.setData({ phase: 'paused' })
    } else if (this.data.phase === 'paused') {
      this._endAt = Date.now() + (this._pauseRemain || 0) * 1000
      this.setData({ phase: 'running' })
      this._startLoop()
    }
  },

  skipTask: function () {
    if (this.data.phase !== 'running' && this.data.phase !== 'paused') return
    var next = this.data.currentIndex + 1
    this._stopLoop()
    if (next >= this.data.total) this.finishAll()
    else this.beginTask(next)
  },

  quit: function () {
    var that = this
    wx.showModal({
      title: '结束计时',
      content: '确定要结束本次计时吗？',
      success: function (r) {
        if (r.confirm) {
          that._stopLoop()
          wx.navigateBack()
        }
      }
    })
  },

  noop: function () {}
})
