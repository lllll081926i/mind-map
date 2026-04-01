# 侧边栏"不显示"问题专项审查报告

## 审查范围

| 文件 | 角色 |
|------|------|
| `Edit/Index.vue` | 编辑页入口 |
| `Edit/components/Edit.vue` | 主编辑组件，管理所有侧边栏挂载 |
| `Edit/components/Sidebar.vue` | 通用侧边栏容器 |
| `Edit/components/SidebarTrigger.vue` | 侧边栏触发器（按钮面板） |
| `Edit/components/OutlineSidebar.vue` | 大纲侧边栏 |
| `Edit/components/Style.vue` | 节点样式侧边栏 |
| `Edit/components/BaseStyle.vue` | 基础样式侧边栏 |
| `Edit/components/Theme.vue` | 主题侧边栏 |
| `Edit/components/Structure.vue` | 结构侧边栏 |
| `Edit/components/Setting.vue` | 设置侧边栏 |
| `Edit/components/ShortcutKey.vue` | 快捷键侧边栏 |
| `Edit/components/NodeIconSidebar.vue` | 节点图标侧边栏 |
| `Edit/components/FormulaSidebar.vue` | 公式侧边栏 |
| `Edit/components/NodeNoteSidebar.vue` | 笔记侧边栏 |
| `Edit/components/AssociativeLineStyle.vue` | 关联线样式侧边栏 |
| `Edit/components/NodeOuterFrame.vue` | 外框样式侧边栏 |
| `Edit/components/AiChat.vue` | AI 聊天侧边栏 |
| `Edit/components/NodeIconToolbar.vue` | 节点图标浮动工具栏 |
| `Edit/components/Search.vue` | 搜索组件（触发关闭侧边栏） |
| `stores/app.js` | 侧边栏状态管理 |
| `stores/runtime.js` | 运行时状态（setActiveSidebar） |
| `stores/settings.js` | 配置管理 |

---

## 一、侧边栏架构总览

### 1.1 侧边栏分类体系

项目中存在 **三类侧边栏**，挂载策略各不相同：

| 类型 | 组件 | 挂载方式 | 显示控制 |
|------|------|----------|----------|
| **Primary 主侧边栏** | OutlineSidebar, Style, BaseStyle, Theme, Structure, Setting, ShortcutKey | `<component :is="primarySidebarComponent">` 动态组件 | `v-if="primarySidebarComponent"` |
| **独立条件侧边栏** | NodeIconSidebar, FormulaSidebar, NodeNoteSidebar, AssociativeLineStyle, NodeOuterFrame, AiChat | 各自独立 `v-if` | 各自条件判断 |
| **Sidebar 容器** | Sidebar.vue | 被上述组件作为子组件使用 | `forceShow` prop → CSS `right`/`opacity` |

### 1.2 状态流转路径

```
用户操作 → setActiveSidebar(value) [runtime.js]
         → appStore.setActiveSidebar(value) [app.js]
         → activeSidebar 响应式更新
         → primarySidebarComponent 计算属性重新计算 [Edit.vue:411-420]
         → v-if 条件变化 → 组件挂载/卸载
         → Sidebar.forceShow 更新 → CSS transition 动画
```

---

## 二、问题详细清单

### 问题 1：🔴 严重 — mindMap 未初始化时设置侧边栏，触发器高亮但侧边栏不显示

**文件**: `src/pages/Edit/components/Edit.vue:411-420`

```javascript
primarySidebarComponent() {
  const key = this.activeSidebar
  if (!key) return null
  if (key === 'nodeStyle' && this.isZenMode) return null
  if (key !== 'shortcutKey' && !this.mindMap) {   // ← 关键行
    return null
  }
  return PRIMARY_SIDEBAR_COMPONENTS[key] || null
}
```

**问题描述**:
`primarySidebarComponent` 计算属性在 `this.mindMap` 为 `null` 时（除 `shortcutKey` 外）返回 `null`，导致 `v-if="primarySidebarComponent"` 不满足，组件不会被挂载。

但 `SidebarTrigger.vue` 中的按钮高亮判断只依赖 `activeSidebar === item.value`，不受 `mindMap` 影响。

**导致场景**:
1. 页面加载初期，`mindMap` 正在异步初始化，用户快速点击侧边栏按钮
2. `activeSidebar` 被设置，触发器按钮高亮显示
3. 但 `primarySidebarComponent` 返回 `null`，侧边栏组件不挂载
4. 用户看到按钮高亮，但右侧没有侧边栏面板

**影响范围**: 所有 Primary 主侧边栏（outline, nodeStyle, baseStyle, theme, structure, setting）

---

### 问题 2：🔴 严重 — Search 组件 focus 时强制关闭所有已挂载侧边栏

**文件**: `src/pages/Edit/components/Search.vue:201`

```javascript
this.$bus.$emit('closeSideBar')
```

