# 依赖与构建审查报告

## 1. 依赖版本问题

| 依赖 | 当前版本 | 问题 | 建议 |
|------|----------|------|------|
| `typescript` | ^6.0.2 | 6.x 尚不存在（当前稳定版 5.x） | 降级为 ^5.4.0 |
| `vite` | ^8.0.3 | 极新版本，生态可能未完全兼容 | 降级为 ^6.0.0 |
| `eslint` | ^10.1.0 | 极新版本，插件可能未适配 | 验证兼容性或降级到 ^9.x |
| `simple-mind-map` eslint | ^8.25.0 | ESLint 8 已 EOL | 统一为 ESLint 9+ |
| `simple-mind-map` prettier | ^2.7.1 | Prettier 2 已过时 | 统一为 Prettier 3+ |

---

## 2. 未使用的依赖

| 依赖 | 位置 | 问题 | 建议 |
|------|------|------|------|
| `core-js` | dependencies | 全项目无任何引用 | **直接删除** |
| `chokidar` | devDependencies | 无任何引用 | **直接删除** |
| `markdown-it-checkbox` | devDependencies | 无任何引用 | **直接删除** |
| `vconsole` | devDependencies | Tauri 桌面应用有 DevTools | **直接删除** |

---

## 3. manualChunks 死配置

| 文件 | 问题 | 建议 |
|------|------|------|
| `vite.config.js:33-35` | `xlsx` chunk 但无 xlsx 依赖 | 删除 |
| `vite.config.js:30` | `v-viewer` chunk 但项目未使用 | 删除 |

---

## 4. Vite 构建配置优化

| 文件 | 问题 | 建议 |
|------|------|------|
| `vite.config.js:105-114` | 生产构建未启用 sourcemap | 添加 `sourcemap: 'hidden'` |
| `vite.config.js:105-114` | 使用默认 esbuild 压缩，未自定义选项 | 添加 terserOptions 去除 console |
| `vite.config.js:76-80` | Node polyfill（buffer, events, punycode, stream）对 Tauri 不必要 | 逐一验证后移除 |
| `vite.config.js:90` | `__VUE_OPTIONS_API__: true` 保留 Options API | 如未使用设为 false |

---

## 5. 库构建配置 (vite.lib.config.js)

| 问题 | 建议 |
|------|------|
| `minify: false` | 直接在 Vite 中启用 `minify: 'esbuild'` |
| 缺少 sourcemap | 添加 `sourcemap: true` |
| 缺少 `external` 配置 | 将 katex、yjs、pdf-lib 等大型依赖标记为外部 |
| 缺少 CSS 压缩 | 添加 CSS 压缩配置 |

---

## 6. simple-mind-map 子包问题

| 依赖 | 问题 | 建议 |
|------|------|------|
| `ws` ^7.5.10 | 纯 Node.js WebSocket 库，不能运行在浏览器中 | 移至 devDependencies |
| `y-webrtc`, `yjs` | 协作编辑非核心功能必需 | 移至 peerDependencies |
| 缺少 `exports` 字段 | 不利于 tree-shaking | 添加 exports 字段 |

---

## 7. Node.js 版本要求

| 文件 | 问题 | 建议 |
|------|------|------|
| `package.json:10` | `"node": ">=22.0.0"` 要求过高 | 降级为 `>=18.0.0` 或 `>=20.0.0` |

---

## 8. 构建脚本冗余

| 文件 | 问题 | 建议 |
|------|------|------|
| `package.json:25-26` | `build:library` 和 `buildLibrary` 等价 | 删除 `buildLibrary` |
| `scripts/copy-index.js` | 未被任何 npm script 引用 | 确认用途后删除 |

---

## 优先级排序

| 优先级 | 问题 | 影响 |
|--------|------|------|
| P0 | 删除 `core-js`（未使用 + 不必要） | 减少安装体积 |
| P0 | 修复 TypeScript 版本（6.x 不存在） | 构建可能失败 |
| P1 | 删除 `chokidar`、`markdown-it-checkbox`、`vconsole` | 减少无用依赖 |
| P1 | 库构建添加 `external` 配置 | 防止产物过大 |
| P1 | `ws` 从 simple-mind-map dependencies 移除 | 浏览器兼容性 |
| P2 | Node.js 引擎要求降至 18+ | 扩大兼容性 |
| P2 | 添加 sourcemap 配置 | 调试能力 |
| P3 | 清理 manualChunks 死配置 | 配置整洁性 |
