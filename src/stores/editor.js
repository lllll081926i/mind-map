import { defineStore } from 'pinia'

export const useEditorStore = defineStore('editor', {
  state: () => ({
    recentFiles: [],
    currentDocument: null,
    currentFilePath: '',
    currentFileName: '',
    lastDirectory: '',
    resumeEntry: null,
    hasResumeEntry: false,
    hasDirtyDraft: false
  }),
  actions: {
    syncFileSession(payload = {}) {
      this.currentFilePath = payload.path || ''
      this.currentFileName = payload.name || ''
    },
    syncWorkspaceSession(session = {}) {
      const currentDocument = session.currentDocument || null
      this.currentDocument = currentDocument
      this.currentFilePath = currentDocument?.path || ''
      this.currentFileName = currentDocument?.name || ''
      this.lastDirectory = session.lastDirectory || ''
      this.resumeEntry = session.resumeEntry || null
      this.hasResumeEntry = !!session.hasResumeEntry
      this.hasDirtyDraft = !!session.hasDirtyDraft
      this.recentFiles = Array.isArray(session.recentFiles)
        ? session.recentFiles
        : []
    },
    setRecentFiles(list = []) {
      this.recentFiles = Array.isArray(list) ? list : []
    }
  }
})
