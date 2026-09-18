// ==UserScript==
// @name              Folo Extensions
// @name:zh-CN        Folo 功能扩展
// @namespace         https://screw-hand.com/
// @version           0.3.1
// @description       Personal tweaks for the Folo web app. Current feature: fully disable the built-in reader — click or Enter opens the original in a new tab and marks it read; J/K/Up/Down move the selection.
// @description:zh-CN Folo 网页版个性化扩展。当前功能：完全禁用内置阅读器——单击或 Enter 在新标签页打开原文并标记已读，J/K/↑/↓ 在列表内移动选中。
// @author            GinWU
// @license           MIT
// @homepageURL       https://github.com/GinWU05/tampermonkey-user.js/tree/main/folo-extensions
// @supportURL        https://github.com/GinWU05/tampermonkey-user.js/issues
// @icon              https://app.folo.is/favicon.ico
// @match             https://app.folo.is/*
// @run-at            document-start
// @grant             GM_getValue
// @grant             GM_setValue
// @grant             GM_registerMenuCommand
// @grant             unsafeWindow
// ==/UserScript==

/**
 * 背景
 *
 * Folo 的条目组件 EntryItemWrapper 把两种鼠标操作写死了：
 *   - 单击  -> navigate()      打开内置阅读器（窄屏下会顶掉条目列表）
 *   - 双击  -> window.open()   在新标签页打开原文
 * 没有任何设置项可以调换。见 RSSNext/Folo 源码：
 *   apps/desktop/layer/renderer/src/modules/entry-column/layouts/EntryItemWrapper.tsx
 *
 * 做法
 *
 * 在 document 的 capture 阶段截获条目上的单击，阻止它传到 React，
 * 然后向同一元素派发一个合成 dblclick。React 会照常执行 Folo 自己的
 * handleDoubleClick，用它内部已经算好的安全 URL 打开新标签页。
 * 我们不解析 URL。
 *
 * 已读标记
 *
 * Folo 的单击除了 navigate() 还会调 unreadSyncService.markEntryAsRead()。
 * 拦了单击就丢了已读。补救：unreadSyncService 是主模块 /assets/main-*.js 的一个
 * 导出，页面没有 CSP。我们在页面世界注入一段 inline module，import 同一个 URL。
 * ES 模块表按 URL 缓存，拿到的是同一个实例，不会重新执行。然后按方法名
 * (markEntryAsRead + markEntriesAsRead) 找到那个导出，挂到 window.__foloExt。
 *
 * 键盘导航
 *
 * Folo 的「当前条目」只有一个来源：路由里的 entryId。内置阅读器是否渲染、
 * J/K/↑/↓ 从哪里算下一条、列表高亮，全部挂在它上。我们拦了单击的
 * navigate()，路由永远停在 pending，于是 Folo 的 indexOf() 返回 -1，上下键都错位；
 * 而键盘导航一旦走 Folo 自己的 navigate()，阅读器就会在任何宽度下打开。
 * 所以脚本接管键盘：自己维护选中条目（用 Folo 自己的 data-active 属性高亮），
 * J/K/↑/↓ 移动，Enter 打开。路由不再进入具体条目，阅读器永远不渲染。
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'folo-ext:disable-builtin-reader';
  // 同一条目在此时间窗内只处理一次点击，防止真实双击开出多个标签页。
  const CLICK_DEDUPE_MS = 500;

  // Folo 条目根节点带 data-entry-id。其直接子元素是可点击的 Link：
  // 普通视图是 <a>，SocialMedia 视图是 <article>。
  const ENTRY_LINK_SELECTOR = '[data-entry-id] > a, [data-entry-id] > article';
  // 条目根节点（带 data-read / data-active 的那一层）。图片视图外层还套一层带
  // data-entry-id + data-index 的 div，用 :has() 只取直接包含 Link 的那一层。
  const ENTRY_ROOT_SELECTOR = '[data-entry-id]:has(> a, > article)';
  // Folo 时间线列表的 Focusable 容器（EntryColumn 根）。键盘只在它内部有效。
  const TIMELINE_ROOT_SELECTOR = '[role="region"][data-hide-in-print]';
  // 条目内部的这些控件保留 Folo 原有行为（操作栏按钮、展开、菜单等）。
  const INTERACTIVE_SELECTOR =
    'button, [role="button"], [role="menuitem"], [role="menu"], input, textarea, select, summary';

  // 页面真正的 window。油猴沙箱里的 window 是代理。
  const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const BRIDGE_KEY = '__foloExt';
  const BRIDGE_READY_EVENT = 'folo-ext:bridge-ready';

  let enabled = GM_getValue(STORAGE_KEY, true);
  let lastEntryId = null;
  let lastClickAt = 0;
  // 我们自己派发的合成事件。dblclick 拦截器据此放行。
  const syntheticEvents = new WeakSet();
  let warnedNoBridge = false;
  // 脚本自己的「当前选中条目」。不走 Folo 路由。
  let selectedEntryId = null;

  // ---- 页面世界桥：拿到 Folo 的 unreadSyncService ----

  function injectBridge() {
    if (pageWindow[BRIDGE_KEY]) return;
    const mainScript = document.querySelector('script[type="module"][src*="/assets/main-"]');
    if (!mainScript) return;

    const code = `
      import * as m from ${JSON.stringify(mainScript.src)};
      let svc = null;
      for (const k of Object.keys(m)) {
        try {
          const v = m[k];
          if (v && typeof v.markEntryAsRead === 'function' && typeof v.markEntriesAsRead === 'function') {
            svc = v;
            break;
          }
        } catch (_) { /* 个别导出取值可能抛错，跳过 */ }
      }
      window[${JSON.stringify(BRIDGE_KEY)}] = { unreadSyncService: svc };
      document.dispatchEvent(new CustomEvent(${JSON.stringify(BRIDGE_READY_EVENT)}));
    `;
    const s = document.createElement('script');
    s.type = 'module';
    s.textContent = code;
    (document.head || document.documentElement).appendChild(s);
    s.remove();
  }

  function getUnreadSyncService() {
    return pageWindow[BRIDGE_KEY]?.unreadSyncService || null;
  }

  function markEntryAsRead(entryId) {
    if (!entryId) return;
    const svc = getUnreadSyncService();
    if (!svc) {
      if (!warnedNoBridge) {
        warnedNoBridge = true;
        console.warn('[Folo 功能扩展] 未找到 unreadSyncService，单击不会标记已读。Folo 可能改了构建结构。');
      }
      return;
    }
    try {
      // 已读的条目 Folo 内部会自己跳过，重复调用无害。
      const r = svc.markEntryAsRead(entryId);
      if (r && typeof r.catch === 'function') r.catch(() => {});
    } catch (_) {
      /* 忽略 */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBridge, { once: true });
  } else {
    injectBridge();
  }

  function resolveEntryLink(target) {
    if (!(target instanceof Element)) return null;

    const link = target.closest(ENTRY_LINK_SELECTOR);
    if (!link) return null;

    // 点在条目内部的按钮/菜单上：放行。
    if (target.closest(INTERACTIVE_SELECTOR)) return null;

    // 点在条目内嵌的其他链接上（如社交媒体正文里的 URL）：放行。
    const nearestAnchor = target.closest('a');
    if (nearestAnchor && nearestAnchor !== link) return null;

    return link;
  }

  function isPlainLeftClick(e) {
    return e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
  }

  // ---- 选中状态（复用 Folo 的 data-active 高亮样式）----

  function listEntryRoots() {
    // 无 :has() 支持时退化为手动过滤。
    try {
      return Array.from(document.querySelectorAll(ENTRY_ROOT_SELECTOR));
    } catch (_) {
      return Array.from(document.querySelectorAll('[data-entry-id]')).filter((el) =>
        Array.from(el.children).some((c) => c.tagName === 'A' || c.tagName === 'ARTICLE'),
      );
    }
  }

  function findEntryRoot(entryId) {
    if (!entryId) return null;
    return listEntryRoots().find((el) => el.getAttribute('data-entry-id') === entryId) || null;
  }

  function setSelected(entryId) {
    if (selectedEntryId && selectedEntryId !== entryId) {
      const prev = findEntryRoot(selectedEntryId);
      if (prev) prev.setAttribute('data-active', 'false');
    }
    selectedEntryId = entryId || null;
    const cur = findEntryRoot(selectedEntryId);
    if (cur) cur.setAttribute('data-active', 'true');
    return cur;
  }

  // Folo 列表是虚拟滚动，重渲染会把 data-active 刷回 false。用 MutationObserver 补回。
  const activeObserver = new MutationObserver((records) => {
    if (!enabled || !selectedEntryId) return;
    for (const r of records) {
      const el = r.target;
      if (!(el instanceof Element)) continue;
      if (el.getAttribute('data-entry-id') !== selectedEntryId) continue;
      if (el.getAttribute('data-active') !== 'true') el.setAttribute('data-active', 'true');
    }
  });

  function startObserver() {
    const root = document.body || document.documentElement;
    if (!root) return;
    activeObserver.observe(root, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-active'],
    });
  }

  // ---- 打开原文 ----

  function openEntry(link, entryId) {
    const now = Date.now();
    if (entryId && entryId === lastEntryId && now - lastClickAt < CLICK_DEDUPE_MS) return;
    lastEntryId = entryId;
    lastClickAt = now;

    // 复用 Folo 自己的 handleDoubleClick -> window.open(populatedFullHref, "_blank")
    // 注意：不要传 view: window。油猴沙箱里的 window 是代理，不是真正的 Window，
    // MouseEvent 构造时会报 "Failed to convert value to 'Window'"。
    const synthetic = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    syntheticEvents.add(synthetic);
    link.dispatchEvent(synthetic);

    // 补回 Folo 单击原本会做的已读标记。
    markEntryAsRead(entryId);
  }

  function onClickCapture(e) {
    if (!enabled) return;
    if (!isPlainLeftClick(e)) return;

    const link = resolveEntryLink(e.target);
    if (!link) return;

    // 拦住：不让 React 的 handleClick 跑，也不让 <a href> 走默认跳转。
    e.preventDefault();
    e.stopPropagation();

    const entryId = link.parentElement?.getAttribute('data-entry-id') || null;
    setSelected(entryId);
    openEntry(link, entryId);
  }

  // ---- 键盘：J/K/↑/↓ 移动，Enter 打开 ----

  const NAV_KEYS = {
    ArrowDown: 1,
    j: 1,
    J: 1,
    ArrowUp: -1,
    k: -1,
    K: -1,
  };

  function isEditable(el) {
    if (!(el instanceof Element)) return false;
    if (el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return true;
    return false;
  }

  function moveSelection(delta) {
    const roots = listEntryRoots();
    if (roots.length === 0) return;
    let idx = roots.findIndex((el) => el.getAttribute('data-entry-id') === selectedEntryId);
    if (idx === -1) {
      // 无选中（或选中项已被虚拟列表卸载）：↓ 选首项，↑ 选末项。
      idx = delta > 0 ? 0 : roots.length - 1;
    } else {
      idx = Math.max(0, Math.min(roots.length - 1, idx + delta));
    }
    const target = roots[idx];
    setSelected(target.getAttribute('data-entry-id'));
    target.scrollIntoView({ block: 'nearest' });
  }

  function onKeydownCapture(e) {
    if (!enabled) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isEditable(e.target)) return;

    // 只在时间线列表区域有焦点时接管（和 Folo 的 HotkeyScope.Timeline 对齐）。
    const active = document.activeElement;
    const inTimeline = active instanceof Element && active.closest(TIMELINE_ROOT_SELECTOR);
    const onBody = active === document.body || active === null;
    if (!inTimeline && !onBody) return;

    if (e.key in NAV_KEYS && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      moveSelection(NAV_KEYS[e.key]);
      return;
    }

    if (e.key === 'Enter' && selectedEntryId) {
      const root = findEntryRoot(selectedEntryId);
      const link = root && root.querySelector(':scope > a, :scope > article');
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      openEntry(link, selectedEntryId);
    }
  }

  function onDblClickCapture(e) {
    if (!enabled) return;
    // 放行我们自己派发的合成事件；只拦真实双击。
    if (syntheticEvents.has(e)) return;
    if (!resolveEntryLink(e.target)) return;

    // 单击已经处理过了，真实双击不再重复打开。
    e.preventDefault();
    e.stopPropagation();
  }

  document.addEventListener('click', onClickCapture, true);
  document.addEventListener('dblclick', onDblClickCapture, true);
  document.addEventListener('keydown', onKeydownCapture, true);

  if (document.body) startObserver();
  else document.addEventListener('DOMContentLoaded', startObserver, { once: true });

  // ---- 菜单开关 ----

  function menuLabel() {
    return `禁用内置阅读器（单击/Enter 开新标签页）：${enabled ? '开' : '关'}`;
  }

  let menuId = null;
  function registerMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;
    // 新版 Tampermonkey 支持同 id 覆盖；旧版会重复注册，可接受。
    menuId = GM_registerMenuCommand(
      menuLabel(),
      () => {
        enabled = !enabled;
        GM_setValue(STORAGE_KEY, enabled);
        registerMenu();
      },
      { id: menuId || undefined, autoClose: true },
    );
  }
  registerMenu();
})();
