import {
  getWorkspaceMetaState,
  setWorkspaceCurrentDocument,
  setWorkspaceLastDirectory
} from '@/services/workspaceState'
import { normalizeWorkspaceCurrentDocument } from './workspaceSession.js'

const createDefaultSession = () => ({
  fileRef: null,
  source: '',
  dirty: false
})

let sessionState = createDefaultSession()
let bootstrapSyncQueue = Promise.resolve()

const getParentDirectory = filePath => {
  const value = String(filePath || '').trim()
  if (!value) return ''
  const lastSeparatorIndex = Math.max(
    value.lastIndexOf('\\'),
    value.lastIndexOf('/')
  )
  return lastSeparatorIndex >= 0 ? value.slice(0, lastSeparatorIndex) : ''
}

const syncBootstrapState = () => {
  const currentDocument = normalizeWorkspaceCurrentDocument(
    sessionState.fileRef
      ? {
          path: sessionState.fileRef.path || '',
          name: sessionState.fileRef.name || '',
          source: sessionState.source || '',
          dirty: !!sessionState.dirty,
          isFullDataFile: !!sessionState.fileRef.isFullDataFile,
          documentMode: sessionState.fileRef.documentMode || 'mindmap'
        }
      : null
  )
  bootstrapSyncQueue = bootstrapSyncQueue
    .catch(error => {
      console.error('syncBootstrapState previous task failed', error)
    })
    .then(async () => {
      await setWorkspaceCurrentDocument(currentDocument)
      await setWorkspaceLastDirectory(
        currentDocument ? getParentDirectory(currentDocument.path) : ''
      )
      const runtimeModule = await import('@/stores/runtime')
      runtimeModule.syncRuntimeFromWorkspaceMeta(getWorkspaceMetaState())
    })
    .catch(error => {
      console.error('syncBootstrapState failed', error)
    })
}

export const hydrateDocumentSession = () => {
  const bootstrapState = getWorkspaceMetaState()
  if (
    bootstrapState &&
    bootstrapState.currentDocument &&
    bootstrapState.currentDocument.path
  ) {
    const currentDocument = normalizeWorkspaceCurrentDocument(
      bootstrapState.currentDocument
    )
    sessionState = {
      fileRef: {
        mode: 'desktop',
        path: currentDocument?.path || '',
        name: currentDocument?.name || '',
        isFullDataFile: !!currentDocument?.isFullDataFile,
        documentMode: currentDocument?.documentMode || 'mindmap'
      },
      source: currentDocument?.source || 'desktop',
      dirty: !!currentDocument?.dirty
    }
    return sessionState
  }
  sessionState = createDefaultSession()
  return sessionState
}

export const getDocumentSession = () => sessionState

export const getCurrentFileRef = () => sessionState.fileRef

export const setCurrentFileRef = (fileRef, source = '') => {
  sessionState = {
    fileRef: fileRef || null,
    source: source || (fileRef && fileRef.mode) || '',
    dirty: false
  }
  syncBootstrapState()
  return sessionState
}

export const clearCurrentFileRef = () => {
  sessionState = createDefaultSession()
  syncBootstrapState()
  return sessionState
}

export const updateCurrentFileRef = patch => {
  if (!sessionState.fileRef) return sessionState
  sessionState = {
    ...sessionState,
    fileRef: {
      ...sessionState.fileRef,
      ...(patch || {})
    }
  }
  syncBootstrapState()
  return sessionState
}

export const markDocumentDirty = dirty => {
  sessionState = {
    ...sessionState,
    dirty: !!dirty
  }
  syncBootstrapState()
  return sessionState
}

export const setLastDirectory = directoryPath => {
  return setWorkspaceLastDirectory(directoryPath)
}

export const getLastDirectory = () => {
  return getWorkspaceMetaState().lastDirectory || ''
}

export const createDesktopFsError = error => {
  const fallbackMessage = '文件操作失败'
  if (!error) {
    return {
      code: 'UNKNOWN',
      message: fallbackMessage
    }
  }
  if (typeof error === 'object' && error.code && error.message) {
    return error
  }
  const message =
    typeof error === 'string'
      ? error
      : error.message || error.msg || fallbackMessage
  const normalizedMessage = String(message || fallbackMessage)
  if (/not found|系统找不到指定的文件|找不到/.test(normalizedMessage)) {
    return {
      code: 'FILE_NOT_FOUND',
      message: '文件不存在或已被移动'
    }
  }
  if (/permission|denied|拒绝访问|权限/.test(normalizedMessage)) {
    return {
      code: 'PERMISSION_DENIED',
      message: '当前没有权限访问该文件'
    }
  }
  if (/json|unexpected token|parse/i.test(normalizedMessage)) {
    return {
      code: 'INVALID_JSON',
      message: '文件内容不是有效的思维导图数据'
    }
  }
  return {
    code: 'UNKNOWN',
    message: normalizedMessage || fallbackMessage
  }
}
