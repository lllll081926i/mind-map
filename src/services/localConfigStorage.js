import { getBootstrapState, isDesktopApp, saveBootstrapStatePatch } from '@/platform'
import { separateAppAndAiConfig } from '@/utils/aiProviders.mjs'

export const SIMPLE_MIND_MAP_LOCAL_CONFIG = 'SIMPLE_MIND_MAP_LOCAL_CONFIG'

export const persistLocalConfig = config => {
  if (isDesktopApp()) {
    const state = getBootstrapState()
    const { localConfig, aiConfig } = separateAppAndAiConfig(config)
    void saveBootstrapStatePatch({
      localConfig: {
        ...state.localConfig,
        ...localConfig
      },
      aiConfig: {
        ...state.aiConfig,
        ...aiConfig
      }
    })
    return
  }
  if (window.takeOverApp) {
    return window.takeOverAppMethods.saveLocalConfig(config)
  }
  localStorage.setItem(SIMPLE_MIND_MAP_LOCAL_CONFIG, JSON.stringify(config))
}

export const loadLocalConfig = () => {
  if (isDesktopApp()) {
    const state = getBootstrapState()
    return {
      ...state.localConfig,
      ...state.aiConfig
    }
  }
  if (window.takeOverApp) {
    return window.takeOverAppMethods.getLocalConfig()
  }
  let config = localStorage.getItem(SIMPLE_MIND_MAP_LOCAL_CONFIG)
  if (config) {
    try {
      return JSON.parse(config)
    } catch (error) {
      localStorage.removeItem(SIMPLE_MIND_MAP_LOCAL_CONFIG)
      return null
    }
  }
  return null
}
