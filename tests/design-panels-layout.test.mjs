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
  assert.match(sidebarSource, /will-change:\s*right,\s*opacity;/)
  assert.match(
    sidebarSource,
    /right 0\.28s cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\),\s*opacity 0\.18s ease/
  )
  assert.match(sidebarSource, /&\.isSwapTransition[\s\S]*transition:\s*opacity 0\.18s ease;/)
})

test('基础样式、节点样式、主题面板保留核心分组', () => {
  assert.match(baseStyleSource, /基础样式|背景|连线/)
  assert.match(styleSource, /节点样式|文字|边框/)
  assert.match(themeSource, /主题/)
})

test('编辑页恢复设置侧边栏入口与挂载', () => {
  assert.match(configSource, /name:\s*'设置'/)
  assert.match(configSource, /value:\s*'setting'/)
  assert.match(editSource, /<component\s+:is="primarySidebarComponent"/)
  assert.match(editSource, /PRIMARY_SIDEBAR_COMPONENTS/)
  assert.match(editSource, /setting:\s*Setting/)
  const outlineIndex = configSource.indexOf("value: 'outline'")
  const settingIndex = configSource.indexOf("value: 'setting'")
  assert.notEqual(outlineIndex, -1)
  assert.notEqual(settingIndex, -1)
  assert.equal(settingIndex > outlineIndex, true)
})

test('编辑页主侧边栏通过单一动态宿主挂载，不再散落多个页面级面板判断', () => {
  assert.match(editSource, /const PRIMARY_SIDEBAR_COMPONENTS = \{/)
  assert.match(editSource, /primarySidebarComponent\(\)/)
  assert.match(editSource, /primarySidebarProps\(\)/)
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
})
