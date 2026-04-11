import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const homePageSource = fs.readFileSync(
  path.resolve('src/pages/Home/Index.vue'),
  'utf8'
)
const workspaceActionsSource = fs.readFileSync(
  path.resolve('src/services/workspaceActions.js'),
  'utf8'
)
const editorStoreSource = fs.readFileSync(
  path.resolve('src/stores/editor.js'),
  'utf8'
)
const runtimeStoreSource = fs.readFileSync(
  path.resolve('src/stores/runtime.js'),
  'utf8'
)
const mainSource = fs.readFileSync(path.resolve('src/main.js'), 'utf8')
const recoveryStoragePath = path.resolve('src/services/recoveryStorage.js')

test('首页提供继续工作卡片并走统一恢复动作', () => {
  assert.match(homePageSource, /class="resumeCard"/)
  assert.match(homePageSource, /continueWorkspace/)
  assert.match(homePageSource, /resumeWorkspaceSession\(this\.\$router\)/)
})

test('工作区动作服务暴露恢复会话入口', () => {
  assert.match(workspaceActionsSource, /export\s+const\s+resumeWorkspaceSession/)
  assert.match(workspaceActionsSource, /getWorkspaceResumeEntry/)
  assert.match(workspaceActionsSource, /await enterEditor\(router\)/)
})

test('editor 与 runtime store 已同步工作区派生状态', () => {
  assert.match(editorStoreSource, /currentDocument/)
  assert.match(editorStoreSource, /resumeEntry/)
  assert.match(editorStoreSource, /hasResumeEntry/)
  assert.match(editorStoreSource, /hasDirtyDraft/)
  assert.match(editorStoreSource, /syncWorkspaceSession/)
  assert.match(runtimeStoreSource, /getWorkspaceSessionState/)
  assert.match(runtimeStoreSource, /editorStore\.syncWorkspaceSession/)
})

test('应用启动时会读取恢复草稿并回填到 bootstrap 工作区状态', () => {
  assert.equal(fs.existsSync(recoveryStoragePath), true)
  const source = fs.readFileSync(recoveryStoragePath, 'utf8')

  assert.match(source, /export\s+const\s+hydrateBootstrapStateFromRecovery/)
  assert.match(source, /platform\.readRecoveryState\(/)
  assert.match(source, /platform\.readRecoveryDraft\(/)
  assert.match(source, /saveBootstrapStatePatch\(/)
  assert.match(mainSource, /hydrateBootstrapStateFromRecovery/)
})
