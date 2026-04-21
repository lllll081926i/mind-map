import { storeData } from '@/api'
import platform, {
  getRecentFiles,
  recordRecentFile
} from '@/platform'
import {
  createDesktopFsError,
  markDocumentDirty,
  getLastDirectory,
  setCurrentFileRef
} from '@/services/documentSession'
import {
  createBlankProjectRef,
  createBlankFlowchartProjectRef,
  createDirectoryWorkspaceRef,
  createRecentProjectRef,
  createTemplateProjectRef,
  createFlowchartTemplateProjectRef
} from '@/services/workspaceProjectModel'
import {
  getWorkspaceMetaState,
  setWorkspaceLastDirectory,
  setWorkspaceRecentFiles
} from '@/services/workspaceState'
import { getWorkspaceResumeEntry } from './workspaceSession.js'
import { createDefaultMindMapData } from '@/platform/shared/configSchema'
import { setIsHandleLocalFile, syncRuntimeFromWorkspaceMeta } from '@/stores/runtime'
import { resolveFileContentWithRecovery } from '@/services/recoveryStorage'
import { parseExternalJsonSafely } from '@/utils/json'
import {
  createDefaultFlowchartData,
  parseStoredDocumentContent as parseStoredDocumentPayload,
  serializeStoredDocumentContent
} from '@/services/flowchartDocument'
import { saveBootstrapStatePatch } from '@/platform'

export const createWorkspaceTemplateData = (title = '思维导图') =>
  createDefaultMindMapData(title)

export const createWorkspaceFlowchartTemplateData = (title = '流程图') =>
  createDefaultFlowchartData(title)

const getDirectoryPath = filePath => {
  const value = String(filePath || '').trim()
  if (!value) return ''
  const lastSeparatorIndex = Math.max(
    value.lastIndexOf('\\'),
    value.lastIndexOf('/')
  )
  return lastSeparatorIndex >= 0 ? value.slice(0, lastSeparatorIndex) : ''
}

const persistWorkspaceLastDirectory = directoryPath => {
  void setWorkspaceLastDirectory(directoryPath).catch(error => {
    console.warn('setWorkspaceLastDirectory failed', error)
  })
}

export const normalizeWorkspaceMindMapData = data => {
  if (data && typeof data === 'object' && data.root) {
    return data
  }
  const baseData = createWorkspaceTemplateData()
  return {
    ...baseData,
    root: data || baseData.root
  }
}

export const parseStoredDocumentContent = content => {
  const parsed =
    typeof content === 'string' ? parseExternalJsonSafely(content) : content
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('文件内容不是有效的项目数据')
  }
  return parseStoredDocumentPayload(parsed)
}

const applyParsedDocumentState = async parsedDocument => {
  if (parsedDocument.documentMode === 'flowchart') {
    await saveBootstrapStatePatch({
      mindMapData: null,
      mindMapConfig: null,
      flowchartData: parsedDocument.flowchartData,
      flowchartConfig: parsedDocument.flowchartConfig || null
    })
    return
  }
  await saveBootstrapStatePatch({
    mindMapData: parsedDocument.mindMapData,
    mindMapConfig: parsedDocument.mindMapConfig || null,
    flowchartData: null,
    flowchartConfig: null
  })
}

const enterEditor = async router => {
  if (!router) return
  if (router.currentRoute.value.path === '/edit') return
  await router.push('/edit')
}

export const resumeWorkspaceSession = async router => {
  const state = getWorkspaceMetaState()
  const resumeEntry = getWorkspaceResumeEntry(state)
  if (!resumeEntry) {
    return null
  }
  setIsHandleLocalFile(!!resumeEntry.path)
  syncRuntimeFromWorkspaceMeta(state)
  await enterEditor(router)
  return resumeEntry
}

const hydrateWorkspaceFileSession = async (fileRef, content, router) => {
  const resolvedContent = await resolveFileContentWithRecovery(fileRef, content)
  const parsedDocument = parseStoredDocumentContent(resolvedContent.content)
  const recentProjectRef = {
    ...createRecentProjectRef(fileRef),
    isFullDataFile: parsedDocument.isFullDataFile,
    documentMode: parsedDocument.documentMode
  }
  setCurrentFileRef(recentProjectRef, recentProjectRef.mode || 'desktop')
  await applyParsedDocumentState(parsedDocument)
  if (parsedDocument.documentMode !== 'flowchart') {
    storeData(parsedDocument.data)
  }
  setIsHandleLocalFile(true)
  markDocumentDirty(!!resolvedContent.recovered)
  persistWorkspaceLastDirectory(getDirectoryPath(recentProjectRef.path || ''))
  void recordRecentFile(recentProjectRef).catch(error => {
    console.warn('recordRecentFile failed', error)
  })
  syncRuntimeFromWorkspaceMeta(getWorkspaceMetaState())
  await enterEditor(router)
  return {
    fileRef: recentProjectRef,
    content: resolvedContent.content,
    data: parsedDocument.data
  }
}

