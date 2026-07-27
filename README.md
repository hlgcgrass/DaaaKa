# 习惯打卡 · 微信小程序 + 半自动发布

一个**纯前端**的工具效率类小程序（习惯打卡，设计参考《原子习惯》），自带一套基于 `miniprogram-ci` 的自动化发布脚本，覆盖 **上传代码 → 提交审核 → 发布上线** 的完整链路。

> ⚠️ **关于"自动发布"的现实约束**
> 微信小程序正式上线**必须经过平台审核**（内容风控），这一步由微信侧执行，任何人都无法跳过，也无法做到 100% 无人值守。本套方案把"上传 + 提交审核 + 发布"全部接好：你跑一条命令上传，再跑一条提交审核，微信审核通过后跑一条发布即可。**唯一需要等待的，是微信的审核结果。**

---

## 功能（参考《原子习惯》）
- 自定义添加打卡事项，**最多 20 个**，可自选图标与颜色
- 每日打卡：完成点一下即打上，再点取消（当天可反复）
- **连续天数（🔥 streak）**：自动计算当前连击与历史最长连击，呼应"别连续错过两次"
- 习惯堆叠（Habit Stacking）：添加时可写"我会在 [时间] 在 [地点] 做 [行为]"，让习惯更具体
- **身份认同**：在「统计」页写下"我想成为的人"，强化动机
- **习惯轨迹**：每个习惯一张「最近 24 周」打卡热力图（整屏可见、无需滚动，最左列含今天并高亮），视觉化你的坚持
- **头像设置**：在「统计」页可用微信头像或相册上传圆形头像
- 本地持久化（`wx.setStorageSync`，卸载重装不丢）

## 项目结构
```
miniprogram-todo/
├── app.js / app.json / app.wxss     # 小程序全局配置
├── project.config.json              # 开发者工具项目配置（appid 为你真实 AppID）
├── sitemap.json
├── pages/index/                     # 打卡主页(T1)：习惯列表 + 每日打卡 + 添加弹窗
├── pages/stats/                     # 统计页(T2)：头像 + 身份宣言 + 打卡日历 + 习惯轨迹
├── utils/store.js                   # 习惯数据层（增删改 / 打卡 / 连击 / 上限）
├── keys/                            # 放上传代码密钥 upload.key（你自己放，已 gitignore）
└── scripts/                         # 自动化发布脚本
    ├── common.js                    # access_token 获取 + 请求封装
    ├── upload.js                    # ① 上传代码到开发版
    ├── submit-audit.js              # ② 提交审核
    ├── release.js                   # ③ 审核通过后发布上线
    └── package.json                 # 依赖 miniprogram-ci
```

---

