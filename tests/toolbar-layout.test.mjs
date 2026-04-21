import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const toolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const toolbarNodeBtnListSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/ToolbarNodeBtnList.vue'),
  'utf8'
)
const navigatorToolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/NavigatorToolbar.vue'),
  'utf8'
)

test('顶部工具栏按钮样式为文本预留最小宽度并禁止换行', () => {
  assert.match(toolbarSource, /\.toolbarBtn\s*\{[\s\S]*min-width:\s*38px;/)
  assert.match(toolbarSource, /\.text\s*\{[\s\S]*white-space:\s*nowrap;/)
})

test('节点工具栏按钮样式为文本预留最小宽度并禁止换行', () => {
  assert.match(
    toolbarNodeBtnListSource,
    /\.toolbarBtn\s*\{[\s\S]*min-width:\s*38px;[\s\S]*margin-right:\s*4px;/
  )
  assert.match(
    toolbarNodeBtnListSource,
    /\.text\s*\{[\s\S]*white-space:\s*nowrap;/
  )
})

test('顶部与右下角工具栏间距保持紧凑', () => {
  assert.match(toolbarSource, /\.toolbar\s*\{[\s\S]*padding:\s*0 16px;/)
  assert.match(toolbarSource, /\.toolbarBlock:nth-of-type\(2\)\s*\{[\s\S]*gap:\s*4px;/)
  assert.match(navigatorToolbarSource, /\.navigatorContainer\s*\{[\s\S]*padding:\s*0 12px;/)
  assert.match(navigatorToolbarSource, /\.item\s*\{[\s\S]*margin-right:\s*6px;/)
})
