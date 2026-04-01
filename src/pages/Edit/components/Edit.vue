<template>
  <div
    class="editContainer"
    @dragenter.stop.prevent="onDragenter"
    @dragleave.stop.prevent
    @dragover.stop.prevent
    @drop.stop.prevent
  >
    <div
      class="mindMapContainer"
      id="mindMapContainer"
      ref="mindMapContainer"
    ></div>
    <Count :mindMap="mindMap" v-if="!isZenMode"></Count>
    <Navigator v-if="mindMap" :mindMap="mindMap"></Navigator>
    <NavigatorToolbar :mindMap="mindMap" v-if="!isZenMode"></NavigatorToolbar>
    <OutlineSidebar
      v-if="mindMap && activeSidebar === 'outline'"
      :mindMap="mindMap"
    ></OutlineSidebar>
    <Style
      v-if="mindMap && !isZenMode && activeSidebar === 'nodeStyle'"
      :mindMap="mindMap"
    ></Style>
    <BaseStyle
      v-if="mindMap && activeSidebar === 'baseStyle'"
      :data="mindMapData"
      :configData="mindMapConfig"
      :mindMap="mindMap"
    ></BaseStyle>
    <AssociativeLineStyle
      v-if="mindMap"
      :mindMap="mindMap"
    ></AssociativeLineStyle>
    <Theme
      v-if="mindMap && activeSidebar === 'theme'"
      :data="mindMapData"
      :mindMap="mindMap"
    ></Theme>
    <Structure
      v-if="mindMap && activeSidebar === 'structure'"
      :mindMap="mindMap"
    ></Structure>
    <ShortcutKey v-if="activeSidebar === 'shortcutKey'"></ShortcutKey>
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
    <OutlineEdit v-if="mindMap" :mindMap="mindMap"></OutlineEdit>
    <Scrollbar v-if="isShowScrollbar && mindMap" :mindMap="mindMap"></Scrollbar>
    <FormulaSidebar
      v-if="mindMap && openNodeRichText && richTextPluginReady"
      :mindMap="mindMap"
    ></FormulaSidebar>
    <NodeOuterFrame v-if="mindMap" :mindMap="mindMap"></NodeOuterFrame>
    <NodeTagStyle v-if="mindMap" :mindMap="mindMap"></NodeTagStyle>
    <Setting
      v-if="mindMap && activeSidebar === 'setting'"
      :configData="mindMapConfig"
      :mindMap="mindMap"
    ></Setting>
    <NodeImgPlacementToolbar
      v-if="mindMap"
      :mindMap="mindMap"
    ></NodeImgPlacementToolbar>
    <NodeNoteSidebar
      v-if="mindMap && activeSidebar === 'noteSidebar'"
      :mindMap="mindMap"
    ></NodeNoteSidebar>
    <AiCreate v-if="mindMap && enableAi" :mindMap="mindMap"></AiCreate>
    <AiChat v-if="enableAi"></AiChat>
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
import MindMap from 'simple-mind-map'
import MiniMap from 'simple-mind-map/src/plugins/MiniMap.js'
import Watermark from 'simple-mind-map/src/plugins/Watermark.js'
import KeyboardNavigation from 'simple-mind-map/src/plugins/KeyboardNavigation.js'
import Drag from 'simple-mind-map/src/plugins/Drag.js'
import Select from 'simple-mind-map/src/plugins/Select.js'
import AssociativeLine from 'simple-mind-map/src/plugins/AssociativeLine.js'
import TouchEvent from 'simple-mind-map/src/plugins/TouchEvent.js'
import NodeImgAdjust from 'simple-mind-map/src/plugins/NodeImgAdjust.js'
import SearchPlugin from 'simple-mind-map/src/plugins/Search.js'
import Painter from 'simple-mind-map/src/plugins/Painter.js'
import ScrollbarPlugin from 'simple-mind-map/src/plugins/Scrollbar.js'
import RainbowLines from 'simple-mind-map/src/plugins/RainbowLines.js'
import Demonstrate from 'simple-mind-map/src/plugins/Demonstrate.js'
import OuterFrame from 'simple-mind-map/src/plugins/OuterFrame.js'
import MindMapLayoutPro from 'simple-mind-map/src/plugins/MindMapLayoutPro.js'
import NodeBase64ImageStorage from 'simple-mind-map/src/plugins/NodeBase64ImageStorage.js'
import Themes from 'simple-mind-map-plugin-themes'
// 协同编辑插件
// import Cooperate from 'simple-mind-map/src/plugins/Cooperate.js'
import Count from './Count.vue'
import NavigatorToolbar from './NavigatorToolbar.vue'
import Contextmenu from './Contextmenu.vue'
import { getData, getConfig, storeData } from '@/api'
import Navigator from './Navigator.vue'
import NodeImgPreview from './NodeImgPreview.vue'
import SidebarTrigger from './SidebarTrigger.vue'
import { mapState } from 'pinia'
import Search from './Search.vue'
import NodeIconSidebar from './NodeIconSidebar.vue'
import NodeIconToolbar from './NodeIconToolbar.vue'
import OutlineEdit from './OutlineEdit.vue'
import { showLoading, hideLoading } from '@/utils/loading'
import handleClipboardText from '@/utils/handleClipboardText'
import { getParentWithClass } from '@/utils'
import Scrollbar from './Scrollbar.vue'
import {
  clearCurrentDataGetter,
  setCurrentDataGetter
} from '@/services/runtimeGlobals'
import { ensureBootstrapDocumentState } from '@/platform'
import exampleData from 'simple-mind-map/example/exampleData'
import { simpleDeepClone } from 'simple-mind-map/src/utils/index'
import NodeOuterFrame from './NodeOuterFrame.vue'
import NodeTagStyle from './NodeTagStyle.vue'
import AssociativeLineStyle from './AssociativeLineStyle.vue'
import NodeImgPlacementToolbar from './NodeImgPlacementToolbar.vue'
import defaultNodeImage from '../../../assets/img/图片加载失败.svg'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'

