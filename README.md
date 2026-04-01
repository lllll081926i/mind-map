# Mind Map Desktop

一个面向桌面端的思维导图应用，基于 `Vue 3 + Vite + Tauri 2 + simple-mind-map` 构建，当前主线聚焦本地优先编辑体验、跨平台桌面发布，以及 OpenAI Compatible AI 工作流。

## 项目定位

这个仓库当前维护的是新的桌面端主线，不再包含旧项目分支逻辑。项目目标不是做一个只会画节点的轻量 Demo，而是逐步演进成一个可长期维护、可稳定发布、可持续集成 AI 能力的桌面思维导图产品。

当前版本已经具备：

- 桌面端本地文件读写
- 思维导图基础编辑能力
- 主题与暗色模式
- 最近文件与目录浏览
- AI 对话、整图生成、节点续写
- Windows / macOS / Linux 打包发布链路

## 核心特性

### 本地优先

- 以桌面端为主线，优先保证本地文件可控、响应直接、无需依赖云端
- 支持打开、编辑、保存 `.smm` 文件
- 支持目录浏览与最近文件记录

### 思维导图编辑器

- 节点创建、删除、编辑
- 样式、图标、图片、备注、标签、超链接
- 大纲、搜索、导入导出
- 多种主题与暗色主题

### AI 能力

- 支持 OpenAI Compatible 接口
- 支持多 Provider 预设与自定义 OpenAI Compatible 服务
- 支持 AI 对话
- 支持整图生成
- 支持基于节点的 AI 续写

### 跨平台桌面发布

- Windows 安装包
- Windows 便携版
- macOS `app / dmg`
- Linux `deb / AppImage`

## 技术栈

### 前端

- `Vue 3`
- `Vite`
- `Pinia`
- `Element Plus`
- `simple-mind-map`

### 桌面端

- `Tauri 2`
- `Rust`

### AI 与工具链

- `OpenAI Compatible API`
- 本地 Node AI 代理
- GitHub Actions 自动打包

## 目录结构

```text
.
├─ src/                 前端主应用
│  ├─ pages/            页面与编辑器模块
│  ├─ services/         AI、配置、事件等服务
│  ├─ stores/           应用状态
│  ├─ platform/         桌面平台适配层
│  └─ utils/            通用工具与 AI 配置逻辑
├─ src-tauri/           Tauri 桌面端工程
├─ simple-mind-map/     本地思维导图库依赖
├─ scripts/             构建、AI 代理等脚本
├─ docs/                迁移、发布、路线规划文档
└─ .github/workflows/   自动打包与发布流程
```

## 开发环境

建议环境：

- Node.js 25.x
- npm 10+
- Rust stable
- Windows 为当前主要开发宿主机

首次使用前建议确认：

```bash
node -v
npm -v
cargo -V
```

## 快速开始

### 1. 安装依赖

```bash
npm ci
```

### 2. 启动桌面开发模式

```bash
npm run dev
```

### 3. 检查桌面端 Rust 编译

```bash
npm run check
```

### 4. 桌面构建

```bash
npm run build
```

### 5. 如需单独验证桌面前端构建

```bash
npm run frontend:build
```

说明：`frontend:*` 命令仅供 `Tauri` 前置构建和排查使用，不作为正式开发入口。

## AI 使用说明

当前 AI 模块统一采用 OpenAI Compatible 协议层，默认通过本地代理转发请求。

### 启动本地 AI 代理

```bash
npm run ai:serve
```

默认监听端口：

```text
3456
```

也可以通过命令行参数覆盖端口：

```bash
npm run ai:serve -- --port=4567
```

### 当前支持的 Provider 形态

- Volcano Ark
- OpenAI
- DeepSeek
- SiliconFlow
- Custom OpenAI Compatible

### 当前 AI 入口

- AI 对话
- AI 整图生成
- AI 节点续写

详细说明见：

- [AI 配置迁移说明](/D:/Code/mind-map/docs/ai-migration.md)

## 常用命令

```bash
# 桌面开发
npm run dev

# 桌面构建
npm run build

# 桌面后端检查
npm run check

# 单独构建桌面前端资源
npm run frontend:build

# Windows 打包
npm run desktop:build:windows

# macOS 打包
npm run desktop:build:macos

# Linux 打包
npm run desktop:build:linux

# 启动本地 AI 代理
npm run ai:serve
```

## 发布与打包

项目已经接入 GitHub Actions 自动打包流程，当前发布目标包含：

- Windows 安装包
- Windows 便携版
- macOS `app / dmg`
- Linux `deb / AppImage`

相关文档：

- [桌面打包说明](/D:/Code/mind-map/docs/desktop-packaging.md)
- [桌面发布检查清单](/D:/Code/mind-map/docs/release/desktop-release-checklist.md)

## 当前状态

当前仓库已经完成桌面主线迁移，但仍处在“持续产品化”阶段，后续工作重点不是简单堆功能，而是继续提升：

- 稳定性
- AI 工作流深度
- 架构一致性
- 桌面产品化闭环

详细路线见：

- [项目后续能力规划与升级路线](/D:/Code/mind-map/docs/project-roadmap.md)

## 已知方向

后续主线建议按以下顺序推进：

1. 稳定性补齐
2. AI 工作流增强
3. 架构清理
4. 桌面产品化闭环

## 开源协议

本项目采用 `MIT License`。

详见：

- [LICENSE](/D:/Code/mind-map/LICENSE)
