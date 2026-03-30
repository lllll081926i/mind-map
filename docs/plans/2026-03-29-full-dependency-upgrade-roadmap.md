# Mind Map 全量依赖升级与能力迁移总计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为当前仓库的 `app`、`web`、`simple-mind-map` 三条工程线建立一份覆盖全部现有能力的全量依赖升级计划，后续按阶段执行，不遗漏能力链路、不把普通升级误做成架构迁移。

**Architecture:** 当前仓库是“三层结构”：`simple-mind-map` 是核心库，`app` 是当前主入口，`web` 是旧入口兼容线。升级必须先稳定核心库，再升级 `app`，再处理 `web` 构建链和遗留栈，最后才进入 Vue 3、UI 框架、编辑器体系的迁移项目。

**Tech Stack:** Vue 2.7 / Vue CLI 4 / Vite 7 / Element UI 2 / Toast UI Editor 3 / CodeMirror 5 / Quill 2 / Yjs / markdown-it / xlsx / pdf-lib / axios / Webpack 4

---

## 1. 规划目标与执行原则

本计划解决四件事：

1. 盘清当前项目全部能力对应的依赖链。
2. 把依赖升级拆成可落地的阶段，而不是“一键升最新”。
3. 把每个阶段的验证门禁、回退策略、涉及文件写清楚。
4. 保持与当前本机环境兼容，同时为后续标准化 Node 版本留出空间。

执行原则：

- 先核心库，后入口工程，最后架构迁移。
- 先升级低风险运行时依赖，再动构建链，再动编辑器/UI/框架主版本。
- 每 10 个阶段停一次，做一次人工评审和冒烟复核。
- `web` 仍需保留，不允许因为升级 `app` 而静默破坏 `web`。
- 不把“需要重写代码的迁移”伪装成“小版本升级”。

执行停点：

- `阶段 0` 到 `阶段 9` 为第一批，完成后停一次。
- `阶段 10` 到 `阶段 19` 为第二批，完成后再停一次。

---

## 2. 当前环境与边界条件

### 2.1 本机环境快照

- 当前本机 Node：`v25.6.0`
- 当前本机 npm：`11.11.0`
- 当前 `web` 仍依赖 `NODE_OPTIONS=--openssl-legacy-provider`

结论：

- 这份计划要兼顾“本机 Node 25 可运行”和“工程交付建议锁到稳定 LTS”两个目标。
- 后续真正落地时，建议把团队标准 Node 基线收敛到 `Node 22 LTS`，同时保留 `Node 25.6.0` 的本机兼容验证。
- `web` 从 CLI 4 / Webpack 4 升到 CLI 5 / Webpack 5 的阶段，核心目标之一就是移除 `--openssl-legacy-provider`。

### 2.2 工程范围

- `app/`
  当前主开发入口，基于 `Vite + Vue 2.7`。
- `web/`
  旧入口兼容线，基于 `Vue CLI 4 + Webpack 4`。
- `simple-mind-map/`
  核心库，承载渲染、插件、导入导出、协同、富文本等主能力。

### 2.3 关键文件基线

- `app/package.json`
- `app/package-lock.json`
- `app/vite.config.js`
- `app/vite.lib.config.js`
- `app/scripts/copy-index.js`
- `app/scripts/updateVersion.js`
- `app/scripts/build-library-min.js`
- `web/package.json`
- `web/package-lock.json`
- `web/vue.config.js`
- `web/scripts/updateVersion.js`
- `web/scripts/ai.js`
- `web/scripts/createNodeImageList.js`
- `simple-mind-map/package.json`
- `simple-mind-map/package-lock.json`
- `simple-mind-map/index.js`
- `simple-mind-map/full.js`
- `simple-mind-map/bin/wsServer.mjs`
- `simple-mind-map/src/parse/*`
- `simple-mind-map/src/plugins/*`
- `simple-mind-map/src/core/*`

---

## 3. 当前依赖快照与升级分层

