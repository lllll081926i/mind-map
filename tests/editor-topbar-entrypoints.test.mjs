import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const toolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const searchSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Search.vue'),
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
  assert.match(toolbarSource, /class="toolbarBtn fileActionBtn"/)
  assert.match(toolbarSource, /toolbar\.directory/)
  assert.match(toolbarSource, /toolbar\.newFile/)
  assert.match(toolbarSource, /toolbar\.openFile/)
  assert.match(toolbarSource, /toolbar\.saveAs/)
  assert.match(toolbarSource, /toolbar\.import/)
  assert.match(toolbarSource, /toolbar\.exportCenter/)
  assert.match(toolbarSource, /toolbar\.returnHome/)
})

test('编辑页顶部工具栏新增工作流状态区、搜索入口与快捷键入口', () => {
  assert.match(toolbarSource, /class="toolbarStatus"/)
  assert.match(toolbarSource, /class="toolbarQuickActions"/)
  assert.match(toolbarSource, /toolbar\.searchAction/)
  assert.match(toolbarSource, /toolbar\.shortcutAction/)
  assert.match(toolbarSource, /toolbar\.statusSaved/)
  assert.match(toolbarSource, /toolbar\.statusAutosaving/)
  assert.match(toolbarSource, /toolbar\.statusRecovered/)
  assert.match(toolbarSource, /emitShowSearch\(\)/)
  assert.match(toolbarSource, /setActiveSidebar\('shortcutKey'\)/)
})

test('编辑页在切换上下文前会对未保存风险给出确认', () => {
  assert.match(toolbarSource, /async confirmPotentialDataLoss\(/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmMessage/)
  assert.match(toolbarSource, /await this\.confirmPotentialDataLoss\('returnHome'\)/)
  assert.match(toolbarSource, /await this\.confirmPotentialDataLoss\('openFile'\)/)
  assert.match(toolbarSource, /await this\.confirmPotentialDataLoss\('newFile'\)/)
})

test('搜索面板新增结果摘要、上下跳转与当前结果高亮', () => {
  assert.match(searchSource, /class="searchTips"/)
  assert.match(searchSource, /class="searchActions"/)
  assert.match(searchSource, /class="resultSummary"/)
  assert.match(searchSource, /class="searchResultItem"/)
  assert.match(searchSource, /active:\s*activeResultIndex === index/)
  assert.match(searchSource, /search\.resultsSummary/)
  assert.match(searchSource, /search\.usageHint/)
  assert.match(searchSource, /jumpToPrevResult\(\)/)
  assert.match(searchSource, /jumpToNextResult\(\)/)
})
