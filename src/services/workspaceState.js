import { getBootstrapState, saveBootstrapStatePatch } from '@/platform'

const getMetaSnapshot = state => ({
  recentFiles: Array.isArray(state?.recentFiles) ? state.recentFiles : [],
  lastDirectory: String(state?.lastDirectory || ''),
  currentDocument:
    state?.currentDocument && typeof state.currentDocument === 'object'
      ? {
          path: String(state.currentDocument.path || ''),
          name: String(state.currentDocument.name || ''),
          source: String(state.currentDocument.source || ''),
          dirty: !!state.currentDocument.dirty
        }
      : null
})

export const getWorkspaceMetaState = () => {
  return getMetaSnapshot(getBootstrapState())
}

export const patchWorkspaceMetaState = async patch => {
  await saveBootstrapStatePatch(patch || {})
  return getWorkspaceMetaState()
}

export const setWorkspaceCurrentDocument = async currentDocument => {
  return patchWorkspaceMetaState({
    currentDocument: currentDocument || null
  })
}

export const setWorkspaceRecentFiles = async recentFiles => {
  return patchWorkspaceMetaState({
    recentFiles: Array.isArray(recentFiles) ? recentFiles : []
  })
}

export const setWorkspaceLastDirectory = async lastDirectory => {
  return patchWorkspaceMetaState({
    lastDirectory: String(lastDirectory || '').trim()
  })
}
