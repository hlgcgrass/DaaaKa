App({
  globalData: {
    version: '1.0.0'
  },
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('当前基础库版本过低，请使用 2.2.3 及以上的基础库以使用云能力')
    } else {
      // 云环境 ID：请在微信开发者工具「云开发」控制台创建环境，并把下面的 YOUR_CLOUD_ENV_ID
      // 替换成你的真实环境 ID；或者把该环境设为「默认环境」后，删除 env 这一行即可。
      wx.cloud.init({
        env: 'YOUR_CLOUD_ENV_ID',
        traceUser: true
      })
    }
  }
})