### 3.1 `app` 依赖现状

当前声明或已安装的关键依赖：

- `vue@2.7.16`
- `vue-router@3.6.5`
- `vuex@3.6.2`
- `vue-i18n@8.28.2`
- `element-ui@2.15.14`
- `@toast-ui/editor@3.1.5`
- `codemirror@5.65.x`
- `highlight.js@10.7.3`
- `katex@0.16.9`
- `viewerjs@1.11.7`
- `v-viewer@1.7.4`
- `xlsx@0.18.5`
- `vite@7.3.1`
- `esbuild@0.25.12`

`npm outdated` 已确认的升级边界：

- 可直接评估：`esbuild 0.25.12 -> 0.27.4`
- 需要谨慎：`highlight.js 10.7.3 -> 11.11.1`
- 需要谨慎：`markdown-it 13.0.2 -> 14.1.1`
- 架构迁移：`codemirror 5 -> 6`
- 架构迁移：`v-viewer 1.x -> 3.x`
- 架构迁移：`vite 7 -> 8` 需要先验证 `@vitejs/plugin-vue2`
- 架构迁移：`vue 2 -> 3`、`vue-router 3 -> 5`、`vue-i18n 8 -> 11`、`vuex 3 -> 4`

### 3.2 `web` 依赖现状

当前声明或已安装的关键依赖：

- `vue@2.7.16`
- `vue-router@3.6.5`
- `vuex@3.6.2`
- `vue-i18n@8.28.2`
- `element-ui@2.15.1`
- `@toast-ui/editor@3.1.5`
- `codemirror@5.65.16`
- `highlight.js@10.7.3`
- `katex@0.16.9`
- `simple-mind-map-plugin-themes@1.0.0`
- `@vue/cli-service@4.5.19`
- `webpack@4.47.0`
- `less@3.13.1`
- `less-loader@7.3.0`
- `eslint@6.8.0`
- `prettier@1.19.1`

`npm outdated` 已确认的升级边界：

- 可直接评估：`axios 1.7.9 -> 1.14.0`
- 可直接评估：`codemirror 5.65.16 -> 5.65.21`
- 可直接评估：`core-js 3.36.0 -> 3.49.0`
- 可直接评估：`katex 0.16.9 -> 0.16.44`
- 可直接评估：`simple-mind-map-plugin-themes 1.0.0 -> 1.0.1`
- 需要迁移：`@vue/cli-service 4.5.19 -> 5.0.9`
- 需要迁移：`webpack 4.47.0 -> 5.105.4`
- 需要迁移：`less-loader 7.3.0 -> 12.3.2`
- 需要谨慎：`prettier 1.19.1 -> 3.8.1`
- 需要谨慎：`eslint 6.8.0 -> 8.x`，不建议直接上 `10.x`

### 3.3 `simple-mind-map` 依赖现状

当前声明或已安装的关键依赖：

- `@svgdotjs/svg.js@3.2.0`
- `deepmerge@1.5.2`
- `eventemitter3@4.0.7`
- `jszip@3.10.1`
- `katex@0.16.9`
- `mdast-util-from-markdown@1.3.1`
- `pdf-lib@1.17.1`
- `quill@2.0.3`
- `uuid@9.0.1`
- `ws@7.5.9`
- `xml-js@1.6.11`
- `y-webrtc@10.2.5`
- `yjs@13.6.14`

`npm outdated` 已确认的升级边界：

- 可直接评估：`@svgdotjs/svg.js 3.2.0 -> 3.2.5`
- 可直接评估：`katex 0.16.9 -> 0.16.44`
- 可直接评估：`yjs 13.6.14 -> 13.6.30`
- 可直接评估：`ws 7.5.9 -> 7.5.10`
- 需要迁移：`deepmerge 1.5.2 -> 4.3.1`
- 需要迁移：`eventemitter3 4.0.7 -> 5.0.4`
- 需要迁移：`mdast-util-from-markdown 1.3.1 -> 2.0.3`
- 需要迁移：`uuid 9.0.1 -> 13.0.0`

