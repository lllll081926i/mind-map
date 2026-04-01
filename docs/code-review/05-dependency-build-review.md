# 依赖与构建审查报告

## 项目概况

| 项目 | 值 |
|------|-----|
| 根包名 | `mind-map-app` v0.1.0 |
| 工作区 | `simple-mind-map` v0.14.0-fix.2, `simple-mind-map-plugin-themes` v1.0.1-local.0 |
| 构建工具 | Vite 8.0.3 + Tauri CLI 2.10.1 |
| Node.js 要求 | >=22.0.0 |

---

## 1. 依赖版本稳定性分析

| 文件:行号 | 依赖 | 当前版本 | 问题 | 建议 |
|-----------|------|----------|------|------|
| `package.json:83` | `typescript` | `^6.0.2` | TS 6.x 为极新版本 | 降级至 `^5.4.x` |
| `package.json:85` | `vite` | `^8.0.3` | Vite 8 为极新版本 | 确认插件兼容性 |
| `package.json:65` | `@eslint/js` | `^10.0.1` | ESLint 10.x 为极新版本 | 确认所有插件兼容 |
| `package.json:71` | `eslint` | `^10.1.0` | 同上 | 同上 |

---

## 2. devDependencies / dependencies 分类问题

### 2.1 应移至 dependencies 的包

| 文件:行号 | 包 | 当前分类 | 原因 |
|-----------|-----|----------|------|
| `package.json:79` | `markdown-it` | devDependencies | 在 `AiChat.vue:64` 中被运行时引用 |

### 2.2 应移至 devDependencies 的包

| 文件:行号 | 包 | 当前分类 | 原因 |
|-----------|-----|----------|------|
| `package.json:54` | `punycode` | dependencies | 仅用于构建时 resolve alias |
| `package.json:46` | `buffer` | dependencies | 仅用于构建时别名 |
| `package.json:82` | `stream-browserify` | dependencies | 仅用于构建时别名 |

### 2.3 疑似未使用的依赖

| 文件:行号 | 包 | 分类 | 证据 |
|-----------|-----|------|------|
| `package.json:48` | `core-js` | dependencies | 在 `src/` 中零引用 |
| `package.json:84` | `vconsole` | devDependencies | 在 `main.js:73` 中被注释掉 |
| `package.json:69` | `chokidar` | devDependencies | 在 `src/` 和 `scripts/` 中零引用 |
| `package.json:80` | `markdown-it-checkbox` | devDependencies | 在 `src/` 和 `scripts/` 中零引用 |

---

## 3. 重复功能依赖

| 包 | 根包 | simple-mind-map | 问题 |
|----|------|-----------------|------|
| `eslint` | `^10.1.0` | `^8.25.0` | **版本冲突** |
| `prettier` | `^3.8.1` | `^2.7.1` | **版本冲突** |
| `katex` | `^0.16.44` | `^0.16.44` | 版本相同但分别安装 |

---

## 4. Vite 构建配置优化

### 4.1 vite.config.js 问题

| 行号 | 问题 | 严重度 | 建议 |
|------|------|--------|------|
| 30 | `v-viewer` 出现在 manualChunks 但项目未安装 | 中 | 删除该行 |
| 33 | `xlsx` 出现在 manualChunks 但项目未安装 | 中 | 删除该行 |
| 105-114 | 生产构建未配置 `sourcemap` | 低 | 添加 `sourcemap: 'hidden'` |
| 73-81 | 大量 Node.js polyfill 别名 | 中 | 评估是否真的需要 |

### 4.2 manualChunks 策略评估

| Chunk | 包含 | 评估 |
|-------|------|------|
| `vendor-framework` | vue, vue-router, vue-i18n, pinia, element-plus | **合理** |
| `vendor-editor` | @toast-ui/editor, codemirror, highlight.js, katex | **合理** |
| `vendor-viewer` | viewerjs, v-viewer | **需修正** — v-viewer 不存在 |
| `vendor-xlsx` | xlsx | **需删除** — xlsx 不在依赖中 |
| `vendor-network` | axios | **可合并** — 体积小 |
| `mind-map-core` | simple-mind-map | **合理** |
| `mind-map-themes` | simple-mind-map-plugin-themes | **合理** |
| `mind-map-icons` | icon.js | **可质疑** — 过度分割 |
| `mind-map-images` | image.js | **可质疑** — 过度分割 |

### 4.3 vite.lib.config.js 问题

| 行号 | 问题 | 建议 |
|------|------|------|
| 27 | `minify: false` | 使用 Vite 内置压缩 |
| 20 | 仅输出 `umd` 和 `es` 格式 | 增加 `cjs` 格式 |
| 28 | `chunkSizeWarningLimit: 4000` | 降低至 1000 |
| 无 | 未生成 sourcemap | 库构建应生成 sourcemap |

---

## 5. 构建脚本分析

### 5.1 冗余脚本

| 脚本 | 行号 | 问题 | 建议 |
|------|------|------|------|
| `buildLibrary` | 26 | 是 `build:library` 的别名 | 删除 |
| `desktop:build:windows` | 32 | 与 `desktop:build` 完全相同 | 删除或改为有实质区别 |
| `frontend:build` | 24 | 使用 `--mode desktop` 但无对应 `.env.desktop` | 确认模式文件是否存在 |

### 5.2 库构建流程

`build:library` 串联三个步骤：
1. `updateVersion.js` — 版本号写入 `full.js`
2. `vite build --config vite.lib.config.js` — 构建未压缩版本
3. `build-library-min.js` — esbuild 压缩

**问题**: 使用 esbuild 二次压缩增加复杂度。建议直接在 `vite.lib.config.js` 中设置 `minify: 'esbuild'`。

---

## 6. Node.js 版本要求

`package.json:10`: `"node": ">=22.0.0"`

| 评估项 | 结论 |
|--------|------|
| 版本要求 | 22.x 是当前 LTS，但要求过高 |
| 实际最低需求 | Vite 8 要求 Node 18+ |
| 建议 | 降级至 `>=18.0.0` 或 `>=20.0.0` |

---

## 7. 库构建配置 (simple-mind-map/package.json)

| 行号 | 问题 | 建议 |
|------|------|------|
| 15-16 | `types` 和 `typings` 重复 | 删除 `typings` |
| 28 | `module` 指向 `index.js`（源码入口） | 指向构建产物 |
| 无 | 缺少 `exports` 字段 | 添加条件导出 |
| 41 | `ws` 依赖 | 浏览器环境不可用，移至 peerDependencies |

---

## 8. 优化建议优先级汇总

### 高优先级

1. **修复依赖分类**: `markdown-it` 移至 dependencies，`buffer`/`punycode`/`stream-browserify` 移至 devDependencies
2. **清理未使用依赖**: 移除 `core-js`、`vconsole`、`chokidar`、`markdown-it-checkbox`
3. **修复 manualChunks 死引用**: 删除 `v-viewer` 和 `xlsx` 的 chunk 配置
4. **解决工作区依赖版本冲突**: 统一 `eslint` 和 `prettier` 版本

### 中优先级

5. **删除冗余脚本**: `buildLibrary`、`desktop:build:windows`
6. **简化库构建流程**: 使用 Vite 内置压缩
7. **添加库的 exports 字段**
8. **降低 Node.js 版本要求**

### 低优先级

9. **添加生产 sourcemap**
10. **优化 manualChunks 策略**: 合并小 chunk
11. **清理 overrides**: 移除与 dependencies 重复的覆盖
