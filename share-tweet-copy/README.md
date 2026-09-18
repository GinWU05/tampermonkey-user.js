# Share Tweet Copy

Share Tweet Copy is a Tampermonkey userscript that allows users to copy the text of a tweet with a single click.


## About

The doc source link is [here](https://github.com/screw-hand/tampermonkey-user.js/blob/main/share-tweet-copy/README.md),
async with [greasyfork additional info](https://greasyfork.org/en/scripts/482936-share-tweet-copy#additional-info).

## Why?

I made this plugin because when we share a tweet, it usually just shows a link. This can feel cold and not very friendly. I wanted something better.
There is another tool called TabCopy that tries to make shared content look nicer. But, I found that it squashes the tweet's lines and doesn't look good.
So, I created `share-tweet-copy`. It's easy to use like TabCopy, but it keeps the tweet's original look. I think this makes sharing more fun and the tweets look nicer.


etc: `https://twitter.com/sama/status/1779517913654808676`.

Using TabCopy to share:
```
Sam Altman on X: "people have happily worked so hard to build stuff for you knowing they would never meet you just hoping that some of the people of the future would continue the quest and build the next branch of the tech tree" / X
https://twitter.com/sama/status/1779517913654808676
```

Using Share Tweet Copy to share:

```
Sam Altman (@sama)

people have happily worked so hard to build stuff for you knowing they would never meet you

just hoping that some of the people of the future would continue the quest and build the next branch of the tech tree

https://twitter.com/sama/status/1779517913654808676
```

## Features
- **One-click Copy**: Effortlessly copy the entire tweet text.
- **Clean Format**: Copy the text in a clean, quote-ready format.
- **Easy to Use**: No complicated setup required, just install and start copying tweets.

## Installation
1. If you haven't already, install the [Tampermonkey](https://www.tampermonkey.net/) extension for your browser.
2. Click [here to install Share Tweet Copy](https://greasyfork.org/scripts/482936-share-tweet-copy) or visit the Greasy Fork page and click "Install this script".
3. Once installed, the script will automatically work on Twitter's website.

## Usage
1. Navigate to a tweet on Twitter.com.
2. Find the clipboard icon (📋) next to the tweet details; click to copy.
3. Paste the text wherever needed.

## Screenshots
|base|hover|
|---|---|
|![base](https://raw.githubusercontent.com/screw-hand/tampermonkey-user.js/main/share-tweet-copy/docs/imgs/1-base.png)|![hover](https://raw.githubusercontent.com/screw-hand/tampermonkey-user.js/main/share-tweet-copy/docs/imgs/2-hover.png)|

|click|paste|
|---|---|
|![click](https://raw.githubusercontent.com/screw-hand/tampermonkey-user.js/main/share-tweet-copy/docs/imgs/3-click.png)|![paste](https://raw.githubusercontent.com/screw-hand/tampermonkey-user.js/main/share-tweet-copy/docs/imgs/4-paste.png)|


## Mobile

Even though many users install the Twitter app for their phones, the sharing format through the Twitter app can be quite plain and not very appealing. However, if you're using a mobile browser that supports the installation of the Tampermonkey extension, you can also use Share Tweet Copy. It will help you copy tweets with a better format, making them look nicer when you share them.

**Recommended Browsers for Mobile with Extension Support**：

**Android**
- Any mobile browser on Android that supports the Tampermonkey extension can be used with `share-tweet-copy`.

**iOS**

Recommended: **Safari + [Stay for Safari](https://apps.apple.com/app/stay-for-safari/id1591620171)**.

1. Install Stay from the App Store and enable it in Settings → Safari → Extensions.
2. Open the [Greasy Fork page](https://greasyfork.org/scripts/482936-share-tweet-copy) in Safari and tap "Install this script" — Stay picks it up.
3. **Log in to x.com in Safari before you expect the icon to show up.** This is the step people miss.

> **Why you must be logged in.** When Safari is not logged in, x.com serves mobile browsers a lightweight server-rendered preview page instead of the real web app. That page has no `#react-root` and none of the hooks this script watches for (`article[role="article"]`, `[data-testid="User-Name"]`, `[data-testid="tweetText"]`), so the copy icon never appears even though Stay has injected the script correctly. Log in, reload the page, and the icon comes back.
>
> **Symptom:** Stay shows the script as enabled on x.com, but no 📋 icon anywhere.
>
> **One-line self-check** (iPhone: Settings → Safari → Advanced → Web Inspector; connect to a Mac over USB; Mac Safari → Develop → *your iPhone* → the x.com tab; run in the console):
>
> ```js
> [document.querySelectorAll('.copy-tweet-button').length, !!document.querySelector('#react-root')]
> ```
>
> `[0, false]` means you are on the logged-out preview page — log in. `[0, true]` means the app loaded but the script did not run — check Stay.

Other iOS options, for the record:

- **Userscripts app** ([quoid/userscripts](https://github.com/quoid/userscripts)): not supported at the moment. It only exposes the Promise-based `GM.getValue` and has no synchronous `GM_getValue`, so this script throws a `ReferenceError` on startup. (Inferred from its source, not device-tested.)
- **Edge for iOS**: extensions are supported since v153, but the only userscript manager tagged for mobile in the Edge Add-ons store is "Stay for Mobile" (same developer as Stay). It is the same runtime, so Safari + Stay is the shorter path.

Runtime notes for maintainers: Stay injects `GM_getValue` / `GM_setValue` / `GM_addStyle` synchronously, but only when they are declared in `@grant` (this script declares the two it uses); its default `@run-at` is `document-end`; it injects as a content script, so x.com's CSP does not block it.

## Advanced

Friendly Integration with [Immersive Translate](https://immersivetranslate.com/): If you use Immersive Translate, the translated content can also be copied along.

```
Sam Altman (@sama)

people have happily worked so hard to build stuff for you knowing they would never meet you

just hoping that some of the people of the future would continue the quest and build the next branch of the tech tree

人们很高兴地努力工作为你创造东西，因为他们知道他们永远不会见到你

只是希望未来的一些人能够继续探索并建立科技树的下一个分支...

https://twitter.com/sama/status/1779517913654808676
```

## Roadmap
- [ ] refactor: use `main` function, more emeerate configuration objects, and [template syntax](https://www.tampermonkey.net/documentation.php) as the need as we can.
- [ ] repost tweet: add the `repost:` string with clipboard in begin. 
- [ ] replay tweet: add the `replay:` string with clipboard in begin. 
- [ ] perf: update cjk regx to use Unicode.
- [ ] options: show mode => setting "how to display copy button", `always` / `hover`
- [ ] options: copy mode => `text` / `image`
- [ ] options: shortcuts => on a tweet detail page (`https://x.com/<user>/status/<id>`), a keyboard shortcut copies the main tweet and shows a notification. An iOS Shortcuts ("Run JavaScript on Web Page", from Safari's share sheet) variant is being explored separately; not shipped.
- [ ] issues template: feature request, bug.
- [ ] later: server-side parsing, option A — official oEmbed, `https://publish.x.com/oembed?url=<tweet url>`. No auth, free, and the docs list "Rate limited: No" (community reports put the CDN anti-abuse threshold around 75 req/min per IP). The response carries `access-control-allow-origin: https://x.com`, so a script running on x.com can `fetch` it directly. Downsides: the body keeps `t.co` short links, no media count, text is truncated past 280 characters, deleted/protected tweets return 404. Source: <https://docs.x.com/x-for-websites/oembed-api>
- [ ] later: server-side parsing, option B — `https://cdn.syndication.twimg.com/tweet-result?id=<id>&token=<token>`. Richer data (expanded links, media, quoted tweet), but undocumented; the `token` algorithm is reverse-engineered and the endpoint could start requiring auth at any time. Backup only, not the main plan.

## Contributing
Contributions are welcome! 
- For bug reports or suggestions, please [open an issue](https://github.com/screw-hand/tampermonkey-user.js/issues/new).
- For pull request, please make sure to read the [contributing guide](https://github.com/screw-hand/tampermonkey-user.js/blob/main/share-tweet-copy/CONTRIBUTING.md) before that.

## Thanks

- [TabCopy](https://tabcopy.com)
- [Immersive Translate](https://immersivetranslate.com/)
- [Tweet to Image Converter: Tweet Screenshots Online | 10015 Tools](https://10015.io/tools/tweet-to-image-converter)
