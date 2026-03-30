import { defineStore } from 'pinia'

export const useEditorStore = defineStore('editor', {
  state: () => ({
    recentFiles: [],
    currentFilePath: '',
    currentFileName: ''
  }),
  actions: {
    syncFileSession(payload = {}) {
      this.currentFilePath = payload.path || ''
      this.currentFileName = payload.name || ''
    },
    setRecentFiles(list = []) {
      this.recentFiles = Array.isArray(list) ? list : []
    }
  }
})