export const refreshWorkspaceRecentFiles = () => {
  const list = getRecentFiles()
  syncRuntimeFromWorkspaceMeta(getWorkspaceMetaState())
  return list
}

export const clearWorkspaceRecentFiles = async () => {
  await setWorkspaceRecentFiles([])
  syncRuntimeFromWorkspaceMeta(getWorkspaceMetaState())
  return []
}

export const openWorkspaceFileRef = async (fileRef, router) => {
  try {
    const result = await platform.readMindMapFile(fileRef)
    return hydrateWorkspaceFileSession(
      {
        ...fileRef,
        ...result
      },
      result.content,
      router
    )
  } catch (error) {
    throw createDesktopFsError(error)
  }
}

export const openWorkspaceLocalFile = async router => {
  try {
    const fileRef = await platform.openMindMapFile({
      defaultPath: getLastDirectory()
    })
    if (!fileRef) return null
    return hydrateWorkspaceFileSession(fileRef, fileRef.content, router)
  } catch (error) {
    throw createDesktopFsError(error)
  }
}

export const createWorkspaceLocalFile = async ({
  router,
  content = createWorkspaceTemplateData(),
  suggestedName = '思维导图'
} = {}) => {
  try {
    const serialized = serializeStoredDocumentContent({
      documentMode: 'mindmap',
      data: content,
      isFullDataFile: true
    })
    const projectRef =
      suggestedName === '思维导图'
        ? createBlankProjectRef(suggestedName)
        : createTemplateProjectRef(suggestedName)
    const fileRef = await platform.saveMindMapFileAs({
      suggestedName: projectRef.title,
      content: serialized,
      defaultPath: getLastDirectory()
    })
    if (!fileRef) return null
    persistWorkspaceLastDirectory(getDirectoryPath(fileRef.path || ''))
    return hydrateWorkspaceFileSession(fileRef, serialized, router)
  } catch (error) {
    throw createDesktopFsError(error)
  }
}

export const createWorkspaceFlowchartFile = async ({
  router,
  content = createWorkspaceFlowchartTemplateData(),
  config = null,
  suggestedName = '流程图'
} = {}) => {
  try {
    const serialized = serializeStoredDocumentContent({
      documentMode: 'flowchart',
      data: content,
      flowchartConfig: config,
      isFullDataFile: true
    })
    const projectRef =
      suggestedName === '流程图'
        ? createBlankFlowchartProjectRef(suggestedName)
        : createFlowchartTemplateProjectRef(suggestedName)
    const fileRef = await platform.saveMindMapFileAs({
      suggestedName: projectRef.title,
      content: serialized,
      defaultPath: getLastDirectory()
    })
    if (!fileRef) return null
    return hydrateWorkspaceFileSession(
      {
        ...fileRef,
        documentMode: 'flowchart'
      },
      serialized,
      router
    )
  } catch (error) {
    throw createDesktopFsError(error)
  }
}

export const openWorkspaceRecentFile = async (item, router) => {
  if (!item || !item.path) return null
  return openWorkspaceFileRef(
    {
      ...item,
      mode: item.mode || 'desktop'
    },
    router
  )
}

export const openWorkspaceDirectory = async () => {
  try {
    const directoryRef = await platform.pickDirectory({
      defaultPath: getLastDirectory()
    })
    if (!directoryRef) return null
    const entries = await platform.listDirectoryEntries(directoryRef)
    const workspaceDirectoryRef = createDirectoryWorkspaceRef(
      directoryRef,
      entries
    )
    persistWorkspaceLastDirectory(workspaceDirectoryRef.path || '')
    return {
      directoryRef: workspaceDirectoryRef,
      entries: workspaceDirectoryRef.entries
    }
  } catch (error) {
    throw createDesktopFsError(error)
  }
}
