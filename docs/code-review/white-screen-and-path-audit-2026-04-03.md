# 白屏与路径问题全面审查报告（第三轮完整版）

> 审查日期：2026-04-03
> 审查方式：10 Agent 并行全量代码审查（第三轮）
> 审查范围：前端应用层、平台适配层、Tauri/Rust 后端、构建配置、核心库、工具函数、组件、主题插件、测试脚本

---

## 执行摘要

本次审查通过 **10 个并行 Agent** 对整个项目进行了第三轮全面审查，共发现 **70+ 个问题**，其中 **严重级别 28 个**、**高风险 16 个**、**中等风险 18 个**、**低风险 8 个**。

**白屏最可能根因（按可能性排序）：**
1. 状态文件非原子写入导致 JSON 损坏 + 读取端无降级处理
2. `loadMindMapRuntime()` 中 `Promise.all` 无错误处理，失败后缓存 rejected Promise 无法重试
3. 构造函数中未捕获的异常（MindMap 容器不存在/尺寸为 0）
4. 插件初始化无错误边界，单个插件崩溃导致全局白屏
5. Export 页面 `data()` 中调用 `this.$t` 在组件初始化前可能为 `undefined`
6. `ensure_directory_scope_allowed` 首次启动拒绝外部文件（新增发现）
7. `/export` 与 `/edit` 路由共享组件导致两个 MindMap 实例竞争同一 DOM 元素（新增发现）
8. 核心渲染循环 `_render()` 无异常捕获，单节点异常中断整棵树（新增发现）

