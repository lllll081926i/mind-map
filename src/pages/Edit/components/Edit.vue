<template>
  <div
    class="editContainer"
    @dragenter.stop.prevent="onDragenter"
    @dragleave.stop.prevent
    @dragover.stop.prevent
    @drop.stop.prevent
  >
    <div v-if="initErrorMessage" class="editInitError">
      <div class="editInitErrorCard">
        <div class="editInitErrorTitle">{{ $t('edit.tip') }}</div>
        <div class="editInitErrorMessage">{{ initErrorMessage }}</div>
        <div class="editInitErrorActions">
          <el-button @click="$router.push('/home')">返回首页</el-button>
          <el-button type="primary" @click="retryInit">重试</el-button>
        </div>
      </div>
    </div>
    <div
      class="mindMapContainer"
      id="mindMapContainer"
      ref="mindMapContainer"
    ></div>
    <Count :mindMap="mindMap" v-if="!isZenMode"></Count>
    <Navigator v-if="mindMap" :mindMap="mindMap"></Navigator>
    <NavigatorToolbar :mindMap="mindMap" v-if="!isZenMode"></NavigatorToolbar>
    <component
      :is="primarySidebarComponent"
      v-bind="primarySidebarProps"
      v-if="primarySidebarComponent"
    ></component>
    <AssociativeLineStyle
      v-if="mindMap"
      :mindMap="mindMap"
    ></AssociativeLineStyle>
    <Contextmenu v-if="mindMap" :mindMap="mindMap"></Contextmenu>
    <RichTextToolbar
      v-if="mindMap && richTextPluginReady"
      :mindMap="mindMap"
    ></RichTextToolbar>
    <NodeNoteContentShow
      v-if="mindMap"
      :mindMap="mindMap"
    ></NodeNoteContentShow>
    <NodeImgPreview v-if="mindMap" :mindMap="mindMap"></NodeImgPreview>
    <SidebarTrigger v-if="!isZenMode"></SidebarTrigger>
    <Search v-if="mindMap" :mindMap="mindMap"></Search>
    <NodeIconSidebar
      v-if="mindMap && activeSidebar === 'nodeIconSidebar'"
      :mindMap="mindMap"
    ></NodeIconSidebar>
    <NodeIconToolbar v-if="mindMap" :mindMap="mindMap"></NodeIconToolbar>
    <OutlineEdit v-if="mindMap && isOutlineEdit" :mindMap="mindMap"></OutlineEdit>
    <Scrollbar v-if="isShowScrollbar && mindMap" :mindMap="mindMap"></Scrollbar>
    <FormulaSidebar
      v-if="mindMap && openNodeRichText && richTextPluginReady"
      :mindMap="mindMap"
    ></FormulaSidebar>
    <NodeOuterFrame v-if="mindMap" :mindMap="mindMap"></NodeOuterFrame>
    <NodeTagStyle v-if="mindMap" :mindMap="mindMap"></NodeTagStyle>
    <NodeImgPlacementToolbar
      v-if="mindMap"
      :mindMap="mindMap"
    ></NodeImgPlacementToolbar>
    <NodeNoteSidebar
      v-if="mindMap && activeSidebar === 'noteSidebar'"
      :mindMap="mindMap"
    ></NodeNoteSidebar>
    <AiCreate v-if="mindMap && enableAi" :mindMap="mindMap"></AiCreate>
    <AiChat v-if="enableAi && activeSidebar === 'ai'"></AiChat>
    <div
      class="dragMask"
      v-if="showDragMask"
      @dragleave.stop.prevent="onDragleave"
      @dragover.stop.prevent
      @drop.stop.prevent="onDrop"
    >
      <div class="dragTip">{{ $t('edit.dragTip') }}</div>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import defaultNodeImage from '@/assets/img/图片加载失败.svg'
import Count from './Count.vue'
import { getData, getConfig, storeData } from '@/api'
import Navigator from './Navigator.vue'
import NodeImgPreview from './NodeImgPreview.vue'
import SidebarTrigger from './SidebarTrigger.vue'
import { mapState } from 'pinia'
import { createDefaultMindMapData } from '@/platform/shared/configSchema'
import { showLoading, hideLoading } from '@/utils/loading'
import {
  clearCurrentDataGetter,
  setCurrentDataGetter
} from '@/services/runtimeGlobals'
import { onShowLoading } from '@/services/appEvents'
import { ensureBootstrapDocumentState } from '@/platform'
import NodeTagStyle from './NodeTagStyle.vue'
import AssociativeLineStyle from './AssociativeLineStyle.vue'
import NodeImgPlacementToolbar from './NodeImgPlacementToolbar.vue'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'

