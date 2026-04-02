# Error Handling & Edge Case Audit Report

**Project:** Simple Mind Map (Vue 3 + Tauri 2 Desktop)
**Date:** 2026-04-02
**Auditor:** Automated QA Review
**Scope:** Error boundaries, async handling, Tauri commands, file operations, network, state recovery, race conditions, edge case inputs, memory, platform differences

---

## 1. Error Boundaries

### Finding 1.1: Minimal Vue Error Handler — No Recovery UI

- **Severity:** Medium
- **File:** `src/main.js:120-126`
- **Description:** `app.config.errorHandler` only logs to `console.error`. It does not display a user-facing error boundary, does not report to any telemetry service, and does not attempt component recovery. If a child component throws during render, the user sees a blank or frozen UI with no explanation.
- **Impact:** Silent failures in production; users cannot self-diagnose or recover from component-level crashes.
- **Recommended Fix:** Wrap the root `<router-view>` in a Vue error boundary component (e.g., `vue-error-boundary` or a custom `onErrorCaptured` wrapper) that displays a fallback UI with a "Reload" button. Consider integrating a crash reporting service.

### Finding 1.2: App.vue Has No Error Boundary

- **Severity:** Low
- **File:** `src/App.vue:1-5`
- **Description:** `App.vue` is a bare `<router-view>` wrapper with no `onErrorCaptured` hook or error boundary logic.
- **Impact:** Errors in routed components propagate up to the global `errorHandler` (Finding 1.1) without intermediate capture.
- **Recommended Fix:** Add an `onErrorCaptured` hook or wrap `<router-view>` in a custom error boundary component.

### Finding 1.3: No Global Unhandled Rejection Handler

- **Severity:** Medium
- **File:** `src/main.js` (missing)
- **Description:** There is no `window.addEventListener('unhandledrejection', ...)` or `process.on('unhandledRejection', ...)` registered. Any uncaught async promise rejection will silently fail in production.
- **Impact:** Async errors in event handlers, timers, or missed `.catch()` chains are invisible to the user and developer.
- **Recommended Fix:** Add a global unhandled rejection handler in `main.js` that logs and optionally displays a toast notification.

---

## 2. Async Error Handling

### Finding 2.1: `workspaceActions.js` — Re-throws Errors Without User-Facing Handling

- **Severity:** Medium
- **File:** `src/services/workspaceActions.js:96-98, 108-110, 132-134, 164-166`
- **Description:** All exported functions (`openWorkspaceFileRef`, `openWorkspaceLocalFile`, `createWorkspaceLocalFile`, `openWorkspaceDirectory`) catch errors and re-throw them via `createDesktopFsError(error)`. However, the callers (e.g., Toolbar.vue) are responsible for displaying the error. If a caller forgets the try/catch, the error is silently swallowed.
- **Impact:** File operation failures may not reach the user if the call chain is incomplete.
- **Recommended Fix:** Ensure every call site has a try/catch. Consider a centralized error display utility that all callers use.

### Finding 2.2: `Edit.vue::init()` — Catches Error But Continues Silently

- **Severity:** High
- **File:** `src/pages/Edit/components/Edit.vue:492-495`
- **Description:** The `mounted()` hook wraps `init()` in a try/catch, but on failure it only logs to console and hides the loading spinner. The component remains mounted in a broken state — `this.mindMap` is null, so all subsequent method calls will throw.
- **Impact:** The edit page appears blank with no error message. Users cannot tell what went wrong or how to recover.
- **Recommended Fix:** Display an error dialog with the error message and a "Retry" or "Go Home" button. Consider unmounting or redirecting on fatal init failure.

### Finding 2.3: `Edit.vue::setData()` — No Error Handling on `manualSave()`

- **Severity:** Medium
- **File:** `src/pages/Edit/components/Edit.vue:944-968`
- **Description:** `setData()` calls `this.manualSave()` at line 959 without a try/catch. If `storeData` fails (e.g., localStorage quota exceeded, Tauri write failure), the error propagates uncaught.
- **Impact:** Importing a mind map file could fail silently or crash the component during the auto-save step.
- **Recommended Fix:** Wrap `manualSave()` in a try/catch and display a user-friendly error message.

