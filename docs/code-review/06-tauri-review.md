# Tauri 桌面端专项审查报告

## 一、Tauri 配置安全分析

| 文件 | 行号 | 风险 | 问题 | 建议 |
|------|------|------|------|------|
| `tauri.conf.json` | 25 | 高 | CSP `connect-src` 包含 `http://localhost:*` 和 `ws://localhost:*` | 生产环境移除 localhost 通配符 |
| `tauri.conf.json` | 61 | 中 | updater.pubkey 格式正确但需确认密钥未泄露 | 确认密钥轮换 |
| `tauri.conf.json` | 30 | 低 | `bundle.targets: "all"` 构建所有格式 | 指定具体 target |
| `tauri.conf.json` | 57 | 低 | `updater.dialog: false` | 确认前端有完善错误处理 |
| `tauri.conf.json` | 46-48 | 低 | `deb.depends` 为空数组 | 添加必要系统依赖 |

---

## 二、Rust 代码质量

### 高风险

| 文件 | 行号 | 问题 | 建议 |
|------|------|------|------|
| `app_fs.rs` | 11-32 | `is_path_safe()` 无沙箱限制，可传入任意绝对路径 | 使用 `canonicalize` 后验证前缀 |
| `app_fs.rs` | 34-37 | `has_allowed_extension` 使用 `ends_with` 可被绕过 | 使用 `Path::extension()` |
| `commands/fs.rs` | 4-15 | 文件系统命令无沙箱限制 | 限制在用户选择的目录范围内 |

### 中风险

| 文件 | 行号 | 问题 | 建议 |
|------|------|------|------|
| `main.rs` | 31-34 | 仅 `eprintln!` 打印错误，无日志持久化 | 集成 `tracing` 或 `log` crate |
| `app_state.rs` | 137-139 | `block_in_place` 使用不当 | 改为 `tokio::fs::create_dir_all` |
| `app_state.rs` | 177-185 | 状态写入无原子性保证 | 先写临时文件再 `rename` |
| `ai.rs` | 134-137 | 每个请求创建新 HTTP Client | 全局单例管理 `reqwest::Client` |
| `ai.rs` | 178 | AI 请求缺少请求体大小限制 | 添加大小限制（如 10MB） |
| `capabilities/default.json` | 8 | `core:default` 权限过大 | 使用更细粒度权限 |
| `commands/ai.rs` | 4-11 | AI 代理缺少限流 | 添加每分钟请求数限制 |

### 低风险

| 文件 | 行号 | 问题 | 建议 |
|------|------|------|------|
| `lib.rs` | 1-3 | `desktop_runtime_ready()` 始终返回 `true` | 删除或添加实际检测逻辑 |
| `commands/config.rs` | 86-111 | `open_external_url` 使用 `Command::spawn` 绕过 Tauri shell API | 考虑使用 `tauri-plugin-shell` |

---

## 三、权限配置

| 文件 | 状态 | 说明 |
|------|------|------|
| `capabilities/default.json` | ⚠️ | 使用 `core:default`, `dialog:default` 等通配权限，未遵循最小权限 |
| 自定义 fs 命令 | ⚠️ | 无 fs scope 限制 |

---

## 四、跨平台兼容性

| 文件 | 状态 | 说明 |
|------|------|------|
| `commands/config.rs` | ✅ | 使用 `#[cfg]` 正确处理 Windows/macOS/Linux |
| `main.rs` | ✅ | `windows_subsystem = "windows"` 正确配置 |
| `updateService.js:82` | ✅ | Windows NSIS 安装器自动重启处理正确 |

---

## 五、窗口配置

| 文件 | 状态 | 说明 |
|------|------|------|
| `tauri.conf.json:13-22` | ✅ | 1440x900 默认尺寸，1100x720 最小尺寸合理 |

---

## 六、依赖分析 (Cargo.toml)

| 依赖 | 状态 | 说明 |
|------|------|------|
| `reqwest` (rustls-tls) | ✅ | 减少系统依赖，提高可移植性 |
| `tokio` | ✅ | 仅启用需要的功能 |
| 缺少 `tauri-plugin-shell`/`tauri-plugin-fs` | 信息 | 使用自定义命令替代官方插件 |

---

## 七、最需要优先修复的问题

| 优先级 | 问题 | 文件 |
|--------|------|------|
| P0 | 文件系统沙箱化 | `app_fs.rs`, `commands/fs.rs` |
| P0 | 状态写入原子性 | `app_state.rs:177-185` |
| P1 | HTTP Client 复用 | `ai.rs:134-137` |
| P1 | CSP 生产环境移除 localhost | `tauri.conf.json:25` |
| P1 | 权限细粒度化 | `capabilities/default.json` |
| P2 | AI 请求体大小限制 | `ai.rs:178` |
| P2 | 日志持久化 | `main.rs:31-34` |
