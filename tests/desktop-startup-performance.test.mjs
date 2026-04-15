import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const homeSource = fs.readFileSync(
  path.resolve('src/pages/Home/Index.vue'),
  'utf8'
)
const workspaceActionsSource = fs.readFileSync(
  path.resolve('src/services/workspaceActions.js'),
  'utf8'
)
const workspaceSettingsSource = fs.readFileSync(
  path.resolve('src/pages/Home/components/WorkspaceSettings.vue'),
  'utf8'
)
const exportPageSource = fs.readFileSync(
  path.resolve('src/pages/Export/Index.vue'),
  'utf8'
)
const editPageSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Edit.vue'),
  'utf8'
)
const aiChatSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/AiChat.vue'),
  'utf8'
)
const toolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const importSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Import.vue'),
  'utf8'
)
const clipboardSource = fs.readFileSync(
  path.resolve('src/utils/handleClipboardText.js'),
  'utf8'
)
const apiSource = fs.readFileSync(path.resolve('src/api/index.js'), 'utf8')
const configMigrationSource = fs.readFileSync(
  path.resolve('src/platform/shared/configMigration.js'),
  'utf8'
)
const mainSource = fs.readFileSync(path.resolve('src/main.js'), 'utf8')
const viteConfigSource = fs.readFileSync(path.resolve('vite.config.js'), 'utf8')
const simpleMindMapPackageSource = fs.readFileSync(
  path.resolve('simple-mind-map/package.json'),
  'utf8'
)

test('工作台首页不再直接引入 simple-mind-map 示例数据链路', () => {
  assert.equal(/simple-mind-map\/example\/exampleData/.test(homeSource), false)
  assert.equal(/simple-mind-map\/src\/utils\/index/.test(homeSource), false)
})

test('首页工作台动作改为按需异步加载，避免首屏直接打入文件系统动作链', () => {
  assert.doesNotMatch(homeSource, /from '@\/services\/workspaceActions'/)
  assert.match(homeSource, /const loadWorkspaceActions = async \(\) =>/)
  assert.match(homeSource, /import\('@\/services\/workspaceActions'\)/)
  assert.match(homeSource, /scheduleRefreshHomeData\(\)/)
})

test('应用入口关联文件处理改为按需加载工作区动作，避免启动主包携带文件动作链', () => {
  assert.doesNotMatch(mainSource, /from '@\/services\/workspaceActions'/)
  assert.match(mainSource, /const loadWorkspaceActions = async \(\) =>/)
  assert.match(mainSource, /import\('@\/services\/workspaceActions'\)/)
  assert.match(mainSource, /const \{ openWorkspaceFileRef \} = await loadWorkspaceActions\(\)/)
})

test('工作台文件动作服务不再直接依赖 simple-mind-map 示例数据', () => {
  assert.equal(
    /simple-mind-map\/example\/exampleData/.test(workspaceActionsSource),
    false
  )
  assert.equal(
    /simple-mind-map\/src\/utils\/index/.test(workspaceActionsSource),
    false
  )
})

test('JSON 解析入口改为直接依赖轻量 json 工具，避免误拉取 DOMPurify', () => {
  assert.match(workspaceActionsSource, /from '@\/utils\/json'/)
  assert.match(toolbarSource, /from '@\/utils\/json'/)
  assert.match(importSource, /from '@\/utils\/json'/)
  assert.match(clipboardSource, /from '@\/utils\/json'/)
  assert.doesNotMatch(workspaceActionsSource, /from '@\/utils'/)
  assert.doesNotMatch(toolbarSource, /from '@\/utils'/)
  assert.doesNotMatch(importSource, /from '@\/utils'/)
  assert.doesNotMatch(clipboardSource, /from '@\/utils'/)
})

test('首页不再引入桌面设置视图', () => {
  assert.doesNotMatch(homeSource, /WorkspaceSettings/)
  assert.doesNotMatch(homeSource, /defineAsyncComponent/)
})

