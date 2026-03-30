import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    activeSidebar: '',
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
