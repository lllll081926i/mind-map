import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getWorkspaceResumeEntry,
  getWorkspaceSessionState,
  hasWorkspaceResumeEntry,
  normalizeWorkspaceCurrentDocument
} from '../src/services/workspaceSession.js'

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
      dirty: 1
    }),
    {
      path: 'D:/demo/test.smm',
      name: 'test.smm',
      source: 'desktop',
      dirty: true
    }
  )
})

test('workspaceSession 能派生继续工作入口', () => {
  const state = {
    currentDocument: {
      path: 'D:/demo/project.smm',
      name: 'project.smm',
      source: 'desktop',
      dirty: true
    }
  }

  assert.equal(hasWorkspaceResumeEntry(state), true)
  assert.deepEqual(getWorkspaceResumeEntry(state), {
    path: 'D:/demo/project.smm',
    name: 'project.smm',
    source: 'desktop',
    dirty: true,
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
      dirty: false
    }
  })

  assert.equal(session.lastDirectory, 'D:/demo')
  assert.equal(session.recentFiles.length, 1)
  assert.equal(session.hasResumeEntry, true)
  assert.equal(session.hasDirtyDraft, false)
  assert.equal(session.resumeEntry?.title, 'a')
})
