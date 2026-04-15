# HTML Export Implementation Plan

**Goal:** 为桌面导出中心补齐 HTML 导出，产出单文件、只读、可拖拽缩放浏览的导图 HTML，并且打开后直接进入导图视口。

**Architecture:** 复用导出页现有 mind-map 预览实例生成 SVG，再通过 `src/services/htmlExport.js` 包装为单文件 HTML 模板。平台层新增通用文本文件保存能力，导出页在 `html` 分支中调用该服务与保存接口。HTML 模板只负责浏览交互，不承载编辑器运行时。

**Tech Stack:** Vue 3, simple-mind-map Export plugin, Tauri desktop adapter, Node test runner, ESLint

---

### Task 1: 为 HTML 导出补源码测试

**Files:**
- Modify: `tests/export-page-layout.test.mjs`
- Modify: `tests/platform-runtime.test.mjs`
- Modify: `tests/review-remediation.test.mjs`

**Step 1: Write the failing test**

补充断言，覆盖以下行为：

- `src/services/exportState.js` 中 `html` 不再是禁用格式。
- 导出页存在 `html` 导出分支。
- 导出页会调用 HTML 导出服务。
- 平台层存在通用文本文件另存接口。
- HTML 模板不存在首屏 header、工具栏、编辑入口。
- HTML 模板存在浏览视口、平移缩放脚本和首次适配逻辑。

**Step 2: Run test to verify it fails**

Run: `node --test tests/export-page-layout.test.mjs tests/platform-runtime.test.mjs tests/review-remediation.test.mjs`

Expected: FAIL，提示 HTML 导出链路或模板结构缺失

**Step 3: Write minimal implementation**

不提前实现功能，只先提交失败断言。

**Step 4: Run test again after implementation**

Run: `node --test tests/export-page-layout.test.mjs tests/platform-runtime.test.mjs tests/review-remediation.test.mjs`

Expected: PASS

---

### Task 2: 新增 HTML 导出服务

**Files:**
- Create: `src/services/htmlExport.js`

**Step 1: Write the failing test**

在 `tests/review-remediation.test.mjs` 中补源码断言：

- 存在 `buildMindMapHtmlDocument`
- 存在模板根节点和只读视口结构
- 模板脚本包含拖拽、缩放、首次 `fit`
- 模板不包含 `toolbar`、`contenteditable`、`exportPage.title` 等首屏或编辑残留

**Step 2: Run test to verify it fails**

Run: `node --test tests/review-remediation.test.mjs`

Expected: FAIL

**Step 3: Write minimal implementation**

在 `src/services/htmlExport.js` 中实现：

- SVG 提取后的 HTML 转义与嵌入
- 单文件 HTML 模板构建
- 文件名辅助方法
- 浏览视口脚本

**Step 4: Run test to verify it passes**

Run: `node --test tests/review-remediation.test.mjs`

Expected: PASS

---

### Task 3: 平台层补通用文本文件另存接口

**Files:**
- Modify: `src/platform/desktop/index.js`
- Modify: `tests/platform-runtime.test.mjs`

**Step 1: Write the failing test**

补充断言：

- 存在通用保存文件名规范函数
- 存在 `saveTextFileAs`
- 浏览器 fallback 下载 MIME 支持 `text/html`

**Step 2: Run test to verify it fails**

Run: `node --test tests/platform-runtime.test.mjs`

Expected: FAIL

**Step 3: Write minimal implementation**

实现：

- 通用默认保存路径拼接
- 按扩展名保存文本文件
- 浏览器 fallback 自定义 MIME

**Step 4: Run test to verify it passes**

Run: `node --test tests/platform-runtime.test.mjs`

Expected: PASS

---

### Task 4: 接入导出页 HTML 分支

**Files:**
- Modify: `src/pages/Export/Index.vue`
- Modify: `src/services/exportState.js`
- Modify: `src/lang/index.js`

**Step 1: Write the failing test**

在 `tests/export-page-layout.test.mjs` 中补断言：

- HTML 格式描述为已支持的只读浏览导出
- `handleExport()` 中存在 `html` 分支
- HTML 分支先生成 SVG，再构建 HTML 文档，再保存
- HTML 不显示即将支持态

**Step 2: Run test to verify it fails**

Run: `node --test tests/export-page-layout.test.mjs`

Expected: FAIL

**Step 3: Write minimal implementation**

实现：

- 启用 `html` 格式
- 新增 HTML 描述文案
- 导出页在 `html` 分支中：
  - 安装 SVG 导出插件
  - 生成 SVG
  - 调用 HTML 导出服务
  - 使用平台通用接口保存 `.html`

**Step 4: Run targeted verification**

Run:

```bash
node --test tests/export-page-layout.test.mjs tests/platform-runtime.test.mjs tests/review-remediation.test.mjs
```

Expected: PASS

---

### Task 5: 做整体验证

**Files:**
- No code changes unless verification fails

**Step 1: Run lint**

Run: `npm run lint`

Expected: PASS

**Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

**Step 3: Run targeted tests**

Run: `node --test tests/export-page-layout.test.mjs tests/platform-runtime.test.mjs tests/review-remediation.test.mjs`

Expected: PASS

**Step 4: Run build**

Run: `npm run frontend:build`

Expected: PASS

**Step 5: Summarize residual risks**

记录仍可能存在的风险：

- 超大 SVG 的首屏适配速度
- 极端触控板缩放灵敏度
- 某些浏览器打开本地 HTML 时的字体差异
