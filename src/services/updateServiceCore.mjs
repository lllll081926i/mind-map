export const normalizeVersion = version => {
  return String(version || '')
    .trim()
    .replace(/^v/i, '')
}

export const formatReleasePublishedAt = publishedAt => {
  const value = String(publishedAt || '').trim()
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const createReleaseNotesPreview = (notes, maxLength = 280) => {
  const normalized = String(notes || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

const toVersionParts = version => {
  return normalizeVersion(version)
    .split('.')
    .map(part => Number.parseInt(part, 10) || 0)
}

export const compareVersions = (currentVersion, targetVersion) => {
  const left = toVersionParts(currentVersion)
  const right = toVersionParts(targetVersion)
  const maxLength = Math.max(left.length, right.length)
  for (let index = 0; index < maxLength; index += 1) {
    const current = left[index] || 0
    const target = right[index] || 0
    if (current === target) continue
    return current > target ? 1 : -1
  }
  return 0
}

export const parseUpdateManifest = (data, fallbackUrl = '') => {
  if (!data || typeof data !== 'object' || !data.version) {
    const error = new Error('更新清单格式无效')
    error.i18nKey = 'errors.updateManifestInvalid'
    throw error
  }

  return {
    version: normalizeVersion(data.version),
    notes: String(data.notes || data.body || ''),
    url: String(data.url || fallbackUrl || '').trim()
  }
}

export const parseGitHubLatestRelease = (data, fallbackUrl = '') => {
  if (!data || typeof data !== 'object' || !data.tag_name) {
    const error = new Error('GitHub Release 数据格式无效')
    error.i18nKey = 'errors.githubReleaseInvalid'
    throw error
  }

  return {
    version: normalizeVersion(data.tag_name),
    releaseName: String(data.name || '').trim(),
    notes: String(data.body || ''),
    url: String(data.html_url || fallbackUrl || '').trim(),
    publishedAt: String(data.published_at || data.created_at || '').trim()
  }
}

export const createManualUpdateResult = (currentVersion, manifest) => {
  const comparison = compareVersions(currentVersion, manifest.version)
  if (comparison < 0) {
    return {
      status: 'update-available',
      latestVersion: manifest.version,
      releaseName: String(manifest.releaseName || '').trim(),
      notes: manifest.notes,
      url: manifest.url,
      publishedAt: manifest.publishedAt || ''
    }
  }
  return {
    status: 'up-to-date',
    latestVersion: manifest.version
  }
}