const OutlineSidebar = defineAsyncComponent(() => import('./OutlineSidebar.vue'))
const Style = defineAsyncComponent(() => import('./Style.vue'))
const BaseStyle = defineAsyncComponent(() => import('./BaseStyle.vue'))
const Theme = defineAsyncComponent(() => import('./Theme.vue'))
const Structure = defineAsyncComponent(() => import('./Structure.vue'))
const ShortcutKey = defineAsyncComponent(() => import('./ShortcutKey.vue'))
const Setting = defineAsyncComponent(() => import('./Setting.vue'))
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
let exportPluginsPromise = null

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

const loadExportPlugins = async () => {
  if (!exportPluginsPromise) {
    exportPluginsPromise = Promise.all([
      import('simple-mind-map/src/plugins/ExportPDF.js'),
      import('simple-mind-map/src/plugins/ExportXMind.js'),
      import('simple-mind-map/src/plugins/Export.js')
    ]).then(([exportPdfModule, exportXMindModule, exportModule]) => ({
      ExportPDF: exportPdfModule.default,
      ExportXMind: exportXMindModule.default,
      Export: exportModule.default
    }))
  }
  return exportPluginsPromise
}

// 注册插件
MindMap.usePlugin(MiniMap)
  .usePlugin(Watermark)
  .usePlugin(Drag)
  .usePlugin(KeyboardNavigation)
  .usePlugin(Select)
  .usePlugin(AssociativeLine)
  .usePlugin(NodeImgAdjust)
  .usePlugin(TouchEvent)
  .usePlugin(SearchPlugin)
  .usePlugin(Painter)
  .usePlugin(RainbowLines)
  .usePlugin(Demonstrate)
  .usePlugin(OuterFrame)
  .usePlugin(MindMapLayoutPro)
  .usePlugin(NodeBase64ImageStorage)
// .usePlugin(Cooperate) // 协同插件

// 注册主题
Themes.init(MindMap)
// 扩展主题列表
if (typeof MoreThemes !== 'undefined') {
  MoreThemes.init(MindMap)
}

