import { getBootstrapState, saveBootstrapStatePatch } from '@/platform'
import { separateAppAndAiConfig } from '@/utils/aiProviders.mjs'

export const persistLocalConfig = config => {
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
  }).catch(error => {
    console.error('persistLocalConfig failed', error)
  })
}

export const loadLocalConfig = () => {
  const state = getBootstrapState()
  return {
    ...state.localConfig,
    ...state.aiConfig
  }
}
