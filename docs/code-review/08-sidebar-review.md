# 侧边栏"不显示"问题专项审查报告

## 一、架构概览

侧边栏系统由三层构成：

| 层级 | 组件/模块 | 职责 |
|------|-----------|------|
| 状态管理 | `stores/app.js` + `stores/runtime.js` | `activeSidebar` 状态变量 + `setActiveSidebar()` 函数 |
| 触发器 | `SidebarTrigger.vue` | 右侧工具栏入口，显示可切换的侧边栏列表 |
| 面板容器 | `Sidebar.vue` | 通用侧边栏容器，控制显示/隐藏动画 |
| 具体面板 | `OutlineSidebar`, `Style`, `BaseStyle`, `Setting`, `Theme`, `Structure`, `ShortcutKey`, `NodeIconSidebar`, `FormulaSidebar`, `NodeNoteSidebar`, `AiChat` | 各功能面板 |

---

## 二、问题清单

### 问题 1: `Sidebar.vue` 的 `show` 状态与 `forceShow` 竞态冲突

**严重程度**: 🔴 严重

**文件**: `src/pages/Edit/components/Sidebar.vue:41-53`

```javascript
data() {
  return {
    show: this.forceShow || false,  // 初始化时只读取一次 forceShow
    zIndex: 1100
  }
},
computed: {
  isShown() {
    return this.forceShow || this.show
  }
}
```

**问题**:
- `show` 在 `data()` 中仅在组件创建时读取一次 `forceShow` 的值
- 当快速切换不同侧边栏时，旧面板的 `forceShow` 变为 `false`，新面板的 `forceShow` 变为 `true`
- 但旧面板的 `show` 可能还残留为 `true`，而 `forceShow` 已变为 `false`，导致 `isShown` 计算结果不确定

**触发场景**: 快速切换"节点样式"→"基础样式"→"主题"时，旧面板可能闪烁或不消失

---

### 问题 2: `SidebarTrigger` 的 `show` 状态与 `activeSidebar` 互相独立

**严重程度**: 🔴 严重

**文件**: `src/pages/Edit/components/SidebarTrigger.vue:46-48, 63-72`

```javascript
data() {
  return {
    show: true,  // 控制触发器面板是否可见
    maxHeight: 0
  }
}
```

**问题**:
- `SidebarTrigger` 有独立的 `show` 状态控制触发器按钮栏的显示/隐藏
- 用户点击收起按钮后，触发器栏移到屏幕右侧外（`translateX(46px)`）
- 此时即使 `activeSidebar` 被设置为某个值，用户也看不到触发器栏来切换侧边栏
- 如果通过其他途径（快捷键、工具栏按钮）打开侧边栏，触发器栏仍然隐藏，用户无法关闭侧边栏

**触发场景**:
1. 用户点击触发器的收起按钮 → 触发器隐藏
2. 通过 NavigatorToolbar 的快捷键按钮打开侧边栏
3. 侧边栏显示，但触发器栏不可见，用户无法切换或关闭

---

### 问题 3: `isReadonly` 模式下自动清空侧边栏状态

**严重程度**: 🟡 中等

**文件**: `src/pages/Edit/components/SidebarTrigger.vue:90-95`

```javascript
watch: {
  isReadonly(val) {
    if (val) {
      setActiveSidebar('')  // 只读模式下强制关闭侧边栏
    }
  }
}
```

**问题**:
- 进入只读模式时自动清空 `activeSidebar`
- 但只读模式下仍然允许 `outline`、`shortcutKey`、`ai` 三个侧边栏
- 如果用户正在查看大纲侧边栏时触发只读模式，侧边栏会被意外关闭

---

### 问题 4: `FormulaSidebar` 在无活跃节点时自动关闭

**严重程度**: 🟡 中等

**文件**: `src/pages/Edit/components/FormulaSidebar.vue:111-118`

```javascript
handleNodeActive(...args) {
  this.activeNodes = [...(args[1] || [])]
  if (this.activeNodes.length <= 0 && this.activeSidebar === 'formulaSidebar') {
    setActiveSidebar('')
  }
}
```

**问题**: 取消节点选择时公式侧边栏自动关闭，与其他侧边栏行为不一致

---

### 问题 5: `setActiveSidebar(null)` 与 `setActiveSidebar('')` 混用

**严重程度**: 🟡 中等

**文件**: `src/pages/Edit/components/NodeNoteSidebar.vue:82-93`

```javascript
if (nodes.length > 0) {
  if (nodes[0] !== this.node) {
    setActiveSidebar('')  // 使用空字符串
  }
} else {
  setActiveSidebar(null)  // 使用 null
}
```

**问题**: 混用 `''` 和 `null` 关闭侧边栏，状态不一致可能导致依赖 `activeSidebar` 的逻辑出错

---

### 问题 6: AI 侧边栏被禁用时静默关闭

**严重程度**: 🟡 中等

**文件**: `src/stores/runtime.js:62-64, 102-108`

