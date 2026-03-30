const MAX_RECENT_FILES = 20

const normalizePath = value => String(value || '').trim()

export const normalizeRecentFiles = list => {
  if (!Array.isArray(list)) return []
  const map = new Map()
  list.forEach(item => {
    const path = normalizePath(item && item.path)
    if (!path) return
    const updatedAt = Number(item.updatedAt || Date.now())
    const current = map.get(path)
    if (current && current.updatedAt > updatedAt) {
      return
    }
    map.set(path, {
      path,
      name: String(item.name || path.split(/[\\/]/).pop() || path),
      updatedAt
    })
  })
  return [...map.values()]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_RECENT_FILES)
}

export const upsertRecentFile = (list, nextItem) => {
  const path = normalizePath(nextItem && nextItem.path)
  if (!path) return normalizeRecentFiles(list)
  return normalizeRecentFiles([
    {
      path,
      name: String(nextItem.name || path.split(/[\\/]/).pop() || path),
      updatedAt: Date.now()
    },
    ...(Array.isArray(list) ? list : []).filter(item => {
      return normalizePath(item && item.path) !== path
    })
  ])
}
