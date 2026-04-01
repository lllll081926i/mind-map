import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const workspaceActionsPath = path.resolve('src/services/workspaceActions.js')

test('工作台文件操作服务存在并暴露共享动作', () => {
  assert.equal(fs.existsSync(workspaceActionsPath), true)
  const source = fs.readFileSync(workspaceActionsPath, 'utf8')

  assert.match(source, /export\s+const\s+openWorkspaceLocalFile/)
  assert.match(source, /export\s+const\s+createWorkspaceLocalFile/)
  assert.match(source, /export\s+const\s+openWorkspaceRecentFile/)
  assert.match(source, /export\s+const\s+refreshWorkspaceRecentFiles/)
})
