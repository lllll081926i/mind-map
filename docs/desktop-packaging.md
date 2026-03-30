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
npm run desktop:dev
```

### 检查 Rust 编译

```bash
npm run desktop:check
```

### 生成桌面前端产物

```bash
npm run build:desktop-web
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
- 前端打包前置命令：`npm run build:desktop-web`
- 默认 `desktop:build` 仅在 Windows 上构建 `NSIS`
  - 这样不会触发 WiX / MSI 下载链路
  - macOS 和 Linux 通过各自脚本在对应宿主机构建

## 打包前检查

- `npm run desktop:check`
- `npm run build:desktop-web`
- `npm run build`
- `node ./scripts/test-ai-provider.mjs`

## 当前缺口

- 还未加入代码签名
- 还未加入自动更新配置
- 还未区分开发/预发/正式渠道
- 还未生成发布说明和版本元数据清单
- 还未完成 macOS 与 Linux 的宿主机真机构建验证

## 后续建议

### 短期

- 先稳定 `NSIS` 安装流程
- 固定应用名、图标、版本号策略
- 在 macOS 主机验证 `app` / `dmg`
- 在 Linux 主机验证 `deb` / `appimage`

### 中期

- 增加签名和安装目录策略
- 增加用户数据目录备份说明

### 长期

- 引入自动更新
- 加入崩溃日志和诊断包导出
