# Architecture & Code Quality Audit Report

> **Project:** mind-map-app (Vue 3 + Tauri 2 Desktop Mind Map)
> **Version:** 0.2.3
> **Audit Date:** 2026-04-02
> **Auditor:** Senior Software Architect

---

## Executive Summary

The application demonstrates a well-considered platform abstraction layer and a functional monorepo structure. However, the codebase suffers from significant architectural drift: it mixes Vue 3 Composition API expectations with Options API components, relies on a legacy event bus instead of reactive state for cross-component communication, and has near-zero TypeScript adoption despite a TypeScript toolchain being present. The Edit page alone contains 45 components in a flat directory with no sub-domain grouping.

**Findings: 42 total — 5 Critical, 11 High, 16 Medium, 10 Low**

---

## 1. Project Structure

### 1.1 Flat component directory in Edit page

- **Severity:** HIGH
- **File path:** `src/pages/Edit/components/` (45 files)
- **Description:** All 45 Edit page components live in a single flat directory. There is no sub-domain grouping (e.g., `panels/`, `dialogs/`, `toolbars/`, `overlays/`). This makes navigation, code ownership, and lazy-loading decisions harder.
- **Recommended fix:** Group components into subdirectories:
  ```
  src/pages/Edit/components/
    panels/        — Style.vue, BaseStyle.vue, Theme.vue, Structure.vue, Setting.vue, ShortcutKey.vue
    dialogs/       — NodeImage.vue, NodeHyperlink.vue, NodeNote.vue, NodeTag.vue, Import.vue, Export.vue, AiConfigDialog.vue
    toolbars/      — Toolbar.vue, ToolbarNodeBtnList.vue, NavigatorToolbar.vue, RichTextToolbar.vue
    overlays/      — Contextmenu.vue, Search.vue, Scale.vue, Fullscreen.vue, Demonstrate.vue
    nodes/         — NodeIconSidebar.vue, NodeIconToolbar.vue, NodeNoteSidebar.vue, NodeOuterFrame.vue, NodeTagStyle.vue, NodeImgPlacementToolbar.vue, NodeImgPreview.vue
    layout/        — Sidebar.vue, SidebarTrigger.vue, Outline.vue, OutlineEdit.vue, OutlineSidebar.vue, Count.vue, Scrollbar.vue, Navigator.vue
    ai/            — AiChat.vue, AiCreate.vue
    misc/          — Color.vue, FormulaSidebar.vue, MouseAction.vue, AssociativeLineStyle.vue
  ```

### 1.2 Empty `src/platform/web/` directory

- **Severity:** LOW
- **File path:** `src/platform/web/` (empty directory)
- **Description:** The `web` subdirectory exists but is empty. This suggests incomplete platform abstraction — the desktop platform's browser fallback logic lives inside `src/platform/desktop/index.js` instead of being separated.
- **Recommended fix:** Either remove the empty `web/` directory or extract the browser fallback code from `desktop/index.js` into `web/index.js` and have `platform/index.js` select between them.

### 1.3 `src/pages/Export/Index.vue` reuses Edit page layout

- **Severity:** MEDIUM
- **File path:** `src/router.js:19-22`
- **Description:** Both `/edit` and `/export` routes map to the same `Edit/Index.vue` component. The Export page is conditionally rendered inside Edit via `isExportRoute` check. This couples export flow tightly to the Edit page lifecycle.
- **Recommended fix:** Create a dedicated `src/pages/Export/Index.vue` that composes shared Edit components as needed, rather than piggybacking on the Edit page.

---

## 2. Design Patterns

### 2.1 Legacy event bus (`$bus`) used extensively instead of Pinia

- **Severity:** CRITICAL
- **File path:** `src/main.js:127`, `src/services/legacyBus.js`, 57 `$bus.$on()` registrations across Edit components
- **Description:** The application attaches a legacy event bus (`legacyBus` wrapping `appEvents`) to `app.config.globalProperties.$bus`. This is a Vue 2 pattern that bypasses Vue 3's reactivity system. 57 event listener registrations across components create an invisible, hard-to-trace communication mesh. Components subscribe to events in `created()` and unsubscribe in `beforeUnmount()`, but there is no guarantee of delivery order, and lost events are silent.
- **Recommended fix:** Migrate event-based communication to Pinia store actions/getters or Vue 3 `provide`/`inject`. For example, `node_active` events should update a Pinia store that interested components react to via `computed` or `watch`. Keep the event bus only for truly decoupled, fire-and-forget signals (e.g., `SHOW_LOADING`).

