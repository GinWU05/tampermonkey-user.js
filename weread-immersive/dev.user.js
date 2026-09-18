// ==UserScript==
// @name              DEV Immersive Reading (for WeRead)
// @namespace         https://screw-hand.com/
// @version           0.0.0
// @description       Local dev loader for weread-immersive/script.user.js. Not for publishing.
// @author            GinWU
// @license           MIT
// @match             https://weread.qq.com/web/reader/*
// @require           http://localhost:3000/weread-immersive/script.user.js
// @grant             GM_addStyle
// @grant             unsafeWindow
// ==/UserScript==

(function() {
  'use strict';
  /**
   * Alternative @require sources. Swap into the header above when needed.
   * Default is the local server started by `sh dev.sh` (localhost:3000).
   */
  // @require      file:///Users/wu/Documents/code/tampermonkey-user.js/weread-immersive/script.user.js
  // @require      https://update.greasyfork.org/scripts/536846/script.user.js

  console.log('DEV weread-immersive');
})();
