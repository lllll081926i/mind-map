import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const packageJsonPath = path.resolve('package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const appEventsSource = fs.readFileSync(
  path.resolve('src/services/appEvents.js'),
  'utf8'
)
const aiSource = fs.readFileSync(path.resolve('src/utils/ai.js'), 'utf8')
const aiServiceSource = fs.readFileSync(
  path.resolve('src/services/aiService.js'),
  'utf8'
)
const aiProvidersSource = fs.readFileSync(
  path.resolve('src/utils/aiProviders.mjs'),
  'utf8'
)
const toolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const navigatorToolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/NavigatorToolbar.vue'),
  'utf8'
)
const themeSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Theme.vue'),
  'utf8'
)
const contextmenuSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Contextmenu.vue'),
  'utf8'
)
const editSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Edit.vue'),
  'utf8'
)
const runtimeSource = fs.readFileSync(
  path.resolve('src/stores/runtime.js'),
  'utf8'
)
const aiStoreSource = fs.readFileSync(path.resolve('src/stores/ai.js'), 'utf8')
const exportStateSource = fs.readFileSync(
  path.resolve('src/services/exportState.js'),
  'utf8'
)
const nodeNoteSidebarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/NodeNoteSidebar.vue'),
  'utf8'
)
const nodeIconToolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/NodeIconToolbar.vue'),
  'utf8'
)
const documentSessionSource = fs.readFileSync(
  path.resolve('src/services/documentSession.js'),
  'utf8'
)
const utilsSource = fs.readFileSync(path.resolve('src/utils/index.js'), 'utf8')
const jsonUtilsSource = fs.readFileSync(path.resolve('src/utils/json.js'), 'utf8')
const appSource = fs.readFileSync(path.resolve('src/App.vue'), 'utf8')
const mainSource = fs.readFileSync(path.resolve('src/main.js'), 'utf8')
const indexHtmlSource = fs.readFileSync(path.resolve('index.html'), 'utf8')
const copyIndexScriptSource = fs.readFileSync(
  path.resolve('scripts/copy-index.js'),
  'utf8'
)
const tauriConfigSource = fs.readFileSync(
  path.resolve('src-tauri/tauri.conf.json'),
  'utf8'
)
const tauriCargoSource = fs.readFileSync(
  path.resolve('src-tauri/Cargo.toml'),
  'utf8'
)
const tauriAiSource = fs.readFileSync(
  path.resolve('src-tauri/src/services/ai.rs'),
  'utf8'
)
const tauriAppStateSource = fs.readFileSync(
  path.resolve('src-tauri/src/services/app_state.rs'),
  'utf8'
)
const tauriCommandSource = fs.readFileSync(
  path.resolve('src-tauri/src/commands/config.rs'),
  'utf8'
)
const tauriFsSource = fs.readFileSync(
  path.resolve('src-tauri/src/services/app_fs.rs'),
  'utf8'
)
const tauriFileAssociationSource = fs.readFileSync(
  path.resolve('src-tauri/src/services/file_association.rs'),
  'utf8'
)
const tauriFsCommandSource = fs.readFileSync(
  path.resolve('src-tauri/src/commands/fs.rs'),
  'utf8'
)
const tauriRecoverySourcePath = path.resolve('src-tauri/src/services/recovery.rs')
const tauriRecoveryCommandSourcePath = path.resolve('src-tauri/src/commands/recovery.rs')
const recoveryStorageSourcePath = path.resolve('src/services/recoveryStorage.js')
const legacyBusSource = fs.readFileSync(
  path.resolve('src/services/legacyBus.js'),
  'utf8'
)
const platformSource = fs.readFileSync(
  path.resolve('src/platform/index.js'),
  'utf8'
)
const simpleMindMapFullSource = fs.readFileSync(
  path.resolve('simple-mind-map/full.js'),
  'utf8'
)
const simpleMindMapSource = fs.readFileSync(
  path.resolve('simple-mind-map/index.js'),
  'utf8'
)
const outlineSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Outline.vue'),
  'utf8'
)
const outlineEditSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/OutlineEdit.vue'),
  'utf8'
)
const countSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Count.vue'),
  'utf8'
)
const fullscreenSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Fullscreen.vue'),
  'utf8'
)
const navigatorSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Navigator.vue'),
  'utf8'
)
const nodeNoteContentShowSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/NodeNoteContentShow.vue'),
  'utf8'
)
const searchSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Search.vue'),
  'utf8'
)
const formulaSidebarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FormulaSidebar.vue'),
  'utf8'
)
const importSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Import.vue'),
  'utf8'
)
const exportPageSource = fs.readFileSync(
  path.resolve('src/pages/Export/Index.vue'),
  'utf8'
)
const scaleSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Scale.vue'),
  'utf8'
)
const demonstrateSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Demonstrate.vue'),
  'utf8'
)
const mouseActionSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/MouseAction.vue'),
  'utf8'
)
const xmindParseSource = fs.readFileSync(
  path.resolve('simple-mind-map/src/parse/xmind.js'),
  'utf8'
)
const xmindUtilsSource = fs.readFileSync(
  path.resolve('simple-mind-map/src/utils/xmind.js'),
  'utf8'
)
const workspaceActionsSource = fs.readFileSync(
  path.resolve('src/services/workspaceActions.js'),
  'utf8'
)
const updateServiceSource = fs.readFileSync(
  path.resolve('src/services/updateService.js'),
  'utf8'
)
const commandSource = fs.readFileSync(
  path.resolve('simple-mind-map/src/core/command/Command.js'),
  'utf8'
)
const renderCoreSource = fs.readFileSync(
  path.resolve('simple-mind-map/src/core/render/Render.js'),
  'utf8'
)
const mindMapNodeSource = fs.readFileSync(
  path.resolve('simple-mind-map/src/core/render/node/MindMapNode.js'),
  'utf8'
)
const viewSource = fs.readFileSync(
  path.resolve('simple-mind-map/src/core/view/View.js'),
  'utf8'
)
const styleSource = fs.readFileSync(
  path.resolve('simple-mind-map/src/core/render/node/Style.js'),
  'utf8'
)
const simpleMindMapConstantsSource = fs.readFileSync(
  path.resolve('simple-mind-map/src/constants/constant.js'),
  'utf8'
)
const desktopPlatformSource = fs.readFileSync(
  path.resolve('src/platform/desktop/index.js'),
  'utf8'
)
const htmlExportSourcePath = path.resolve('src/services/htmlExport.js')
const htmlExportSource = fs.existsSync(htmlExportSourcePath)
  ? fs.readFileSync(htmlExportSourcePath, 'utf8')
  : ''
