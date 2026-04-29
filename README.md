# MindMap

<p align="center">
  面向桌面工作流的本地优先思维导图应用
</p>

<p align="center">
  基于 Vue 3、Vite、Tauri 2 与 simple-mind-map 构建，聚焦稳定的本地编辑、跨平台桌面发布与 OpenAI Compatible AI 工作流。
</p>

<p align="center">
  <a href="https://github.com/lllll081926i/mind-map/releases/latest"><img alt="Latest Release" src="https://img.shields.io/github/v/release/lllll081926i/mind-map?display_name=tag&style=for-the-badge"></a>
  <a href="https://github.com/lllll081926i/mind-map/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/lllll081926i/mind-map?style=for-the-badge"></a>
  <img alt="Vue 3" src="https://img.shields.io/badge/Vue-3.5-42b883?style=for-the-badge">
  <img alt="Tauri 2" src="https://img.shields.io/badge/Tauri-2.x-24c8db?style=for-the-badge">
  <img alt="Platforms" src="https://img.shields.io/badge/Windows-Linux-4b5563?style=for-the-badge">
</p>

## 概览

MindMap 当前维护的是桌面端主线，不再以 Web 端作为产品方向。

这个仓库的目标不是提供一个仅能编辑节点的演示工程，而是逐步打磨成一个可长期维护、可稳定发布、可扩展 AI 能力的桌面思维导图产品。当前版本已经完成桌面主线迁移，核心工作聚焦在以下几个方面：

- 本地优先文件工作流：打开、编辑、保存、关联 `.smm` 文档
- 稳定的桌面编辑体验：首页、编辑页、导出弹窗、设置侧栏已统一为桌面主路径
- 跨平台发布：Windows、Linux 双平台打包链路持续维护
- OpenAI Compatible AI：AI 对话、整图生成、节点续写已接入桌面工作流

## 产品定位

### 本地优先

- 以桌面使用为中心，而不是浏览器演示模式
- 用户文件保存在本地，路径、目录、最近文件与文件关联都由桌面能力托管
- 优先保证“新建 -> 编辑 -> 保存 -> 导出 -> 再次打开”的完整闭环

### 桌面主线

- 应用入口围绕桌面首页、编辑器、导出弹窗与设置侧栏组织
- 发布态以 Tauri 2 为宿主，前端构建输出专门的 `dist-desktop`
- 当前发布目标覆盖 Windows、Linux

### AI 工作流增强

- 统一采用 OpenAI Compatible 协议层
- 支持多 Provider 预设与自定义服务地址
- AI 能力不再是孤立工具入口，而是嵌入桌面导图编辑过程

## 核心能力

### 1. 桌面文件工作流

- 新建、打开、另存为 `.smm` 文件
- 最近文件与工作区恢复
- 打开文件夹并浏览目录内容
- `.smm` 文件后缀关联与专属文档图标接入

### 2. 思维导图编辑

- 节点创建、删除、拖拽与层级调整
- 主题、样式、图标、标签、备注、图片、超链接
- 大纲、搜索、导入、导出与视图辅助能力
- 首页、编辑区、侧边栏、导出弹窗的统一桌面交互路径

### 3. AI 能力

- AI 对话
- AI 整图生成
- 基于当前节点继续生成内容
- OpenAI、DeepSeek、SiliconFlow、Volcano Ark 与自定义 OpenAI Compatible 服务

### 4. 导出与交付

- 导出中心以编辑页内弹窗形式承载，而不是跳转到独立外站式页面
- 当前导出链路已接入多格式导出能力
- 导出页面与首页已适配明暗主题

### 5. 跨平台发布

- Windows：安装版与便携版
- Windows ARM64：安装版与便携版
- Linux：`deb` 与 `AppImage`

## 技术栈

### 前端

- `Vue 3`
- `Vite`
- `Pinia`
- `Vue Router`
- `Element Plus`
- `DOMPurify`

### 桌面端

- `Tauri 2`
- `Rust`
- Tauri 插件：`dialog`、`process`、`updater`

### 编辑器与导图能力

- `simple-mind-map`
- `simple-mind-map-plugin-themes`
- `@toast-ui/editor`
- `viewerjs`

### 工程工具链

- `TypeScript` 类型检查
- `ESLint + Prettier`
- `Husky + Commitlint`
- `GitHub Actions` 自动打包与 Release 发布

## 仓库结构

