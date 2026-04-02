const DEFAULT_PROJECT_TITLE = '思维导图'

const getSafeText = value => String(value || '').trim()

const getPathSegments = filePath => {
  return getSafeText(filePath)
    .split(/[\\/]/)
    .filter(Boolean)
}

export const getProjectDisplayName = input => {
  const explicitName = getSafeText(input?.name || input?.title)
  if (explicitName) {
    return explicitName
  }
  const segments = getPathSegments(input?.path)
  return segments.length > 0 ? segments[segments.length - 1] : DEFAULT_PROJECT_TITLE
}

export const normalizeProjectFileRef = (input = {}, fallback = {}) => {
  const path = getSafeText(input.path || fallback.path)
  const title = getSafeText(input.title || fallback.title)
  const name = getProjectDisplayName({
    ...fallback,
    ...input,
    title
  })
  return {
    id: path || `memory://${Date.now()}/${name || DEFAULT_PROJECT_TITLE}`,
    kind: 'file',
    mode: getSafeText(input.mode || fallback.mode) || 'desktop',
    source: getSafeText(input.source || fallback.source) || 'local',
    path,
    name,
    title: title || name.replace(/\.[^./\\]+$/, ''),
    updatedAt: Number(input.updatedAt || fallback.updatedAt || Date.now())
  }
}

export const createBlankProjectRef = (title = DEFAULT_PROJECT_TITLE) => {
  const normalizedTitle = getSafeText(title) || DEFAULT_PROJECT_TITLE
  return normalizeProjectFileRef({
    name: `${normalizedTitle}.smm`,
    title: normalizedTitle,
    source: 'blank'
  })
}

export const createTemplateProjectRef = template => {
  const templateName = getSafeText(template?.name || template) || DEFAULT_PROJECT_TITLE
  return normalizeProjectFileRef({
    name: `${templateName}.smm`,
    title: templateName,
    source: 'template'
  })
}

export const createRecentProjectRef = input => {
  return normalizeProjectFileRef(input, {
    source: 'recent'
  })
}

export const createDirectoryWorkspaceRef = (directoryRef = {}, entries = []) => {
  const path = getSafeText(directoryRef.path)
  return {
    id: path || `workspace://${Date.now()}`,
    kind: 'directory',
    mode: getSafeText(directoryRef.mode) || 'desktop',
    source: 'directory',
    path,
    name: getProjectDisplayName(directoryRef),
    entries: Array.isArray(entries) ? entries : [],
    updatedAt: Number(directoryRef.updatedAt || Date.now())
  }
}

export const createExportContext = fileRef => {
  const normalizedFileRef = normalizeProjectFileRef(fileRef, {
    name: `${DEFAULT_PROJECT_TITLE}.smm`,
    title: DEFAULT_PROJECT_TITLE,
    source: 'export'
  })
  return {
    fileRef: normalizedFileRef,
    fileName: normalizedFileRef.title || DEFAULT_PROJECT_TITLE,
    extension: normalizedFileRef.name.includes('.')
      ? normalizedFileRef.name.split('.').pop()
      : 'smm'
  }
}
