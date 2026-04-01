import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const workspaceActionsPath = path.resolve('src/services/workspaceActions.js')
const desktopPlatformPath = path.resolve('src/platform/desktop/index.js')

test('工作台文件操作服务存在并暴露共享动作', () => {
  assert.equal(fs.existsSync(workspaceActionsPath), true)
  const source = fs.readFileSync(workspaceActionsPath, 'utf8')

  assert.match(source, /export\s+const\s+openWorkspaceLocalFile/)
  assert.match(source, /export\s+const\s+createWorkspaceLocalFile/)
  assert.match(source, /export\s+const\s+openWorkspaceRecentFile/)
  assert.match(source, /export\s+const\s+refreshWorkspaceRecentFiles/)
})

test('桌面平台在无 Tauri 注入时会回退到浏览器文件桥接，避免首页新建直接崩溃', () => {
  assert.equal(fs.existsSync(desktopPlatformPath), true)
  const source = fs.readFileSync(desktopPlatformPath, 'utf8')

  assert.match(source, /const createBrowserTauriModules = \(\) =>/)
  assert.match(source, /MAX_BROWSER_FILE_STORE_SIZE = 12/)
  assert.match(source, /const setBrowserFileEntry = \(path, entry\) =>/)
  assert.match(source, /while \(browserFileStore\.size > MAX_BROWSER_FILE_STORE_SIZE\)/)
  assert.match(source, /if \(!isDesktopRuntime\(\)\)/)
  assert.match(source, /typeof core\?\.invoke !== 'function'/)
  assert.match(source, /return createBrowserTauriModules\(\)/)
  assert.match(source, /downloadBrowserFile/)
})