### 2.2 Dual event system: `appEvents` + `legacyBus`

- **Severity:** MEDIUM
- **File path:** `src/services/appEvents.js`, `src/services/legacyBus.js`
- **Description:** `legacyBus.js` is a thin wrapper that maps `$on/$off/$emit` to `appEvents.on/off/emit`. This creates two APIs for the same underlying system, causing confusion about which to use.
- **Recommended fix:** Remove `legacyBus.js` entirely. Components should import named functions from `appEvents.js` directly (e.g., `onShowLoading`, `emitShowLoading`).

### 2.3 `Edit.vue` is a God component (1085 lines)

- **Severity:** HIGH
- **File path:** `src/pages/Edit/components/Edit.vue`
- **Description:** The Edit component handles: mind map runtime initialization, plugin loading, event forwarding, data normalization, export patching, drag-and-drop import, rich-text plugin toggling, scrollbar plugin toggling, icon list loading, data getter registration, and more. It has 30+ data properties, 10+ computed properties, 3 watchers, and 25+ methods.
- **Recommended fix:** Extract concerns into composable functions:
  - `useMindMapRuntime()` — plugin loading, MindMap instance lifecycle
  - `useMindMapEvents()` — event binding/forwarding
  - `useMindMapData()` — data normalization, getData, setData
  - `useMindMapPlugins()` — rich text, scrollbar, export plugin management
  - `useDragImport()` — drag-and-drop file handling

---

## 3. Code Duplication

### 3.1 Repeated `mapState` patterns across 36+ components

- **Severity:** MEDIUM
- **File path:** `src/pages/Edit/components/*.vue` (36 files use `mapState(useThemeStore)`, 21 use `mapState(useAppStore)`, 9 use `mapState(useSettingsStore)`)
- **Description:** Nearly every component repeats the same `mapState` boilerplate:
  ```js
  ...mapState(useThemeStore, { isDark: 'isDark' })
  ...mapState(useAppStore, { activeSidebar: 'activeSidebar' })
  ...mapState(useSettingsStore, { localConfig: 'localConfig' })
  ```
- **Recommended fix:** Create composable hooks that encapsulate common store access:
  ```js
  // src/composables/useTheme.js
  export function useTheme() {
    const themeStore = useThemeStore()
    return { isDark: computed(() => themeStore.isDark) }
  }
  ```

### 3.2 Duplicated `beforeUnmount` cleanup patterns

- **Severity:** MEDIUM
- **File path:** `src/pages/Edit/components/*.vue` (20+ components)
- **Description:** Every component that uses `$bus.$on()` must manually call `$bus.$off()` in `beforeUnmount()`. This pattern is repeated 57 times with no abstraction. Missing a single `$off` causes memory leaks.
- **Recommended fix:** Create a composable `useAppEvent(eventName, handler)` that auto-cleans up on `onUnmounted`:
  ```js
  export function useAppEvent(eventName, handler) {
    onAppEvent(eventName, handler)
    onUnmounted(() => offAppEvent(eventName, handler))
  }
  ```

### 3.3 Duplicated color picker popover pattern

- **Severity:** LOW
- **File path:** `src/pages/Edit/components/Style.vue:74-86, 149-160, 246-254, 361-369`, `src/pages/Edit/components/BaseStyle.vue:157-172, 381-396, 432-447, 479-498, 597-612`
- **Description:** The color picker popover pattern (`el-popover` wrapping `Color` component) is copy-pasted 15+ times across Style.vue and BaseStyle.vue with only the bound property and change handler differing.
- **Recommended fix:** Create a reusable `ColorPickerField.vue` component that accepts `modelValue`, `label`, and `@change` props.

### 3.4 Duplicated `borderLine` CSS class

- **Severity:** LOW
- **File path:** `src/pages/Edit/components/Style.vue:928-936`, `src/pages/Edit/components/BaseStyle.vue:1368-1376`
- **Description:** The exact same `.borderLine` CSS class with `.isDark` variant is duplicated in both files.
- **Recommended fix:** Move to a shared stylesheet (e.g., `src/style/components.less`).

---

## 4. Naming Conventions

### 4.1 Inconsistent component naming: PascalCase vs mixed

