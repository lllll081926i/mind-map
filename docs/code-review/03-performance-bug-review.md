# 性能审查与 Bug 排查报告

## 一、内存泄漏风险

### 1.1 模块级 Promise 缓存未清理

**文件**: `src/pages/Edit/components/Edit.vue:134-138`

```js
let richTextPluginsPromise = null
let exportPluginsPromise = null
let scrollbarPluginPromise = null
let handleClipboardTextPromise = null
let mindMapRuntimePromise = null
```

**问题**: 模块级变量缓存了动态 import 的 Promise。组件销毁后这些 Promise 仍持有对模块的引用。

**修复建议**: 在 `unmounted` 生命周期中将这些 Promise 变量置为 `null`。

---

### 1.2 Navigator 定时器未清理

**文件**: `src/pages/Edit/components/Navigator.vue:113-117`

**问题**: `this.timer` 在 `beforeUnmount` 中只清理了事件监听器，未清理定时器。

**修复建议**: 在 `beforeUnmount` 中添加 `clearTimeout(this.timer)`。

---

### 1.3 全屏事件处理器直接赋值

**文件**: `src/pages/Edit/components/Fullscreen.vue:39-44`

```js
created() {
  document[fullscreenEvent] = () => {
    setTimeout(() => {
      this.mindMap.resize()
    }, 1000)
  }
}
```

**问题**: 直接覆盖 `document.onfullscreenchange`，会清除其他组件可能注册的全屏事件处理器。

**修复建议**: 使用 `addEventListener` 替代直接赋值，在 `beforeUnmount` 中 `removeEventListener`。

---

## 二、不必要的重渲染/重计算

### 2.1 工具栏布局计算过于频繁

**文件**: `src/pages/Edit/components/Toolbar.vue:431-432`

**问题**: `computeToolbarShow` 方法遍历所有按钮测量宽度，涉及 DOM 查询和 `getBoundingClientRect`。虽然使用了 throttle(300ms)，但窗口大小变化时仍会触发多次昂贵的 DOM 操作。

**修复建议**: 使用 `ResizeObserver` 替代 `resize` 事件。

---

### 2.2 每次数据变化都完整遍历整棵树

**文件**: `src/pages/Edit/components/Count.vue:58-77`

**问题**: 每次 `data_change` 事件触发都会完整遍历整棵思维导图树，O(n) 操作且频繁执行。

**修复建议**: 使用 debounce 减少触发频率，或在 mind-map 核心中维护节点数和字数统计。

---

### 2.3 Style 组件重复初始化

**文件**: `src/pages/Edit/components/Style.vue:644-654`

**问题**: `initNodeStyle` 会遍历 `activeNodes` 的每个样式属性调用 `getStyle()`。频繁切换侧边栏会重复执行相同的计算。

**修复建议**: 添加缓存机制，仅当 `activeNodes` 真正变化时才重新计算。

---

## 三、事件监听器未清理

### 3.1 mindMap 实例事件监听器未清理

**文件**: `src/pages/Edit/components/Edit.vue:602-621`

**问题**: `beforeDestroy` 中清理了 `$bus` 事件和 window resize 事件，但 `mindMap` 实例上的事件监听器未在销毁时清理。

**修复建议**: 在销毁前调用 `mindMap.off()` 清理所有自定义事件。

---

### 3.2 AI 渲染结束事件监听器泄漏风险

**文件**: `src/pages/Edit/components/AiCreate.vue:469-471`

**问题**: `onRenderEnd` 是闭包函数，每次调用 `loopRenderOnAiCreating` 都会创建新的事件监听器。

**修复建议**: 确保 `beforeUnmount` 中调用 `detachRenderEndListener()`。

---

## 四、异步操作竞态条件

### 4.1 setData 方法中的异步竞态

**文件**: `src/pages/Edit/components/Edit.vue:944-968`

**问题**: 快速连续调用 `setData`（如快速切换文件），前一个 `setData` 的 `await` 完成后，第二个 `setData` 可能已经开始执行，导致状态混乱。

**修复建议**: 添加请求 ID 或 AbortController 机制，确保只有最新的 `setData` 调用生效。

---

### 4.2 文件读写竞态

**文件**: `src/pages/Edit/components/Toolbar.vue:669-678`

**问题**: `writeLocalFile` 是异步方法，debounce 只保证调用时机，不保证写入顺序。

**修复建议**: 使用队列机制确保写入顺序。

---

### 4.3 AI 流式渲染竞态

**文件**: `src/pages/Edit/components/AiCreate.vue:422-474`

**问题**: AI 流式返回内容与渲染循环之间存在竞态。

**修复建议**: 在 `updateStreamingAiContent` 中添加 requestId 校验。

---

## 五、潜在的运行时错误

### 5.1 `this.mindMap` 可能为 null

**文件**: `src/pages/Edit/components/Edit.vue:527-532`

**问题**: `addRichTextPlugin()` 是异步的，在 `.then()` 回调中 `this.mindMap` 可能已被销毁。

