import pinia from './index'
import { useAiStore } from './ai'
import { useAppStore } from './app'
import { useEditorStore } from './editor'
import { useSettingsStore } from './settings'
import { useThemeStore } from './theme'
import themeList from 'simple-mind-map-plugin-themes/themeList'
import { storeData } from '@/api'
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
  return persistLocalConfig({
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

const getAllMindMapThemes = () => {
  const { themeStore } = ensureRuntimeStores()
  const extendThemeList = []
  themeStore.extendThemeGroupList.forEach(group => {
    if (Array.isArray(group?.list)) {
      extendThemeList.push(...group.list)
    }
  })
  return [
    {
      name: 'default',
      value: 'default',
      dark: false
    },
    ...themeList,
    ...extendThemeList
  ]
}

const getMindMapThemeMeta = themeValue => {
  return getAllMindMapThemes().find(item => item.value === themeValue) || null
}

export const getMindMapThemeMetaByValue = themeValue => {
  return getMindMapThemeMeta(themeValue)
}

const buildThemeModePatch = ({ currentTheme = '', nextIsDark }) => {
  const { settingsStore } = ensureRuntimeStores()
  const currentThemeMeta = getMindMapThemeMeta(currentTheme)
  const nextLocalConfig = {
    isDark: !!nextIsDark
  }
  if (currentThemeMeta) {
    if (currentThemeMeta.dark) {
      nextLocalConfig.lastDarkTheme = currentThemeMeta.value
      nextLocalConfig.lastLightTheme = settingsStore.localConfig.lastLightTheme
    } else {
      nextLocalConfig.lastLightTheme = currentThemeMeta.value
      nextLocalConfig.lastDarkTheme = settingsStore.localConfig.lastDarkTheme
    }
  }
  return nextLocalConfig
}

export const getPreferredMindMapThemeValue = expectDark => {
  const { settingsStore } = ensureRuntimeStores()
  const fallbackTheme = expectDark ? 'dark4' : 'default'
  const rememberKey = expectDark ? 'lastDarkTheme' : 'lastLightTheme'
  const preferredTheme = settingsStore.localConfig[rememberKey] || fallbackTheme
  const target = getMindMapThemeMeta(preferredTheme)
  if (target && target.dark === expectDark) {
    return target.value
  }
  const fallbackTarget = getMindMapThemeMeta(fallbackTheme)
  if (fallbackTarget && fallbackTarget.dark === expectDark) {
    return fallbackTarget.value
  }
  const firstMatchedTheme = getAllMindMapThemes().find(item => {
    return item.dark === expectDark
  })
  return firstMatchedTheme ? firstMatchedTheme.value : fallbackTheme
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
  const { settingsStore, aiStore, appStore } = ensureRuntimeStores()
  const previousLocalConfig = {
    ...settingsStore.localConfig
  }
  const previousAiConfig = {
    ...aiStore.config
  }
  const previousSidebar = appStore.activeSidebar
  applyCompositeConfig(data, false)
  return persistCompositeConfig().catch(error => {
    settingsStore.replaceLocalConfig(previousLocalConfig)
    aiStore.setConfig(previousAiConfig)
    syncThemeFromLocalConfig()
    if (!settingsStore.localConfig.enableAi && previousSidebar === 'ai') {
      appStore.setActiveSidebar('')
    } else {
      appStore.setActiveSidebar(previousSidebar || '')
    }
    console.error('applyLocalConfigPatch failed', error)
    throw error
  })
}

export const setThemeMode = nextIsDark => {
  return applyLocalConfigPatch({
    isDark: !!nextIsDark
  })
}

export const toggleThemeMode = () => {
  const { themeStore } = ensureRuntimeStores()
  return setThemeMode(!themeStore.isDark)
}

export const applyMindMapThemeMode = (mindMap, nextIsDark) => {
  if (!mindMap) {
    return Promise.resolve(null)
  }
  const { themeStore } = ensureRuntimeStores()
  const expectDark =
    typeof nextIsDark === 'boolean' ? nextIsDark : !themeStore.isDark
  const currentTheme = mindMap.getTheme()
  const currentThemeMeta = getMindMapThemeMeta(currentTheme)
  const nextTheme = getPreferredMindMapThemeValue(expectDark)
  const nextLocalConfig = buildThemeModePatch({
    currentTheme,
    nextIsDark: expectDark
  })
  if (expectDark) {
    nextLocalConfig.lastDarkTheme = nextTheme
  } else {
    nextLocalConfig.lastLightTheme = nextTheme
  }
  const customThemeConfig = mindMap.getCustomThemeConfig()
  if (currentTheme !== nextTheme) {
    mindMap.setTheme(nextTheme)
    storeData({
      theme: {
        template: nextTheme,
        config: customThemeConfig
      }
    })
  } else if (!currentThemeMeta || currentThemeMeta.dark !== expectDark) {
    storeData({
      theme: {
        template: nextTheme,
        config: customThemeConfig
      }
    })
  }
  return applyLocalConfigPatch(nextLocalConfig).then(() => {
    return {
      isDark: expectDark,
      theme: nextTheme
    }
  })
}

export const toggleMindMapThemeMode = mindMap => {
  return applyMindMapThemeMode(mindMap)
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
