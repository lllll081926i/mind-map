import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const workspaceActionsPath = path.resolve('src/services/workspaceActions.js')
const desktopPlatformPath = path.resolve('src/platform/desktop/index.js')
const platformPath = path.resolve('src/platform/index.js')
const recoveryStoragePath = path.resolve('src/services/recoveryStorage.js')

test('工作台文件操作服务存在并暴露共享动作', () => {
  assert.equal(fs.existsSync(workspaceActionsPath), true)
  const source = fs.readFileSync(workspaceActionsPath, 'utf8')

  assert.match(source, /export\s+const\s+openWorkspaceLocalFile/)
  assert.match(source, /export\s+const\s+createWorkspaceLocalFile/)
  assert.match(source, /export\s+const\s+createWorkspaceFlowchartFile/)
  assert.match(source, /export\s+const\s+openWorkspaceRecentFile/)
  assert.match(source, /export\s+const\s+refreshWorkspaceRecentFiles/)
  assert.match(source, /export\s+const\s+resumeWorkspaceSession/)
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
  assert.match(
    source,
    /const shouldDownload =\s*currentEntry\.pendingDownload \|\| nextEntry\.pendingDownload/
  )
  assert.match(source, /if \(shouldDownload\) \{/)
})

test('工作台打开文件时会保留源文件是否为完整数据文件的上下文', () => {
  const source = fs.readFileSync(workspaceActionsPath, 'utf8')

  assert.match(source, /parseStoredDocumentContent/)
  assert.match(source, /flushDocumentSessionSync/)
  assert.match(source, /documentMode:\s*parsedDocument\.documentMode/)
  assert.match(source, /setCurrentFileRef\(recentProjectRef, recentProjectRef\.mode \|\| 'desktop'\)/)
  assert.match(source, /await flushDocumentSessionSync\(\)/)
  assert.match(source, /isFullDataFile:\s*parsedDocument\.isFullDataFile/)
})

test('桌面平台暴露恢复文件读写和清理能力', () => {
  const desktopSource = fs.readFileSync(desktopPlatformPath, 'utf8')
  const platformSource = fs.readFileSync(platformPath, 'utf8')

  assert.match(desktopSource, /async readRecoveryState\(/)
  assert.match(desktopSource, /async readRecoveryDraft\(/)
  assert.match(desktopSource, /async writeRecoveryDraft\(/)
  assert.match(desktopSource, /async clearRecoveryDraft\(/)
  assert.match(desktopSource, /async clearAllRecoveryDrafts\(/)
  assert.match(desktopSource, /documentMode/)
  assert.match(desktopSource, /flowchartData/)
  assert.match(desktopSource, /flowchartConfig/)
  assert.match(platformSource, /export default desktopPlatform/)
})

test('工作台文件流会优先读取匹配文件的恢复草稿', () => {
  assert.equal(fs.existsSync(recoveryStoragePath), true)
  const recoverySource = fs.readFileSync(recoveryStoragePath, 'utf8')
  const workspaceSource = fs.readFileSync(workspaceActionsPath, 'utf8')

  assert.match(recoverySource, /export\s+const\s+resolveFileContentWithRecovery/)
  assert.match(recoverySource, /platform\.readRecoveryDraft\(/)
  assert.match(workspaceSource, /resolveFileContentWithRecovery/)
})

test('恢复草稿链路支持流程图文档的序列化和回填', () => {
  const recoverySource = fs.readFileSync(recoveryStoragePath, 'utf8')

  assert.match(recoverySource, /documentMode/)
  assert.match(recoverySource, /flowchartData/)
  assert.match(recoverySource, /flowchartConfig/)
  assert.match(recoverySource, /serializeStoredDocumentContent\(/)
  assert.match(recoverySource, /currentDocument:\s*\{[\s\S]*documentMode:/)
})

test('工作台切换文档模式时会清空另一种文档的数据快照，避免跨文档污染', () => {
  const source = fs.readFileSync(workspaceActionsPath, 'utf8')

  assert.match(
    source,
    /if \(parsedDocument\.documentMode === 'flowchart'\) \{[\s\S]*mindMapData:\s*null,[\s\S]*mindMapConfig:\s*null/
  )
  assert.match(
    source,
    /await saveBootstrapStatePatch\(\{[\s\S]*mindMapData:\s*parsedDocument\.mindMapData,[\s\S]*flowchartData:\s*null,[\s\S]*flowchartConfig:\s*null/
  )
})

test('工作台创建流程图文件时会把流程图配置一并写入文档', () => {
  const source = fs.readFileSync(workspaceActionsPath, 'utf8')

  assert.match(source, /config\s*=\s*null/)
  assert.match(source, /flowchartConfig:\s*config/)
})
