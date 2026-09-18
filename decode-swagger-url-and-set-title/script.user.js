// ==UserScript==
// @name              Swagger URL Title Decoder
// @name:zh-CN        Swagger 标题解码
// @namespace         https://screw-hand.com/
// @version           1.0.1
// @description       Decode URL-encoded titles for Swagger UI pages and set document.title.
// @description:zh-CN 解码 Swagger UI 页面 URL 中经过编码的标题，并设置为 document.title。
// @author            GinWU
// @license           MIT
// @homepageURL       https://github.com/GinWU05/tampermonkey-user.js/tree/main/decode-swagger-url-and-set-title
// @supportURL        https://github.com/GinWU05/tampermonkey-user.js/issues
// @icon              https://static1.smartbear.co/swagger/media/assets/swagger_fav.png
// @match             *://*/*swagger/index.html?urls.primaryName=*
// @grant             none
// ==/UserScript==

(function() {
  'use strict';

  // Function to decode and set the title
  function decodeAndSetTitle() {
      // Extract 'urls.primaryName' parameter value from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const titleParam = urlParams.get('urls.primaryName');

      if (titleParam) {
          // Decode URL encoded title
          const decodedTitle = decodeURIComponent(titleParam);
          console.log(`Decoding URL parameter: ${titleParam} -> ${decodedTitle}`);
          if (document.title !== decodedTitle) {
              document.title = decodedTitle;
          }
      }
  }

  // Initial decoding and setting of the title
  decodeAndSetTitle();
})();