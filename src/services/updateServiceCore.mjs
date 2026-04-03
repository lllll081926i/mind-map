export const normalizeVersion = version => {
  return String(version || '')
    .trim()
    .replace(/^v/i, '')
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
    throw new Error('更新清单格式无效')
  }

  return {
    version: normalizeVersion(data.version),
    notes: String(data.notes || data.body || ''),
    url: String(data.url || fallbackUrl || '').trim()
  }
}

export const parseGitHubLatestRelease = (data, fallbackUrl = '') => {
  if (!data || typeof data !== 'object' || !data.tag_name) {
    throw new Error('GitHub Release 数据格式无效')
  }

  return {
    version: normalizeVersion(data.tag_name),
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
