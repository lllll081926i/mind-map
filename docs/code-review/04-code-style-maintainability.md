# 代码规范与可维护性审查报告

## 1. 代码风格一致性

| 文件 | 问题 | 建议 |
|------|------|------|
| `.prettierrc` | 非标准 JSON 格式 | 改为标准 JSON |
| `src/utils/loading.js:12-16` | 混用 4 空格和 2 空格缩进 | 统一为 2 空格 |
| `src/config/zh.js:598` | 尾逗号与 `trailingComma: 'none'` 冲突 | 运行 `npm run format` |
| `simple-mind-map/full.js:10-11` | 导入有的带 `.js` 有的不带 | 统一使用 `.js` |
| `Edit.vue:115`, `Toolbar.vue:197` | 混用 `@/` 别名和相对路径 | 统一使用 `@/` |

### 拼写错误

| 文件 | 行号 | 错误 | 正确 |
|------|------|------|------|
| `src/utils/index.js` | 15 | `fullscrrenEvent` | `fullscreenEvent` |
| `src/lang/zh_cn.js` | 305-307 | `strusture` | `structure` |
| `src/pages/Edit/Index.vue` | 378 | `strusture` | `structure` |

---

## 2. 注释质量和文档完整性

| 文件 | 问题 | 建议 |
|------|------|------|
| `simple-mind-map/index.js` | 849 行，40+ 公开方法无 JSDoc | 为所有公开 API 添加文档 |
| `src/platform/index.js:44-116` | 关键函数无注释 | 添加并发控制机制说明 |
| `Edit.vue:372` | 魔术数字 `300` 无解释 | 提取为命名常量 |
| `Toolbar.vue:584` | 魔术数字 `1000` 无解释 | 提取为命名常量 |
| `src/config/zh.js:529-534` | 注释代码未清理 | 移除或通过 feature flag 管理 |

---

## 3. 函数复杂度

| 文件 | 函数 | 行数 | 建议 |
|------|------|------|------|
| `Edit.vue` | `createMindMapOptions` | 110 | 拆分为事件回调、导出配置、UI 配置 |
| `simple-mind-map/index.js` | `getSvgData` | 128 | 拆分为水印、尺寸、SVG 克隆子函数 |
| `src/utils/ai.js` | `requestByDesktop` | 70 | 拆分为事件监听、请求、错误处理 |
| `handleClipboardText.js` | `walk` | 46 | 提取 `processNodeItem` 降低嵌套 |

---

## 4. 文件复杂度

| 文件 | 行数 | 严重度 | 建议 |
|------|------|--------|------|
| `Edit.vue` | 935 | 🔴 | 拆分为 `MindMapCore`, `PluginManager`, `DataSync` |
| `Toolbar.vue` | 1127 | 🔴 | 拆分文件树、最近文件、导出逻辑 |
| `simple-mind-map/index.js` | 849 | 🟡 | 拆分主题/样式管理到独立模块 |
| `src/config/zh.js` | 758 | 🟡 | 按配置类别拆分 |
| `src/lang/zh_cn.js` | 596 | 🟢 | 可接受 |

---

## 5. 错误处理完整性

| 文件 | 行号 | 问题 | 建议 |
|------|------|------|------|
| `handleClipboardText.js` | 41, 85 | 空 catch 块吞没错误 | 添加 `console.warn` |
| 多处 | - | `console.log(error)` 代替 `console.error` | 统一使用 `console.error` |
| `main.js` | - | 缺少全局 `app.config.errorHandler` | 添加统一错误处理 |
| `api/index.js` | 33-37 | `void` fire-and-forget 模式 | 添加用户可见失败通知 |

---

## 6. 类型安全

- 整个项目使用 JavaScript，无 TypeScript
- 无 JSDoc 类型注解
- `simple-mind-map` 缺少 `.d.ts` 类型定义文件

**建议**:
1. 短期：为关键模块添加 JSDoc 类型注解
2. 长期：迁移到 TypeScript，从 `simple-mind-map` 核心库开始

---

## 7. 测试覆盖率和质量

### 当前测试覆盖

| 已覆盖 | 未覆盖 |
|--------|--------|
| 平台运行时检测 | `Edit.vue` (935 行核心组件) |
| 更新服务核心逻辑 | `ai.js` (AI 请求类) |
| 工作台文件操作 | `platform/index.js` (平台适配层) |
| 布局/UI 结构断言 | `simple-mind-map/index.js` (核心库) |
| | 所有 Vue 组件交互逻辑 |
| | E2E 测试 |

### 问题

- 测试类型单一（全部为 `node:test` 单元/集成测试）
- 大量测试使用源码字符串匹配（脆弱测试）
- 无 `test:all` 脚本运行所有测试

---

## 8. Git 提交规范

- 无 `commitlint`、`.commitlintrc`、`husky`
- 无 `CHANGELOG.md`
- 无 Conventional Commits 规范

---

## 9. 国际化支持

### 问题

| 文件 | 问题 |
|------|------|
| `src/lang/index.js` | 仅配置中文 |
| `Toolbar.vue:154,161` | 硬编码中文"编辑"、"导入" |
| `updateService.js:25,76` | 硬编码中文错误消息 |
| `documentSession.js` | 多处硬编码中文错误消息 |
| `main.js:140` | 硬编码中文"应用初始化失败，请刷新后重试。" |

---

## 10. 无障碍访问支持

| 文件 | 问题 | 建议 |
|------|------|------|
| `App.vue:48-51` | 全局 `user-select: none` | 仅在特定区域禁用 |
| 所有 Vue 组件 | 缺少 `aria-*` 属性 | 添加 `aria-label`, `role` 等 |
| 所有组件 | 缺少键盘导航 | 实现 Tab 键导航 |
| 深色模式 | 低透明度文本可能不满足 WCAG AA | 使用对比度检测工具 |

---

## 11. 其他发现

| 文件 | 行号 | 问题 | 建议 |
|------|------|------|------|
| `Edit.vue` | 871-874 | 硬编码过期百度图片 URL | 移除或改为可配置 |
| `Toolbar.vue` | 372-383 | `waitForRef` 递归轮询 320 次（5.12 秒） | 使用生命周期钩子替代 |
| `vite.config.js` | 108 | `chunkSizeWarningLimit: 4000` 过高 | 降至 1000-2000 |

---

## 优先级总结

| 优先级 | 问题 | 影响 |
|--------|------|------|
| P0 | `Edit.vue` / `Toolbar.vue` 拆分 | 可维护性 |
| P0 | 硬编码中文文本 | 国际化 |
| P0 | 空 catch 块吞没错误 | 错误处理 |
| P1 | 核心类缺少 JSDoc | 文档完整性 |
| P1 | 测试覆盖率不足 | 质量保障 |
| P1 | 无障碍访问缺失 | 可访问性 |
| P2 | Git 提交规范 | 协作规范 |
| P2 | 拼写错误 | 代码质量 |