- **Severity:** LOW
- **File path:** `src/pages/Edit/components/`
- **Description:** Most components use PascalCase (`NodeImage.vue`, `AiConfigDialog.vue`), but some are ambiguous: `Edit.vue` (too generic), `Count.vue` (unclear purpose), `Color.vue` (should be `ColorPicker.vue`).
- **Recommended fix:** Rename ambiguous components:
  - `Edit.vue` → `MindMapCanvas.vue`
  - `Count.vue` → `NodeCounter.vue`
  - `Color.vue` → `ColorPicker.vue`
  - `Export.vue` → `ExportDialog.vue` (already imported as such in Edit/Index.vue)

### 4.2 Inconsistent store naming: `ai.js` vs `aiStore`

- **Severity:** LOW
- **File path:** `src/stores/ai.js:4`
- **Description:** The store is defined as `useAiStore` but the file is named `ai.js`. Other stores follow the pattern `app.js` → `useAppStore`. This is consistent, but the store's `config` and `enabled` state overlap with `settingsStore.localConfig.enableAi`, creating conceptual duplication.
- **Recommended fix:** Consolidate AI state into a single source of truth. Either merge `aiStore` into `settingsStore` or clearly document the separation (runtime AI client config vs. persistent app settings).

### 4.3 Variable naming: `mosuedownX` / `mosuedownY` typo

- **Severity:** LOW
- **File path:** `src/pages/Edit/components/Contextmenu.vue:211-212`
- **Description:** Typo in variable names: `mosuedownX` and `mosuedownY` should be `mousedownX` and `mousedownY`.
- **Recommended fix:** Rename to `mousedownX` and `mousedownY`.

---

## 5. API Design

### 5.1 `src/api/index.js` is not an API layer — it's a storage abstraction

- **Severity:** MEDIUM
- **File path:** `src/api/index.js`
- **Description:** The `api/` directory name implies HTTP/remote API calls, but the module actually provides local storage abstractions (`getData`, `storeData`, `getConfig`, `storeConfig`, `storeLang`, `getLang`, `storeLocalConfig`, `getLocalConfig`). This is misleading and violates the principle of least surprise.
- **Recommended fix:** Rename to `src/services/mindMapStorage.js` or `src/services/documentStorage.js`. Reserve `api/` for actual HTTP API integrations.

### 5.2 `storeLang` and `getLang` are no-ops

- **Severity:** MEDIUM
- **File path:** `src/api/index.js:63-70`
- **Description:** `storeLang(lang)` simply returns `lang || 'zh'` without storing anything. `getLang()` always returns `'zh'`. These functions are dead code that mislead callers into thinking language persistence exists.
- **Recommended fix:** Either implement actual language persistence (save to bootstrap state) or remove these functions.

### 5.3 `platform/index.js` mixes concerns: state management + platform abstraction

- **Severity:** HIGH
- **File path:** `src/platform/index.js` (267 lines)
- **Description:** The platform index module does far more than expose a platform interface. It manages bootstrap state, meta/document write queues, mutation versioning, recent files, and re-exports document session functions. This violates the Single Responsibility Principle.
- **Recommended fix:** Split into:
  - `src/platform/index.js` — pure platform interface (`getPlatform()`, `isDesktopApp()`, `openExternalUrl()`)
  - `src/services/bootstrapState.js` — bootstrap state management, write queues, versioning
  - Keep `src/services/documentSession.js` as-is (already well-scoped)

### 5.4 `platform/index.js` exports `default` as `desktopPlatform` directly

- **Severity:** LOW
- **File path:** `src/platform/index.js:262`
- **Description:** `export default desktopPlatform` bypasses the `getPlatform()` indirection, creating a direct import path that could become stale if a new platform is added.
- **Recommended fix:** Remove the default export. All consumers should use named exports or `getPlatform()`.

---

## 6. State Management

### 6.1 `runtime.js` store is a singleton facade over Pinia stores

- **Severity:** HIGH
- **File path:** `src/stores/runtime.js`
- **Description:** `runtime.js` creates a singleton facade (`ensureRuntimeStores()`) over Pinia stores and exposes imperative functions (`setActiveSidebar`, `setIsHandleLocalFile`, etc.) that delegate to store methods. This defeats Pinia's reactivity model — components that call `setActiveSidebar('ai')` bypass Vue's reactivity tracking because the mutation happens outside the component's reactive context.
- **Recommended fix:** Expose Pinia store actions directly. Components should call `useAppStore().setActiveSidebar('ai')` rather than importing `setActiveSidebar` from `runtime.js`. Keep `runtime.js` only for cross-store orchestration (e.g., `syncRuntimeFromBootstrapState`).

