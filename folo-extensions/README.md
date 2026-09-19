# Folo 功能扩展

[Folo](https://app.folo.is) 网页版的个性化扩展。

当前只有一个功能：**完全禁用内置阅读器**。

| 操作 | 行为 |
|---|---|
| 单击条目 | 新标签页打开原文，并标记已读 |
| `Enter` | 打开当前选中条目（同上） |
| `J` / `K` / `↓` / `↑` | 在列表内移动选中 |
| 双击 | 被吞掉，避免开两个标签页 |

## 为什么？

Folo 把条目的鼠标操作写死了：

| 操作 | Folo 默认行为 |
|---|---|
| 单击 | 打开内置阅读器 |
| 双击 | 新标签页打开原文 |

没有设置项可以调换。宽屏下内置阅读器在右侧，不碍事。窄屏（< 1024px）下它会顶掉条目列表，每次都要点返回。

维护者的立场见 [RSSNext/Folo#1952](https://github.com/RSSNext/Folo/issues/1952)（请求「默认在浏览器打开」，未响应）和提交 `ffa9bee2`（新增双击打开原文，作为替代方案）。

## 做法

**打开原文**

1. 在 `document` 的 capture 阶段截获条目上的单击。
2. 阻止它传到 React，也阻止 `<a href>` 的默认跳转。
3. 向同一元素派发一个合成 `dblclick`。

Folo 自己的 `handleDoubleClick` 会照常执行，用它内部已算好的安全 URL 打开新标签页。脚本不解析 URL。Folo 改 URL 规则时脚本不需要跟着改。

**标记已读**

Folo 的单击原本还会调 `unreadSyncService.markEntryAsRead()`。拦了单击就丢了已读。

补救：`unreadSyncService` 是主模块 `/assets/main-*.js` 的一个导出，页面没有 CSP。脚本在页面世界注入一段 inline `<script type="module">`，`import` 同一个 URL。ES 模块表按 URL 缓存，拿到的是同一个实例，不会重新执行。然后按方法名（同时有 `markEntryAsRead` 和 `markEntriesAsRead`）找到那个导出，挂到 `window.__foloExt`。线上构建里符合条件的对象只有一个。

**键盘导航**

Folo 的「当前条目」只有一个来源：路由里的 `entryId`。内置阅读器是否渲染、`J`/`K` 从哪算下一条、列表高亮，全挂在它上面。拦了单击的 `navigate()`，路由永远停在 `pending`，Folo 的 `indexOf()` 返回 `-1`，上下键都错位；而键盘导航一旦走 Folo 自己的 `navigate()`，阅读器就会在任何宽度下打开。

所以脚本接管键盘：自己维护选中条目（复用 Folo 的 `data-active` 属性做高亮），`J`/`K`/`↑`/`↓` 移动，`Enter` 打开。路由不再进入具体条目，阅读器永远不渲染。只在时间线列表区域有焦点时接管，输入框内不接管。

Folo 列表是虚拟滚动，重渲染会把 `data-active` 刷回 `false`。用 `MutationObserver` 补回。

## 保留的原有行为

以下点击不受影响：

- `Ctrl` / `Cmd` / `Shift` / `Alt` + 单击
- 中键、右键
- 条目内部的按钮、操作栏、右键菜单
- 社交媒体正文里内嵌的链接

## 开关

Tampermonkey 菜单 → 「禁用内置阅读器（单击/Enter 开新标签页）：开/关」。状态会记住。

## 已知限制

- 条目没有原文 URL 时（少数 inbox 条目），单击 / `Enter` 无反应。这是 Folo `handleDoubleClick` 的原有判断。
- `H` / `L` / `←` / `→` 未接管。Folo 用它们在列表 / 阅读器 / 订阅栏之间切焦点；没有阅读器后作用有限。
- Safari 可能拦截由合成事件触发的 `window.open`。Chrome / Edge / Firefox 正常。
- 已读标记依赖 Folo 构建产物形态（主模块路径 `/assets/main-*.js`，`unreadSyncService` 在导出列表）。失效时脚本不报错，Console 打一条警告，退化为「只开原文，不标已读」。
- 依赖 Folo 的 DOM 结构 `[data-entry-id] > a` 和时间线容器 `[role="region"][data-hide-in-print]`。前者自 2025-06 起未变。

## TODO

- [ ] **宽屏下内置阅读器仍会打开**（v0.2.0 复现）。v0.3.0 接管键盘后尚未在真实环境验证。若仍复现，需排查除鼠标单击、键盘之外的第三条 `navigate()` 路径。
- [ ] **方向键 ↑/↓ 都跳到下一条**（v0.2.0 复现）。根因是路由 `entryId` 停在 `pending`，Folo `indexOf()` 返回 `-1`。v0.3.0 用脚本接管 `J`/`K`/`↑`/`↓` 修复，jsdom 测试通过，待真实环境验证。
- [ ] 若接管方案不稳，备选：放行 `navigate()` 并隐藏阅读器列。注意窄屏不可行，`MobileTimelineLayout` 会卸载列表组件。

## 相关源码

- 条目点击逻辑：`apps/desktop/layer/renderer/src/modules/entry-column/layouts/EntryItemWrapper.tsx`
- `openLinksInExternalApp` 设置：`packages/internal/shared/src/settings/defaults.ts`，标注 `@mobile`，桌面/网页端不读取。
- 键盘导航：`apps/desktop/layer/renderer/src/modules/entry-column/EntryColumnShortcutHandler.tsx`，`currentEntryIdRef = useRouteEntryId()`。
- 阅读器渲染条件：`apps/desktop/layer/renderer/src/modules/app-layout/ai-enhanced-timeline/AIEnhancedTimelineLayout.tsx:43`，`hasSelectedEntry = Boolean(realEntryId)`。
- 已读服务：`packages/internal/store/src/modules/unread/store.ts`，`unreadSyncService.markEntryAsRead()`。