**联动文件**: `src/pages/Edit/components/Sidebar.vue:70-80`

```javascript
handleCloseSidebar() {
  if (!this.isShown) return
  this.close()  // → setActiveSidebar('')
}
```

**问题描述**:
当用户点击搜索按钮打开搜索面板时，搜索输入框自动获取焦点，触发 `onFocus` → 发射 `closeSideBar` 事件 → 所有已挂载的 Sidebar 组件监听此事件并调用 `close()` → `setActiveSidebar('')` 清空侧边栏状态。

**导致场景**:
1. 用户打开了"节点样式"侧边栏正在调整样式
2. 用户点击导航栏的搜索按钮
3. 搜索框自动聚焦，触发 `closeSideBar` 事件
4. 节点样式侧边栏被意外关闭
5. 用户关闭搜索后，之前的侧边栏不会自动恢复

---

### 问题 3：🟡 中等 — 禅模式下侧边栏触发器被完全移除

**文件**: `src/pages/Edit/components/Edit.vue:36`

```vue
<SidebarTrigger v-if="!isZenMode"></SidebarTrigger>
```

**同时**，第 414-416 行：

```javascript
if (key === 'nodeStyle' && this.isZenMode) return null
```

**问题描述**:
禅模式下，`SidebarTrigger` 组件被 `v-if` 完全从 DOM 中移除，用户无法通过常规方式打开侧边栏。

**导致场景**:
1. 用户在非禅模式下打开了某个侧边栏
2. 用户切换到禅模式
3. `SidebarTrigger` 被移除，用户无法再切换或关闭侧边栏

---

### 问题 4：🟡 中等 — 只读模式切换时自动关闭非允许的侧边栏

**文件**: `src/pages/Edit/components/SidebarTrigger.vue:97-105`

```javascript
isReadonly(val) {
  if (val && this.activeSidebar && !READONLY_ALLOWED_SIDEBARS.includes(this.activeSidebar)) {
    setActiveSidebar('')
  }
}
```

**问题描述**:
切换到只读模式时，如果当前打开的侧边栏不在允许列表中（`outline`、`shortcutKey`、`ai`），会被自动关闭。

---

### 问题 5：🟡 中等 — NodeIconToolbar 显示时自动关闭 nodeIconSidebar

**文件**: `src/pages/Edit/components/NodeIconToolbar.vue:106-108`

```javascript
if (this.activeSidebar === 'nodeIconSidebar') {
  setActiveSidebar('')
}
```

**问题描述**:
点击节点上的图标弹出浮动工具栏时，如果 `nodeIconSidebar` 侧边栏是打开状态，会被自动关闭。

---

### 问题 6：🟡 中等 — NodeNoteSidebar 在节点切换时自动关闭

**文件**: `src/pages/Edit/components/NodeNoteSidebar.vue:62-73`

**问题描述**:
笔记侧边栏打开时，用户点击其他节点，侧边栏会自动关闭。

---

### 问题 7：🟡 中等 — FormulaSidebar 依赖 window.katex 但未处理加载失败

**文件**: `src/pages/Edit/components/FormulaSidebar.vue:71-85`

```javascript
init() {
  if (!window.katex) return   // ← katex 未加载时静默返回
  // ...
}
```

**问题描述**:
如果 `window.katex` 尚未加载，`init()` 直接 return，`this.list` 保持为空数组。组件不会重新尝试初始化。

**导致场景**:
1. KaTeX CDN 加载较慢
2. 用户快速打开公式侧边栏
3. 公式列表为空，侧边栏显示空白内容

---

### 问题 8：🟡 中等 — 独立条件侧边栏的事件监听器在 prop 未就绪时注册

**文件**: `AssociativeLineStyle.vue:283-288`、`NodeOuterFrame.vue:441-444`、`NodeNoteSidebar.vue:53-55`

**问题描述**:
这些组件在 `created` 钩子中直接访问 `this.mindMap` 并注册事件监听器。在 `defineAsyncComponent` 异步加载场景下，可能存在时序问题。

---

### 问题 9：🟢 轻微 — Sidebar 组件 z-index 无限递增

**文件**: `src/pages/Edit/components/Sidebar.vue:43、65`

```javascript
this.zIndex = 1100 + store.sidebarZIndex++
```

**问题描述**: 每次侧边栏显示时 z-index 递增，长期使用可能累积到非常大的数值。

---

### 问题 10：🟢 轻微 — AI 侧边栏在 AI 禁用时被静默拦截

**文件**: `src/stores/runtime.js:102-110`

**问题描述**: AI 功能被禁用时，`setActiveSidebar('ai')` 被静默拦截，无任何用户提示。

---

### 问题 11：🟢 轻微 — SidebarTrigger 的 show 状态与 activeSidebar 状态不一致

**文件**: `src/pages/Edit/components/SidebarTrigger.vue:48-49、91-96`