test('AI 配置弹窗改为按需异步加载', () => {
  assert.match(workspaceSettingsSource, /defineAsyncComponent/)
  assert.match(
    workspaceSettingsSource,
    /import\('@\/pages\/Edit\/components\/AiConfigDialog\.vue'\)/
  )
})

test('导出页不再静态引入思维导图核心运行时', () => {
  assert.equal(/import MindMap from 'simple-mind-map'/.test(exportPageSource), false)
  assert.equal(
    /import Themes from 'simple-mind-map-plugin-themes'/.test(exportPageSource),
    false
  )
  assert.match(exportPageSource, /import\('simple-mind-map'\)/)
  assert.match(exportPageSource, /import\('simple-mind-map-plugin-themes'\)/)
  assert.match(exportPageSource, /hasExtendedNodeIcons/)
  assert.match(exportPageSource, /ensureExportPluginsInstalled/)
})

test('编辑页不再静态引入思维导图核心运行时', () => {
  assert.equal(/import MindMap from 'simple-mind-map'/.test(editPageSource), false)
  assert.equal(
    /import Themes from 'simple-mind-map-plugin-themes'/.test(editPageSource),
    false
  )
  assert.match(editPageSource, /import\('simple-mind-map'\)/)
  assert.match(editPageSource, /import\('simple-mind-map-plugin-themes'\)/)
  assert.match(editPageSource, /hasExtendedNodeIcons/)
  assert.match(editPageSource, /ensureExtendedIconListLoaded/)
})

test('编辑页不再直接依赖 simple-mind-map 示例数据链路', () => {
  assert.equal(/simple-mind-map\/example\/exampleData/.test(editPageSource), false)
  assert.equal(/simple-mind-map\/src\/utils\/index/.test(editPageSource), false)
})

test('编辑工具栏不再直接依赖 simple-mind-map 示例数据', () => {
  assert.equal(/simple-mind-map\/example\/exampleData/.test(toolbarSource), false)
})

test('桌面启动核心状态模块不再直接依赖 simple-mind-map 示例数据链路', () => {
  assert.equal(/simple-mind-map\/example\/exampleData/.test(apiSource), false)
  assert.equal(/simple-mind-map\/src\/utils\/index/.test(apiSource), false)
  assert.equal(
    /simple-mind-map\/example\/exampleData/.test(configMigrationSource),
    false
  )
  assert.equal(
    /simple-mind-map\/src\/utils\/index/.test(configMigrationSource),
    false
  )
})

test('编辑页核心重子组件改为按需异步加载', () => {
  assert.match(
    editPageSource,
    /import\('\.\/NavigatorToolbar\.vue'\)/
  )
  assert.match(
    editPageSource,
    /import\('\.\/Contextmenu\.vue'\)/
  )
  assert.match(editPageSource, /import\('\.\/Search\.vue'\)/)
  assert.match(
    editPageSource,
    /import\('\.\/NodeIconSidebar\.vue'\)/
  )
  assert.match(
    editPageSource,
    /import\('\.\/NodeIconToolbar\.vue'\)/
  )
  assert.match(
    editPageSource,
    /import\('\.\/OutlineEdit\.vue'\)/
  )
  assert.match(
    editPageSource,
    /import\('\.\/NodeOuterFrame\.vue'\)/
  )
})

test('编辑页次级 UI 延后挂载，优先让主画布进入可用态', () => {
  assert.match(editPageSource, /secondaryUiReady: false/)
  assert.match(editPageSource, /scheduleSecondaryUiMount\(\)/)
  assert.match(editPageSource, /cancelSecondaryUiMount\(\)/)
  assert.match(editPageSource, /<Navigator[\s\S]*secondaryUiReady/m)
  assert.match(editPageSource, /<Search[\s\S]*secondaryUiReady/m)
  assert.match(editPageSource, /<NodeIconToolbar[\s\S]*secondaryUiReady/m)
})

