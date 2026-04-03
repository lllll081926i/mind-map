import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const aiStoreSource = fs.readFileSync(path.resolve('src/stores/ai.js'), 'utf8')

test('AI store 提供基础会话持久化与消息更新能力', () => {
  assert.match(aiStoreSource, /AI_CHAT_STORAGE_KEY/)
  assert.match(aiStoreSource, /hydrateChatSession\(\)/)
  assert.match(aiStoreSource, /persistChatSession\(\)/)
  assert.match(aiStoreSource, /setChatDraft\(value\)/)
  assert.match(aiStoreSource, /appendUserMessage\(content\)/)
  assert.match(aiStoreSource, /appendAssistantPlaceholder\(\)/)
  assert.match(aiStoreSource, /updateAssistantMessage\(/)
  assert.match(aiStoreSource, /startChatRequest\(question\)/)
  assert.match(aiStoreSource, /finishChatRequest\(/)
  assert.match(aiStoreSource, /failChatRequest\(/)
  assert.match(aiStoreSource, /stopChatRequest\(/)
  assert.match(aiStoreSource, /clearChatSession\(\)/)
})

test('AI store 会限制会话长度并导出历史消息构建能力', () => {
  assert.match(aiStoreSource, /MAX_CHAT_MESSAGES = 30/)
  assert.match(aiStoreSource, /slice\(-MAX_CHAT_MESSAGES\)/)
  assert.match(aiStoreSource, /getHistoryMessages\(\)/)
  assert.match(aiStoreSource, /includeInHistory/)
})
