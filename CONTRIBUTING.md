# Contributing

This document is the source of truth for how scripts in this repository are named, versioned, checked, and published. `npm test` enforces most of it; the rest is convention described here.

## Repository layout & naming

```
<dir>/script.user.js   # the userscript; this exact path is what GreasyFork syncs
<dir>/dev.user.js      # optional local dev loader; never published
<dir>/README.md        # optional per-script docs (synced to GreasyFork "Additional info")
<dir>/docs/            # optional screenshots / GIFs referenced by the README
```

- One script per directory. Directory names are `kebab-case` and match the script's purpose (e.g. `share-tweet-copy`).
- The main script file is always `<dir>/script.user.js`. Do not rename it — the GreasyFork webhook matches on this path.
- The dev loader, if present, is always `<dir>/dev.user.js`. `_utils/dev.local.js` is the template to copy from.
- `docs/plans/` holds design notes / development prompts. `_utils/` holds repo tooling.

## Userscript header template

Every `<dir>/script.user.js` starts with this block. Field order is part of the spec. Fields marked `(opt)` may be omitted; everything else is required.

```
// ==UserScript==
// @name              <English Title Case name>
// @name:zh-CN        <中文名>
// @namespace         https://screw-hand.com/
// @version           x.y.z
// @description       <English one-liner>
// @description:zh-CN <中文一句话>
// @author            GinWU
// @contributor       (opt)
// @license           MIT
// @homepageURL       https://github.com/screw-hand/tampermonkey-user.js/tree/main/<dir>
// @supportURL        https://github.com/screw-hand/tampermonkey-user.js/issues
// @icon              (opt)
// @match             <at least one>
// @run-at            (opt)
// @grant             <at least one; use `none` if no GM API is used>
// @downloadURL       (only once published) https://update.greasyfork.org/scripts/<id>/script.user.js
// @updateURL         (only once published) https://update.greasyfork.org/scripts/<id>/script.meta.js
// ==/UserScript==
```

Rules:

- `@name` is English and must not contain CJK characters. `@name:zh-CN` is Chinese and must contain CJK characters. GreasyFork indexes both, so the script is searchable on both `/en` and `/zh-CN`.
- `@description` is English; `@description:zh-CN` is Chinese. Both are required and should describe the same behavior.
- `@author` is exactly `GinWU`. `@namespace` is exactly `https://screw-hand.com/`. `@license` is exactly `MIT`.
- `@homepageURL` points at the script's directory on `main`. `@supportURL` points at the repo issues page. Use these keys, not the legacy `@homepage`.
- `@version` is strict three-part semver (`0.4.7`, not `0.4` or `2025-03-12`).
- At least one `@match` and at least one `@grant`. Write `@grant none` explicitly when no GM API is used.
- Other keys (`@require`, `@connect`, `@noframes`, …) are allowed; place them after `@grant` and before `@downloadURL`.
- `@downloadURL` / `@updateURL` are added only after the script is published on GreasyFork. Both must use the same script id, ending in `script.user.js` and `script.meta.js` respectively. Unpublished scripts omit both keys.

Dev loaders (`<dir>/dev.user.js`) follow a smaller template — see `_utils/dev.local.js`. Their `@name` starts with `DEV `, `@version` is `0.0.0`, and `@require` is `http://localhost:3000/<dir>/script.user.js`. Mirror the `@match`, `@run-at`, and `@grant` lines of the main script (a `@require`d script does not bring its own grants). If the loader body itself calls extra GM APIs (e.g. `GM_setValue` to inject dev config), grant those too. Keep exactly one `@require`; alternatives belong in comments inside the body.

## Versioning

- Any change to `<dir>/script.user.js` — including header-only changes — must bump `@version`. GreasyFork and userscript managers only pick up updates when the version increases.
- Patch (`x.y.Z`) for fixes and header/metadata changes, minor (`x.Y.0`) for new features, major (`X.0.0`) for behavior changes users must re-learn.
- No changelog file is kept. Describe user-facing features in the script's README instead.
- A script that once used a date version (e.g. `2025-03-12`) must move to a `YYYY.M.D` semver that still sorts above it (e.g. `2026.9.18`). Managers compare the leading integer of each dot-separated part, so `1.0.0` would be a downgrade and existing installs would never update again.

## Local development

No build step. Edit `<dir>/script.user.js` directly and let the browser reload it via the dev loader:

1. `sh dev.sh` — serves the repo root at `http://localhost:3000` (uses `npx serve`).
2. In Tampermonkey, install `<dir>/dev.user.js`. It `@require`s `http://localhost:3000/<dir>/script.user.js`, so every page reload pulls the current file.
3. Open a matching page and iterate. Use DevTools as usual.

Notes:

