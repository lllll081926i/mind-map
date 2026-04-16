import { desktopPlatform } from './desktop'
import { isDesktopRuntime } from './runtime.mjs'
import {
  createDefaultBootstrapState,
  normalizeBootstrapDocumentState,
  normalizeBootstrapMetaState,
  normalizeBootstrapState
} from './shared/configMigration'
import { upsertRecentFile } from './shared/recentFiles'

const getPlatform = () => {
  return desktopPlatform
}

const syncDocumentSessionFromBootstrap = () => {
  void import('@/services/documentSession')
    .then(module => {
      module.hydrateDocumentSession()
    })
    .catch(error => {
      console.error('syncDocumentSessionFromBootstrap failed', error)
    })
}

let bootstrapState = createDefaultBootstrapState()
let bootstrapMetaPromise = null
let bootstrapDocumentPromise = null
let metaWriteQueue = Promise.resolve()
let documentWriteQueue = Promise.resolve()
let metaMutationVersion = 0
let documentMutationVersion = 0

const BOOTSTRAP_META_KEYS = [
  'version',
  'localConfig',
  'aiConfig',
  'recentFiles',
  'lastDirectory',
  'currentDocument'
]

const BOOTSTRAP_DOCUMENT_KEYS = ['version', 'mindMapData', 'mindMapConfig']

const bumpMetaMutationVersion = () => {
  metaMutationVersion += 1
  return metaMutationVersion
}

const bumpDocumentMutationVersion = () => {
  documentMutationVersion += 1
  return documentMutationVersion
}

const pickState = (state, keys) => {
  return keys.reduce((acc, key) => {
    acc[key] = state[key]
    return acc
  }, {})
}

const applyBootstrapMetaState = (input, options = {}) => {
  const nextMetaState = normalizeBootstrapMetaState(input)
  const preserveCurrentMeta =
    typeof options.startVersion === 'number' &&
    options.startVersion !== metaMutationVersion
  bootstrapState = normalizeBootstrapState({
    ...bootstrapState,
    ...(preserveCurrentMeta
      ? pickState(bootstrapState, BOOTSTRAP_META_KEYS)
      : nextMetaState)
  })
  syncDocumentSessionFromBootstrap()
  return bootstrapState
}

const applyBootstrapDocumentState = (input, options = {}) => {
  const nextDocumentState = normalizeBootstrapDocumentState(input)
  const preserveCurrentDocument =
    typeof options.startVersion === 'number' &&
    options.startVersion !== documentMutationVersion
  bootstrapState = normalizeBootstrapState({
    ...bootstrapState,
    ...(preserveCurrentDocument
      ? pickState(bootstrapState, BOOTSTRAP_DOCUMENT_KEYS)
      : nextDocumentState)
  })
  return bootstrapState
}

const queueMetaWrite = snapshot => {
  if (!isDesktopRuntime()) {
    return Promise.resolve(snapshot)
  }
  const platform = getPlatform()
  metaWriteQueue = metaWriteQueue
    .catch(error => {
      console.error('queueMetaWrite previous task failed', error)
      return undefined
    })
    .then(async () => {
      await platform.writeBootstrapMetaState(snapshot)
      return snapshot
    })
  return metaWriteQueue
}

const queueDocumentWrite = snapshot => {
  if (!isDesktopRuntime()) {
    return Promise.resolve(snapshot)
  }
  const platform = getPlatform()
  documentWriteQueue = documentWriteQueue
    .catch(error => {
      console.error('queueDocumentWrite previous task failed', error)
      return undefined
    })
    .then(async () => {
      await platform.writeBootstrapDocumentState(snapshot)
      return snapshot
    })
  return documentWriteQueue
}

const openUrlWithBrowserFallback = url => {
  if (
    typeof window === 'undefined' ||
    typeof window.open !== 'function' ||
    !String(url || '').trim()
  ) {
    return false
  }
  const urlValue = String(url || '').trim()
  let parsedUrl
  try {
    parsedUrl = new URL(urlValue, window.location.href)
  } catch (_error) {
    return false
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return false
  }
  window.open(parsedUrl.toString(), '_blank', 'noopener,noreferrer')
  return true
}