const zhCnSource = fs.readFileSync(path.resolve('src/config/zh.js'), 'utf8')
const tauriRecoverySource = fs.existsSync(tauriRecoverySourcePath)
  ? fs.readFileSync(tauriRecoverySourcePath, 'utf8')
  : ''
const tauriRecoveryCommandSource = fs.existsSync(tauriRecoveryCommandSourcePath)
  ? fs.readFileSync(tauriRecoveryCommandSourcePath, 'utf8')
  : ''
const recoveryStorageSource = fs.existsSync(recoveryStorageSourcePath)
  ? fs.readFileSync(recoveryStorageSourcePath, 'utf8')
  : ''

test('根项目补齐 workspace、lint、typecheck 与 commitlint 配置', () => {
  assert.deepEqual(packageJson.workspaces, [
    'simple-mind-map',
    'simple-mind-map-plugin-themes'
  ])
  assert.equal(packageJson.scripts.lint.includes('eslint'), true)
  assert.equal(packageJson.scripts.typecheck.includes('tsc'), true)
  assert.equal(packageJson.scripts.prepare, 'husky')
  assert.deepEqual(packageJson.commitlint.extends, [
    '@commitlint/config-conventional'
  ])
  assert.equal(packageJson.dependencies['simple-mind-map'], 'workspace:*')
  assert.equal(
    packageJson.dependencies['simple-mind-map-plugin-themes'],
    'workspace:*'
  )
})

test('根项目存在 ESLint、TypeScript 与提交钩子基础配置', () => {
  assert.equal(fs.existsSync(path.resolve('eslint.config.js')), true)
  assert.equal(fs.existsSync(path.resolve('tsconfig.json')), true)
  assert.equal(fs.existsSync(path.resolve('src/shims/modules.d.ts')), true)
  assert.equal(fs.existsSync(path.resolve('.husky/commit-msg')), true)
  assert.equal(fs.existsSync(path.resolve('simple-mind-map/.prettierrc')), false)
})

test('主路径 UI 事件通过 appEvents 统一抽象', () => {
  assert.match(appEventsSource, /BOOTSTRAP_STATE_READY/)
  assert.match(appEventsSource, /SHOW_LOADING/)
  assert.match(appEventsSource, /SHOW_SEARCH/)
  assert.match(appEventsSource, /TOGGLE_MINI_MAP/)
  assert.match(appEventsSource, /emitBootstrapStateReady/)
  assert.match(appEventsSource, /emitShowLoading/)
  assert.match(appEventsSource, /emitShowSearch/)
  assert.match(appEventsSource, /emitToggleMiniMap/)
  assert.match(appEventsSource, /\$on: onAppEvent/)
  assert.match(appEventsSource, /\$off: offAppEvent/)
  assert.match(appEventsSource, /\$emit: emitAppEvent/)
  assert.match(legacyBusSource, /appEvents\.on/)
  assert.match(legacyBusSource, /appEvents\.emit/)
})

test('应用入口从主路径移除 legacyBus 模块依赖，但继续复用同一套 appEvents 兼容对象', () => {
  assert.doesNotMatch(mainSource, /from '@\/services\/legacyBus'/)
  assert.doesNotMatch(mainSource, /app\.config\.globalProperties\.\$bus = legacyBus/)
  assert.match(mainSource, /app\.config\.globalProperties\.\$bus = appEvents/)
  assert.match(mainSource, /app\.config\.globalProperties\.\$appEvents = appEvents/)
})

test('AI 请求逻辑拆分为浏览器与桌面 transport', () => {
  assert.match(aiSource, /class BrowserAiTransport/)
  assert.match(aiSource, /class DesktopAiTransport/)
  assert.match(aiSource, /const createAiTransport = options =>/)
})

