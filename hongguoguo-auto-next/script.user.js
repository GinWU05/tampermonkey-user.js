// ==UserScript==
// @name         Hongguoguo Auto Next
// @namespace    https://screw-hand.com/
// @version      0.1.0
// @description  红果视频自动下一集并尝试全屏
// @author       screw-hand
// @icon         https://www.hongguoguo.tv/template/Naifei/static/img/favicon.png
// @match        https://www.hongguoguo.tv/vod/play/id/*/sid/1/nid/*.html
// @run-at       document-start
// ==/UserScript==

(() => {
  const VIDEO_SELECTOR = 'video.dplayer-video.dplayer-video-current';
  const PLAYER_SELECTOR = '#dplayer, .dplayer';
  const BIND_ATTR = 'data-hgg-auto-next-bound';
  const LAYOUT_ATTR = 'data-hgg-auto-next-layout';
  const MINIMIZE_BTN_ATTR = 'data-hgg-auto-next-min-btn';
  const STYLE_ID = 'hgg-auto-next-style';
  const BALLOON_ID = 'hgg-dplayer-balloon';
  const ROOT_CLASS = 'hgg-dplayer-root';
  const HIDDEN_CLASS = 'hgg-dplayer-hidden';
  const GONE_CLASS = 'hgg-dplayer-gone';
  const BALLOON_SHOW_CLASS = 'hgg-balloon-show';

  let isNavigating = false;
  let isMinimized = false;
  let minimizeTimer = null;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.${ROOT_CLASS} {
  transition: opacity 360ms ease, transform 360ms ease;
  opacity: 1;
  transform: translateY(0);
}
.${HIDDEN_CLASS} {
  opacity: 0;
  transform: translateY(-24px);
  pointer-events: none;
}
.${GONE_CLASS} {
  display: none !important;
}
.hgg-minimize-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  min-width: 26px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.85;
}
.hgg-minimize-btn:hover {
  opacity: 1;
}
#${BALLOON_ID} {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 100000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: #ffb84d;
  color: #111;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 300ms ease, transform 300ms ease;
  cursor: pointer;
  pointer-events: none;
}
#${BALLOON_ID}.${BALLOON_SHOW_CLASS} {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
`;
    const parent = document.head || document.documentElement;
    parent.appendChild(style);
  }

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

  function getPlayerContainer() {
    return document.querySelector(PLAYER_SELECTOR);
  }

  function setPageScrollLocked(locked) {
    if (!document.body) return;
    const bodyStyle = document.body.style;
    const htmlStyle = document.documentElement.style;
    if (locked) {
      bodyStyle.setProperty('margin', '0', 'important');
      bodyStyle.setProperty('overflow', 'hidden', 'important');
      bodyStyle.setProperty('background', '#000', 'important');
      htmlStyle.setProperty('width', '100%', 'important');
      htmlStyle.setProperty('height', '100%', 'important');
      htmlStyle.setProperty('overflow', 'hidden', 'important');
    } else {
      bodyStyle.setProperty('overflow', 'auto', 'important');
      htmlStyle.setProperty('overflow', 'auto', 'important');
    }
  }

  function ensureBalloon() {
    if (!document.body) return null;
    let balloon = document.getElementById(BALLOON_ID);
    if (balloon) return balloon;
    balloon = document.createElement('div');
    balloon.id = BALLOON_ID;
    balloon.textContent = '恢复';
    balloon.title = '恢复播放器';
    balloon.addEventListener('click', (event) => {
      event.preventDefault();
      restorePlayer();
    });
    document.body.appendChild(balloon);
    return balloon;
  }

  function showBalloon() {
    const balloon = ensureBalloon();
    if (!balloon) return;
    balloon.classList.add(BALLOON_SHOW_CLASS);
  }

  function hideBalloon() {
    const balloon = document.getElementById(BALLOON_ID);
    if (!balloon) return;
    balloon.classList.remove(BALLOON_SHOW_CLASS);
  }

  function minimizePlayer() {
    const container = getPlayerContainer();
    if (!container || isMinimized) return;
    isMinimized = true;
    const video = document.querySelector(VIDEO_SELECTOR);
    if (video && !video.paused) video.pause();

    container.classList.add(HIDDEN_CLASS);
    clearTimeout(minimizeTimer);
    minimizeTimer = window.setTimeout(() => {
      if (isMinimized) container.classList.add(GONE_CLASS);
    }, 380);
    setPageScrollLocked(false);
    showBalloon();
  }

  function restorePlayer() {
    const container = getPlayerContainer();
    if (!container || !isMinimized) return;
    isMinimized = false;
    clearTimeout(minimizeTimer);
    container.classList.remove(GONE_CLASS);
    applyPseudoFullscreen();
    void container.offsetWidth;
    container.classList.remove(HIDDEN_CLASS);
    setPageScrollLocked(true);
    hideBalloon();
  }

  function ensureMinimizeButton() {
    const iconsRight = document.querySelector(
      '#dplayer > div.dplayer-controller > div.dplayer-icons.dplayer-icons-right'
    );
    if (!iconsRight) return;
    if (iconsRight.querySelector(`[${MINIMIZE_BTN_ATTR}="1"]`)) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hgg-minimize-btn';
    btn.textContent = 'min';
    btn.title = '最小化';
    btn.setAttribute(MINIMIZE_BTN_ATTR, '1');
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      minimizePlayer();
    });
    iconsRight.insertBefore(btn, iconsRight.firstChild);
  }

  function applyPseudoFullscreen() {
    ensureStyles();
    const container = getPlayerContainer();
    if (!container || !document.body) return;
    if (container.getAttribute(LAYOUT_ATTR) === '1') return;

    document.body.insertBefore(container, document.body.firstChild);
    container.setAttribute(LAYOUT_ATTR, '1');

    container.style.setProperty('position', 'fixed', 'important');
    container.style.setProperty('inset', '0', 'important');
    container.style.setProperty('width', '100vw', 'important');
    container.style.setProperty('height', '100vh', 'important');
    container.style.setProperty('z-index', '99999', 'important');
    container.style.setProperty('background', '#000', 'important');
    container.style.setProperty('margin', '0', 'important');
    container.style.setProperty('padding', '0', 'important');
    container.classList.add(ROOT_CLASS);
    if (isMinimized) {
      container.classList.add(HIDDEN_CLASS, GONE_CLASS);
      showBalloon();
    } else {
      container.classList.remove(HIDDEN_CLASS, GONE_CLASS);
    }

    setPageScrollLocked(!isMinimized);
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
  }

  function scanAndBind() {
    applyPseudoFullscreen();
    ensureMinimizeButton();
    const video = document.querySelector(VIDEO_SELECTOR);
    if (video) bindVideo(video);
  }

  scanAndBind();

  const observer = new MutationObserver(() => {
    scanAndBind();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
