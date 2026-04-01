import pinia from './index'
import { useAiStore } from './ai'
import { useAppStore } from './app'
import { useEditorStore } from './editor'
import { useSettingsStore } from './settings'
import { useThemeStore } from './theme'
import { persistLocalConfig } from '@/services/localConfigStorage'
import {
  AI_CONFIG_KEYS,
  normalizeAiConfig
} from '@/utils/aiProviders.mjs'

const appStore = useAppStore(pinia)
const editorStore = useEditorStore(pinia)
const settingsStore = useSettingsStore(pinia)
const themeStore = useThemeStore(pinia)
const aiStore = useAiStore(pinia)

const persistCompositeConfig = () => {
  persistLocalConfig({
    ...settingsStore.localConfig,
    ...aiStore.config
  })
}

const syncThemeFromLocalConfig = () => {
  themeStore.syncFromLocalConfig(settingsStore.localConfig)
}

const applyCompositeConfig = (data, persist = true) => {
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

export const getRuntimeStores = () => ({
  appStore,
  editorStore,
  settingsStore,
  themeStore,
  aiStore
})

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
  setRecentFiles(state.recentFiles || [])
  if (state.currentDocument && state.currentDocument.path) {
    syncEditorFileSession({
      path: state.currentDocument.path,
      name: state.currentDocument.name || ''
    })
  } else {
    syncEditorFileSession({
      path: '',
      name: ''
    })
  }
  return getRuntimeStores()
}

export const setActiveSidebar = value => {
  if (value === 'ai' && !settingsStore.localConfig.enableAi) {
    appStore.setActiveSidebar('')
    return
  }
  appStore.setActiveSidebar(value)
}

export const setIsHandleLocalFile = value => {
  appStore.setIsHandleLocalFile(value)
}

export const setIsOutlineEdit = value => {
  appStore.setIsOutlineEdit(value)
}

export const setIsReadonly = value => {
  appStore.setIsReadonly(value)
}

export const setIsSourceCodeEdit = value => {
  appStore.setIsSourceCodeEdit(value)
}

export const setExtraTextOnExport = value => {
  appStore.setExtraTextOnExport(value)
}

export const setIsDragOutlineTreeNode = value => {
  appStore.setIsDragOutlineTreeNode(value)
}

export const setExtendThemeGroupList = value => {
  themeStore.setExtendThemeGroupList(value)
}

export const setBgList = value => {
  themeStore.setBgList(value)
}

export const syncEditorFileSession = payload => {
  editorStore.syncFileSession(payload)
}

export const setRecentFiles = list => {
  editorStore.setRecentFiles(list)
}

syncThemeFromLocalConfig()
