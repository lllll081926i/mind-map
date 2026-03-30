const normalizeVersion = version => {
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

export const getReleasePageUrl = () => String(__APP_RELEASE_URL__ || '').trim()

export const getUpdateManifestUrl = () =>
  String(__APP_UPDATE_MANIFEST_URL__ || '').trim()

export const fetchUpdateManifest = async () => {
  const manifestUrl = getUpdateManifestUrl()
  if (!manifestUrl) return null
  const response = await fetch(manifestUrl, {
    cache: 'no-store'
  })
  if (!response.ok) {
    throw new Error(`更新清单请求失败：${response.status}`)
  }
  const data = await response.json()
  if (!data || typeof data !== 'object' || !data.version) {
    throw new Error('更新清单格式无效')
  }
  return {
    version: normalizeVersion(data.version),
    notes: String(data.notes || ''),
    url: String(data.url || getReleasePageUrl() || '').trim()
  }
}

export const checkForUpdates = async currentVersion => {
  const manifest = await fetchUpdateManifest()
  if (manifest) {
    const comparison = compareVersions(currentVersion, manifest.version)
    if (comparison < 0) {
      return {
        status: 'update-available',
        latestVersion: manifest.version,
        notes: manifest.notes,
        url: manifest.url
      }
    }
    return {
      status: 'up-to-date',
      latestVersion: manifest.version
    }
  }
  const releaseUrl = getReleasePageUrl()
  if (releaseUrl) {
    return {
      status: 'release-page-only',
      url: releaseUrl
    }
  }
  return {
    status: 'not-configured'
  }
}
