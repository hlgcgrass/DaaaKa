App({
  globalData: {
    version: '1.0.0'
  },
  onLaunch: function () {
    // 云开发初始化（可选：教育时政已改为纯前端模式，不依赖云开发也能正常运行）
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true })
    }
  }
})
