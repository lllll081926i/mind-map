import { isDesktopRuntime } from '@/platform/runtime'
import {
  createManualUpdateResult,
  parseUpdateManifest
} from './updateServiceCore.mjs'

let pendingDesktopUpdate = null

export const getReleasePageUrl = () => String(__APP_RELEASE_URL__ || '').trim()

export const getUpdateManifestUrl = () =>
  String(__APP_UPDATE_MANIFEST_URL__ || '').trim()

export const canUseDesktopUpdater = () => {
  return __APP_RUNTIME__ === 'desktop' && isDesktopRuntime()
}

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
  return parseUpdateManifest(data, getReleasePageUrl())
}

const runDesktopUpdateCheck = async () => {
  const { check } = await import('@tauri-apps/plugin-updater')
  const update = await check()
  pendingDesktopUpdate = update || null
  if (!update) {
    return {
      status: 'up-to-date',
      latestVersion: String(__APP_VERSION__ || '').trim()
    }
  }
  return {
    status: 'update-available',
    latestVersion: String(update.version || '').trim(),
    notes: String(update.body || ''),
    currentVersion: String(update.currentVersion || '').trim(),
    releaseDate: update.date || '',
    url: getReleasePageUrl()
  }
}

export const checkForUpdates = async currentVersion => {
  if (canUseDesktopUpdater()) {
    return runDesktopUpdateCheck()
  }

  const manifest = await fetchUpdateManifest()
  if (manifest) {
    return createManualUpdateResult(currentVersion, manifest)
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

export const downloadAndInstallUpdate = async onEvent => {
  if (!pendingDesktopUpdate) {
    throw new Error('当前没有可安装的更新')
  }
  await pendingDesktopUpdate.downloadAndInstall(onEvent)
  pendingDesktopUpdate = null
  return {
    shouldRelaunch: __APP_PLATFORM__ !== 'win32'
  }
}

export const relaunchAfterUpdate = async () => {
  const { relaunch } = await import('@tauri-apps/plugin-process')
  await relaunch()
}
