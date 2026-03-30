import exampleData from 'simple-mind-map/example/exampleData'
import { simpleDeepClone } from 'simple-mind-map/src/utils/index'
import vuexStore from '@/store'
import { getBootstrapState, isDesktopApp, saveBootstrapStatePatch } from '@/platform'
import { separateAppAndAiConfig } from '@/utils/aiProviders.mjs'
import {
  emitLocalStorageExceeded,
  emitWriteLocalFile
} from '@/services/appEvents'
import {
  loadLocalConfig,
  persistLocalConfig
} from '@/services/localConfigStorage'
import { getCurrentData } from '@/services/runtimeGlobals'

const SIMPLE_MIND_MAP_DATA = 'SIMPLE_MIND_MAP_DATA'
const SIMPLE_MIND_MAP_CONFIG = 'SIMPLE_MIND_MAP_CONFIG'
const SIMPLE_MIND_MAP_LANG = 'SIMPLE_MIND_MAP_LANG'
let mindMapData = null

const isQuotaExceededError = error => {
  if (!error) return false
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  )
}

// 获取缓存的思维导图数据
export const getData = () => {
  if (isDesktopApp()) {
    const currentData = vuexStore.state.isHandleLocalFile ? getCurrentData() : null
    if (currentData) {
      return currentData
    }
    const state = getBootstrapState()
    return state.mindMapData || simpleDeepClone(exampleData)
  }
  // 接管模式
  if (window.takeOverApp) {
    mindMapData = window.takeOverAppMethods.getMindMapData()
    return mindMapData
  }
  // 操作本地文件模式
  if (vuexStore.state.isHandleLocalFile) {
    const currentData = getCurrentData()
    if (currentData) {
      return currentData
    }
  }
  let store = localStorage.getItem(SIMPLE_MIND_MAP_DATA)
  if (store === null) {
    return simpleDeepClone(exampleData)
  } else {
    try {
      return JSON.parse(store)
    } catch (error) {
      return simpleDeepClone(exampleData)
    }
  }
}

// 存储思维导图数据
export const storeData = data => {
  try {
    let originData = null
    if (isDesktopApp()) {
      originData = getData()
    } else if (window.takeOverApp) {
      originData = mindMapData
    } else {
      originData = getData()
    }
    if (!originData) {
      originData = {}
    }
    originData = {
      ...originData,
      ...data
    }
    if (isDesktopApp()) {
      void saveBootstrapStatePatch({
        mindMapData: originData
      })
      emitWriteLocalFile(originData)
      return
    }
    if (window.takeOverApp) {
      mindMapData = originData
      window.takeOverAppMethods.saveMindMapData(originData)
      return
    }
    emitWriteLocalFile(originData)
    if (vuexStore.state.isHandleLocalFile) {
      return
    }
    localStorage.setItem(SIMPLE_MIND_MAP_DATA, JSON.stringify(originData))
  } catch (error) {
    console.log(error)
    if (isQuotaExceededError(error)) {
      emitLocalStorageExceeded()
    }
  }
}

// 获取思维导图配置数据
export const getConfig = () => {
  if (isDesktopApp()) {
    return getBootstrapState().mindMapConfig || null
  }
  if (window.takeOverApp) {
    return window.takeOverAppMethods.getMindMapConfig() || null
  }
  let config = localStorage.getItem(SIMPLE_MIND_MAP_CONFIG)
  if (config) {
    try {
      return JSON.parse(config)
    } catch (error) {
      localStorage.removeItem(SIMPLE_MIND_MAP_CONFIG)
      return null
    }
  }
  return null
}

// 存储思维导图配置数据
export const storeConfig = config => {
  try {
    if (isDesktopApp()) {
      void saveBootstrapStatePatch({
        mindMapConfig: config
      })
      return
    }
    if (window.takeOverApp) {
      window.takeOverAppMethods.saveMindMapConfig(config)
      return
    }
    localStorage.setItem(SIMPLE_MIND_MAP_CONFIG, JSON.stringify(config))
  } catch (error) {
    console.log(error)
  }
}

// 存储语言
export const storeLang = lang => {
  const nextLang = 'zh'
  if (isDesktopApp()) {
    return
  }
  if (window.takeOverApp) {
    window.takeOverAppMethods.saveLanguage(nextLang)
    return
  }
  localStorage.setItem(SIMPLE_MIND_MAP_LANG, nextLang)
}

// 获取存储的语言
export const getLang = () => {
  if (isDesktopApp()) {
    return 'zh'
  }
  if (window.takeOverApp) {
    return 'zh'
  }
  return 'zh'
}

// 存储本地配置
export const storeLocalConfig = config => {
  persistLocalConfig(config)
}

// 获取本地配置
export const getLocalConfig = () => {
  return loadLocalConfig()
}