### 3.4 升级分层规则

分为三层：

- A 类：可直接升级
  小版本、安全修复、不会改变框架边界的依赖。
- B 类：条件升级
  需要额外验证，可能影响渲染、样式、Markdown、构建产物。
- C 类：迁移项目
  涉及 API 断裂、框架主版本、构建链主版本、编辑器重构。

---

## 4. 当前能力与依赖映射矩阵

| 能力域 | 主要依赖 | 核心文件/目录 | 风险级别 |
| --- | --- | --- | --- |
| 基础编辑与渲染 | `simple-mind-map` `@svgdotjs/svg.js` `deepmerge` `eventemitter3` | `simple-mind-map/src/core/*` `simple-mind-map/src/theme/*` | 高 |
| 拖拽/选择/滚动/导航/外框/关联线/演示 | `simple-mind-map` 插件体系 | `simple-mind-map/src/plugins/*` | 高 |
| 富文本与备注 | `quill` `@toast-ui/editor` `codemirror` | `simple-mind-map/src/plugins/RichText.js` `app/src/pages/Edit/components/*` `web/src/pages/Edit/components/*` | 高 |
| 公式能力 | `katex` | `simple-mind-map/src/plugins/Formula.js` `simple-mind-map/src/plugins/FormulaStyle.js` | 中 |
| Markdown 渲染与 AI 输出转脑图 | `markdown-it` `highlight.js` `mdast-util-from-markdown` | `simple-mind-map/src/parse/markdown.js` `simple-mind-map/src/parse/markdownTo.js` | 高 |
| 导入导出 | `jszip` `pdf-lib` `xlsx` `xml-js` | `simple-mind-map/src/parse/*` `simple-mind-map/src/plugins/Export*.js` | 高 |
| 图片预览与资源展示 | `v-viewer` `viewerjs` `simple-mind-map-plugin-themes` | `app/src/pages/Edit/components/*` `web/src/pages/Edit/components/*` | 中 |
| AI 聊天与 AI 生成 | `axios` `markdown-it` `highlight.js` | `app/src/pages/Edit/components/Ai*.vue` `web/scripts/ai.js` | 中 |
| 协同编辑 | `yjs` `y-webrtc` `ws` | `simple-mind-map/src/plugins/Cooperate.js` `simple-mind-map/bin/wsServer.mjs` | 高 |
| 主入口构建 | `vite` `@vitejs/plugin-vue2` `esbuild` | `app/vite.config.js` `app/vite.lib.config.js` | 中 |
| 旧入口构建 | `@vue/cli-service` `webpack` `less-loader` | `web/vue.config.js` | 高 |
| 根目录发布兼容 | 复制脚本、产物结构、相对路径 | `app/scripts/copy-index.js` `copy.js` 根目录发布文件 | 中 |

---

## 5. 总体执行顺序

强制执行顺序：

1. `simple-mind-map` 低风险依赖
2. `simple-mind-map` 导入导出/协同/富文本边界
3. `app` 低风险依赖与构建链
4. `web` 低风险依赖与构建链
5. 双入口 Vue 2 基线统一
6. 重依赖拆分、产物兼容、长期治理
7. Vue 3 / 新 UI / 新编辑器体系迁移评估

不允许直接跳到以下动作：

- `vue 2 -> 3`
- `vue-router 3 -> 5`
- `vue-i18n 8 -> 11`
- `vuex 3 -> 4`
- `element-ui -> Vue 3 UI`
- `codemirror 5 -> 6`
- `v-viewer 1.x -> 3.x`
- `webpack 4 -> 5` 但不同时审查 `vue.config.js`

---

## 6. 20 个阶段的完整执行文档

## 阶段 0：冻结基线、环境和能力清单