const OutlineSidebar = defineAsyncComponent(() => import('./OutlineSidebar.vue'))
const NavigatorToolbar = defineAsyncComponent(() =>
  import('./NavigatorToolbar.vue')
)
const Contextmenu = defineAsyncComponent(() => import('./Contextmenu.vue'))
const Style = defineAsyncComponent(() => import('./Style.vue'))
const BaseStyle = defineAsyncComponent(() => import('./BaseStyle.vue'))
const Theme = defineAsyncComponent(() => import('./Theme.vue'))
const Structure = defineAsyncComponent(() => import('./Structure.vue'))
const Setting = defineAsyncComponent(() => import('./Setting.vue'))
const ShortcutKey = defineAsyncComponent(() => import('./ShortcutKey.vue'))
const Search = defineAsyncComponent(() => import('./Search.vue'))
const NodeIconSidebar = defineAsyncComponent(() =>
  import('./NodeIconSidebar.vue')
)
const NodeIconToolbar = defineAsyncComponent(() =>
  import('./NodeIconToolbar.vue')
)
const OutlineEdit = defineAsyncComponent(() => import('./OutlineEdit.vue'))
const Scrollbar = defineAsyncComponent(() => import('./Scrollbar.vue'))
const NodeOuterFrame = defineAsyncComponent(() =>
  import('./NodeOuterFrame.vue')
)
const AiCreate = defineAsyncComponent(() => import('./AiCreate.vue'))
const AiChat = defineAsyncComponent(() => import('./AiChat.vue'))
const RichTextToolbar = defineAsyncComponent(() =>
  import('./RichTextToolbar.vue')
)
const NodeNoteContentShow = defineAsyncComponent(() =>
  import('./NodeNoteContentShow.vue')
)
const FormulaSidebar = defineAsyncComponent(() =>
  import('./FormulaSidebar.vue')
)
const NodeNoteSidebar = defineAsyncComponent(() =>
  import('./NodeNoteSidebar.vue')
)

let richTextPluginsPromise = null
let exportBasePluginPromise = null
let exportPdfPluginPromise = null
let exportXMindPluginPromise = null
let scrollbarPluginPromise = null
let handleClipboardTextPromise = null
let mindMapRuntimePromise = null
let extendedIconListPromise = null
const VIEW_DATA_DEBOUNCE_MS = 300
const BUILTIN_NODE_ICON_TYPES = ['expression', 'priority', 'progress', 'sign']
const PRIMARY_SIDEBAR_COMPONENTS = {
  outline: OutlineSidebar,
  nodeStyle: Style,
  baseStyle: BaseStyle,
  theme: Theme,
  structure: Structure,
  setting: Setting,
  shortcutKey: ShortcutKey
}

const FORWARDED_MIND_MAP_EVENTS = [
  'node_active',
  'data_change',
  'view_data_change',
  'back_forward',
  'node_contextmenu',
  'node_click',
  'draw_click',
  'expand_btn_click',
  'svg_mousedown',
  'mouseup',
  'mode_change',
  'node_tree_render_end',
  'rich_text_selection_change',
  'transforming-dom-to-images',
  'generalization_node_contextmenu',
  'painter_start',
  'painter_end',
  'scrollbar_change',
  'scale',
  'translate',
  'node_attachmentClick',
  'node_attachmentContextmenu',
  'demonstrate_jump',
  'exit_demonstrate',
  'node_note_dblclick',
  'node_mousedown'
]

