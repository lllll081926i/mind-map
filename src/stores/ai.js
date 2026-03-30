import { defineStore } from 'pinia'
import { getDefaultAiConfig } from '@/utils/aiProviders.mjs'

export const useAiStore = defineStore('ai', {
  state: () => ({
    config: getDefaultAiConfig('volcanoArk'),
    enabled: false
  })
})
