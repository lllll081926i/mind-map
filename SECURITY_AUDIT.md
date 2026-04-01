# 思维导图项目安全审查报告

> 审查日期: 2026-04-01
> 审查范围: package.json, .env.library, src/, simple-mind-map/, public/, index.html, src-tauri/
> 应用类型: Tauri 2.x 桌面应用 (Vue 3 + Vite)

---

## 一、XSS 漏洞风险

### 1.1 `v-html` 使用汇总

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src/pages/Edit/components/AiChat.vue` | 33 | **中** | AI 回复内容通过 `v-html` 渲染。已使用 DOMPurify 做 sanitize，但 ALLOWED_ATTR 包含 `class`，攻击者可能通过 CSS 注入进行视觉欺骗（clickjacking 样式覆盖） |
| 2 | `src/pages/Edit/components/Outline.vue` | 31 | **低** | 节点 label 通过 `v-html` 渲染，但数据经过 `htmlEscape()` 转义后再替换 `\n` 为 `<br>`，风险可控 |
| 3 | `src/pages/Edit/components/OutlineEdit.vue` | 55 | **低** | 同上 |
| 4 | `src/pages/Edit/components/NodeIconSidebar.vue` | 36 | **低** | 渲染预设图标 SVG，数据来源为本地静态配置 |
| 5 | `src/pages/Edit/components/NodeIconToolbar.vue` | 15 | **低** | 同上 |
| 6 | `src/pages/Edit/components/FormularSidebar.vue` | 27 | **低** | 公式概览数据来自本地配置 |
| 7 | `src/pages/Edit/components/BaseStyle.vue` | 228 | **低** | 线型样式 SVG 来自本地配置 |
| 8 | `src/pages/Edit/components/Search.vue` | 75 | **低** | 搜索结果文本，数据来源为思维导图内部数据 |

**修复建议**:
- `AiChat.vue:33` — 从 `ALLOWED_ATTR` 中移除 `class`，或增加 `ALLOWED_ATTR: ['href', 'target', 'rel']` 白名单。考虑增加 `FORCE_ATTRIBUTE: { target: '_blank', rel: 'noopener noreferrer' }` 防止链接钓鱼。

### 1.2 `innerHTML` 使用

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src/utils/index.js` | 108, 116 | **高** | `printOutline()` 函数将 `el.outerHTML` 通过 `iframeDoc.write()` 写入 iframe。若 DOM 中包含用户注入的 `<script>` 标签（如通过 contenteditable 区域），可导致 XSS |
| 2 | `src/main.js` | 147 | **低** | 仅在 Vue 初始化失败时写入静态错误提示 HTML，无可控输入 |
| 3 | `simple-mind-map/src/utils/index.js` | 多处 | **低** | 均为内部 DOM 操作（测量文本尺寸、HTML 转换工具），不直接接受外部输入 |
| 4 | `simple-mind-map/src/core/render/node/nodeCreateContents.js` | 187, 200, 204 | **中** | 节点内容 HTML 构建。若节点文本包含未过滤的 HTML 标签，可能存在风险 |
| 5 | `simple-mind-map/src/plugins/RichText.js` | 291-299 | **中** | 富文本编辑器 innerHTML 设置，接受用户输入 |
| 6 | `simple-mind-map/src/plugins/outerFrame/outerFrameText.js` | 74, 126 | **低** | 外框文本编辑，数据来源为内部节点数据 |
| 7 | `simple-mind-map/src/plugins/associativeLine/associativeLineText.js` | 75, 127 | **低** | 关联线文本编辑，同上 |
| 8 | `simple-mind-map/src/plugins/Export.js` | 106 | **低** | 导出时注入样式，数据可控 |
| 9 | `simple-mind-map/src/plugins/Formula.js` | 100 | **低** | 注入 KaTeX 样式，数据可控 |
| 10 | `simple-mind-map/src/core/render/TextEdit.js` | 378-380 | **中** | 文本编辑时 innerHTML 设置 |

**修复建议**:
- `src/utils/index.js:116` — 在 `printOutline()` 中，对 `printContent` 使用 DOMPurify 过滤后再写入 iframe：
  ```js
  const safeContent = DOMPurify.sanitize(printContent, { ADD_TAGS: ['style'] })
  iframeDoc.write('<div>' + safeContent + '</div>')
  ```

