# 安全审查报告

## 概览

| 维度 | 风险等级 | 发现数 |
|------|----------|--------|
| XSS 漏洞风险 | **高** | 8 |
| 敏感信息泄露 | **低** | 2 |
| 不安全依赖版本 | **中** | 3 |
| CSP 和安全头配置 | **低** | 2 |
| 输入验证和输出编码 | **中** | 4 |
| 原型链污染 | **低** | 1 |
| 危险 API 使用 | **中** | 5 |
| 文件上传/下载安全 | **低** | 2 |
| Tauri 安全配置 | **低** | 2 |

---

## 1. XSS 漏洞风险

### 1.1 `v-html` 使用汇总

| 文件 | 行号 | 风险 | 现状 |
|------|------|------|------|
| `AiChat.vue` | 33 | 低 | 使用 `DOMPurify.sanitize()`，当前安全 |
| `Outline.vue` | 31 | 中 | 仅 `htmlEscape()` 转义，建议加 DOMPurify |
| `OutlineEdit.vue` | 55 | 中 | 同上 |
| `Search.vue` | 75 | 低 | `escapeHtml()` + `highlightText()`，当前安全 |
| `FormulaSidebar.vue` | 27 | 低 | KaTeX 渲染输出（可信来源） |
| `NodeIconSidebar.vue` | 36 | 低 | 内部配置数据 |
| `BaseStyle.vue` | 228 | 低 | 内部 SVG 配置 |

### 1.2 `innerHTML` 直接赋值

| 文件 | 行号 | 风险 | 说明 |
|------|------|------|------|
| `Outline.vue` | 199, 209 | 中 | 从 `contenteditable` 读取 `innerHTML` 直接存储 |
| `OutlineEdit.vue` | 162, 166, 168 | 中 | 同上 |
| `Count.vue` | 54 | 低 | `countEl.innerHTML = this.textStr` |
| `main.js` | 139 | 低 | 仅初始化失败时显示 i18n 字符串 |
| `utils/index.js` | 82, 90 | 低 | `printOutline` 打印功能 |

**建议**: `Outline.vue:209` 和 `OutlineEdit.vue:166` 从 `contenteditable` 获取的 `innerHTML` 在存储前应通过 `DOMPurify.sanitize()` 净化

---

## 2. 敏感信息泄露

| 文件 | 行号 | 风险 | 说明 |
|------|------|------|------|
| `src-tauri/tauri.conf.json` | 61 | 低 | Tauri 更新公钥硬编码（标准做法） |
| `src-tauri/tauri.conf.json` | 59 | 低 | GitHub 仓库 URL 暴露用户名和仓库名 |

---

## 3. 不安全依赖版本

| 依赖 | 当前版本 | 风险 | 说明 |
|------|----------|------|------|
| `express` | ^5.2.1 | 中 | 仅 `scripts/ai.js` 使用，devDependency |
| `@toast-ui/editor` | ^3.2.2 | 低 | 版本较旧，需关注安全更新 |
| `codemirror` | ^5.65.21 | 低 | v5 已停止主要更新，建议迁移到 v6 |

---

## 4. CSP 配置

**文件**: `src-tauri/tauri.conf.json:25`

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:; font-src 'self' data:;
connect-src 'self' http://localhost:* ws://localhost:* https://github.com ...;
frame-src 'none'; object-src 'none'
```

**优点**:
- `script-src 'self'` 严格限制脚本来源
- `frame-src 'none'` 和 `object-src 'none'` 阻止嵌入和插件

**问题**:
- `style-src 'unsafe-inline'` 允许内联样式（Vue 框架需要）
- `img-src https:` 允许从任意 HTTPS 源加载图片
- `connect-src http://localhost:*` 允许连接任意 localhost 端口

**建议**:
- 限制 `img-src` 为具体可信域名
- 生产环境移除 localhost 通配符

---

## 5. 输入验证

### 5.1 文件导入

| 文件 | 行号 | 状态 |
|------|------|------|
| `Import.vue` | 77-78 | ✅ 定义了 `MAX_IMPORT_FILE_SIZE` (25MB) |
| `Import.vue` | 156-172 | ✅ `resolveSafeImportURL` 验证协议和 origin |

### 5.2 AI 代理

| 文件 | 行号 | 状态 |
|------|------|------|
| `ai.rs` | 9-20 | ✅ `ALLOWED_AI_DOMAINS` 白名单 |
| `ai.rs` | 149-158 | ✅ 强制 HTTPS |
| `ai.rs` | 160-171 | ✅ 请求头白名单过滤 |

---

## 6. 危险 API 使用

| API | 文件 | 行号 | 风险 | 说明 |
|-----|------|------|------|------|
| `document.write` | `utils/index.js` | 90 | 低 | 打印功能，可信来源 |
| `innerHTML` | 多处 | - | 中 | 见 1.2 节 |
| `eval`/`Function` | 源码 | - | 无 | 源码中未直接使用 |

---

## 7. 文件上传/下载安全

### 7.1 Tauri 文件系统

| 文件 | 行号 | 状态 |
|------|------|------|
| `app_fs.rs` | 6-17 | ✅ `is_path_safe` 检查路径穿越 |
| `app_fs.rs` | 19-21 | ✅ `has_allowed_extension` 限制扩展名 |
| `app_fs.rs` | 64-101 | ⚠️ `list_directory_entries` 无路径穿越保护 |

**潜在问题**: `is_path_safe` 使用字符串匹配而非规范化路径，可能存在绕过

---

## 8. Tauri 安全配置

| 文件 | 状态 | 说明 |
|------|------|------|
| `capabilities/default.json` | ✅ | 仅授予 `core:default`, `dialog:default`, `process:default`, `updater:default` |
| `commands/fs.rs` | ✅ | 扩展名和路径安全检查 |
| `commands/config.rs` | ⚠️ | `open_external_url` 使用 Windows `start` 命令 |

---

## 9. 修复优先级

| 优先级 | 问题 | 文件 |
|--------|------|------|
| P0 | `contenteditable` 读取 `innerHTML` 未净化 | `Outline.vue:209`, `OutlineEdit.vue:166` |
| P1 | Express 依赖升级 | `package.json` |
| P1 | CSP 收紧 `img-src` 和 `connect-src` | `tauri.conf.json:25` |
| P2 | `open_external_url` 命令注入防护 | `commands/config.rs:76-78` |
| P2 | `is_path_safe` 使用规范化路径 | `app_fs.rs` |
