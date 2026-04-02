# Security Audit Report — Mind Map Desktop Application

**Date:** 2026-04-02
**Scope:** Vue 3 + Tauri 2 desktop mind map application
**Auditor:** Automated security review

---

## Executive Summary

The application demonstrates several good security practices: path traversal guards in Rust, DOMPurify sanitization for most HTML injection points, a strict CSP, HTTPS enforcement for AI proxy, and a domain allowlist for AI requests. However, there are **3 high-severity** and **7 medium-severity** findings that require attention before production release.

---

## Findings

### FINDING 1 — HIGH: AI proxy allows arbitrary request body to any whitelisted domain

**Severity:** HIGH
**File:** `src-tauri/src/services/ai.rs:129-179`
**Description:** The `start_ai_proxy_request` function accepts an arbitrary `serde_json::Value` as `request.data` and forwards it verbatim to the remote AI API. While the domain is restricted to `ALLOWED_AI_DOMAINS`, an attacker who compromises the frontend (or a malicious browser extension) could send arbitrary JSON payloads to any whitelisted AI endpoint, including prompt injection, data exfiltration via API keys, or abuse of the victim's API credits. The `headers` field is also partially filtered but allows `Authorization` and `x-api-key` to pass through, meaning the frontend can supply arbitrary credentials.
**Recommended fix:**
- Validate/whitelist the shape of `request.data` against a strict schema (e.g., only `model`, `messages`, `stream`, `temperature` fields).
- Strip all user-supplied headers and inject only the API key stored server-side (in Tauri app config, not from the frontend).
- Add rate limiting per request ID.

---

### FINDING 2 — HIGH: `v-html` rendering of AI chat content with broad HTML allowlist

**Severity:** HIGH
**File:** `src/pages/Edit/components/AiChat.vue:33`
**Description:** AI-generated Markdown is rendered via `v-html` after passing through DOMPurify. The allowlist is very broad: it includes `<a>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<span>`, `<div>`, `<pre>`, `<code>`, `<blockquote>`, and heading tags. While DOMPurify is used, the `ALLOWED_URI_REGEXP` at line 110 (`/^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i`) is overly permissive — it allows URIs starting with any non-lowercase character, which could be exploited via protocol-relative or unusual URI schemes.
**Recommended fix:**
- Tighten `ALLOWED_URI_REGEXP` to only allow `^https?:` and `^mailto:`.
- Remove `ALLOWED_ATTR: ['href', 'target', 'rel', 'class']` and restrict `href` to HTTPS only.
- Add `ADD_ATTR: []` explicitly and remove `class` from allowed attributes to prevent CSS-based attacks.
- Consider using a dedicated Markdown renderer with built-in sanitization instead of two-pass render+sanitize.

---

### FINDING 3 — HIGH: `v-html` on formula overview without sanitization

**Severity:** HIGH
**File:** `src/pages/Edit/components/FormulaSidebar.vue:27`
**Description:** Formula overview items are rendered with `v-html="item.overview"` without any sanitization. While the data currently comes from a local config file (`@/config/constant`), if this config is ever extended to support user-defined or remotely-loaded formulas, it becomes a direct XSS vector.
**Recommended fix:**
- Wrap `item.overview` through DOMPurify before rendering, even for trusted data (defense in depth).
- If the overview is purely LaTeX/KaTeX output, render it through KaTeX's renderer instead of raw HTML.

---

### FINDING 4 — MEDIUM: `v-html` on search results — properly escaped but pattern is fragile

**Severity:** MEDIUM
**File:** `src/pages/Edit/components/Search.vue:75`
**Description:** Search result items use `v-html="item.text"`. The `highlightText()` method at line 178 does properly escape HTML entities before wrapping matches in `<span>` tags. This is currently safe. However, the safety depends entirely on the `escapeHtml()` method being called on every code path. If a future contributor modifies the highlighting logic, XSS could be introduced.
**Recommended fix:**
- Add a comment documenting the security requirement.
- Consider using a computed property that always returns sanitized output.
- Add a unit test that verifies XSS payloads in search text are properly escaped.

---

### FINDING 5 — MEDIUM: `v-html` on outline tree node labels

