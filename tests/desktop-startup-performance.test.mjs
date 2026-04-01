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
const toolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const apiSource = fs.readFileSync(path.resolve('src/api/index.js'), 'utf8')
const configMigrationSource = fs.readFileSync(
  path.resolve('src/platform/shared/configMigration.js'),
  'utf8'
)
const mainSource = fs.readFileSync(path.resolve('src/main.js'), 'utf8')
const simpleMindMapPackageSource = fs.readFileSync(
  path.resolve('simple-mind-map/package.json'),
  'utf8'
)

test('工作台首页不再直接引入 simple-mind-map 示例数据链路', () => {
  assert.equal(/simple-mind-map\/example\/exampleData/.test(homeSource), false)
  assert.equal(/simple-mind-map\/src\/utils\/index/.test(homeSource), false)
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
})

test('编辑页不再静态引入思维导图核心运行时', () => {
  assert.equal(/import MindMap from 'simple-mind-map'/.test(editPageSource), false)
  assert.equal(
    /import Themes from 'simple-mind-map-plugin-themes'/.test(editPageSource),
    false
  )
  assert.match(editPageSource, /import\('simple-mind-map'\)/)
  assert.match(editPageSource, /import\('simple-mind-map-plugin-themes'\)/)
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

test('编辑页按需加载剪贴板图片处理工具，避免首包回流 mind-map util', () => {
  assert.equal(
    /import handleClipboardText from ['"]@\/utils\/handleClipboardText['"]/.test(
      editPageSource
    ),
    false
  )
  assert.match(editPageSource, /import\('@\/utils\/handleClipboardText'\)/)
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

test('桌面启动失败提示通过国际化文案提供', () => {
  assert.match(mainSource, /i18n\.global\.t\('app\.initFailed'\)/)
})

test('simple-mind-map 依赖使用非漏洞 quill 版本', () => {
  assert.match(simpleMindMapPackageSource, /"quill": "2\.0\.2"/)
})
