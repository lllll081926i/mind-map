import {
  AI_CONFIG_KEYS,
  normalizeAiConfig,
  separateAppAndAiConfig
} from '@/utils/aiProviders.mjs'
import {
  DEFAULT_BOOTSTRAP_STATE,
  DEFAULT_LOCAL_CONFIG,
  createDefaultMindMapData,
  DESKTOP_STATE_VERSION
} from './configSchema'
import { normalizeRecentFiles } from './recentFiles'

const pickAiConfigInput = input => {
  const localConfig = input && input.localConfig ? input.localConfig : {}
  const aiConfig = input && input.aiConfig ? input.aiConfig : {}
  const merged = {}
  AI_CONFIG_KEYS.forEach(key => {
    if (key in aiConfig) {
      merged[key] = aiConfig[key]
      return
    }
    if (key in localConfig) {
      merged[key] = localConfig[key]
      return
    }
    if (input && key in input) {
      merged[key] = input[key]
    }
  })
  return merged
}

export const createDefaultBootstrapState = () => {
  const defaults = DEFAULT_BOOTSTRAP_STATE()
  return {
    ...defaults,
    mindMapData: createDefaultMindMapData()
  }
}

const createNormalizedConfigState = input => {
  const separatedLocalConfig = separateAppAndAiConfig(
    (input && input.localConfig) || {}
  )
  const localConfig = {
    ...DEFAULT_LOCAL_CONFIG,
    ...separatedLocalConfig.localConfig
  }
  return {
    localConfig,
    aiConfig: normalizeAiConfig({
      ...pickAiConfigInput(input),
      ...separatedLocalConfig.aiConfig
    })
  }
}

export const normalizeBootstrapMetaState = input => {
  const normalizedConfigState = createNormalizedConfigState(input)
  return {
    version: DESKTOP_STATE_VERSION,
    localConfig: normalizedConfigState.localConfig,
    aiConfig: normalizedConfigState.aiConfig,
    recentFiles: normalizeRecentFiles(input && input.recentFiles),
    lastDirectory:
      input && typeof input.lastDirectory === 'string' ? input.lastDirectory : '',
    currentDocument:
      input &&
      input.currentDocument &&
      typeof input.currentDocument === 'object' &&
      typeof input.currentDocument.path === 'string'
        ? {
            path: input.currentDocument.path,
            name: String(input.currentDocument.name || ''),
            source: String(input.currentDocument.source || ''),
            dirty: !!input.currentDocument.dirty,
            isFullDataFile: !!input.currentDocument.isFullDataFile
          }
        : null
  }
}

export const normalizeBootstrapDocumentState = input => {
  const defaults = createDefaultBootstrapState()
  return {
    version: DESKTOP_STATE_VERSION,
    mindMapData:
      input && input.mindMapData && typeof input.mindMapData === 'object'
        ? input.mindMapData
        : defaults.mindMapData,
    mindMapConfig:
      input && input.mindMapConfig && typeof input.mindMapConfig === 'object'
        ? input.mindMapConfig
        : null
  }
}

export const normalizeBootstrapState = input => {
  return {
    ...normalizeBootstrapMetaState(input),
    ...normalizeBootstrapDocumentState(input)
  }
}
