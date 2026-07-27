// 发布上线：发布最近一次「审核通过」的版本到线上
// 前置：submit-audit.js 提交且微信审核已通过
// 用法：WX_APPID=wxXXXX WX_SECRET=xxxx node release.js
const { request, getAccessToken } = require('./common')

async function main() {
  const token = await getAccessToken()

  // 可选：先查审核状态，确认已通过
  const status = await request('GET', '/wxa/get_latest_audit_status?access_token=' + token)
  console.log('当前审核状态：', JSON.stringify(status))

  if (status.status !== 0 && status.status !== '0') {
    console.error('⚠️ 最近一次审核尚未通过（status=' + status.status + '），无法发布。')
    console.error('审核通过后再运行本脚本。')
    process.exit(1)
  }

  const res = await request('POST', '/wxa/release?access_token=' + token, {})
  if (res.errcode) {
    console.error('❌ 发布失败：', res)
    process.exit(1)
  }
  console.log('🎉 发布成功，小程序已上线！')
}

main().catch(function (err) {
  console.error('❌ 出错：', err)
  process.exit(1)
})
