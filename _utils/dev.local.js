// ==UserScript==
// @name              DEV <English name>
// @namespace         https://screw-hand.com/
// @version           0.0.0
// @description       Local dev loader for <dir>/script.user.js. Not for publishing.
// @author            GinWU
// @license           MIT
// @match             <same @match lines as <dir>/script.user.js>
// @run-at            <same @run-at as <dir>/script.user.js, if any>
// @require           http://localhost:3000/<dir>/script.user.js
// @grant             <same @grant lines as <dir>/script.user.js, one per line>
// ==/UserScript==

(function() {
  'use strict';
  /**
   * Template for <dir>/dev.user.js. Copy it into the script directory, replace
   * every <placeholder>, then start the local server with `sh dev.sh`.
   *
   * Alternative @require sources. Swap into the header above when needed.
   */
  // @require      file:///absolute/path/to/tampermonkey-user.js/<dir>/script.user.js
  // @require      https://update.greasyfork.org/scripts/<id>/script.user.js

  console.log('DEV <dir>');
})();