### Finding 2.4: `Toolbar.vue::writeLocalFile()` — Error Displayed But Write State Not Cleared on All Paths

- **Severity:** Low
- **File:** `src/pages/Edit/components/Toolbar.vue:839-863`
- **Description:** The `finally` block correctly clears `waitingWriteToLocalFile`, but if the write fails, the document remains marked as dirty without retry logic. The user is not informed that their changes were not persisted.
- **Impact:** User may believe their work is saved when it is not.
- **Recommended Fix:** On write failure, show a persistent notification with a "Retry Save" action. Keep the document dirty flag until confirmed saved.

### Finding 2.5: `aiService.js::checkAiAvailability()` — Fetch Has No Timeout

- **Severity:** Medium
- **File:** `src/services/aiService.js:83-88`
- **Description:** The `fetcher()` call for the AI health check has no timeout. If the AI proxy hangs, the request will block indefinitely.
- **Impact:** The UI may hang waiting for the health check result.
- **Recommended Fix:** Use `AbortController` with a timeout (e.g., 10 seconds) for the health check fetch.

### Finding 2.6: `BrowserAiTransport.request()` — No Fetch Timeout

- **Severity:** Medium
- **File:** `src/utils/ai.js:29-36`
- **Description:** The `fetch()` call to `http://localhost:${port}/ai/chat` uses an `AbortController` but never sets a timeout on it. If the local AI proxy hangs, the connection stays open indefinitely.
- **Impact:** AI requests can hang forever, blocking the UI.
- **Recommended Fix:** Add a timeout (e.g., 60 seconds) that calls `this.controller.abort()`.

---

## 3. Tauri Command Errors

### Finding 3.1: `desktop/index.js` — All `invoke()` Calls Lack Try/Catch

- **Severity:** High
- **File:** `src/platform/desktop/index.js:203-363`
- **Description:** Every method in `desktopPlatform` (`readBootstrapState`, `writeBootstrapState`, `openMindMapFile`, `saveMindMapFileAs`, `readMindMapFile`, `writeMindMapFile`, `listDirectoryEntries`, `recordRecentFile`, `openExternalUrl`, `startAiProxyRequest`, `stopAiProxyRequest`) calls `invoke()` without a try/catch. If the Tauri backend panics or returns an error string, the promise rejects and the error propagates to the caller.
- **Impact:** Any Tauri command failure (file permission denied, disk full, corrupted state file) will bubble up as an unhandled rejection if the caller does not catch it.
- **Recommended Fix:** Wrap each `invoke()` call in a try/catch and return a standardized error object. Example:
  ```js
  try {
    return await invoke('read_text_file', { path })
  } catch (err) {
    throw createDesktopFsError(err)
  }
  ```

### Finding 3.2: `bootstrapPlatformState()` — Fallback Masks Underlying Errors

- **Severity:** Medium
- **File:** `src/platform/index.js:127-142`
- **Description:** If `readBootstrapMetaState()` fails, the error is caught and the app silently falls back to defaults. The user loses their previous session state (recent files, last directory, current document) without any notification.
- **Impact:** Silent data loss on corrupted state files.
- **Recommended Fix:** Log the error to a crash report file and display a non-intrusive notification: "Previous session could not be restored."

### Finding 3.3: `ensureBootstrapDocumentState()` — Same Silent Fallback

- **Severity:** Medium
- **File:** `src/platform/index.js:153-170`
- **Description:** Identical pattern to Finding 3.2. If the document state file is corrupted, the mind map data is silently replaced with defaults.
- **Impact:** User's in-progress work is lost without warning.
- **Recommended Fix:** Same as 3.2 — notify the user and offer to recover from a backup if available.

---

## 4. File Operation Edge Cases

### Finding 4.1: No File Size Limit on Read Operations

