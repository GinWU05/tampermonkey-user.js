# Tampermonkey Userscripts

[English](README.md) | [简体中文](README.zh-CN.md)

让网页更顺手的一些油猴脚本：沉浸阅读、一键复制、自动化小工具、按需启用的暗色模式。

**依赖：** [Tampermonkey](https://www.tampermonkey.net/)、[Violentmonkey](https://violentmonkey.github.io/) 或其他兼容的脚本管理器。

---

## 脚本列表

### 📖 阅读 & 内容体验

**沉浸阅读（for微信读书）**

隐藏干扰 UI、调整阅读宽度、自动翻页、自定义主题、AI 问书全屏模式。

适用 weread.qq.com/web/reader/*

[安装](https://greasyfork.org/scripts/536846) · [文档](weread-immersive/README.md)

**微信读书深色主题修复**

强制微信读书 body 使用深色主题 class，并将首页卡片改为深色。

适用 weread.qq.com/*

**Folo 功能扩展**

Folo 网页版个性化扩展。当前功能：完全禁用内置阅读器——单击或 Enter 在新标签页打开原文并标记已读，J/K/↑/↓ 在列表内移动选中。

适用 app.folo.is

[文档](folo-extensions/README.md)

---

### 🔗 分享 & 复制

**推文复制分享**

一键复制推文为更友好的分享格式 — 保留换行和作者信息，与沉浸翻译配合良好。

适用 twitter.com / x.com

[安装](https://greasyfork.org/scripts/482936) · [文档](share-tweet-copy/README.md)

**Inoreader 原文链接**

在 Inoreader 网页版帮助打开原文链接。

适用 inoreader.com

[安装](https://greasyfork.org/scripts/483381)

---

### ▶️ 自动播放 & 自动化

**超星学习通自动播放**

超星 MOOC 视频播放完毕后自动切换到下一节。

适用 mooc1.chaoxing.com

[文档](chaoxing-mooc-auto-player/README.md)

**红果视频自动下一集**

红果视频自动下一集，并尝试自动全屏。

适用 hongguoguo.tv

---

### 🛠️ 开发辅助

**Swagger 标题解码**

Swagger UI 页面的 URL 编码标题解码，并设置为可读的 `document.title`。

适用 `*://*/*swagger/index.html?urls.primaryName=*`

**AnyRouter 模型可用性检测**

从已登录的浏览器会话检查 AnyRouter 模型可用性。

适用 anyrouter.top

---

### 🎨 UI & 主题

**Sumbuddy 深色模式**

为 Sumbuddy 添加暗色模式支持，与 Dark Reader 完全兼容。匹配范围较广 — 建议按需启用。

适用 所有站点（⚠️ 手动切换）

**Hermchats 对话批量删除**

通过 Tampermonkey 菜单命令一键删除 Hermchats 上的**所有**对话。破坏性操作，谨慎使用。

适用 hermchats.com

---

## 安装

1. 安装脚本管理器：
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [ScriptCat](https://github.com/scriptscat/scriptcat)
2. 点击上方对应脚本的安装链接，或直接打开 `.user.js` 文件。
3. 访问匹配的网站，脚本自动生效。

> **Chrome/Edge 提示：** 如果扩展提示警告，进入 `chrome://extensions`，开启 **开发者模式**，按提示授权即可。

---

## 上架状态

| 脚本 | 状态 | 说明 |
|---|---|---|
| 推文复制分享 | 已上架 [#482936](https://greasyfork.org/scripts/482936) | 从本仓库 Webhook 同步 |
| Inoreader 原文链接 | 已上架 [#483381](https://greasyfork.org/scripts/483381) | 从本仓库 Webhook 同步 |
| 沉浸阅读（for微信读书） | 已上架 [#536846](https://greasyfork.org/scripts/536846) | 从本仓库 Webhook 同步 |
| Folo 功能扩展 | 待上架 | 有普适价值，等作者手动首发 |
| 微信读书深色主题修复 | 待上架 | 有普适价值，等作者手动首发 |
| Swagger 标题解码 | 待上架 | 有普适价值，等作者手动首发 |
| Sumbuddy 深色模式 | 不上架 | 全站匹配，需手动开关 |
| 红果视频自动下一集 | 不上架 | 个人向，站点小众 |
| Hermchats 对话批量删除 | 不上架 | 个人向，站点小众 |
| 超星学习通自动播放 | 不上架 | 个人向 |
| AnyRouter 模型可用性检测 | 不上架 | 依赖已登录会话 |

上架流程和 Webhook 同步说明见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 开发

无需构建，直接编辑 `<dir>/script.user.js`。

1. `sh dev.sh` 在 `http://localhost:3000` 起一个指向仓库根目录的本地服务。
2. 在 Tampermonkey 中安装对应脚本的 `dev.user.js`。它通过 `@require` 加载 `http://localhost:3000/<dir>/script.user.js`，每次刷新页面都会拉取当前文件。

目前有 dev 加载器的是 `share-tweet-copy/dev.user.js` 和 `weread-immersive/dev.user.js`。要给其他脚本加一个，复制模板 `_utils/dev.local.js` 即可。

`npm test` 会按 [CONTRIBUTING.md](CONTRIBUTING.md) 中的模板校验所有脚本头部，CI 跑同一个检查。

---

## 项目结构

```
tampermonkey-user.js/
├── .github/workflows/           # CI：push / PR 时跑 npm test
├── _utils/
│   ├── check-metadata.mjs       # 头部校验器（npm test）
│   └── dev.local.js             # dev.user.js 模板
├── docs/plans/                  # 设计笔记
├── weread-immersive/            # 微信读书沉浸阅读
├── weread-dark-theme/           # 微信读书深色主题修复
├── folo-extensions/             # Folo 网页版功能扩展
├── share-tweet-copy/            # 推文复制格式化
├── chaoxing-mooc-auto-player/   # 超星 MOOC 自动播放
├── inoreader-open-link/         # Inoreader 原文链接
├── decode-swagger-url-and-set-title/  # Swagger 标题解码
├── hongguoguo-auto-next/        # 红果视频自动下一集
├── hermchats-dialog-cleaner/    # Hermchats 对话批量删除
├── sumbuddy-dark/               # Sumbuddy 暗色模式
├── anyrouter-model-checker/     # AnyRouter 模型检查
├── CONTRIBUTING.md              # 头部规范、开发流程、上架流程
├── package.json                 # npm test → 元数据校验
└── dev.sh                       # dev.user.js 用的本地服务
```

每个脚本目录包含 `script.user.js`，可选 `dev.user.js`、`README.md` 和 `docs/`。

---

## 兼容性

**管理器：** Tampermonkey · Violentmonkey · ScriptCat

**浏览器：** Chrome · Edge · Firefox · Safari（需管理器支持）· 支持扩展的 Android 浏览器

使用 GM API 的脚本在不同管理器间可能有细微差异，依赖高级功能时请自行测试。

**iOS：** Safari + [Stay](https://apps.apple.com/app/stay-for-safari/id1591620171)。使用推文复制分享时必须先在 Safari 里登录 x.com，否则 x.com 返回的是脚本无法识别的预览页 —— 详见[该脚本 README](share-tweet-copy/README.md#mobile)。

---

## 贡献

Bug 和建议欢迎开 issue。PR 保持单脚本单改为宜。新脚本必须通过 `npm test` 的头部校验，并附简要 README，有截图更佳。头部模板、版本号规则和上架流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 许可证

MIT — 见 [LICENSE](LICENSE)。
