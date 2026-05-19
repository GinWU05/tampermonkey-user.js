# Tampermonkey Userscripts

[English](README.md) | [简体中文](README.zh-CN.md)

A collection of userscripts that make the web a little less annoying — smoother reading, easier sharing, less clicking, and a few site-specific tweaks.

**Requires:** [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or any compatible userscript manager.

---

## Scripts

### 📖 Reading & Content

**Immersive Reading (for WeRead)**

Hides noise, adjusts reading width, auto-scroll, custom themes, and full-screen AI book Q&A for WeRead.

Runs on weread.qq.com/web/reader/*

[Install](https://greasyfork.org/en/scripts/536846) · [Docs](weread-immersive/README.md)

**WeRead Dark Theme Fix**

Removes the `wr_whiteTheme` class from body, improving WeRead's dark mode behavior.

Runs on weread.qq.com/*

---

### 🔗 Share & Copy

**share-tweet-copy**

Copy tweets in a cleaner, quote-ready format — preserves line breaks and author handle, plays nice with Immersive Translate.

Runs on twitter.com / x.com

[Install](https://greasyfork.org/scripts/482936) · [Docs](share-tweet-copy/README.md)

**inoreader-open-link**

Helps open original article links in Inoreader's web interface.

Runs on inoreader.com

---

### ▶️ Auto-Play & Automation

**Chaoxing MOOC Auto Player**

Auto-advances to the next section when a Chaoxing MOOC video finishes playing.

Runs on mooc1.chaoxing.com

[Docs](chaoxing-mooc-auto-player/README.md)

**Hongguoguo Auto Next**

Auto-advances to the next episode and attempts auto-fullscreen on Hongguoguo.

Runs on hongguoguo.tv

---

### 🛠️ Developer Tools

**decode-swagger-url-and-set-title**

Decodes URL-encoded titles for Swagger UI pages and sets a readable `document.title`.

Runs on */swagger/index.html?urls.primaryName=*

**AnyRouter Model Checker**

Checks AnyRouter model availability from a logged-in browser session.

Runs on anyrouter.top

---

### 🎨 UI & Themes

**Sumbuddy Dark**

Dark mode support for Sumbuddy, fully compatible with Dark Reader. Wide match — enable only when needed.

Runs on all sites (⚠️ toggle manually)

**Hermchats Dialog Cleaner**

Cleans up popup dialogs on Hermchats.

Runs on hermchats.com

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
├── weread-immersive/            # WeRead immersive reading
├── weread-dark-theme/           # WeRead dark mode fix
├── share-tweet-copy/            # Tweet copy formatter
├── chaoxing-mooc-auto-player/   # Chaoxing auto-advance
├── inoreader-open-link/         # Inoreader link helper
├── decode-swagger-url-and-set-title/  # Swagger title decoder
├── hongguoguo-auto-next/        # Hongguoguo auto-next
├── hermchats-dialog-cleaner/    # Hermchats cleanup
├── sumbuddy-dark/               # Sumbuddy dark mode
├── anyrouter-model-checker/     # AnyRouter model checker
├── _utils/                      # Dev helpers
└── docs/                        # Shared assets
```

---

## Compatibility

**Managers:** Tampermonkey · Violentmonkey · ScriptCat

**Browsers:** Chrome · Edge · Firefox · Safari (with compatible manager) · Android browsers with extension support

Scripts using GM APIs may behave slightly differently across managers. Test on your setup if you rely on advanced features.

---

## Contributing

Bug reports and ideas — open an issue. PRs welcome; keep changes scoped to one script per PR. New scripts should include: `@name`, `@match`, a basic README, and a screenshot if applicable.

---

## License

ISC — see [LICENSE](LICENSE).
