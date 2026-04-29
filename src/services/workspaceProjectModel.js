const DEFAULT_PROJECT_NAME = '思维导图'

const getBaseName = filePath => {
  return String(filePath || '')
    .split(/[\\/]/)
    .pop()
}

const stripExtension = fileName => {
  return String(fileName || '').replace(/\.[^.]+$/u, '')
}

const normalizeTitle = value => {
  const title = String(value || '').trim()
  return title || DEFAULT_PROJECT_NAME
}

const normalizeFileName = value => {
  const fileName = String(value || '').trim()
  return fileName || `${DEFAULT_PROJECT_NAME}.smm`
}

export const createBlankProjectRef = title => {
  const normalizedTitle = normalizeTitle(title)
  return {
    kind: 'blank',
    mode: 'desktop',
    title: normalizedTitle,
    name: `${normalizedTitle}.smm`,
    path: '',
    documentMode: 'mindmap'
  }
}

export const createTemplateProjectRef = title => {
  const normalizedTitle = normalizeTitle(title)
  return {
    kind: 'template',
    mode: 'desktop',
    title: normalizedTitle,
    name: `${normalizedTitle}.smm`,
    path: '',
    documentMode: 'mindmap'
  }
}

export const createBlankFlowchartProjectRef = title => {
  const normalizedTitle = normalizeTitle(title || '流程图')
  return {
    kind: 'blank',
    mode: 'desktop',
    title: normalizedTitle,
    name: `${normalizedTitle}.smm`,
    path: '',
    documentMode: 'flowchart'
  }
}

export const createFlowchartTemplateProjectRef = title => {
  const normalizedTitle = normalizeTitle(title || '流程图')
  return {
    kind: 'template',
    mode: 'desktop',
    title: normalizedTitle,
    name: `${normalizedTitle}.smm`,
    path: '',
    documentMode: 'flowchart'
  }
}

export const createRecentProjectRef = fileRef => {
  const path = String(fileRef?.path || '').trim()
  const name = normalizeFileName(fileRef?.name || getBaseName(path))
  return {
    kind: 'recent',
    mode: fileRef?.mode || 'desktop',
    path,
    name,
    title: normalizeTitle(stripExtension(name)),
    updatedAt: Number(fileRef?.updatedAt || Date.now()),
    documentMode:
      String(fileRef?.documentMode || '').trim() === 'flowchart'
        ? 'flowchart'
        : 'mindmap'
  }
}

export const createDirectoryWorkspaceRef = (directoryRef, entries = []) => {
  const path = String(directoryRef?.path || '').trim()
  const name = normalizeTitle(directoryRef?.name || getBaseName(path))
  return {
    kind: 'directory',
    mode: directoryRef?.mode || 'desktop',
    path,
    name,
    title: name,
    entries: Array.isArray(entries) ? entries : []
  }
}

export const createExportContext = fileRef => {
  const recentProjectRef = fileRef
    ? createRecentProjectRef(fileRef)
    : createBlankProjectRef(DEFAULT_PROJECT_NAME)
  return {
    fileRef: recentProjectRef,
    fileName: normalizeTitle(stripExtension(recentProjectRef.name))
  }
}
