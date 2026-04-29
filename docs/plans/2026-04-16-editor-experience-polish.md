# 编辑页体验优化 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不大改编辑页界面的前提下，补齐保存状态反馈、上下文切换确认、显式保存动作和搜索连续性。

**Architecture:** 继续复用现有 `Toolbar.vue`、`Search.vue`、`documentSession`、`storeData -> emitWriteLocalFile -> writeLocalFile` 链路，不引入新的全局状态中心。状态增强优先落在工具栏现有状态区，搜索连续性只保留输入草稿，不保留旧文档结果。

**Tech Stack:** Vue 3、Pinia、Element Plus、Node test、Vite

---

### Task 1: 补齐编辑页体验测试

**Files:**
- Modify: `tests/editor-topbar-entrypoints.test.mjs`

**Step 1: Write the failing test**

补充以下断言：

- 工具栏存在 `toolbar.save`
- 工具栏存在状态副文案相关实现，如 `toolbarStatusDetail`
- 工具栏存在按动作区分的离开确认映射，如 `getLeaveConfirmOptions`
- 搜索面板存在草稿恢复逻辑，如 `searchDraftText` / `restoreSearchDraft`

**Step 2: Run test to verify it fails**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: FAIL，因为当前实现还没有这些结构。

**Step 3: Write minimal implementation**

先只修改测试文件，不动生产代码。

**Step 4: Run test to verify it fails**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: FAIL，且失败点落在新增断言上。

### Task 2: 增强工具栏状态反馈与保存动作

**Files:**
- Modify: `src/pages/Edit/components/Toolbar.vue`
- Modify: `src/lang/index.js`

**Step 1: Write the failing test**

让 Task 1 的测试覆盖以下目标：

- 工具栏新增 `保存`
- 状态区新增副文案
- 状态区支持保存失败态

**Step 2: Run test to verify it fails**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: FAIL

**Step 3: Write minimal implementation**

在 `Toolbar.vue` 中：

- 新增 `saveCurrentLocalFile`
- 新增 `canDirectSave`
- 新增 `toolbarStatusDetail`
- 新增 `toolbarStatusTitle`
- 新增 `lastSuccessfulSaveAt`、`lastLocalSaveErrorMessage`
- 在本地写入成功后刷新成功时间并清空失败态
- 在本地写入失败后记录失败态
- 打开文件成功后不再使用常驻通知，改为轻提示

在 `src/lang/index.js` 中补齐相关文案。

**Step 4: Run test to verify it passes**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: PASS

### Task 3: 收紧离开确认文案

**Files:**
- Modify: `src/pages/Edit/components/Toolbar.vue`
- Modify: `src/lang/index.js`

**Step 1: Write the failing test**

让测试断言存在动作化离开确认配置：

- `returnHome`
- `openFile`
- `openRecentFile`
- `openDirectory`
- `editLocalFile`
- `newFile`

**Step 2: Run test to verify it fails**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: FAIL

**Step 3: Write minimal implementation**

在 `Toolbar.vue` 中抽出 `getLeaveConfirmOptions(actionKey)`，根据动作返回不同标题和文案，再由 `confirmPotentialDataLoss` 统一调用。

**Step 4: Run test to verify it passes**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: PASS

### Task 4: 增强搜索连续性

**Files:**
- Modify: `src/pages/Edit/components/Search.vue`
- Modify: `src/lang/index.js`（如需要新增提示文案）

**Step 1: Write the failing test**

让测试断言搜索面板具有：

- 搜索草稿状态
- 关闭时保存草稿
- 再次打开时恢复草稿
- 文档切换时清空草稿

**Step 2: Run test to verify it fails**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: FAIL

**Step 3: Write minimal implementation**

在 `Search.vue` 中：

- 新增 `searchDraftText`、`replaceDraftText`、`replaceDraftVisible`
- 在 `close()` 时保存草稿并结束搜索
- 在 `showSearch()` 时恢复草稿并聚焦/选中文本
- 在 `setData` 事件触发时清空草稿和搜索状态

**Step 4: Run test to verify it passes**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: PASS

### Task 5: 全量验证

**Files:**
- Verify only

**Step 1: Run targeted tests**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: PASS

**Step 2: Run full test suite**

Run: `npm run test:all`

Expected: PASS

**Step 3: Run static checks**

Run: `npm run lint`

Expected: PASS

Run: `npm run typecheck`

Expected: PASS

**Step 4: Run build**

Run: `npm run frontend:build`

Expected: PASS
