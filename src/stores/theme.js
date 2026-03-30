import { defineStore } from 'pinia'
import { DEFAULT_LOCAL_CONFIG } from '@/platform/shared/configSchema'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: DEFAULT_LOCAL_CONFIG.isDark,
    lastDarkTheme: DEFAULT_LOCAL_CONFIG.lastDarkTheme,
    lastLightTheme: DEFAULT_LOCAL_CONFIG.lastLightTheme,
    extendThemeGroupList: [],
    bgList: []
  })
})