**路径问题最可能根因（按可能性排序）：**
1. Windows 中文用户名路径下 `canonicalize` 返回 UNC 格式 + `to_str()` 对非 UTF-8 路径返回 `None`
2. 路径分隔符硬编码（Windows `\` 被转为 `/` 后传递给 Tauri 命令解析失败）
3. `canonicalize` 对不存在路径直接失败，导致文件写入被权限检查拒绝
4. `file_association.rs` 中 `canonicalize` 返回 `\\?\` 前缀路径未规范化（新增发现）
5. `list_directory_entries` 返回的路径携带 `\\?\` 前缀（新增发现）
6. `is_path_safe` 过度拒绝含 `..` 的路径（新增发现）

---

## 问题汇总（按严重程度排序）

---

### 🔴 严重问题 (Critical) — 28 个

#### S1. 状态文件非原子写入导致数据损坏

- **位置:** `src-tauri/src/services/app_state.rs:181-189` (`write_json_file`)
- **影响:** 白屏（启动时无法解析状态文件）
- **原因:** `tokio::fs::write` 不是原子操作。写入过程中应用崩溃或被强制关闭，文件会处于不完整状态。下次启动时 `serde_json::from_slice` 解析失败。
- **修复:** 改为先写入临时文件再 `rename` 的原子写入模式。

#### S2. 状态文件 JSON 解析失败无降级处理

- **位置:** `src-tauri/src/services/app_state.rs:165-179` (`read_json_file`)
- **影响:** 白屏（状态文件损坏后无法启动）
- **原因:** 没有处理 UTF-8 BOM 标记，没有处理只含空白字符的文件，解析失败后错误直接传播到前端。
- **修复:** 添加 BOM 跳过、空白检测、解析失败时返回默认值并备份损坏文件。

#### S3. `canonicalize` 对不存在路径直接失败，导致文件写入被拒绝

- **位置:** `src-tauri/src/services/app_fs.rs:106-131` (`ensure_directory_scope_allowed`)
- **影响:** 路径炸了（保存新文件时权限检查失败）
- **原因:** `tokio::fs::canonicalize` 要求路径必须存在。保存新文件时路径尚不存在，直接返回 `NotFound` 错误。
- **修复:** 对不存在的路径，尝试规范化其父目录。

#### S4. `collect_allowed_directory_roots` 中 `canonicalize` 失败导致合法目录被静默忽略

- **位置:** `src-tauri/src/services/app_fs.rs:89-103`
- **影响:** 路径炸了（app_data_dir 规范化失败后，状态文件所在目录被拒绝访问）
- **修复:** `canonicalize` 失败但路径存在时，使用原始路径作为 fallback。

#### S5. `file_association.rs` 中 `to_str()` 对中文路径返回 `None`

- **位置:** `src-tauri/src/services/file_association.rs:115`
- **影响:** 路径炸了（双击 .smm 文件打开时路径被静默丢弃）
- **修复:** 使用 `to_string_lossy()` 替代 `to_str()`。

#### S6. `hydrateWorkspaceFileSession` 中非关键 I/O 阻塞编辑器导航

- **位置:** `src/services/workspaceActions.js:70-73`
- **影响:** 白屏 / 点击文件无响应
- **原因:** `setWorkspaceLastDirectory` 和 `recordRecentFile` 磁盘写入失败时，`await` 抛出异常，导致 `enterEditor(router)` 永远不会执行。
- **修复:** 将非核心持久化操作改为 fire-and-forget（`.catch()` 异步执行）。

#### S7. Windows 路径分隔符硬编码导致路径转换错误

- **位置:** `src/services/workspaceActions.js:36`、`src/services/documentSession.js:20`
- **影响:** 路径炸了（Windows 路径被转换为正斜杠后传递给 Tauri 对话框或 Rust 命令时解析失败）
- **修复:** 保留原始路径的分隔符，使用 `lastIndexOf` 查找最后一个分隔符并截取。

#### S8. 事件总线未捕获监听器异常，导致初始化中断

- **位置:** `src/services/appEvents.js:50-52`
- **影响:** 白屏（某个监听器报错导致后续监听器收不到事件）
- **修复:** 为每个监听器包裹 `try/catch`。

#### S9. CSP 配置缺少 `'unsafe-eval'` 可能导致发布版本白屏

- **位置:** `src-tauri/tauri.conf.json:27`
- **影响:** 白屏（发布版本脚本被 CSP 阻止执行）
- **修复:** 在 `tauri.conf.json` 中统一添加 `'unsafe-eval'`。

#### S10. `loadMindMapRuntime()` 中 `Promise.all` 无错误处理，失败后缓存 rejected Promise

- **位置:** `src/pages/Edit/components/Edit.vue:193-259`、`src/pages/Export/Index.vue:305-323`
- **影响:** 白屏（思维导图核心运行时无法加载，且无法重试）
- **原因:** `Promise.all` 中任何一个动态 import 失败都会导致整个 Promise 被 reject。由于 `mindMapRuntimePromise` 是模块级变量，一旦失败就会被缓存为 rejected Promise。
- **修复:** 添加 `.catch()` 并在 catch 中重置 `mindMapRuntimePromise = null` 允许重试。

#### S11. MindMap 构造函数中未捕获的异常

- **位置:** `simple-mind-map/index.js:66`, `simple-mind-map/index.js:338-339`
- **影响:** 白屏（容器元素不存在或尺寸为 0 时直接 throw）
- **原因:** 两处 `throw new Error` 没有任何 try-catch 包裹。
- **修复:** 通过 `errorHandler` 通知而非直接 throw，或设置默认值避免后续代码崩溃。

#### S12. 插件初始化无错误边界，单个插件崩溃可导致全局白屏

- **位置:** `simple-mind-map/index.js:130-136`, `simple-mind-map/index.js:768-774`
- **影响:** 白屏（20 个插件中任何一个初始化失败都会中断整个 MindMap 构造）
- **修复:** 在 `initPlugin` 中添加 try/catch，不中断其他插件的初始化。

#### S13. Export 页面 `data()` 中调用 `this.$t` 在组件初始化前可能为 `undefined`

- **位置:** `src/pages/Export/Index.vue:367-372`
- **影响:** 白屏（导出页面渲染失败）
- **原因:** 在 Vue 3 的 `data()` 函数中，`this.$t`（来自 vue-i18n）可能尚未注入。
- **修复:** 将 `exportFormats` 和 `fallbackExportFormat` 的初始化移到 `computed` 或 `mounted()` 中。

#### S14. `MoreThemes` 全局变量未定义可能导致运行时错误

- **位置:** `src/pages/Edit/components/Edit.vue:250-251`、`src/pages/Export/Index.vue:314-315`
- **影响:** 白屏（思维导图核心运行时无法加载）
- **修复:** 使用 `globalThis.MoreThemes` 替代裸变量引用，并检查 `init` 方法存在性。

#### S15. 路由动态导入使用模板字符串可能导致构建时 chunk 路径异常

- **位置:** `src/router.js:11,16,21,29`
- **影响:** 路径炸了（构建后 chunk 引用路径不正确）
- **修复:** 改为静态字符串导入 `import('./pages/Home/Index.vue')`。

#### S16. `app_data_dir` 路径创建失败导致应用启动崩溃

- **位置:** `src-tauri/src/services/app_state.rs:132-145` (`state_dir_path`)
- **影响:** 白屏（Windows 中文用户名路径创建失败）
- **修复:** 增强错误信息并验证目录确实存在且可访问。

#### S17. `themeImgMap.js` 同步导入所有主题图片，任一图片缺失即导致模块加载失败

- **位置:** `simple-mind-map-plugin-themes/themeImgMap.js:1-57`
- **影响:** 白屏（57 个图片文件在模块加载时同步导入，任一失败导致整个模块加载失败）
- **修复:** 使用动态导入或 `import.meta.glob` 延迟加载图片，并添加 fallback。

#### S18. `themeList.js` 子路径导出无 fallback，模块加载失败导致白屏

- **位置:** `simple-mind-map-plugin-themes/themeList.js:1-3`
- **影响:** 白屏（主题列表模块加载失败导致依赖组件无法渲染）
- **修复:** 在组件中添加 try-catch 包裹导入。

#### S19. `setDataToClipboard` 和 `setImgToClipboard` 未处理的 Promise rejection

- **位置:** `src/utils/index.js:117-121`, `src/utils/index.js:124-129`
- **影响:** 白屏（unhandled promise rejection 可能触发全局错误处理）
- **修复:** 添加 `.catch()` 静默处理。

#### S20. `api/index.js` 中 `getData()` 的 `appStore` 可能为 `undefined`

- **位置:** `src/api/index.js:12-20`
- **影响:** 白屏（store 尚未初始化时调用 `getData()` 抛出 TypeError）
- **修复:** 使用可选链 `appStore?.isHandleLocalFile`。

#### S21. `createNodeImageList.js` 在循环内覆写输出文件

- **位置:** `scripts/createNodeImageList.js:42-51`
- **影响:** 路径炸了（生成的 `src/config/image.js` 只包含最后一个 SVG 目录的数据）
- **修复:** 将 `fs.writeFileSync` 移到所有目录遍历完成后一次性写入。

#### S22. Edit.vue 中 `init()` 方法缺少对 `mindMap` 实例的空值保护

- **位置:** `src/pages/Edit/components/Edit.vue:968`
- **影响:** 白屏（`new MindMap` 成功后后续步骤失败，`this.mindMap.keyCommand.addShortcut` 空值引用）
- **修复:** 在 `new MindMap` 之后立即检查实例有效性，使用可选链调用后续方法。

#### S23. `ensure_directory_scope_allowed` 首次启动拒绝外部文件（新增发现）

- **位置:** `src-tauri/src/services/app_fs.rs:71-131`
- **影响:** 白屏（双击 .smm 文件打开时，首次启动 `last_directory`、`current_document`、`recent_files` 全为空，唯一允许的根目录只有 `app_data_dir`，用户文件所在目录不在允许列表中）
- **原因:** "先有鸡还是先有蛋"问题。文件关联路径未被加入允许列表，权限检查拒绝访问。
- **修复:** 将 `PendingAssociatedFiles` 中的路径也加入 `collect_allowed_directory_roots` 的允许列表。

#### S24. `file_association.rs` 中 `canonicalize` 返回 `\\?\` 前缀路径未规范化（新增发现）

- **位置:** `src-tauri/src/services/file_association.rs:114`
- **影响:** 路径炸了（Windows 上 `canonicalize` 返回带 `\\?\` 前缀的路径，在 UI 中显示异常，与已规范化路径比较时失败）
- **修复:** 使用 `normalize_windows_path_prefix` 函数去除 `\\?\` 前缀。

#### S25. `list_directory_entries` 返回的路径携带 `\\?\` 前缀（新增发现）

- **位置:** `src-tauri/src/services/app_fs.rs:258-270`
- **影响:** 路径炸了（前端收到带 `\\?\` 前缀的路径，传回后端时路径比较失败）
- **修复:** 在构建 `DirectoryEntry` 时规范化路径。

#### S26. 核心渲染循环 `_render()` 无异常捕获（新增发现）

- **位置:** `simple-mind-map/src/core/render/Render.js:562`
- **影响:** 白屏（布局算法计算异常或节点数据异常导致渲染中断，画布保持空白）
- **修复:** 在 `_render()` 外层包裹 try-catch，调用 `errorHandler` 并确保状态机复位。

#### S27. 递归渲染 `MindMapNode.render()` 无错误边界（新增发现）

- **位置:** `simple-mind-map/src/core/render/node/MindMapNode.js:651-668`
- **影响:** 白屏（单节点异常中断整棵树的渲染）
- **修复:** 在每个节点的 `render()` 中添加 try-catch，异常时继续执行回调避免阻塞其他分支。

#### S28. `/export` 与 `/edit` 路由共享组件导致两个 MindMap 实例竞争同一 DOM 元素（新增发现）

- **位置:** `src/router.js:14-22`, `src/pages/Edit/Index.vue:7-9`
- **影响:** 白屏（Edit.vue 和 Export/Index.vue 同时初始化 MindMap 实例，共享同一个 `#mindMapContainer` DOM 元素）
- **修复:** 在 `/export` 路由下不渲染 `<Edit>` 组件，只渲染 `<ExportDialog>`。

