# Mind Map 依赖升级阶段 0-9 执行记录

## 1. 执行范围

本次执行覆盖路线图中的：

- 阶段 0：冻结基线、环境和能力清单
- 阶段 1：建立依赖分层与升级白名单
- 阶段 2：升级 `simple-mind-map` 的低风险运行时依赖
- 阶段 3：补 `simple-mind-map` 导入导出链的最小冒烟护栏
- 阶段 4：升级 `simple-mind-map` 协同链依赖
- 阶段 5：补富文本/公式/渲染边界的最小验证清单
- 阶段 6：刷新 `app` 的低风险运行时依赖
- 阶段 7：升级 `app` 的 AI / Markdown / 预览相关依赖
- 阶段 8：验证 `app` 构建链与本机 Node 兼容边界
- 阶段 9：升级 `web` 的低风险运行时依赖，并补 `Webpack 4` 兼容修正

## 2. 基线环境

- Node：`v25.6.0`
- npm：`11.11.0`
- `web` 当前仍依赖 `NODE_OPTIONS=--openssl-legacy-provider`

阶段 0 基线验证结果：

- `cd app && npm run build`：通过
- `cd web && npm run build`：通过
- `cd simple-mind-map && npm run lint`：失败，存在历史遗留 lint 问题

基线已知问题：

- `simple-mind-map` 当前存在 23 条 lint 错误，主要分布在：
  - `src/core/render/Render.js`
  - `src/core/view/View.js`
  - `src/layouts/*`
  - `src/plugins/*`
  - `src/utils/index.js`
- 这些问题在本轮依赖升级前已经存在，不是本轮引入。

## 3. 白名单与阶段边界决策

### 3.1 本轮允许的升级

- `simple-mind-map`
  - `@svgdotjs/svg.js`
  - `katex`
  - `yjs`
  - `ws`
  - `y-webrtc`
- `app`
  - `axios`
  - `core-js`
  - `codemirror`
  - `katex`
  - `simple-mind-map-plugin-themes`
  - `v-viewer`
  - `highlight.js`
  - `markdown-it`
  - `esbuild`
- `web`
  - `axios`
  - `core-js`
  - `codemirror`
  - `katex`
  - `simple-mind-map-plugin-themes`
  - `express`

### 3.2 本轮明确不动的内容

- `vite 7 -> 8`
  原因：`@vitejs/plugin-vue2@2.3.4` 的 peer 只支持 `vite ^3 || ^4 || ^5 || ^6 || ^7`。
- `vue 2 -> 3`
- `vue-router 3 -> 5`
- `vuex 3 -> 4`
- `vue-i18n 8 -> 11`
- `element-ui -> Vue 3 UI`
- `codemirror 5 -> 6`
- `webpack 4 -> 5`

## 4. 实际依赖升级结果

### 4.1 `simple-mind-map`

已升级：

- `@svgdotjs/svg.js: 3.2.0 -> ^3.2.5`
- `katex: ^0.16.8 -> ^0.16.44`
- `ws: ^7.5.9 -> ^7.5.10`
- `yjs: ^13.6.8 -> ^13.6.30`
- `y-webrtc: ^10.2.5 -> ^10.3.0`

保留不动：

- `deepmerge`
- `eventemitter3`
- `uuid`
- `mdast-util-from-markdown`

### 4.2 `app`

已升级：

- `axios: ^1.7.9 -> ^1.14.0`
- `codemirror: ^5.65.16 -> ^5.65.21`
- `core-js: ^3.6.5 -> ^3.49.0`
- `highlight.js: ^10.7.3 -> ^11.11.1`
- `katex: ^0.16.9 -> ^0.16.44`
- `simple-mind-map-plugin-themes: ^1.0.0 -> ^1.0.1`
- `v-viewer: ^1.6.4 -> ^1.7.4`
- `markdown-it: ^13.0.1 -> ^14.1.1`
- `esbuild: ^0.25.2 -> ^0.27.4`

保留不动：

- `vite` 继续停留在 `7.x`
- `viewerjs` 已是当前版本线的目标值
- Vue 2 生态主依赖全部不动

### 4.3 `web`

已升级：

- `axios: ^1.7.9 -> ^1.14.0`
- `codemirror: ^5.65.16 -> ^5.65.21`
- `core-js: ^3.6.5 -> ^3.49.0`
- `katex: ^0.16.9 -> ^0.16.44`
- `simple-mind-map-plugin-themes: ^1.0.0 -> ^1.0.1`
- `express: ^4.21.2 -> ^4.22.1`

保留不动：

- `highlight.js`
- `markdown-it`
- `v-viewer`
- Vue 2 生态主依赖
- CLI / Webpack 主版本

## 5. 本轮兼容修正

### 5.1 `web` 的 `@svgdotjs/svg.js` 兼容修正

问题：

- `simple-mind-map` 升级到 `@svgdotjs/svg.js@3.2.5` 后，`web` 在 `Webpack 4` 构建阶段无法解析库产物中的 `??` 运算符。

根因：

- `web/vue.config.js` 的 `transpileDependencies` 只包含 `yjs`、`lib0`、`quill`，没有包含 `@svgdotjs/svg.js`。
- `Webpack 4` 在当前配置下不会先对该依赖做 Babel 转译。

处理：

- 在 `web/vue.config.js` 中追加 `@svgdotjs/svg.js` 到 `transpileDependencies`。

结果：

- `web build` 重新通过。

说明：

- 这不是“阶段 10 的 Webpack 5 迁移”替代品，只是为了让阶段 2 和阶段 9 在旧构建链上同时成立的最小兼容修复。

## 6. 阶段 3 / 阶段 5 的最小护栏

本轮没有引入完整自动化测试框架，而是先补“最低可执行护栏”：

- 导入导出冒烟清单
- 富文本 / 备注 / 公式冒烟清单
- 协同服务启动检查

对应文档：

- `docs/plans/2026-03-29-smoke-checklist-phase-0-9.md`

## 7. 关键验证结果

本轮执行后已确认：

- `cd app && npm run build`：通过
- `cd app && npm run build:library`：通过
- `cd web && npm run build`：通过

协同链验证说明：

- `cd simple-mind-map && npm run wsServe` 可以拉起服务。
- 验证过程中出现过一次 `EADDRINUSE`，原因是前一个测试进程占用了 `4444` 端口，不是代码问题。
- 本地测试残留进程已清理。

未解决项：

- `cd simple-mind-map && npm run lint` 仍因历史问题失败。
- `web build` 仍然存在体积 warning。
- `web` 仍依赖 `--openssl-legacy-provider`，这是阶段 10 处理项。

## 8. 进入下一批前的状态结论

阶段 `0-9` 已完成的核心结果：

- 三条工程线的低风险依赖已经刷新到本轮目标版本。
- `app` 在当前 Node 版本下可构建，可产出库构建结果。
- `web` 在保留旧构建链的前提下仍可构建，没有被核心库升级打坏。
- 导入导出、富文本、公式、AI、预览、协同的最小人工冒烟护栏已经文档化。

进入阶段 `10-19` 前仍需牢记：

- `web` 的 CLI 5 / Webpack 5 迁移仍是独立项目。
- `simple-mind-map` 的历史 lint 债务会持续干扰“阶段完成”判定，后续应单独治理。
