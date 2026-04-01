# 性能审查与 Bug 排查报告

## 一、内存泄漏风险

### 1.1 事件监听器未清理

| 文件 | 行号 | 问题 | 严重度 |
|------|------|------|--------|
| `Edit.vue` | 667-669 | `bindMindMapEvents()` 使用可选链 `?.`，`mindMap.off` 不存在时不清理 | 中 |
| `Edit.vue` | 416 | `window.addEventListener('resize')` 清理前可能触发已销毁实例 | 低 |
| `legacyBus.js` | 1 | `listenersMap` 是全局 Map，永远不会被清理 | 中 |
| `appEvents.js` | 1 | 同上 | 中 |

### 1.2 闭包引用

| 文件 | 行号 | 问题 | 严重度 |
|------|------|------|--------|
| `Edit.vue` | 560-564 | `customNoteContentShow.show` 回调闭包引用 `this` | 中 |
| `Edit.vue` | 577-586 | `handleIsSplitByWrapOnPasteCreateNewNode` 闭包引用 `this.$confirm` | 低 |
| `Edit.vue` | 667-669 | 匿名箭头函数闭包持有组件引用 | 中 |

---

## 二、不必要的重渲染/重计算

| 文件 | 行号 | 问题 | 严重度 |
|------|------|------|--------|
| `Toolbar.vue` | 319-345 | `btnLit` 每次创建新数组 + `deep: true` watch | 中 |
| `Outline.vue` | 139-155 | `refresh()` 全量遍历整棵树，大型思维导图性能差 | 高 |
| `Toolbar.vue` | 488-507 | `computeToolbarShow` 递归 `$nextTick`（O(n) 次 tick） | 中 |

---

## 三、异步操作竞态条件

| 文件 | 行号 | 问题 | 严重度 |
|------|------|------|--------|
| `AiCreate.vue` | 374-417 | `loopRenderOnAiCreating` 中 `aiCreatingContent` 被并发读写 | 高 |
| `AiChat.vue` | 188-227 | 使用 `responseId` 检测过时响应（正确做法），但通过索引访问 `chatList` | 中 |
| `Toolbar.vue` | 577-586 | `onWriteLocalFile` 防抖写入，`waitingWriteToLocalFile` 标志可能不准确 | 低 |
| `Sidebar.vue` | 多个子组件 | `$nextTick` 回调执行顺序不确定，快速切换侧边栏时状态覆盖 | 高 |

---

## 四、潜在的运行时错误

| 文件 | 行号 | 问题 | 严重度 |
|------|------|------|--------|
| `Contextmenu.vue` | 419 | `this.node = ''` 应为 `null`，后续访问 `this.node.isRoot` 抛 TypeError | 高 |
| `Edit.vue` | 774 | `this.mindMap.view.reset()` 无 null 防护 | 中 |
| `utils/index.js` | 30-36 | `fileToBuffer` 无 `onerror` 处理，Promise 永不 reject | 中 |
| `AiCreate.vue` | 467 | `currentMindMapData.data.text` 可能为 null | 中 |
| `Edit.vue` | 411,419,423,427 | `this.mindMap.xxx()` 无可选链防护 | 中 |

---

## 五、未处理的 Promise Rejection

| 文件 | 行号 | 问题 | 严重度 |
|------|------|------|--------|
| `main.js` | 150-157 | `bootstrapPlatformState()` catch 只 `console.error` | 中 |
| `localConfigStorage.js` | 7-18 | `void saveBootstrapStatePatch(...)` catch 只打印日志 | 低 |
| `api/index.js` | 34-37 | 同上 | 低 |
| `Toolbar.vue` | 644-662 | `importLocalFile()` catch 只 `console.log` | 中 |

---

## 六、潜在的逻辑错误

| 文件 | 行号 | 问题 | 严重度 |
|------|------|------|--------|
| `Contextmenu.vue` | 419 | `this.node = ''` 应为 `null` | 高 |
| `handleClipboardText.js` | 20 | `forEach` 中使用 `async` 回调 | 中 |
| `Edit.vue` | 873 | 硬编码过期百度图片 URL (`sec=1696006800`) | 低 |
| `Edit.vue` | 826-830 | `removeRichTextPlugin()` 条件判断 | 低 |

---

## 七、资源加载优化

| 文件 | 问题 | 严重度 |
|------|------|--------|
| `config/image.js` (1329 行) | 启动时全量加载 200+ 个 SVG 导入 | 高 |
| `config/icon.js` (50+ KB) | 大量 base64 编码图片启动时加载 | 中 |
| `main.js` (4-34) | 25+ 个 Element Plus 组件及 CSS 文件同步导入 | 中 |

---

## 八、打包体积优化

| 文件 | 问题 | 建议 |
|------|------|------|
| `vite.config.js:108` | `chunkSizeWarningLimit: 4000` 过高 | 降至 1000-2000 |
| `vite.config.js:33-35` | `xlsx` manualChunk 但无 xlsx 依赖 | 删除该配置 |
| `vite.config.js:30` | `v-viewer` manualChunk 但项目未使用 | 删除该配置 |
| `vite.lib.config.js:27` | `minify: false` | 生产构建应启用压缩 |

---

## 九、优先级修复建议

| 优先级 | 问题 | 文件 | 行号 |
|--------|------|------|------|
| P0 | `this.node = ''` 应为 `null` | `Contextmenu.vue` | 419 |
| P0 | AI 生成竞态条件 | `AiCreate.vue` | 374-417 |
| P0 | 侧边栏 `$nextTick` 竞态 | 多个子组件 | - |
| P1 | 事件监听器可选链导致泄漏 | `Edit.vue` | 675 |
| P1 | 全局 `listenersMap` 无清理 | `legacyBus.js`, `appEvents.js` | 1 |
| P1 | Outline 全量遍历 | `Outline.vue` | 139-155 |
| P2 | `fileToBuffer` 无 error 处理 | `utils/index.js` | 30-36 |
| P2 | `setData` 中 `view.reset` 无防护 | `Edit.vue` | 774 |
| P2 | 图片/图标全量加载 | `config/image.js`, `config/icon.js` | - |
| P3 | 拼写错误 `fullscrrenEvent` | `utils/index.js` | 15 |