- **Severity:** High
- **File:** `src-tauri/src/services/app_fs.rs:57-67`
- **Description:** `read_text_file()` reads the entire file into memory with `tokio::fs::read_to_string()`. There is no size limit. A multi-gigabyte file will consume all available memory and crash the application.
- **Impact:** Opening a very large `.smm` or `.json` file can cause an OOM crash.
- **Recommended Fix:** Add a maximum file size check (e.g., 50 MB) before reading. Return a clear error message: "File too large (max 50 MB)."

### Finding 4.2: No Handling for Corrupted `.smm` Files

- **Severity:** Medium
- **File:** `src-tauri/src/services/app_fs.rs:64-66`
- **Description:** `read_to_string()` will succeed on any valid UTF-8 text, but the JSON parsing happens on the JS side (`parseExternalJsonSafely`). If the file contains valid UTF-8 but invalid JSON, the error is only caught on the frontend.
- **Impact:** The Rust layer does not validate JSON, so corrupted files are read fully into memory before rejection.
- **Recommended Fix:** Optionally validate JSON on the Rust side before returning, or add a streaming JSON parser for large files.

### Finding 4.3: `write_text_file` — No Disk Space Check

- **Severity:** Medium
- **File:** `src-tauri/src/services/app_fs.rs:69-84`
- **Description:** Writing a file does not check available disk space. If the disk is full, `tokio::fs::write` will fail with an OS error that is converted to a string and propagated.
- **Impact:** Save operations fail with cryptic OS error messages.
- **Recommended Fix:** Catch the specific "no space left" error and return a user-friendly message. Optionally check free space before writing.

### Finding 4.4: No Atomic Write for State Files

- **Severity:** Medium
- **File:** `src-tauri/src/services/app_state.rs:177-185`
- **Description:** `write_json_file()` writes directly to the state file. If the app crashes mid-write, the state file becomes corrupted (partial JSON).
- **Impact:** On next launch, the corrupted state file fails to parse, causing silent data loss (see Finding 3.2).
- **Recommended Fix:** Use atomic writes: write to a temp file first, then rename. On Unix: `write + rename`. On Windows: `write + MoveFileEx`.

### Finding 4.5: `list_directory_entries` — No Depth Limit

- **Severity:** Low
- **File:** `src-tauri/src/services/app_fs.rs:86-129`
- **Description:** The directory listing reads all entries in a single directory. However, if the directory contains millions of files, the `Vec<DirectoryEntry>` allocation could be large.
- **Impact:** Potential memory spike on directories with many files.
- **Recommended Fix:** Add pagination or a maximum entry limit (e.g., 10,000 entries).

### Finding 4.6: Browser Fallback — `MAX_BROWSER_FILE_STORE_SIZE` Is Small

- **Severity:** Low
- **File:** `src/platform/desktop/index.js:10`
- **Description:** The browser fallback caps the file store at 12 entries. If a user opens more than 12 files in a browser session, the oldest entries are evicted.
- **Impact:** If the user tries to re-read an evicted file, they get "当前环境不支持读取未缓存的本地文件".
- **Recommended Fix:** Increase the limit or display a clearer message when the cache is full.

---

## 5. Network Failures

### Finding 5.1: `fetchUpdateManifest()` — No Timeout or Retry

- **Severity:** Medium
- **File:** `src/services/updateService.js:19-30`
- **Description:** The `fetch()` call for the update manifest has no timeout and no retry logic. On a slow or flaky network, the request may hang or fail permanently.
- **Impact:** Update checks may hang indefinitely, blocking the settings UI.
- **Recommended Fix:** Add a 15-second timeout and a single retry on failure.

### Finding 5.2: `downloadAndInstallUpdate()` — No Error Recovery

- **Severity:** Medium
- **File:** `src/services/updateService.js:75-84`
- **Description:** If `downloadAndInstall()` fails mid-download, the error is thrown without cleanup. The `pendingDesktopUpdate` is not reset, so subsequent update attempts will fail with "更新清单请求失败".
- **Impact:** After a failed update, the user cannot retry without restarting the app.
- **Recommended Fix:** Reset `pendingDesktopUpdate = null` in a `finally` block or on error.

### Finding 5.3: AI Proxy — No Connection Retry

