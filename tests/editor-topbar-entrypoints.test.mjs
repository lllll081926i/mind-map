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
const editSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Edit.vue'),
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

test('编辑页顶部工具栏保留搜索入口并移除状态卡片与快捷键按钮', () => {
  assert.doesNotMatch(toolbarSource, /class="toolbarStatus"/)
  assert.match(toolbarSource, /class="toolbarQuickActions"/)
  assert.match(toolbarSource, /toolbar\.searchAction/)
  assert.match(toolbarSource, /toolbar\.save/)
  assert.match(toolbarSource, /saveCurrentLocalFile/)
  assert.match(toolbarSource, /canDirectSave/)
  assert.match(toolbarSource, /emitShowSearch\(\)/)
  assert.doesNotMatch(toolbarSource, /toolbar\.shortcutAction/)
})

test('编辑页在切换上下文前会对未保存风险给出确认', () => {
  assert.match(toolbarSource, /async confirmPotentialDataLoss\(/)
  assert.match(toolbarSource, /getLeaveConfirmOptions\(/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmMessage/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmReturnHomeTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmOpenFileTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmOpenRecentFileTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmOpenDirectoryTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmEditLocalFileTitle/)
  assert.match(toolbarSource, /toolbar\.leaveConfirmNewFileTitle/)
  assert.match(toolbarSource, /await this\.confirmPotentialDataLoss\('returnHome'\)/)
  assert.match(toolbarSource, /await this\.confirmPotentialDataLoss\('openFile'\)/)
  assert.match(toolbarSource, /await this\.confirmPotentialDataLoss\('newFile'\)/)
})

test('工具栏本地文件读写会保留思维导图 config，并在打开文件时回填到编辑态', () => {
  assert.match(toolbarSource, /configData:\s*parsedDocument\.mindMapConfig \|\| null/)
  assert.match(toolbarSource, /configData:\s*getConfig\(\)/)
  assert.match(toolbarSource, /serializeStoredDocumentContent\(/)
  assert.match(toolbarSource, /mindMapConfig:\s*writeTask\.configData/)
  assert.match(toolbarSource, /configData:\s*normalized\.configData \|\| null/)
  assert.match(editSource, /if \('configData' in options\)/)
  assert.match(editSource, /this\.mindMapConfig = options\.configData \|\| \{\}/)
})

test('编辑页工具栏打开流程图文件时走统一文档解析并切换到流程图模式', () => {
  assert.match(toolbarSource, /parseStoredDocumentContent/)
  assert.match(toolbarSource, /normalized\.documentMode === 'flowchart'/)
  assert.match(toolbarSource, /documentMode:\s*normalized\.documentMode/)
  assert.match(toolbarSource, /flowchartData:\s*normalized\.flowchartData/)
  assert.match(toolbarSource, /flowchartConfig:\s*normalized\.flowchartConfig/)
  assert.doesNotMatch(toolbarSource, /root:\s*data[\s\S]{0,120}documentMode === 'flowchart'/)
})

test('编辑页工具栏打开思维导图文件时清空旧流程图快照', () => {
  assert.match(toolbarSource, /normalized\.documentMode === 'flowchart'/)
  assert.match(toolbarSource, /flowchartData:\s*null/)
  assert.match(toolbarSource, /flowchartConfig:\s*null/)
})

test('编辑器 setData 会先回填导入配置再触发保存，避免写回旧 config', () => {
  const setDataSection = editSource.match(/async setData\(data, options = \{\}\) \{[\s\S]*?\n\s{4}\},/)
  assert.ok(setDataSection)
  assert.ok(
    setDataSection[0].indexOf("if ('configData' in options)") <
      setDataSection[0].indexOf('this.manualSave()')
  )
})

test('搜索面板精简说明区，并支持回车直接开始搜索', () => {
  assert.doesNotMatch(searchSource, /class="searchTips"/)
  assert.doesNotMatch(searchSource, /class="closeBtnBox"/)
  assert.match(searchSource, /class="searchActions"/)
  assert.match(searchSource, /class="searchResultItem"/)
  assert.match(searchSource, /active:\s*activeResultIndex === index/)
  assert.match(searchSource, /@keyup\.enter\.stop\.prevent="onSearchEnter"/)
  assert.match(searchSource, /executeSearch\(\{ restart = false \} = \{\}\)/)
  assert.match(searchSource, /this\.mindMap\.search\.endSearch\(\)/)
  assert.match(searchSource, /toggleSearch\(\)/)
  assert.match(searchSource, /openSearch\(\)/)
  assert.match(searchSource, /jumpToPrevResult\(\)/)
  assert.match(searchSource, /jumpToNextResult\(\)/)
  assert.match(searchSource, /searchDraftText/)
  assert.match(searchSource, /replaceDraftText/)
  assert.match(searchSource, /cacheSearchDraft\(\)/)
  assert.match(searchSource, /restoreSearchDraft\(\)/)
  assert.match(searchSource, /resetSearchDraft\(\)/)
  assert.match(searchSource, /this\.mindMap\.keyCommand\.addShortcut\('Control\+f', this\.toggleSearch\)/)
  assert.match(searchSource, /this\.mindMap\.keyCommand\.removeShortcut\('Control\+f', this\.toggleSearch\)/)
  assert.match(searchSource, /this\.\$refs\.searchInputRef\?\.select\?\.\(\)/)
  assert.match(searchSource, /width: 248px;/)
  assert.match(searchSource, /min-height: 34px;/)
  assert.match(searchSource, /flex: 1;/)
})