**Severity:** MEDIUM
**File:** `src/pages/Edit/components/Outline.vue:31` and `src/pages/Edit/components/OutlineEdit.vue:55`
**Description:** Both outline components render `v-html="node.label"`. The label data is processed through `htmlEscape()` (line 160 in Outline.vue, line 130 in OutlineEdit.vue) before being assigned, which converts `<`, `>`, `&`, `"`, `'` to entities. This is safe for the current data flow. However, the `onBlur` handler at `Outline.vue:216` and `OutlineEdit.vue:163` reads `e.target.innerHTML` and passes it through `sanitizeRichTextFragment()` before saving — this means user-edited rich text with `<br>` tags flows back into the data model. If the sanitization configuration ever changes to allow more tags, stored XSS could propagate.
**Recommended fix:**
- Document the security invariant that `htmlEscape()` must always be applied before rendering.
- Consider using `textContent` instead of `innerHTML` for the blur handler to avoid any HTML injection through contenteditable.
- Add integration tests for outline XSS scenarios.

---

### FINDING 6 — MEDIUM: `v-html` on line style SVG previews

**Severity:** MEDIUM
**File:** `src/pages/Edit/components/BaseStyle.vue:228`
**Description:** Line style option previews are rendered with `v-html="lineStyleMap[item.value]"`. The `lineStyleMap` values come from a local constant file. While currently trusted data, this pattern violates defense-in-depth principles.
**Recommended fix:**
- Sanitize through DOMPurify before rendering.
- Or render SVG previews as `<img src="data:image/svg+xml,...">` with proper encoding.

---

### FINDING 7 — MEDIUM: `v-html` on icon sidebar content

**Severity:** MEDIUM
**File:** `src/pages/Edit/components/NodeIconSidebar.vue:36` and `src/pages/Edit/components/NodeIconToolbar.vue:15`
**Description:** Icon content is rendered via `v-html="getHtml(icon.icon)"`. The `getHtml()` method at line 170 returns either raw SVG strings or `<img>` tags. Since icon data comes from bundled config files, this is currently safe. However, if custom icon packs are ever loaded from external sources, this becomes an XSS vector.
**Recommended fix:**
- Sanitize icon HTML through DOMPurify before rendering.
- If external icon packs are planned, validate SVG content against a strict schema (no `<script>`, no `on*` event handlers, no `<foreignObject>`).

---

### FINDING 8 — MEDIUM: Browser AI transport uses HTTP (not HTTPS) for localhost

**Severity:** MEDIUM
**File:** `src/utils/ai.js:29`
**Description:** The `BrowserAiTransport` class sends AI requests to `http://localhost:${this.options.port}/ai/chat` over unencrypted HTTP. While this is a localhost connection (not traversing the network), it could be vulnerable to local network attacks or MITM if the port is accessible from other machines on the same network.
**Recommended fix:**
- Document that this is a local-only development mode.
- Consider binding the local server to `127.0.0.1` only, not `0.0.0.0`.
- Add a warning in the UI when using the browser AI transport.

---

### FINDING 9 — MEDIUM: Error messages from external APIs leak to frontend

**Severity:** MEDIUM
**File:** `src-tauri/src/services/ai.rs:55-80`, `src/utils/ai.js:38-52`
**Description:** Error responses from AI API endpoints are extracted and forwarded to the frontend verbatim. The `extract_error_message()` function in Rust parses `msg`, `message`, or `error.message` fields, falling back to the raw response body. This could leak internal server details, stack traces, or sensitive configuration from the AI provider.
**Recommended fix:**
- In production, map external error codes to generic user-facing messages.
- Log the full external error server-side (Tauri app log) but only show a sanitized message to the user.
- Strip any HTML or script tags from error messages before forwarding.

---

### FINDING 10 — MEDIUM: File system path traversal — `list_directory_entries` lacks extension check on directory path

