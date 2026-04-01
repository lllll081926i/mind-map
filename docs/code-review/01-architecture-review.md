# 架构与代码质量审查报告

## 一、项目概览

- **项目名称**: mind-map-app (思绪思维导图)
- **技术栈**: Vue 3 + Pinia + Vite 8 + Tauri 2
- **核心库**: simple-mind-map v0.14.0-fix.2
- **架构**: Monorepo（npm workspaces），包含 mind-map-app、simple-mind-map、simple-mind-map-plugin-themes 三个子包

---

## 二、审查结果

### 1. 项目架构

#### 1.1 整体架构评价：良好

**优点：**
- Monorepo 结构，核心库与应用分离，可独立发布使用
- 平台抽象层 (`src/platform/`) 设计合理，支持桌面/浏览器环境切换
- 插件化架构清晰，核心库通过 `MindMap.usePlugin()` 注册插件

**问题：**

| 文件 | 问题 | 建议 |
|------|------|------|
| `src/pages/Edit/components/Edit.vue` (1085行) | 承担思维导图创建、插件管理、事件绑定、数据持久化、拖拽导入等 10+ 职责 | 拆分为 `MindMapInstance`、`PluginManager`、`EventBridge` 等独立模块 |
| `src/platform/index.js` (267行) | 混合平台引导、文件读写队列、最近文件管理、状态持久化 | 拆分为 `platformBootstrap.js`、`fileOperations.js`、`recentFiles.js` |
| `src/pages/Edit/components/Toolbar.vue` (1219行) | 集成工具栏渲染、响应式布局、文件树、本地读写、最近文件管理 | 文件树提取为 `FileTreePanel.vue`，文件操作提取为 `useFileOperations.js` |

### 2. SOLID 原则

| 文件 | 问题 | 原则 | 建议 |
|------|------|------|------|
| `src/pages/Edit/components/Edit.vue` | 1085 行，10+ 职责 | SRP | 拆分为多个独立模块 |
| `src/pages/Edit/components/Toolbar.vue` | 1219 行，5+ 职责 | SRP | 提取文件树和文件操作逻辑 |
| `src/services/appEvents.js:51-121` | 每个事件定义 `onXxx`/`emitXxx` 辅助函数 | DRY | 用泛型方式处理 |
| `src/config/index.js` 和 `src/config/zh.js` | 配置数据硬编码为中文，多语言需同时修改两文件 | OCP | 配置数据通过 i18n 系统管理 |

### 3. DRY 原则

| 文件 | 问题 | 建议 |
|------|------|------|
| `Style.vue` 和 `BaseStyle.vue` | 大量重复的样式控制逻辑 | 提取通用样式管理器 |
| `Toolbar.vue` | `openNodeImageDialog`、`openNodeLinkDialog`、`openNodeNoteDialog`、`openNodeTagDialog` 结构完全相同 | 提取通用 Panel 管理器 |
| 多个组件 | `$bus.$on`/`$bus.$off` 重复模式 | 创建 `useEventBus` composable 统一管理 |
| `src/stores/app.js` | 每个 action 只是简单赋值 | 合并相关状态，使用 `$patch` |

### 4. 状态管理

#### 4.1 双重状态持久化机制

| 系统 | 位置 | 职责 |
|------|------|------|
| Pinia stores | `src/stores/` | 应用状态管理 |
| Bootstrap state | `src/platform/index.js` | 平台级持久化状态 |
| Document session | `src/services/documentSession.js` | 文档会话状态 |

**问题**:
- `bootstrapState` 和 Pinia store 同时存在，通过 `saveBootstrapStatePatch` 队列写入，缺乏错误重试
- 配置数据流：`localConfigStorage` → `bootstrapState` → `runtime.js` → `settingsStore` → 组件，同一配置通过多层传递
- `src/stores/runtime.js` (151行) 混合 Store 实例管理、配置持久化、配置应用、工厂方法

**建议**: 统一使用 Pinia + pinia-plugin-persistedstate 作为唯一数据源

