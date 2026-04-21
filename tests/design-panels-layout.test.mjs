import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const sidebarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Sidebar.vue'),
  'utf8'
)
const baseStyleSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/BaseStyle.vue'),
  'utf8'
)
const styleSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Style.vue'),
  'utf8'
)
const themeSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Theme.vue'),
  'utf8'
)
const structureSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Structure.vue'),
  'utf8'
)
const settingSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Setting.vue'),
  'utf8'
)
const configSchemaSource = fs.readFileSync(
  path.resolve('src/platform/shared/configSchema.js'),
  'utf8'
)
const outlineSidebarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/OutlineSidebar.vue'),
  'utf8'
)
const editSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Edit.vue'),
  'utf8'
)
const configSource = fs.readFileSync(path.resolve('src/config/zh.js'), 'utf8')
const sidebarTriggerSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/SidebarTrigger.vue'),
  'utf8'
)
const aiChatSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/AiChat.vue'),
  'utf8'
)
const associativeLineStyleSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/AssociativeLineStyle.vue'),
  'utf8'
)
const formulaSidebarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FormulaSidebar.vue'),
  'utf8'
)
const nodeIconSidebarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/NodeIconSidebar.vue'),
  'utf8'
)
const nodeNoteSidebarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/NodeNoteSidebar.vue'),
  'utf8'
)
const nodeOuterFrameSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/NodeOuterFrame.vue'),
  'utf8'
)

