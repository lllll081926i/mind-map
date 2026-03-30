import Vue from 'vue'
import Vuex from 'vuex'
import { storeLocalConfig } from '@/api'
import {
  AI_CONFIG_KEYS,
  getDefaultAiConfig,
  normalizeAiConfig
} from '@/utils/aiProviders.mjs'
import { DEFAULT_LOCAL_CONFIG } from '@/platform/shared/configSchema'

Vue.use(Vuex)

const store = new Vuex.Store({
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
      state.isHandleLocalFile = data
    },

    // 设置本地配置
    setLocalConfig(state, data) {
      const nextAiConfig = {
        ...state.aiConfig
      }
      Object.keys(data).forEach(key => {
        if (AI_CONFIG_KEYS.includes(key)) {
          nextAiConfig[key] = data[key]
        } else {
          state.localConfig[key] = data[key]
        }
      })
      state.aiConfig = normalizeAiConfig(nextAiConfig)
      if (!state.localConfig.enableAi && state.activeSidebar === 'ai') {
        state.activeSidebar = ''
      }
      storeLocalConfig({
        ...state.localConfig,
        ...state.aiConfig
      })
    },

    // 设置当前显示的侧边栏
    setActiveSidebar(state, data) {
      if (data === 'ai' && !state.localConfig.enableAi) {
        state.activeSidebar = ''
        return
      }
      state.activeSidebar = data
    },

    // 设置大纲编辑模式
    setIsOutlineEdit(state, data) {
      state.isOutlineEdit = data
    },

    // 设置是否只读
    setIsReadonly(state, data) {
      state.isReadonly = data
    },

    // 设置源码编辑模式
    setIsSourceCodeEdit(state, data) {
      state.isSourceCodeEdit = data
    },

    // 设置导出时底部添加的文字
    setExtraTextOnExport(state, data) {
      state.extraTextOnExport = data
    },

    // 设置树节点拖拽
    setIsDragOutlineTreeNode(state, data) {
      state.isDragOutlineTreeNode = data
    },

    // 扩展主题列表
    setExtendThemeGroupList(state, data) {
      state.extendThemeGroupList = data
    },

    // 设置背景图片列表
    setBgList(state, data) {
      state.bgList = data
    }
  },
  actions: {}
})

export default store