```javascript
if (value === 'ai' && !settingsStore.localConfig.enableAi) {
  appStore.setActiveSidebar('')
  return
}
```

**问题**: AI 功能被禁用时侧边栏被静默关闭，无任何用户提示

---

### 问题 7: 侧边栏组件使用 `v-if` 导致频繁挂载/卸载

**严重程度**: 🔴 严重

**文件**: `src/pages/Edit/components/Edit.vue:17-84`

```html
<OutlineSidebar v-if="mindMap && activeSidebar === 'outline'" ...></OutlineSidebar>
<Style v-if="mindMap && !isZenMode && activeSidebar === 'nodeStyle'" ...></Style>
<BaseStyle v-if="mindMap && activeSidebar === 'baseStyle'" ...></BaseStyle>
```

**问题**:
- 所有侧边栏组件使用 `v-if` 而非 `v-show`
- 每次切换侧边栏时，旧组件销毁（`beforeUnmount`），新组件创建（`created`/`mounted`）
- 事件监听器反复注册和注销
- 异步加载组件（`defineAsyncComponent`）在快速切换时出现加载竞态
- 组件内部状态（滚动位置、输入框内容）丢失

---

### 问题 8: 子组件通过 `$refs.sidebar.show` 直接修改状态的时序问题

**严重程度**: 🔴 严重

**文件**: 多个子组件（`OutlineSidebar.vue:70-80`, `NodeIconSidebar.vue:101-115`, `FormulaSidebar.vue:73-83`, `NodeNoteSidebar.vue:53-66`, `Style.vue:644-658`, `BaseStyle.vue:976-987`, `Setting.vue:505-514`, `AiChat.vue:135-148`）

```javascript
watch: {
  activeSidebar: {
    immediate: true,
    handler(val) {
      this.$nextTick(() => {
        if (this.$refs.sidebar) {
          this.$refs.sidebar.show = val === 'xxx'
        }
      })
    }
  }
}
```

**问题**:
1. **双重状态管理**: 子组件通过 `forceShow` prop 和 `$refs.sidebar.show` 两种方式控制同一个 `Sidebar.vue` 的显示状态
2. **`$nextTick` 延迟竞态**: 快速切换时，A→B→C 切换，A 的 `$nextTick` 可能在 C 的之后执行，覆盖正确状态
3. **`$refs` 可能为 `undefined`**: 在 `v-if` 条件下，组件未挂载或已卸载时静默失败

---

### 问题 9: `triggerList` 过滤导致某些侧边栏无入口

**严重程度**: 🟡 中等

**文件**: `src/pages/Edit/components/SidebarTrigger.vue:75-88`

**问题**:
- `sidebarTriggerList` 只包含 6 个侧边栏（nodeStyle, baseStyle, theme, structure, outline, setting）
- 缺失的侧边栏：`nodeIconSidebar`、`formulaSidebar`、`noteSidebar`、`shortcutKey`
- 这些侧边栏只能通过其他途径触发，关闭后用户不知道如何重新打开

---

### 问题 10: `closeSideBar` 事件广播导致所有 Sidebar 实例同时关闭

**严重程度**: 🟡 中等

**文件**: `src/pages/Edit/components/Sidebar.vue:71-78`

```javascript
created() {
  this.$bus.$on('closeSideBar', this.handleCloseSidebar)
}
```

**问题**:
- `closeSideBar` 事件通过事件总线广播，所有 `Sidebar` 实例都收到
- 多个实例同时调用 `setActiveSidebar('')`，产生冗余状态更新
- 不可见的 `Sidebar` 实例的 `show` 被设为 `false`，但 `forceShow` 可能仍然是 `true`

---

### 问题 11: CSS 三重隐藏机制的过渡动画问题

**严重程度**: 🟢 轻微

**文件**: `src/pages/Edit/components/Sidebar.vue:54-60, 94-96`

```javascript
sidebarStyle() {
  return {
    right: this.isShown ? '0' : '-300px',
    opacity: this.isShown ? 1 : 0,
    pointerEvents: this.isShown ? 'auto' : 'none'
  }
}
```

```css
.sidebarContainer {
  position: fixed;
  right: -300px;
  transition: all 0.3s;
}
```

**问题**: `transition: all 0.3s` 对所有属性应用过渡，`pointerEvents` 从 `none` 变为 `auto` 时不应该有过渡

---

### 问题 12: `NodeIconSidebar` 的 `mounted` 与 `watch` 重复逻辑

**严重程度**: 🟢 轻微

**文件**: `src/pages/Edit/components/NodeIconSidebar.vue:101-125`

**问题**: `watch` 设置了 `immediate: true`，`mounted` 又重复相同检查，`ensurePanelAssetsLoaded()` 可能执行两次

---

### 问题 13: `AiChat` 组件不依赖 `mindMap` 存在

**严重程度**: 🟡 中等

**文件**: `src/pages/Edit/components/Edit.vue:84`