- 目标：锁定当前可运行基线，避免后续升级时无法判断回归来源。
- 主要依赖：全部。
- 关键文件：
  `app/package.json`
  `web/package.json`
  `simple-mind-map/package.json`
  三个 `package-lock.json`
  本文档。
- 执行要点：
  记录本机 `Node 25.6.0` 和现有 `npm outdated` 结果。
  记录现有支持的导入导出格式、AI、公式、富文本、协同状态。
  记录 `web` 仍依赖 `--openssl-legacy-provider`。
- 验证门禁：
  `cd app && npm run build`
  `cd web && npm run build`
- 回退策略：
  不改代码，只更新文档与版本快照，出问题直接回退文档改动。

## 阶段 1：建立依赖分层与升级白名单

- 目标：把依赖分成 A/B/C 三类，后续执行只按白名单推进。
- 主要依赖：
  `@svgdotjs/svg.js`
  `katex`
  `yjs`
  `ws`
  `axios`
  `core-js`
  `codemirror`
  `simple-mind-map-plugin-themes`
- 关键文件：
  本文档
  三个 `package.json`
- 执行要点：
  明确哪些是“直接升级”，哪些是“迁移项目”。
  明确 `app` 和 `web` 相同依赖优先收敛到同一版本。
- 验证门禁：
  本文档与 `npm outdated` 结果一致。
- 回退策略：
  重新按 `npm outdated` 结果调整白名单。

## 阶段 2：升级 `simple-mind-map` 的低风险运行时依赖

- 目标：先清理核心库里最明显的低风险旧版本。
- 主要依赖：
  `@svgdotjs/svg.js 3.2.0 -> 3.2.5`
  `katex 0.16.9 -> 0.16.44`
  `yjs 13.6.14 -> 13.6.30`
  `ws 7.5.9 -> 7.5.10`
- 关键文件：
  `simple-mind-map/package.json`
  `simple-mind-map/package-lock.json`
  `simple-mind-map/index.js`
  `simple-mind-map/full.js`
- 执行要点：
  只升级核心库中不会改变模块导入方式的小版本。
  先不碰 `uuid`、`deepmerge`、`eventemitter3`、`mdast-util-from-markdown`。
- 验证门禁：
  `cd simple-mind-map && npm run lint`
  `cd app && npm run build`
  `cd web && npm run build`
- 回退策略：
  单包回退到升级前版本，不捆绑回退多个依赖。

## 阶段 3：补 `simple-mind-map` 导入导出链的回归护栏

- 目标：为 `xmind/pdf/markdown/txt` 等链路建立最小验证闭环。
- 主要依赖：
  `jszip`
  `pdf-lib`
  `xml-js`
  `mdast-util-from-markdown`
  `xlsx`
- 关键文件：
  `simple-mind-map/src/parse/xmind.js`
  `simple-mind-map/src/parse/markdown.js`
  `simple-mind-map/src/parse/markdownTo.js`
  `simple-mind-map/src/parse/toMarkdown.js`
  `simple-mind-map/src/parse/toTxt.js`
  `simple-mind-map/src/plugins/Export.js`
  `simple-mind-map/src/plugins/ExportPDF.js`
  `simple-mind-map/src/plugins/ExportXMind.js`
- 执行要点：
  为导入 `.smm/.json/.xmind/.md` 和导出 `.svg/.png/.pdf/.xmind/.txt` 建立冒烟脚本或手工清单。
  先补护栏，再动高风险导入导出依赖。
- 验证门禁：
  所有格式链路至少跑一遍手工冒烟。
- 回退策略：
  保留升级前样例文件和输出快照，按格式链路回滚。

## 阶段 4：升级 `simple-mind-map` 协同链

- 目标：让协同链建立在较新的 `yjs/ws` 基线上。
- 主要依赖：
  `yjs`
  `y-webrtc`
  `ws`
- 关键文件：
  `simple-mind-map/src/plugins/Cooperate.js`
  `simple-mind-map/bin/wsServer.mjs`
