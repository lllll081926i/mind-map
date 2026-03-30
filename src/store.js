import { createStore } from 'vuex'
import { getDefaultAiConfig } from '@/utils/aiProviders.mjs'
import { DEFAULT_LOCAL_CONFIG } from '@/platform/shared/configSchema'
import {
  applyLocalConfigPatch,
  getRuntimeStores,
  setActiveSidebar,
  setBgList,
  setExtendThemeGroupList,
  setExtraTextOnExport,
  setIsDragOutlineTreeNode,
  setIsHandleLocalFile,
  setIsOutlineEdit,
  setIsReadonly,
  setIsSourceCodeEdit
} from '@/stores/runtime'

const syncLegacyVuexState = state => {
  const { appStore, settingsStore, themeStore, aiStore } = getRuntimeStores()
  state.isHandleLocalFile = appStore.isHandleLocalFile
  state.localConfig = {
    ...settingsStore.localConfig
  }
  state.activeSidebar = appStore.activeSidebar
  state.isOutlineEdit = appStore.isOutlineEdit
  state.isReadonly = appStore.isReadonly
  state.isSourceCodeEdit = appStore.isSourceCodeEdit
  state.extraTextOnExport = appStore.extraTextOnExport
  state.isDragOutlineTreeNode = appStore.isDragOutlineTreeNode
  state.aiConfig = {
    ...aiStore.config
  }
  state.extendThemeGroupList = [...themeStore.extendThemeGroupList]
  state.bgList = [...themeStore.bgList]
}

const store = createStore({
  state: {
    isHandleLocalFile: false, // 是否操作的是本地文件
    localConfig: {
      ...DEFAULT_LOCAL_CONFIG
    },
    activeSidebar: '', // 当前显示的侧边栏
    isOutlineEdit: false, // 是否是大纲编辑模式
    isReadonly: false, // 是否只读
    isSourceCodeEdit: false, // 是否是源码编辑模式
    extraTextOnExport: '', // 导出时底部添加的文字
    isDragOutlineTreeNode: false, // 当前是否正在拖拽大纲树的节点
    aiConfig: getDefaultAiConfig('volcanoArk'),
    // 扩展主题列表
    extendThemeGroupList: [],
    // 内置背景图片
    bgList: []
  },
  mutations: {
    // 设置操作本地文件标志位
    setIsHandleLocalFile(state, data) {
      setIsHandleLocalFile(data)
      syncLegacyVuexState(state)
    },

    // 设置本地配置
    setLocalConfig(state, data) {
      applyLocalConfigPatch(data)
      syncLegacyVuexState(state)
    },

    // 设置当前显示的侧边栏
    setActiveSidebar(state, data) {
      setActiveSidebar(data)
      syncLegacyVuexState(state)
    },

    // 设置大纲编辑模式
    setIsOutlineEdit(state, data) {
      setIsOutlineEdit(data)
      syncLegacyVuexState(state)
    },

    // 设置是否只读
    setIsReadonly(state, data) {
      setIsReadonly(data)
      syncLegacyVuexState(state)
    },

    // 设置源码编辑模式
    setIsSourceCodeEdit(state, data) {
      setIsSourceCodeEdit(data)
      syncLegacyVuexState(state)
    },

    // 设置导出时底部添加的文字
    setExtraTextOnExport(state, data) {
      setExtraTextOnExport(data)
      syncLegacyVuexState(state)
    },

    // 设置树节点拖拽
    setIsDragOutlineTreeNode(state, data) {
      setIsDragOutlineTreeNode(data)
      syncLegacyVuexState(state)
    },

    // 扩展主题列表
    setExtendThemeGroupList(state, data) {
      setExtendThemeGroupList(data)
      syncLegacyVuexState(state)
    },

    // 设置背景图片列表
    setBgList(state, data) {
      setBgList(data)
      syncLegacyVuexState(state)
    }
  },
  actions: {}
})

const { appStore, settingsStore, themeStore, aiStore } = getRuntimeStores()
;[appStore, settingsStore, themeStore, aiStore].forEach(target => {
  target.$subscribe(
    () => {
      syncLegacyVuexState(store.state)
    },
    {
      detached: true
    }
  )
})
syncLegacyVuexState(store.state)

export default store