## 第一步：准备微信侧资料（你来做，需要本人微信扫码）
1. 打开 [微信公众平台](https://mp.weixin.qq.com/) → 注册「小程序」账号（需微信扫码 + 实名/主体信息）。
2. 进入 **开发管理 → 开发设置**，复制你的 **AppID**。
3. 同一页面下载 **上传代码密钥**（「上传代码」区域的密钥），把文件重命名为 `upload.key`，放到本项目的 `keys/` 目录。
4. 同一页面生成 **AppSecret**（保存好，只显示一次），用于提交审核/发布接口。
5. 进入 **设置 → 服务类目**，添加类目（工具类小程序选 `工具 -> 效率` 或类似），提交审核脚本会自动读取。
6. 下载安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（用于本地预览/真机调试）。

---

## 第二步：本地预览（验证功能）
1. 打开微信开发者工具 → 「导入项目」，目录选择本项目根目录。
2. `AppID` 填你的真实 AppID（或先用「测试号 / touristappid」游客模式看看界面）。
3. 编译，模拟器里即可添加习惯、每天打卡、在「统计」页看年度点阵。

---

## 第三步：自动化发布
在 `scripts/` 目录安装依赖：
```bash
cd scripts
npm install
```

配置环境变量后，依次运行三步（把 `wx你的APPID` 和 `你的SECRET` 换成真实值）：

```bash
# macOS / Linux
export WX_APPID=wx你的APPID
export WX_SECRET=你的SECRET

# ① 上传到开发版
WX_APPID=$WX_APPID VERSION=1.0.0 DESC="首次上传" node upload.js

# ② 提交审核（需先在公众平台配好服务类目）
WX_APPID=$WX_APPID WX_SECRET=$WX_SECRET node submit-audit.js

# ③ 微信审核通过后，发布上线
WX_APPID=$WX_APPID WX_SECRET=$WX_SECRET node release.js
```

Windows PowerShell 设置环境变量：
```powershell
$env:WX_APPID="wx你的APPID"
$env:WX_SECRET="你的SECRET"
node upload.js
```

接入 CI（GitHub Actions / 流水线）时，把 `WX_APPID`、`WX_SECRET` 设为仓库 Secrets，`keys/upload.key` 也作为 Secret 文件注入，即可实现推送即上传的半自动流程。

---

## 常见问题
- **上传报 appid 不匹配**：`project.config.json` 里的 `appid` 与 `WX_APPID` 必须一致，且都对应你下载密钥的小程序。
- **提交审核报类目错误**：先去公众平台「服务类目」添加类目，脚本会自动拉取第一个类目；多类目时按需改 `submit-audit.js` 里的 `itemList`。
- **release 报未审核通过**：微信还在审，`get_latest_audit_status` 的 `status` 不是 0，等通过后再跑。

## 想调整功能？
打卡主页(T1)在 `pages/index/`，统计页(T2)在 `pages/stats/`，数据逻辑统一在 `utils/store.js`。改界面改这两个页面的 `wxml/js/wxss` 即可，发布脚本无需改动。

---

## 编程与设计规范（必须遵守）

这些是从实际踩坑中沉淀的原则，**新增/修改任何 UI 都必须遵守**，不允许再出现同类低级错误：

1. **图文混排必须垂直居中对齐**：凡是「图标/形状 + 文字」放在一起（图例、列表项、标签、按钮内图标等），容器一律 `display:flex; align-items:center`，图标 `flex-shrink:0`。不得出现空心圆圈和文字错位、图标偏上/偏下等情况。
2. **输入框必须有可见边框且撑满宽度**：`<input>` 默认不是 100% 宽，必须显式 `width:100%; box-sizing:border-box` 并加边框，否则在弹窗里会变成一条小框看不出是可输入区。
3. **关键信息首屏可见，禁止藏到滚动之后**：横向/纵向排列的内容若超出一屏，必须确保最重要的信息（如"今天"）在首屏就能看到，不能让用户滑动才能看到核心状态。习惯轨迹因此由「全年横向滚动点阵」改为「整屏可见的最近 24 周热力图，今天固定在最左列」。
4. **多状态要用清晰可区分的视觉符号 + 图例**：三态以上（全完成/部分/未做）需用不同形状/颜色区分，并配图例说明，不可只靠颜色（色盲/小屏难辨）。
5. **数量上限要在 UI 上反馈**：如习惯最多 20 个，添加按钮需实时显示「已添加 N/20」并禁用超额添加。
6. **动画的 `animation-name` 必须写在 WXSS 的 class 规则内，禁止写在标签的 inline style 里**：微信小程序只在 class 中解析自定义 `@keyframes` 名，inline 不解析——把 `animation:starBurst0 0.9s ...` 写在标签 style 上动画永远不会播放。正确做法（参考 T1 打卡星星、全部完成 confetti）：class 写 `.xxx { animation: name ... }` + `@keyframes name`，标签 inline 只传 `color` / `animation-delay` 等简单值。

> 页面命名约定：打卡页 = **T1**（`pages/index`），统计页 = **T2**（`pages/stats`）。