### 6.2 State duplication: `editorStore.recentFiles` vs `bootstrapState.recentFiles`

- **Severity:** MEDIUM
- **File path:** `src/stores/editor.js:5`, `src/platform/index.js:246-248`
- **Description:** Recent files are stored in both `bootstrapState.recentFiles` (platform layer) and `editorStore.recentFiles` (Pinia). The `refreshWorkspaceRecentFiles()` function in `workspaceActions.js` copies from one to the other. This creates a window for inconsistency.
- **Recommended fix:** Make `editorStore.recentFiles` a computed getter that reads directly from `getRecentFiles()`, or have a single source of truth with explicit sync points.

### 6.3 `themeStore` and `settingsStore` both hold overlapping dark theme state

- **Severity:** MEDIUM
- **File path:** `src/stores/theme.js:6`, `src/stores/settings.js:6-8`
- **Description:** `themeStore.isDark` is derived from `settingsStore.localConfig.isDark` via `syncFromLocalConfig()`, but the two can drift if one is updated without syncing the other.
- **Recommended fix:** Make `themeStore.isDark` a computed property that reads from `settingsStore.localConfig.isDark` directly, eliminating the need for `syncFromLocalConfig()`.

### 6.4 Over-reliance on global module-level state

- **Severity:** HIGH
- **File path:** `src/platform/index.js:25-31`, `src/services/documentSession.js:9`, `src/services/runtimeGlobals.js:1`, `src/services/appEvents.js:1`
- **Description:** Multiple services use module-level mutable state (`bootstrapState`, `sessionState`, `currentDataGetter`, `listenersMap`). This state is invisible to Vue DevTools, cannot be time-traveled, and makes SSR/testing difficult.
- **Recommended fix:** Migrate module-level state into Pinia stores. The `appEvents` singleton is acceptable for an event bus, but `bootstrapState`, `sessionState`, and `currentDataGetter` should be in stores.

---

## 7. Type Safety

### 7.1 TypeScript is configured but unused — `checkJs: false`, `strict: false`

- **Severity:** HIGH
- **File path:** `tsconfig.json:13-16`
- **Description:** The project has TypeScript installed (`typescript@^6.0.2`) and a `tsconfig.json`, but `checkJs` is `false`, `strict` is `false`, and all source files are `.js`/`.vue` with no JSDoc type annotations. The `modules.d.ts` shim uses `any` for all Vue components. Type checking provides zero value in this configuration.
- **Recommended fix:** Either:
  - (A) Enable `checkJs: true` and add JSDoc type annotations to critical modules (`platform/`, `services/`, `stores/`), or
  - (B) Migrate to `.ts` files incrementally, starting with the platform abstraction layer and services.

### 7.2 Vue component type declarations use `any`

- **Severity:** MEDIUM
- **File path:** `src/shims/modules.d.ts:1-4`
- **Description:** `declare module '*.vue' { const component: any }` provides no type safety for Vue SFC imports. Every imported component is typed as `any`.
- **Recommended fix:** Use `@vue/runtime-core` or `vue-tsc` for proper `.vue` type inference. At minimum, type the component as `DefineComponent<{}, {}, any>`.

### 7.3 `MoreThemes` global is undeclared

- **Severity:** MEDIUM
- **File path:** `src/pages/Edit/components/Edit.vue:238-239`, `eslint.config.js:37`
- **Description:** `Edit.vue` references `MoreThemes` as a global variable (`if (typeof MoreThemes !== 'undefined') { MoreThemes.init(MindMap) }`). While declared in ESLint globals, there is no TypeScript declaration for it, and its origin is unclear (injected by external script?).
- **Recommended fix:** Add a proper TypeScript declaration for `MoreThemes` in `modules.d.ts`, or import it as a module if possible.

---

## 8. Error Handling Patterns

### 8.1 Silent error swallowing with `void ... .catch(console.error)`

