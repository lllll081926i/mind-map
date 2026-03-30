# 根目录发布与库构建兼容检查

日期：`2026-03-30`

## 1. 检查范围

- `app/scripts/copy-index.js`
- `app/scripts/build-library-min.js`
- `app/scripts/updateVersion.js`
- `web/scripts/updateVersion.js`
- `copy.js`
- 根目录 `index.html`

## 2. 当前发布链路

### 2.1 `app` 发布链

链路：

1. `vite build` 产物输出到根目录 `dist/`
2. `app/scripts/copy-index.js` 把 `dist/index.html` 转换为根目录 `index.html`
3. 根目录页面通过 `window.externalPublicPath` 指向 `./dist/`

### 2.2 `web` 发布链

链路：

1. `vue-cli-service build` 产物输出到根目录 `dist/`
2. 根目录 `copy.js` 直接把 `dist/index.html` 复制为根目录 `index.html`
3. `web/vue.config.js` 通过 `publicPath: './dist'` 和运行时 publicPath 插件保证资源相对路径可用

### 2.3 库构建链

链路：

1. `app/scripts/updateVersion.js`
2. `vite build --config app/vite.lib.config.js`
3. `app/scripts/build-library-min.js`

目标目录：

- `simple-mind-map/dist`

## 3. 本次发现与处理

### 3.1 已修复：`app` 根目录发布时的 `modulepreload` 路径错误

问题：

- `app/scripts/copy-index.js` 之前只处理了 `icon`、`stylesheet`、`module script`
- 没有处理 `link rel="modulepreload"`
- 结果是根目录 `index.html` 中仍残留 `./assets/...`
- 但真实资源目录在 `./dist/assets/...`

影响：

- 根目录发布后会产生错误的 preload 请求
- 主入口脚本还能运行，但预加载路径不一致

本次处理：

- `app/scripts/copy-index.js` 已改为同时收集并运行时注入 `modulepreload`
- 同时移除原始的静态 `modulepreload` 标签

结论：

- `app` 的根目录发布兼容性已对齐到与 `externalPublicPath` 一致

### 3.2 已修复：`web/scripts/updateVersion.js` 对工作目录过度依赖

问题：

- 旧写法使用 `path.resolve('../simple-mind-map/full.js')`
- 这依赖当前进程工作目录刚好是 `web/`

风险：

- 一旦从其他目录调用脚本，路径可能解析错误

本次处理：

- 改为 `path.resolve(__dirname, '../../simple-mind-map/full.js')`

结论：

- `web` 的版本同步脚本已改成稳定的脚本相对路径

## 4. 保持不动但需要记录的现状

### 4.1 `copy.js` 仍是简单覆盖式复制

当前行为：

- 若根目录 `index.html` 已存在，则先删除
- 再把 `dist/index.html` 复制到根目录

这条链路目前可用，但有两个特征需要明确：

- 它不是原子替换
- 根目录 `index.html` 始终只能代表最后一次执行的入口构建结果

### 4.2 `app` 与 `web` 共用根目录发布位

这不是 bug，而是当前仓库结构事实：

- `app build` 和 `web build` 都会写根目录 `dist/`
- 两者最终也都会生成根目录 `index.html`

因此当前仓库不支持“同一份根目录同时保留两套入口页面”。

## 5. 发布兼容结论

- `app` 根目录发布：可继续使用，且本轮已修正 preload 兼容问题。
- `web` 根目录发布：可继续使用，脚本路径稳定性已补齐。
- 库构建：`updateVersion + vite lib build + esbuild minify` 结构保持兼容。

## 6. 后续建议

1. 若以后需要并行保留 `app` 与 `web` 两套页面，应拆分为不同发布目录，而不是继续共享根目录 `index.html`。
2. 若继续保留单根目录发布模型，发布流程必须明确“最后一次构建即最终页面”。
3. 后续如果继续调整 `app` 的 chunk 拆分策略，必须复查 `copy-index.js` 对 preload / stylesheet / script 的提取逻辑。