### 1.3 `document.write` 使用

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src/utils/index.js` | 116, 119, 121 | **高** | `printOutline()` 中对 iframe 使用 `document.write`。虽然数据来源为当前页面 DOM，但若页面 DOM 已被污染，可导致 XSS |

---

## 二、敏感信息泄露

### 2.1 环境变量

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `.env.library` | 1 | **无** | 仅包含 `NODE_ENV=library`，无敏感信息 |

### 2.2 硬编码密钥

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src-tauri/tauri.conf.json` | 61 | **低** | 包含 Tauri updater 公钥 (`pubkey`)。这是**公钥**而非私钥，用于验证更新签名，可以公开 |

### 2.3 AI 配置

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src-tauri/src/services/ai.rs` | 160-171 | **低** | 允许前端传递 `authorization` 和 `x-api-key` 头到 AI 代理。Tauri 侧做了域名白名单过滤，但 API key 以明文存储在客户端本地配置中 |

**修复建议**:
- AI API Key 存储在客户端本地（`ai_config`），若攻击者获取本地文件系统访问权限可读取。建议使用 Tauri 的 secure storage 或系统 keychain 存储敏感凭据。

---

## 三、不安全的依赖版本

### 3.1 生产依赖

| 依赖 | 当前版本 | 风险等级 | 说明 |
|------|----------|----------|------|
| `@toast-ui/editor` | ^3.2.2 | **中** | 版本较旧，可能存在已知漏洞。建议升级到最新 3.x 或迁移到 4.x |
| `codemirror` | ^5.65.21 | **低** | CodeMirror 5 已进入维护模式，无重大安全问题但不再活跃开发 |
| `katex` | ^0.16.44 | **低** | 当前版本较新 |
| `element-plus` | ^2.13.6 | **低** | 当前版本较新 |
| `vue` | ^3.5.31 | **低** | 当前版本较新 |
| `axios` | ^1.14.0 | **低** | 当前版本较新 |
| `dompurify` | ^3.3.3 | **低** | 当前版本较新，且有 overrides 锁定 |

### 3.2 开发依赖

| 依赖 | 当前版本 | 风险等级 | 说明 |
|------|----------|----------|------|
| `express` | ^5.2.1 | **低** | 仅用于本地 AI 代理服务 (`npm run ai:serve`)，不暴露到外网 |
| `markdown-it` | ^14.1.1 | **低** | 当前版本较新 |

### 3.3 Rust 依赖

| 依赖 | 版本 | 风险等级 | 说明 |
|------|------|----------|------|
| `reqwest` | 0.12.24 | **低** | 当前版本较新 |
| `tokio` | 1.50.0 | **低** | 当前版本较新 |
| `tauri` | 2.10.3 | **低** | 当前版本较新 |

**修复建议**:
- 定期运行 `npm audit` 检查漏洞
- 考虑升级 `@toast-ui/editor` 到最新版本
- 添加 `npm audit --production` 到 CI 流程

---

## 四、CSP 和安全头配置

### 4.1 CSP 配置

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src-tauri/tauri.conf.json` | 25 | **中** | CSP 中 `style-src` 包含 `'unsafe-inline'`，允许内联样式。在 Tauri 桌面应用中风险较低，但降低了 CSP 防护效果 |
| 2 | `src-tauri/tauri.conf.json` | 25 | **低** | `connect-src` 允许 `http://localhost:*` 和 `ws://localhost:*`，范围较宽。如果本地有其他恶意服务监听端口，可能被利用 |
| 3 | `src-tauri/tauri.conf.json` | 25 | **低** | `img-src` 允许 `data:` 和 `blob:`，这是思维导图应用的合理需求，但可能被用于数据外泄 |

**修复建议**:
- 收紧 `connect-src` 的 localhost 端口范围，如 `http://localhost:5173 http://localhost:3000 ws://localhost:5173`
- 考虑在生产构建中移除 `'unsafe-inline'`，使用 nonce 或 hash 方式

### 4.2 其他安全头