- **Severity:** HIGH
- **File path:** `src/api/index.js:34-37, 52-56`, `src/services/localConfigStorage.js:7-18`, `src/services/documentSession.js:28-33`
- **Description:** Fire-and-forget async calls use `void promise.catch(console.error)`. While the error is logged, the calling code proceeds as if the operation succeeded. If `saveBootstrapStatePatch` fails silently, the UI shows saved state that was never persisted.
- **Recommended fix:** For critical persistence operations, surface errors to the user (e.g., via notification toast). For non-critical operations, at least emit an app event so monitoring can capture it:
  ```js
  saveBootstrapStatePatch(data).catch(error => {
    console.error('storeData persist failed', error)
    emitPersistError('mindMapData', error)
  })
  ```

### 8.2 Inconsistent error handling: some paths throw, others return null

- **Severity:** MEDIUM
- **File path:** `src/services/workspaceActions.js:83-97, 99-109, 111-129`
- **Description:** `openWorkspaceFileRef`, `openWorkspaceLocalFile`, and `createWorkspaceLocalFile` all wrap errors with `createDesktopFsError(error)` and re-throw. However, `openWorkspaceDirectory` (line 142) returns `null` on user cancellation but throws on errors. Callers must check for both `null` and catch exceptions.
- **Recommended fix:** Standardize on a Result pattern or always throw typed errors. User cancellation should throw a `UserCancelledError` that callers can catch specifically.

### 8.3 `Edit.vue` init error is caught but user sees only a blank screen

- **Severity:** HIGH
- **File path:** `src/pages/Edit/components/Edit.vue:492-495`
- **Description:** If `init()` fails, the error is logged to console and loading is hidden, but the user sees a blank page with no feedback. The `show` flag in `Edit/Index.vue` is already `true`, so the template renders an empty container.
- **Recommended fix:** Set an `initError` state and render an error UI with a retry button:
  ```vue
  <div v-if="initError" class="error-state">
    <p>{{ $t('edit.initFailed') }}</p>
    <button @click="retry">{{ $t('edit.retry') }}</button>
  </div>
  ```

### 8.4 `handleShowLoading` in Edit.vue has no debounce guard

- **Severity:** LOW
- **File path:** `src/pages/Edit/components/Edit.vue:562-564`
- **Description:** `handleShowLoading()` sets `enableShowLoading = true` and calls `showLoading()`. If called rapidly (e.g., during rapid data changes), loading indicator will flicker.
- **Recommended fix:** Add a minimum display duration for the loading indicator to prevent flicker.

---

## 9. Configuration Management

### 9.1 `src/config/zh.js` is the only locale — i18n infrastructure is incomplete

- **Severity:** MEDIUM
- **File path:** `src/config/index.js`, `src/config/zh.js`
- **Description:** All config lists (font families, border styles, etc.) are wrapped in locale-keyed objects (`{ zh: ... }`), but only `zh` is provided. Components access them as `fontFamilyList[this.$i18n.locale] || fontFamilyList.zh`, which always falls back to `zh`.
- **Recommended fix:** Either remove the locale-keyed wrapper and export values directly, or add at least one additional locale (e.g., `en`) to validate the i18n infrastructure works.

### 9.2 Hardcoded URLs in `vite.config.js`

- **Severity:** MEDIUM
- **File path:** `vite.config.js:62-64`
- **Description:** GitHub release URLs are hardcoded with a specific username (`lllll081926i`). While environment variable overrides exist (`APP_RELEASE_URL`, `APP_UPDATE_MANIFEST_URL`), the defaults should be configurable via `.env` files.
- **Recommended fix:** Move defaults to `.env.library` or `.env.desktop` files and reference them via `process.env` with fallbacks.

### 9.3 `store` global object in config

- **Severity:** LOW
- **File path:** `src/config/zh.js` (exported as `store`), `src/pages/Edit/components/Sidebar.vue:65`
- **Description:** `Sidebar.vue` uses `store.sidebarZIndex++` to manage z-index stacking. This is a mutable global counter that will grow unbounded during the session.
- **Recommended fix:** Use a bounded z-index strategy or CSS `z-index` stacking contexts instead of a global counter.

---

## 10. Test Coverage

### 10.1 Tests are integration/E2E style with no unit tests

