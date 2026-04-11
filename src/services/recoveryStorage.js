import platform, {
  getBootstrapState,
  isDesktopApp,
  saveBootstrapStatePatch
} from '@/platform'

const createDefaultRecoveryState = () => ({
  rootPath: '',
  origin: '',
  entries: []
})

let recoveryState = createDefaultRecoveryState()

const getFileName = filePath => {
  return String(filePath || '')
    .split(/[\\/]/)
    .pop()
}

const getDirectoryPath = filePath => {
  const value = String(filePath || '').trim()
  if (!value) return ''
  const lastSeparatorIndex = Math.max(
    value.lastIndexOf('\\'),
    value.lastIndexOf('/')
  )
  return lastSeparatorIndex >= 0 ? value.slice(0, lastSeparatorIndex) : ''
}

const normalizeRecoveryEntry = entry => {
  if (!entry || typeof entry !== 'object') return null
  const sourcePath = String(entry.sourcePath || '').trim()
  if (!sourcePath) return null
  return {
    documentId: String(entry.documentId || '').trim(),
    title: String(entry.title || '').trim(),
    sourcePath,
    updatedAt: Number(entry.updatedAt || 0),
    dirty: !!entry.dirty,
    draftFile: String(entry.draftFile || '').trim(),
    origin: String(entry.origin || '').trim()
  }
}

const normalizeRecoveryDraft = draft => {
  if (!draft || typeof draft !== 'object') return null
  const sourcePath = String(draft.sourcePath || '').trim()
  if (!sourcePath) return null
  return {
    ...normalizeRecoveryEntry(draft),
    isFullDataFile: !!draft.isFullDataFile,
    mindMapData:
      draft.mindMapData && typeof draft.mindMapData === 'object'
        ? draft.mindMapData
        : null,
    mindMapConfig:
      draft.mindMapConfig && typeof draft.mindMapConfig === 'object'
        ? draft.mindMapConfig
        : null,
    fileRef: draft.fileRef && typeof draft.fileRef === 'object' ? draft.fileRef : null
  }
}

const normalizeRecoveryState = value => {
  return {
    rootPath: String(value?.rootPath || '').trim(),
    origin: String(value?.origin || '').trim(),
    entries: Array.isArray(value?.entries)
      ? value.entries.map(normalizeRecoveryEntry).filter(Boolean)
      : []
  }
}

const serializeRecoveryContent = draft => {
  if (!draft || !draft.mindMapData) {
    return null
  }
  const data = draft.isFullDataFile
    ? draft.mindMapData
    : draft.mindMapData.root || draft.mindMapData
  return JSON.stringify(data)
}

const getTargetRecoveryEntry = (state, bootstrapState) => {
  const currentPath = String(bootstrapState?.currentDocument?.path || '').trim()
  if (currentPath) {
    const matchedEntry = state.entries.find(entry => entry.sourcePath === currentPath)
    if (matchedEntry) {
      return matchedEntry
    }
  }
  return state.entries[0] || null
}

export const getRecoveryState = () => recoveryState

export const refreshRecoveryState = async () => {
  if (!isDesktopApp()) {
    recoveryState = createDefaultRecoveryState()
    return recoveryState
  }
  recoveryState = normalizeRecoveryState(await platform.readRecoveryState())
  return recoveryState
}

export const readRecoveryDraftForFile = async fileRef => {
  const sourcePath = String(fileRef?.path || '').trim()
  if (!isDesktopApp() || !sourcePath) {
    return null
  }
  return normalizeRecoveryDraft(
    await platform.readRecoveryDraft({
      sourcePath
    })
  )
}

export const resolveFileContentWithRecovery = async (fileRef, fallbackContent) => {
  const draft = await readRecoveryDraftForFile(fileRef)
  if (!draft?.dirty || !draft.mindMapData) {
    return {
      content: fallbackContent,
      recovered: false,
      draft: null
    }
  }
  return {
    content: serializeRecoveryContent(draft) || fallbackContent,
    recovered: true,
    draft
  }
}

export const writeRecoveryDraftForFile = async ({
  fileRef,
  data,
  config = null,
  isFullDataFile = true
} = {}) => {
  const sourcePath = String(fileRef?.path || '').trim()
  if (!isDesktopApp() || !sourcePath || !data || typeof data !== 'object') {
    return null
  }
  const draft = normalizeRecoveryDraft(
    await platform.writeRecoveryDraft({
      sourcePath,
      title: String(fileRef?.name || getFileName(sourcePath)).trim(),
      dirty: true,
      updatedAt: Date.now(),
      isFullDataFile: !!isFullDataFile,
      mindMapData: data,
      mindMapConfig: config && typeof config === 'object' ? config : null,
      fileRef: fileRef && typeof fileRef === 'object' ? fileRef : null
    })
  )
  void refreshRecoveryState().catch(error => {
    console.warn('refreshRecoveryState after writeRecoveryDraftForFile failed', error)
  })
  return draft
}

export const clearRecoveryDraftForFile = async fileRef => {
  const sourcePath = String(fileRef?.path || '').trim()
  if (!isDesktopApp() || !sourcePath) {
    return null
  }
  const result = await platform.clearRecoveryDraft({
    sourcePath
  })
  await refreshRecoveryState()
  return result
}

export const clearAllRecoveryDrafts = async () => {
  if (!isDesktopApp()) {
    recoveryState = createDefaultRecoveryState()
    return {
      rootPath: '',
      origin: '',
      deletedCount: 0,
      failedCount: 0
    }
  }
  const result = await platform.clearAllRecoveryDrafts()
  await refreshRecoveryState()
  if (getBootstrapState().currentDocument?.dirty) {
    await saveBootstrapStatePatch({
      currentDocument: null,
      mindMapData: null,
      mindMapConfig: null
    })
    const runtimeModule = await import('@/stores/runtime')
    runtimeModule.syncRuntimeFromWorkspaceMeta(getBootstrapState())
  }
  return result
}

export const hydrateBootstrapStateFromRecovery = async (
  bootstrapState = getBootstrapState()
) => {
  if (!isDesktopApp()) {
    return recoveryState
  }
  const state = await refreshRecoveryState()
  if (!state.entries.length) {
    return state
  }
  const entry = getTargetRecoveryEntry(state, bootstrapState)
  if (!entry) {
    return state
  }
  const draft = normalizeRecoveryDraft(
    await platform.readRecoveryDraft({
      sourcePath: entry.sourcePath
    })
  )
  if (!draft?.mindMapData) {
    return state
  }
  await saveBootstrapStatePatch({
    currentDocument: {
      path: draft.sourcePath,
      name: String(draft.fileRef?.name || getFileName(draft.sourcePath)).trim(),
      source: 'desktop',
      dirty: !!draft.dirty,
      isFullDataFile: !!draft.isFullDataFile
    },
    lastDirectory: getDirectoryPath(draft.sourcePath),
    mindMapData: draft.mindMapData,
    mindMapConfig: draft.mindMapConfig || null
  })
  return state
}
