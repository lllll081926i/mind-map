import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    activeSidebar: '',
    sidebarTransitionMode: 'slide',
    isOutlineEdit: false,
    isReadonly: false,
    isSourceCodeEdit: false,
    extraTextOnExport: '',
    isHandleLocalFile: false,
    isDragOutlineTreeNode: false
  }),
  actions: {
    setActiveSidebar(value) {
      this.activeSidebar = value
    },
    setSidebarTransitionMode(value) {
      this.sidebarTransitionMode = value === 'swap' ? 'swap' : 'slide'
    },
    setIsOutlineEdit(value) {
      this.isOutlineEdit = value
    },
    setIsReadonly(value) {
      this.isReadonly = value
    },
    setIsSourceCodeEdit(value) {
      this.isSourceCodeEdit = value
    },
    setExtraTextOnExport(value) {
      this.extraTextOnExport = value
    },
    setIsHandleLocalFile(value) {
      this.isHandleLocalFile = value
    },
    setIsDragOutlineTreeNode(value) {
      this.isDragOutlineTreeNode = value
    }
  }
})