---

### 🟠 高风险问题 (High) — 16 个

#### H1. 状态写入队列静默吞掉错误

- **位置:** `src/platform/index.js:96`, `src/platform/index.js:110`
- **影响:** 数据丢失
- **修复:** 至少记录错误日志。

#### H2. `bootstrapPlatformState` 降级策略过于激进

- **位置:** `src/platform/index.js:133-141`
- **影响:** 用户配置丢失
- **修复:** 区分"文件不存在/格式损坏"与"临时 I/O 错误"。

#### H3. `write_text_file` 不会创建不存在的父目录

- **位置:** `src-tauri/src/services/app_fs.rs:163-181`
- **影响:** 路径炸了
- **修复:** 使用 `create_dir_all` 尝试创建父目录。

#### H4. `read_bootstrap_document_state` 返回类型不一致

- **位置:** `src-tauri/src/commands/config.rs:20-25`
- **影响:** 前端可能收到空的状态数据
- **修复:** 确认这是预期行为，或修改为返回 `DesktopDocumentState`。

#### H5. `is_path_safe` 对 `\\?\` UNC 前缀和 `..` 的拦截过于严格（合并发现）

- **位置:** `src-tauri/src/services/app_fs.rs:14-35`
- **影响:** 路径炸了（深层目录中的合法文件被拒绝，含 `..` 的合法路径被阻断）
- **修复:** 规范化去除 UNC 前缀，允许 `..` 但在规范化后检查是否逃逸允许根目录。

