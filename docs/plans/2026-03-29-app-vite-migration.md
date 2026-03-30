# App Vite Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在仓库根目录新建独立的 `app/` 前端工程，将现有 `web/` 的 Vue CLI 4 / Webpack 4 应用迁移到适配当前本机 Node 25 的 Vite 构建链，同时保留旧 `web/` 作为对照和回滚路径。

**Architecture:** 新工程 `app/` 采用 `Vite + Vue 2.7 + @vitejs/plugin-vue2`，继续复用现有 `simple-mind-map` 本地库源码。迁移过程中不直接改动旧 `web/` 目录，而是在 `app/` 内逐步重建入口、页面、资源与发布链，最后让构建产物继续兼容根目录 `index.html + dist/` 的现有发布结构。

**Tech Stack:** Vite、Vue 2.7、Vue Router 3、Vuex 3、Element UI 2、Less、本地 file 依赖、simple-mind-map 源码深路径引用

---

## 背景与约束

- 当前 `web/` 使用 `Vue CLI 4.5 + Webpack 4.44`，在 `Node 25` 下构建会因 OpenSSL 3 触发 `error:0308010C`。
- `web/` 不是标准 SPA 发布结构，构建后需要通过根目录 [copy.js](/D:/Code/mind-map/copy.js) 把 `dist/index.html` 搬到根目录 [index.html](/D:/Code/mind-map/index.html)。
- 页面支持“接管模式”，依赖 `window.takeOverApp`、`window.takeOverAppMethods`、`window.initApp`、`window.$bus`，对应逻辑在 [web/public/index.html](/D:/Code/mind-map/web/public/index.html)、[web/src/main.js](/D:/Code/mind-map/web/src/main.js)、[web/src/api/index.js](/D:/Code/mind-map/web/src/api/index.js)。
- `web/` 直接引用本地库 `simple-mind-map` 以及其 `src/*` 深路径，不是单纯消费 npm 包。
- 当前仓库 `lint` 已有大量历史错误，迁移验收不能以“全仓 lint 归零”为前提。

## 验收标准

1. `app/` 可以在当前本机 Node 版本下完成 `npm install`。
2. `app/` 可以完成 `npm run build`，且不依赖 `--openssl-legacy-provider`。
3. `app/` 构建后仍能兼容根目录 `index.html + dist/` 的发布方式。
4. `simple-mind-map` 的本地源码引用在 `app/` 中可正常工作。
5. 旧 `web/` 保持可读、可对照，不在迁移初期被删除。

## 非目标

- 本计划不要求一次性清理旧工程全部 ESLint 历史报错。
- 本计划不要求同步迁移全部非核心脚本到 TypeScript。
- 本计划不要求立即删除 `web/` 目录。

### Task 1: 建立 `app/` 工程骨架

**Files:**
- Create: `app/package.json`
- Create: `app/index.html`
- Create: `app/vite.config.js`
- Create: `app/src/main.js`
- Create: `app/src/App.vue`
- Create: `app/src/router.js`
- Create: `app/src/store.js`
- Create: `app/src/i18n.js`

**Step 1: 创建目录与最小 package 清单**

- 新建 `app/`、`app/src/`、`app/public/`、`app/scripts/`
- `app/package.json` 初始包含：
  - `vite`
  - `vue@2.7.x`
  - `@vitejs/plugin-vue2`
  - `vue-router@3`
  - `vuex@3`
  - `vue-i18n@8`
  - `element-ui@2`
  - `less`
  - `v-viewer`
  - `simple-mind-map: file:../simple-mind-map`
  - 迁移期保留现有应用实际用到的运行时依赖

**Step 2: 写最小 Vite 配置**

- 在 `app/vite.config.js` 中声明：
  - `plugins: [vue()]`
  - `resolve.alias['@'] = path.resolve(__dirname, 'src')`
  - 临时 `base: './'`
  - 临时 `build.outDir = 'dist'`

**Step 3: 复制最小入口代码**

- 从旧工程迁移最小入口：
  - [web/src/main.js](/D:/Code/mind-map/web/src/main.js)
  - [web/src/router.js](/D:/Code/mind-map/web/src/router.js)
  - [web/src/store.js](/D:/Code/mind-map/web/src/store.js)
  - [web/src/i18n.js](/D:/Code/mind-map/web/src/i18n.js)
  - [web/src/App.vue](/D:/Code/mind-map/web/src/App.vue)

**Step 4: 安装依赖并确认骨架可启动**

Run:

```bash
cd D:/Code/mind-map/app
npm install
npm run dev
```

Expected:
- 安装成功
- Vite 开发服务器启动，不出现 Webpack / OpenSSL 报错

