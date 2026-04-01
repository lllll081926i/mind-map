# 代码审查总索引

本文档包含对 mind-map 项目的全方位代码审查报告。

## 审查报告列表

| 报告 | 文件 | 说明 |
|------|------|------|
| 架构与代码质量 | `01-architecture-review.md` | 项目架构、模块划分、SOLID/DRY、状态管理 |
| 安全审查 | `02-security-review.md` | XSS、敏感信息、依赖漏洞、CSP、Tauri 安全 |
| 性能与Bug | `03-performance-bug-review.md` | 内存泄漏、竞态条件、运行时错误、性能优化 |
| 规范与可维护性 | `04-code-style-maintainability.md` | 代码风格、注释、测试、国际化、无障碍 |
| 依赖与构建 | `05-dependency-build-review.md` | 依赖版本、Vite 配置、打包优化、polyfill |
| Tauri 桌面端 | `06-tauri-review.md` | Tauri 配置、Rust 代码、权限、IPC、跨平台 |
| 核心库 | `07-core-library-review.md` | simple-mind-map API、插件系统、渲染、算法 |
| 侧边栏专项 | `08-sidebar-review.md` | 侧边栏显示/隐藏逻辑、竞态条件、CSS 问题 |

## 审查日期

2026-04-01

## 审查范围

- `src/` 全部源文件
- `simple-mind-map/` 核心库全部源文件
- `src-tauri/` Rust 源码和配置
- `scripts/` 构建脚本
- `tests/` 测试文件
- 构建配置（vite.config.js, vite.lib.config.js）
- 依赖配置（package.json, Cargo.toml）