export default {
  components: {
    OutlineSidebar,
    Style,
    BaseStyle,
    Theme,
    Structure,
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
    Setting,
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
      showDragMask: false,
      onDataChange: null,
      onViewDataChange: null,
      richTextPluginReady: false
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
      this.$bus.$on('showLoading', this.handleShowLoading)
      window.addEventListener('resize', this.handleResize)
    } catch (error) {
      console.error('Edit view init failed', error)
      hideLoading()
    }
  },
  beforeUnmount() {
    this.$bus.$off('execCommand', this.execCommand)
    this.$bus.$off('paddingChange', this.onPaddingChange)
    this.$bus.$off('export', this.export)
    this.$bus.$off('setData', this.setData)
    this.$bus.$off('startTextEdit', this.handleStartTextEdit)
    this.$bus.$off('endTextEdit', this.handleEndTextEdit)
    this.$bus.$off('createAssociativeLine', this.handleCreateLineFromActiveNode)
    this.$bus.$off('startPainter', this.handleStartPainter)
    this.$bus.$off('node_tree_render_end', this.handleHideLoading)
    this.$bus.$off('showLoading', this.handleShowLoading)
    window.removeEventListener('resize', this.handleResize)
    if (this.onDataChange) {
      this.$bus.$off('data_change', this.onDataChange)
    }
    if (this.onViewDataChange) {
      this.$bus.$off('view_data_change', this.onViewDataChange)
    }
    clearTimeout(this.storeConfigTimer)
    clearCurrentDataGetter()
    if (this.mindMap) {
      this.mindMap.destroy()
    }
  },
  methods: {
    handleStartTextEdit() {
      this.mindMap.renderer.startTextEdit()
    },

    handleEndTextEdit() {
      this.mindMap.renderer.endTextEdit()
    },

    handleCreateLineFromActiveNode() {
      this.mindMap.associativeLine.createLineFromActiveNode()
    },

    handleStartPainter() {
      this.mindMap.painter.startPainter()
    },

    handleResize() {
      this.mindMap.resize()
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
        'Invalid mind map bootstrap data, fallback to example data',
        data
      )
      return simpleDeepClone(exampleData)
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
        }, 300)
      }
      this.$bus.$on('data_change', this.onDataChange)
      this.$bus.$on('view_data_change', this.onViewDataChange)
    },

    // 手动保存
    manualSave() {
      storeData(this.mindMap.getData(true))
    },

    // 初始化
    async init() {
      const { default: icon } = await import('@/config/icon')
      let hasFileURL = this.hasFileURL()
      const initialData = this.normalizeMindMapData(this.mindMapData)
      let { root, layout, theme, view } = initialData
      const config = this.mindMapConfig
      // 如果url中存在要打开的文件，那么思维导图数据、主题、布局都使用默认的
      if (hasFileURL) {
        root = {
          data: {
            text: this.$t('edit.root')
          },
          children: []
        }
        layout = exampleData.layout
        theme = exampleData.theme
        view = null
      }
      this.mindMap = new MindMap({
        el: this.$refs.mindMapContainer,
        data: root,
        fit: false,
        layout: layout,
        theme: theme?.template || exampleData.theme.template,
        themeConfig: theme?.config || exampleData.theme.config,
        viewData: view,
        nodeTextEditZIndex: 1000,
        nodeNoteTooltipZIndex: 1000,
        customNoteContentShow: {
          show: (content, left, top, node) => {
            this.$bus.$emit('showNoteContent', content, left, top, node)
          },
          hide: () => {
            // this.$bus.$emit('hideNoteContent')
          }
        },
        openRealtimeRenderOnNodeTextEdit: true,
        enableAutoEnterTextEditWhenKeydown: true,
        demonstrateConfig: {
          openBlankMode: false
        },
        ...(config || {}),
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
        beforeDeleteNodeImg: node => {
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
      })
      const rawExport = this.mindMap.export.bind(this.mindMap)
      this.mindMap.export = async (...args) => {
        await this.ensureExportPluginsLoaded()
        return rawExport(...args)
      }
      await this.loadPlugins()
      this.mindMap.keyCommand.addShortcut('Control+s', () => {
        this.manualSave()
      })
      // 转发事件
      ;[
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
      ].forEach(event => {
        this.mindMap.on(event, (...args) => {
          this.$bus.$emit(event, ...args)
        })
      })
      this.bindSaveEvent()
      // 解析url中的文件
      if (hasFileURL) {
        this.$bus.$emit('handle_file_url')
      }
      // api/index.js文件使用
      // 当正在编辑本地文件时通过该方法获取最新数据
      setCurrentDataGetter(() => {
        const fullData = this.mindMap.getData(true)
        return { ...fullData }
      })
      // 协同测试
      this.cooperateTest()
    },

    async ensureExportPluginsLoaded() {
      if (!this.mindMap) return null
      const { ExportPDF, ExportXMind, Export } = await loadExportPlugins()
      this.mindMap.addPlugin(ExportPDF)
      this.mindMap.addPlugin(ExportXMind)
      this.mindMap.addPlugin(Export)
      return {
        ExportPDF,
        ExportXMind,
        Export
      }
    },

    async ensureRichTextPluginsLoaded() {
      return loadRichTextPlugins()
    },

    // 加载相关插件
    async loadPlugins() {
      const tasks = []
      if (this.openNodeRichText) {
        tasks.push(this.addRichTextPlugin())
      }
      if (this.isShowScrollbar) {
        tasks.push(Promise.resolve(this.addScrollbarPlugin()))
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
    setData(data) {
      this.handleShowLoading()
      let rootNodeData = null
      if (data.root) {
        this.mindMap.setFullData(data)
        rootNodeData = data.root
      } else {
        this.mindMap.setData(data)
        rootNodeData = data
      }
      this.mindMap.view.reset()
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
        console.log(error)
        hideLoading()
      }
    },

    // 修改导出内边距
    onPaddingChange(data) {
      this.mindMap.updateConfig(data)
    },

    // 加载节点富文本编辑插件
    async addRichTextPlugin() {
      if (!this.mindMap) return
      const { RichText, Formula } = await this.ensureRichTextPluginsLoaded()
      if (!this.mindMap || !this.openNodeRichText) return
      this.mindMap.addPlugin(RichText)
      this.mindMap.addPlugin(Formula)
      this.richTextPluginReady = true
    },

    // 移除节点富文本编辑插件
    async removeRichTextPlugin() {
      this.richTextPluginReady = false
      if (!this.mindMap || !richTextPluginsPromise) return
      const { RichText, Formula } = await this.ensureRichTextPluginsLoaded()
      if (!this.mindMap || this.openNodeRichText) return
      this.mindMap.removePlugin(Formula)
      this.mindMap.removePlugin(RichText)
    },

    // 加载滚动条插件
    addScrollbarPlugin() {
      if (!this.mindMap) return
      this.mindMap.addPlugin(ScrollbarPlugin)
    },

    // 移除滚动条插件
    removeScrollbarPlugin() {
      this.mindMap.removePlugin(ScrollbarPlugin)
    },

    // 协同测试
    cooperateTest() {
      const isLocalDebugHost = ['localhost', '127.0.0.1'].includes(
        window.location.hostname
      )
      const enableCooperateDebug = this.$route.query.cooperateDebug === '1'
      if (
        this.mindMap.cooperate &&
        this.$route.query.userName &&
        enableCooperateDebug &&
        isLocalDebugHost
      ) {
        this.mindMap.cooperate.setProvider(null, {
          roomName: 'demo-room',
          signalingList: ['ws://localhost:4444']
        })
        this.mindMap.cooperate.setUserInfo({
          id: Math.random(),
          name: this.$route.query.userName,
          color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'][
            Math.floor(Math.random() * 5)
          ],
          avatar:
            Math.random() > 0.5
              ? 'https://img0.baidu.com/it/u=4270674549,2416627993&fm=253&app=138&size=w931&n=0&f=JPEG&fmt=auto?sec=1696006800&t=4d32871d14a7224a4591d0c3c7a97311'
              : ''
        })
      }
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
