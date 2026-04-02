import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve('package.json'), 'utf8')
)
const workspaceStateSource = fs.readFileSync(
  path.resolve('src/services/workspaceState.js'),
  'utf8'
)
const workspaceProjectModelSource = fs.readFileSync(
  path.resolve('src/services/workspaceProjectModel.js'),
  'utf8'
)
const workspaceActionsSource = fs.readFileSync(
  path.resolve('src/services/workspaceActions.js'),
  'utf8'
)
const documentSessionSource = fs.readFileSync(
  path.resolve('src/services/documentSession.js'),
  'utf8'
)
const runtimeSource = fs.readFileSync(
  path.resolve('src/stores/runtime.js'),
  'utf8'
)

test('桌面工作区元状态收口为独立服务', () => {
  assert.match(workspaceStateSource, /export const getWorkspaceMetaState = \(\) =>/)
  assert.match(workspaceStateSource, /export const patchWorkspaceMetaState = async patch =>/)
  assert.match(workspaceStateSource, /export const setWorkspaceCurrentDocument = async currentDocument =>/)
  assert.match(workspaceStateSource, /export const setWorkspaceRecentFiles = async recentFiles =>/)
  assert.match(workspaceStateSource, /export const setWorkspaceLastDirectory = async lastDirectory =>/)
})

test('文档会话通过 workspaceState 同步当前文档元数据，而不是直接读写 bootstrap', () => {
  assert.match(documentSessionSource, /from '@\/services\/workspaceState'/)
  assert.doesNotMatch(documentSessionSource, /from '@\/platform'/)
  assert.match(documentSessionSource, /setWorkspaceCurrentDocument\(/)
  assert.match(documentSessionSource, /setWorkspaceLastDirectory\(/)
})

test('runtime store 只负责 Pinia 桥接，不再直接写 recentFiles 和 currentDocument 元状态', () => {
  assert.doesNotMatch(runtimeSource, /export const setRecentFiles =/)
  assert.doesNotMatch(runtimeSource, /export const syncEditorFileSession =/)
  assert.match(runtimeSource, /export const syncRuntimeFromWorkspaceMeta = state =>/)
})

test('桌面项目模型提供统一文件、目录、模板与导出上下文结构', () => {
  assert.match(workspaceProjectModelSource, /export const createBlankProjectRef =/)
  assert.match(workspaceProjectModelSource, /export const createTemplateProjectRef =/)
  assert.match(workspaceProjectModelSource, /export const createRecentProjectRef =/)
  assert.match(workspaceProjectModelSource, /export const createDirectoryWorkspaceRef =/)
  assert.match(workspaceProjectModelSource, /export const createExportContext =/)
  assert.match(workspaceProjectModelSource, /export const getProjectDisplayName =/)
})

test('工作区动作统一复用项目模型和 workspaceState', () => {
  assert.match(workspaceActionsSource, /from '@\/services\/workspaceProjectModel'/)
  assert.match(workspaceActionsSource, /from '@\/services\/workspaceState'/)
  assert.match(workspaceActionsSource, /createBlankProjectRef\(/)
  assert.match(workspaceActionsSource, /createRecentProjectRef\(/)
  assert.match(workspaceActionsSource, /createDirectoryWorkspaceRef\(/)
  assert.match(workspaceActionsSource, /setWorkspaceLastDirectory\(/)
  assert.match(workspaceActionsSource, /setWorkspaceRecentFiles\(/)
})

test('package.json 补充桌面关键路径回归命令', () => {
  assert.equal(
    packageJson.scripts['test:desktop-flow'],
    'node --test tests/desktop-file-flow.test.mjs tests/desktop-export-flow.test.mjs'
  )
})