export const bootstrapPlatformState = async () => {
  if (!isDesktopRuntime()) {
    bootstrapState = createDefaultBootstrapState()
    syncDocumentSessionFromBootstrap()
    return bootstrapState
  }
  if (!bootstrapMetaPromise) {
    const startVersion = metaMutationVersion
    bootstrapMetaPromise = (async () => {
      try {
        const platform = getPlatform()
        const storedState = await platform.readBootstrapMetaState()
        return applyBootstrapMetaState(storedState, {
          startVersion
        })
      } catch (error) {
        console.error(
          'bootstrapPlatformState failed, preserve current bootstrap meta state',
          error
        )
        return applyBootstrapMetaState(pickState(bootstrapState, BOOTSTRAP_META_KEYS), {
          startVersion
        })
      }
    })()
  }
  return bootstrapMetaPromise
}

export const ensureBootstrapDocumentState = async () => {
  if (!isDesktopRuntime()) {
    return bootstrapState
  }
  if (!bootstrapDocumentPromise) {
    const startVersion = documentMutationVersion
    bootstrapDocumentPromise = (async () => {
      try {
        const platform = getPlatform()
        const storedState = await platform.readBootstrapDocumentState()
        return applyBootstrapDocumentState(storedState, {
          startVersion
        })
      } catch (error) {
        console.error(
          'ensureBootstrapDocumentState failed, preserve current bootstrap document state',
          error
        )
        return applyBootstrapDocumentState(
          pickState(bootstrapState, BOOTSTRAP_DOCUMENT_KEYS),
          {
            startVersion
          }
        )
      }
    })()
  }
  return bootstrapDocumentPromise
}

export const getBootstrapState = () => bootstrapState

export const saveBootstrapStatePatch = async patch => {
  bootstrapState = normalizeBootstrapState({
    ...bootstrapState,
    ...patch
  })
  const hasMetaPatch = BOOTSTRAP_META_KEYS.some(key => key in (patch || {}))
  const hasDocumentPatch = BOOTSTRAP_DOCUMENT_KEYS.some(
    key => key in (patch || {})
  )
  if (hasMetaPatch) {
    bumpMetaMutationVersion()
  }
  if (hasDocumentPatch) {
    bumpDocumentMutationVersion()
  }
  if (hasMetaPatch) {
    syncDocumentSessionFromBootstrap()
  }
  if (!isDesktopRuntime()) {
    return bootstrapState
  }
  const tasks = []
  if (hasMetaPatch) {
    bootstrapMetaPromise = Promise.resolve(bootstrapState)
    tasks.push(queueMetaWrite(pickState(bootstrapState, BOOTSTRAP_META_KEYS)))
  }
  if (hasDocumentPatch) {
    bootstrapDocumentPromise = Promise.resolve(bootstrapState)
    tasks.push(
      queueDocumentWrite(pickState(bootstrapState, BOOTSTRAP_DOCUMENT_KEYS))
    )
  }
  await Promise.all(tasks)
  return bootstrapState
}

export const recordRecentFile = async fileRef => {
  if (!fileRef || !fileRef.path) return bootstrapState
  bumpMetaMutationVersion()
  if (!isDesktopRuntime()) {
    bootstrapState = normalizeBootstrapState({
      ...bootstrapState,
      recentFiles: upsertRecentFile(bootstrapState.recentFiles, fileRef)
    })
    return bootstrapState
  }
  const platform = getPlatform()
  const nextState = await platform.recordRecentFile(fileRef)
  if (nextState) {
    bootstrapState = {
      ...bootstrapState,
      ...normalizeBootstrapMetaState(nextState)
    }
    bootstrapMetaPromise = Promise.resolve(bootstrapState)
    syncDocumentSessionFromBootstrap()
    return bootstrapState
  }
  bootstrapState = {
    ...bootstrapState,
    ...normalizeBootstrapMetaState({
      ...bootstrapState,
      recentFiles: upsertRecentFile(bootstrapState.recentFiles, fileRef)
    })
  }
  bootstrapMetaPromise = Promise.resolve(bootstrapState)
  syncDocumentSessionFromBootstrap()
  await queueMetaWrite(pickState(bootstrapState, BOOTSTRAP_META_KEYS))
  return bootstrapState
}

export const getRecentFiles = () => {
  return bootstrapState.recentFiles || []
}

export const isDesktopApp = () => isDesktopRuntime()

export const openExternalUrl = url => {
  try {
    const platform = getPlatform()
    return Promise.resolve(platform.openExternalUrl(url)).catch(error => {
      console.error('openExternalUrl failed, fallback to window.open', error)
      if (openUrlWithBrowserFallback(url)) {
        return undefined
      }
      throw error
    })
  } catch (error) {
    console.error('openExternalUrl invoke setup failed', error)
    if (openUrlWithBrowserFallback(url)) {
      return Promise.resolve(undefined)
    }
    return Promise.reject(error)
  }
}

export default desktopPlatform