- 执行要点：
  先升级 `yjs/ws`，`y-webrtc` 保守评估。
  协同链因为当前产品侧非主路径，排在基础编辑稳定之后。
- 验证门禁：
  `cd simple-mind-map && npm run wsServe`
  双端连接、编辑同步、断线重连。
- 回退策略：
  协同链单独回退，不影响主编辑链升级结果。

## 阶段 5：补 `simple-mind-map` 富文本/公式/渲染边界

- 目标：隔离富文本和公式依赖对核心渲染的冲击。
- 主要依赖：
  `quill`
  `katex`
  `@toast-ui/editor`
  `codemirror`
- 关键文件：
  `simple-mind-map/src/plugins/RichText.js`
  `simple-mind-map/src/plugins/Formula.js`
  `simple-mind-map/src/plugins/FormulaStyle.js`
  `simple-mind-map/src/core/render/TextEdit.js`
- 执行要点：
  明确富文本编辑、备注编辑、公式编辑的边界是否由入口工程还是核心库主导。
  给后续 `CodeMirror 6` 评估留出证据。
- 验证门禁：
  节点富文本编辑、备注编辑、公式插入均可用。
- 回退策略：
  保持 `quill`、`codemirror` 链不动，只保留 `katex` 升级。

## 阶段 6：刷新 `app` 的低风险运行时依赖和 lockfile

- 目标：提升 `app` 新入口的运行时稳定性，不碰 Vue 主版本。
- 主要依赖：
  `axios`
  `core-js`
  `codemirror 5.65.21`
  `katex 0.16.44`
  `simple-mind-map-plugin-themes 1.0.1`
- 关键文件：
  `app/package.json`
  `app/package-lock.json`
- 执行要点：
  对已使用 `^` 范围的依赖，优先通过刷新 lockfile 获取 wanted 版本。
  保持 `vue`、`vue-router`、`vuex`、`vue-i18n` 不动。
- 验证门禁：
  `cd app && npm run build`
  编辑页可打开，基础编辑链无回归。
- 回退策略：
  通过 `package-lock.json` 精确回退。

## 阶段 7：升级 `app` 的 AI / Markdown / 预览相关依赖

- 目标：稳住 AI 输出渲染、图片预览和 Markdown 结果链。
- 主要依赖：
  `highlight.js`
  `markdown-it`
  `viewerjs`
  `v-viewer`
- 关键文件：
  `app/src/pages/Edit/components/AiCreate.vue`
  `app/src/pages/Edit/components/AiChat.vue`
  `app/src/pages/Edit/components/Import.vue`
  `app/src/pages/Edit/components/Export.vue`
- 执行要点：
  先评估 `viewerjs` 小版本，`v-viewer` 暂不跨主版本。
  `highlight.js`、`markdown-it` 升级要同步检查代码块 class 和 HTML 输出。
- 验证门禁：
  AI 对话
  AI 生成脑图
  Markdown 结果渲染
  图片点击预览
- 回退策略：
  `viewerjs` 和 `highlight.js` 分开升级、分开回退。

## 阶段 8：升级 `app` 构建链并验证 Node 25 兼容

- 目标：让 `app` 在当前本机 Node 版本下保持稳定构建，并为后续 LTS 固化做准备。
- 主要依赖：
  `vite`
  `@vitejs/plugin-vue2`
  `esbuild`
  `express`
- 关键文件：
  `app/vite.config.js`
  `app/vite.lib.config.js`
  `app/scripts/copy-index.js`
  `app/scripts/build-library-min.js`
- 执行要点：
  先升级 `esbuild`，再评估 `vite 8` 是否值得推进。
  `vite 8` 只有在 `plugin-vue2` 验证通过后才进入实施。
- 验证门禁：
  `cd app && npm run build`
  `cd app && npm run build:library`
- 回退策略：
  若 `vite 8` 不稳，停在 `vite 7.x + 新 esbuild`。

## 阶段 9：升级 `web` 的低风险运行时依赖

