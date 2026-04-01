import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const toolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const editIndexSource = fs.readFileSync(
  path.resolve('src/pages/Edit/Index.vue'),
  'utf8'
)

test('编辑页顶部提供返回首页入口', () => {
  assert.match(toolbarSource, /toolbar\.returnHome/)
  assert.match(toolbarSource, /\/home/)
})

test('编辑页导出入口跳转到导出弹窗路由，并由编辑页壳层挂载导出弹窗', () => {
  assert.match(toolbarSource, /\/export/)
  assert.match(toolbarSource, /toolbar\.exportCenter/)
  assert.match(editIndexSource, /ExportDialog/)
  assert.match(editIndexSource, /v-if="isExportRoute"/)
})

test('编辑页页面级入口合并到主工具栏，不再使用独立悬浮层', () => {
  assert.doesNotMatch(toolbarSource, /toolbarPageActions/)
  assert.match(toolbarSource, /pageEntryBtn/)
})
