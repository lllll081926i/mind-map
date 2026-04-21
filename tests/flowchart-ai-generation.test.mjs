import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const aiServiceSource = fs.readFileSync(
  path.resolve('src/services/aiService.js'),
  'utf8'
)
const flowchartEditorPath = path.resolve('src/pages/Edit/components/FlowchartEditor.vue')

test('AI 服务提供流程图生成消息构造能力', () => {
  assert.match(aiServiceSource, /buildAiCreateFlowchartMessages/)
})

test('流程图编辑器提供 AI 生成入口与结果应用流程', () => {
  assert.equal(fs.existsSync(flowchartEditorPath), true)
  const source = fs.readFileSync(flowchartEditorPath, 'utf8')

  assert.match(source, /generateWithAi/)
  assert.match(source, /buildAiCreateFlowchartMessages/)
  assert.match(source, /normalizeFlowchartAiResult/)
  assert.match(source, /applyGeneratedFlowchart/)
})

test('流程图国际化文案包含导入思维导图文件相关提示', () => {
  const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')

  assert.match(langSource, /"importMindMapFile":\s*"导入导图文件"/)
  assert.match(langSource, /"importMindMapFileDone":\s*"已从导图文件生成流程图"/)
  assert.match(langSource, /"importMindMapFileInvalid":\s*"所选文件不是可转换的思维导图"/)
})
