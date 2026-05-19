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

[安装](https://greasyfork.org/en/scripts/536846) · [文档](weread-immersive/README.md)

**微信读书 深色主题**

移除 body 上的 `wr_whiteTheme` class，改善微信读书深色模式表现。

适用 weread.qq.com/*

---

### 🔗 分享 & 复制

**share-tweet-copy**

一键复制推文为更友好的分享格式 — 保留换行和作者信息，与沉浸翻译配合良好。

适用 twitter.com / x.com

[安装](https://greasyfork.org/scripts/482936) · [文档](share-tweet-copy/README.md)

**inoreader-open-link**

在 Inoreader 网页版帮助打开原文链接。

适用 inoreader.com

---

### ▶️ 自动播放 & 自动化

**刷课脚本（chaoxing-mooc-auto-player）**

超星 MOOC 视频播放完毕后自动切换到下一节。

适用 mooc1.chaoxing.com

[文档](chaoxing-mooc-auto-player/README.md)

**Hongguoguo Auto Next**

红果视频自动下一集，并尝试自动全屏。

适用 hongguoguo.tv

---

### 🛠️ 开发辅助

**decode-swagger-url-and-set-title**

Swagger UI 页面的 URL 编码标题解码，并设置为可读的 `document.title`。

适用 */swagger/index.html?urls.primaryName=*

**AnyRouter Model Checker**

从已登录的浏览器会话检查 AnyRouter 模型可用性。

适用 anyrouter.top

---

### 🎨 UI & 主题

**Sumbuddy Dark**

为 Sumbuddy 添加暗色模式支持，与 Dark Reader 完全兼容。匹配范围较广 — 建议按需启用。

适用 所有站点（⚠️ 手动切换）

**Hermchats Dialog Cleaner**

清理 Hermchats 上的弹窗对话框。

适用 hermchats.com

---

## 安装

1. 安装脚本管理器：
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [ScriptCat](https://github.com/scriptcats/scriptcat)
2. 点击上方对应脚本的安装链接，或直接打开 `.user.js` 文件。
3. 访问匹配的网站，脚本自动生效。

> **Chrome/Edge 提示：** 如果扩展提示警告，进入 `chrome://extensions`，开启 **开发者模式**，按提示授权即可。

---

## 开发

无需构建，直接编辑 `.user.js` 文件。

各脚本目录下有带额外日志的 dev 版本（如 `weread-immersive/dev.user.js`、`share-tweet-copy/dev.user.js`）。

本地调试参考 `_utils/dev.local.js` 和 `dev.sh`。

---

## 项目结构

```
tampermonkey-user.js/
├── weread-immersive/            # 微信读书沉浸阅读
├── weread-dark-theme/           # 微信读书深色主题修复
├── share-tweet-copy/            # 推文复制格式化
├── chaoxing-mooc-auto-player/   # 超星 MOOC 自动播放
├── inoreader-open-link/         # Inoreader 原文链接
├── decode-swagger-url-and-set-title/  # Swagger 标题解码
├── hongguoguo-auto-next/        # 红果视频自动下一集
├── hermchats-dialog-cleaner/    # Hermchats 弹窗清理
├── sumbuddy-dark/               # Sumbuddy 暗色模式
├── anyrouter-model-checker/     # AnyRouter 模型检查
├── _utils/                      # 开发辅助工具
└── docs/                        # 共享资源
```

---

## 兼容性

**管理器：** Tampermonkey · Violentmonkey · ScriptCat

**浏览器：** Chrome · Edge · Firefox · Safari（需管理器支持）· 支持扩展的 Android 浏览器

使用 GM API 的脚本在不同管理器间可能有细微差异，依赖高级功能时请自行测试。

---

## 贡献

Bug 和建议欢迎开 issue。PR 保持单脚本单改为宜。新脚本请包含：`@name`、`@match`、简要 README，有截图更佳。

---

## 许可证

ISC — 见 [LICENSE](LICENSE)。