**修复建议**: 在 `.then()` 回调中增加 `if (!this.mindMap) return` 检查。

---

### 5.2 `$refs.tree` 可能为 undefined

**文件**: `src/pages/Edit/components/Outline.vue:180-205`、`OutlineEdit.vue:196-206`

**问题**: 组件销毁期间 `this.$refs.tree` 可能为 undefined。

**修复建议**: 添加 `if (!this.$refs.tree) return` 保护。

---

### 5.3 `this.mindMap.miniMap` 可能为 undefined

**文件**: `src/pages/Edit/components/Navigator.vue:160-184`

**问题**: 如果 miniMap 插件未加载或已移除，调用其方法会抛出 TypeError。

**修复建议**: 添加 `if (this.mindMap?.miniMap)` 检查。

---

### 5.4 `$refs.searchInputRef.focus()` 时序问题

**文件**: `src/pages/Edit/components/Search.vue:203`

**问题**: `this.show = true` 是响应式更新，`$refs.searchInputRef` 在 DOM 更新前可能还不存在。

**修复建议**: 使用 `this.$nextTick(() => { this.$refs.searchInputRef?.focus() })`。

---

## 六、未处理的 Promise Rejection

### 6.1 writeLocalFile 未处理 rejection

**文件**: `src/pages/Edit/components/Toolbar.vue:675-677`

**问题**: `writeLocalFile` 是 async 函数，但直接调用未 await 或 catch。

**修复建议**: 添加 `.catch()` 处理。

---

### 6.2 FileReader 错误处理不完整

**文件**: `src/pages/Edit/components/Import.vue:264-279`

**问题**: 只处理了 `onload`，未处理 `onerror`。

**修复建议**: 添加 `fileReader.onerror` 处理。

---

## 七、潜在的逻辑错误

### 7.1 字符串索引调用

**文件**: `src/pages/Edit/components/Outline.vue:136-139`

```js
if (this.insertType) {
  this[this.insertType]()
}
```

**问题**: 使用字符串作为方法名索引调用，可能调用到意外方法。

**修复建议**: 添加白名单校验。

---

### 7.2 主题切换确认对话框并发

**文件**: `src/pages/Edit/components/Theme.vue:200-218`

**问题**: 快速点击多个主题，多个确认对话框会叠加出现。

**修复建议**: 添加 `isConfirmingTheme` 标志防止并发。

---

## 八、Vue 2 API 兼容性问题

**所有 Vue 组件** 中 `beforeDestroy` 应改为 `beforeUnmount`（Vue 3 标准 API）。

影响文件：
- `Edit.vue:602`
- `AiCreate.vue:192`
- `Import.vue:113`
- `Export.vue:212`
- `OutlineEdit.vue:118`
- `Outline.vue:93`
- `Search.vue:148`
- `Style.vue:658`
- `Contextmenu.vue:327`
- `Count.vue:42`
- `Navigator.vue:82`
- `NavigatorToolbar.vue:212`
- `Demonstrate.vue:77`
- `Fullscreen.vue:45`
- `SidebarTrigger.vue:111`
- `Sidebar.vue:72`
- `Setting.vue:519`
- `Structure.vue:86`
- `Theme.vue:123`
- `BaseStyle.vue:1002`

---

## 九、资源加载优化

| 文件 | 问题 | 建议 |
|------|------|------|
| `Edit.vue:181-248` | 一次性加载 17 个模块 | 非关键插件改为按需加载 |
| `main.js:35-63` | Element Plus CSS 静态导入 | 使用 `unplugin-vue-components` 实现按需加载 |
| `Edit.vue:307-333` | 富文本和导出插件懒加载 | 使用 `requestIdleCallback` 预加载 |

---

## 十、打包体积优化

| 文件 | 问题 | 建议 |
|------|------|------|
| `vite.config.js:33-35` | `xlsx` manualChunk 但无 xlsx 依赖 | 删除该配置 |
| `vite.config.js:30` | `v-viewer` manualChunk 但项目未使用 | 删除该配置 |
| `vite.lib.config.js:27` | `minify: false` | 启用 Vite 内置压缩 |

---

## 十一、优先级修复建议

| 优先级 | 问题 | 文件 |
|--------|------|------|
| P0 | 将所有 `beforeDestroy` 改为 `beforeUnmount` | 18 个文件 |
| P0 | 全屏事件处理器改为 addEventListener | `Fullscreen.vue` |
| P0 | Navigator 定时器清理 | `Navigator.vue` |
| P1 | setData 异步竞态 | `Edit.vue` |
| P1 | `$refs` 空指针保护 | `Outline.vue`、`OutlineEdit.vue`、`Search.vue` |
| P1 | writeLocalFile Promise rejection | `Toolbar.vue` |
| P2 | 模块级 Promise 缓存清理 | `Edit.vue` |
| P2 | 工具栏布局计算优化 | `Toolbar.vue` |
| P3 | 删除无效 manualChunks 配置 | `vite.config.js` |
