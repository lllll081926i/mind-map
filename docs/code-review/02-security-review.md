# 安全审查报告

## 概览

| 维度 | 风险等级 | 发现数 |
|------|----------|--------|
| XSS 漏洞风险 | **高** | 1 |
| 敏感信息泄露 | **低** | 2 |
| 不安全依赖版本 | **中** | 3 |
| CSP 和安全头配置 | **高** | 1 |
| 输入验证和输出编码 | **中** | 4 |
| 原型链污染 | **中** | 1 |
| 危险 API 使用 | **高** | 1 |
| 文件上传/下载安全 | **高** | 2 |
| Tauri 安全配置 | **中** | 3 |

---

## 1. XSS 漏洞风险

### 1.1 `printOutline()` 中 `document.write` 未 sanitize

**文件**: `src/utils/index.js`
**风险等级**: 🔴 高

**问题**: `printOutline()` 函数使用 `document.write` 将内容写入 iframe，未对内容进行 sanitize 处理。

**建议**: 对写入 iframe 的内容进行 sanitize 处理。

### 1.2 AI Chat `v-html` 允许 `class` 属性

**文件**: `src/pages/Edit/components/AiChat.vue`
**风险等级**: 🟡 中

**问题**: 虽然有 DOMPurify 过滤，但允许 `class` 属性可能导致 CSS 注入。

**建议**: 审查 DOMPurify 配置，确保只允许必要属性。

---

## 2. 敏感信息泄露

| 文件 | 风险 | 说明 |
|------|------|------|
| `src-tauri/tauri.conf.json` | 低 | Tauri 更新公钥硬编码（标准做法） |
| `src-tauri/tauri.conf.json` | 低 | GitHub 仓库 URL 暴露用户名和仓库名 |

---

## 3. 不安全依赖版本

| 依赖 | 当前版本 | 风险 | 说明 |
|------|----------|------|------|
| `typescript` | ^6.0.2 | 中 | TS 6.x 为极新版本，生态兼容性风险高 |
| `vite` | ^8.0.3 | 中 | Vite 8 为极新版本，插件生态可能未完全适配 |
| `eslint` | ^10.1.0 | 中 | ESLint 10.x 为极新版本，插件兼容性需确认 |

---

## 4. CSP 配置

**文件**: `src-tauri/tauri.conf.json:25`

```
connect-src 'self' http://localhost:* ws://localhost:* https://github.com ...
```

**问题**: `connect-src` 包含 `http://localhost:*` 和 `ws://localhost:*`，生产构建中允许连接到任意本地端口。

**风险等级**: 🔴 高

**建议**: 生产构建中移除 localhost 通配符，使用条件化配置。

---

## 5. 输入验证

### 5.1 JSON.parse 原型链污染风险

**风险等级**: 🟡 中

**问题**: 多处使用 `JSON.parse` 解析外部数据，未进行原型链污染防护。

**建议**: 使用安全的 JSON解析库或在解析后验证对象原型。

### 5.2 文件导入验证

| 文件 | 状态 |
|------|------|
| `Import.vue` | ✅ 定义了 `MAX_IMPORT_FILE_SIZE` (25MB) |
| `Import.vue` | ✅ `resolveSafeImportURL` 验证协议和 origin |

### 5.3 AI 代理

| 文件 | 状态 |
|------|------|
| `ai.rs` | ✅ `ALLOWED_AI_DOMAINS` 白名单 |
| `ai.rs` | ✅ 强制 HTTPS |
| `ai.rs` | ✅ 请求头白名单过滤 |

---

## 6. 危险 API 使用

| API | 文件 | 风险 | 说明 |
|-----|------|------|------|
| `document.write` | `utils/index.js` | 高 | `printOutline` 未 sanitize 内容 |

---

## 7. 文件上传/下载安全

### 7.1 目录遍历风险

**文件**: `src-tauri/src/services/app_fs.rs`
**风险等级**: 🔴 高

**问题**: `write_text_file` 可创建任意目录，`list_directory_entries` 可列出系统任意目录。虽然路径安全检查阻止了 `..` 遍历，但 `create_dir_all` 可以在文件系统任意位置创建目录树。

**建议**: 添加沙箱目录限制，只允许在用户通过 dialog 选择的目录或应用数据目录中操作。

### 7.2 扩展名检查可被绕过

**文件**: `src-tauri/src/services/app_fs.rs`
**风险等级**: 🟡 中

**问题**: 扩展名检查使用 `ends_with`，可能被双重扩展名绕过。`.xmind` 文件本质上是 ZIP 格式，`read_to_string` 会返回乱码。

**建议**: 使用 `Path::extension()` 获取真实扩展名。

---

## 8. Tauri 安全配置

| 文件 | 风险 | 问题 | 建议 |
|------|------|------|------|
| `capabilities/default.json` | 中 | `core:default`、`dialog:default`、`process:default` 权限过大 | 使用细粒度权限 |
| `tauri.conf.json` | 中 | 缺少 `freezePrototype`、`withGlobalTauri: false` 等安全加固配置 | 添加安全配置 |
| `commands/fs.rs` | 中 | 命令参数无长度、编码等前置校验 | 添加防御性校验 |

---

## 9. 修复优先级

| 优先级 | 问题 | 文件 |
|--------|------|------|
| P0 | `printOutline()` 中 `document.write` 未 sanitize | `utils/index.js` |
| P0 | CSP `connect-src` localhost 通配符 | `tauri.conf.json:25` |
| P0 | 文件系统无沙箱限制 | `app_fs.rs` |
| P1 | JSON.parse 原型链污染防护 | 多处 |
| P1 | 扩展名检查使用 `Path::extension()` | `app_fs.rs` |
| P2 | 权限细粒度化 | `capabilities/default.json` |
| P2 | AI Chat DOMPurify 配置审查 | `AiChat.vue` |
