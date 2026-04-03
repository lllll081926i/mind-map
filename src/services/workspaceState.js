import { getBootstrapState, saveBootstrapStatePatch } from '@/platform'
import { normalizeWorkspaceCurrentDocument } from './workspaceSession.js'

const normalizeRecentFiles = value => {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

export const getWorkspaceMetaState = () => {
  return getBootstrapState()
}

export const setWorkspaceRecentFiles = async recentFiles => {
  const nextState = await saveBootstrapStatePatch({
    recentFiles: normalizeRecentFiles(recentFiles)
  })
  return nextState.recentFiles || []
}

export const setWorkspaceLastDirectory = async lastDirectory => {
  const nextState = await saveBootstrapStatePatch({
    lastDirectory: typeof lastDirectory === 'string' ? lastDirectory : ''
  })
  return nextState.lastDirectory || ''
}

export const setWorkspaceCurrentDocument = async currentDocument => {
  const normalizedCurrentDocument =
    normalizeWorkspaceCurrentDocument(currentDocument)
  const nextState = await saveBootstrapStatePatch({
    currentDocument: normalizedCurrentDocument
  })
  return nextState.currentDocument || null
}
