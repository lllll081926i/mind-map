# Desktop UX Priorities Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the desktop workspace experience across home, editor toolbar, search, export, and settings so users can start faster, understand system state, discover high-frequency actions, and recover from risky flows with clearer feedback.

**Architecture:** Reuse existing desktop workspace state and UI shells instead of creating new feature centers. Home consumes the existing workspace session state, toolbar consumes document/runtime state, search extends the existing mind-map search plugin events, export persists lightweight preferences in existing frontend state helpers, and settings stays as a guidance/status page.

**Tech Stack:** Vue 3, Pinia, vue-i18n, node:test, Element Plus

---

### Task 1: Add failing tests for the new UX surface

**Files:**
- Modify: `tests/home-page-layout.test.mjs`
- Modify: `tests/editor-topbar-entrypoints.test.mjs`
- Modify: `tests/export-page-layout.test.mjs`
- Modify: `tests/workspace-settings-layout.test.mjs`

**Step 1: Write the failing test**

Add assertions for:

- home quick-start / signal / tip sections
- toolbar status area, search entry, shortcut entry, unsaved-leave guard
- export remembered preferences and richer status summary
- settings guidance cards

**Step 2: Run test to verify it fails**

Run: `node --test tests/home-page-layout.test.mjs tests/editor-topbar-entrypoints.test.mjs tests/export-page-layout.test.mjs tests/workspace-settings-layout.test.mjs`

Expected: FAIL with missing sections and strings.

**Step 3: Write minimal implementation**

Do not touch production code until the assertions fail for the expected reason.

**Step 4: Run test to verify it passes**

Run the same command again after implementation.

**Step 5: Commit**

```bash
git add tests/home-page-layout.test.mjs tests/editor-topbar-entrypoints.test.mjs tests/export-page-layout.test.mjs tests/workspace-settings-layout.test.mjs
git commit -m "test: cover desktop ux priorities"
```

### Task 2: Upgrade the home workspace page

**Files:**
- Modify: `src/pages/Home/Index.vue`
- Modify: `src/lang/index.js`

**Step 1: Write the failing test**

Use Task 1 assertions for:

- quick-start checklist
- workspace signal cards
- experience tips
- hotkey copy

**Step 2: Run test to verify it fails**

Run: `node --test tests/home-page-layout.test.mjs`

Expected: FAIL because those sections are not rendered yet.

**Step 3: Write minimal implementation**

Implement:

- workspace signal cards
- quick-start guide cards
- experience tip cards
- workspace action warmup on mount

**Step 4: Run test to verify it passes**

Run: `node --test tests/home-page-layout.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/Home/Index.vue src/lang/index.js tests/home-page-layout.test.mjs
git commit -m "feat: upgrade desktop home workspace onboarding"
```

### Task 3: Add toolbar status feedback and safe navigation prompts

**Files:**
- Modify: `src/pages/Edit/components/Toolbar.vue`
- Modify: `src/lang/index.js`

**Step 1: Write the failing test**

Require:

- toolbar status panel
- search and shortcut quick actions
- unsaved-change confirmation helper
- richer recovery / save feedback strings

**Step 2: Run test to verify it fails**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: FAIL with missing toolbar status and prompt coverage.

**Step 3: Write minimal implementation**

Implement:

- toolbar document status strip
- search and shortcut quick actions
- leave-risk confirmation before destructive context switches
- success / recovery feedback for file flows

**Step 4: Run test to verify it passes**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/Edit/components/Toolbar.vue src/lang/index.js tests/editor-topbar-entrypoints.test.mjs
git commit -m "feat: add toolbar workflow feedback"
```

### Task 4: Enhance search discoverability and result navigation

**Files:**
- Modify: `src/pages/Edit/components/Search.vue`
- Modify: `src/lang/index.js`

**Step 1: Write the failing test**

Use or extend the toolbar/editor tests to require:

- result summary
- prev / next actions
- active result highlighting
- search tips

**Step 2: Run test to verify it fails**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: FAIL because the new search affordances are absent.

**Step 3: Write minimal implementation**

Implement:

- active result index state
- previous / next result navigation
- result summary text
- search usage tips and empty-state messaging

**Step 4: Run test to verify it passes**

Run: `node --test tests/editor-topbar-entrypoints.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/Edit/components/Search.vue src/lang/index.js tests/editor-topbar-entrypoints.test.mjs
git commit -m "feat: improve search navigation feedback"
```

### Task 5: Improve export workflow feedback and preference memory

**Files:**
- Modify: `src/services/exportState.js`
- Modify: `src/pages/Export/Index.vue`
- Modify: `src/lang/index.js`
- Modify: `tests/export-page-layout.test.mjs`

**Step 1: Write the failing test**

Require:

- remembered export preferences
- remembered-state summary
- richer success message content
- metadata/status panel content

**Step 2: Run test to verify it fails**

Run: `node --test tests/export-page-layout.test.mjs`

Expected: FAIL because preference persistence and summary UI do not exist.

**Step 3: Write minimal implementation**

Implement:

- export option persistence
- remembered summary / metadata panel
- explicit success feedback with file name and extension
- plugin warmup for current format

**Step 4: Run test to verify it passes**

Run: `node --test tests/export-page-layout.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/exportState.js src/pages/Export/Index.vue src/lang/index.js tests/export-page-layout.test.mjs
git commit -m "feat: improve export workflow feedback"
```

### Task 6: Add settings-page workflow guidance

**Files:**
- Modify: `src/pages/Home/components/WorkspaceSettings.vue`
- Modify: `tests/workspace-settings-layout.test.mjs`

**Step 1: Write the failing test**

Require:

- workflow guidance cards
- recovery / shortcut / export tips
- stronger recovery cleanup explanation

**Step 2: Run test to verify it fails**

Run: `node --test tests/workspace-settings-layout.test.mjs`

Expected: FAIL because those cards and helper copy are missing.

**Step 3: Write minimal implementation**

Implement:

- workflow guidance card
- efficiency tips card
- stronger recovery hint copy

**Step 4: Run test to verify it passes**

Run: `node --test tests/workspace-settings-layout.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/Home/components/WorkspaceSettings.vue tests/workspace-settings-layout.test.mjs
git commit -m "feat: add workspace guidance cards"
```

### Task 7: Verify the full slice

**Files:**
- Modify as needed based on verification output

**Step 1: Run focused tests**

Run: `node --test tests/home-page-layout.test.mjs tests/editor-topbar-entrypoints.test.mjs tests/export-page-layout.test.mjs tests/workspace-settings-layout.test.mjs`

Expected: PASS

**Step 2: Run repo validation**

Run:

- `npm run lint`
- `npm run typecheck`
- `npm run test:desktop-flow`
- `npm run test:behavior`

Expected: all commands exit 0

**Step 3: Run broader confidence checks**

Run:

- `npm run frontend:build`
- `npm run test:e2e`

Expected: build and smoke test pass

**Step 4: Review for UX regressions**

Check:

- no duplicate entry points or visual collisions in toolbar
- home remains usable on mobile width
- search overlay and export overlay still behave with dark mode
- recovery warnings stay scoped to real risk actions

**Step 5: Commit**

```bash
git add .
git commit -m "feat: deliver desktop ux priorities"
```