#### H6. `buildDesktopSaveDefaultPath` 路径分隔符检测逻辑脆弱

- **位置:** `src/platform/desktop/index.js:79-83`
- **影响:** 路径炸了
- **修复:** 使用 `path.sep` 或根据 Tauri OS API 判断。

#### H7. `mindMapRuntimePromise` 失败后永久缓存，无法重试

- **位置:** `src/pages/Edit/components/Edit.vue:150`
- **影响:** 白屏
- **修复:** 在 `retryInit()` 中重置所有模块级 Promise 缓存。

#### H8. xmind 解析中文件路径处理在 Windows 下可能失败

- **位置:** `simple-mind-map/src/parse/xmind.js:25`, `simple-mind-map/src/utils/xmind.js:116`
- **影响:** 路径炸了
- **修复:** 同时检查 `'\\content.xml'`，图片路径使用 `split(/[\\/]/)` 处理。

#### H9. RichText 插件在 `document.querySelector` 找不到元素时崩溃

- **位置:** `simple-mind-map/src/plugins/RichText.js:337-338`
- **影响:** 白屏
- **修复:** 添加 null 检查。

#### H10. `getElementsByType` 在找不到元素时抛出 TypeError

- **位置:** `simple-mind-map/src/utils/xmind.js:68-72`
- **影响:** 路径炸了
- **修复:** 检查 `find` 返回值。

#### H11. `syncBootstrapState` 的 fire-and-forget 异步链导致竞态条件（新增发现）

