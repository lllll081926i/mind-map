import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const homePagePath = path.resolve('src/pages/Home/Index.vue')

test('桌面工作台首页存在并展示核心入口', () => {
  assert.equal(fs.existsSync(homePagePath), true)
  const source = fs.readFileSync(homePagePath, 'utf8')

  assert.match(source, /\$t\('home\.continueTitle'\)/)
  assert.match(source, /\$t\('home\.continueAction'\)/)
  assert.match(source, /\$t\('home\.createNew'\)/)
  assert.match(source, /\$t\('home\.createFlowchart'\)/)
  assert.match(source, /\$t\('home\.openLocalFile'\)/)
  assert.match(source, /\$t\('home\.openLocalFolder'\)/)
  assert.match(source, /\$t\('home\.recentTitle'\)/)
  assert.match(source, /\$t\('home\.clearRecents'\)/)
})

test('桌面工作台首页不展示会员入口', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.equal(/会员|vip|VIP/.test(source), false)
})

test('桌面工作台首页不再提供设置视图入口', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.doesNotMatch(source, /WorkspaceSettings/)
  assert.doesNotMatch(source, /toggleSettings/)
  assert.doesNotMatch(source, /返回工作台/)
})

test('桌面工作台首页核心文案接入国际化', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.match(source, /\$t\('home\.brandTitle'\)/)
  assert.match(source, /\$t\('home\.continueEmpty'\)/)
  assert.match(source, /\$t\('home\.openLocalFile'\)/)
  assert.match(source, /\$t\('home\.recentTitle'\)/)
  assert.match(source, /\$t\('home\.emptyTitle'\)/)
  assert.match(source, /\$t\('navigatorToolbar\.darkMode'\)/)
  assert.match(source, /\$t\('navigatorToolbar\.lightMode'\)/)
})

test('桌面工作台首页已移除附加说明文案', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.doesNotMatch(source, /\$t\('home\.brandDescription'\)/)
  assert.doesNotMatch(source, /\$t\('home\.openLocalFileDesc'\)/)
  assert.doesNotMatch(source, /\$t\('home\.openLocalFolderDesc'\)/)
  assert.doesNotMatch(source, /\$t\('home\.resumeReadyHint'\)/)
  assert.doesNotMatch(source, /\$t\('home\.resumeDirtyHint'\)/)
  assert.doesNotMatch(source, /\$t\('home\.currentDirectory'\)/)
  assert.doesNotMatch(source, /class="recentHint"/)
})

test('桌面工作台首页左侧栏宽度加宽并延续编辑页扁平化面板样式', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.match(source, /width:\s*320px;/)
  assert.match(source, /display:\s*flex;/)
  assert.match(source, /border-radius:\s*6px;/)
  assert.match(source, /class="resumeCard"/)
})

test('桌面工作台首页已移除工作台信号、上手步骤与体验提示区', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')

  assert.doesNotMatch(source, /class="workspaceSignals"/)
  assert.doesNotMatch(source, /class="signalCard"/)
  assert.doesNotMatch(source, /class="quickStartList"/)
  assert.doesNotMatch(source, /class="quickStartCard"/)
  assert.doesNotMatch(source, /class="experienceGrid"/)
  assert.doesNotMatch(source, /class="experienceCard"/)
  assert.doesNotMatch(source, /\$t\('home\.workspaceSignalsTitle'\)/)
  assert.doesNotMatch(source, /\$t\('home\.quickStartTitle'\)/)
  assert.doesNotMatch(source, /\$t\('home\.experienceTipsTitle'\)/)
  assert.match(source, /scheduleWarmupWorkspaceActions\(\)/)
})

test('桌面工作台首页提供全局明暗主题开关，并沿用思维导图主题记忆能力', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')

  assert.match(source, /class="themeModeToggle"/)
  assert.match(source, /toggleAppearance/)
  assert.match(source, /getPreferredMindMapThemeValue/)
  assert.match(source, /toggleThemeMode/)
  assert.match(source, /createBlankProjectContent\(\)/)
  assert.match(source, /createDefaultMindMapData\('思维导图', themeTemplate\)/)
})
