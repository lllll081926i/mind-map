# Tauri 桌面端专项审查报告

## 1. Tauri 配置安全性分析

### 1.1 CSP 配置

**文件**: `src-tauri/tauri.conf.json:25`

**风险等级**: 🔴 高

**问题**: `connect-src` 包含 `http://localhost:*` 和 `ws://localhost:*`，生产构建中允许连接到任意本地端口。

**建议**: 使用条件化配置，release 构建中移除 localhost 规则。

### 1.2 Bundle 配置

**文件**: `src-tauri/tauri.conf.json:30`

**风险等级**: 🟡 中

**问题**: `"targets": "all"` 会尝试构建所有平台包。

**建议**: 明确指定需要的目标平台。

### 1.3 缺少安全加固配置

**文件**: `src-tauri/tauri.conf.json`

**风险等级**: 🟡 中

**问题**: 未配置 `freezePrototype`、`withGlobalTauri: false` 等。

**建议**: 添加安全配置。

---

## 2. Rust 代码质量分析

### 2.1 `app_state.rs` — `block_in_place` 滥用

**文件**: `src-tauri/src/services/app_state.rs:137-139`

**风险等级**: 🟡 中

**问题**: `block_in_place` 用于同步阻塞操作，但函数本身不是 async。

**建议**: 直接使用 `std::fs::create_dir_all` 或重构为纯 async。

### 2.2 `app_state.rs` — 错误处理过于粗糙

**文件**: `src-tauri/src/services/app_state.rs` 全文

**风险等级**: 🟡 中

**问题**: 所有错误统一使用 `String` 类型，丢失错误类型信息。

**建议**: 使用 `thiserror` crate 定义结构化错误类型。

### 2.3 `lib.rs` — 冗余文件

**文件**: `src-tauri/src/lib.rs`

```rust
pub fn desktop_runtime_ready() -> bool {
  true
}
```

**风险等级**: 🟢 低

**问题**: 始终返回 `true` 的占位符函数。

**建议**: 如果没有外部依赖，应移除。

---

## 3. 权限配置分析

**文件**: `src-tauri/capabilities/default.json:7-11`

**风险等级**: 🟡 中

**问题**:
- `core:default` 包含大量权限
- `dialog:default` 允许所有对话框操作
- `process:default` 包含进程重启和退出

**建议**: 使用细粒度权限：

```json
"permissions": [
  "core:default",
  "core:window:default",
  "dialog:allow-open",
  "dialog:allow-save",
  "updater:default"
]
```

---

## 4. 自定义 Tauri 命令安全性

### 4.1 `fs.rs` — 命令参数无验证

**文件**: `src-tauri/src/commands/fs.rs:4-15`

**风险等级**: 🟡 中

**问题**: 直接传递 `String` 类型的路径，无长度、编码等前置校验。

**建议**: 添加路径长度校验。

### 4.2 `config.rs` — `open_external_url`

**文件**: `src-tauri/src/commands/config.rs:79-114`

**风险等级**: 🟢 低

**评价**: URL 验证做得很好，使用 `Url::parse` 并限制协议。

### 4.3 `ai.rs` — AI 代理命令

**文件**: `src-tauri/src/commands/ai.rs`

**风险等级**: 🟢 低

**评价**: 有域名白名单、HTTPS 强制、方法限制、请求超时等安全措施。

---

## 5. 文件系统操作安全检查

### 5.1 路径安全检查

**文件**: `src-tauri/src/services/app_fs.rs:11-32`

**风险等级**: 🟢 良好

**评价**: 实现了空路径检测、null 字节注入防护、UNC 路径绕过防护、`..` 路径遍历防护、Windows 保留名称防护。

### 5.2 扩展名白名单

**文件**: `src-tauri/src/services/app_fs.rs:4`

**风险等级**: 🟡 中

**问题**:
- `.xmind` 文件本质上是 ZIP 格式
- 扩展名检查使用 `ends_with`

**建议**: 使用 `Path::extension()` 获取真实扩展名。

### 5.3 `write_text_file` 可创建任意目录