- 目标：在不换框架的前提下先清掉 `web` 最容易处理的旧版本。
- 主要依赖：
  `axios 1.14.0`
  `core-js 3.49.0`
  `codemirror 5.65.21`
  `katex 0.16.44`
  `simple-mind-map-plugin-themes 1.0.1`
  `express 4.22.x`
- 关键文件：
  `web/package.json`
  `web/package-lock.json`
- 执行要点：
  先保证 `web` 业务行为不变，再处理构建链。
  `element-ui`、`vue`、`router`、`vuex`、`i18n` 保持 Vue 2 兼容线。
- 验证门禁：
  `cd web && npm run build`
  编辑页基础功能、备注、导入导出均可用。
- 回退策略：
  逐个依赖回退，优先保留 `core-js` 和 `axios` 升级。

## 阶段 10：把 `web` 从 CLI 4 / Webpack 4 迁到 CLI 5 / Webpack 5

- 目标：移除 `--openssl-legacy-provider`，把旧入口带到能适应现代 Node 的构建链。
- 主要依赖：
  `@vue/cli-plugin-babel 5.0.9`
  `@vue/cli-plugin-eslint 5.0.9`
  `@vue/cli-service 5.0.9`
  `webpack 5`
  `less 4`
  `less-loader 12`
- 关键文件：
  `web/package.json`
  `web/package-lock.json`
  `web/vue.config.js`
- 执行要点：
  这是迁移项目，不是普通补丁升级。
  必须同时审查 loader、publicPath、构建产物路径和库构建脚本。
- 验证门禁：
  `cd web && npm run build`
  不再需要 `NODE_OPTIONS=--openssl-legacy-provider`
- 回退策略：
  保留 CLI 4 单独分支回退点，必要时整体回退该阶段。

## 阶段 11：升级 `web` 的代码质量工具链

- 目标：把旧入口的 lint/format 基线升级到可维护状态。
- 主要依赖：
  `eslint 6 -> 8`
  `eslint-plugin-vue 6 -> 9`
  `prettier 1 -> 3`
- 关键文件：
  `web/package.json`
  `.eslintrc` 或 `eslintConfig`
  受格式化影响的 `web/src/**`
- 执行要点：
  先升级到 `eslint 8`，不直接碰 `10.x`。
  规则迁移和格式化噪音必须与业务改动分离。
- 验证门禁：
  `cd web && npm run lint`
  `cd web && npm run build`
- 回退策略：
  先保留旧规则集，分两步切换 formatter 和 lint 规则。

## 阶段 12：统一 `app` 与 `web` 的 Vue 2 依赖基线

- 目标：两个入口尽量共享同一套 Vue 2 主依赖版本。
- 主要依赖：
  `vue@2.7.16`
  `vue-router@3.6.5`
  `vuex@3.6.2`
  `vue-i18n@8.28.2`
  `element-ui@2.15.x`
- 关键文件：
  `app/package.json`
  `web/package.json`
- 执行要点：
  统一版本后，后续问题更容易判断是入口差异还是业务差异。
- 验证门禁：
  `app` 和 `web` 构建都通过。
- 回退策略：
  如 `web` 对某个补丁版本敏感，允许短期例外，但必须写入文档。

## 阶段 13：拆分过重依赖与懒加载边界

- 目标：降低主包体积和升级冲击面，把重依赖从主路径剥离。
- 主要依赖：
  `xlsx`
  `pdf-lib`
  `@toast-ui/editor`
  `codemirror`
  `v-viewer`
- 关键文件：
  `app/src/pages/Edit/components/Import.vue`
  `app/src/pages/Edit/components/Export.vue`
  `web/src/pages/Edit/components/Import.vue`
  `web/src/pages/Edit/components/Export.vue`
  `simple-mind-map/src/plugins/ExportPDF.js`
- 执行要点：
  能按需加载的依赖尽量按需加载。
  优先把导出、AI、富文本等非首屏依赖从主入口拆出去。