test('关键交互区补充基础可访问性属性', () => {
  assert.match(toolbarSource, /role="button"/)
  assert.match(toolbarSource, /tabindex="0"/)
  assert.match(navigatorToolbarSource, /aria-label=/)
  assert.match(themeSource, /:alt="item\.name"/)
  assert.match(scaleSource, /name="scalePercent"/)
  assert.match(demonstrateSource, /name="demonstrateStep"/)
})

test('上下文菜单隐藏时将 node 复位为 null，避免空字符串污染节点判断', () => {
  assert.match(contextmenuSource, /this\.node = null/)
  assert.doesNotMatch(contextmenuSource, /this\.node = ''/)
})

test('编辑页移除协同调试残留与外部调试地址', () => {
  assert.doesNotMatch(editSource, /cooperateTest/)
  assert.doesNotMatch(editSource, /ws:\/\/localhost:4444/)
  assert.doesNotMatch(editSource, /img0\.baidu\.com/)
})

test('运行时 store 改为惰性初始化，不在模块顶层直接创建实例', () => {
  assert.doesNotMatch(runtimeSource, /const appStore = useAppStore\(pinia\)/)
  assert.doesNotMatch(runtimeSource, /const editorStore = useEditorStore\(pinia\)/)
  assert.match(runtimeSource, /const ensureRuntimeStores = \(\) =>/)
  assert.match(runtimeSource, /const normalizedValue = typeof value === 'string' \? value : ''/)
  assert.doesNotMatch(aiStoreSource, /simple-mind-map\/src\/utils/)
  assert.match(aiStoreSource, /const createAiUid = \(\) =>/)
})

test('编辑页在子组件卸载后再销毁 mindMap 实例，避免路由切换时 beforeUnmount 清理互相打架', () => {
  assert.match(editSource, /beforeUnmount\(\)[\s\S]*this\.unbindMindMapEvents\(\)/)
  const beforeUnmountSection = editSource.match(
    /beforeUnmount\(\)\s*\{[\s\S]*?\n\s{2}\},\n\s{2}unmounted/
  )
  assert.ok(beforeUnmountSection)
  assert.doesNotMatch(beforeUnmountSection[0], /this\.mindMap\.destroy\(\)/)
  assert.match(editSource, /unmounted\(\)[\s\S]*this\.mindMap && typeof this\.mindMap\.destroy === 'function'/)
  assert.match(editSource, /unmounted\(\)[\s\S]*this\.mindMap\.destroy\(\)/)
})

test('备注浮层卸载时按真实父节点安全移除 DOM，避免返回首页时读取已销毁的 mindMap.el', () => {
  assert.match(nodeNoteContentShowSource, /const viewerEl = this\.\$refs\.noteContentViewer/)
  assert.match(nodeNoteContentShowSource, /const parentEl = viewerEl\?\.parentNode/)
  assert.match(nodeNoteContentShowSource, /parentEl\.removeChild\(viewerEl\)/)
  assert.doesNotMatch(
    nodeNoteContentShowSource,
    /this\.mindMap\.el\.removeChild\(this\.\$refs\.noteContentViewer\)/
  )
})

