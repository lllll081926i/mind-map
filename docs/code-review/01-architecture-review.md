# 架构与代码质量审查报告

## 一、项目概览

- **项目名称**: mind-map-app (思绪思维导图)
- **技术栈**: Vue 3 + Pinia + Vite + Tauri 2
- **核心库**: simple-mind-map (基于 SVG.js 的纯 JS 思维导图库)
- **架构**: Monorepo 风格，主应用与核心库共用仓库

---

## 二、审查结果

### 1. 项目架构

#### 1.1 整体架构评价：中等偏上

**优点：**
- 平台抽象层 (`src/platform/`) 将桌面端 (Tauri) 与浏览器环境隔离，设计合理
- `simple-mind-map` 作为独立库，可复用于其他项目
- 状态管理使用 Pinia，按领域拆分 (app, editor, settings, theme, ai)
- 事件系统分层：`legacyBus` (旧版) + `appEvents` (新版)

**问题：**

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/main.js` | 119 | 使用 `app.config.globalProperties.$bus` 挂载 EventBus，Vue 2 遗留模式 |
| `src/main.js` | 3-33 | Element Plus 组件逐个手动注册 + CSS 手动引入，30+ 行冗余 |
| `src/api/index.js` | 1-80 | 名为 `api` 实际是数据存取层，命名与职责不符 |
| `src/platform/index.js` | 267-319 | `platformAdapter` 每个方法只做 `getPlatform().xxx(...args)` 透传，完全冗余 |
| `src/stores/runtime.js` | 101-105 | `createStoreSetter` 工厂函数创建大量单行代理方法 |

### 2. SOLID 原则

| 文件 | 行号 | 问题 | 原则 |
|------|------|------|------|
| `src/pages/Edit/components/Edit.vue` | 1-935 | 单文件 935 行，承担 10+ 职责 | SRP |
| `src/pages/Edit/components/Toolbar.vue` | 1-1127 | 单文件 1127 行，包含文件树、本地读写、导出等 | SRP |
| `src/services/appEvents.js` | 51-121 | 每个事件定义 `onXxx`/`emitXxx` 辅助函数 | DRY |
| `src/utils/index.js` | 1-110 | 全屏、复制、打印、DOM 查找混在一起 | SRP |

### 3. DRY 原则

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/config/index.js` | 29-91 | 14 个列表配置，每个重复 `const xxxList = { zh: xxxListZh }` |
| `src/pages/Edit/components/Edit.vue` | 402-432 | 10 个 `$bus.$on` 和 10 个 `$bus.$off` 一一对应 |
| `src/stores/app.js` | 13-34 | 7 个 setter action 都是 `this.xxx = value` |
| `src/services/legacyBus.js` | 1-31 | 与 `appEvents.js` 几乎相同的事件总线逻辑 |

### 4. 状态管理

#### 4.1 三套状态系统并存

| 系统 | 位置 | 职责 |
|------|------|------|
| Pinia stores | `src/stores/` | 应用状态管理 |
| Bootstrap state | `src/platform/index.js` | 平台级持久化状态 |
| Document session | `src/services/documentSession.js` | 文档会话状态 |

**问题**:
- `bootstrapState` 以模块级变量存储，stores 通过 `syncRuntimeFromBootstrapState` 同步，存在数据不一致风险
- `persistCompositeConfig` 将 store 数据写回 bootstrap state，形成循环依赖
- `sessionState` 使用模块级变量，非响应式，与 Pinia store 可能不同步

#### 4.2 具体问题

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/stores/runtime.js` | 13-17 | 模块顶层创建 store 实例，不利于 SSR/测试 |
| `src/stores/runtime.js` | 139 | 模块加载时立即执行 `syncThemeFromLocalConfig()` |
| `src/services/documentSession.js` | 9 | `sessionState` 非响应式模块级变量 |
| `src/platform/index.js` | 25-31 | 6 个模块级变量管理状态，与 Pinia 职责重叠 |

### 5. 组件耦合

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/pages/Edit/components/Edit.vue` | 100 | 直接 import `@/api`，应通过 store/service 层 |
| `src/pages/Edit/components/Toolbar.vue` | 197 | 混用 `@/` 别名和相对路径 |
| `src/pages/Edit/components/Edit.vue` | 164-189 | `FORWARDED_MIND_MAP_EVENTS` 23 个事件全部转发到 `$bus` |

### 6. 命名规范

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/utils/index.js` | 15 | `fullscrrenEvent` 拼写错误 |
| `src/lang/zh_cn.js` | 305-307 | `strusture` 拼写错误 |
| `src/pages/Edit/Index.vue` | 378 | 模板中使用 `strusture` |
| `src/services/appEvents.js` | 4-16 | 事件名混用 `snake_case` 和 `camelCase` |
| `package.json` | 17-18 | `build:library` 和 `buildLibrary` 做同一件事 |

### 7. 代码重复

| 文件 | 问题 |
|------|------|
| `src/services/legacyBus.js` vs `appEvents.js` | 两个几乎相同的事件总线实现 |
| `vite.config.js` vs `vite.lib.config.js` | alias 配置重复 |
| `src/stores/app.js` | 7 个结构完全相同的 setter |
| `src/platform/index.js` | 18 个透传方法 |

---

## 三、改进建议

1. **拆分巨型组件**: `Edit.vue` → `MindMapCanvas`、`PluginManager`、`DataSyncManager`
2. **统一状态管理**: 将 `bootstrapState` 和 `sessionState` 迁移到 Pinia
3. **移除 EventBus**: 用 Pinia actions + composables 替代 `$bus`
4. **合并事件系统**: 淘汰 `legacyBus`，统一使用 `appEvents`
5. **提取公共 Vite 配置**: 创建 `vite.base.config.js`
6. **修复命名错误**: 统一事件名风格，修正拼写错误
7. **移除硬编码调试代码**: `cooperateTest` 移至独立调试模块
