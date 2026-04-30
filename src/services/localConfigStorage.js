import { getBootstrapState, saveBootstrapStatePatch } from '@/platform'
import {
  decodeAiConfigFromStorage,
  encodeAiConfigForStorage,
  separateAppAndAiConfig
} from '@/utils/aiProviders.mjs'

export const persistLocalConfig = config => {
  const state = getBootstrapState()
  const { localConfig, aiConfig } = separateAppAndAiConfig(config)
  return saveBootstrapStatePatch({
    localConfig: {
      ...state.localConfig,
      ...localConfig
    },
    aiConfig: encodeAiConfigForStorage({
      ...state.aiConfig,
      ...aiConfig
    })
  })
}

export const loadLocalConfig = () => {
  const state = getBootstrapState()
  const aiConfig = decodeAiConfigFromStorage(state.aiConfig)
  return {
    ...state.localConfig,
    ...aiConfig
  }
}
