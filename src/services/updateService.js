import {
  createManualUpdateResult,
  parseGitHubLatestRelease
} from './updateServiceCore.mjs'

const RELEASE_REQUEST_TIMEOUT_MS = 8000

export const getReleasePageUrl = () => String(__APP_RELEASE_URL__ || '').trim()

export const getReleaseApiUrl = () => String(__APP_RELEASE_API_URL__ || '').trim()

export const fetchLatestRelease = async () => {
  const releaseApiUrl = getReleaseApiUrl()
  if (!releaseApiUrl) {
    throw new Error('未配置 GitHub Release 更新源')
  }
  const controller =
    typeof AbortController === 'function' ? new AbortController() : null
  const timer = setTimeout(() => {
    controller?.abort()
  }, RELEASE_REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(releaseApiUrl, {
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json'
      },
      signal: controller?.signal
    })
    if (!response.ok) {
      throw new Error(`发布信息请求失败：${response.status}`)
    }
    const data = await response.json()
    return parseGitHubLatestRelease(data, getReleasePageUrl())
  } finally {
    clearTimeout(timer)
  }
}

export const checkForUpdates = async currentVersion => {
  const latestRelease = await fetchLatestRelease()
  return createManualUpdateResult(currentVersion, latestRelease)
}