- **Severity:** MEDIUM
- **File path:** `tests/` (15 `.mjs` files)
- **Description:** All tests use Node.js `node:test` runner with `.mjs` extension. They appear to be integration/layout tests (e.g., `home-page-layout.test.mjs`, `toolbar-layout.test.mjs`). There are no unit tests for services, stores, or utilities.
- **Recommended fix:** Add unit tests for:
  - `src/services/updateServiceCore.mjs` (pure functions — ideal for unit tests)
  - `src/platform/shared/recentFiles.js` (pure normalization logic)
  - `src/platform/shared/configMigration.js` (state normalization)
  - `src/utils/aiProviders.mjs` (AI config parsing/validation)
  - `src/utils/index.js` (JSON sanitization, clipboard utilities)

### 10.2 No test runner configured in CI

- **Severity:** LOW
- **File path:** `package.json:20-21`
- **Description:** Only two test scripts exist (`test:update`, `test:desktop-runtime`). There is no `test` script that runs all tests, and no test framework like Vitest or Jest is installed.
- **Recommended fix:** Add a `test` script that runs all tests: `"test": "node --test tests/**/*.mjs"`. Consider adding Vitest for unit testing with Vue component support.

### 10.3 No test coverage reporting

- **Severity:** LOW
- **File path:** N/A
- **Description:** No coverage tooling is configured. There is no way to measure what percentage of code is tested.
- **Recommended fix:** Add `c8` or `vite-plugin-istanbul` for coverage reporting. Set a minimum coverage threshold (e.g., 60% for services, 40% for components).

---

## 11. Dependency Management

### 11.1 `core-js` dependency is likely unnecessary

- **Severity:** LOW
- **File path:** `package.json:48`
- **Description:** `core-js@^3.49.0` is included as a runtime dependency. Since the app targets Node 22+ and modern browsers via Tauri 2, polyfills from `core-js` are almost certainly not needed.
- **Recommended fix:** Audit which (if any) `core-js` features are actually used. If none, remove the dependency to reduce bundle size.

### 11.2 `express` in devDependencies is suspicious

- **Severity:** MEDIUM
- **File path:** `package.json:75`
- **Description:** `express@^5.2.1` is listed as a devDependency. Express is a server framework — it's unclear why a desktop app needs it during development. It may be used by the AI proxy script (`scripts/ai.js`).
- **Recommended fix:** If Express is only used by `scripts/ai.js`, document this. If it's unused, remove it. Express 5.x is still in beta/RC — consider pinning to a stable version.

### 11.3 `overrides` for `quill` references a non-existent direct dependency

- **Severity:** LOW
- **File path:** `package.json:95`
- **Description:** `quill: "2.0.2"` is specified in `overrides`, but `quill` is not a direct dependency. This suggests a transitive dependency (likely from `@toast-ui/editor`) is being forced to a specific version.
- **Recommended fix:** Document why this override is needed. If `@toast-ui/editor` doesn't actually depend on Quill, the override is dead configuration.

### 11.4 Workspace packages lack their own `package.json` versioning

- **Severity:** LOW
- **File path:** `package.json:5-7`
- **Description:** `simple-mind-map` and `simple-mind-map-plugin-themes` are workspace dependencies. Ensure they have proper `package.json` files with version management.
- **Recommended fix:** Verify that workspace packages have independent versioning and that `workspace:*` resolution works correctly in CI.

---

## 12. Build Configuration

### 12.1 `vite.config.js` uses CommonJS (`require`)

- **Severity:** LOW
- **File path:** `vite.config.js:1-4`
- **Description:** The Vite config uses `require()` and `module.exports` (CommonJS) instead of ESM. While this works, it's inconsistent with the rest of the project which uses ESM.
- **Recommended fix:** Convert to ESM: `import path from 'node:path'`, `import { defineConfig } from 'vite'`, `export default defineConfig(...)`. Rename to `vite.config.mjs` or add `"type": "module"` to package.json.

### 12.2 Manual chunk strategy may create too many small chunks

- **Severity:** MEDIUM
- **File path:** `vite.config.js:11-58`
- **Description:** The `createManualChunks` function creates 9 separate vendor chunks (`vendor-framework`, `vendor-editor`, `vendor-viewer`, `vendor-xlsx`, `vendor-network`, `mind-map-core`, `mind-map-themes`, `mind-map-icons`, `mind-map-images`). Some of these (icons, images) may be very small and not worth separate HTTP requests.
- **Recommended fix:** Merge small chunks. Combine `mind-map-icons` and `mind-map-images` into `mind-map-assets`. Combine `vendor-viewer` and `vendor-network` into `vendor-utils`. Monitor actual chunk sizes in production builds.