- 验证门禁：
  首屏打开正常，懒加载模块按需可用。
- 回退策略：
  按功能开关回退懒加载改造，不回退已完成的版本升级。

## 阶段 14：导入导出能力保留清单与依赖策略重审

- 目标：确认哪些格式继续长期支持，哪些只保留底层链路。
- 主要依赖：
  `xlsx`
  `xml-js`
  `jszip`
  `pdf-lib`
  `mdast-util-from-markdown`
- 关键文件：
  `simple-mind-map/src/parse/*`
  `simple-mind-map/src/plugins/Export*.js`
  `app/src/pages/Edit/components/Export.vue`
  `web/src/pages/Edit/components/Export.vue`
- 执行要点：
  当前 UI 已弱化 `xlsx`，但底层仍存在，必须决定是否继续维护。
  对每种格式给出“继续支持 / 降级支持 / 停用”结论。
- 验证门禁：
  形成格式能力保留表。
- 回退策略：
  若结论不稳定，先保留现状，不着急删链路。

## 阶段 15：图片预览与主题链的保留或替换决策

- 目标：决定 `v-viewer` 是否继续保留在 Vue 2 线上。
- 主要依赖：
  `v-viewer`
  `viewerjs`
  `simple-mind-map-plugin-themes`
- 关键文件：
  `app/src/pages/Edit/components/*`
  `web/src/pages/Edit/components/*`
- 执行要点：
  在 Vue 2 阶段优先评估两条路：
  继续保留 `v-viewer@1.x`
  或移除包装层，直接封装 `viewerjs`
- 验证门禁：
  图片预览、缩放、关闭、销毁流程正常。
- 回退策略：
  保底方案是留在 `v-viewer@1.x + viewerjs` 的旧链路。

## 阶段 16：`CodeMirror 5 -> 6` 与编辑器架构决策

- 目标：明确是否值得把备注编辑链迁到 CodeMirror 6。
- 主要依赖：
  `codemirror`
  `@toast-ui/editor`
- 关键文件：
  `app/src/pages/Edit/components/*`
  `web/src/pages/Edit/components/*`
  `simple-mind-map/src/plugins/RichText.js`
- 执行要点：
  如果仍依赖 `Toast UI Editor 3`，优先维持 `CodeMirror 5`。
  若一定要上 `CodeMirror 6`，必须单独立项，不并入普通依赖升级。
- 验证门禁：
  形成结论文档：保留、局部替换或整体迁移。
- 回退策略：
  未形成明确收益前，不启动实现。

## 阶段 17：根目录发布产物与库构建兼容整理

- 目标：保证依赖升级后，根目录发布和库产物结构仍兼容现有发布方式。
- 主要依赖：
  `vite`
  `webpack`
  复制脚本与构建脚本
- 关键文件：
  `app/scripts/copy-index.js`
  `app/scripts/build-library-min.js`
  `app/scripts/updateVersion.js`
  `web/scripts/updateVersion.js`
  `copy.js`
  根目录 `index.html`
- 执行要点：
  审查构建后产物路径、文件名、根目录引用关系、库构建命名。
  不允许升级后只能本地跑，根目录发布失效。
- 验证门禁：
  `app` 和 `web` 的发布产物都可被现有部署链使用。
- 回退策略：
  保留旧产物结构兼容层，不强制一次切断。

## 阶段 18：Vue 3 / 新 UI / 新状态管理迁移前置清单

- 目标：把未来的大迁移前提写清楚，但不在本轮执行。
- 主要依赖：
  `vue`
  `vue-router`
  `vue-i18n`
  `vuex`
  `element-ui`
  `v-viewer`
- 关键文件：
  `app/src/**`
  `web/src/**`
- 执行要点：
  明确后续需要替换：
  `Element UI -> Vue 3 UI`
  `vuex -> Pinia 或 Vuex 4`
  `vue-router 3 -> 4/5`
  `vue-i18n 8 -> 9/11`
