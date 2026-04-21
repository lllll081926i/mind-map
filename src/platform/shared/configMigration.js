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
import { createDefaultFlowchartData } from '@/services/flowchartDocument'

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
    mindMapData: createDefaultMindMapData(),
    flowchartData: createDefaultFlowchartData()
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

const hasOwnStateField = (input, key) => {
  return Object.prototype.hasOwnProperty.call(input || {}, key)
}

const normalizeOptionalObjectStateField = (input, key, fallbackValue = null) => {
  if (!hasOwnStateField(input, key)) {
    return fallbackValue
  }
  const value = input?.[key]
  if (value === null) {
    return null
  }
  return value && typeof value === 'object' ? value : fallbackValue
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
            isFullDataFile: !!input.currentDocument.isFullDataFile,
            documentMode:
              String(input.currentDocument.documentMode || '').trim() || 'mindmap'
          }
        : null
  }
}

export const normalizeBootstrapDocumentState = input => {
  const defaults = createDefaultBootstrapState()
  return {
    version: DESKTOP_STATE_VERSION,
    mindMapData: normalizeOptionalObjectStateField(
      input,
      'mindMapData',
      defaults.mindMapData
    ),
    mindMapConfig:
      input && input.mindMapConfig && typeof input.mindMapConfig === 'object'
        ? input.mindMapConfig
        : null,
    flowchartData: normalizeOptionalObjectStateField(
      input,
      'flowchartData',
      defaults.flowchartData
    ),
    flowchartConfig:
      input && input.flowchartConfig && typeof input.flowchartConfig === 'object'
        ? input.flowchartConfig
        : null
  }
}

export const normalizeBootstrapState = input => {
  return {
    ...normalizeBootstrapMetaState(input),
    ...normalizeBootstrapDocumentState(input)
  }
}
