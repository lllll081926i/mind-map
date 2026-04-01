<template>
  <div class="toolbarContainer" :class="{ isDark: isDark }">
    <div class="toolbar" ref="toolbarRef">
      <!-- 节点操作 -->
      <div class="toolbarBlock">
        <ToolbarNodeBtnList
          :list="horizontalList"
          @show-node-image="openNodeImageDialog"
          @show-node-link="openNodeLinkDialog"
          @show-node-note="openNodeNoteDialog"
          @show-node-tag="openNodeTagDialog"
        ></ToolbarNodeBtnList>
        <!-- 更多 -->
        <el-popover
          v-model:visible="popoverShow"
          placement="bottom-end"
          width="120"
          trigger="hover"
          v-if="showMoreBtn"
          :style="{ marginLeft: horizontalList.length > 0 ? '20px' : 0 }"
        >
          <ToolbarNodeBtnList
            dir="v"
            :list="verticalList"
            @click="popoverShow = false"
            @show-node-image="openNodeImageDialog"
            @show-node-link="openNodeLinkDialog"
            @show-node-note="openNodeNoteDialog"
            @show-node-tag="openNodeTagDialog"
          ></ToolbarNodeBtnList>
          <template #reference>
            <div
              class="toolbarBtn"
              role="button"
              tabindex="0"
              :aria-label="$t('toolbar.more')"
              @keydown.enter.prevent="popoverShow = !popoverShow"
              @keydown.space.prevent="popoverShow = !popoverShow"
            >
              <span class="icon iconfont icongongshi"></span>
              <span class="text">{{ $t('toolbar.more') }}</span>
            </div>
          </template>
        </el-popover>
      </div>
      <!-- 导出 -->
      <div class="toolbarBlock">
        <div
          class="toolbarBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.directory')"
          @click="openDirectory"
          @keydown.enter.prevent="openDirectory"
          @keydown.space.prevent="openDirectory"
          v-if="!isMobile"
        >
          <span class="icon iconfont icondakai"></span>
          <span class="text">{{ $t('toolbar.directory') }}</span>
        </div>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.newFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div
            class="toolbarBtn"
            role="button"
            tabindex="0"
            :aria-label="$t('toolbar.newFile')"
            @click="createNewLocalFile"
            @keydown.enter.prevent="createNewLocalFile"
            @keydown.space.prevent="createNewLocalFile"
          >
            <span class="icon iconfont iconxinjian"></span>
            <span class="text">{{ $t('toolbar.newFile') }}</span>
          </div>
        </el-tooltip>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.openFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div
            class="toolbarBtn"
            role="button"
            tabindex="0"
            :aria-label="$t('toolbar.openFile')"
            @click="openLocalFile"
            @keydown.enter.prevent="openLocalFile"
            @keydown.space.prevent="openLocalFile"
          >
            <span class="icon iconfont iconwenjian1"></span>
            <span class="text">{{ $t('toolbar.openFile') }}</span>
          </div>
        </el-tooltip>
        <el-dropdown
          v-if="!isMobile && isDesktopRuntime"
          trigger="click"
          @command="openRecentFile"
        >
          <div
            class="toolbarBtn"
            role="button"
            tabindex="0"
            :aria-label="$t('toolbar.recentFiles')"
          >
            <span class="icon iconfont iconwenjian"></span>
            <span class="text">{{ $t('toolbar.recentFiles') }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in recentFiles"
                :key="item.path"
                :command="item"
              >
                {{ item.name }}
              </el-dropdown-item>
              <el-dropdown-item v-if="recentFiles.length <= 0" disabled>
                {{ $t('toolbar.noRecentFiles') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div
          class="toolbarBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.saveAs')"
          @click="saveLocalFile"
          @keydown.enter.prevent="saveLocalFile"
          @keydown.space.prevent="saveLocalFile"
          v-if="!isMobile"
        >
          <span class="icon iconfont iconlingcunwei"></span>
          <span class="text">{{ $t('toolbar.saveAs') }}</span>
        </div>
        <div
          class="toolbarBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.import')"
          @click="openImportDialog"
          @keydown.enter.prevent="openImportDialog"
          @keydown.space.prevent="openImportDialog"
        >
          <span class="icon iconfont icondaoru"></span>
          <span class="text">{{ $t('toolbar.import') }}</span>
        </div>
        <div class="toolbarDivider"></div>
        <div
          class="toolbarBtn pageEntryBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.exportCenter')"
          @click="openExportDialog"
          @keydown.enter.prevent="openExportDialog"
          @keydown.space.prevent="openExportDialog"
        >
          <span class="icon iconfont iconexport"></span>
          <span class="text">{{ $t('toolbar.exportCenter') }}</span>
        </div>
        <div
          class="toolbarBtn pageEntryBtn"
          role="button"
          tabindex="0"
          :aria-label="$t('toolbar.returnHome')"
          @click="goHome"
          @keydown.enter.prevent="goHome"
          @keydown.space.prevent="goHome"
        >
          <span class="icon iconfont iconzhuye"></span>
          <span class="text">{{ $t('toolbar.returnHome') }}</span>
        </div>
        <!-- 本地文件树 -->
        <div
          class="fileTreeBox"
          v-if="fileTreeVisible"
          :class="{ expand: fileTreeExpand }"
        >
          <div class="fileTreeToolbar">
            <div class="fileTreeName">
              {{ rootDirName ? '/' + rootDirName : '' }}
            </div>
            <div class="fileTreeActionList">
              <div
                class="btn"
                :class="{ expanded: fileTreeExpand }"
                role="button"
                tabindex="0"
                :aria-label="
                  fileTreeExpand
                    ? $t('toolbar.collapseDirectory')
                    : $t('toolbar.expandDirectory')
                "
                @click="fileTreeExpand = !fileTreeExpand"
                @keydown.enter.prevent="fileTreeExpand = !fileTreeExpand"
                @keydown.space.prevent="fileTreeExpand = !fileTreeExpand"
              >
                v
              </div>
              <div
                class="btn closeBtn"
                role="button"
                tabindex="0"
                :aria-label="$t('toolbar.closeDirectory')"
                @click="fileTreeVisible = false"
                @keydown.enter.prevent="fileTreeVisible = false"
                @keydown.space.prevent="fileTreeVisible = false"
              >
                x
              </div>
            </div>
          </div>
          <div class="fileTreeWrap">
            <el-tree
              :props="fileTreeProps"
              :load="loadFileTreeNode"
              :expand-on-click-node="false"
              node-key="id"
              lazy
            >
              <template #default="{ node, data }">
                <span class="customTreeNode">
                  <div class="treeNodeInfo">
                    <span
                      class="treeNodeIcon iconfont"
                      :class="[
                        data.type === 'file' ? 'iconwenjian' : 'icondakai'
                      ]"
                    ></span>
                    <span class="treeNodeName">{{ node.label }}</span>
                  </div>
                  <div class="treeNodeBtnList" v-if="data.type === 'file'">
                    <el-button
                      type="text"
                      size="small"
                      v-if="data.enableEdit"
                      @click="editLocalFile(data)"
                      >{{ $t('toolbar.edit') }}</el-button
                    >
                    <el-button
                      type="text"
                      size="small"
                      v-else
                      @click="importLocalFile(data)"
                      >{{ $t('toolbar.importAction') }}</el-button
                    >
                  </div>
                </span>
              </template>
            </el-tree>
          </div>
        </div>
      </div>
      <div class="toolbarMeasure">
        <div class="toolbarBlock isMeasure" ref="toolbarMeasureBlockRef">
          <div ref="toolbarMeasureListRef">
            <ToolbarNodeBtnList :list="btnLit"></ToolbarNodeBtnList>
          </div>
          <div class="toolbarBtn" ref="toolbarMeasureMoreRef">
            <span class="icon iconfont icongongshi"></span>
            <span class="text">{{ $t('toolbar.more') }}</span>
          </div>
        </div>
      </div>
    </div>
    <NodeImage v-if="mountedPanels.nodeImage" ref="NodeImageRef"></NodeImage>
    <NodeHyperlink
      v-if="mountedPanels.nodeHyperlink"
      ref="NodeHyperlinkRef"
    ></NodeHyperlink>
    <NodeNote v-if="mountedPanels.nodeNote" ref="NodeNoteRef"></NodeNote>
    <NodeTag v-if="mountedPanels.nodeTag" ref="NodeTagRef"></NodeTag>
    <Import v-if="mountedPanels.import" ref="ImportRef"></Import>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { mapState } from 'pinia'
import { ElNotification as Notification } from 'element-plus'
import { getData } from '@/api'
import ToolbarNodeBtnList from './ToolbarNodeBtnList.vue'
import { throttle, isMobile } from 'simple-mind-map/src/utils/index'
import platform, {
  getCurrentFileRef,
  getLastDirectory,
  getRecentFiles,
  isDesktopApp,
  markDocumentDirty,
  recordRecentFile,
  setLastDirectory
} from '@/platform'
import { createDefaultMindMapData } from '@/platform/shared/configSchema'
import {
  createDesktopFsError,
  setCurrentFileRef,
  updateCurrentFileRef
} from '@/services/documentSession'
import {
  onBootstrapStateReady,
  emitShowImport,
  emitShowNodeImage,
  emitShowNodeLink,
  emitShowNodeNote,
  emitShowNodeTag,
  onWriteLocalFile
} from '@/services/appEvents'
import {
  setIsHandleLocalFile,
  setRecentFiles,
  syncEditorFileSession
} from '@/stores/runtime'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'

const NodeImage = defineAsyncComponent(() => import('./NodeImage.vue'))
const NodeHyperlink = defineAsyncComponent(() => import('./NodeHyperlink.vue'))
const NodeNote = defineAsyncComponent(() => import('./NodeNote.vue'))
const NodeTag = defineAsyncComponent(() => import('./NodeTag.vue'))
const Import = defineAsyncComponent(() => import('./Import.vue'))
const LOCAL_FILE_WRITE_DEBOUNCE_MS = 1000

// 工具栏
const defaultBtnList = [
  'back',
  'forward',
  'painter',
  'siblingNode',
  'childNode',
  'deleteNode',
  'image',
  'icon',
  'link',
  'note',
  'tag',
  'summary',
  'associativeLine',
  'formula',
  'outerFrame',
  'annotation',
  'ai'
]

export default {
  components: {
    NodeImage,
    NodeHyperlink,
    NodeNote,
    NodeTag,
    Import,
    ToolbarNodeBtnList
  },
  data() {
    return {
      isMobile: isMobile(),
      horizontalList: [],
      verticalList: [],
      showMoreBtn: true,
      popoverShow: false,
      fileTreeProps: {
        label: 'name',
        children: 'children',
        isLeaf: 'leaf'
      },
      recentFiles: [],
      fileTreeVisible: false,
      rootDirName: '',
      fileTreeExpand: true,
      waitingWriteToLocalFile: false,
      layoutMeasureToken: 0,
      mountedPanels: {
        nodeImage: false,
        nodeHyperlink: false,
        nodeNote: false,
        nodeTag: false,
        import: false
      }
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useAppStore, {
      isHandleLocalFile: 'isHandleLocalFile'
    }),
    ...mapState(useSettingsStore, {
      localConfig: 'localConfig'
    }),

    isDesktopRuntime() {
      return isDesktopApp()
    },

    openNodeRichText() {
      return this.localConfig.openNodeRichText
    },

    enableAi() {
      return this.localConfig.enableAi
    },

    btnLit() {
      let res = [...defaultBtnList]
      if (!this.openNodeRichText) {
        res = res.filter(item => {
          return item !== 'formula'
        })
      }
      if (!this.enableAi) {
        res = res.filter(item => {
          return item !== 'ai'
        })
      }
      return res
    }
  },
  watch: {
    isHandleLocalFile(val) {
      if (!val) {
        Notification.closeAll()
      }
    },
    btnLit: {
      handler() {
        this.computeToolbarShow()
      }
    }
  },
  created() {
    this.removeWriteLocalFileListener = onWriteLocalFile(this.onWriteLocalFile)
  },
  mounted() {
    this.refreshRecentFiles()
    this.computeToolbarShow()
    this.computeToolbarShowThrottle = throttle(this.computeToolbarShow, 300)
    window.addEventListener('resize', this.computeToolbarShowThrottle)
    window.addEventListener('beforeunload', this.onUnload)
    this.$bus.$on('node_note_dblclick', this.onNodeNoteDblclick)
    this.removeBootstrapStateReadyListener = onBootstrapStateReady(
      this.handleBootstrapStateReady
    )
  },
  beforeUnmount() {
    this.removeWriteLocalFileListener && this.removeWriteLocalFileListener()
    this.removeBootstrapStateReadyListener &&
      this.removeBootstrapStateReadyListener()
    window.removeEventListener('resize', this.computeToolbarShowThrottle)
    window.removeEventListener('beforeunload', this.onUnload)
    this.$bus.$off('node_note_dblclick', this.onNodeNoteDblclick)
    clearTimeout(this.timer)
  },
  methods: {
    handleBootstrapStateReady() {
      this.refreshRecentFiles()
    },

    async waitForRef(refName, { maxWaitMs = 800, intervalMs = 16 } = {}) {
      const startedAt = Date.now()
      while (Date.now() - startedAt <= maxWaitMs) {
        if (this.$refs[refName]) {
          return this.$refs[refName]
        }
        await new Promise(resolve => {
          setTimeout(resolve, intervalMs)
        })
      }
      return this.$refs[refName] || null
    },

    async ensurePanelMounted(panelKey, refName = '') {
      if (!this.mountedPanels[panelKey]) {
        this.mountedPanels[panelKey] = true
        await this.$nextTick()
      }
      if (!refName) {
        return null
      }
      return this.waitForRef(refName)
    },

    async openImportDialog() {
      const importRef = await this.ensurePanelMounted('import', 'ImportRef')
      if (importRef && typeof importRef.openDialog === 'function') {
        importRef.openDialog()
        return
      }
      emitShowImport()
    },

    async openExportDialog() {
      if (this.$route.path === '/export') {
        return
      }
      await this.$router.push('/export')
    },

    async goHome() {
      if (this.$route.path === '/home') {
        return
      }
      await this.$router.push('/home')
    },

    async openNodeImageDialog(activeNodes = []) {
      const nodeImageRef = await this.ensurePanelMounted(
        'nodeImage',
        'NodeImageRef'
      )
      if (nodeImageRef && typeof nodeImageRef.openDialog === 'function') {
        nodeImageRef.openDialog({
          activeNodes
        })
        return
      }
      emitShowNodeImage({
        activeNodes
      })
    },

    async openNodeLinkDialog(activeNodes = []) {
      const nodeHyperlinkRef = await this.ensurePanelMounted(
        'nodeHyperlink',
        'NodeHyperlinkRef'
      )
      if (
        nodeHyperlinkRef &&
        typeof nodeHyperlinkRef.openDialog === 'function'
      ) {
        nodeHyperlinkRef.openDialog({
          activeNodes
        })
        return
      }
      emitShowNodeLink({
        activeNodes
      })
    },

    async openNodeNoteDialog(activeNodes = []) {
      const nodeNoteRef = await this.ensurePanelMounted('nodeNote', 'NodeNoteRef')
      if (nodeNoteRef && typeof nodeNoteRef.openDialog === 'function') {
        nodeNoteRef.openDialog({
          activeNodes
        })
        return
      }
      emitShowNodeNote({
        activeNodes
      })
    },

    async openNodeTagDialog(activeNodes = []) {
      const nodeTagRef = await this.ensurePanelMounted('nodeTag', 'NodeTagRef')
      if (nodeTagRef && typeof nodeTagRef.openDialog === 'function') {
        nodeTagRef.openDialog({
          activeNodes
        })
        return
      }
      emitShowNodeTag({
        activeNodes
      })
    },

    refreshRecentFiles() {
      this.recentFiles = this.isDesktopRuntime ? getRecentFiles() : []
      setRecentFiles(this.recentFiles)
    },

    // 计算工具按钮如何显示
    getOuterWidth(el) {
      if (!el || typeof window === 'undefined') return 0
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      return (
        rect.width +
        parseFloat(style.marginLeft || 0) +
        parseFloat(style.marginRight || 0)
      )
    },

    getFixedToolbarWidth() {
      if (!this.$refs.toolbarRef) return 0
      const blocks = Array.from(this.$refs.toolbarRef.children).filter(item => {
        return (
          item.classList &&
          item.classList.contains('toolbarBlock') &&
          !item.classList.contains('isMeasure')
        )
      })
      return blocks.slice(1).reduce((total, block) => {
        return total + this.getOuterWidth(block)
      }, 0)
    },

    getNodeToolbarMeasure() {
      const measureBlock = this.$refs.toolbarMeasureBlockRef
      const measureList = this.$refs.toolbarMeasureListRef
      const moreBtn = this.$refs.toolbarMeasureMoreRef
      if (!measureBlock || !measureList || !moreBtn) {
        return null
      }
      const buttonWidths = Array.from(
        measureList.querySelectorAll('.toolbarBtn')
      ).map(item => this.getOuterWidth(item))
      const moreButtonWidth = this.getOuterWidth(moreBtn)
      const blockWidth = this.getOuterWidth(measureBlock)
      const blockChromeWidth =
        blockWidth -
        buttonWidths.reduce((total, width) => total + width, 0) -
        moreButtonWidth
      return {
        buttonWidths,
        moreButtonWidth,
        blockChromeWidth: Math.max(blockChromeWidth, 0)
      }
    },

    async computeToolbarShow() {
      const token = ++this.layoutMeasureToken
      await this.$nextTick()
      if (token !== this.layoutMeasureToken) return
      const all = [...this.btnLit]
      const measure = this.getNodeToolbarMeasure()
      if (!measure) return
      const windowWidth = Math.max(window.innerWidth - 40, 0)
      const availableNodeWidth = Math.max(
        windowWidth - this.getFixedToolbarWidth(),
        0
      )
      const { buttonWidths, moreButtonWidth, blockChromeWidth } = measure
      const totalButtonWidth = buttonWidths.reduce((total, width) => {
        return total + width
      }, 0)
      if (blockChromeWidth + totalButtonWidth <= availableNodeWidth) {
        this.horizontalList = all
        this.verticalList = []
        this.showMoreBtn = false
        this.popoverShow = false
        return
      }

      let usedWidth = blockChromeWidth + moreButtonWidth
      let visibleCount = 0
      buttonWidths.some(width => {
        if (usedWidth + width > availableNodeWidth) {
          return true
        }
        usedWidth += width
        visibleCount += 1
        return false
      })
      this.horizontalList = all.slice(0, visibleCount)
      this.verticalList = all.slice(visibleCount)
      this.showMoreBtn = this.verticalList.length > 0
      if (!this.showMoreBtn) {
        this.popoverShow = false
      }
    },

    // 监听本地文件读写
    onWriteLocalFile(content) {
      clearTimeout(this.timer)
      if (getCurrentFileRef() && this.isHandleLocalFile) {
        this.waitingWriteToLocalFile = true
        markDocumentDirty(true)
      }
      this.timer = setTimeout(() => {
        this.writeLocalFile(content)
      }, LOCAL_FILE_WRITE_DEBOUNCE_MS)
    },

    onUnload(e) {
      if (this.waitingWriteToLocalFile) {
        const msg = this.$t('toolbar.unsavedData')
        e.returnValue = msg
        return msg
      }
    },

    // 加载本地文件树
    async loadFileTreeNode(node, resolve) {
      try {
        let directoryRef = null
        if (node.level === 0) {
          directoryRef = await platform.pickDirectory({
            defaultPath: getLastDirectory()
          })
          if (!directoryRef) {
            this.fileTreeVisible = false
            resolve([])
            return
          }
          this.rootDirName = directoryRef.name
          setLastDirectory(directoryRef.path || '')
        } else {
          directoryRef = node.data
        }
        resolve(await platform.listDirectoryEntries(directoryRef))
      } catch (error) {
        console.error('loadFileTreeNode failed', error)
        this.fileTreeVisible = false
        resolve([])
        if (error.toString().includes('aborted')) {
          return
        }
        this.$message.warning(this.$t('toolbar.notSupportTip'))
      }
    },

    // 扫描本地文件夹
    openDirectory() {
      this.fileTreeVisible = false
      this.fileTreeExpand = true
      this.rootDirName = ''
      this.$nextTick(() => {
        this.fileTreeVisible = true
      })
    },

    // 编辑指定文件
    editLocalFile(data) {
      if (!data || data.mode !== 'desktop') return
      setCurrentFileRef(data, data.mode)
      syncEditorFileSession(data)
      this.readFile()
    },

    // 导入指定文件
    async importLocalFile(data) {
      try {
        const importRef = await this.ensurePanelMounted('import', 'ImportRef')
        if (!importRef) return
        if (!data || data.mode !== 'desktop') return
        const result = await platform.readMindMapFile(data)
        const file = new File([result.content], result.name, {
          type: 'application/json'
        })
        importRef.onChange({
          raw: file,
          name: file.name
        })
        importRef.confirm()
      } catch (error) {
        console.error('importLocalFile failed', error)
      }
    },

    openRecentFile(item) {
      if (!item || !item.path) return
      setCurrentFileRef(item, item.mode || 'desktop')
      syncEditorFileSession(item)
      this.readFile()
    },

    // 打开本地文件
    async openLocalFile() {
      try {
        const nextFileHandle = await platform.openMindMapFile({
          defaultPath: getLastDirectory()
        })
        if (!nextFileHandle) {
          return
        }
        setCurrentFileRef(nextFileHandle, nextFileHandle.mode)
        syncEditorFileSession(nextFileHandle)
        this.readFile()
      } catch (error) {
        console.error('openLocalFile failed', error)
        if (error.toString().includes('aborted')) {
          return
        }
        this.$message.warning(this.$t('toolbar.notSupportTip'))
      }
    },

    // 读取本地文件
    async readFile() {
      try {
        const currentFileRef = getCurrentFileRef()
        if (!currentFileRef) return
        const result = await platform.readMindMapFile(currentFileRef)
        setIsHandleLocalFile(true)
        this.setData(result.content)
        updateCurrentFileRef(result)
        syncEditorFileSession(result)
        await recordRecentFile({
          ...currentFileRef,
          ...result
        })
        markDocumentDirty(false)
        this.refreshRecentFiles()
        Notification.closeAll()
        Notification({
          title: this.$t('toolbar.tip'),
          message: `${this.$t('toolbar.editingLocalFileTipFront')}${
            result.name
          }${this.$t('toolbar.editingLocalFileTipEnd')}`,
          duration: 0,
          showClose: true
        })
      } catch (error) {
        console.error('readFile failed', error)
        const fileError = createDesktopFsError(error)
        this.$message.error(
          fileError.message || this.$t('toolbar.fileOpenFailed')
        )
      }
    },

    // 渲染读取的数据
    setData(str) {
      try {
        let data = JSON.parse(str)
        if (typeof data !== 'object') {
          throw new Error(this.$t('toolbar.fileContentError'))
        }
        if (data.root) {
          this.isFullDataFile = true
        } else {
          this.isFullDataFile = false
          data = {
            ...createDefaultMindMapData(),
            root: data
          }
        }
        this.$bus.$emit('setData', data)
      } catch (error) {
        console.error('parse local file failed', error)
        this.$message.error(this.$t('toolbar.fileOpenFailed'))
      }
    },

    // 写入本地文件
    async writeLocalFile(content) {
      const currentFileRef = getCurrentFileRef()
      if (!currentFileRef || !this.isHandleLocalFile) {
        this.waitingWriteToLocalFile = false
        return
      }
      try {
        if (!this.isFullDataFile) {
          content = content.root
        }
        const string = JSON.stringify(content)
        await platform.writeMindMapFile(currentFileRef, string)
        await recordRecentFile(currentFileRef)
        markDocumentDirty(false)
        this.refreshRecentFiles()
      } catch (error) {
        console.error('writeLocalFile failed', error)
        const fileError = createDesktopFsError(error)
        this.$message.error(
          fileError.message || this.$t('toolbar.fileOpenFailed')
        )
      } finally {
        this.waitingWriteToLocalFile = false
      }
    },

    // 创建本地文件
    async createNewLocalFile() {
      await this.createLocalFile(createDefaultMindMapData())
    },

    // 另存为
    async saveLocalFile() {
      let data = getData()
      await this.createLocalFile(data)
    },

    // 创建本地文件
    async createLocalFile(content) {
      try {
        const nextFileHandle = await platform.saveMindMapFileAs({
          suggestedName: this.$t('toolbar.defaultFileName'),
          content: JSON.stringify(content),
          defaultPath: getLastDirectory()
        })
        if (!nextFileHandle) {
          return
        }
        const loading = this.$loading({
          lock: true,
          text: this.$t('toolbar.creatingTip'),
          background: 'rgba(0, 0, 0, 0.7)'
        })
        try {
          setCurrentFileRef(nextFileHandle, nextFileHandle.mode)
          setIsHandleLocalFile(true)
          syncEditorFileSession(nextFileHandle)
          this.isFullDataFile = true
          await recordRecentFile(nextFileHandle)
          markDocumentDirty(false)
          this.refreshRecentFiles()
          await this.readFile()
        } finally {
          loading.close()
        }
      } catch (error) {
        console.error('createLocalFile failed', error)
        if (error.toString().includes('aborted')) {
          return
        }
        this.$message.warning(this.$t('toolbar.notSupportTip'))
      }
    },

    onNodeNoteDblclick(node, e) {
      e.stopPropagation()
      this.ensurePanelMounted('nodeNote').then(() => {
        emitShowNodeNote({
          node
        })
      })
    }
  }
}
</script>

<style lang="less" scoped>
.toolbarContainer {
  &.isDark {
    .toolbar {
      color: hsla(0, 0%, 100%, 0.9);
      .toolbarBlock {
        background-color: #262a2e;

        .fileTreeBox {
          background-color: #262a2e;

          :deep(.el-tree) {
            background-color: #262a2e;

            &.el-tree--highlight-current {
              .el-tree-node.is-current > .el-tree-node__content {
                background-color: hsla(0, 0%, 100%, 0.05) !important;
              }
            }

            .el-tree-node:focus > .el-tree-node__content {
              background-color: hsla(0, 0%, 100%, 0.05) !important;
            }

            .el-tree-node__content:hover,
            .el-upload-list__item:hover {
              background-color: hsla(0, 0%, 100%, 0.02) !important;
            }
          }

          .fileTreeWrap {
            .customTreeNode {
              .treeNodeInfo {
                color: #fff;
              }

              .treeNodeBtnList {
                .el-button {
                  padding: 7px 5px;
                }
              }
            }
          }
        }
      }

      .toolbarBtn {
        .icon {
          background: transparent;
          border-color: transparent;
        }

        &:hover {
          &:not(.disabled) {
            .icon {
              background: hsla(0, 0%, 100%, 0.05);
            }
          }
        }

        &.disabled {
          color: #54595f;
        }
      }

      .toolbarDivider {
        background: hsla(0, 0%, 100%, 0.1);
      }

      .pageEntryBtn {
        .icon {
          background: hsla(0, 0%, 100%, 0.04);
          border-color: hsla(0, 0%, 100%, 0.1);
        }
      }
    }
  }

  .toolbar {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    top: 20px;
    width: max-content;
    display: flex;
    font-size: 12px;
    font-family:
      PingFangSC-Regular,
      PingFang SC;
    font-weight: 400;
    color: rgba(26, 26, 26, 0.8);
    z-index: 2;

    .toolbarBlock {
      display: flex;
      align-items: center;
      background-color: #fff;
      padding: 8px 10px;
      border-radius: 8px;
      box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.06);
      margin-right: 8px;
      flex-shrink: 0;
      position: relative;

      &:last-of-type {
        margin-right: 0;
      }

      .fileTreeBox {
        position: absolute;
        left: 0;
        top: 60px;
        width: 100%;
        height: 30px;
        background-color: #fff;
        padding: 12px 5px;
        padding-top: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 5px;
        min-width: 200px;
        box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);

        &.expand {
          height: 300px;

          .fileTreeWrap {
            visibility: visible;
          }
        }

        .fileTreeToolbar {
          width: 100%;
          height: 30px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e9e9e9;
          margin-bottom: 12px;
          padding-left: 12px;

          .fileTreeName {
          }

          .fileTreeActionList {
            .btn {
              width: 20px;
              height: 20px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 700;
              margin-left: 12px;
              cursor: pointer;
              line-height: 1;

              &.expanded {
                transform: rotate(180deg);
              }

              &.closeBtn {
                font-size: 14px;
              }
            }
          }
        }

        .fileTreeWrap {
          width: 100%;
          height: 100%;
          overflow: auto;
          visibility: hidden;

          .customTreeNode {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            padding-right: 5px;

            .treeNodeInfo {
              display: flex;
              align-items: center;

              .treeNodeIcon {
                margin-right: 5px;
                opacity: 0.7;
              }

              .treeNodeName {
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .treeNodeBtnList {
              display: flex;
              align-items: center;
            }
          }
        }
      }
    }

    .toolbarBtn {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      cursor: pointer;
      margin-right: 8px;
      min-width: 40px;
      flex-shrink: 0;

      &:last-of-type {
        margin-right: 0;
      }

      &:hover {
        &:not(.disabled) {
          .icon {
            background: #f5f5f5;
          }
        }
      }

      &.active {
        .icon {
          background: #f5f5f5;
        }
      }

      &.disabled {
        color: #bcbcbc;
        cursor: not-allowed;
        pointer-events: none;
      }

      .icon {
        display: flex;
        height: 26px;
        background: #fff;
        border-radius: 4px;
        border: 1px solid #e9e9e9;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        padding: 0 5px;
      }

      .text {
        margin-top: 3px;
        line-height: 1.2;
        text-align: center;
        white-space: nowrap;
      }
    }

    .toolbarDivider {
      width: 1px;
      height: 34px;
      background: rgba(15, 23, 42, 0.08);
      margin: 0 1px;
      flex-shrink: 0;
    }

    .pageEntryBtn {
      min-width: 54px;

      .icon {
        width: 28px;
        align-items: center;
      }
    }

    .toolbarMeasure {
      position: fixed;
      left: -99999px;
      top: -99999px;
      visibility: hidden;
      pointer-events: none;
    }
  }
}
</style>