test('编辑页初始化并行等待关键资源，避免串行阻塞进入编辑器', () => {
  assert.match(editPageSource, /Promise\.all\(\s*\[/)
  assert.match(editPageSource, /loadHandleClipboardText\(\)/)
  assert.match(editPageSource, /loadMindMapRuntime\(\)/)
  assert.match(editPageSource, /this\.waitForMindMapContainerReady\(\)/)
})

test('编辑页把次级插件拆到延后加载链路，避免主画布初始化一次性吃下全部插件', () => {
  assert.match(editPageSource, /let deferredMindMapPluginsPromise = null/)
  assert.match(editPageSource, /const loadDeferredMindMapPlugins = async \(\) =>/)
  assert.match(editPageSource, /async ensureDeferredMindMapPluginsReady\(\)/)
  assert.match(editPageSource, /await this\.ensureDeferredMindMapPluginsReady\(\)/)
  assert.match(editPageSource, /if \(!deferredPluginsReady \|\| !this\.mindMap\)/)
})

test('编辑页等待延后插件成功后再挂载次级 UI 和启动画家模式，避免插件缺失时挂载依赖组件', () => {
  assert.match(editPageSource, /async finalizeSecondaryUiMount\(\)/)
  assert.match(editPageSource, /const deferredPluginsReady = await this\.ensureDeferredMindMapPluginsReady\(\)/)
  assert.match(editPageSource, /async handleStartPainter\(\)/)
  assert.match(editPageSource, /if \(!deferredPluginsReady\) \{\s*return/s)
})

test('编辑页按需加载剪贴板图片处理工具，避免首包回流 mind-map util', () => {
  assert.equal(
    /import handleClipboardText from ['"]@\/utils\/handleClipboardText['"]/.test(
      editPageSource
    ),
    false
  )
  assert.match(editPageSource, /import\('@\/utils\/handleClipboardText'\)/)
})

test('编辑页与导出页不再无条件预取扩展图标资源，导出插件也延后到真正导出时再安装', () => {
  assert.doesNotMatch(editPageSource, /const \{ default: icon \} = await import\('@\/config\/icon'\)/)
  assert.doesNotMatch(exportPageSource, /const \{ default: icon \} = await import\('@\/config\/icon'\)/)
  const previewBootstrapSection = exportPageSource.split(
    'async ensureExportPluginsInstalled'
  )[0]
  assert.doesNotMatch(previewBootstrapSection, /loadExportPlugins\(\)/)
  assert.match(exportPageSource, /await this\.ensureExportPluginsInstalled\(resolvedType\)/)
})

test('工具栏布局计算不再通过递归 nextTick 试探按钮数量', () => {
  assert.doesNotMatch(toolbarSource, /const loopCheck = \(\) =>/)
  assert.doesNotMatch(
    toolbarSource,
    /\$nextTick\(\(\) => \{[\s\S]*loopCheck\(\)/m
  )
  assert.match(toolbarSource, /toolbarMeasureBlockRef/)
  assert.match(toolbarSource, /getOuterWidth\(/)
})

test('编辑页使用稳定的事件转发器并在销毁前解绑', () => {
  assert.match(editPageSource, /bindMindMapEvents\(\)/)
  assert.match(editPageSource, /unbindMindMapEvents\(\)/)
  assert.doesNotMatch(
    editPageSource,
    /this\.mindMap\.on\(event,\s*\(\.\.\.args\)\s*=>\s*\{/
  )
})

test('编辑页仅在存在富文本内容或首次进入富文本编辑时才加载富文本插件', () => {
  assert.match(editPageSource, /const hasRichTextNodes = data =>/)
  assert.match(editPageSource, /async ensureRichTextPluginReady\(\)/)
  assert.match(editPageSource, /beforeTextEdit: async \(node, isInserting\) =>/)
  assert.match(editPageSource, /await this\.ensureRichTextPluginReady\(\)/)
  assert.match(editPageSource, /if \(hasRichTextNodes\(initialData\)\)/)
  assert.match(
    editPageSource,
    /if \(hasRichTextNodes\(initialData\)\) \{\s*if \(this\.openNodeRichText\) \{\s*tasks\.push\(this\.addRichTextPlugin\(\)\)/
  )
})

test('导出页预览仅在文档包含富文本节点时才加载富文本插件', () => {
  assert.match(exportPageSource, /const hasRichTextNodes = data =>/)
  assert.match(exportPageSource, /if \(hasRichTextNodes\(fullData\)\)/)
  assert.doesNotMatch(
    exportPageSource,
    /if \(this\.localConfig\.openNodeRichText\) \{\s*const \{ RichText, Formula \} = await loadRichTextPlugins\(\)/m
  )
})

test('桌面启动失败提示通过国际化文案提供', () => {
  assert.match(mainSource, /i18n\.global\.t\('app\.initFailed'\)/)
})

test('simple-mind-map 不固定到已知受影响的 quill 2.0.3', () => {
  assert.match(simpleMindMapPackageSource, /"quill": "2\.0\.2"/)
  assert.doesNotMatch(simpleMindMapPackageSource, /"quill": "2\.0\.3"/)
})

test('应用入口改为按需解析 Element Plus 组件，不再在 main.js 手动全量注册', () => {
  assert.doesNotMatch(mainSource, /const elementComponents = \[/)
  assert.doesNotMatch(mainSource, /app\.component\(component\.name, component\)/)
  assert.match(
    viteConfigSource,
    /unplugin-vue-components\/vite/
  )
  assert.match(
    viteConfigSource,
    /ElementPlusResolver/
  )
})

test('桌面构建关闭 module preload，避免首页预取编辑器重资源', () => {
  assert.match(viteConfigSource, /modulePreload:\s*false/)
})

test('桌面构建把编辑器次级插件拆到独立 chunk，避免主路径吞掉次级能力代码', () => {
  assert.match(viteConfigSource, /mind-map-plugins-deferred/)
  assert.match(viteConfigSource, /MiniMap\.js/)
  assert.match(viteConfigSource, /Painter\.js/)
  assert.match(viteConfigSource, /Demonstrate\.js/)
})

test('AI 聊天侧边栏仅在激活时挂载，避免编辑页常驻占用', () => {
  assert.match(editPageSource, /<AiChat v-if="enableAi && activeSidebar === 'ai'"><\/AiChat>/)
  assert.doesNotMatch(editPageSource, /<AiChat v-if="enableAi"><\/AiChat>/)
})

test('AI 聊天渲染器改为在侧边栏激活时按需准备，而不是 created 阶段预热', () => {
  const createdSection = aiChatSource.match(
    /created\(\)\s*\{[\s\S]*?\n\s{2}\},\n\s{2}mounted/
  )
  assert.ok(createdSection)
  assert.doesNotMatch(createdSection[0], /prepareRenderer\(\)/)
  assert.match(aiChatSource, /activeSidebar\(value\)/)
  assert.match(aiChatSource, /if \(value === 'ai'\)/)
  assert.match(aiChatSource, /void this\.prepareRenderer\(\)/)
})

test('大纲编辑面板仅在进入大纲编辑模式时挂载', () => {
  assert.match(
    editPageSource,
    /<OutlineEdit v-if="mindMap && isOutlineEdit" :mindMap="mindMap"><\/OutlineEdit>/
  )
  assert.doesNotMatch(
    editPageSource,
    /<OutlineEdit v-if="mindMap" :mindMap="mindMap"><\/OutlineEdit>/
  )
})

test('编辑页和导出弹窗的 resize 同步改为 requestAnimationFrame 限流，并在卸载时清理', () => {
  assert.match(editPageSource, /resizeFrame: 0/)
  assert.match(editPageSource, /cancelAnimationFrame\(this\.resizeFrame\)/)
  assert.match(editPageSource, /this\.resizeFrame = requestAnimationFrame\(/)
  assert.doesNotMatch(editPageSource, /handleResize\(\)\s*\{\s*this\.mindMap\?\.resize\(\)\s*\}/m)
  assert.match(exportPageSource, /previewResizeFrame: 0/)
  assert.match(exportPageSource, /cancelAnimationFrame\(this\.previewResizeFrame\)/)
  assert.match(exportPageSource, /this\.previewResizeFrame = requestAnimationFrame\(/)
})
