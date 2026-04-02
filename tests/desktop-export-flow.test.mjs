import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const exportStateSource = fs.readFileSync(
  path.resolve('src/services/exportState.js'),
  'utf8'
)
const exportPageSource = fs.readFileSync(
  path.resolve('src/pages/Export/Index.vue'),
  'utf8'
)
const editIndexSource = fs.readFileSync(
  path.resolve('src/pages/Edit/Index.vue'),
  'utf8'
)
const releaseChecklistSource = fs.readFileSync(
  path.resolve('docs/release/desktop-release-checklist.md'),
  'utf8'
)

test('导出状态服务提供标准化导出上下文', () => {
  assert.match(exportStateSource, /from '@\/services\/workspaceProjectModel'/)
  assert.match(exportStateSource, /export const createExportStateFromFileRef = fileRef =>/)
  assert.match(exportStateSource, /export const resolveExportContext = fileRef =>/)
  assert.match(exportStateSource, /createExportContext\(/)
})

test('导出弹窗通过标准化导出上下文初始化文件名和格式', () => {
  assert.match(exportPageSource, /resolveExportContext\(/)
  assert.match(exportPageSource, /createExportStateFromFileRef\(/)
  assert.match(exportPageSource, /currentFileExtension/)
  assert.match(exportPageSource, /safeFileName/)
})

test('导出弹窗继续挂在编辑页壳层，保持编辑上下文不丢失', () => {
  assert.match(editIndexSource, /ExportDialog/)
  assert.match(editIndexSource, /v-if="isExportRoute"/)
})

test('发版清单纳入桌面关键路径回归命令', () => {
  assert.match(releaseChecklistSource, /npm run test:desktop-flow/)
  assert.match(releaseChecklistSource, /新建文件/)
  assert.match(releaseChecklistSource, /打开文件/)
  assert.match(releaseChecklistSource, /打开文件夹/)
  assert.match(releaseChecklistSource, /编辑保存/)
  assert.match(releaseChecklistSource, /导出/)
  assert.match(releaseChecklistSource, /最近文件恢复/)
})