**文件**: `src-tauri/src/services/app_fs.rs:70-74`

**风险等级**: 🔴 高

**问题**: `create_dir_all` 可以在文件系统任意位置创建目录树。

**建议**: 添加沙箱目录限制。

### 5.4 `list_directory_entries` 可列出任意目录

**文件**: `src-tauri/src/services/app_fs.rs:80-121`

**风险等级**: 🔴 高

**问题**: 可以遍历系统任意目录。

---

## 6. 进程间通信（IPC）分析

### 6.1 AI 代理事件通信

**文件**: `src-tauri/src/services/ai.rs:187-237`

**风险等级**: 🟢 良好

**优点**: 使用 AbortHandle 实现请求取消，有请求注册表管理并发请求，超时限制。

**建议**: 事件名使用 Tauri 2 推荐的命名空间格式。

### 6.2 前端 IPC 模块加载

**文件**: `src/platform/desktop/index.js:172-198`

**风险等级**: 🟢 良好

**评价**: 使用懒加载和 Promise 缓存。

### 6.3 状态写入队列

**文件**: `src/platform/index.js:90-116`

**风险等级**: 🟢 良好

**评价**: 使用 Promise 队列序列化写入操作。

---

## 7. 更新机制配置

**文件**: `src-tauri/tauri.conf.json:55-62`

**风险等级**: 🟡 中

**问题**:
- `"dialog": false` 意味着更新提示完全由前端处理
- 更新端点依赖 GitHub 可用性

**建议**: 前端更新服务应有超时和重试机制。

---

## 8. 窗口配置分析

**文件**: `src-tauri/tauri.conf.json:13-22`

**风险等级**: 🟡 中

**问题**:
- 缺少 `visible` 控制
- 缺少 `center: true` 窗口居中
- 缺少 macOS 特定的 `titleBarStyle` 配置
- 没有配置窗口状态持久化

**建议**:

```json
"windows": [
  {
    "label": "main",
    "title": "Mind Map Desktop",
    "width": 1440,
    "height": 900,
    "minWidth": 1100,
    "minHeight": 720,
    "resizable": true,
    "center": true,
    "visible": false
  }
]
```

---

## 9. 跨平台兼容性

| 文件 | 状态 | 说明 |
|------|------|------|
| `config.rs` | ✅ | 正确使用 `#[cfg]` 条件编译 |
| `app_fs.rs` | ✅ | Windows 保留名称处理 |
| `main.rs` | ⚠️ | Linux deb 包 `depends` 为空数组 |
| `platform/desktop/index.js` | ✅ | 正确处理路径分隔符 |

---

## 10. 性能优化分析

| 文件 | 问题 | 建议 |
|------|------|------|
| `Cargo.toml` | 缺少 `lto`、`codegen-units` 等发布优化 | 添加 `[profile.release]` 配置 |
| `ai.rs:134-137` | 每次请求创建新 `reqwest::Client` | 作为 Tauri 状态管理复用 |
| `app_state.rs` | 每次读取都从磁盘读取 JSON，无内存缓存 | 使用 `tauri::State` 管理内存缓存 |
| `Cargo.toml:9-11` | `[lib]` 同时声明 `staticlib` 和 `cdylib` | 通常只需要 `cdylib` |

---

## 总结

| 风险等级 | 数量 | 关键项 |
|---------|------|--------|
| 🔴 高 | 3 | CSP localhost 通配符、任意目录写入、任意目录遍历 |
| 🟡 中 | 12 | 权限宽泛、扩展名检查、Client 复用、窗口配置等 |
| 🟢 低 | 5 | 错误类型、lib.rs 占位符、跨平台细节等 |

### 优先修复建议

1. **最高优先级**: 限制文件系统操作的沙箱范围
2. **高优先级**: 生产构建中移除 CSP 的 localhost 规则
3. **中优先级**: 细化权限配置，使用最小权限原则
4. **中优先级**: 复用 `reqwest::Client` 实例
5. **低优先级**: 完善窗口配置和发布优化
