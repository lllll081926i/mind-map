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

test('顶部工具栏按钮样式为文本预留最小宽度并禁止换行', () => {
  assert.match(toolbarSource, /\.toolbarBtn\s*\{[\s\S]*min-width:\s*52px;/)
  assert.match(toolbarSource, /\.text\s*\{[\s\S]*white-space:\s*nowrap;/)
})

test('节点工具栏按钮样式为文本预留最小宽度并禁止换行', () => {
  assert.match(
    toolbarNodeBtnListSource,
    /\.toolbarBtn\s*\{[\s\S]*min-width:\s*52px;/
  )
  assert.match(
    toolbarNodeBtnListSource,
    /\.text\s*\{[\s\S]*white-space:\s*nowrap;/
  )
})
