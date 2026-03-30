# Mind Map 依赖升级阶段 10-19 执行记录

## 1. 执行范围

本次执行覆盖路线图中的：

- 阶段 10：`web` 从 CLI 4 / Webpack 4 迁到 CLI 5 / Webpack 5
- 阶段 11：升级 `web` 代码质量工具链
- 阶段 12：统一 `app` 与 `web` 的 Vue 2 依赖基线
- 阶段 13：拆分过重依赖与懒加载边界
- 阶段 14：导入导出能力保留清单与依赖策略重审
- 阶段 15：图片预览与主题链的保留或替换决策
- 阶段 16：`CodeMirror 5 -> 6` 与编辑器架构决策
- 阶段 17：根目录发布产物与库构建兼容整理
- 阶段 18：Vue 3 / 新 UI / 新状态管理迁移前置清单
- 阶段 19：依赖治理自动化与长期巡检节奏

## 2. 本批实际落地的代码改动

### 2.1 阶段 10：`web` 构建链迁移完成

已完成：

- `@vue/cli-service` 升级到 `5.0.9`
- `webpack` 升级到 `5.x`
- `less-loader` 升级到 `12.x`
- 移除 `NODE_OPTIONS=--openssl-legacy-provider`
- 在 `web/vue.config.js` 中补上 `stream-browserify` fallback

结果：

- `web` 在当前本机 Node 版本下可直接构建
- 不再依赖 OpenSSL legacy provider

### 2.2 阶段 11：`web` lint 工具链升级完成

已完成：

- `eslint 6 -> 8`
- `eslint-plugin-vue 6 -> 9`
- `babel-eslint -> @babel/eslint-parser`
- 保留可发现真实风险的规则
- 放宽大批量历史风格噪音规则

本轮补充修复：

- 修正 `web/src/pages/Edit/components/Edit.vue` 中 `globalThis` 触发的 `no-undef`

### 2.3 阶段 12：双入口 Vue 2 基线统一完成

已统一到同一版本线：

- `vue@2.7.16`
- `vue-router@3.6.5`
- `vue-i18n@8.28.2`
- `element-ui@2.15.14`

### 2.4 阶段 13：重依赖拆分完成

已完成：

- `web` 的 `AiCreate`、`AiChat`、`FormulaSidebar`、`NodeImgPreview`、`NodeNoteContentShow`、`NodeNoteSidebar` 改为异步组件
- `web` 的备注展示侧改为按需加载 Toast UI Viewer
- 首屏重依赖继续从编辑主路径剥离

### 2.5 阶段 15：图片预览方案已落定

已完成：

- `app` 与 `web` 的 `NodeImgPreview.vue` 都从 `v-viewer` 包装层切到直接按需加载 `viewerjs`
- 两端 `main.js` 中移除 `Vue.use(VueViewer)` 和全局 `viewer.css` 静态引入

结论：

- Vue 2 兼容线采用“直接封装 `viewerjs`”方案
- 不再继续保留 `v-viewer` 包装层

### 2.6 阶段 17：根目录发布兼容修正已落地

已完成：

- `app/scripts/copy-index.js`
  现在会同步处理 `modulepreload`
- `web/scripts/updateVersion.js`
  已改为使用 `__dirname` 做稳定路径解析

## 3. 本批完成的文档结论

### 3.1 阶段 14

文档：

- `docs/plans/2026-03-30-format-support-matrix.md`

核心结论：

- `.smm/.json/.xmind/.md` 导入继续支持
- `.smm/.json/.svg/.png/.pdf/.xmind/.md/.txt` 导出继续支持
- `.xlsx/.mm` 不再视为有效能力

本轮同步收口：

- 从 `app`、`web` 依赖中移除 `xlsx`
- 从 URL 文件打开后缀判定里移除 `.xlsx`

### 3.2 阶段 16

文档：

- `docs/plans/2026-03-30-codemirror-architecture-decision.md`

核心结论：

- 当前维持 `CodeMirror 5`
- `CodeMirror 6` 迁移单独立项

### 3.3 阶段 17

文档：

- `docs/plans/2026-03-30-root-publish-compatibility-review.md`

核心结论：

- `app`、`web` 的根目录发布链当前都可继续使用
- 根目录 `index.html` 仍然是“最后一次构建覆盖”的模型

### 3.4 阶段 18

文档：

- `docs/plans/2026-03-30-vue3-migration-prerequisites.md`

核心结论：

- 本轮不做 Vue 3 迁移
- 先完成双入口收敛、UI 框架替换面梳理、状态层边界整理

### 3.5 阶段 19

文档：

- `docs/plans/2026-03-30-dependency-governance-playbook.md`

核心结论：

- 建立双周轻巡检、月度完整巡检
- 固化 `Node 22 LTS + Node 25.6.0` 双基线验证
- 固化 `simple-mind-map -> app -> web -> 发布脚本` 的升级顺序

## 4. 与阶段路线图相比的关键修正

本次执行里有一项重要纠偏：

- 路线图原先把 `.xlsx` 视为“UI 弱化但底层链路保留”的候选
- 复核源码后确认：当前仓库并没有 `.xlsx` 的实际导入导出实现

所以本批没有继续保留 `xlsx` 兼容债务，而是按真实能力边界处理为：

- 停用
- 清理未使用依赖
- 修正伪支持入口

## 5. 本批收口状态

阶段 `10-19` 已完成的实际结果：

- `web` 旧入口已迁到现代 Node 友好的构建链
- `web` lint 工具链已升级到可维护基线
- 双入口 Vue 2 主依赖版本已统一
- 备注、AI、图片预览等重依赖边界已继续拆分
- 图片预览链已完成 `viewerjs` 直连替换
- 导入导出能力矩阵、编辑器结论、Vue 3 前置条件、依赖治理节奏都已文档化
- 根目录发布链中的真实兼容问题已修复

## 6. 待验证项

本执行记录写入后，仍需以 fresh verification 完成本批最终收口：

- `cd web && npm run lint`
- `cd web && npm run build`
- `cd app && npm run build`
- `cd app && npm run build:library`

最终通过结果以当轮验证输出为准。