### Task 2: 迁移 HTML 入口与接管模式

**Files:**
- Modify: `app/index.html`
- Reference: `web/public/index.html`
- Reference: `copy.js`

**Step 1: 迁移 `web/public/index.html` 的自定义脚本**

- 保留这些能力：
  - `window.externalPublicPath`
  - `window.takeOverApp`
  - `getDataFromBackend`
  - `setTakeOverAppMethods`
  - `window.onload` 中的接管初始化逻辑

**Step 2: 移除 Vue CLI 模板语法**

- 删除 `<%= htmlWebpackPlugin.options.title %>`
- 改为标准 Vite HTML 入口
- 改为使用 `<script type="module" src="/src/main.js"></script>`

**Step 3: 确认统计脚本是否继续保留**

- 迁移前原样保留 51.LA 脚本
- 若后续需要去除，再单列任务处理

**Step 4: 验证普通模式和接管模式初始化**

Run:

```bash
cd D:/Code/mind-map/app
npm run dev
```

Expected:
- 普通模式页面能挂载
- 将 `window.takeOverApp = true` 后，`window.initApp` 和 `window.$bus` 仍可用

### Task 3: 迁移页面与应用结构

**Files:**
- Create/Modify: `app/src/pages/**`
- Create/Modify: `app/src/components/**`
- Create/Modify: `app/src/utils/**`
- Create/Modify: `app/src/api/index.js`
- Create/Modify: `app/src/config/**`
- Create/Modify: `app/src/lang/**`
- Create/Modify: `app/src/style/**`

**Step 1: 按目录迁移源码**

- 从 `web/src` 复制到 `app/src`
- 迁移顺序：
  1. `api`
  2. `config`
  3. `lang`
  4. `utils`
  5. `components`
  6. `pages`
  7. `style`

**Step 2: 保留旧 import 结构**

- 暂不做风格重写
- 优先保证路径和运行时行为一致

**Step 3: 迁移静态资源**

- 复制 `web/src/assets` 到 `app/src/assets`
- 复制 `web/public/logo.ico` 到 `app/public/logo.ico`

**Step 4: 冒烟验证主页面**

Run:

```bash
cd D:/Code/mind-map/app
npm run dev
```

Expected:
- 路由 `/` 能打开编辑页
- 不因缺失文件或基础 import 失败而白屏

### Task 4: 打通本地库与深路径引用

**Files:**
- Modify: `app/package.json`
- Modify: `app/vite.config.js`
- Reference: `simple-mind-map/package.json`

**Step 1: 固化本地库依赖**

- 确保 `app/package.json` 中有：

```json
{
  "dependencies": {
    "simple-mind-map": "file:../simple-mind-map"
  }
}
```

**Step 2: 验证深路径引用**

- 重点检查这些路径：
  - `simple-mind-map`
  - `simple-mind-map/src/plugins/*`
  - `simple-mind-map/src/utils/*`
  - `simple-mind-map/src/parse/*`
  - `simple-mind-map/example/exampleData`

**Step 3: 必要时补充 Vite 配置**

- 如依赖预构建异常，补 `optimizeDeps.exclude`
- 如 CJS/ESM 边界异常，补 `build.commonjsOptions`

**Step 4: 验证编辑器能实例化**

Run:

```bash
cd D:/Code/mind-map/app
npm run dev
```

Expected:
- `MindMap` 实例成功创建
- 不再出现 “These dependencies were not found: simple-mind-map/...”

### Task 5: 迁移 Webpack 专属配置到 Vite

**Files:**
- Modify: `app/vite.config.js`
- Reference: `web/vue.config.js`

**Step 1: 对齐旧配置的必要能力**

- 旧配置里真正需要迁移的只有：
  - alias `@`
  - 产物目录
  - public/base 路径
  - `transpileDependencies`
  - 动态 public path 需求

**Step 2: 明确运行时资源路径策略**

- 优先判断 `window.externalPublicPath` 是否只是固定 `./dist/`
- 如果固定，优先用 `base: './dist/'`
- 如果必须运行时决定，再评估 `renderBuiltUrl`

**Step 3: 丢弃纯 Webpack 行为**

- 删除/不迁移：
  - `webpack-dynamic-public-path`
  - `config.plugins.delete('preload')`
  - `config.plugins.delete('prefetch')`
  - `htmlWebpackPlugin` 的 hash 注入逻辑

**Step 4: 构建验证**

Run:

```bash
cd D:/Code/mind-map/app
npm run build
```

Expected:
- 不再出现 `error:0308010C`
- 进入 Vite 正常打包流程

### Task 6: 修复 Vite 不兼容的资源引用

