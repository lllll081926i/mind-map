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
const toolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const navigatorToolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/NavigatorToolbar.vue'),
  'utf8'
)
const homeSource = fs.readFileSync(path.resolve('src/pages/Home/Index.vue'), 'utf8')
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
const appSource = fs.readFileSync(path.resolve('src/App.vue'), 'utf8')
const mainSource = fs.readFileSync(path.resolve('src/main.js'), 'utf8')
const tauriConfigSource = fs.readFileSync(
  path.resolve('src-tauri/tauri.conf.json'),
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
const zhCnSource = fs.readFileSync(path.resolve('src/lang/zh_cn.js'), 'utf8')

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
  assert.match(legacyBusSource, /appEvents\.on/)
  assert.match(legacyBusSource, /appEvents\.emit/)
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
  assert.match(homeSource, /:aria-label="folder\.name"/)
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
  assert.match(documentSessionSource, /void saveBootstrapStatePatch\(/)
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

test('外部 JSON 在导入、打开文件与剪贴板路径上走安全解析并过滤危险键', () => {
  assert.match(utilsSource, /const UNSAFE_JSON_KEYS = new Set\(/)
  assert.match(utilsSource, /export const sanitizeExternalJsonValue = value =>/)
  assert.match(utilsSource, /UNSAFE_JSON_KEYS\.has\(key\)/)
  assert.match(utilsSource, /export const parseExternalJsonSafely = input =>/)
  assert.match(importSource, /parseExternalJsonSafely\(evt\.target\.result\)/)
  assert.match(toolbarSource, /parseExternalJsonSafely\(str\)/)
  assert.match(searchSource, /this\.\$nextTick\(\(\) => \{/)
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
  assert.doesNotMatch(appSource, /body \*/)
  assert.doesNotMatch(appSource, /user-select: none;/)
})

test('桌面端外链打开不再通过 cmd start 调 shell，CSP 移除任意 https 图片白名单', () => {
  assert.doesNotMatch(tauriCommandSource, /Command::new\("cmd"\)/)
  assert.match(tauriCommandSource, /Command::new\("rundll32"\)/)
  assert.doesNotMatch(tauriConfigSource, /img-src 'self' data: blob: https:/)
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
})

test('大纲编辑区使用稳定 key，避免随机 key 导致整棵树反复重建', () => {
  assert.doesNotMatch(outlineSource, /Math\.random\(\)/)
  assert.match(outlineSource, /outlineVersion/)
  assert.match(outlineEditSource, /outlineVersion/)
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
})

test('平台默认导出不再使用全透传 adapter，导入路径与拼写遗留已清理', () => {
  assert.doesNotMatch(platformSource, /const platformAdapter =/)
  assert.match(platformSource, /export default desktopPlatform/)
  assert.match(simpleMindMapFullSource, /AssociativeLine\.js/)
  assert.match(simpleMindMapFullSource, /RichText\.js/)
  assert.match(zhCnSource, /structure:/)
  assert.doesNotMatch(zhCnSource, /strusture/)
})