- **Severity:** Low
- **File:** `src/utils/ai.js:29-36`
- **Description:** The browser AI transport does not retry on transient network failures (ECONNREFUSED, ECONNRESET).
- **Impact:** Temporary network glitches cause AI requests to fail permanently.
- **Recommended Fix:** Implement a single retry with a short delay for connection-level errors.

### Finding 5.4: `Import.vue::handleFileURL()` — Fetch Has No Timeout

- **Severity:** Medium
- **File:** `src/pages/Edit/components/Import.vue:190`
- **Description:** `fetch(safeURL)` has no timeout. If the remote server is slow or unresponsive, the import hangs.
- **Impact:** The import dialog appears frozen.
- **Recommended Fix:** Add an `AbortController` with a 30-second timeout.

---

## 6. State Recovery

### Finding 6.1: No Auto-Save Mechanism

- **Severity:** High
- **File:** `src/pages/Edit/components/Edit.vue:600-620`
- **Description:** The app saves on every `data_change` event (debounced via `onWriteLocalFile` in Toolbar.vue at 1000ms). However, there is no periodic auto-save independent of user actions. If the app crashes between edits, recent changes are lost.
- **Impact:** Work-in-progress is lost on unexpected crashes.
- **Recommended Fix:** Implement a periodic auto-save (e.g., every 30 seconds) that writes the current state to a recovery file. On launch, check for a recovery file and offer to restore.

### Finding 6.2: `beforeunload` Warning Only — No Auto-Save on Exit

- **Severity:** Medium
- **File:** `src/pages/Edit/components/Toolbar.vue:678-684`
- **Description:** The `onUnload` handler only shows a browser confirmation dialog. It does not trigger a synchronous save. In Tauri desktop mode, `beforeunload` behavior may differ from browsers.
- **Impact:** If the user closes the window without confirming, unsaved changes are lost.
- **Recommended Fix:** In Tauri mode, listen to the `closeRequested` event and perform a final save before allowing the window to close.

### Finding 6.3: No Crash Recovery File

- **Severity:** Medium
- **File:** `src-tauri/src/services/app_state.rs` (entire file)
- **Description:** State files are overwritten in-place. There is no backup or recovery file mechanism. If a write is interrupted, the state file is corrupted with no fallback.
- **Impact:** Permanent data loss on crash during write.
- **Recommended Fix:** Implement atomic writes (Finding 4.4) and maintain a `.bak` recovery file that is updated before each write.

---

## 7. Race Conditions

### Finding 7.1: `saveBootstrapStatePatch()` — Concurrent Writes Without Locking

- **Severity:** Medium
- **File:** `src/platform/index.js:176-210`
- **Description:** `saveBootstrapStatePatch()` applies the patch to the in-memory `bootstrapState` synchronously, then queues writes via `queueMetaWrite` and `queueDocumentWrite`. However, the in-memory state is updated before the write completes. If two patches arrive in quick succession, the second patch may read stale in-memory state if the first write is still pending.
- **Impact:** State inconsistency between memory and disk; potential data loss of rapid successive changes.
- **Recommended Fix:** Use a single serial write queue that merges pending patches before writing, or use an optimistic concurrency check.

### Finding 7.2: `writeLocalFile()` — Debounce Can Lose Last Change

- **Severity:** Medium
- **File:** `src/pages/Edit/components/Toolbar.vue:667-676`
- **Description:** The `onWriteLocalFile` handler uses `clearTimeout` + `setTimeout` for debouncing. If the component unmounts before the debounce fires (e.g., user navigates away quickly), the pending write is lost.
- **Impact:** Recent edits are lost on rapid navigation.
- **Recommended Fix:** In `beforeUnmount`, flush any pending write before cleanup. Store the timer ID and call `writeLocalFile` synchronously if pending.

### Finding 7.3: `onDataChange` / `onViewDataChange` — Race Between Data and View Changes

- **Severity:** Low
- **File:** `src/pages/Edit/components/Edit.vue:607-619`
- **Description:** Both `data_change` and `view_data_change` call `storeData()` independently. If they fire in quick succession, two separate writes may occur with potentially inconsistent data (one with `root`, one with `view`).
- **Impact:** The saved file may have mismatched root and view data.
- **Recommended Fix:** Merge data and view changes into a single debounced write operation.

