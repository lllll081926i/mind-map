import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const routerSource = fs.readFileSync(path.resolve('src/router.js'), 'utf8')

test('根路由默认跳转到桌面工作台首页', () => {
  assert.match(routerSource, /path:\s*['"]\/['"][\s\S]*redirect:\s*['"]\/home['"]/)
})

test('桌面工作台首页与编辑页、导出页路由同时存在', () => {
  assert.match(routerSource, /path:\s*['"]\/home['"]/)
  assert.match(routerSource, /path:\s*['"]\/edit['"]/)
  assert.match(routerSource, /path:\s*['"]\/export['"]/)
})
