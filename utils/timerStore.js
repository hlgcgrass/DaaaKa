/**
 * 计时器（组合任务）数据层
 * 存储：组合任务列表 + 语音播报偏好（音色档位 / 秒针音开关）
 */
var KEY = 'atomic_timer_v1'

/**
 * 音色档位
 * 说明：微信同声传译插件(WechatSI)的 textToSpeech 不支持切换发音人，
 * 因此这里通过 TTS 的 speed 参数 + InnerAudioContext 的 playbackRate
 * 组合出不同的听感档位（语速/音调真实变化）。
 */
var VOICES = [
  { id: 'standard', name: '标准播报', desc: '清晰自然', speed: 1.0, rate: 1.0 },
  { id: 'gentle', name: '温柔舒缓', desc: '慢速轻柔', speed: 0.8, rate: 0.88 },
  { id: 'steady', name: '沉稳有力', desc: '略低沉', speed: 0.9, rate: 0.93 },
  { id: 'cheerful', name: '轻快明亮', desc: '快速清脆', speed: 1.2, rate: 1.18 }
]

function getVoice(id) {
  for (var i = 0; i < VOICES.length; i++) {
    if (VOICES[i].id === id) return VOICES[i]
  }
  return VOICES[0]
}

function emptyState() {
  return { tasks: [], voice: 'standard', tick: true }
}

function getState() {
  var s = wx.getStorageSync(KEY)
  if (!s || typeof s !== 'object') return emptyState()
  if (!Array.isArray(s.tasks)) s.tasks = []
  if (!s.voice) s.voice = 'standard'
  if (typeof s.tick !== 'boolean') s.tick = true
  return s
}

function save(state) {
  wx.setStorageSync(KEY, state)
  return state
}

function genId() {
  return 't' + Date.now() + Math.floor(Math.random() * 1000)
}

/** 任务时长（秒） */
function taskSeconds(task) {
  var v = Number(task.value) || 0
  return task.unit === 'second' ? v : v * 60
}

/** 任务时长文案，如 "5 分钟" / "30 秒" */
function taskLabel(task) {
  return (task.value || 0) + (task.unit === 'second' ? ' 秒' : ' 分钟')
}

function totalSeconds(tasks) {
  var sum = 0
  for (var i = 0; i < tasks.length; i++) sum += taskSeconds(tasks[i])
  return sum
}

function addTask(task) {
  var s = getState()
  s.tasks.push({
    id: genId(),
    name: task.name || '未命名任务',
    value: Number(task.value) || 1,
    unit: task.unit === 'second' ? 'second' : 'minute'
  })
  return save(s)
}

function updateTask(id, patch) {
  var s = getState()
  for (var i = 0; i < s.tasks.length; i++) {
    if (s.tasks[i].id === id) {
      if (patch.name !== undefined) s.tasks[i].name = patch.name
      if (patch.value !== undefined) s.tasks[i].value = Number(patch.value)
      if (patch.unit !== undefined) s.tasks[i].unit = patch.unit
      break
    }
  }
  return save(s)
}

function removeTask(id) {
  var s = getState()
  s.tasks = s.tasks.filter(function (t) { return t.id !== id })
  return save(s)
}

/** 上移 / 下移（组合任务顺序即执行顺序） */
function moveTask(id, offset) {
  var s = getState()
  var idx = -1
  for (var i = 0; i < s.tasks.length; i++) { if (s.tasks[i].id === id) { idx = i; break } }
  var target = idx + offset
  if (idx < 0 || target < 0 || target >= s.tasks.length) return s
  var tmp = s.tasks[idx]
  s.tasks[idx] = s.tasks[target]
  s.tasks[target] = tmp
  return save(s)
}

function setVoice(voiceId) {
  var s = getState()
  s.voice = voiceId
  return save(s)
}

function setTick(on) {
  var s = getState()
  s.tick = !!on
  return save(s)
}

function clearTasks() {
  var s = getState()
  s.tasks = []
  return save(s)
}

module.exports = {
  VOICES: VOICES,
  getVoice: getVoice,
  getState: getState,
  save: save,
  addTask: addTask,
  updateTask: updateTask,
  removeTask: removeTask,
  moveTask: moveTask,
  setVoice: setVoice,
  setTick: setTick,
  clearTasks: clearTasks,
  taskSeconds: taskSeconds,
  taskLabel: taskLabel,
  totalSeconds: totalSeconds
}
