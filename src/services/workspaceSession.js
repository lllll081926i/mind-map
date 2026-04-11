const DEFAULT_RESUME_TITLE = '未命名项目'

const normalizeRecentFiles = value => {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

const normalizeLastDirectory = value => {
  return typeof value === 'string' ? value : ''
}

const getTitleFromName = value => {
  const name = String(value || '').trim()
  if (!name) return DEFAULT_RESUME_TITLE
  return name.replace(/\.[^.]+$/u, '') || DEFAULT_RESUME_TITLE
}

const getTitleFromPath = value => {
  const path = String(value || '').trim()
  if (!path) return DEFAULT_RESUME_TITLE
  const segments = path.split(/[\\/]/u)
  return getTitleFromName(segments.pop())
}

export const normalizeWorkspaceCurrentDocument = currentDocument => {
  if (
    !currentDocument ||
    typeof currentDocument !== 'object' ||
    typeof currentDocument.path !== 'string'
  ) {
    return null
  }
  const path = currentDocument.path.trim()
  if (!path) {
    return null
  }
  return {
    path,
    name: String(currentDocument.name || '').trim(),
    source: String(currentDocument.source || '').trim(),
    dirty: !!currentDocument.dirty,
    isFullDataFile: !!currentDocument.isFullDataFile
  }
}

export const getWorkspaceResumeEntry = state => {
  const currentDocument = normalizeWorkspaceCurrentDocument(
    state?.currentDocument
  )
  if (!currentDocument) {
    return null
  }
  return {
    ...currentDocument,
    title: getTitleFromName(currentDocument.name) || getTitleFromPath(currentDocument.path)
  }
}

export const hasWorkspaceResumeEntry = state => {
  return !!getWorkspaceResumeEntry(state)
}

export const getWorkspaceSessionState = state => {
  const currentDocument = normalizeWorkspaceCurrentDocument(
    state?.currentDocument
  )
  const resumeEntry = getWorkspaceResumeEntry(state)
  return {
    recentFiles: normalizeRecentFiles(state?.recentFiles),
    lastDirectory: normalizeLastDirectory(state?.lastDirectory),
    currentDocument,
    resumeEntry,
    hasResumeEntry: !!resumeEntry,
    hasDirtyDraft: !!resumeEntry?.dirty
  }
}
