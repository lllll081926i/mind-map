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
  })
})
