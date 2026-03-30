import { defineStore } from 'pinia'
import { DEFAULT_LOCAL_CONFIG } from '@/platform/shared/configSchema'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    localConfig: {
      ...DEFAULT_LOCAL_CONFIG
    }
  })
})
