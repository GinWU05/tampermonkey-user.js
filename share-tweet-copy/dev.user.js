// ==UserScript==
// @name              DEV Share Tweet Copy
// @namespace         https://screw-hand.com/
// @version           0.0.0
// @description       Local dev loader for share-tweet-copy/script.user.js. Not for publishing.
// @author            GinWU
// @license           MIT
// @match             https://twitter.com/*
// @match             https://x.com/*
// @require           http://localhost:3000/share-tweet-copy/script.user.js
// @grant             GM_addStyle
// @grant             GM_getValue
// @grant             GM_setValue
// ==/UserScript==

(function() {
  'use strict';
  /**
   * Alternative @require sources. Swap into the header above when needed.
   * Default is the local server started by `sh dev.sh` (localhost:3000).
   */
  // @require      file:///Users/wu/Documents/code/tampermonkey-user.js/share-tweet-copy/script.user.js
  // @require      https://update.greasyfork.org/scripts/482936/script.user.js

  /* === */
  const USER_TEMPLATE = [
    `{{username}} ({{userId}})`,
    ``,
    `{{tweetText}}`,
    ``,
    `{{mediaCount}}`,
    ``,
    `{{link}}`,
    ``,
    `=========`,
    `power by https://greasyfork.org/scripts/482936`
  ].join('\n');

  GM_setValue("ENV_MODE", "DEV");

  GM_setValue("ENV_USER_TEMPLATE", USER_TEMPLATE);
})();
