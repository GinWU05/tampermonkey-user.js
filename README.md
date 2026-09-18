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

[Install](https://greasyfork.org/scripts/536846) · [Docs](weread-immersive/README.md)

**WeRead Dark Theme Fix**

Forces WeRead's dark theme class on body and darkens the index page cards.

Runs on weread.qq.com/*

[Install](https://greasyfork.org/scripts/596365)

**Folo Extensions**

Personal tweaks for the Folo web app. Currently: fully disables the built-in reader — click or Enter opens the original in a new tab and marks it read; J/K/↑/↓ move the selection.

Runs on app.folo.is

[Install](https://greasyfork.org/scripts/596364) · [Docs](folo-extensions/README.md)

[Docs](folo-extensions/README.md)

---

### 🔗 Share & Copy

**Share Tweet Copy**

Copy tweets in a cleaner, quote-ready format — preserves line breaks and author handle, plays nice with Immersive Translate.

Runs on twitter.com / x.com

[Install](https://greasyfork.org/scripts/482936) · [Docs](share-tweet-copy/README.md)

**Inoreader Open Link**

Helps open original article links in Inoreader's web interface.

Runs on inoreader.com

[Install](https://greasyfork.org/scripts/483381)

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

**Swagger URL Title Decoder**

Decodes URL-encoded titles for Swagger UI pages and sets a readable `document.title`.

Runs on `*://*/*swagger/index.html?urls.primaryName=*`

[Install](https://greasyfork.org/scripts/596366)

**AnyRouter Model Checker**

Checks AnyRouter model availability from a logged-in browser session.

Runs on anyrouter.top

---

### 🎨 UI & Themes

**Sumbuddy Dark**

Dark mode support for Sumbuddy, fully compatible with Dark Reader. Wide match — enable only when needed.

Runs on all sites (⚠️ toggle manually)

**Hermchats Dialog Cleaner**

Deletes **all** chat conversations on Hermchats via a Tampermonkey menu command. Destructive — use with care.

Runs on hermchats.com

---

## Install

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [ScriptCat](https://github.com/scriptscat/scriptcat)
2. Click the install link next to any script above, or open the `.user.js` file directly.
3. Visit a matching site — the script runs automatically.

> **Chrome/Edge note:** If your browser warns about extensions, go to `chrome://extensions`, enable **Developer mode**, and follow the prompt to grant access.

---

## Publishing

| Script | Status | Notes |
|---|---|---|
| Share Tweet Copy | Published [#482936](https://greasyfork.org/scripts/482936) | Webhook sync from this repo |
| Inoreader Open Link | Published [#483381](https://greasyfork.org/scripts/483381) | Webhook sync from this repo |
| Immersive Reading (for WeRead) | Published [#536846](https://greasyfork.org/scripts/536846) | Webhook sync from this repo |
| Folo Extensions | Published [#596364](https://greasyfork.org/scripts/596364) | Webhook sync from this repo |
| WeRead Dark Theme Fix | Published [#596365](https://greasyfork.org/scripts/596365) | Webhook sync from this repo |
| Swagger URL Title Decoder | Published [#596366](https://greasyfork.org/scripts/596366) | Webhook sync from this repo |
| Sumbuddy Dark | Not publishing | Matches every site; toggle manually |
| Hongguoguo Auto Next | Not publishing | Personal use, niche site |
| Hermchats Dialog Cleaner | Not publishing | Personal use, niche site |
| Chaoxing MOOC Auto Player | Not publishing | Personal use |
| AnyRouter Model Checker | Not publishing | Depends on a logged-in session |

How publishing and webhook sync work is described in [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Develop

No build step — edit `<dir>/script.user.js` directly.

1. `sh dev.sh` serves the repo root at `http://localhost:3000`.
2. Install the script's `dev.user.js` in Tampermonkey. It `@require`s `http://localhost:3000/<dir>/script.user.js`, so each page reload pulls your current file.

Dev loaders exist for `share-tweet-copy/dev.user.js` and `weread-immersive/dev.user.js`. To add one for another script, copy the template `_utils/dev.local.js`.

`npm test` validates every script header against the template in [CONTRIBUTING.md](CONTRIBUTING.md). CI runs the same check.

---

## Project Layout

```
tampermonkey-user.js/
├── .github/workflows/           # CI: npm test on push / PR
├── _utils/
│   ├── check-metadata.mjs       # Header validator (npm test)
│   └── dev.local.js             # dev.user.js template
├── docs/plans/                  # Design notes
├── weread-immersive/            # WeRead immersive reading
├── weread-dark-theme/           # WeRead dark mode fix
├── folo-extensions/             # Folo web app tweaks
├── share-tweet-copy/            # Tweet copy formatter
├── chaoxing-mooc-auto-player/   # Chaoxing auto-advance
├── inoreader-open-link/         # Inoreader link helper
├── decode-swagger-url-and-set-title/  # Swagger title decoder
├── hongguoguo-auto-next/        # Hongguoguo auto-next
├── hermchats-dialog-cleaner/    # Hermchats cleanup
├── sumbuddy-dark/               # Sumbuddy dark mode
├── anyrouter-model-checker/     # AnyRouter model checker
├── CONTRIBUTING.md              # Header spec, dev flow, publishing
├── package.json                 # npm test → _utils/check-metadata.mjs
└── dev.sh                       # Local server for dev.user.js
```

Each script directory contains `script.user.js`, plus optional `dev.user.js`, `README.md`, and `docs/`.

---

## Compatibility

**Managers:** Tampermonkey · Violentmonkey · ScriptCat

**Browsers:** Chrome · Edge · Firefox · Safari (with compatible manager) · Android browsers with extension support

Scripts using GM APIs may behave slightly differently across managers. Test on your setup if you rely on advanced features.

**iOS:** Safari + [Stay](https://apps.apple.com/app/stay-for-safari/id1591620171). For Share Tweet Copy you must be logged in to x.com in Safari, otherwise x.com serves a preview page the script cannot hook into — see [its README](share-tweet-copy/README.md#mobile).

---

## Contributing

Bug reports and ideas — open an issue. PRs welcome; keep changes scoped to one script per PR. New scripts must pass the header check (`npm test`) and should include a basic README and a screenshot if applicable. See [CONTRIBUTING.md](CONTRIBUTING.md) for the header template, versioning, and publishing flow.

---

## License

MIT — see [LICENSE](LICENSE).