| # | 文件 | 风险等级 | 说明 |
|---|------|----------|------|
| 1 | `index.html` | **低** | 缺少 `X-Content-Type-Options`、`X-Frame-Options` 等安全头。由于是 Tauri 桌面应用，这些由 Tauri 框架处理 |

---

## 五、输入验证和输出编码

### 5.1 文件导入

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src/pages/Edit/components/Import.vue` | 77-78 | **低** | 有文件大小限制 (25MB) 和扩展名白名单，实现良好 |
| 2 | `src/pages/Edit/components/Import.vue` | 156-173 | **低** | `resolveSafeImportURL()` 对远程文件 URL 做了协议、origin、扩展名校验，实现良好 |
| 3 | `src/pages/Edit/components/Import.vue` | 269 | **中** | `JSON.parse(evt.target.result)` 解析 .smm 文件，若文件内容包含恶意数据（如 prototype 污染 payload），可能影响应用状态 |

### 5.2 剪贴板处理

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src/utils/handleClipboardText.js` | 9, 82 | **中** | 对剪贴板文本做 `JSON.parse`，若解析失败则静默忽略。但未对解析后的数据做任何验证或清理 |
| 2 | `src/pages/Edit/components/Outline.vue` | 240-242 | **低** | `onPaste` 调用 `handleInputPasteText(e)` 拦截粘贴，阻止富文本粘贴 |
| 3 | `src/pages/Edit/components/OutlineEdit.vue` | 238-240 | **低** | 同上 |

### 5.3 富文本 sanitize

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src/utils/index.js` | 43-63 | **低** | `sanitizeRichTextFragment()` 使用 DOMPurify 过滤，白名单策略合理。但 `ALLOWED_ATTR` 包含 `style`，攻击者可通过 CSS 注入进行视觉欺骗 |
| 2 | `src/pages/Edit/components/AiChat.vue` | 77-112 | **低** | `sanitizeHtml()` 使用 DOMPurify，配置合理。URI 白名单正则覆盖了常见协议 |

**修复建议**:
- `src/utils/index.js:43` — 从 `ALLOWED_ATTR` 中移除 `style`，或限制 style 属性值
- `src/pages/Edit/components/Import.vue:269` — 在 `JSON.parse` 后对数据进行深度验证，检查是否存在 `__proto__`、`constructor` 等危险键

---

## 六、原型链污染

### 6.1 JSON 解析

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src/pages/Edit/components/Import.vue` | 269 | **中** | `JSON.parse(evt.target.result)` 解析用户提供的 .smm 文件。若文件包含 `{"__proto__":{"polluted":true}}` 等 payload，可能污染 Object.prototype |
| 2 | `src/utils/handleClipboardText.js` | 9, 82 | **中** | 对剪贴板内容做 `JSON.parse` |
| 3 | `simple-mind-map/src/utils/index.js` | 多处 | **低** | 使用 `JSON.parse(JSON.stringify())` 做深拷贝，不会导致原型链污染 |

### 6.2 对象合并

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src/api/index.js` | 29-31 | **低** | 使用 spread operator `{...originData, ...data}` 合并数据。若 data 包含 `__proto__`，spread operator 不会触发原型链污染（与 Object.assign 不同） |

**修复建议**:
- 在 `Import.vue` 的 `JSON.parse` 后，对数据进行原型链安全检查：
  ```js
  const isSafe = obj => {
    if (obj === null || typeof obj !== 'object') return true
    if (obj.__proto__ !== Object.prototype && obj.__proto__ !== null) return false
    if (obj.constructor && obj.constructor !== Object && !Array.isArray(obj)) return false
    return Object.values(obj).every(isSafe)
  }
  ```
- 或使用 `JSON.parse` 的 reviver 参数过滤危险键

---

## 七、危险 API 使用

### 7.1 `eval` / `Function`

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `dist/assets/Index-BDm19qlY.js` | 多处 | **信息** | 构建产物中包含 `eval` 和 `Function`，均来自第三方库（lodash template、ProseMirror 等），非项目代码直接使用 |

**结论**: 项目源代码中**未发现**直接使用 `eval()` 或 `new Function()`。

### 7.2 `setTimeout` / `setInterval` 字符串参数

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `dist/assets/` 构建产物 | 多处 | **信息** | 均来自第三方库的压缩代码，非项目代码直接使用 |

**结论**: 项目源代码中**未发现**使用字符串形式的 `setTimeout`/`setInterval`。

### 7.3 `window.open`

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src/platform/desktop/index.js` | 130 | **低** | `window.open(payload.url, '_blank', 'noopener,noreferrer')` — 正确使用了 `noopener,noreferrer` 防止 reverse tabnabbing |

