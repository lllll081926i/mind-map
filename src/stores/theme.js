import { defineStore } from 'pinia'
import { DEFAULT_LOCAL_CONFIG } from '@/platform/shared/configSchema'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: DEFAULT_LOCAL_CONFIG.isDark,
    lastDarkTheme: DEFAULT_LOCAL_CONFIG.lastDarkTheme,
    lastLightTheme: DEFAULT_LOCAL_CONFIG.lastLightTheme,
    extendThemeGroupList: [],
    bgList: []
  }),
  actions: {
    syncFromLocalConfig(localConfig = {}) {
      this.isDark = !!localConfig.isDark
      this.lastDarkTheme =
        localConfig.lastDarkTheme || DEFAULT_LOCAL_CONFIG.lastDarkTheme
      this.lastLightTheme =
        localConfig.lastLightTheme || DEFAULT_LOCAL_CONFIG.lastLightTheme
    },
    setExtendThemeGroupList(list = []) {
      this.extendThemeGroupList = Array.isArray(list) ? list : []
    },
    setBgList(list = []) {
      this.bgList = Array.isArray(list) ? list : []
    }
  }
})
