// ==UserScript==
// @name         Sumbuddy Dark
// @namespace    https://screw-hand.com/
// @version      0.1.0
// @description  为Sumbuddy网站添加暗色模式支持，与Dark Reader扩展完美兼容
// @author       screw-hand
// @icon         data:image/png;base64,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
// @match        *://*/*
// @run-at       document-idle
// ==/UserScript==

(() => {
  const HOST_SEL = 'sumbuddy-ui';
  const MARK_ATTR = 'data-sumbuddy-dark-applied';

  function findPanel(host) {
    // 你的目标容器（按你截图的 class）
    return host.shadowRoot?.querySelector('div.fixed.bottom-0.right-0.max-w-full.max-h-full') || null;
  }

  function darkReaderIsHandling(host, panel) {
    // 1) 页面级别标记（若存在）
    const de = document.documentElement;
    if (de.hasAttribute('data-darkreader-mode') || de.hasAttribute('data-darkreader-scheme')) return true;

    // 2) shadow root 内是否有 darkreader style 节点（常见）
    const sr = host.shadowRoot;
    if (sr) {
      const hasDRStyle = sr.querySelector('style[id*="darkreader"], style[class*="darkreader"], style[data-darkreader]') != null;
      if (hasDRStyle) return true;
    }

    // 3) 你实际抓到的特征：规则里出现 var(--darkreader-...) 或者 computed 里有 --darkreader-
    //    用 computedStyle 查一个代表性的属性：background-color / border-color / color
    //    若值里出现 "darkreader" 字样或变量，说明 DR 已经在该 UI 上生效
    if (panel) {
      const cs = getComputedStyle(panel);
      const props = [
        cs.backgroundColor,
        cs.borderTopColor,
        cs.color,
        cs.filter
      ].join(' ');
      if (props.includes('darkreader')) return true;

      // 额外：如果 shadow root 根节点上已经有 --darkreader- 开头的变量（更强信号）
      // 不能直接枚举所有 CSS 变量，只能探测几个你截图里出现过的：
      const probe = getComputedStyle(panel).getPropertyValue('--darkreader-background-fafafa');
      if (probe && probe.trim().length > 0) return true;
    }

    return false;
  }

  function applyOurInvert(panel) {
    panel.style.setProperty('background', '#fff', 'important');
    panel.style.setProperty('mix-blend-mode', 'normal', 'important');
    panel.style.setProperty('isolation', 'isolate', 'important');
		panel.style.setProperty('background', '#333536', 'important');
		panel.style.setProperty(
			'filter',
			'invert(0.88) hue-rotate(180deg) contrast(1.02) saturate(1.02)',
			'important'
		);
    panel.style.setProperty('transform', 'translateZ(0)', 'important');
    panel.style.setProperty('will-change', 'filter', 'important');
    panel.setAttribute(MARK_ATTR, '1');
  }

  function removeOurInvert(panel) {
    if (panel.getAttribute(MARK_ATTR) !== '1') return;
    panel.style.removeProperty('background');
    panel.style.removeProperty('mix-blend-mode');
    panel.style.removeProperty('isolation');
    panel.style.removeProperty('filter');
    panel.style.removeProperty('transform');
    panel.style.removeProperty('will-change');
    panel.removeAttribute(MARK_ATTR);
  }

  function tick() {
    const host = document.querySelector(HOST_SEL);
    if (!host || !host.shadowRoot) return;

    const panel = findPanel(host);
    if (!panel) return;

    // 如果 Dark Reader 已接管：撤销我们的反转（避免叠加）
    if (darkReaderIsHandling(host, panel)) {
      removeOurInvert(panel);
      return;
    }

    // Dark Reader 未接管：应用我们的反转
    if (panel.getAttribute(MARK_ATTR) !== '1') {
      applyOurInvert(panel);
    }
  }

  // 初次 + 监听变化（适配路由/重渲染/DR 开关）
  tick();

  const mo = new MutationObserver(tick);
  mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true });

  // shadow 内变化也监听（出现后再挂）
  const t = setInterval(() => {
    const host = document.querySelector(HOST_SEL);
    if (host && host.shadowRoot) {
      new MutationObserver(tick).observe(host.shadowRoot, { subtree: true, childList: true, attributes: true });
      clearInterval(t);
    }
  }, 300);
})();