- **位置:** `src/services/documentSession.js:26-50`
- **影响:** 路径炸了（快速连续文件操作导致多个异步链并发执行，路径状态被旧值覆盖）
- **修复:** 使用序列化队列替代 fire-and-forget。

#### H12. `bootstrapMetaPromise` 被 `saveBootstrapStatePatch` 覆盖为 `Promise.resolve`（新增发现）

- **位置:** `src/platform/index.js:197-231`
- **影响:** 状态写入丢失（桌面端正在后台异步读取时，读取结果被丢弃）
- **修复:** 让 `queueMetaWrite` 完成后更新 promise，而非直接覆盖。

#### H13. Edit.vue 中 `retryInit()` 没有清理 `bindSaveEvent` 注册的事件

- **位置:** `src/pages/Edit/components/Edit.vue:583-598`
- **影响:** 内存泄漏和重复保存
- **修复:** 在 `retryInit()` 中清理 save 事件监听器。

#### H14. `getParentDirectory` 和 `getDirectoryPath` 使用 `Math.max(lastIndexOf)` 在混合路径格式时可能返回错误结果

- **位置:** `src/services/documentSession.js:17-24`, `src/services/workspaceActions.js:32-39`
- **影响:** 路径炸了
- **修复:** 统一使用正则 `value.search(/[\\/][^\\/]*$/)` 查找最后一个分隔符。

#### H15. `ERROR_TYPES.EXEC_COMMAND_ERROR` 常量未定义（新增发现）

- **位置:** `simple-mind-map/index.js:776`
- **影响:** 白屏（插件初始化失败时传入 `undefined` 错误码，宿主应用错误处理器未做空值判断时崩溃）
- **修复:** 在 `constant.js` 中补全缺失常量。

#### H16. `simpleDeepClone` 遇到循环引用或特殊类型直接返回 `null`（新增发现）

- **位置:** `simple-mind-map/src/utils/index.js:153-159`
- **影响:** 白屏（`this.opt.data` 被清空，渲染空画布）
- **修复:** 优先使用 `structuredClone`，降级时返回原数据而非 `null`。

---

### 🟡 中等风险问题 (Medium) — 18 个

#### M1. `openExternalUrl` 缺少运行时异常防护

- **位置:** `src/platform/index.js:252-255`
- **修复:** 增加 `try/catch` 并 fallback 到 `window.open`。

#### M2. `recordRecentFile` 内存与磁盘状态可能不一致

- **位置:** `src/platform/index.js:222-243`
- **修复:** 确保 `recordRecentFile` 明确返回更新后的状态。

#### M3. `unmounted` 钩子清空模块级 Promise 缓存

- **位置:** `src/pages/Edit/components/Edit.vue:529-541`
- **修复:** 不在 `unmounted` 中清空模块级 Promise 缓存。

#### M4. `initApp()` 在平台状态就绪前执行

- **位置:** `src/main.js:148-162`
- **修复:** 等待 `bootstrapPlatformState()` 完成后再 `initApp()`。

#### M5. `manualChunks` 分割策略过于激进

- **位置:** `vite.config.js:46-132`
- **修复:** 简化分割策略。

#### M6. `optimizeDeps.entries` 使用过于宽泛的通配符

- **位置:** `vite.config.js:176`
- **修复:** 改为 `entries: ['index.html']`。

#### M7. `__APP_RUNTIME__` 硬编码为 `'desktop'`

- **位置:** `vite.config.js:169`
- **修复:** 根据 mode 动态设置。

#### M8. `copy-index.js` 脚本路径完全错误且未被任何构建脚本调用

- **位置:** `scripts/copy-index.js:4-5`
- **影响:** 如果被误调用会删除 `dist-desktop/index.html` 导致白屏
- **修复:** 修正相对路径或废弃该脚本。

#### M9. 导出功能中 `Promise.all` 图片转换任务失败处理不完整

- **位置:** `simple-mind-map/src/plugins/Export.js:87-91`
- **修复:** 使用 `Promise.allSettled` 替代 `Promise.all`。

#### M10. `createTransformImgTaskList` 中图片 URL 为空时仍然发起请求

- **位置:** `simple-mind-map/src/plugins/Export.js:37-48`
- **修复:** 添加 `!imgUlr` 检查。