const loadMindMapRuntime = async () => {
  if (!mindMapRuntimePromise) {
    mindMapRuntimePromise = Promise.all([
      import('simple-mind-map'),
      import('simple-mind-map-plugin-themes'),
      import('simple-mind-map/src/plugins/MiniMap.js'),
      import('simple-mind-map/src/plugins/Watermark.js'),
      import('simple-mind-map/src/plugins/KeyboardNavigation.js'),
      import('simple-mind-map/src/plugins/Drag.js'),
      import('simple-mind-map/src/plugins/Select.js'),
      import('simple-mind-map/src/plugins/AssociativeLine.js'),
      import('simple-mind-map/src/plugins/TouchEvent.js'),
      import('simple-mind-map/src/plugins/NodeImgAdjust.js'),
      import('simple-mind-map/src/plugins/Search.js'),
      import('simple-mind-map/src/plugins/Painter.js'),
      import('simple-mind-map/src/plugins/RainbowLines.js'),
      import('simple-mind-map/src/plugins/Demonstrate.js'),
      import('simple-mind-map/src/plugins/OuterFrame.js'),
      import('simple-mind-map/src/plugins/MindMapLayoutPro.js'),
      import('simple-mind-map/src/plugins/NodeBase64ImageStorage.js')
    ]).then(
      ([
        mindMapModule,
        themesModule,
        miniMapModule,
        watermarkModule,
        keyboardNavigationModule,
        dragModule,
        selectModule,
        associativeLineModule,
        touchEventModule,
        nodeImgAdjustModule,
        searchPluginModule,
        painterModule,
        rainbowLinesModule,
        demonstrateModule,
        outerFrameModule,
        mindMapLayoutProModule,
        nodeBase64ImageStorageModule
      ]) => {
        const MindMap = mindMapModule.default
        MindMap.usePlugin(miniMapModule.default)
          .usePlugin(watermarkModule.default)
          .usePlugin(dragModule.default)
          .usePlugin(keyboardNavigationModule.default)
          .usePlugin(selectModule.default)
          .usePlugin(associativeLineModule.default)
          .usePlugin(nodeImgAdjustModule.default)
          .usePlugin(touchEventModule.default)
          .usePlugin(searchPluginModule.default)
          .usePlugin(painterModule.default)
          .usePlugin(rainbowLinesModule.default)
          .usePlugin(demonstrateModule.default)
          .usePlugin(outerFrameModule.default)
          .usePlugin(mindMapLayoutProModule.default)
          .usePlugin(nodeBase64ImageStorageModule.default)
        themesModule.default.init(MindMap)
        if (typeof MoreThemes !== 'undefined') {
          MoreThemes.init(MindMap)
        }
        return {
          MindMap
        }
      }
    )
  }
  return mindMapRuntimePromise
}

const loadScrollbarPlugin = async () => {
  if (!scrollbarPluginPromise) {
    scrollbarPluginPromise = import(
      'simple-mind-map/src/plugins/Scrollbar.js'
    ).then(module => module.default)
  }
  return scrollbarPluginPromise
}

const loadHandleClipboardText = async () => {
  if (!handleClipboardTextPromise) {
    handleClipboardTextPromise = import('@/utils/handleClipboardText').then(
      module => module.default
    )
  }
  return handleClipboardTextPromise
}

const loadExtendedIconList = async () => {
  if (!extendedIconListPromise) {
    extendedIconListPromise = import('@/config/icon').then(module => {
      return Array.isArray(module.default) ? module.default : []
    })
  }
  return extendedIconListPromise
}

const hasExtendedNodeIcons = data => {
  const visit = node => {
    if (!node || typeof node !== 'object') return false
    const nodeIcons = Array.isArray(node.data?.icon) ? node.data.icon : []
    if (
      nodeIcons.some(item => {
        const [type = ''] = String(item || '').split('_')
        return type && !BUILTIN_NODE_ICON_TYPES.includes(type)
      })
    ) {
      return true
    }
    const children = Array.isArray(node.children) ? node.children : []
    return children.some(child => visit(child))
  }
  return visit(data?.root || data)
}

const hasRichTextNodes = data => {
  const visit = node => {
    if (!node || typeof node !== 'object') return false
    if (node.data?.richText) {
      return true
    }
    const children = Array.isArray(node.children) ? node.children : []
    return children.some(child => visit(child))
  }
  return visit(data?.root || data)
}

const loadRichTextPlugins = async () => {
  if (!richTextPluginsPromise) {
    richTextPluginsPromise = Promise.all([
      import('simple-mind-map/src/plugins/RichText.js'),
      import('simple-mind-map/src/plugins/Formula.js')
    ]).then(([richTextModule, formulaModule]) => ({
      RichText: richTextModule.default,
      Formula: formulaModule.default
    }))
  }
  return richTextPluginsPromise
}

const loadExportBasePlugin = async () => {
  if (!exportBasePluginPromise) {
    exportBasePluginPromise = import('simple-mind-map/src/plugins/Export.js').then(
      module => module.default
    )
  }
  return exportBasePluginPromise
}

const loadExportPdfPlugin = async () => {
  if (!exportPdfPluginPromise) {
    exportPdfPluginPromise = import(
      'simple-mind-map/src/plugins/ExportPDF.js'
    ).then(module => module.default)
  }
  return exportPdfPluginPromise
}

const loadExportXMindPlugin = async () => {
  if (!exportXMindPluginPromise) {
    exportXMindPluginPromise = import(
      'simple-mind-map/src/plugins/ExportXMind.js'
    ).then(module => module.default)
  }
  return exportXMindPluginPromise
}