- No special Tampermonkey permission is needed for `http://localhost:3000`. Only if you switch to the commented `file:///` `@require` alternative must Tampermonkey be allowed to access file URLs (see [FAQ Q204](https://www.tampermonkey.net/faq.php#Q204)).
- Do not enable the published GreasyFork version and the dev loader at the same time — they will both run.
- If a directory has no `dev.user.js` yet, copy `_utils/dev.local.js`, replace the `<dir>` / `<English name>` placeholders, and mirror the main script's `@match` / `@run-at` / `@grant` lines.
- Tampermonkey's [Rapid development](https://www.tampermonkey.net/index.php?browser=chrome&locale=en#rapid-development) mode (Tampermonkey Editors + vscode.dev) is an alternative if you prefer editing inside the browser.

## Checks

```sh
npm test
```

Runs `_utils/check-metadata.mjs` (zero-dependency, Node 22). It scans every top-level non-hidden directory (except `_utils`, `docs`, `node_modules`, `.github`, `.hermes`) for `script.user.js` and `dev.user.js`, parses the header, and validates it against the template above.

For `script.user.js`: required keys; exact `@author` / `@namespace` / `@license` / `@supportURL` values; `@homepageURL` matching the directory; strict semver; CJK rules for `@name` / `@name:zh-CN`; non-empty `@description` / `@description:zh-CN` / `@match` / `@grant` values; key order, including that any other key (`@require`, `@connect`, `@noframes`, …) sits after the last `@grant` and before `@downloadURL`; the legacy keys `@homepage`, `@name:en`, `@description:en` are rejected; `@downloadURL` / `@updateURL` must be set together, use the GreasyFork `script.user.js` / `script.meta.js` form, and share the same script id.

For `dev.user.js`: `@name` starts with `DEV `; exact `@author` / `@namespace` / `@license`; `@version` is `0.0.0`; the `@match` set equals the main script's; `@run-at` equals the main script's (both absent counts as equal); the `@grant` set includes every grant of the main script (a main script with `@grant none` only requires the loader to have at least one `@grant`); exactly one `@require`, pointing at `http://localhost:3000/<dir>/script.user.js`.

Scan rules: a directory that contains any `*.user.js` but no `script.user.js` is an error; finding no `script.user.js` at all is an error.

All violations are listed as `file: message` before a non-zero exit. On success it prints one `<path>  <name> @ <version>` line per file.

CI (`.github/workflows/ci.yml`) runs the same command on every push and pull request. Fix the header before opening a PR.

## Publishing to GreasyFork

Publishing is manual and done by the author. The repository is the source; GreasyFork pulls from it.

**First publish**

1. On GreasyFork, *Post a new script* → *Sync from a URL* with `https://github.com/screw-hand/tampermonkey-user.js/raw/main/<dir>/script.user.js`.
2. Open the script's *Admin* page → *Source code sync* → choose **Webhook** and save.
3. GreasyFork's webhook URL and secret live on your user page → *Webhook info* (`https://greasyfork.org/users/webhook-info`), not on the script's Admin page. In the GitHub repo, *Settings → Webhooks*, make sure a webhook with that URL and secret exists (one webhook serves every synced script in this repo). Check *Recent Deliveries* if a push does not show up on GreasyFork.
4. Optionally, under *Additional info*, sync `https://github.com/screw-hand/tampermonkey-user.js/raw/main/<dir>/README.md` as Markdown so the GreasyFork page mirrors the README. Images in a per-script README must use absolute `https://raw.githubusercontent.com/screw-hand/tampermonkey-user.js/main/<dir>/...` URLs; relative paths break on GreasyFork.
5. Back in the repo: add `@downloadURL` / `@updateURL` with the new script id, bump `@version`, add the install link `https://greasyfork.org/scripts/<id>` to the script card in both READMEs, and move the script to *Published* in all three status tables (README.md, README.zh-CN.md, and the table below).

**Subsequent updates**

Push to `main`. The webhook triggers a sync of `<dir>/script.user.js`. If GreasyFork shows a stale *Last successful sync* date, open *Admin* and use *Update and sync now*, then check the GitHub webhook deliveries.

Install links always use the locale-free form `https://greasyfork.org/scripts/<id>`.

## Publishing status

| Script | Status | Notes |
|---|---|---|
| share-tweet-copy | Published [#482936](https://greasyfork.org/scripts/482936) | Webhook sync |
| inoreader-open-link | Published [#483381](https://greasyfork.org/scripts/483381) | Webhook sync |
| weread-immersive | Published [#536846](https://greasyfork.org/scripts/536846) | Webhook sync |
| folo-extensions | To publish | General-purpose; awaiting first manual publish |
| weread-dark-theme | To publish | General-purpose; awaiting first manual publish |
| decode-swagger-url-and-set-title | To publish | General-purpose; awaiting first manual publish |
| sumbuddy-dark | Not publishing | Matches `*://*/*` (every site); meant to be toggled manually |
| hongguoguo-auto-next | Not publishing | Personal use, niche site |
| hermchats-dialog-cleaner | Not publishing | Personal use, niche site |
| chaoxing-mooc-auto-player | Not publishing | Personal use |
| anyrouter-model-checker | Not publishing | Depends on a logged-in AnyRouter session |
