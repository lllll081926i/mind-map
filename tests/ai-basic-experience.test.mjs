import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const aiChatSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/AiChat.vue'),
  'utf8'
)
const aiCreateSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/AiCreate.vue'),
  'utf8'
)
const aiConfigDialogSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/AiConfigDialog.vue'),
  'utf8'
)
const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')

test('AI 对话侧栏具备空状态、显式会话状态与停止入口', () => {
  assert.match(aiChatSource, /class="chatEmptyState"/)
  assert.match(aiChatSource, /chatDraftProxy/)
  assert.match(aiChatSource, /activeAssistantMessageId/)
  assert.match(aiChatSource, /clearChatSession/)
  assert.match(aiChatSource, /stopChatRequest/)
  assert.match(aiChatSource, /\$t\('ai\.generatingStatus'\)/)
  assert.match(aiChatSource, /\$t\('ai\.chatFooterTip'\)/)
})

test('AI 生成组件拆分对话请求与导图生成请求状态', () => {
  assert.match(aiCreateSource, /activeAiRequestKind/)
  assert.match(aiCreateSource, /isGeneratingMindMapRequest/)
  assert.match(aiCreateSource, /isChatRequest\(\)/)
  assert.match(aiCreateSource, /beginAiRequest\('create-all'\)/)
  assert.match(aiCreateSource, /beginAiRequest\('create-part'\)/)
  assert.match(aiCreateSource, /beginAiRequest\('chat'\)/)
  assert.match(aiCreateSource, /handleAiBusy/)
  assert.match(aiCreateSource, /\$t\('ai\.mindMapGeneratingTip'\)/)
  assert.match(aiCreateSource, /\$t\('ai\.chatRequestInProgressTip'\)/)
})

test('AI 配置弹窗补充基础占位与说明文案', () => {
  assert.match(aiConfigDialogSource, /\$t\('ai\.providerConfigurationTip'\)/)
  assert.match(aiConfigDialogSource, /\$t\('ai\.baseUrlPlaceholder'\)/)
  assert.match(aiConfigDialogSource, /\$t\('ai\.apiPathPlaceholder'\)/)
  assert.match(aiConfigDialogSource, /\$t\('ai\.apiKeyPlaceholder'\)/)
  assert.match(aiConfigDialogSource, /\$t\('ai\.modelPlaceholder'\)/)
  assert.match(aiConfigDialogSource, /\$t\('ai\.portPlaceholder'\)/)
})

test('AI 新文案已接入国际化', () => {
  assert.match(langSource, /"chatEmptyTitle": "从一个明确问题开始"/)
  assert.match(langSource, /"chatFooterTip": "基础版支持连续对话、整图生成和节点续写。"/)
  assert.match(langSource, /"requestInProgressTip": "当前已有 AI 任务在执行，请等待完成或先停止。"/)
  assert.match(langSource, /"providerVolcanoArk": "火山方舟"/)
})