### 12.3 `chunkSizeWarningLimit` is set very high (1200 KB)

- **Severity:** LOW
- **File path:** `vite.config.js:108`
- **Description:** The chunk size warning limit is 1200 KB, which is 2.4x the default (500 KB). This suppresses legitimate warnings about oversized chunks.
- **Recommended fix:** Lower to 800 KB and investigate any warnings. Large chunks hurt initial load time.

### 12.4 No Tauri configuration review

- **Severity:** MEDIUM
- **File path:** `src-tauri/` (not fully audited)
- **Description:** The Tauri configuration (`src-tauri/tauri.conf.json` or `src-tauri/Cargo.toml`) was not fully reviewed. Key areas to check: CSP settings, allowed API commands, updater configuration, and bundle settings.
- **Recommended fix:** Audit `src-tauri/tauri.conf.json` for:
  - Content Security Policy (should restrict `script-src` to `'self'`)
  - Allowed commands (should whitelist only needed Tauri commands)
  - Updater endpoints (should use HTTPS with signature verification)
  - Bundle configuration (should exclude dev files from production bundle)

---

## 13. Additional Findings

### 13.1 `__APP_RUNTIME__` is hardcoded to `'desktop'`

- **Severity:** MEDIUM
- **File path:** `vite.config.js:87`
- **Description:** `__APP_RUNTIME__` is always `'desktop'`, making the web build path dead code. If a web build is ever needed, this must be changed.
- **Recommended fix:** Derive from `mode` parameter: `__APP_RUNTIME__: JSON.stringify(mode === 'web' ? 'web' : 'desktop')`.

### 13.2 Proxy configuration hardcodes Volces API

- **Severity:** MEDIUM
- **File path:** `vite.config.js:99-102`
- **Description:** The dev server proxy is hardcoded to `http://ark.cn-beijing.volces.com`. If other AI providers are used during development, they won't be proxied.
- **Recommended fix:** Make proxy target configurable via `.env.development`.

### 13.3 No `.env` files present (only `.env.library`)

- **Severity:** LOW
- **File path:** `.env.library`
- **Description:** Only `.env.library` exists. No `.env`, `.env.development`, or `.env.production` files are present for the desktop app.
- **Recommended fix:** Create `.env.development` and `.env.production` with appropriate defaults for the desktop app.

### 13.4 `Edit.vue` references `this.$route` and `this.$router` but router is not typed

- **Severity:** LOW
- **File path:** `src/pages/Edit/components/Edit.vue:938`, `src/pages/Edit/components/Toolbar.vue:499-509`
- **Description:** Components access `this.$route` and `this.$router` via global properties, but there is no TypeScript augmentation for these.
- **Recommended fix:** Add `ComponentCustomProperties` augmentation in `modules.d.ts` for `$route`, `$router`, `$bus`, `$message`, etc.

---

## Summary Table

