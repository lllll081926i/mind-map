import exampleData from 'simple-mind-map/example/exampleData'
import { simpleDeepClone } from 'simple-mind-map/src/utils/index'
import { AI_CONFIG_KEYS, normalizeAiConfig } from '@/utils/aiProviders.mjs'
import {
  DEFAULT_BOOTSTRAP_STATE,
  DEFAULT_LOCAL_CONFIG,
  DESKTOP_STATE_VERSION
} from './configSchema'
import { normalizeRecentFiles } from './recentFiles'

export const LOCAL_STORAGE_KEYS = {
  data: 'SIMPLE_MIND_MAP_DATA',
  config: 'SIMPLE_MIND_MAP_CONFIG',
  localConfig: 'SIMPLE_MIND_MAP_LOCAL_CONFIG'
}

const safeParse = value => {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch (error) {
    return null
  }
}

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
    mindMapData: simpleDeepClone(exampleData)
  }
}

export const normalizeBootstrapState = input => {
  const defaults = createDefaultBootstrapState()
  const localConfig = {
    ...DEFAULT_LOCAL_CONFIG,
    ...((input && input.localConfig) || {})
  }
  return {
    version: DESKTOP_STATE_VERSION,
    mindMapData:
      input && input.mindMapData && typeof input.mindMapData === 'object'
        ? input.mindMapData
        : defaults.mindMapData,
    mindMapConfig:
      input && input.mindMapConfig && typeof input.mindMapConfig === 'object'
        ? input.mindMapConfig
        : null,
    localConfig,
    aiConfig: normalizeAiConfig(pickAiConfigInput(input)),
    recentFiles: normalizeRecentFiles(input && input.recentFiles)
  }
}

export const readLegacyLocalStorageSnapshot = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createDefaultBootstrapState()
  }
  return normalizeBootstrapState({
    mindMapData: safeParse(localStorage.getItem(LOCAL_STORAGE_KEYS.data)),
    mindMapConfig: safeParse(localStorage.getItem(LOCAL_STORAGE_KEYS.config)),
    localConfig: safeParse(localStorage.getItem(LOCAL_STORAGE_KEYS.localConfig))
  })
}