export default {
  components: {
    OutlineSidebar,
    Style,
    BaseStyle,
    Theme,
    Structure,
    Setting,
    Count,
    NavigatorToolbar,
    ShortcutKey,
    Contextmenu,
    RichTextToolbar,
    NodeNoteContentShow,
    Navigator,
    NodeImgPreview,
    SidebarTrigger,
    Search,
    NodeIconSidebar,
    NodeIconToolbar,
    OutlineEdit,
    Scrollbar,
    FormulaSidebar,
    NodeOuterFrame,
    NodeTagStyle,
    AssociativeLineStyle,
    NodeImgPlacementToolbar,
    NodeNoteSidebar,
    AiCreate,
    AiChat
  },
  data() {
    return {
      enableShowLoading: true,
      mindMap: null,
      mindMapData: null,
      mindMapConfig: {},
      prevImg: '',
      storeConfigTimer: null,
      resizeFrame: 0,
      showDragMask: false,
      onDataChange: null,
      onViewDataChange: null,
      richTextPluginReady: false,
      richTextPluginLoadingPromise: null,
      exportPluginState: {
        base: false,
        pdf: false,
        xmind: false
      },
      mindMapEventForwarders: {},
      extendedIconList: [],
      extendedIconLoaded: false,
      initErrorMessage: '',
      editorEventsBound: false
    }
  },
  computed: {
    ...mapState(useSettingsStore, {
      localConfig: 'localConfig'
    }),
    ...mapState(useAppStore, {
      extraTextOnExport: 'extraTextOnExport',
      isDragOutlineTreeNode: 'isDragOutlineTreeNode',
      activeSidebar: 'activeSidebar'
    }),
    isZenMode() {
      return this.localConfig.isZenMode
    },
    openNodeRichText() {
      return this.localConfig.openNodeRichText
    },
    isShowScrollbar() {
      return this.localConfig.isShowScrollbar
    },
    enableDragImport() {
      return this.localConfig.enableDragImport
    },
    useLeftKeySelectionRightKeyDrag() {
      return this.localConfig.useLeftKeySelectionRightKeyDrag
    },
    enableAi() {
      return this.localConfig.enableAi
    },
    primarySidebarComponent() {
      const key = this.activeSidebar
      if (!key) return null
      if (key === 'nodeStyle' && this.isZenMode) {
        return null
      }
      if (key !== 'shortcutKey' && !this.mindMap) {
        return null
      }
      return PRIMARY_SIDEBAR_COMPONENTS[key] || null
    },
    primarySidebarProps() {
      switch (this.activeSidebar) {
        case 'outline':
        case 'nodeStyle':
        case 'structure':
          return {
            mindMap: this.mindMap
          }
        case 'baseStyle':
          return {
            data: this.mindMapData,
            configData: this.mindMapConfig,
            mindMap: this.mindMap
          }
        case 'theme':
          return {
            data: this.mindMapData,
            mindMap: this.mindMap
          }
        case 'setting':
          return {
            configData: this.mindMapConfig,
            mindMap: this.mindMap
          }
        default:
          return {}
      }
    }
  },
  watch: {
    openNodeRichText() {
      if (this.openNodeRichText) {
        this.addRichTextPlugin()
      } else {
        this.removeRichTextPlugin()
      }
    },
    activeSidebar(value) {
      if (value === 'formulaSidebar' && this.openNodeRichText) {
        this.addRichTextPlugin()
      }
    },
    isShowScrollbar() {
      if (this.isShowScrollbar) {
        this.addScrollbarPlugin()
      } else {
        this.removeScrollbarPlugin()
      }
    }
  },
  async mounted() {
    showLoading()
    try {
      await ensureBootstrapDocumentState()
      this.getData()
      await this.init()
      this.bindEditorEvents()
    } catch (error) {
      this.handleInitError(error)
    }
  },
  beforeUnmount() {
    this.unbindEditorEvents()
    if (this.onDataChange) {
      this.$bus.$off('data_change', this.onDataChange)
    }
    if (this.onViewDataChange) {
      this.$bus.$off('view_data_change', this.onViewDataChange)
    }
    this.clearResizeFrame()
    clearTimeout(this.storeConfigTimer)
    clearCurrentDataGetter()
    this.unbindMindMapEvents()
  },
  unmounted() {
    if (this.mindMap && typeof this.mindMap.destroy === 'function') {
      this.mindMap.destroy()
    }
    this.mindMap = null
    richTextPluginsPromise = null
    exportBasePluginPromise = null
    exportPdfPluginPromise = null
    exportXMindPluginPromise = null
    scrollbarPluginPromise = null
    handleClipboardTextPromise = null
    mindMapRuntimePromise = null
    extendedIconListPromise = null
  },
  methods: {
    bindEditorEvents() {
      if (this.editorEventsBound) {
        return
      }
      this.$bus.$on('execCommand', this.execCommand)
      this.$bus.$on('paddingChange', this.onPaddingChange)
      this.$bus.$on('export', this.export)
      this.$bus.$on('setData', this.setData)
      this.$bus.$on('startTextEdit', this.handleStartTextEdit)
      this.$bus.$on('endTextEdit', this.handleEndTextEdit)
      this.$bus.$on(
        'createAssociativeLine',
        this.handleCreateLineFromActiveNode
      )
      this.$bus.$on('startPainter', this.handleStartPainter)
      this.$bus.$on('node_tree_render_end', this.handleHideLoading)
      this.removeShowLoadingListener = onShowLoading(this.handleShowLoading)
      window.addEventListener('resize', this.handleResize)
      this.editorEventsBound = true
    },

    unbindEditorEvents() {
      if (!this.editorEventsBound) {
        return
      }
      this.$bus.$off('execCommand', this.execCommand)
      this.$bus.$off('paddingChange', this.onPaddingChange)
      this.$bus.$off('export', this.export)
      this.$bus.$off('setData', this.setData)
      this.$bus.$off('startTextEdit', this.handleStartTextEdit)
      this.$bus.$off('endTextEdit', this.handleEndTextEdit)
      this.$bus.$off('createAssociativeLine', this.handleCreateLineFromActiveNode)
      this.$bus.$off('startPainter', this.handleStartPainter)
      this.$bus.$off('node_tree_render_end', this.handleHideLoading)
      this.removeShowLoadingListener && this.removeShowLoadingListener()
      this.removeShowLoadingListener = null
      window.removeEventListener('resize', this.handleResize)
      this.editorEventsBound = false
    },

    handleInitError(error) {
      console.error('Edit view init failed', error)
      this.initErrorMessage =
        error?.message || '编辑器初始化失败，请检查当前文档后重试'
      hideLoading()
    },

    async retryInit() {
      showLoading()
      this.initErrorMessage = ''
      try {
        this.enableShowLoading = true
        this.unbindMindMapEvents()
        if (this.mindMap && typeof this.mindMap.destroy === 'function') {
          this.mindMap.destroy()
        }
        this.mindMap = null
        this.getData()
        await this.init()
        this.bindEditorEvents()
      } catch (error) {
        this.handleInitError(error)
      }
    },

    handleStartTextEdit() {
      if (!this.mindMap?.renderer) return
      if (!this.openNodeRichText) {
        this.mindMap.renderer.startTextEdit()
        return
      }
      this.addRichTextPlugin()
        .then(() => {
          this.mindMap?.renderer?.startTextEdit()
        })
        .catch(error => {
          console.error('load rich text plugin before text edit failed', error)
        })
    },

    handleEndTextEdit() {
      this.mindMap?.renderer?.endTextEdit()
    },

    handleCreateLineFromActiveNode() {
      this.mindMap?.associativeLine?.createLineFromActiveNode()
    },

    handleStartPainter() {
      this.mindMap?.painter?.startPainter()
    },

    handleShowNoteContent(content, left, top, node) {
      this.$bus.$emit('showNoteContent', content, left, top, node)
    },

    handleResize() {
      this.scheduleResize()
    },

    clearResizeFrame() {
      if (!this.resizeFrame) {
        return
      }
      cancelAnimationFrame(this.resizeFrame)
      this.resizeFrame = 0
    },

    scheduleResize() {
      if (!this.mindMap || this.resizeFrame) {
        return
      }
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = 0
        this.mindMap?.resize()
      })
    },

    // 显示loading
    handleShowLoading() {
      this.enableShowLoading = true
      showLoading()
    },

    // 渲染结束后关闭loading
    handleHideLoading() {
      if (this.enableShowLoading) {
        this.enableShowLoading = false
        hideLoading()
      }
    },

    // 获取思维导图数据，实际应该调接口获取
    getData() {
      const nextMindMapData = getData()
      this.mindMapData = this.normalizeMindMapData(nextMindMapData)
      this.mindMapConfig = getConfig() || {}
    },

    normalizeMindMapData(data) {
      if (
        data &&
        typeof data === 'object' &&
        data.root &&
        data.theme &&
        typeof data.theme === 'object'
      ) {
        return data
      }
      console.error(
        'Invalid mind map bootstrap data, fallback to default desktop data',
        data
      )
      return createDefaultMindMapData()
    },

    // 存储数据当数据有变时
    bindSaveEvent() {
      if (this.onDataChange) {
        this.$bus.$off('data_change', this.onDataChange)
      }
      if (this.onViewDataChange) {
        this.$bus.$off('view_data_change', this.onViewDataChange)
      }
      this.onDataChange = data => {
        storeData({ root: data })
      }
      this.onViewDataChange = data => {
        clearTimeout(this.storeConfigTimer)
        this.storeConfigTimer = setTimeout(() => {
          storeData({
            view: data
          })
        }, VIEW_DATA_DEBOUNCE_MS)
      }
      this.$bus.$on('data_change', this.onDataChange)
      this.$bus.$on('view_data_change', this.onViewDataChange)
    },

    // 手动保存
    manualSave() {
      storeData(this.mindMap.getData(true))
    },

    resolveMindMapContainerEl() {
      const refEl = this.$refs.mindMapContainer
      if (refEl && typeof refEl.getBoundingClientRect === 'function') {
        return refEl
      }
      if (refEl?.$el && typeof refEl.$el.getBoundingClientRect === 'function') {
        return refEl.$el
      }
      const domEl = document.getElementById('mindMapContainer')
      if (domEl && typeof domEl.getBoundingClientRect === 'function') {
        return domEl
      }
      return null
    },

    getMindMapContainerReadyState() {
      const containerEl = this.resolveMindMapContainerEl()
      if (!containerEl) {
        return null
      }
      const rect = containerEl.getBoundingClientRect()
      if (!rect.width || !rect.height) {
        return null
      }
      return {
        containerEl,
        rect
      }
    },

    async waitForMindMapContainerReady(maxAttempts = 36) {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await this.$nextTick()
        await new Promise(resolve => requestAnimationFrame(resolve))
        const readyState = this.getMindMapContainerReadyState()
        if (readyState) {
          return readyState.containerEl
        }
      }
      if (!this.resolveMindMapContainerEl()) {
        throw new Error('mindMapContainer element unavailable')
      }
      throw new Error('mindMapContainer size is not ready')
    },

    createMindMapOptions({
      containerEl,
      handleClipboardText,
      icon,
      initialData,
      fallbackData,
      config,
      hasFileURL
    }) {
      let { root, layout, theme, view } = initialData
      const configBeforeTextEdit =
        typeof config?.beforeTextEdit === 'function' ? config.beforeTextEdit : null
      if (hasFileURL) {
        root = fallbackData.root
        layout = fallbackData.layout
        theme = fallbackData.theme
        view = null
      }
      return {
        el: containerEl,
        data: root,
        fit: false,
        layout: layout,
        theme: theme?.template || fallbackData.theme.template,
        themeConfig: theme?.config || fallbackData.theme.config,
        viewData: view,
        nodeTextEditZIndex: 1000,
        nodeNoteTooltipZIndex: 1000,
        customNoteContentShow: {
          show: this.handleShowNoteContent,
          hide: () => {}
        },
        openRealtimeRenderOnNodeTextEdit: true,
        enableAutoEnterTextEditWhenKeydown: true,
        demonstrateConfig: {
          openBlankMode: false
        },
        ...(config || {}),
        beforeTextEdit: async (node, isInserting) => {
          if (configBeforeTextEdit) {
            const allowEdit = await configBeforeTextEdit(node, isInserting)
            if (!allowEdit) {
              return false
            }
          }
          if (this.openNodeRichText) {
            await this.ensureRichTextPluginReady()
          }
          return true
        },
        iconList: [...icon],
        useLeftKeySelectionRightKeyDrag: this.useLeftKeySelectionRightKeyDrag,
        customInnerElsAppendTo: null,
        customHandleClipboardText: handleClipboardText,
        defaultNodeImage,
        initRootNodePosition: ['center', 'center'],
        handleIsSplitByWrapOnPasteCreateNewNode: () => {
          return this.$confirm(
            this.$t('edit.splitByWrap'),
            this.$t('edit.tip'),
            {
              confirmButtonText: this.$t('edit.yes'),
              cancelButtonText: this.$t('edit.no'),
              type: 'warning'
            }
          )
        },
        errorHandler: (code, err) => {
          console.error(err)
          switch (code) {
            case 'export_error':
              this.$message.error(this.$t('edit.exportError'))
              break
            default:
              break
          }
        },
        addContentToFooter: () => {
          const text = this.extraTextOnExport.trim()
          if (!text) return null
          const el = document.createElement('div')
          el.className = 'footer'
          el.textContent = text
          const cssText = `
            .footer {
              width: 100%;
              height: 30px;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 12px;
              color: #979797;
            }
          `
          return {
            el,
            cssText,
            height: 30
          }
        },
        expandBtnNumHandler: num => {
          return num >= 100 ? '…' : num
        },
        beforeDeleteNodeImg: _node => {
          return new Promise(resolve => {
            this.$confirm(
              this.$t('edit.deleteNodeImgTip'),
              this.$t('edit.tip'),
              {
                confirmButtonText: this.$t('edit.yes'),
                cancelButtonText: this.$t('edit.no'),
                type: 'warning'
              }
            )
              .then(() => {
                resolve(false)
              })
              .catch(() => {
                resolve(true)
              })
          })
        }
      }
    },

    patchMindMapExport() {
      if (!this.mindMap) return
      const rawExport = this.mindMap.export.bind(this.mindMap)
      this.mindMap.export = async (...args) => {
        await this.ensureExportPluginsLoaded(args[0])
        return rawExport(...args)
      }
    },

    bindMindMapEvents() {
      if (!this.mindMap) return
      this.unbindMindMapEvents()
      this.mindMapEventForwarders = FORWARDED_MIND_MAP_EVENTS.reduce(
        (handlers, eventName) => {
          handlers[eventName] = (...args) => {
            this.$bus.$emit(eventName, ...args)
          }
          return handlers
        },
        {}
      )
      Object.entries(this.mindMapEventForwarders).forEach(([eventName, handler]) => {
        this.mindMap.on(eventName, handler)
      })
    },

    unbindMindMapEvents() {
      if (!this.mindMap || !this.mindMapEventForwarders) return
      Object.entries(this.mindMapEventForwarders).forEach(([eventName, handler]) => {
        if (typeof this.mindMap.off === 'function') {
          this.mindMap.off(eventName, handler)
        }
      })
      this.mindMapEventForwarders = {}
    },

    registerCurrentDataGetter() {
      setCurrentDataGetter(() => {
        return this.getCurrentMindMapData()
      })
    },

    getCurrentMindMapData() {
      if (!this.mindMap) {
        return createDefaultMindMapData()
      }
      const fullData = this.mindMap.getData(true)
      return { ...fullData }
    },

    async ensureExtendedIconListLoaded(force = false) {
      if (!force && this.extendedIconLoaded) {
        return this.extendedIconList
      }
      const nextIconList = await loadExtendedIconList()
      this.extendedIconList = [...nextIconList]
      this.extendedIconLoaded = true
      if (this.mindMap) {
        this.mindMap.updateConfig({
          iconList: [...this.extendedIconList]
        })
      }
      return this.extendedIconList
    },

    // 初始化
    async init() {
      await this.$nextTick()
      const handleClipboardText = await loadHandleClipboardText()
      const { MindMap } = await loadMindMapRuntime()
      const hasFileURL = this.hasFileURL()
      const initialData = this.normalizeMindMapData(this.mindMapData)
      const fallbackData = createDefaultMindMapData(this.$t('edit.root'))
      const config = this.mindMapConfig
      if (hasExtendedNodeIcons(initialData)) {
        await this.ensureExtendedIconListLoaded(true)
      }
      const containerEl = await this.waitForMindMapContainerReady()
      this.mindMap = new MindMap(
        this.createMindMapOptions({
          containerEl,
          handleClipboardText,
          icon: this.extendedIconList,
          initialData,
          fallbackData,
          config,
          hasFileURL
        })
      )
      this.patchMindMapExport()
      await this.loadPlugins(initialData)
      this.mindMap.keyCommand.addShortcut('Control+s', () => {
        this.manualSave()
      })
      this.bindMindMapEvents()
      this.bindSaveEvent()
      if (hasFileURL) {
        this.$bus.$emit('handle_file_url')
      }
      this.registerCurrentDataGetter()
    },

    async ensureExportPluginsLoaded(exportType = 'smm') {
      if (!this.mindMap) return null
      if (!this.exportPluginState.base) {
        const ExportPlugin = await loadExportBasePlugin()
        this.mindMap.addPlugin(ExportPlugin)
        this.exportPluginState.base = true
      }
      if (exportType === 'pdf' && !this.exportPluginState.pdf) {
        const ExportPdfPlugin = await loadExportPdfPlugin()
        this.mindMap.addPlugin(ExportPdfPlugin)
        this.exportPluginState.pdf = true
      }
      if (exportType === 'xmind' && !this.exportPluginState.xmind) {
        const ExportXMindPlugin = await loadExportXMindPlugin()
        this.mindMap.addPlugin(ExportXMindPlugin)
        this.exportPluginState.xmind = true
      }
      return this.exportPluginState
    },

    async ensureRichTextPluginsLoaded() {
      return loadRichTextPlugins()
    },

    async ensureRichTextPluginReady() {
      if (!this.mindMap || !this.openNodeRichText) {
        return false
      }
      if (this.richTextPluginReady && this.mindMap.richText && this.mindMap.formula) {
        return true
      }
      if (this.richTextPluginLoadingPromise) {
        return this.richTextPluginLoadingPromise
      }
      this.richTextPluginLoadingPromise = (async () => {
        const { RichText, Formula } = await this.ensureRichTextPluginsLoaded()
        if (!this.mindMap || !this.openNodeRichText) {
          return false
        }
        if (!this.mindMap.richText) {
          this.mindMap.addPlugin(RichText)
        }
        if (!this.mindMap.formula) {
          this.mindMap.addPlugin(Formula)
        }
        this.richTextPluginReady = Boolean(
          this.mindMap.richText && this.mindMap.formula
        )
        return this.richTextPluginReady
      })()
      try {
        return await this.richTextPluginLoadingPromise
      } finally {
        this.richTextPluginLoadingPromise = null
      }
    },

    // 加载相关插件
    async loadPlugins(initialData = this.mindMapData) {
      const tasks = []
      if (hasRichTextNodes(initialData)) {
        if (this.openNodeRichText) {
          tasks.push(this.addRichTextPlugin())
        }
      }
      if (this.isShowScrollbar) {
        tasks.push(this.addScrollbarPlugin())
      }
      await Promise.all(tasks)
    },

    // url中是否存在要打开的文件
    hasFileURL() {
      const fileURL = this.$route.query.fileURL
      if (!fileURL) return false
      return /\.(smm|json|xmind|md)$/.test(fileURL)
    },

    // 动态设置思维导图数据
    async setData(data) {
      this.handleShowLoading()
      if (hasExtendedNodeIcons(data)) {
        await this.ensureExtendedIconListLoaded(true)
      }
      if (this.openNodeRichText && hasRichTextNodes(data)) {
        await this.ensureRichTextPluginReady()
      }
      const rootNodeData = data.root || data
      if (data.root) {
        this.mindMap.setFullData(data)
      } else {
        this.mindMap.setData(data)
      }
      this.mindMap?.view?.reset?.()
      this.manualSave()
      // 如果导入的是富文本内容，那么自动开启富文本模式
      if (rootNodeData.data.richText && !this.openNodeRichText) {
        this.$bus.$emit('toggleOpenNodeRichText', true)
        this.$notify.info({
          title: this.$t('edit.tip'),
          message: this.$t('edit.autoOpenNodeRichTextTip')
        })
      }
    },

    // 重新渲染
    reRender() {
      this.mindMap.reRender()
    },

    // 执行命令
    execCommand(...args) {
      this.mindMap.execCommand(...args)
    },

    // 导出
    async export(...args) {
      try {
        showLoading()
        await this.mindMap.export(...args)
        hideLoading()
      } catch (error) {
        console.error('export failed', error)
        hideLoading()
      }
    },

    // 修改导出内边距
    onPaddingChange(data) {
      this.mindMap.updateConfig(data)
    },

    // 加载节点富文本编辑插件
    async addRichTextPlugin() {
      return this.ensureRichTextPluginReady()
    },

    // 移除节点富文本编辑插件
    async removeRichTextPlugin() {
      this.richTextPluginReady = false
      this.richTextPluginLoadingPromise = null
      if (!this.mindMap || !richTextPluginsPromise) return
      const { RichText, Formula } = await this.ensureRichTextPluginsLoaded()
      if (!this.mindMap || this.openNodeRichText) return
      this.mindMap.removePlugin(Formula)
      this.mindMap.removePlugin(RichText)
    },

    // 加载滚动条插件
    async addScrollbarPlugin() {
      if (!this.mindMap) return
      const ScrollbarPlugin = await loadScrollbarPlugin()
      if (!this.mindMap || !this.isShowScrollbar) return
      this.mindMap.addPlugin(ScrollbarPlugin)
    },

    // 移除滚动条插件
    async removeScrollbarPlugin() {
      if (!this.mindMap || !scrollbarPluginPromise) return
      const ScrollbarPlugin = await loadScrollbarPlugin()
      if (!this.mindMap || this.isShowScrollbar) return
      this.mindMap.removePlugin(ScrollbarPlugin)
    },

    // 拖拽文件到页面导入
    onDragenter() {
      if (!this.enableDragImport || this.isDragOutlineTreeNode) return
      this.showDragMask = true
    },

    onDragleave() {
      this.showDragMask = false
    },

    onDrop(e) {
      if (!this.enableDragImport) return
      this.showDragMask = false
      const dt = e.dataTransfer
      const file = dt.files && dt.files[0]
      if (!file) return
      this.$bus.$emit('importFile', file)
    }
  }
}
</script>

<style lang="less" scoped>
.editContainer {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;

  .editInitError {
    position: absolute;
    inset: 0;
    z-index: 4001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(255, 255, 255, 0.92);
  }

  .editInitErrorCard {
    width: min(460px, 100%);
    padding: 24px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 16px 48px rgba(15, 23, 42, 0.12);
  }

  .editInitErrorTitle {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .editInitErrorMessage {
    margin-top: 10px;
    color: rgba(31, 41, 55, 0.72);
    line-height: 1.6;
    word-break: break-word;
  }

  .editInitErrorActions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 18px;
  }

  .dragMask {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3999;

    .dragTip {
      pointer-events: none;
      font-weight: bold;
    }
  }

  .mindMapContainer {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
  }
}
</style>