- 验证门禁：
  输出迁移前置条件清单。
- 回退策略：
  这是规划阶段，不改业务代码。

## 阶段 19：依赖治理自动化与长期巡检节奏

- 目标：让后续依赖更新变成持续治理，而不是下一次再集中爆炸。
- 主要依赖：全部。
- 关键文件：
  根目录文档
  三个 `package.json`
  后续 CI/脚本文件
- 执行要点：
  固化每月或每双周的 `npm outdated` 巡检节奏。
  固化 `Node LTS + 本机 Node 当前版本` 双环境验证。
  固化每次升级都要跑的构建和冒烟清单。
- 验证门禁：
  形成固定流程文档或脚本入口。
- 回退策略：
  自动化先从文档和脚本做起，不强推外部服务。

---

## 7. 每阶段统一验证清单

每个阶段至少执行：

- `cd simple-mind-map && npm run lint`
- `cd app && npm run build`
- `cd web && npm run build`

每个阶段至少覆盖以下冒烟：

- 新建节点、删除节点、拖拽节点
- 切换布局、主题、样式
- 备注编辑、备注查看
- 富文本编辑、公式输入
- 导入 `.smm/.json/.xmind/.md`
- 导出 `.smm/.json/.svg/.png/.pdf/.xmind/.txt`
- 图片预览
- 本地文件打开、另存为
- AI 对话与 AI 生成

协同阶段额外覆盖：

- `cd simple-mind-map && npm run wsServe`
- 多端同步
- 断线重连

---

## 8. 每阶段统一回退规则

- 先回退锁文件，再回退依赖声明。
- 一次只回退一个能力域，不一次性回退整批无关包。
- 构建链升级失败时，优先整体回退该阶段，不夹带业务修复。
- 迁移类阶段必须保留“停在旧栈”的兜底方案。
- 对 `web` 的 CLI/webpack 迁移必须保留可恢复的阶段性检查点。

---

## 9. 第一批建议实施顺序

如果下一步开始真正执行，建议顺序如下：

1. 阶段 0
2. 阶段 1
3. 阶段 2
4. 阶段 3
5. 阶段 4
6. 阶段 5
7. 阶段 6
8. 阶段 7
9. 阶段 8
10. 阶段 9

第一批做完后停一次，复核：

- `simple-mind-map` 核心编辑链
- `app` 主入口链
- `web` 兼容入口链
- 导入导出、AI、富文本、预览、协同是否仍然完整

第二批再继续：

1. 阶段 10
2. 阶段 11
3. 阶段 12
4. 阶段 13
5. 阶段 14
6. 阶段 15
7. 阶段 16
8. 阶段 17
9. 阶段 18
10. 阶段 19

---

## 10. 当前不建议直接执行的大版本升级

以下内容当前不应作为普通依赖升级直接执行：

- `vue 2 -> 3`
- `vue-router 3 -> 5`
- `vuex 3 -> 4`
- `vue-i18n 8 -> 11`
- `element-ui -> 任意 Vue 3 UI`
- `v-viewer 1.x -> 3.x`
- `codemirror 5 -> 6`
- `deepmerge 1 -> 4`
- `eventemitter3 4 -> 5`
- `mdast-util-from-markdown 1 -> 2`
- `uuid 9 -> 13`

原因：

- 这些不是补丁升级，而是明确的迁移项目。

---

## 11. 结论

本项目后续依赖升级的正确路径是：

- 先做核心库和双入口的 Vue 2 兼容型升级。
- 再做 `web` 构建链迁移和重依赖拆分。
- 最后再单独立项做 Vue 3、UI 框架、状态管理和编辑器体系迁移。

这份文档已经把 20 个阶段、阶段停点、能力影响、验证门禁、回退策略和本机 Node 边界都补齐。下一步如果开始实施，就按本文档从 `阶段 0` 到 `阶段 9` 顺序推进。
