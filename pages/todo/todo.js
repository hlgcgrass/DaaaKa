const todoStore = require('../../utils/todoStore.js')

Page({
  data: {
    todos: [],
    inputText: '',
    total: 0,
    doneCount: 0,
    leftCount: 0,
    allDone: false
  },

  onShow: function () {
    this.refresh()
  },

  // 读取并排序：未完成在前（最新添加在最上），已完成在后
  refresh: function () {
    let list = todoStore.getTodos().slice()
    list.sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1
      return (b.createdAt || '').localeCompare(a.createdAt || '')
    })
    const doneCount = list.filter(function (t) { return t.done }).length
    const total = list.length
    this.setData({
      todos: list,
      total: total,
      doneCount: doneCount,
      leftCount: total - doneCount,
      allDone: total > 0 && doneCount === total
    })
  },

  onInput: function (e) {
    this.setData({ inputText: e.detail.value })
  },

  addTodo: function () {
    const text = (this.data.inputText || '').trim()
    if (!text) {
      wx.showToast({ title: '写点什么吧', icon: 'none' })
      return
    }
    const res = todoStore.addTodo(text)
    if (res.ok) {
      this.setData({ inputText: '' })
      this.refresh()
    }
  },

  // 键盘「完成/回车」也能添加
  onConfirm: function () {
    this.addTodo()
  },

  toggle: function (e) {
    const id = e.currentTarget.dataset.id
    todoStore.toggleTodo(id)
    this.refresh()
  },

  removeTodo: function (e) {
    const id = e.currentTarget.dataset.id
    const that = this
    wx.showModal({
      title: '删除待办',
      content: '确定删除这条待办吗？',
      confirmColor: '#e91e63',
      success: function (res) {
        if (res.confirm) {
          todoStore.removeTodo(id)
          that.refresh()
        }
      }
    })
  },

  clearDone: function () {
    const that = this
    if (this.data.doneCount === 0) {
      wx.showToast({ title: '没有已完成的项', icon: 'none' })
      return
    }
    wx.showModal({
      title: '清除已完成',
      content: '确定清除 ' + this.data.doneCount + ' 条已完成的待办吗？',
      confirmColor: '#e91e63',
      success: function (res) {
        if (res.confirm) {
          todoStore.clearDone()
          that.refresh()
        }
      }
    })
  }
})