---

## 八、文件上传/下载安全风险

### 8.1 文件下载

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src/platform/desktop/index.js` | 79-90 | **低** | `downloadBrowserFile()` 使用 `Blob` + `URL.createObjectURL` + `<a download>` 实现下载。文件名来自用户输入，但未做路径穿越检查 |
| 2 | `simple-mind-map/src/utils/index.js` | 273-276 | **低** | `downloadFile()` 使用 `<a download>` 实现，同上 |
| 3 | `src/utils/index.js` | 32-41 | **低** | `fileToBuffer()` 使用 FileReader 读取文件为 ArrayBuffer，无安全风险 |

### 8.2 文件上传

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src/components/ImgUpload/index.vue` | 67-68 | **低** | 图片上传使用 FileReader.readAsDataURL，仅在前端处理，不发送到服务器 |
| 2 | `src/pages/Edit/components/Import.vue` | 265-266 | **低** | 导入文件使用 FileReader.readAsText，仅在前端解析 |

### 8.3 Tauri 文件系统操作

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src-tauri/src/services/app_fs.rs` | 11-32 | **低** | `is_path_safe()` 检查了 `..` 路径穿越、Windows 保留名、空字节等，实现良好 |
| 2 | `src-tauri/src/services/app_fs.rs` | 34-37 | **低** | `has_allowed_extension()` 仅允许 `.smm`, `.xmind`, `.md`, `.json` |
| 3 | `src-tauri/src/services/app_fs.rs` | 51-61 | **低** | `read_text_file()` 同时检查扩展名和路径安全 |
| 4 | `src-tauri/src/services/app_fs.rs` | 63-78 | **低** | `write_text_file()` 同上，且自动创建父目录 |
| 5 | `src-tauri/src/services/app_fs.rs` | 80-121 | **中** | `list_directory_entries()` 允许列出任意目录（仅检查路径安全），可能导致信息泄露。攻击者可通过传入系统目录路径（如 `C:\Windows`）浏览文件系统 |

**修复建议**:
- `app_fs.rs:80` — 限制 `list_directory_entries` 只能访问用户指定的安全目录（如文档目录），或维护一个允许访问的目录白名单

---

## 九、Tauri 安全配置

### 9.1 权限配置

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src-tauri/capabilities/default.json` | 7-11 | **低** | 权限配置简洁，仅包含 `core:default`, `dialog:default`, `process:default`, `updater:default`。未使用 `fs:default` 等宽泛权限，自定义 Tauri command 替代了 Tauri fs API，实现良好 |
| 2 | `src-tauri/tauri.conf.json` | 24-26 | **低** | CSP 配置合理，`frame-src 'none'` 和 `object-src 'none'` 正确禁用了 iframe 和 object |

### 9.2 更新机制

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src-tauri/tauri.conf.json` | 55-62 | **低** | 使用 Tauri updater，配置了公钥验证和 GitHub releases 端点。`dialog: false` 表示静默更新 |

### 9.3 AI 代理服务

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src-tauri/src/services/ai.rs` | 9-20 | **低** | 域名白名单机制限制了可请求的 AI API 域名 |
| 2 | `src-tauri/src/services/ai.rs` | 149-151 | **低** | 强制要求 HTTPS 协议 |
| 3 | `src-tauri/src/services/ai.rs` | 160-171 | **中** | 允许传递的 header 白名单包含 `authorization`、`x-api-key` 等敏感头。虽然限制了域名，但若白名单中某个域名被劫持或存在漏洞，API key 可能泄露 |
| 4 | `src-tauri/src/services/ai.rs` | 178 | **中** | `request.data` 作为 JSON body 直接发送到外部 API，未做大小限制。恶意前端可构造超大 payload 导致资源耗尽 |

**修复建议**:
- `ai.rs:178` — 对 `request.data` 增加大小限制（如 1MB）
- `ai.rs:160-171` — 考虑记录所有代理请求的审计日志

