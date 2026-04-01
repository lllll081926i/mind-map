import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const homePagePath = path.resolve('src/pages/Home/Index.vue')

test('桌面工作台首页存在并展示核心入口', () => {
  assert.equal(fs.existsSync(homePagePath), true)
  const source = fs.readFileSync(homePagePath, 'utf8')

  assert.match(source, /\$t\('home\.createNew'\)/)
  assert.match(source, /\$t\('home\.createFromTemplate'\)/)
  assert.match(source, /\$t\('home\.openLocalFile'\)/)
  assert.match(source, /\$t\('home\.openLocalFolder'\)/)
  assert.match(source, /\$t\('home\.recentTitle'\)/)
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
  assert.match(source, /\$t\('home\.refresh'\)/)
  assert.match(source, /\$t\('home\.openLocalFile'\)/)
  assert.match(source, /\$t\('home\.recentTitle'\)/)
})

test('桌面工作台首页左侧栏宽度加宽并延续编辑页扁平化面板样式', () => {
  const source = fs.readFileSync(homePagePath, 'utf8')
  assert.match(source, /grid-template-columns:\s*320px 1fr;/)
  assert.match(source, /border-radius:\s*8px;/)
  assert.match(source, /box-shadow:\s*0 2px 16px 0 rgba\(0, 0, 0, 0\.06\);/)
})
