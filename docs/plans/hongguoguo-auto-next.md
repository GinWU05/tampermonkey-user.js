# 开发计划 Prompt

你是 Codex CLI 开发助手，请按以下说明在本仓库新增一个 Tampermonkey 脚本。参考 `sumbuddy-dark/script.user.js` 的元信息风格与字段，完成同结构的脚本头部与实现。

## 目标
- 页面：`https://www.hongguoguo.tv/vod/play/id/*/sid/1/nid/*.html`
- 当前视频播放结束后，自动跳转到下一集，并让视频进入全屏。

## 元信息（参考 sumbuddy-dark）
请保留同样的字段与顺序：
- `@name`：Hongguoguo Auto Next
- `@namespace`：`https://screw-hand.com/`
- `@version`：`0.1.0`
- `@description`：红果视频自动下一集并尝试全屏
- `@author`：screw-hand
- `@icon`：`https://www.hongguoguo.tv/template/Naifei/static/img/favicon.png`
- `@match`：`https://www.hongguoguo.tv/vod/play/id/*/sid/1/nid/*.html`
- `@run-at`：`document-start`

## 实现要点
- 目标视频元素：`video.dplayer-video.dplayer-video-current`
- 结束事件：监听 `ended`，触发后跳转下一集。
- 下一集 URL 规则：把当前 URL 中 `.html` 前最后的数字 `+1`，例如 `.../nid/1.html -> .../nid/2.html`。
- 默认全屏（布局方案）：检测到 `#dplayer` / `.dplayer` 容器后，将其移动到 `document.body` 顶部并设置 `position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 99999; background: #000;`，同时设置 `body/html` 的 `margin: 0; overflow: hidden; background: #000;`。不使用浏览器全屏 API。
- 最小化：在 `#dplayer > div.dplayer-controller > div.dplayer-icons.dplayer-icons-right` 左侧插入最小化按钮；点击后暂停播放，容器透明度过渡到 0 并向上位移消失，同时右下角出现“气球”按钮；点击气球恢复播放器并淡入。
- 防重复绑定：给视频元素加自定义属性标记，避免多次绑定 `ended`。
- 动态替换：如播放器节点会重建，用 `MutationObserver` 或轮询确保重新绑定。

## 交付建议
- 新建目录 `hongguoguo-auto-next`，脚本文件命名为 `script.user.js`，结构与现有脚本保持一致。

## 验收
- 打开任意匹配 URL，视频自然播放结束后自动进入下一集。
- 进入下一集后，视频尝试进入全屏（若浏览器限制导致失败，不影响自动跳转）。

## 问题记录（Win / Edge）
- 现象：自动全屏失败，`requestFullscreen()` 有调用，但没有进入全屏（控制台可见触发多次）。
- 已排除：iframe 包裹（用户认为可排除）、禁用全屏权限（手动全屏可用）、已有全屏状态。
- 待确认：video 元素是否被重建、元素是否在可见状态时调用。
- 可能原因：浏览器要求用户手势触发全屏（自动调用会被拒绝），或应对播放器容器（如 `#dplayer`）而非 `video` 调用全屏。

## 参考（DPlayer FAQ）
- 文档：`https://dplayer.diygod.dev/zh/guide.html#常见问题`
- 条目：`为什么播放器不能全屏？`
  - 若播放器在 iframe 内，需在 iframe 上添加 `allowfullscreen` 及厂商前缀属性（`webkitallowfullscreen`/`mozallowfullscreen`/`msallowfullscreen` 等）。