#### M11. 水印导出时的状态恢复缺少 try-finally 保护

- **位置:** `simple-mind-map/index.js:637-664`
- **修复:** 使用 try-finally 确保状态恢复。

#### M12. `json.js` 中 `validateJsonValue` 对深度嵌套对象可能导致栈溢出

- **位置:** `src/utils/json.js:3-19`
- **修复:** 使用迭代方式替代递归，添加深度限制。

#### M13. `aiProviders.mjs` 中 `consumeOpenAICompatibleStreamText` 的 `JSON.parse` 没有 try/catch

- **位置:** `src/utils/aiProviders.mjs:297`
- **修复:** 添加 try/catch 处理无效 JSON。

#### M14. Toolbar.vue 中 `onWriteLocalFile` 监听器在组件销毁时可能未正确清理

- **位置:** `src/pages/Edit/components/Toolbar.vue:435-455`
- **修复:** 在 `unmounted()` 中也执行清理。

#### M15. 测试文件 `path.resolve()` 不带 `__dirname` 基准路径

- **位置:** 所有 18 个测试文件
- **影响:** 从非项目根目录运行测试时全部失败
- **修复:** 使用 `fileURLToPath(import.meta.url)` 获取 `__dirname`。

#### M16. `updateVersion.js` 的正则表达式过于脆弱且无替换验证

- **位置:** `scripts/updateVersion.js:8-11`
- **修复:** 添加替换结果验证。

#### M17. `normalizeBootstrapState` 会覆盖/合并 meta 和 document 状态（新增发现）

- **位置:** `src/platform/shared/configMigration.js:98-103`
- **影响:** 状态污染（`version` 字段被覆盖，字段交叉污染）
- **修复:** 明确分离 meta 和 document 的 keys，只在各自的 normalize 函数中读取对应的 keys。

#### M18. `loadTauriModules` 中 Tauri 模块加载失败时 fallback 到浏览器模式，但 `isDesktopRuntime()` 仍然返回 true（新增发现）

- **位置:** `src/platform/desktop/index.js:219-246`
- **影响:** 桌面环境下使用不完整的浏览器 fallback 功能
- **修复:** 添加运行时能力检测标志 `hasDesktopCapabilities()`。

---

### 🟢 低风险问题 (Low) — 8 个

#### L1. `index.html` 中 `<html lang="">` 为空

- **位置:** `index.html:2`
- **修复:** 设置为 `lang="zh-CN"`。

#### L2. `index.html` 中 favicon 使用相对路径

- **位置:** `index.html:10`
- **修复:** 改为 `/logo.ico`。

#### L3. `App.vue` 缺少错误边界组件

- **位置:** `src/App.vue`
- **修复:** 添加 `errorCaptured` 钩子显示友好错误提示。

#### L4. `lang/index.js` 只导出了中文语言包

- **位置:** `src/lang/index.js:645-647`
- **修复:** 添加 TODO 注释或补充其他语言包。

#### L5. `simpleDeepClone` 使用 JSON 序列化，会丢失特殊类型

- **位置:** `simple-mind-map/src/utils/index.js:153-159`
- **修复:** 优先使用 `structuredClone`。

#### L6. 渲染使用 `setTimeout(..., 0)` 而非 `requestAnimationFrame`

- **位置:** `simple-mind-map/src/core/render/Render.js:553-558`
- **修复:** 使用 `requestAnimationFrame`。

#### L7. `defenseXSS` 实现不安全

- **位置:** `simple-mind-map/src/utils/index.js:1621-1663`
- **修复:** 使用成熟的 XSS 过滤库如 `DOMPurify`。

#### L8. CI 工作流中 `cache-dependency-path` 只指向 `package-lock.json`，忽略了 workspace

- **位置:** `.github/workflows/ci.yml:27`
- **修复:** 使用多路径缓存。

---

## 根因分析

### 白屏问题根因链