test('文档会话同步 bootstrap 状态时会兜底捕获持久化异常', () => {
  assert.match(documentSessionSource, /syncBootstrapState failed/)
  assert.match(documentSessionSource, /let bootstrapSyncQueue = Promise\.resolve\(\)/)
  assert.match(documentSessionSource, /bootstrapSyncQueue = bootstrapSyncQueue/)
  assert.match(documentSessionSource, /setWorkspaceLastDirectory\(/)
  assert.match(workspaceActionsSource, /const getDirectoryPath = filePath =>/)
  assert.match(workspaceActionsSource, /const persistWorkspaceLastDirectory = directoryPath =>/)
  assert.match(workspaceActionsSource, /persistWorkspaceLastDirectory\(getDirectoryPath\(/)
  assert.doesNotMatch(documentSessionSource, /parts\.join\('\//)
})

test('编辑页初始化时会稳妥解析思维导图容器元素，避免 ref 不是原生 DOM 时启动失败', () => {
  assert.match(editSource, /resolveMindMapContainerEl\(\)/)
  assert.match(editSource, /document\.getElementById\('mindMapContainer'\)/)
  assert.match(editSource, /mindMapContainer element unavailable/)
})

test('simple-mind-map 合并配置时会保留原生 DOM 容器，避免 deepmerge 破坏 el 实例', () => {
  assert.match(simpleMindMapSource, /const mergeOptionsPreservingEl =/)
  assert.match(simpleMindMapSource, /merged\.el = preservedEl/)
  assert.match(simpleMindMapSource, /mergeOptionsPreservingEl\(defaultOpt, opt\)/)
  assert.match(
    simpleMindMapSource,
    /mergeOptionsPreservingEl\(defaultOpt, this\.opt, opt\)/
  )
})

test('文件读取工具在 FileReader 出错时会 reject', () => {
  assert.match(utilsSource, /reader\.onerror = \(\) =>/)
  assert.match(utilsSource, /reject\(reader\.error \|\| new Error\('fileToBuffer failed'\)\)/)
})

test('外部 JSON 在导入、打开文件与剪贴板路径上统一走本地解析入口', () => {
  assert.match(utilsSource, /export \{ parseExternalJsonSafely \} from '\.\/json'/)
  assert.match(jsonUtilsSource, /export const parseExternalJsonSafely = input =>/)
  assert.match(jsonUtilsSource, /JSON\.parse\(String\(input \|\| ''\)\)/)
  assert.match(jsonUtilsSource, /validateJsonValue\(parsed\)/)
  assert.match(importSource, /parseExternalJsonSafely\(evt\.target\.result\)/)
  assert.match(toolbarSource, /parseExternalJsonSafely\(str\)/)
  assert.match(searchSource, /this\.\$nextTick\(\(\) => \{/)
})

test('本地持久化与 AI 流式响应也统一走安全 JSON 解析入口', () => {
  assert.match(exportStateSource, /from '@\/utils\/json'/)
  assert.match(exportStateSource, /parseExternalJsonSafely\(raw\)/)
  assert.doesNotMatch(exportStateSource, /const parsed = JSON\.parse\(raw\)/)
  assert.match(aiStoreSource, /from '@\/utils\/json'/)
  assert.match(aiStoreSource, /parseExternalJsonSafely\(raw\)/)
  assert.doesNotMatch(aiStoreSource, /const parsed = JSON\.parse\(raw\)/)
  assert.match(aiProvidersSource, /from '\.\/json\.js'/)
  assert.match(aiProvidersSource, /parseExternalJsonSafely\(data\)/)
  assert.doesNotMatch(aiProvidersSource, /items\.push\(JSON\.parse\(data\)\)/)
})

test('打印大纲不再直接把原始 outerHTML 写入 iframe，而是先做 sanitize 后再挂载 DOM', () => {
  assert.match(utilsSource, /DOMPurify\.sanitize\(el\.outerHTML/)
  assert.match(utilsSource, /iframeDoc\.open\(\)/)
  assert.match(utilsSource, /iframeDoc\.head\.insertAdjacentHTML/)
  assert.match(utilsSource, /iframeDoc\.body\.appendChild\(wrapper\)/)
  assert.doesNotMatch(utilsSource, /iframeDoc\.write\('<div>' \+ printContent \+ '<\/div>'\)/)
})

test('应用入口补充全局错误处理，根样式不再禁止所有文本选择', () => {
  assert.match(mainSource, /app\.config\.errorHandler =/)
  assert.match(appSource, /errorCaptured\(error\)/)
  assert.match(appSource, /renderErrorMessage/)
  assert.doesNotMatch(mainSource, /root\.innerHTML =/)
  assert.doesNotMatch(appSource, /body \*/)
  assert.doesNotMatch(appSource, /user-select: none;/)
})

test('桌面入口模板不再保留旧接管脚本，并使用 MindMap 作为应用显示名', () => {
  assert.match(indexHtmlSource, /<title>MindMap<\/title>/)
  assert.match(indexHtmlSource, /href="\.\/logo\.ico"/)
  assert.match(copyIndexScriptSource, /dist-desktop\/index\.html/)
  assert.doesNotMatch(copyIndexScriptSource, /..\/..\/dist\/index\.html/)
  assert.doesNotMatch(indexHtmlSource, /externalPublicPath/)
  assert.doesNotMatch(indexHtmlSource, /takeOverApp/)
  assert.doesNotMatch(indexHtmlSource, /window\.onload = async/)
  assert.match(tauriConfigSource, /"productName": "MindMap"/)
  assert.match(tauriConfigSource, /"title": "MindMap"/)
  assert.match(tauriConfigSource, /"shortDescription": "MindMap editor"/)
  assert.match(
    tauriConfigSource,
    /"longDescription": "MindMap application for Windows, macOS, and Linux\."/
  )
  assert.match(tauriCargoSource, /description = "MindMap"/)
})

test('桌面端外链打开不再通过 cmd start 调 shell，CSP 为发布态保留必要放宽项', () => {
  assert.doesNotMatch(tauriCommandSource, /Command::new\("cmd"\)/)
  assert.match(tauriCommandSource, /Command::new\("rundll32"\)/)
  assert.match(tauriConfigSource, /script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:/)
  assert.match(tauriConfigSource, /img-src 'self' data: blob: asset: https:/)
  assert.doesNotMatch(tauriAppStateSource, /block_in_place/)
})

test('工具栏等待异步面板挂载时改为有限时循环，不再递归自调用', () => {
  assert.match(toolbarSource, /async waitForRef\(refName, \{ maxWaitMs = 800, intervalMs = 16 \} = \{\}\)/)
  assert.doesNotMatch(toolbarSource, /return this\.waitForRef\(refName, retries - 1\)/)
})

test('搜索、公式侧边栏、全屏和小地图都补齐了时序与清理保护', () => {
  assert.doesNotMatch(searchSource, /\$bus\.\$emit\('closeSideBar'\)/)
  assert.match(searchSource, /\$refs\.searchInputRef\?\.focus\(\)/)
  assert.match(formulaSidebarSource, /katexRetryTimer/)
  assert.match(formulaSidebarSource, /scheduleKatexRetry\(\)/)
  assert.match(formulaSidebarSource, /clearKatexRetry\(\)/)
  assert.match(fullscreenSource, /document\.addEventListener\(/)
  assert.match(fullscreenSource, /document\.removeEventListener\(/)
  assert.match(fullscreenSource, /clearTimeout\(this\.resizeTimer\)/)
  assert.match(navigatorSource, /clearTimeout\(this\.timer\)/)
  assert.match(navigatorSource, /clearTimeout\(this\.setSizeTimer\)/)
  assert.match(navigatorSource, /if \(!this\.mindMap\?\.miniMap\) \{/)
})

test('AI 侧边栏与远程导入补齐 sanitize 和请求超时保护', () => {
  assert.match(aiServiceSource, /const AI_HEALTHCHECK_TIMEOUT_MS = \d+/)
  assert.match(aiServiceSource, /AbortController/)
  assert.match(aiServiceSource, /clearTimeout\(timer\)/)
  assert.match(aiSource, /this\.timeoutTimer = setTimeout\(/)
  assert.match(aiSource, /this\.controller\.abort\(\)/)
  assert.match(aiSource, /clearTimeout\(this\.timeoutTimer\)/)
  assert.match(aiProvidersSource, /consumeOpenAICompatibleStreamText parse failed/)
  assert.match(importSource, /const REMOTE_IMPORT_TIMEOUT_MS = \d+/)
  assert.match(importSource, /new AbortController\(\)/)
  assert.match(formulaSidebarSource, /import DOMPurify from 'dompurify'/)
  assert.match(formulaSidebarSource, /DOMPurify\.sanitize\(/)
  assert.match(tauriAiSource, /fn validate_proxy_request\(/)
  assert.match(tauriAiSource, /fn validate_proxy_request_data\(/)
})

test('导出文件名、桌面 invoke 和文本文件读取都增加边界保护', () => {
  assert.match(utilsSource, /export const sanitizeFileName = \(/)
  assert.match(exportPageSource, /sanitizeFileName\(/)
  assert.match(exportPageSource, /exportFormats\(\) \{/)
  assert.doesNotMatch(exportPageSource, /displayName: getFormatDisplayName\(this\.\$t, item\.type\)\s*\n\s*}\)\s*\n\s*const fallbackExportFormat/)
  assert.match(desktopPlatformSource, /const invokeCommand = async \(/)
  assert.match(desktopPlatformSource, /throw new Error\(normalizedMessage, \{/)
  assert.match(tauriFsSource, /const MAX_TEXT_FILE_SIZE: u64 = /)
  assert.match(tauriFsSource, /pub async fn read_text_file\(app: &tauri::AppHandle, path: &str\)/)
  assert.match(tauriFsSource, /pub async fn write_text_file\(\s*app: &tauri::AppHandle,/)
  assert.match(tauriFsSource, /tokio::fs::metadata\(path\)/)
  assert.match(tauriFsSource, /文件过大/)
  assert.match(tauriFsSource, /create_dir_all/)
  assert.match(tauriFsSource, /ensure_directory_scope_allowed/)
  assert.match(tauriFsCommandSource, /pub async fn read_text_file\(app: tauri::AppHandle, path: String\)/)
  assert.match(tauriFsCommandSource, /pub async fn write_text_file\(\s*app: tauri::AppHandle,/)
})

test('工具栏本地文件读写会绑定稳定请求上下文，避免切换文件后的串写与旧请求回写', () => {
  assert.match(toolbarSource, /const snapshotLocalFileRef = fileRef =>/)
  assert.match(toolbarSource, /const isSameLocalFileRef = \(left, right\) =>/)
  assert.match(toolbarSource, /const parseToolbarLocalFileContent = \(str, invalidContentMessage\) =>/)
  assert.match(toolbarSource, /localFileReadRequestId: 0/)
  assert.match(toolbarSource, /localFileWriteRequestId: 0/)
  assert.match(toolbarSource, /completedLocalFileWriteRequestId: 0/)
  assert.match(toolbarSource, /currentLocalFileWriteRequestId: 0/)
  assert.match(toolbarSource, /const writeTask = this\.createLocalWriteTask\(content\)/)
  assert.match(toolbarSource, /await platform\.writeMindMapFile\(writeTask\.fileRef, string\)/)
  assert.match(toolbarSource, /const hasPendingLocalWrite = this\.hasPendingLocalWrite\(writeTask\.id\)/)
  assert.match(toolbarSource, /if \(!hasPendingLocalWrite && writeSucceeded\)/)
  assert.match(toolbarSource, /return \+\+this\.localFileReadRequestId/)
  assert.match(toolbarSource, /pendingLocalFileRef: null/)
  assert.match(toolbarSource, /isLatestLocalFileRead\(requestId, fileRef\)/)
})

test('恢复文件子系统提供独立的 Tauri 服务与命令入口', () => {
  assert.equal(fs.existsSync(tauriRecoverySourcePath), true)
  assert.equal(fs.existsSync(tauriRecoveryCommandSourcePath), true)
  assert.match(tauriRecoverySource, /pub struct RecoveryState/)
  assert.match(tauriRecoverySource, /pub async fn read_recovery_state/)
  assert.match(tauriRecoverySource, /pub async fn read_recovery_draft/)
  assert.match(tauriRecoverySource, /pub async fn write_recovery_draft/)
  assert.match(tauriRecoverySource, /pub async fn clear_recovery_draft/)
  assert.match(tauriRecoverySource, /pub async fn clear_all_recovery_drafts/)
  assert.match(tauriRecoverySource, /resource_dir\(\)/)
  assert.match(tauriRecoverySource, /app_data_dir\(\)/)
  assert.match(tauriRecoveryCommandSource, /pub async fn read_recovery_state\(/)
  assert.match(tauriRecoveryCommandSource, /pub async fn write_recovery_draft\(/)
  assert.match(tauriRecoveryCommandSource, /pub async fn clear_all_recovery_drafts\(/)
})

test('前端恢复服务会在启动恢复、文件打开和正式保存后清理三条路径接线', () => {
  assert.equal(fs.existsSync(recoveryStorageSourcePath), true)
  assert.match(recoveryStorageSource, /export\s+const\s+hydrateBootstrapStateFromRecovery/)
  assert.match(recoveryStorageSource, /export\s+const\s+resolveFileContentWithRecovery/)
  assert.match(recoveryStorageSource, /export\s+const\s+writeRecoveryDraftForFile/)
  assert.match(recoveryStorageSource, /export\s+const\s+clearRecoveryDraftForFile/)
  assert.match(toolbarSource, /writeRecoveryDraftForFile/)
  assert.match(toolbarSource, /clearRecoveryDraftForFile/)
  assert.match(workspaceActionsSource, /resolveFileContentWithRecovery/)
  assert.match(mainSource, /hydrateBootstrapStateFromRecovery/)
})

test('工具栏只会在成功解析本地文件后再切换当前文件状态', () => {
  const editLocalFileSection = toolbarSource.match(
    /editLocalFile\(data\)\s*\{[\s\S]*?\n\s{4}\}/
  )
  const openRecentFileSection = toolbarSource.match(
    /openRecentFile\(item\)\s*\{[\s\S]*?\n\s{4}\}/
  )
  const openLocalFileSection = toolbarSource.match(
    /async openLocalFile\(\)\s*\{[\s\S]*?\n\s{4}\}/
  )
  assert.ok(editLocalFileSection)
  assert.ok(openRecentFileSection)
  assert.ok(openLocalFileSection)
  assert.doesNotMatch(editLocalFileSection[0], /setCurrentFileRef\(/)
  assert.doesNotMatch(openRecentFileSection[0], /setCurrentFileRef\(/)
  assert.doesNotMatch(openLocalFileSection[0], /setCurrentFileRef\(/)
  assert.match(toolbarSource, /const normalized = parseToolbarLocalFileContent\(/)
  assert.match(toolbarSource, /setCurrentFileRef\(nextFileRef, nextFileRef\.mode \|\| 'desktop'\)/)
  assert.match(toolbarSource, /setIsHandleLocalFile\(true\)/)
  assert.match(toolbarSource, /Notification\(\{/)
})

test('桌面文件选择器返回的新路径会先登记到运行时白名单，再执行读写或目录遍历', () => {
  assert.match(desktopPlatformSource, /const rememberPickedPath = async selectedPath =>/)
  assert.match(desktopPlatformSource, /await invokeCommand\(\s*'remember_user_selected_path'/)
  assert.match(desktopPlatformSource, /await rememberPickedPath\(selectedPath\)/)
  assert.match(desktopPlatformSource, /await rememberPickedPath\(normalizedSelectedPath\)/)
  assert.match(tauriFsCommandSource, /file_association::PendingAssociatedFiles/)
  assert.match(tauriFsCommandSource, /pub fn remember_user_selected_path\(/)
  assert.match(tauriFsCommandSource, /state\.push_paths\(vec!\[path\]\);/)
})

test('打开本地文件时会跳过程序化 setData 的自动保存，避免把新文件内容串写回旧文件', () => {
  assert.match(editSource, /async setData\(data, options = \{\}\)/)
  assert.match(editSource, /if \(!options\.skipSave\) \{\s*this\.manualSave\(\)\s*\}/)
  assert.match(
    toolbarSource,
    /\$bus\.\$emit\(\s*'setData',\s*normalized\.data,\s*\{\s*skipSave:\s*true\s*\}\s*\)/
  )
  const applyLocalFileResultSection = toolbarSource.match(
    /async applyLocalFileResult\(fileResult, requestId\)\s*\{[\s\S]*?\n\s{4}\}/
  )
  assert.ok(applyLocalFileResultSection)
  assert.equal(
    applyLocalFileResultSection[0].indexOf('setCurrentFileRef(') <
      applyLocalFileResultSection[0].indexOf("$bus.$emit('setData'"),
    true
  )
})

test('状态文件写入使用临时文件加备份回滚，避免替换中途失败导致状态丢失', () => {
  assert.match(tauriAppStateSource, /let backup_path = path\.with_extension\("json\.bak"\)/)
  assert.match(tauriAppStateSource, /tokio::fs::rename\(&path, &backup_path\)/)
  assert.match(tauriAppStateSource, /if let Err\(error\) = tokio::fs::rename\(&temp_path, &path\)\.await/)
  assert.match(tauriAppStateSource, /if original_backed_up \{\s*let _ = tokio::fs::rename\(&backup_path, &path\)\.await;/)
})

test('编辑器初始化失败时会显示可重试的错误状态，而不是只在控制台打印', () => {
  assert.match(editSource, /initErrorMessage/)
  assert.match(editSource, /retryInit\(\)/)
  assert.match(editSource, /editInitError/)
})

test('大纲编辑区使用稳定 key，避免随机 key 导致整棵树反复重建', () => {
  assert.doesNotMatch(outlineSource, /Math\.random\(\)/)
  assert.match(outlineSource, /outlineVersion/)
  assert.match(outlineEditSource, /outlineVersion/)
  assert.match(outlineSource, /OUTLINE_INSERT_ACTIONS/)
})

test('计数面板不再通过 innerHTML 解析整棵树文本', () => {
  assert.doesNotMatch(countSource, /innerHTML =/)
  assert.match(countSource, /DOMParser/)
})

test('鼠标操作面板补齐 useLeftKeySelectionRightKeyDrag 计算属性，消除运行时告警', () => {
  assert.match(mouseActionSource, /useLeftKeySelectionRightKeyDrag\(\)/)
  assert.match(mouseActionSource, /localConfig\.useLeftKeySelectionRightKeyDrag/)
})

test('侧边栏关闭操作统一回落到空字符串，避免 activeSidebar 被写成 null', () => {
  assert.doesNotMatch(nodeNoteSidebarSource, /setActiveSidebar\(null\)/)
  assert.doesNotMatch(nodeIconToolbarSource, /setActiveSidebar\(null\)/)
})

test('xmind 导入导出异常日志改为明确的 console.error', () => {
  assert.doesNotMatch(xmindParseSource, /console\.log\(error\)/)
  assert.doesNotMatch(xmindUtilsSource, /console\.log\(error\)/)
  assert.match(xmindParseSource, /console\.error\('/)
  assert.match(xmindUtilsSource, /console\.error\('/)
})

test('桌面文件系统路径校验按路径段判断保留名，不再对子串误杀', () => {
  assert.match(tauriFsSource, /RESERVED_WINDOWS_NAMES/)
  assert.doesNotMatch(tauriFsSource, /path_lower\.contains\(p\)/)
  assert.match(tauriFsSource, /Component::ParentDir/)
  assert.match(tauriFsSource, /Path::new\(path\)\s*\.extension\(\)/)
  assert.doesNotMatch(tauriFsSource, /lower_path\.ends_with\(ext\)/)
  assert.match(tauriFsSource, /PendingAssociatedFiles/)
  assert.match(tauriFsSource, /pending_associated_files/)
  assert.match(tauriFsSource, /normalize_windows_path_prefix\(&entry\.path\(\)\)/)
  assert.match(tauriFileAssociationSource, /normalize_windows_path_prefix/)
  assert.match(tauriFileAssociationSource, /to_string_lossy\(\)\.to_string\(\)/)
})

test('编辑页和导出页的核心运行时与插件加载失败后会重置缓存 Promise，允许重试', () => {
  assert.match(editSource, /mindMapRuntimePromise = null/)
  assert.match(editSource, /scrollbarPluginPromise = null/)
  assert.match(editSource, /handleClipboardTextPromise = null/)
  assert.match(editSource, /richTextPluginsPromise = null/)
  assert.match(editSource, /exportBasePluginPromise = null/)
  assert.match(exportPageSource, /mindMapRuntimePromise = null/)
  assert.match(exportPageSource, /richTextPluginsPromise = null/)
  assert.match(exportPageSource, /exportBasePluginPromise = null/)
})

test('剪贴板写入、节点图片脚本和 xmind 解析补齐失败保护', () => {
  assert.match(utilsSource, /setDataToClipboard failed/)
  assert.match(utilsSource, /setImgToClipboard failed/)
  assert.match(fs.readFileSync(path.resolve('scripts/createNodeImageList.js'), 'utf8'), /fs\.writeFileSync\(targetDest, content\)/)
  assert.match(xmindUtilsSource, /const target = \(arr \|\| \[\]\)\.find/)
  assert.match(xmindUtilsSource, /return target\?\.elements \|\| null/)
  assert.match(xmindUtilsSource, /split\(\/\[\\\\\/\]\/\)/)
  assert.match(xmindParseSource, /zip\.files\['\\\\content\.xml'\]/)
})

test('核心库插件初始化和富文本容器查询具备异常隔离', () => {
  assert.match(simpleMindMapSource, /try \{\s*this\[plugin\.instanceName\] = new plugin/)
  assert.match(simpleMindMapSource, /this\.opt\.errorHandler\(ERROR_TYPES\.EXEC_COMMAND_ERROR, error\)/)
  assert.match(
    fs.readFileSync(path.resolve('simple-mind-map/src/plugins/RichText.js'), 'utf8'),
    /const wrapEl = document\.querySelector\('\.' \+ RICH_TEXT_EDIT_WRAP\)/
  )
  assert.match(
    fs.readFileSync(path.resolve('simple-mind-map/src/plugins/RichText.js'), 'utf8'),
    /if \(!wrapEl\) return/
  )
})

test('核心库深拷贝在序列化失败时不会把数据直接变成 null', () => {
  assert.match(simpleMindMapSource, /this\.opt\.data = this\.handleData\(this\.opt\.data\)/)
  assert.match(
    fs.readFileSync(path.resolve('simple-mind-map/src/utils/index.js'), 'utf8'),
    /typeof structuredClone === 'function'/
  )
  assert.match(
    fs.readFileSync(path.resolve('simple-mind-map/src/utils/index.js'), 'utf8'),
    /return data/
  )
  assert.doesNotMatch(
    fs.readFileSync(path.resolve('simple-mind-map/src/utils/index.js'), 'utf8'),
    /catch \(error\) \{\s*return null\s*\}/
  )
})

test('平台默认导出不再使用全透传 adapter，导入路径与拼写遗留已清理', () => {
  assert.doesNotMatch(platformSource, /const platformAdapter =/)
  assert.match(platformSource, /export default desktopPlatform/)
  assert.match(simpleMindMapFullSource, /AssociativeLine\.js/)
  assert.match(simpleMindMapFullSource, /RichText\.js/)
  assert.match(zhCnSource, /value: 'structure'/)
  assert.doesNotMatch(zhCnSource, /strusture/)
  assert.match(updateServiceSource, /const RELEASE_REQUEST_TIMEOUT_MS = \d+/)
  assert.match(updateServiceSource, /AbortController/)
})

test('核心库里已确认的真实 bug 被修正', () => {
  assert.match(commandSource, /findIndex\(/)
  assert.doesNotMatch(commandSource, /let index = this\.commands\[name\]\.find\(/)
  assert.doesNotMatch(viewSource, /CONSTANTS\.DIR\.UP \|\| CONSTANTS\.DIR\.LEFT/)
  assert.doesNotMatch(viewSource, /CONSTANTS\.DIR\.DOWN \|\| CONSTANTS\.DIR\.RIGHT/)
  assert.match(viewSource, /some\(dir =>/)
  assert.match(styleSource, /Style\.cacheStyle = new WeakMap\(\)/)
  assert.match(styleSource, /Style\.cacheStyle\.set\(el, /)
  assert.match(styleSource, /Style\.cacheStyle\.get\(el\)/)
  assert.doesNotMatch(styleSource, /Style\.cacheStyle = null/)
})

test('核心渲染链路补齐错误边界与错误码常量', () => {
  assert.match(simpleMindMapConstantsSource, /EXEC_COMMAND_ERROR:\s*'exec_command_error'/)
  assert.match(renderCoreSource, /try\s*\{[\s\S]*this\.layout\.doLayout/)
  assert.match(
    renderCoreSource,
    /this\.mindMap\.opt\.errorHandler\(ERROR_TYPES\.EXEC_COMMAND_ERROR, error\)/
  )
  assert.match(renderCoreSource, /this\.hasWaitRendering = false/)
  assert.match(mindMapNodeSource, /catch\s*\(error\)\s*\{[\s\S]*callback\(\)/)
})

test('主题扩展运行时会先校验 MoreThemes\\.init 是否可调用', () => {
  assert.match(editSource, /typeof globalThis\.MoreThemes\?\.init === 'function'/)
  assert.match(
    exportPageSource,
    /typeof globalThis\.MoreThemes\?\.init === 'function'/
  )
})

test('HTML 导出服务生成无首屏的只读浏览模板', () => {
  assert.equal(fs.existsSync(htmlExportSourcePath), true)
  assert.match(htmlExportSource, /buildMindMapHtmlDocument/)
  assert.match(htmlExportSource, /class="html-export-stage"/)
  assert.match(htmlExportSource, /class="html-export-viewport"/)
  assert.match(htmlExportSource, /class="html-export-canvas"/)
  assert.match(htmlExportSource, /function fitToViewport\(/)
  assert.match(htmlExportSource, /function applyTransform\(/)
  assert.match(htmlExportSource, /wheel', onWheel/)
  assert.match(htmlExportSource, /mousedown', onPointerDown/)
  assert.doesNotMatch(htmlExportSource, /html-export-header/)
  assert.doesNotMatch(htmlExportSource, /toolbar/i)
  assert.doesNotMatch(htmlExportSource, /contenteditable/i)
})

test('HTML 导出服务会转义内联脚本中的 SVG 字符串并避免直接 innerHTML 注入', () => {
  assert.equal(htmlExportSource.includes(".replace(/</g, '\\\\u003c')"), true)
  assert.match(htmlExportSource, /DOMParser\(\)/)
  assert.equal(htmlExportSource.includes("parseFromString(\n          svgMarkup,\n          'image/svg+xml'"), true)
  assert.equal(htmlExportSource.includes('canvas.replaceChildren('), true)
  assert.doesNotMatch(htmlExportSource, /canvas\.innerHTML\s*=/)
})