#### 4.2 模块间循环依赖风险

- `runtime.js` 导入所有 store，store 又可能通过 `getRuntimeStores()` 访问 runtime
- 建议使用 Pinia 的 `storeToRefs` 和跨 store 访问模式替代

### 5. 组件设计

#### 5.1 组件耦合

| 文件 | 问题 | 建议 |
|------|------|------|
| `Edit.vue` | 订阅 10+ 个 bus 事件，20+ 子组件直接接收 `mindMap` 实例作为 prop | 通过 store 封装操作，避免子组件直接依赖核心实例 |
| 多个组件 | 通过 `$bus` 事件总线深度耦合 | 逐步迁移到 Pinia store + provide/inject |

#### 5.2 设计问题

| 文件 | 问题 | 建议 |
|------|------|------|
| `Sidebar.vue` | 作为通用容器但功能受限，所有具体侧边栏都需要重复处理 `activeSidebar` 状态 | 将侧边栏管理逻辑统一到 `SidebarManager` 组件 |
| 多个组件 | 动态组件加载策略不一致（部分 `defineAsyncComponent`，部分同步导入） | 统一懒加载策略 |

### 6. 代码组织

| 文件 | 问题 | 建议 |
|------|------|------|
| `src/pages/Edit/components/` | 30+ 个组件全部放在同一目录 | 按功能域分组：`sidebar/`、`toolbar/`、`dialogs/`、`panels/`、`shared/` |
| `simple-mind-map/src/core/render/Render.js` | 超过 2200 行 | 按功能拆分为 `nodeOperations.js`、`layout.js`、`clipboard.js` |

### 7. 命名规范

| 文件 | 问题 | 建议 |
|------|------|------|
| 全局 | 方法命名风格混杂（`camelCase`、`snake_case`、`$` 前缀） | 统一使用 `camelCase` |
| `Contextmenu.vue:378` | `mosuedownX`、`mosuedownY` 拼写错误 | 改为 `mouseDownX`、`mouseDownY` |
| `Contextmenu.vue:386` | `show2` 命名不明确 | 改为 `showOnCanvas` |

### 8. 代码重复和冗余

| 文件 | 问题 | 建议 |
|------|------|------|
| `src/main.js` | 34 个独立 Element Plus import + 29 个 CSS 导入 | 使用全量导入或自动导入插件 |
| 多个组件 | 暗黑模式样式重复定义 | 提取到全局 `dark-mode.less` 或使用 CSS 变量 |
| `src/services/legacyBus.js` | 仅是对 `appEvents.js` 的薄包装 | 制定迁移计划，最终移除 |
| `package.json` | `build:library` 和 `buildLibrary` 等价 | 删除 `buildLibrary` |
| `eslint.config.js` | 禁用大量 Vue 规则（`vue/no-v-html`、`vue/no-mutating-props` 等） | 逐步修复而非关闭规则 |

### 9. 其他问题

| 文件 | 问题 | 建议 |
|------|------|------|
| `tsconfig.json` | `checkJs: false`、`strict: false` | 要么完全采用 TypeScript，要么移除 tsconfig |
| `Edit.vue` | 插件动态加载可能导致竞态条件 | 添加对移除操作的同步保护 |
| `vite.config.js` 和 `vite.lib.config.js` | 重复的 `resolve.alias` 配置 | 提取共享配置到 `vite.shared.config.js` |

---

## 三、综合评分

| 维度 | 评分（1-5） | 说明 |
|------|------------|------|
| 项目架构 | 4 | Monorepo + 插件化设计合理，部分模块职责过重 |
| 代码规范 | 3 | 命名不一致，ESLint 规则大量禁用 |
| 组件设计 | 3 | 组件间通过 `$bus` 深度耦合，`mindMap` 实例传递过深 |
| 状态管理 | 3 | 双重持久化机制，配置传递链过长 |
| 可维护性 | 3 | 巨型文件过多，目录扁平化严重 |
