import { desktopPlatform } from './desktop'
import { webPlatform } from './web'
import { isDesktopRuntime } from './runtime'
import {
  createDefaultBootstrapState,
  normalizeBootstrapState,
  readLegacyLocalStorageSnapshot
} from './shared/configMigration'
import { upsertRecentFile } from './shared/recentFiles'
import {
  getCurrentFileRef,
  getDocumentSession,
  getLastDirectory,
  hydrateDocumentSession,
  markDocumentDirty,
  setCurrentFileRef,
  setLastDirectory,
  updateCurrentFileRef
} from '@/services/documentSession'

const platform = isDesktopRuntime() ? desktopPlatform : webPlatform

let bootstrapState = createDefaultBootstrapState()

export const bootstrapPlatformState = async () => {
  if (!isDesktopRuntime()) {
    bootstrapState = createDefaultBootstrapState()
    hydrateDocumentSession()
    return bootstrapState
  }
  const storedState = await platform.readBootstrapState()
  if (!storedState || !storedState.mindMapData) {
    bootstrapState = readLegacyLocalStorageSnapshot()
    await platform.writeBootstrapState(bootstrapState)
    return bootstrapState
  }
  bootstrapState = normalizeBootstrapState(storedState)
  hydrateDocumentSession()
  return bootstrapState
}

export const getBootstrapState = () => bootstrapState

export const saveBootstrapStatePatch = patch => {
  if (!isDesktopRuntime()) return
  bootstrapState = normalizeBootstrapState({
    ...bootstrapState,
    ...patch
  })
  return platform.writeBootstrapState(bootstrapState)
}

export const recordRecentFile = async fileRef => {
  if (!isDesktopRuntime() || !fileRef || !fileRef.path) return
  const nextState = await platform.recordRecentFile(fileRef)
  if (nextState) {
    bootstrapState = normalizeBootstrapState(nextState)
    return bootstrapState
  }
  bootstrapState = normalizeBootstrapState({
    ...bootstrapState,
    recentFiles: upsertRecentFile(bootstrapState.recentFiles, fileRef)
  })
  await platform.writeBootstrapState(bootstrapState)
  return bootstrapState
}

export const getRecentFiles = () => {
  return bootstrapState.recentFiles || []
}

export {
  getCurrentFileRef,
  getDocumentSession,
  getLastDirectory,
  markDocumentDirty,
  setCurrentFileRef,
  setLastDirectory,
  updateCurrentFileRef
}

export const isDesktopApp = () => isDesktopRuntime()

export const openExternalUrl = url => {
  return platform.openExternalUrl(url)
}

export default platform
