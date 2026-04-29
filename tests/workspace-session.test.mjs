import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  getWorkspaceResumeEntry,
  getWorkspaceSessionState,
  hasWorkspaceResumeEntry,
  normalizeWorkspaceCurrentDocument
} from '../src/services/workspaceSession.js'

const configMigrationPath = path.resolve('src/platform/shared/configMigration.js')

const loadConfigMigrationModule = async () => {
  const source = fs
    .readFileSync(configMigrationPath, 'utf8')
    .replace(
      /import\s+\{[\s\S]*?\}\s+from\s+'@\/utils\/aiProviders\.mjs'/,
      `const AI_CONFIG_KEYS = []
       const normalizeAiConfig = value => value || {}
       const separateAppAndAiConfig = value => ({
         localConfig: value || {},
         aiConfig: {}
       })`
    )
    .replace(
      /import\s+\{[\s\S]*?DESKTOP_STATE_VERSION[\s\S]*?\}\s+from\s+'\.\/configSchema'/,
      `const DEFAULT_LOCAL_CONFIG = {}
       const DESKTOP_STATE_VERSION = 1
       const createDefaultMindMapData = () => ({ root: { data: { text: '默认导图' } } })
       const DEFAULT_BOOTSTRAP_STATE = () => ({
         version: DESKTOP_STATE_VERSION,
         mindMapData: null,
         mindMapConfig: null,
         flowchartData: null,
         flowchartConfig: null,
         localConfig: {},
         aiConfig: {},
         recentFiles: [],
         lastDirectory: '',
         currentDocument: null
       })`
    )
    .replace(
      "import { normalizeRecentFiles } from './recentFiles'",
      'const normalizeRecentFiles = value => Array.isArray(value) ? value : []'
    )
    .replace(
      "import { createDefaultFlowchartData } from '@/services/flowchartDocument'",
      "const createDefaultFlowchartData = () => ({ title: '默认流程图', nodes: [] })"
    )
  return import(
    `data:text/javascript;base64,${Buffer.from(source, 'utf8').toString('base64')}`
  )
}

test('workspaceSession 会规范化 currentDocument', () => {
  assert.equal(normalizeWorkspaceCurrentDocument(null), null)
  assert.equal(
    normalizeWorkspaceCurrentDocument({
      path: '   ',
      name: 'demo.smm'
    }),
    null
  )

  assert.deepEqual(
    normalizeWorkspaceCurrentDocument({
      path: 'D:/demo/test.smm',
      name: 'test.smm',
      source: 'desktop',
      dirty: 1,
      isFullDataFile: true,
      documentMode: 'flowchart'
    }),
    {
      path: 'D:/demo/test.smm',
      name: 'test.smm',
      source: 'desktop',
      dirty: true,
      isFullDataFile: true,
      documentMode: 'flowchart'
    }
  )
})

test('workspaceSession 能派生继续工作入口', () => {
  const state = {
    currentDocument: {
      path: 'D:/demo/project.smm',
      name: 'project.smm',
      source: 'desktop',
      dirty: true,
      isFullDataFile: true,
      documentMode: 'flowchart'
    }
  }

  assert.equal(hasWorkspaceResumeEntry(state), true)
  assert.deepEqual(getWorkspaceResumeEntry(state), {
    path: 'D:/demo/project.smm',
    name: 'project.smm',
    source: 'desktop',
    dirty: true,
    isFullDataFile: true,
    documentMode: 'flowchart',
    title: 'project'
  })
})

test('workspaceSession 统一返回首页和编辑页可消费的会话状态', () => {
  const session = getWorkspaceSessionState({
    recentFiles: [{ path: 'D:/demo/a.smm', name: 'a.smm' }, null],
    lastDirectory: 'D:/demo',
    currentDocument: {
      path: 'D:/demo/a.smm',
      name: 'a.smm',
      source: 'desktop',
      dirty: false,
      isFullDataFile: true,
      documentMode: 'flowchart'
    }
  })

  assert.equal(session.lastDirectory, 'D:/demo')
  assert.equal(session.recentFiles.length, 1)
  assert.equal(session.hasResumeEntry, true)
  assert.equal(session.hasDirtyDraft, false)
  assert.equal(session.resumeEntry?.title, 'a')
  assert.equal(session.currentDocument?.isFullDataFile, true)
  assert.equal(session.currentDocument?.documentMode, 'flowchart')
})

test('文档状态归一化会保留显式置空的跨模式数据快照', async () => {
  const { normalizeBootstrapDocumentState } = await loadConfigMigrationModule()
  const normalized = normalizeBootstrapDocumentState({
    version: 1,
    mindMapData: null,
    mindMapConfig: null,
    flowchartData: null,
    flowchartConfig: null
  })

  assert.equal(normalized.mindMapData, null)
  assert.equal(normalized.flowchartData, null)
})