| # | Severity | Category | File | Description |
|---|----------|----------|------|-------------|
| 1 | CRITICAL | Design Patterns | `src/main.js:127`, 57 components | Legacy `$bus` event bus replaces reactive state |
| 2 | CRITICAL | State Management | `src/stores/runtime.js` | Singleton facade defeats Pinia reactivity |
| 3 | CRITICAL | State Management | `src/platform/index.js`, `documentSession.js`, etc. | Module-level mutable state invisible to Vue DevTools |
| 4 | CRITICAL | Error Handling | `src/pages/Edit/components/Edit.vue:492-495` | Init failure shows blank screen |
| 5 | CRITICAL | Error Handling | `src/api/index.js:34-37` | Silent persistence failures |
| 6 | HIGH | Project Structure | `src/pages/Edit/components/` | 45 components in flat directory |
| 7 | HIGH | Design Patterns | `src/pages/Edit/components/Edit.vue` | God component (1085 lines) |
| 8 | HIGH | API Design | `src/platform/index.js` | Platform module mixes state management |
| 9 | HIGH | Type Safety | `tsconfig.json:13-16` | TypeScript configured but unused |
| 10 | HIGH | State Management | `src/stores/runtime.js` | Imperative facade over Pinia stores |
| 11 | HIGH | Error Handling | `src/api/index.js:34-37` | Fire-and-forget persistence with silent failures |
| 12 | MEDIUM | Project Structure | `src/router.js:19-22` | Export route reuses Edit component |
| 13 | MEDIUM | Design Patterns | `src/services/appEvents.js`, `legacyBus.js` | Dual event system APIs |
| 14 | MEDIUM | Code Duplication | 36 Edit components | Repeated `mapState` boilerplate |
| 15 | MEDIUM | Code Duplication | 20+ Edit components | Repeated `$bus.$off` cleanup |
| 16 | MEDIUM | API Design | `src/api/index.js` | Misnamed — storage, not API |
| 17 | MEDIUM | API Design | `src/api/index.js:63-70` | `storeLang`/`getLang` are no-ops |
| 18 | MEDIUM | State Management | `src/stores/editor.js:5` | Duplicate recent files state |
| 19 | MEDIUM | State Management | `src/stores/theme.js:6` | Overlapping dark theme state |
| 20 | MEDIUM | Type Safety | `src/shims/modules.d.ts:1-4` | Vue components typed as `any` |
| 21 | MEDIUM | Type Safety | `src/pages/Edit/components/Edit.vue:238` | Undeclared `MoreThemes` global |
| 22 | MEDIUM | Error Handling | `src/services/workspaceActions.js` | Mixed throw/return-null patterns |
| 23 | MEDIUM | Configuration | `src/config/index.js` | Only `zh` locale — i18n incomplete |
| 24 | MEDIUM | Configuration | `vite.config.js:62-64` | Hardcoded GitHub URLs |
| 25 | MEDIUM | Tests | `tests/` | No unit tests for pure functions |
| 26 | MEDIUM | Dependencies | `package.json:75` | `express` in devDependencies — unclear purpose |
| 27 | MEDIUM | Build | `vite.config.js:11-58` | Too many manual chunks |
| 28 | MEDIUM | Build | `vite.config.js:87` | Runtime hardcoded to `'desktop'` |
| 29 | MEDIUM | Build | `vite.config.js:99-102` | Proxy hardcoded to Volces API |
| 30 | LOW | Project Structure | `src/platform/web/` | Empty directory |
| 31 | LOW | Naming | `src/pages/Edit/components/` | Ambiguous component names |
| 32 | LOW | Naming | `src/stores/ai.js` | AI state overlap with settings |
| 33 | LOW | Naming | `src/pages/Edit/components/Contextmenu.vue:211` | Typo: `mosuedownX` |
| 34 | LOW | Code Duplication | `Style.vue`, `BaseStyle.vue` | Duplicated color picker pattern |
| 35 | LOW | Code Duplication | `Style.vue:928`, `BaseStyle.vue:1368` | Duplicated `.borderLine` CSS |
| 36 | LOW | API Design | `src/platform/index.js:262` | Default export bypasses indirection |
| 37 | LOW | Error Handling | `src/pages/Edit/components/Edit.vue:562` | Loading indicator flicker |
| 38 | LOW | Configuration | `src/config/zh.js` → `Sidebar.vue:65` | Unbounded z-index counter |
| 39 | LOW | Dependencies | `package.json:48` | `core-js` likely unnecessary |
| 40 | LOW | Dependencies | `package.json:95` | `quill` override — unclear purpose |
| 41 | LOW | Dependencies | `package.json:5-7` | Workspace versioning verification needed |
| 42 | LOW | Build | `vite.config.js:1-4` | CommonJS instead of ESM |

---

## Priority Recommendations

### Immediate (Sprint 1-2)
1. **Replace `$bus` with Pinia** for at least the most frequently used events (`node_active`, `data_change`)
2. **Fix silent persistence failures** — surface errors to user for `storeData`/`storeConfig`
3. **Add error UI** to `Edit.vue` for init failures

### Short-term (Sprint 3-4)
4. **Group Edit components** into subdirectories
5. **Extract Edit.vue concerns** into composables
6. **Enable `checkJs: true`** in tsconfig and add JSDoc types to `platform/` and `services/`
7. **Consolidate state** — resolve duplicate recent files and dark theme state

### Medium-term (Sprint 5-6)
8. **Split `platform/index.js`** into focused modules
9. **Remove `legacyBus.js`** — migrate all consumers to `appEvents` named exports
10. **Add unit tests** for pure utility functions
11. **Convert `vite.config.js`** to ESM

---

*End of report.*
