# Desktop Packaging Notes

**日期：** 2026-03-30

## 当前打包基线

- 桌面容器：`Tauri 2`
- 正式主线：`Windows / macOS / Linux`
- 当前宿主机：`Windows`
- 当前默认安装目标：`NSIS`
- 前端桌面构建输出：`dist-desktop`

## 当前命令

### 开发

```bash
npm run dev
```

### 检查 Rust 编译

```bash
npm run check
```

### 生成桌面前端产物

```bash
npm run frontend:build
```

### 构建安装包

```bash
npm run desktop:build
```

### 按平台构建

```bash
npm run desktop:build:windows
npm run desktop:build:macos
npm run desktop:build:linux
```

## 当前 Tauri 配置要点

- 产品名：`Mind Map Desktop`
- 标识符：`com.mindmap.desktop`
- 图标：`src-tauri/icons/icon.ico`
- `bundle.useLocalToolsDir = true`
  - 打包工具缓存写入仓库 `target/.tauri`
  - 避免 Windows 环境下反复走全局工具缓存
- 初始窗口：
  - `1440 x 900`
  - 最小 `1100 x 720`
- 前端开发前置命令：`npm run frontend:dev`
- 前端打包前置命令：`npm run frontend:build`
- 默认 `desktop:build` 仅在 Windows 上构建 `NSIS`
  - 这样不会触发 WiX / MSI 下载链路
  - macOS 和 Linux 通过各自脚本在对应宿主机构建

## 打包前检查

- `npm run check`
- `npm run frontend:build`
- `npm run build`
- `node ./scripts/test-ai-provider.mjs`

## 说明

桌面端后续尚未完成的能力规划已统一收口到：

- `docs/project-roadmap.md`

本文件只保留**当前已经确定的桌面打包基线和操作说明**，不再继续维护未来规划项。
