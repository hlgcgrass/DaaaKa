// 提交审核：基于已上传到开发版的代码
// 前置：先在微信开发者工具/CI 把代码传到开发版；公众平台「设置 -> 服务类目」已配置类目
// 用法：node submit-audit.js
const fs = require('fs')
const path = require('path')
const { request, getAccessToken } = require('./common')

async function main() {
  const token = await getAccessToken()
  console.log('✅ 已获取 access_token')

  // 1. 拉取已配置的服务类目
  const cat = await request('GET', '/wxa/get_category?access_token=' + token)
  if (cat.errcode) {
    console.error('❌ 获取类目失败：', cat)
    console.error('请先在公众平台「设置 -> 服务类目」添加类目（如：工具->效率）')
    process.exit(1)
  }
  const category = cat.category_list[0]
  console.log('使用类目：', category.first_class, category.second_class, category.third_class || '')

  // 2. 读取本项目的页面（自有小程序无法调用 /wxa/get_page，errcode 86000 only third party）
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'))
  const pages = appJson.pages || []
  if (!pages.length) {
    console.error('❌ app.json 中未找到 pages')
    process.exit(1)
  }
  console.log('提交页面（共 ' + pages.length + ' 个）：', pages.join(', '))

  // 3. 构造提交项并提交审核
  const titles = ['习惯打卡', '习惯统计']
  const itemList = pages.map(function (p, i) {
    return {
      address: p,
      title: titles[i] || '习惯打卡',
      tag: '习惯养成工具',
      first_class: category.first_class,
      second_class: category.second_class,
      third_class: category.third_class || ''
    }
  })

  const res = await request('POST', '/wxa/submit_audit?access_token=' + token, {
    item_list: itemList
  })

  if (res.errcode) {
    console.error('❌ 提交审核失败：', res)
    process.exit(1)
  }

  console.log('✅ 提交审核成功！audit_id =', res.auditid)
  console.log('微信通常会在几小时到一天内完成审核，结果会通过模板消息/站内信通知。')
  console.log('审核通过后运行：node release.js 即可发布上线。')
}

main().catch(function (err) {
  console.error('❌ 出错：', err)
  process.exit(1)
})
