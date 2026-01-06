// ==UserScript==
// @name         Hongguoguo Auto Next
// @namespace    https://screw-hand.com/
// @version      0.1.0
// @description  红果视频自动下一集并尝试全屏
// @author       screw-hand
// @icon         https://www.hongguoguo.tv/template/Naifei/static/img/favicon.png
// @match        https://www.hongguoguo.tv/vod/play/id/*/sid/1/nid/*.html
// @run-at       document-idle
// ==/UserScript==

(() => {
  const VIDEO_SELECTOR = 'video.dplayer-video.dplayer-video-current';
  const BIND_ATTR = 'data-hgg-auto-next-bound';

  let isNavigating = false;

  function getNextUrl(currentUrl) {
    try {
      const url = new URL(currentUrl);
      const nidMatch = url.pathname.match(/\/nid\/(\d+)\.html$/);
      if (nidMatch) {
        const nextNid = Number(nidMatch[1]) + 1;
        url.pathname = url.pathname.replace(/\/nid\/\d+\.html$/, `/nid/${nextNid}.html`);
        return url.toString();
      }

      const tailMatch = url.pathname.match(/(\d+)(?=\.html$)/);
      if (!tailMatch) return null;

      const nextNum = Number(tailMatch[1]) + 1;
      url.pathname = url.pathname.replace(/(\d+)(?=\.html$)/, String(nextNum));
      return url.toString();
    } catch (err) {
      return null;
    }
  }

  function requestFullscreen(video) {
    if (!video) return;
    const request =
      video.requestFullscreen ||
      video.webkitRequestFullscreen ||
      video.webkitEnterFullscreen ||
      video.msRequestFullscreen;
    if (request) {
      try {
        request.call(video);
      } catch (err) {
        // ignore fullscreen failures
      }
    }
  }

  function handleEnded() {
    if (isNavigating) return;
    const nextUrl = getNextUrl(window.location.href);
    if (!nextUrl) return;
    isNavigating = true;
    window.location.href = nextUrl;
  }

  function bindVideo(video) {
    if (!video || video.getAttribute(BIND_ATTR) === '1') return;
    video.setAttribute(BIND_ATTR, '1');

    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadedmetadata', () => requestFullscreen(video), { once: true });
    video.addEventListener('canplay', () => requestFullscreen(video), { once: true });
  }

  function scanAndBind() {
    const video = document.querySelector(VIDEO_SELECTOR);
    if (video) bindVideo(video);
  }

  scanAndBind();

  const observer = new MutationObserver(() => {
    scanAndBind();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
