import pinia from './index'
import { useAiStore } from './ai'
import { useAppStore } from './app'
import { useEditorStore } from './editor'
import { useSettingsStore } from './settings'
import { useThemeStore } from './theme'
import { persistLocalConfig } from '@/services/localConfigStorage'
import { getWorkspaceSessionState } from '@/services/workspaceSession'
import {
  AI_CONFIG_KEYS,
  normalizeAiConfig
} from '@/utils/aiProviders.mjs'

let runtimeStores = null

const ensureRuntimeStores = () => {
  if (!runtimeStores) {
    runtimeStores = {
      appStore: useAppStore(pinia),
      editorStore: useEditorStore(pinia),
      settingsStore: useSettingsStore(pinia),
      themeStore: useThemeStore(pinia),
      aiStore: useAiStore(pinia)
    }
    runtimeStores.themeStore.syncFromLocalConfig(
      runtimeStores.settingsStore.localConfig
    )
  }
  return runtimeStores
}

const persistCompositeConfig = () => {
  const { settingsStore, aiStore } = ensureRuntimeStores()
  persistLocalConfig({
    ...settingsStore.localConfig,
    ...aiStore.config
  })
}

const syncThemeFromLocalConfig = () => {
  const { themeStore, settingsStore } = ensureRuntimeStores()
  themeStore.syncFromLocalConfig(settingsStore.localConfig)
}

const syncEditorStoreFromWorkspaceMeta = state => {
  const { editorStore } = ensureRuntimeStores()
  editorStore.syncWorkspaceSession(getWorkspaceSessionState(state))
}

const applyCompositeConfig = (data, persist = true) => {
  const { settingsStore, aiStore, appStore } = ensureRuntimeStores()
  const nextLocalConfig = {
    ...settingsStore.localConfig
  }
  const nextAiConfig = {
    ...aiStore.config
  }
  Object.keys(data || {}).forEach(key => {
    if (AI_CONFIG_KEYS.includes(key)) {
      nextAiConfig[key] = data[key]
      return
    }
    nextLocalConfig[key] = data[key]
  })
  settingsStore.replaceLocalConfig(nextLocalConfig)
  aiStore.setConfig(normalizeAiConfig(nextAiConfig))
  syncThemeFromLocalConfig()
  if (!settingsStore.localConfig.enableAi && appStore.activeSidebar === 'ai') {
    appStore.setActiveSidebar('')
  }
  if (persist) {
    persistCompositeConfig()
  }
}

export const getRuntimeStores = () => ensureRuntimeStores()

export const applyLocalConfigPatch = data => {
  applyCompositeConfig(data, true)
}

export const syncRuntimeFromBootstrapState = state => {
  if (!state || typeof state !== 'object') {
    return getRuntimeStores()
  }
  applyCompositeConfig(
    {
      ...(state.localConfig || {}),
      ...(state.aiConfig || {})
    },
    false
  )
  syncEditorStoreFromWorkspaceMeta(state)
  return getRuntimeStores()
}

export const syncRuntimeFromWorkspaceMeta = state => {
  syncEditorStoreFromWorkspaceMeta(state)
  return getRuntimeStores()
}

export const setActiveSidebar = value => {
  const { settingsStore, appStore } = ensureRuntimeStores()
  const normalizedValue = typeof value === 'string' ? value : ''
  const previousSidebar = appStore.activeSidebar
  const transitionMode =
    previousSidebar &&
    normalizedValue &&
    previousSidebar !== normalizedValue
      ? 'swap'
      : 'slide'
  appStore.setSidebarTransitionMode(transitionMode)
  if (normalizedValue === 'ai' && !settingsStore.localConfig.enableAi) {
    appStore.setActiveSidebar('')
    return
  }
  appStore.setActiveSidebar(normalizedValue)
}

const createStoreSetter = (store, methodName) => {
  return value => {
    const runtime = ensureRuntimeStores()
    runtime[store][methodName](value)
  }
}

export const setIsHandleLocalFile = createStoreSetter(
  'appStore',
  'setIsHandleLocalFile'
)
export const setIsOutlineEdit = createStoreSetter('appStore', 'setIsOutlineEdit')
export const setIsReadonly = createStoreSetter('appStore', 'setIsReadonly')
export const setIsSourceCodeEdit = createStoreSetter(
  'appStore',
  'setIsSourceCodeEdit'
)
export const setExtraTextOnExport = createStoreSetter(
  'appStore',
  'setExtraTextOnExport'
)
export const setIsDragOutlineTreeNode = createStoreSetter(
  'appStore',
  'setIsDragOutlineTreeNode'
)
export const setExtendThemeGroupList = createStoreSetter(
  'themeStore',
  'setExtendThemeGroupList'
)
export const setBgList = createStoreSetter('themeStore', 'setBgList')