### Finding 7.4: AI Request Registry — No Cleanup on App Exit

- **Severity:** Low
- **File:** `src-tauri/src/services/ai.rs:100-106`
- **Description:** The `AiRequestRegistry` stores abort handles in a `HashMap`. If the app exits while an AI request is in flight, the handles are not cleaned up, and the HTTP request continues in the background until the OS reclaims it.
- **Impact:** Resource leak on app exit.
- **Recommended Fix:** On app shutdown, iterate all abort handles and call `abort()`.

---

## 8. Edge Case Inputs

### Finding 8.1: No Filename Sanitization on Export

- **Severity:** Medium
- **File:** `src/pages/Export/Index.vue:617-619`
- **Description:** `safeFileName` only trims whitespace and falls back to a default. It does not sanitize special characters (`/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) that are invalid on various file systems.
- **Impact:** Exporting with a filename containing invalid characters will fail on Windows/macOS/Linux with cryptic errors.
- **Recommended Fix:** Strip or replace invalid filename characters: `fileName.replace(/[<>:"/\\|?*]/g, '_')`.

### Finding 8.2: `el-input` `maxlength="80"` — No Server-Side Validation

- **Severity:** Low
- **File:** `src/pages/Export/Index.vue:83`
- **Description:** The filename input has a client-side `maxlength="80"`, but the value is used directly in the export call without server-side validation.
- **Impact:** If the maxlength is bypassed (e.g., via dev tools), the export may fail.
- **Recommended Fix:** Add a server-side length check before the export call.

### Finding 8.3: `parseExternalJsonSafely` — No Depth Limit

- **Severity:** Medium
- **File:** `src/utils/index.js:83-85`
- **Description:** `JSON.parse()` has no depth limit. A deeply nested JSON structure (e.g., 10,000 levels) can cause a stack overflow in the `sanitizeExternalJsonValue` recursive function.
- **Impact:** Malicious or corrupted files can crash the parser.
- **Recommended Fix:** Add a maximum recursion depth (e.g., 100) to `sanitizeExternalJsonValue`.

### Finding 8.4: No Null Check in `sanitizeExternalJsonValue` for Non-Object Types

- **Severity:** Low
- **File:** `src/utils/index.js:67-81`
- **Description:** The function handles arrays and objects but does not explicitly handle `null` (which is `typeof 'object'` in JS). If `value` is `null`, the `!value` check on line 71 catches it, but the logic is implicit.
- **Impact:** Works correctly but is fragile to future changes.
- **Recommended Fix:** Add an explicit `if (value === null) return null` check for clarity.

### Finding 8.5: Node Text — No Length Limit

- **Severity:** Low
- **File:** Various (mind map library)
- **Description:** There is no validation on the maximum length of node text. Extremely long text (e.g., 1 MB string) in a single node can cause rendering performance issues.
- **Impact:** UI lag or crash when rendering nodes with extremely long text.
- **Recommended Fix:** Add a reasonable character limit (e.g., 10,000) for node text, or truncate with ellipsis in the renderer.

---

## 9. Memory Edge Cases

### Finding 9.1: No Node Count Limit

- **Severity:** Medium
- **File:** `src/pages/Edit/components/Edit.vue:181-247`
- **Description:** The mind map library is initialized without any node count limit. A file with hundreds of thousands of nodes will consume excessive memory and potentially crash the renderer.
- **Impact:** OOM crash on very large mind maps.
- **Recommended Fix:** Add a node count warning when loading files with >10,000 nodes. Consider virtual rendering for large trees.

### Finding 9.2: `NodeBase64ImageStorage` Plugin — No Image Size Limit

- **Severity:** Medium
- **File:** `src/pages/Edit/components/Edit.vue:200`
- **Description:** The `NodeBase64ImageStorage` plugin stores images as base64 in the mind map data. There is no limit on image size. A few large images can bloat the `.smm` file to hundreds of MB.
- **Impact:** Large files cause slow load/save times and potential OOM.
- **Recommended Fix:** Add image size limits (e.g., 5 MB per image) and compress images before embedding.

### Finding 9.3: `browserFileStore` — No Memory Limit in Browser Mode

- **Severity:** Low
- **File:** `src/platform/desktop/index.js:9-23`
- **Description:** The browser file store holds file contents in memory as strings. While capped at 12 entries, each entry could be a large file.
- **Impact:** In browser mode, loading 12 large files could consume significant memory.
- **Recommended Fix:** Add a total memory cap (e.g., 100 MB) for the browser file store.

---

## 10. Platform Differences

### Finding 10.1: Windows Reserved Names — Handled in Rust But Not in JS Fallback

- **Severity:** Low
- **File:** `src-tauri/src/services/app_fs.rs:5-9` vs `src/platform/desktop/index.js:43-46`
- **Description:** The Rust layer blocks Windows reserved names (CON, PRN, AUX, etc.) in `is_path_safe()`. However, the browser fallback's `createBrowserFilePath()` generates filenames using `Date.now()` and `Math.random()`, which cannot produce reserved names. This is fine, but there is no validation when a user provides a custom filename via `normalizeSaveName()`.
- **Impact:** Minimal — the browser fallback is unlikely to generate reserved names, but a crafted filename could theoretically cause issues on Windows.
- **Recommended Fix:** Add reserved name checking to the JS fallback's `normalizeSaveName()`.

### Finding 10.2: Path Separator Differences — `/` vs `\`

- **Severity:** Low
- **File:** `src/services/documentSession.js:18-21`
- **Description:** `getParentDirectory()` uses `parts.join('/')` regardless of platform. On Windows, this produces mixed separators when the input uses `\`.
- **Impact:** Path comparisons may fail on Windows if some parts use `/` and others use `\`.
- **Recommended Fix:** Use `path.sep` from Node.js or a cross-platform path utility.

### Finding 10.3: `open_external_url` — Platform-Specific Commands May Fail Silently

- **Severity:** Low
- **File:** `src-tauri/src/commands/config.rs:80-115`
- **Description:** The `open_external_url` command uses platform-specific `Command::new()` calls. If the command is not found (e.g., `xdg-open` missing on a minimal Linux distro), the error is returned as a string but not handled gracefully on the frontend.
- **Impact:** URL opening fails silently on some Linux configurations.
- **Recommended Fix:** Add a fallback mechanism (e.g., try `gio open` before `xdg-open`) and display an error message on failure.

### Finding 10.4: `relaunchAfterUpdate()` — Platform-Specific Relaunch Behavior

- **Severity:** Low
- **File:** `src/services/updateService.js:86-89`
- **Description:** `relaunchAfterUpdate()` returns `shouldRelaunch: __APP_PLATFORM__ !== 'win32'`. On Windows, the app does not relaunch after update. This is intentional but undocumented in the UI.
- **Impact:** Windows users may not realize they need to manually restart the app after an update.
- **Recommended Fix:** Display a platform-specific message: "The app will restart automatically" vs "Please restart the app manually."

---

## Summary Statistics

| Severity | Count |
|----------|-------|
| High     | 4     |
| Medium   | 20    |
| Low      | 11    |
| **Total** | **35** |

## Priority Recommendations

### Critical (Fix Immediately)
1. **Finding 2.2** — Edit page init failure leaves user with blank screen
2. **Finding 3.1** — All Tauri `invoke()` calls need error wrapping
3. **Finding 4.1** — No file size limit on reads (OOM risk)
4. **Finding 6.1** — No auto-save mechanism for crash recovery

### High (Fix This Sprint)
5. **Finding 1.1/1.3** — Add Vue error boundary + unhandled rejection handler
6. **Finding 4.4** — Atomic writes for state files
7. **Finding 7.2** — Flush pending writes on component unmount
8. **Finding 5.1/5.4** — Add timeouts to all network fetches

### Medium (Plan for Next Release)
9. **Finding 6.3** — Merge concurrent state writes
10. **Finding 8.1** — Sanitize export filenames
11. **Finding 8.3** — Add JSON parse depth limit
12. **Finding 9.1/9.2** — Node count and image size limits