**Severity:** MEDIUM
**File:** `src-tauri/src/services/app_fs.rs:86-129`
**Description:** The `list_directory_entries` function checks `is_path_safe()` (which blocks `..` traversal) but does not validate that the directory path itself has any particular prefix or sandbox. A malicious frontend could potentially call `list_directory_entries` on any path the user has read access to (e.g., `C:\Windows\`, `/etc/`). While the `..` component is blocked, absolute paths to sensitive directories are not restricted.
**Recommended fix:**
- Add a sandbox allowlist or require that directory paths originate from user-initiated dialog selections (which Tauri's dialog plugin already does for the initial pick).
- Consider tracking the "blessed" directory roots and restricting `list_directory_entries` to subdirectories of those roots.

---

### FINDING 11 — LOW: `open_external_url` uses `rundll32` on Windows

**Severity:** LOW
**File:** `src-tauri/src/commands/config.rs:86-93`
**Description:** On Windows, external URLs are opened via `rundll32.exe url.dll,FileProtocolHandler`. While the URL is validated through `reqwest::Url::parse` and restricted to `http`/`https` schemes, using `rundll32` is a deprecated approach that could have unexpected behavior on some Windows configurations.
**Recommended fix:**
- Use Tauri's built-in `tauri::api::shell::open()` or the `opener` crate instead of manually spawning `rundll32`.
- This is already handled more safely on macOS (`open`) and Linux (`xdg-open`).

---

### FINDING 12 — LOW: Print iframe uses `insertAdjacentHTML` with page `<style>` outerHTML

**Severity:** LOW
**File:** `src/utils/index.js:144`
**Description:** The `printOutline` function creates an iframe and injects the page's `<style>` elements via `insertAdjacentHTML('beforeend', el.outerHTML)`. While the content is sanitized by DOMPurify at line 130, the style elements themselves are from the current page's DOM. If a stored XSS payload exists in a `<style>` tag (e.g., via CSS injection), it could execute in the iframe context.
**Recommended fix:**
- Use `textContent` to inject style content instead of `outerHTML`.
- Add `sandbox` attribute to the iframe to restrict script execution.

---

### FINDING 13 — LOW: Error information leakage in production error handler

**Severity:** LOW
**File:** `src/main.js:120-126`
**Description:** The Vue error handler logs the full error object, component info, and lifecycle info to the console. In a production build, this could expose internal component names and error details to anyone with DevTools open.
**Recommended fix:**
- In production, log only a generic error identifier to the console.
- Send structured error reports to a telemetry endpoint (if one exists) instead of logging to console.

---

### FINDING 14 — LOW: `parseExternalJsonSafely` does not handle non-object JSON roots

**Severity:** LOW
**File:** `src/utils/index.js:83-85`
**Description:** `parseExternalJsonSafely` calls `JSON.parse(input)` and then `sanitizeExternalJsonValue()` on the result. The sanitizer only processes objects and arrays — primitive JSON values (strings, numbers, booleans, null) pass through unchanged. This is not a vulnerability per se, but if any code path expects sanitized output for primitives, it could lead to unexpected behavior.
**Recommended fix:**
- Document that primitive JSON values are returned as-is.
- Consider rejecting non-object/array roots at the call sites that expect objects.

---

### FINDING 15 — INFORMATIONAL: CSP is well-configured but allows `http://localhost:*`

**Severity:** INFORMATIONAL
**File:** `src-tauri/tauri.conf.json:25`
**Description:** The Content Security Policy includes `connect-src 'self' http://localhost:* ws://localhost:* ...`. This is necessary for development but should be removed or restricted in production builds.
**Recommended fix:**
- Use environment-specific CSP configuration: strip `http://localhost:*` and `ws://localhost:*` from production builds.

---

### FINDING 16 — INFORMATIONAL: Recent files data stored without integrity checks

**Severity:** INFORMATIONAL
**File:** `src/platform/shared/recentFiles.js:1-40`, `src-tauri/src/services/app_state.rs:51-72`
**Description:** Recent file entries are stored as JSON in `app_state_meta.json` without integrity checks (e.g., HMAC or checksum). If the file is corrupted or tampered with, the application will load whatever data is present. The normalization functions do validate structure but not authenticity.
**Recommended fix:**
- For a desktop app, this is acceptable risk since the file is in the user's own app data directory.
- Consider adding a version/checksum field to detect corruption.

---

## Positive Security Controls Observed

1. **Path traversal protection** — `is_path_safe()` in `app_fs.rs` blocks `..` components, null bytes, UNC paths, and Windows reserved names.
2. **File extension allowlist** — Only `.smm`, `.xmind`, `.md`, `.json` files can be read/written via Tauri commands.
3. **DOMPurify sanitization** — Used consistently for rich text, print, and most `v-html` contexts.
4. **Prototype pollution prevention** — `sanitizeExternalJsonValue()` strips `__proto__`, `constructor`, and `prototype` keys from parsed JSON.
5. **CSP configured** — Restricts `script-src` to `'self'`, blocks `frame-src` and `object-src`.
6. **HTTPS enforcement for AI proxy** — The Rust AI proxy rejects non-HTTPS URLs.
7. **AI domain allowlist** — Only known AI API domains are proxied.
8. **URL validation** — `open_external_url` validates scheme before spawning the browser.
9. **Tauri dialog plugin** — File open/save uses OS-native dialogs, not arbitrary path input.
10. **No `eval()` or `Function()` usage** — Codebase is clean of dynamic code execution.

---

## Risk Summary

| Severity | Count |
|----------|-------|
| HIGH     | 3     |
| MEDIUM   | 6     |
| LOW      | 4     |
| INFO     | 2     |

**Priority actions:**
1. Harden AI proxy input validation (FINDING 1)
2. Tighten AI chat URI regex and HTML allowlist (FINDING 2)
3. Sanitize formula overview `v-html` (FINDING 3)
4. Address all MEDIUM findings before production release