**Files:**
- Modify: `app/src/config/constant.js`
- Modify: `app/src/pages/Edit/components/Edit.vue`
- Check: `app/src/pages/Edit/components/Export.vue`

**Step 1: 替换 JS 中的 `require()` 图片引用**

- [web/src/config/constant.js](/D:/Code/mind-map/web/src/config/constant.js) 中的结构图图片，改成顶部 `import`
- [web/src/pages/Edit/components/Edit.vue](/D:/Code/mind-map/web/src/pages/Edit/components/Edit.vue) 中的 `defaultNodeImage` 改成显式 `import`

**Step 2: 检查 CSS 中的 `url(...)`**

- `Export.vue` 里的样式 URL 通常 Vite 可处理
- 仅在构建报错时才调整

**Step 3: 重新构建验证**

Run:

```bash
cd D:/Code/mind-map/app
npm run build
```

Expected:
- 不因 `require is not defined` 或资源解析失败中断

### Task 7: 恢复根目录发布结构

**Files:**
- Create: `app/scripts/copy-index.js`
- Modify: `app/package.json`
- Reference: `copy.js`

**Step 1: 复制旧发布脚本行为**

- 新脚本把 `app/dist/index.html` 复制到根目录 `index.html`
- 然后删除 `app/dist/index.html`

**Step 2: 决定产物落点**

- 推荐直接输出到根目录 `dist`
- 备选：先输出到 `app/dist`，再同步到根目录

**Step 3: 更新 build 脚本**

- 示例：

```json
{
  "scripts": {
    "build": "vite build && node ./scripts/copy-index.js"
  }
}
```

**Step 4: 验证产物形态**

Run:

```bash
cd D:/Code/mind-map/app
npm run build
```

Expected:
- 根目录生成 [index.html](/D:/Code/mind-map/index.html)
- 根目录 [dist](/D:/Code/mind-map/dist) 保持可部署

### Task 8: 迁移库构建链

**Files:**
- Modify: `app/package.json`
- Create: `app/vite.lib.config.js`
- Reference: `web/package.json`
- Reference: `web/scripts/updateVersion.js`

**Step 1: 拆分应用构建和库构建**

- `app` 的 `build` 只负责 Web 应用
- 新增 `build:library` 专门产出 `simple-mind-map/dist`

**Step 2: 保留版本写入逻辑**

- 继续使用 [web/scripts/updateVersion.js](/D:/Code/mind-map/web/scripts/updateVersion.js) 的思路
- 迁到 `app/scripts/updateVersion.js`

**Step 3: 用 Vite library mode 重写**

- 入口仍然是 `../simple-mind-map/full.js`
- 输出至少覆盖：
  - UMD
  - ESM
  - Minified ESM

**Step 4: 验证库构建**

Run:

```bash
cd D:/Code/mind-map/app
npm run build:library
```

Expected:
- `simple-mind-map/dist` 生成新产物

### Task 9: 双轨验证与切换准备

**Files:**
- Modify: `README.md`
- Create: `docs/plans/2026-03-29-app-vite-migration-verification.md`（可选）

**Step 1: 验证命令清单**

Run:

```bash
cd D:/Code/mind-map/app
npm install
npm run build
npm run build:library
```

**Step 2: 冒烟检查**

- 打开编辑页
- 新建节点
- 导入导出
- 打开搜索
- 切换主题
- 触发接管模式初始化

**Step 3: 明确切换条件**

- 新工程能稳定 build
- 发布结构兼容
- 核心编辑功能可用
- 旧 `web/` 尚未删除

**Step 4: 记录残余问题**

- 将“迁移新增问题”和“仓库历史问题”分开记录

## 风险清单

- `@vitejs/plugin-vue2` 只支持 Vue 2.7，不能继续停留在 2.6.x。
- `simple-mind-map` 深路径引用多，任何一个解析失败都会阻塞页面。
- `window.externalPublicPath` 如果必须运行时动态决定资源地址，Vite 需要额外兼容设计。
- `buildLibrary` 如果不单独迁移，整个项目升级是不完整的。
- 当前仓库的 `lint` 错误很多，实施时必须把“迁移问题”和“历史问题”分开。

## 回滚策略

- 不修改旧 `web/`，所以回滚就是停止使用 `app/`。
- 根目录发布结构切换前，不删除任何旧脚本和旧目录。
- 只在 `app/` 完整通过验证后，再讨论替换默认入口。

## 实施建议

- 优先顺序：`dev` 跑通 > `build` 跑通 > 发布结构兼容 > `buildLibrary`
- 每完成一个 Task 就单独验证，不跨阶段堆积问题
- 不把迁移和“顺手清理全仓库 lint”混在同一轮里
