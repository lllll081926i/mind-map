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
  createDirectoryWorkspaceRef,
  createRecentProjectRef,
  createTemplateProjectRef
} from '@/services/workspaceProjectModel'
import {
  getWorkspaceMetaState,
  setWorkspaceLastDirectory,
  setWorkspaceRecentFiles
} from '@/services/workspaceState'
import { parseExternalJsonSafely } from '@/utils'
import { createDefaultMindMapData } from '@/platform/shared/configSchema'
import { setIsHandleLocalFile, syncRuntimeFromWorkspaceMeta } from '@/stores/runtime'

export const createWorkspaceTemplateData = (title = '思维导图') =>
  createDefaultMindMapData(title)

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

const parseMindMapContent = content => {
  const data = parseExternalJsonSafely(content)
  if (!data || typeof data !== 'object') {
    throw new Error('文件内容不是有效的思维导图数据')
  }
  return normalizeWorkspaceMindMapData(data)
}

const enterEditor = async router => {
  if (!router) return
  if (router.currentRoute.value.path === '/edit') return
  await router.push('/edit')
}

const hydrateWorkspaceFileSession = async (fileRef, content, router) => {
  const normalizedData = parseMindMapContent(content)
  const recentProjectRef = createRecentProjectRef(fileRef)
  setCurrentFileRef(recentProjectRef, recentProjectRef.mode || 'desktop')
  storeData(normalizedData)
  setIsHandleLocalFile(true)
  markDocumentDirty(false)
  await setWorkspaceLastDirectory(recentProjectRef.path || '')
  await recordRecentFile(recentProjectRef)
  syncRuntimeFromWorkspaceMeta(getWorkspaceMetaState())
  await enterEditor(router)
  return {
    fileRef: recentProjectRef,
    content,
    data: normalizedData
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
    const serialized = JSON.stringify(content)
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
    await setWorkspaceLastDirectory(fileRef.path || '')
    return hydrateWorkspaceFileSession(fileRef, serialized, router)
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
    await setWorkspaceLastDirectory(workspaceDirectoryRef.path || '')
    return {
      directoryRef: workspaceDirectoryRef,
      entries: workspaceDirectoryRef.entries
    }
  } catch (error) {
    throw createDesktopFsError(error)
  }
}