test('设计侧栏壳层使用统一面板头部与内容容器', () => {
  assert.match(sidebarSource, /sidebarPanel/)
  assert.match(sidebarSource, /sidebarPanelHeader/)
  assert.match(sidebarSource, /sidebarPanelBody/)
  assert.match(sidebarSource, /isShown\(\)\s*\{\s*return this\.forceShow/)
  assert.doesNotMatch(sidebarSource, /show:\s*this\.forceShow \|\| false/)
  assert.match(sidebarSource, /entered:\s*false/)
  assert.match(sidebarSource, /syncEnteredState\(isShown\)/)
  assert.match(sidebarSource, /if \(this\.isSwapTransition\) \{\s*this\.entered = true\s*return\s*\}/)
  assert.match(sidebarSource, /requestAnimationFrame\(\(\) =>/)
  assert.match(sidebarSource, /will-change:\s*right,\s*opacity,\s*transform;/)
  assert.match(
    sidebarSource,
    /right 0\.28s cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\),\s*opacity 0\.18s ease,\s*transform 0\.22s ease/
  )
  assert.match(sidebarSource, /const isSwapVisible = this\.isSwapTransition && this\.isShown/)
  assert.match(sidebarSource, /transform:\s*isSwapVisible && !isVisible \? 'translateX\(18px\)' : 'translateX\(0\)'/)
  assert.match(sidebarSource, /pointerEvents:\s*isVisible \? 'auto' : 'none'/)
  assert.match(
    sidebarSource,
    /&\.isSwapTransition[\s\S]*opacity 0\.18s ease,[\s\S]*transform 0\.22s ease;/
  )
})

test('基础样式、节点样式、主题面板保留核心分组', () => {
  assert.match(baseStyleSource, /基础样式|背景|连线/)
  assert.match(styleSource, /节点样式|文字|边框/)
  assert.match(themeSource, /主题/)
})

test('基础样式面板提供仅编辑页生效的背景样式偏好', () => {
  assert.match(configSchemaSource, /editorBackgroundStyle/)
  assert.match(baseStyleSource, /baseStyle\.editorBackgroundStyle/)
  assert.match(baseStyleSource, /baseStyle\.backgroundStyleBlank/)
  assert.match(baseStyleSource, /baseStyle\.backgroundStyleDots/)
  assert.match(baseStyleSource, /baseStyle\.backgroundStyleRule/)
  assert.match(baseStyleSource, /updateLocalConfig\('editorBackgroundStyle',/)
  assert.match(editSource, /editorBackgroundStyleClass\(\)/)
  assert.match(editSource, /mindMapContainerClasses\(\)/)
  assert.match(editSource, /editor-bg-dots/)
  assert.match(editSource, /editor-bg-rule/)
  assert.match(editSource, /\.mindMapContainer[\s\S]*&::before/)
  assert.match(editSource, /editor-bg-rule[\s\S]*linear-gradient\(\s*to right/)
  assert.match(editSource, /editor-bg-rule[\s\S]*linear-gradient\(\s*to bottom/)
})

test('编辑页恢复设置侧边栏入口与挂载', () => {
  assert.match(configSource, /name:\s*'设置'/)
  assert.match(configSource, /value:\s*'setting'/)
  assert.match(
    editSource,
    /<template[\s\S]*v-for="\(\s*SidebarComponent,\s*key\s*\) in primarySidebarComponents"[\s\S]*<component[\s\S]*v-if="shouldMountPrimarySidebar\(key\)"/m
  )
  assert.match(editSource, /PRIMARY_SIDEBAR_COMPONENTS/)
  assert.match(editSource, /setting:\s*Setting/)
  const outlineIndex = configSource.indexOf("value: 'outline'")
  const settingIndex = configSource.indexOf("value: 'setting'")
  assert.notEqual(outlineIndex, -1)
  assert.notEqual(settingIndex, -1)
  assert.equal(settingIndex > outlineIndex, true)
})

test('编辑页主侧边栏通过统一注册表懒挂载并复用实例，不再散落多个页面级面板判断', () => {
  assert.match(editSource, /const PRIMARY_SIDEBAR_COMPONENTS = \{/)
  assert.match(editSource, /mountedPrimarySidebars:/)
  assert.match(editSource, /primarySidebarComponents\(\)/)
  assert.match(editSource, /shouldMountPrimarySidebar\(key\)/)
  assert.match(editSource, /getPrimarySidebarProps\(key\)/)
  assert.match(editSource, /mountAllPrimarySidebars\(\)/)
  assert.match(editSource, /markPrimarySidebarMounted\(value\)/)
  assert.match(
    editSource,
    /<template[\s\S]*v-for="\(\s*SidebarComponent,\s*key\s*\) in primarySidebarComponents"[\s\S]*<component[\s\S]*v-if="shouldMountPrimarySidebar\(key\)"/m
  )
  assert.match(editSource, /outline:\s*OutlineSidebar/)
  assert.match(editSource, /nodeStyle:\s*Style/)
  assert.match(editSource, /baseStyle:\s*BaseStyle/)
  assert.match(editSource, /theme:\s*Theme/)
  assert.match(editSource, /structure:\s*Structure/)
  assert.match(editSource, /setting:\s*Setting/)
  assert.doesNotMatch(editSource, /v-if="mindMap && activeSidebar === 'setting'"/)
  assert.doesNotMatch(editSource, /v-if="mindMap && activeSidebar === 'structure'"/)
  assert.doesNotMatch(editSource, /v-if="mindMap && activeSidebar === 'theme'"/)
})

test('页面级侧边栏组件不再各自写入 sidebar.show，统一由 activeSidebar 驱动', () => {
  assert.doesNotMatch(themeSource, /\$refs\.sidebar\.show = val === 'theme'/)
  assert.doesNotMatch(structureSource, /\$refs\.sidebar\.show = val === 'structure'/)
  assert.doesNotMatch(settingSource, /\$refs\.sidebar\.show = val === 'setting'/)
  assert.doesNotMatch(outlineSidebarSource, /\$refs\.sidebar\.show = val === 'outline'/)
  assert.doesNotMatch(styleSource, /\$refs\.sidebar\.show = val === 'nodeStyle'/)
  assert.doesNotMatch(baseStyleSource, /\$refs\.sidebar\.show = val === 'baseStyle'/)
  assert.doesNotMatch(aiChatSource, /\$refs\.sidebar\.show = val === 'ai'/)
  assert.doesNotMatch(
    associativeLineStyleSource,
    /\$refs\.sidebar\.show = val === 'associativeLineStyle'/
  )
  assert.match(
    associativeLineStyleSource,
    /:force-show="activeSidebar === 'associativeLineStyle'"/
  )
  assert.doesNotMatch(
    formulaSidebarSource,
    /\$refs\.sidebar\.show = val === 'formulaSidebar'/
  )
  assert.doesNotMatch(
    formulaSidebarSource,
    /this\.activeNodes\.length <= 0[\s\S]*setActiveSidebar\(''\)/
  )
  assert.doesNotMatch(
    nodeIconSidebarSource,
    /\$refs\.sidebar\.show = true|\$refs\.sidebar\.show = false/
  )
  assert.doesNotMatch(
    nodeNoteSidebarSource,
    /\$refs\.sidebar\.show = true|\$refs\.sidebar\.show = false/
  )
  assert.doesNotMatch(
    nodeOuterFrameSource,
    /\$refs\.sidebar\.show = val === 'nodeOuterFrameStyle'/
  )
})

test('侧边栏触发器保持可见，并在面板打开时通过位移让出右侧空间', () => {
  assert.match(sidebarTriggerSource, /containerStyle\(\)/)
  assert.match(sidebarTriggerSource, /const activeOffset =/)
  assert.match(sidebarTriggerSource, /right:\s*`\$\{right\}px`/)
  assert.doesNotMatch(sidebarTriggerSource, /right:\s*-60px/)
  assert.match(sidebarTriggerSource, /activeSidebar\(val\)/)
  assert.match(sidebarTriggerSource, /if \(val && !this\.show\)/)
  assert.match(sidebarTriggerSource, /READONLY_ALLOWED_SIDEBARS/)
  assert.match(sidebarTriggerSource, /will-change:\s*right;/)
  assert.match(
    sidebarTriggerSource,
    /right 0\.28s cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/
  )
})