```html
<AiChat v-if="enableAi"></AiChat>
```

**问题**: `AiChat` 不依赖 `mindMap` 是否存在，只要 `enableAi` 为 `true` 就挂载，与其他侧边栏行为不一致

---

### 问题 14: `zIndex` 全局递增计数器可能溢出

**严重程度**: 🟢 轻微

**文件**: `src/pages/Edit/components/Sidebar.vue:64-68`

```javascript
watch: {
  isShown(val, oldVal) {
    if (val && !oldVal) {
      this.zIndex = 1100 + store.sidebarZIndex++
    }
  }
}
```

**问题**: 每次侧边栏显示时 z-index 递增，频繁切换会导致 z-index 值异常大

---

### 问题 15: `ShortcutKey` 侧边栏没有使用 `Sidebar` 包装

**严重程度**: 🟡 中等

**文件**: `src/pages/Edit/components/Edit.vue:49`

```html
<ShortcutKey v-if="activeSidebar === 'shortcutKey'"></ShortcutKey>
```

**问题**: `ShortcutKey` 直接使用 `v-if` 渲染，不受 `Sidebar.vue` 的显示/隐藏逻辑控制

---

### 问题 16: `mindMap` 为 `null` 时侧边栏渲染阻塞

**严重程度**: 🔴 严重

**文件**: `src/pages/Edit/components/Edit.vue:17-84`

**问题**:
- `mindMap` 在 `data()` 中初始化为 `null`（`Edit.vue:343`）
- `mindMap` 只有在 `init()` 异步完成后才被赋值（`Edit.vue:730`）
- 在 `mindMap` 赋值之前，所有依赖 `mindMap` 的侧边栏组件都不会被创建
- **关键竞态场景**:
  1. 应用启动时，`activeSidebar` 可能被设置为某个值（从之前会话恢复）
  2. 但由于 `mindMap` 为 `null`，侧边栏组件不会被创建
  3. 当 `mindMap` 初始化完成后，`activeSidebar` 的值可能已被其他操作改变
  4. 即使 `activeSidebar` 仍然是目标值，Vue 响应式更新可能只触发一次检查

---

### 问题 17: `SidebarTrigger` 的 `show` 状态没有持久化

**严重程度**: 🟡 中等

**文件**: `src/pages/Edit/components/SidebarTrigger.vue:46-48`

**问题**: 触发器栏的显示/收起状态没有持久化，每次刷新页面后恢复为显示状态

---

### 问题 18: 收起状态下点击侧边栏项的视觉反馈缺失

**严重程度**: 🟡 中等

**文件**: `src/pages/Edit/components/SidebarTrigger.vue:63-72`

**问题**: 当 `show = false` 时，`translateX` 固定为 `46px`，无论 `activeSidebar` 是什么值，用户无法从触发器栏位置判断当前哪个侧边栏激活

---

## 三、最可能导致"侧边栏不显示"的 Top 5 原因

| 排名 | 问题 | 文件 | 严重程度 |
|------|------|------|----------|
| 1 | `mindMap` 为 `null` 时侧边栏组件未挂载 | `Edit.vue:17-84` | 🔴 |
| 2 | `$nextTick` 导致的竞态条件 | 多个子组件的 watch | 🔴 |
| 3 | `SidebarTrigger` 收起后无法恢复 | `SidebarTrigger.vue:46-48` | 🔴 |
| 4 | `v-if` 导致的组件销毁/重建 | `Edit.vue:17-84` | 🔴 |
| 5 | `isReadonly` / `enableAi` 配置变更时的静默关闭 | `SidebarTrigger.vue:90-95`, `runtime.js:62-64` | 🟡 |

---

## 四、修复建议优先级

### P0 - 必须修复

1. **解决 `mindMap` 初始化与侧边栏渲染的竞态**: 在 `mindMap` 初始化完成后，检查 `activeSidebar` 状态并正确渲染对应侧边栏
2. **消除 `$nextTick` 竞态**: 移除子组件中通过 `$refs.sidebar.show` 直接修改状态的逻辑，统一使用 `forceShow` prop 驱动
3. **`SidebarTrigger` 收起状态与侧边栏联动**: 当侧边栏打开时自动展开触发器栏

### P1 - 建议修复

4. **统一关闭侧边栏的值**: 全部使用 `''` 而非混用 `null`
5. **`v-if` 改为 `v-show`**: 减少组件挂载/卸载开销，避免异步加载竞态
6. **添加配置变更时的用户提示**: AI 禁用、只读模式切换时提示用户侧边栏已关闭
7. **完善 `triggerList`**: 将所有侧边栏加入触发器列表

### P2 - 可选优化

8. **持久化 `SidebarTrigger` 的 `show` 状态**
9. **修正 `transition` 属性**: 改为 `transition: right 0.3s, opacity 0.3s`
10. **`ShortcutKey` 统一使用 `Sidebar` 包装**