**问题描述**: 用户隐藏触发器面板后，通过其他方式关闭侧边栏，触发器面板仍然保持隐藏。

---

### 问题 12：🟢 轻微 — OutlineSidebar 内部嵌套冗余的 v-if 条件

**文件**: `src/pages/Edit/components/OutlineSidebar.vue:5、35`

**问题描述**: `Outline` 组件的 `v-if="activeSidebar === 'outline'"` 是冗余的。

---

### 问题 13：🟢 轻微 — 侧边栏容器 CSS 始终存在于 DOM

**文件**: `src/pages/Edit/components/Sidebar.vue:95-108`

**问题描述**: Sidebar 组件始终存在于 DOM 中（通过 CSS `right: -300px` 隐藏），多个侧边栏组件同时挂载时，多个 Sidebar 容器同时存在于 DOM 中。

---

### 问题 14：🟢 轻微 — 富文本插件加载竞态

**文件**: `src/pages/Edit/components/Edit.vue:459-462`

**问题描述**: 插件加载过程中，用户可能看到侧边栏触发器高亮但侧边栏未出现的短暂闪烁。

---

## 三、CSS 样式审查

### 3.1 z-index 层级关系

| 元素 | z-index | 文件 |
|------|---------|------|
| Sidebar 容器 | 1100+（递增） | `Sidebar.vue:43,65` |
| SidebarTrigger | 1201 | `SidebarTrigger.vue:138` |
| NodeIconToolbar | 2000 | `NodeIconToolbar.vue:187` |
| NodeImgPlacementToolbar | 2000 | `NodeImgPlacementToolbar.vue:127` |
| el-select-dropdown/el-popper | 2000 | `Edit/Index.vue:126` |
| dragMask | 3999 | `Edit/components/Edit.vue:1069` |

**潜在冲突**: `NodeIconToolbar` 和 `NodeImgPlacementToolbar` 的 z-index 为 2000，与 `el-select-dropdown` 相同。

### 3.2 侧边栏可见性 CSS

```css
right: this.isShown ? '0' : '-300px';
opacity: this.isShown ? 1 : 0;
pointerEvents: this.isShown ? 'auto' : 'none';
```

**注意**: 使用 `right` + `opacity` + `pointerEvents` 三重控制。

---

## 四、竞态条件分析

### 4.1 侧边栏设置 vs mindMap 初始化竞态

```
T0: 页面加载，activeSidebar = ''
T1: 用户点击侧边栏按钮 → setActiveSidebar('outline')
T2: activeSidebar 更新为 'outline'
T3: primarySidebarComponent 计算 → mindMap 仍为 null → 返回 null
T4: 用户看到按钮高亮，但侧边栏不显示
T5: mindMap 初始化完成
T6: primarySidebarComponent 重新计算 → 返回 OutlineSidebar
T7: 侧边栏组件挂载并显示
```

**窗口期**: T3-T6 之间（通常 100ms-2s）

### 4.2 富文本插件加载竞态

```
T0: activeSidebar = 'formulaSidebar', openNodeRichText = true
T1: watch 触发 addRichTextPlugin()
T2: FormulaSidebar v-if 条件: richTextPluginReady = false → 不挂载
T3: 富文本插件异步加载完成
T4: richTextPluginReady = true
T5: FormulaSidebar 挂载
```

### 4.3 KaTeX 加载竞态

```
T0: FormulaSidebar 挂载
T1: mounted() 调用 init()
T2: window.katex 未加载 → init() 静默返回
T3: KaTeX CDN 加载完成
T4: FormulaSidebar 不会重新初始化 → 公式列表为空
```

---

## 五、总结与修复建议

### 按优先级排序的关键修复建议

| 优先级 | 问题编号 | 建议修复方案 |
|--------|----------|-------------|
| P0 | 问题1 | 在 `setActiveSidebar` 中检查 `mindMap` 状态，若未初始化则延迟设置或给出加载提示 |
| P0 | 问题2 | 将 Search 的 `closeSideBar` 改为仅关闭搜索相关的 UI，不影响其他侧边栏；或在关闭前保存侧边栏状态 |
| P1 | 问题3 | 禅模式下提供键盘快捷键（如 Tab）来切换侧边栏显示 |
| P1 | 问题7 | 在 `FormulaSidebar` 中添加 `window.katex` 的 watch 或轮询机制，加载完成后重新初始化 |
| P2 | 问题5 | 考虑在 NodeIconToolbar 关闭后恢复之前的侧边栏状态 |
| P2 | 问题6 | 考虑在 NodeNoteSidebar 中添加"锁定"功能，防止意外关闭 |
| P3 | 问题9 | 使用 z-index 池或限制最大值 |
| P3 | 问题10 | 添加用户提示（toast）说明 AI 功能被禁用 |
| P4 | 问题11-14 | 代码优化，不影响核心功能 |
