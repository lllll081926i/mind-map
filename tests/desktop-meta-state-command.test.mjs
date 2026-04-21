import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const configCommandSource = fs.readFileSync(
  path.resolve('src-tauri/src/commands/config.rs'),
  'utf8'
)
const appStateSource = fs.readFileSync(
  path.resolve('src-tauri/src/services/app_state.rs'),
  'utf8'
)
const recoveryServiceSource = fs.readFileSync(
  path.resolve('src-tauri/src/services/recovery.rs'),
  'utf8'
)

test('Tauri 元状态命令只接收和返回 DesktopMetaState', () => {
  assert.match(configCommandSource, /read_bootstrap_meta_state[\s\S]*Result<DesktopMetaState, String>/)
  assert.match(configCommandSource, /write_bootstrap_meta_state[\s\S]*state: DesktopMetaState/)
})

test('Tauri 元状态写入直接落盘 DesktopMetaState，不再要求文档字段', () => {
  const match = appStateSource.match(
    /pub async fn write_meta_state\([\s\S]*?\n\}/
  )
  assert.ok(match, 'write_meta_state 函数应存在')
  const writeMetaStateSource = match[0]

  assert.match(writeMetaStateSource, /state: &DesktopMetaState/)
  assert.match(
    writeMetaStateSource,
    /sanitize_meta_state_for_write\(app, state\)\?/
  )
  assert.match(
    writeMetaStateSource,
    /write_json_file\(meta_state_file_path\(app\)\.await\?, &sanitized\)\.await/
  )
  assert.doesNotMatch(writeMetaStateSource, /split_state\(state\)/)
})

test('Tauri 恢复草稿结构支持流程图字段，避免桌面端恢复链路丢失文档模式', () => {
  assert.match(recoveryServiceSource, /pub document_mode: String/)
  assert.match(recoveryServiceSource, /pub flowchart_data: serde_json::Value/)
  assert.match(recoveryServiceSource, /pub flowchart_config: Option<serde_json::Value>/)
  assert.match(recoveryServiceSource, /input\.document_mode\.trim\(\) == "flowchart"/)
})