### 9.4 外部 URL 打开

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src-tauri/src/commands/config.rs` | 80-115 | **低** | `open_external_url()` 使用 `Url::parse()` 验证 URL，仅允许 http/https 协议，然后使用系统默认浏览器打开。实现安全 |

---

## 十、其他发现

### 10.1 ESLint 配置

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `eslint.config.js` | 61 | **中** | `'vue/no-v-html': 'off'` — 禁用了 `v-html` 的 lint 规则。建议改为 `'warn'` 以提醒开发者注意风险 |

### 10.2 全局变量暴露

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `index.html` | 13-14 | **低** | `window.externalPublicPath` 和 `window.takeOverApp` 暴露为全局变量。`window.initApp` 和 `window.takeOverAppMethods` 在运行时挂载到 window 对象 |
| 2 | `src/main.js` | 76-78 | **低** | `globalThis.Buffer` 被 polyfill。在 Tauri 环境中通常不需要 |

### 10.3 错误信息泄露

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src-tauri/src/services/ai.rs` | 186 | **低** | 错误响应中将完整的错误消息返回给前端，可能包含敏感信息 |
| 2 | 多个文件 | 多处 | **低** | `console.error` 打印了详细的错误堆栈，在生产构建中应移除或重定向 |

### 10.4 竞态条件

| # | 文件 | 行号 | 风险等级 | 说明 |
|---|------|------|----------|------|
| 1 | `src-tauri/src/services/ai.rs` | 114 | **低** | `start_proxy_request` 在开始新请求前调用 `stop_proxy_request`，但两者之间存在微小的竞态窗口 |

---

## 十一、风险汇总

| 风险等级 | 数量 | 关键项 |
|----------|------|--------|
| **高** | 1 | `printOutline()` 中 `document.write` 未 sanitize |
| **中** | 8 | AI Chat v-html 的 class 属性、JSON.parse 原型链污染、`list_directory_entries` 目录遍历、AI 代理请求体无大小限制等 |
| **低** | 20+ | CSP `'unsafe-inline'`、localhost 端口范围过宽、依赖版本等 |
| **信息** | 3 | 构建产物中的 eval/Function（来自第三方库） |

---

## 十二、修复优先级建议

### P0 — 立即修复

1. **`src/utils/index.js:116`** — `printOutline()` 中对写入 iframe 的内容做 DOMPurify sanitize
2. **`src/pages/Edit/components/Import.vue:269`** — JSON.parse 后做原型链污染检查

### P1 — 尽快修复

3. **`src/pages/Edit/components/AiChat.vue:109`** — 从 DOMPurify ALLOWED_ATTR 中移除 `class`
4. **`src/utils/index.js:56`** — 从 `sanitizeRichTextFragment` 的 ALLOWED_ATTR 中移除 `style`
5. **`src-tauri/src/services/app_fs.rs:80`** — 限制 `list_directory_entries` 的目录范围
6. **`src-tauri/src/services/ai.rs:178`** — 对 AI 请求体增加大小限制
7. **`eslint.config.js:61`** — 将 `vue/no-v-html` 改为 `'warn'`

### P2 — 计划修复

8. 收紧 CSP `connect-src` 的 localhost 端口范围
9. 升级 `@toast-ui/editor` 到最新版本
10. 定期运行 `npm audit` 并集成到 CI
11. 使用系统 keychain 存储 AI API Key
12. 移除生产代码中的 `console.error` 或重定向到日志系统

---

## 十三、总体评价

该项目的安全实践**整体良好**，主要体现在：

- Tauri 文件系统操作实现了路径安全检查（`is_path_safe`）和扩展名白名单
- AI 代理服务实现了域名白名单和 HTTPS 强制
- 使用了 DOMPurify 对富文本内容进行 sanitize
- 文件导入有大小限制和扩展名校验
- URL 打开做了协议验证
- CSP 配置合理，禁用了 frame 和 object

主要改进空间在于：
1. 部分 `innerHTML`/`document.write` 使用点缺少 sanitize
2. JSON 解析未做原型链污染防护
3. AI 代理请求体无大小限制
4. 目录浏览权限范围过宽
