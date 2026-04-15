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
  assert.match(source, /\$t\('home\.openLocalFile'\)/)
  assert.match(source, /\$t\('home\.openLocalFolder'\)/)
  assert.match(source, /\$t\('home\.recentTitle'\)/)
  assert.match(source, /\$t\('home\.clearRecents'\)/)
  assert.match(source, /\$t\('home\.workspaceSignalsTitle'\)/)
  assert.match(source, /\$t\('home\.quickStartTitle'\)/)
  assert.match(source, /\$t\('home\.experienceTipsTitle'\)/)
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
  assert.match(source, /\$t\('home\.brandDescription'\)/)
  assert.match(source, /\$t\('home\.continueEmpty'\)/)
  assert.match(source, /\$t\('home\.resumeDirtyHint'\)/)
  assert.match(source, /\$t\('home\.openLocalFile'\)/)
  assert.match(source, /\$t\('home\.recentTitle'\)/)
  assert.match(source, /\$t\('home\.emptyTitle'\)/)
  assert.match(source, /\$t\('home\.quickStartCreateTitle'\)/)
  assert.match(source, /\$t\('home\.quickStartExportTitle'\)/)
  assert.match(source, /\$t\('home\.searchTipTitle'\)/)
  assert.match(source, /\$t\('home\.recoveryTipTitle'\)/)
})

test('桌面工作台首页左侧栏宽度加宽并延续编辑页扁平化面板样式', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.match(source, /width:\s*320px;/)
  assert.match(source, /display:\s*flex;/)
  assert.match(source, /border-radius:\s*6px;/)
  assert.match(source, /class="resumeCard"/)
})

test('桌面工作台首页新增工作台信号、上手步骤与体验提示区', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')

  assert.match(source, /class="workspaceSignals"/)
  assert.match(source, /class="signalCard"/)
  assert.match(source, /class="quickStartList"/)
  assert.match(source, /class="quickStartCard"/)
  assert.match(source, /class="experienceGrid"/)
  assert.match(source, /class="experienceCard"/)
  assert.match(source, /scheduleWarmupWorkspaceActions\(\)/)
})