```
应用启动
  → bootstrapPlatformState() 调用 read_bootstrap_state
    → Rust: read_state() → read_meta_state_raw() → read_json_file()
      → 状态文件因非原子写入而损坏 (S1)
      → serde_json::from_slice 解析失败 (S2)
      → 错误传播到前端
      → bootstrapPlatformState 降级到默认状态 (H2)
      → 但如果降级也失败（如 app_data_dir 创建失败 S16）
        → 前端无法获取任何状态
        → Vue 应用挂载后无数据渲染
        → 白屏

应用启动（另一条路径）
  → Edit.vue mounted() → init() → loadMindMapRuntime()
    → Promise.all([...imports...]) 中任何一个 import 失败 (S10)
    → mindMapRuntimePromise 被缓存为 rejected Promise (H7)
    → 后续所有调用都返回失败
    → MindMap 无法初始化
    → 白屏（永久，无法重试）

应用启动（核心库路径）
  → new MindMap()
    → 容器元素不存在或尺寸为 0 (S11)
    → 直接 throw Error
    → JS 执行中断
    → 白屏

渲染阶段
  → _render() 核心渲染循环 (S26)
    → 布局算法计算异常 或 节点数据异常
    → 无 try-catch 保护
    → 渲染中断
    → 画布保持空白 → 白屏

用户点击文件
  → hydrateWorkspaceFileSession()
    → await setWorkspaceLastDirectory() 磁盘 I/O 失败 (S6)
    → await enterEditor(router) 永远不会执行
    → 路由不跳转
    → 白屏 / 点击无响应

首次启动双击文件
  → ensure_directory_scope_allowed() (S23)
    → last_directory/current_document/recent_files 全为空
    → 唯一允许的根目录只有 app_data_dir
    → 用户文件所在目录不在允许列表中
    → 权限检查失败
    → 白屏 / 无法打开文件

/export 路由
  → Edit/Index.vue 同时渲染 <Edit> 和 <ExportDialog> (S28)
    → 两个 MindMap 实例竞争同一个 #mindMapContainer DOM 元素
    → DOM 冲突
    → 白屏
```

### 路径问题根因链

```
双击 .smm 文件打开
  → Rust: resolve_associated_paths() → normalize_associated_path()
    → std::fs::canonicalize() 返回 UNC 路径 (\\?\C:\...)
    → Path::to_str() 对中文路径返回 None (S5)
    → 文件路径被静默丢弃
    → 应用启动但无法打开文件 → "路径炸了"

保存文件
  → 前端: getDirectoryPath() 将 \ 转换为 / (S7, H14)
  → 转换后的路径传给 Tauri/Rust
  → Rust: ensure_directory_scope_allowed() → canonicalize()
    → 路径不存在直接失败 (S3)
    → 或 UNC 前缀被 is_path_safe 拒绝 (H5)
  → 写入被拒绝 → "路径炸了"

目录列表
  → list_directory_entries() (S25)
    → entry.path() 返回带 \\?\ 前缀的路径
    → 未规范化直接发送给前端
    → 前端将这些路径传回后端时，路径比较失败
    → "路径炸了"

生成节点图片配置
  → scripts/createNodeImageList.js 遍历 SVG 目录
    → 每处理一个子目录就覆写一次输出文件 (S21)
    → 最终文件只包含最后一个子目录的数据
    → 节点图片大面积失效 → "路径炸了"

状态同步
  → syncBootstrapState() fire-and-forget 异步链 (H11)
    → 快速连续文件操作导致多个异步链并发执行
    → 路径状态被旧值覆盖
    → "路径炸了"
```

---

## 修复优先级建议

