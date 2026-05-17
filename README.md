# Tampermonkey Userscripts

[English](README.md) | [简体中文](README.zh-CN.md)

A collection of userscripts that make the web a little less annoying — smoother reading, easier sharing, less clicking, and a few site-specific tweaks.

**Requires:** [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or any compatible userscript manager.

---

## Scripts

### 📖 Reading & Content

**沉浸阅读（for微信读书）**
微信读书沉浸阅读：隐藏干扰 UI、调整阅读宽度、自动翻页、自定义主题、AI 问书全屏模式。
适用 weread.qq.com/web/reader/*
[安装](https://greasyfork.org/en/scripts/536846) · [文档](weread-immersive/README.md)

**微信读书 深色主题**
移除 body 上的 `wr_whiteTheme` class，改善微信读书深色模式。
适用 weread.qq.com/*

---

### 🔗 Share & Copy

**share-tweet-copy**
Copy tweets in a cleaner, quote-ready format — preserves line breaks and author handle, plays nice with Immersive Translate.
适用 twitter.com · x.com
[安装](https://greasyfork.org/scripts/482936) · [文档](share-tweet-copy/README.md)

**inoreader-open-link**
Helps open original article links in Inoreader's web interface.
适用 inoreader.com

---

### ▶️ Auto-Play & Automation

**刷课脚本（chaoxing-mooc-auto-player）**
超星 MOOC 视频播放完毕后自动切换到下一节。
适用 mooc1.chaoxing.com
[文档](chaoxing-mooc-auto-player/README.md)

**Hongguoguo Auto Next**
红果视频自动下一集，并尝试自动全屏。
适用 hongguoguo.tv

---

### 🛠️ Developer Tools

**decode-swagger-url-and-set-title**
Swagger UI 页面的 URL 编码标题解码，并设置为可读的 `document.title`。
适用 *swagger*/index.html?urls.primaryName=*

**AnyRouter Model Checker**
从已登录的浏览器会话检查 AnyRouter 模型可用性。
适用 anyrouter.top

---

### 🎨 UI & Themes

**Sumbuddy Dark**
为 Sumbuddy 网站添加暗色模式支持，与 Dark Reader 扩展完全兼容。
适用 所有站点（⚠️ 按需启用）

**Hermchats Dialog Cleaner**
清理 Hermchats 上的弹窗对话框。
适用 hermchats.com

---

## Install

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [ScriptCat](https://github.com/scriptcats/scriptcat)
2. Click the install link next to any script above, or open the `.user.js` file directly.
3. Visit a matching site — the script runs automatically.

> **Chrome/Edge note:** If your browser warns about extensions, go to `chrome://extensions`, enable **Developer mode**, and follow the prompt to grant access.

---

## Develop

No build step — edit the `.user.js` files directly.

Dev versions with extra logging are available in each script directory (e.g. `weread-immersive/dev.user.js`, `share-tweet-copy/dev.user.js`).

For local debugging, see `_utils/dev.local.js` and `dev.sh`.

---

## Project Layout

```
tampermonkey-user.js/
├── weread-immersive/        # WeRead immersive reading
├── weread-dark-theme/      # WeRead dark mode fix
├── share-tweet-copy/       # Tweet copy formatter
├── chaoxing-mooc-auto-player/  # Chaoxing auto-advance
├── inoreader-open-link/    # Inoreader link helper
├── decode-swagger-url-and-set-title/  # Swagger title decoder
├── hongguoguo-auto-next/   # Hongguoguo auto-next
├── hermchats-dialog-cleaner/  # Hermchats cleanup
├── sumbuddy-dark/          # Sumbuddy dark mode
├── anyrouter-model-checker/   # AnyRouter model checker
├── _utils/                # Dev helpers
└── docs/                  # Shared assets
```

---

## Compatibility

**Managers:** Tampermonkey · Violentmonkey · ScriptCat
**Browsers:** Chrome · Edge · Firefox · Safari (with compatible manager) · Android browsers with extension support

Scripts using GM APIs may behave slightly differently across managers. Test on your setup if you rely on advanced features.

---

## Contributing

Bug reports and ideas — open an issue.
PRs welcome; keep changes scoped to one script per PR.
New scripts should include: `@name`, `@match`, a basic README, and a screenshot if applicable.

---

## License

ISC — see [LICENSE](LICENSE).