# MindMap 总审查活动清单（已清理）

> 原审查日期：2026-04-02
> 清理日期：2026-04-05
> 清理方式：对照当前仓库代码、配置、工作流与现有回归测试重新核实

---

## 说明

原《全面审查报告》包含大量已经修复、已经过时、或当前代码状态下不再成立的结论。

为了避免后续继续被旧报告干扰，本文件已收敛为“活动问题清单”：

1. 已修复或已不成立的问题：从活动清单移除
2. 仍可由当前代码直接证实的问题：保留
3. 纯风格偏好、缺少当前证据支撑的结论：不再作为活动问题继续保留

---

## 已确认过时并移除的结论

以下结论已和当前仓库状态不符，因此不再作为后续修复依据：

- `test:desktop-flow` 缺少文件
- `test:all` 缺失
- CI 中无测试步骤
- 缺少 PR CI 工作流
- 无 pre-commit hook
- README 使用绝对路径
- `openPerformance` 默认关闭
- `parseExternalJsonSafely` 缺少异常与原型链污染防护
- AI 聊天渲染未做 `DOMPurify` 清洗
- `request.data` 无大小限制
- Rust 文件系统操作仍使用同步阻塞实现
- `read/write_text_file` 未做目录权限限制

---

## 已完成的 P0 / P1

以下问题已在当前工作区完成，因此不再保留为活动待办：

1. `strict/checkJs` 已开启，但采用“桌面主线关键文件 allowlist”策略收口，而不是一次性全仓强检
2. 已补行为测试与 Playwright E2E 烟雾测试，并接入 `test:all`、`test:e2e`、CI 与 release verify
3. AI key 已改为系统凭据存储，元状态文件不再直接写明文 key
4. 本地 AI 代理已改为强制 `AI_PROXY_TOKEN` 鉴权
5. root flat ESLint 已接管 workspace，旧 `simple-mind-map/.eslintrc.js` 已删除
6. root 侧冗余 polyfill 已移除，`simple-mind-map` 的 `ws` 已升级到 `^8`
7. 发布流程已接入 Windows / macOS 代码签名配置入口

---

## 已完成的 P2

以下 P2 项已在当前工作区完成：

1. 已补齐仓库治理文件
   - [CHANGELOG.md](/d:/Code/mind-map/CHANGELOG.md)
   - [CONTRIBUTING.md](/d:/Code/mind-map/CONTRIBUTING.md)
   - [PULL_REQUEST_TEMPLATE.md](/d:/Code/mind-map/.github/PULL_REQUEST_TEMPLATE.md)
   - [bug_report.md](/d:/Code/mind-map/.github/ISSUE_TEMPLATE/bug_report.md)
   - [feature_request.md](/d:/Code/mind-map/.github/ISSUE_TEMPLATE/feature_request.md)
   - [CODEOWNERS](/d:/Code/mind-map/.github/CODEOWNERS)

2. 已收紧 Tauri 开发态 CSP
   - [tauri.conf.json](/d:/Code/mind-map/src-tauri/tauri.conf.json) 不再使用 `localhost:*` / `ws://localhost:*` 通配符
   - 保留明确开发端口白名单，避免因过度收紧再次触发白屏

---

## 当前仍有效的问题

当前这份总活动清单中，已无继续保留的 P0 / P1 / P2 活动问题。

---

## 建议的后续顺序

1. 如果后续继续推进工程化，可以逐步扩大 TypeScript 检查范围
2. 如果要做真正的跨平台“文件内容级缩略图预览”，应单独立项，不要混在文件关联修复里

---

## 不再沿用的内容

原报告中的评分、旧版优先级编号、过时修复路线图、以及已经失效的 P0/P1 结论，均不再继续作为当前修复依据。

如果后续需要重新做“全量审查”，应基于 2026-04-05 之后的代码状态重新生成新报告，而不是继续在旧长报告上增量修订。