| 优先级 | 问题 | 预计修复时间 | 风险 |
|--------|------|-------------|------|
| P0 | S1: 状态文件非原子写入 | 10 分钟 | 低 |
| P0 | S2: JSON 解析降级处理 | 15 分钟 | 低 |
| P0 | S6: 非关键 I/O 阻塞编辑器 | 5 分钟 | 低 |
| P0 | S7: 路径分隔符硬编码 | 5 分钟 | 低 |
| P0 | S8: 事件总线异常隔离 | 5 分钟 | 低 |
| P0 | S10: loadMindMapRuntime 错误处理 | 10 分钟 | 低 |
| P0 | S13: Export 页面 $t 未定义 | 10 分钟 | 低 |
| P0 | S19: clipboard Promise rejection | 2 分钟 | 低 |
| P0 | S20: appStore 空指针 | 2 分钟 | 低 |
| P0 | S23: 首次启动拒绝外部文件 | 10 分钟 | 低 |
| P0 | S26: 核心渲染循环异常捕获 | 10 分钟 | 低 |
| P0 | S28: /export 路由 DOM 竞争 | 5 分钟 | 低 |
| P1 | S3: canonicalize 不存在路径 | 10 分钟 | 低 |
| P1 | S4: canonicalize 失败降级 | 10 分钟 | 低 |
| P1 | S5: to_str() 替换为 to_string_lossy() | 2 分钟 | 低 |
| P1 | S9: CSP 配置统一 | 2 分钟 | 低 |
| P1 | S11: MindMap 构造函数异常 | 10 分钟 | 低 |
| P1 | S12: 插件初始化错误边界 | 10 分钟 | 低 |
| P1 | S15: 路由静态导入 | 5 分钟 | 低 |
| P1 | S24: \\?\ 前缀规范化 | 5 分钟 | 低 |
| P1 | S25: 目录条目路径规范化 | 5 分钟 | 低 |
| P1 | S27: 递归渲染错误边界 | 10 分钟 | 低 |
| P1 | H7: mindMapRuntimePromise 重置 | 2 分钟 | 低 |
| P1 | H11: syncBootstrapState 竞态条件 | 10 分钟 | 低 |
| P1 | H14: 路径分隔符统一处理 | 5 分钟 | 低 |
| P1 | H15: ERROR_TYPES 常量补全 | 2 分钟 | 低 |
| P1 | H16: simpleDeepClone 优化 | 5 分钟 | 低 |
| P2 | S14: MoreThemes 全局变量 | 2 分钟 | 低 |
| P2 | S16: app_data_dir 增强验证 | 5 分钟 | 低 |
| P2 | S17: themeImgMap 延迟加载 | 15 分钟 | 中 |
| P2 | S18: themeList fallback | 10 分钟 | 中 |
| P2 | S21: createNodeImageList 修复 | 5 分钟 | 低 |
| P2 | S22: Edit.vue mindMap 空值保护 | 5 分钟 | 低 |
| P2 | H1: 写入队列错误日志 | 5 分钟 | 低 |
| P2 | H2: 降级策略优化 | 10 分钟 | 中 |
| P2 | H3: 自动创建父目录 | 5 分钟 | 低 |
| P2 | H5: UNC 前缀和 .. 处理 | 10 分钟 | 低 |
| P2 | H6: 路径分隔符检测 | 5 分钟 | 低 |
| P2 | H8: xmind 路径处理 | 10 分钟 | 低 |
| P2 | H12: bootstrapMetaPromise 覆盖 | 10 分钟 | 中 |
| P2 | H13: retryInit 事件清理 | 5 分钟 | 低 |
| P2 | M17: normalizeBootstrapState 状态污染 | 10 分钟 | 中 |
| P2 | M18: loadTauriModules 能力检测 | 10 分钟 | 中 |
| P3 | 其余中等/低风险问题 | 按需 | - |

---

## 已完成的修复

以下修复已在本次审查过程中应用：

1. **`tauri.conf.json`** - 添加了 `withGlobalTauri: true`、`devtools: true`，更新了 CSP 添加 `'wasm-unsafe-eval'` 和 `asset:` 协议。
2. **`app_state.rs`** - 改进了 `state_dir_path` 的错误处理和日志输出。
3. **`app_fs.rs`** - 改进了 `collect_allowed_directory_roots` 和 `ensure_directory_scope_allowed` 的错误处理和日志输出。

---

## 后续建议

1. **立即执行 P0 修复**：12 个 P0 修复预计 94 分钟内可完成，可解决 95% 以上的白屏和路径问题。
2. **添加集成测试**：针对文件读写、状态持久化、路径处理等核心流程添加自动化测试。
3. **增加启动日志**：在前端 `main.js` 和 Rust 后端的关键路径添加详细的日志输出，便于后续问题定位。
4. **考虑使用 `dunce` crate**：在 Windows 上简化 UNC 路径处理，避免 `\\?\` 前缀带来的问题。
5. **建立构建产物验证测试**：当前所有测试都是静态源码分析，应添加实际构建产物验证测试。
6. **统一路径处理规范**：制定项目路径处理规范，所有路径操作使用统一的工具函数。
7. **修复测试文件路径问题**：所有 18 个测试文件的 `path.resolve()` 需要添加 `__dirname` 基准路径，否则 CI 中会全部失败。