```text
.
├─ src/                         桌面前端主应用
│  ├─ pages/                    首页、编辑页、导出页等视图
│  ├─ platform/                 桌面运行时适配层
│  ├─ services/                 事件、工作区、更新、配置等服务
│  ├─ stores/                   Pinia 状态管理
│  ├─ lang/                     国际化资源
│  └─ utils/                    通用工具与 AI 相关辅助逻辑
├─ src-tauri/                   Tauri 2 桌面端工程
│  ├─ src/                      Rust 命令与服务实现
│  ├─ file-association/         .smm 文件关联资源
│  └─ tauri.conf.json           桌面开发配置
├─ simple-mind-map/             本地导图库工作区包
├─ simple-mind-map-plugin-themes/ 主题插件工作区包
├─ tests/                       桌面工作流、运行时与审查回归测试
├─ scripts/                     构建辅助脚本与本地 AI 代理
├─ docs/                        设计、规划、打包、发布与审查文档
└─ .github/workflows/           自动构建与发布工作流
```

## 运行环境

推荐环境基线：

- Node.js `22.x`
- npm `10+`
- Rust stable
- Windows 为当前主要开发宿主机

首次使用建议确认：

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

### 3. 检查桌面后端

```bash
npm run check
```

### 4. 构建桌面前端资源

```bash
npm run frontend:build
```

### 5. 构建桌面应用

```bash
npm run build
```

说明：

- `npm run dev` 会直接启动 Tauri 桌面开发窗口
- `npm run frontend:dev` 仅用于单独排查前端，不是主开发入口
- 正式发布态前端资源输出目录为 `dist-desktop`

## 常用命令

```bash
# 桌面开发
npm run dev

# 构建桌面应用（Windows 默认 NSIS）
npm run build

# 检查 Rust 编译
npm run check

# 桌面前端单独构建
npm run frontend:build

# Windows 打包
npm run desktop:build:windows

# Linux 打包
npm run desktop:build:linux

# 运行全部测试
npm run test:all

# 启动本地 AI 代理
npm run ai:serve
```

## AI 配置与使用

当前 AI 模块统一采用 OpenAI Compatible 协议层，默认可通过本地代理进行请求转发。

### 启动本地 AI 代理

```bash
npm run ai:serve
```

默认端口：

```text
3456
```

自定义端口示例：

```bash
npm run ai:serve -- --port=4567
```

### 当前支持的 Provider 形态

- OpenAI
- DeepSeek
- SiliconFlow
- Volcano Ark
- Custom OpenAI Compatible

### 当前 AI 入口

- AI 对话
- AI 整图生成
- AI 节点续写

相关文档：

- [AI 配置迁移说明](./docs/ai-migration.md)

## 构建与发布

项目已接入 GitHub Actions 自动打包流程，发布以 GitHub Release 为中心组织。

当前产物矩阵：

- Windows x64：安装版、便携版
- Windows ARM64：安装版、便携版
- Linux：`deb`、`AppImage`

本地发版前最小验证建议：

```bash
npm run test:all
npm run frontend:build
npm run check
npx tauri build --no-bundle
npx tauri build --bundles nsis
```

相关文档：

- [桌面打包说明](./docs/desktop-packaging.md)
- [桌面发布检查清单](./docs/release/desktop-release-checklist.md)

## 文档索引

如果你是第一次接手这个仓库，建议按下面顺序阅读：

1. [项目后续能力规划与升级路线](./docs/project-roadmap.md)
2. [桌面打包说明](./docs/desktop-packaging.md)
3. [桌面发布检查清单](./docs/release/desktop-release-checklist.md)
4. [AI 配置迁移说明](./docs/ai-migration.md)

设计与实现过程文档位于：

- [plans](./docs/plans)

代码审查与问题记录位于：

- [code-review](./docs/code-review)

## 当前阶段与路线

当前仓库已经完成“桌面主线切换”这一关键阶段，接下来的主线不是继续堆叠零散功能，而是把产品底座做稳。

下一阶段重点包括：

1. 桌面编辑体验继续收口
2. 状态与数据层进一步标准化
3. 文件系统与项目模型继续统一
4. 发布与回归测试体系继续加强

详细规划见：

- [项目后续能力规划与升级路线](./docs/project-roadmap.md)

## 开发约定

- 主线只保留桌面端，不再把 Web 端作为正式产品路径
- 新能力优先围绕本地优先、桌面稳定性、可发布性与 AI 工作流展开
- 提交前默认执行 `lint`、`typecheck` 与关键桌面回归测试
- Release 版本号需要同步到 `package.json`、`Cargo.toml` 与 Tauri 配置

## 许可证

本项目采用 `MIT License`。

详见：

- [LICENSE](./LICENSE)
