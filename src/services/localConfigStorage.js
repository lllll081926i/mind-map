import { getBootstrapState, saveBootstrapStatePatch } from '@/platform'
import { separateAppAndAiConfig } from '@/utils/aiProviders.mjs'

export const persistLocalConfig = config => {
  const state = getBootstrapState()
  const { localConfig, aiConfig } = separateAppAndAiConfig(config)
  return saveBootstrapStatePatch({
    localConfig: {
      ...state.localConfig,
      ...localConfig
    },
    aiConfig: {
      ...state.aiConfig,
      ...aiConfig
    }
  })
}

export const loadLocalConfig = () => {
  const state = getBootstrapState()
  return {
    ...state.localConfig,
    ...state.aiConfig
  }
}
