<template>
  <div class="toolbarContainer" :class="{ isDark: isDark }">
    <div
      class="toolbar"
      ref="toolbarRef"
      :class="{ hideLabels: !showToolbarLabels }"
    >
      <!-- 节点操作 -->
      <div class="toolbarBlock fileActionsBlock">
        <ToolbarNodeBtnList
          :list="horizontalList"
          :show-text="showToolbarLabels"
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
            :show-text="true"
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
              <span class="icon iconfont edit-icon-more"></span>
              <span class="text">{{ $t('toolbar.more') }}</span>
            </div>
          </template>
        </el-popover>
      </div>
      <!-- 导出 -->
      <div class="toolbarBlock">
        <div
          class="toolbarBtn fileActionBtn"
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
            class="toolbarBtn fileActionBtn"
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
            class="toolbarBtn fileActionBtn"
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
            class="toolbarBtn fileActionBtn"
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
          class="toolbarBtn fileActionBtn"
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
          class="toolbarBtn fileActionBtn"
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
        <div
          class="toolbarBtn fileActionBtn"
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
          class="toolbarBtn fileActionBtn"
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
      <div class="toolbarBlock toolbarMetaBlock" v-if="!isMobile">
        <div class="toolbarStatus" :class="toolbarStatusType">
          <span class="statusDot"></span>
          <div class="statusText">
            <strong>{{ toolbarStatusText }}</strong>
            <span>
              {{ $t('toolbar.statusDocumentPrefix') }}{{ toolbarDocumentLabel }}
            </span>
          </div>
        </div>
        <div class="toolbarQuickActions">
          <div
            class="toolbarBtn quickActionBtn"
            role="button"
            tabindex="0"
            :aria-label="$t('toolbar.searchAction')"
            @click="showSearch"
            @keydown.enter.prevent="showSearch"
            @keydown.space.prevent="showSearch"
          >
            <span class="icon iconfont iconsousuo"></span>
            <span class="text">{{ $t('toolbar.searchAction') }}</span>
          </div>
          <div
            class="toolbarBtn quickActionBtn"
            role="button"
            tabindex="0"
            :aria-label="$t('toolbar.shortcutAction')"
            @click="openShortcutKey"
            @keydown.enter.prevent="openShortcutKey"
            @keydown.space.prevent="openShortcutKey"
          >
            <span class="icon shortcutBadge">⌘</span>
            <span class="text">{{ $t('toolbar.shortcutAction') }}</span>
          </div>
        </div>
      </div>
      <div class="toolbarMeasure">
        <div class="toolbarBlock isMeasure" ref="toolbarMeasureBlockRef">
          <div ref="toolbarMeasureListRef">
            <ToolbarNodeBtnList
              :list="btnLit"
              :show-text="showToolbarLabels"
            ></ToolbarNodeBtnList>
          </div>
          <div class="toolbarBtn" ref="toolbarMeasureMoreRef">
            <span class="icon iconfont edit-icon-more"></span>
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
import { getConfig, getData } from '@/api'
import ToolbarNodeBtnList from './ToolbarNodeBtnList.vue'
import { parseExternalJsonSafely } from '@/utils/json'
import { throttle, isMobile } from 'simple-mind-map/src/utils/index'
import platform, {
  getRecentFiles,
  isDesktopApp,
  recordRecentFile
} from '@/platform'
import { createDefaultMindMapData } from '@/platform/shared/configSchema'
import {
  createDesktopFsError,
  getCurrentFileRef,
  getLastDirectory,
  markDocumentDirty,
  setCurrentFileRef,
  setLastDirectory
} from '@/services/documentSession'
import {
  onBootstrapStateReady,
  emitShowSearch,
  emitShowImport,
  emitShowNodeImage,
  emitShowNodeLink,
  emitShowNodeNote,
  emitShowNodeTag,
  onWriteLocalFile
} from '@/services/appEvents'
import {
  setActiveSidebar,
  setIsHandleLocalFile,
  syncRuntimeFromWorkspaceMeta
} from '@/stores/runtime'
import { getWorkspaceMetaState } from '@/services/workspaceState'
import { useAppStore } from '@/stores/app'
import { useEditorStore } from '@/stores/editor'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import {
  clearRecoveryDraftForFile,
  resolveFileContentWithRecovery,
  writeRecoveryDraftForFile
} from '@/services/recoveryStorage'

const NodeImage = defineAsyncComponent(() => import('./NodeImage.vue'))
const NodeHyperlink = defineAsyncComponent(() => import('./NodeHyperlink.vue'))
const NodeNote = defineAsyncComponent(() => import('./NodeNote.vue'))
const NodeTag = defineAsyncComponent(() => import('./NodeTag.vue'))
const Import = defineAsyncComponent(() => import('./Import.vue'))
const LOCAL_FILE_WRITE_DEBOUNCE_MS = 1000
const RECOVERY_WRITE_DEBOUNCE_MS = 2500

const snapshotLocalFileRef = fileRef => {
  if (!fileRef || typeof fileRef !== 'object') return null
  const path = String(fileRef.path || '').trim()
  if (!path) return null
  return {
    ...fileRef,
    path,
    name: String(fileRef.name || '').trim(),
    mode: String(fileRef.mode || 'desktop').trim() || 'desktop'
  }
}

const isSameLocalFileRef = (left, right) => {
  const leftRef = snapshotLocalFileRef(left)
  const rightRef = snapshotLocalFileRef(right)
  if (!leftRef || !rightRef) return false
  return leftRef.path === rightRef.path && leftRef.mode === rightRef.mode
}

const parseToolbarLocalFileContent = (str, invalidContentMessage) => {
  let data = parseExternalJsonSafely(str)
  if (!data || typeof data !== 'object') {
    throw new Error(invalidContentMessage)
  }
  if (data.root) {
    return {
      data,
      isFullDataFile: true
    }
  }
  return {
    data: {
      ...createDefaultMindMapData(),
      root: data
    },
    isFullDataFile: false
  }
}

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
      isFullDataFile: true,
      waitingWriteToLocalFile: false,
      recoveredDraftLoaded: false,
      pendingLocalFileRef: null,
      localFileReadRequestId: 0,
      localFileWriteRequestId: 0,
      completedLocalFileWriteRequestId: 0,
      currentLocalFileWriteRequestId: 0,
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
    ...mapState(useEditorStore, {
      currentDocument: 'currentDocument',
      currentFileName: 'currentFileName'
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

    showToolbarLabels() {
      return this.localConfig.showToolbarLabels !== false
    },

    hasPotentialDataLoss() {
      return !!this.currentDocument?.dirty || this.waitingWriteToLocalFile
    },

    toolbarDocumentLabel() {
      return (
        this.currentFileName ||
        this.currentDocument?.name ||
        this.$t('toolbar.statusNoFile')
      )
    },

    toolbarStatusText() {
      if (this.waitingWriteToLocalFile) {
        return this.$t('toolbar.statusAutosaving')
      }
      if (this.recoveredDraftLoaded) {
        return this.$t('toolbar.statusRecovered')
      }
      if (this.currentDocument?.dirty) {
        return this.$t('toolbar.statusUnsynced')
      }
      if (this.currentDocument?.path || this.currentFileName) {
        return this.$t('toolbar.statusSaved')
      }
      return this.$t('toolbar.statusNoFile')
    },

    toolbarStatusType() {
      if (this.waitingWriteToLocalFile) return 'autosaving'
      if (this.recoveredDraftLoaded) return 'recovered'
      if (this.currentDocument?.dirty) return 'dirty'
      return 'saved'
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
    },
    showToolbarLabels() {
      this.computeToolbarShow()
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
    clearTimeout(this.recoveryTimer)
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

    showSearch() {
      emitShowSearch()
    },

    openShortcutKey() {
      setActiveSidebar('shortcutKey')
    },

    async confirmPotentialDataLoss(actionKey = '') {
      const nextAction = String(actionKey || '').trim()
      if (!this.hasPotentialDataLoss) {
        return true
      }
      try {
        await this.$confirm(
          this.$t('toolbar.leaveConfirmMessage'),
          this.$t('toolbar.leaveConfirmTitle'),
          {
            type: 'warning'
          }
        )
        if (!nextAction) {
          return true
        }
        return true
      } catch (_error) {
        return false
      }
    },

    async goHome() {
      if (this.$route.path === '/home') {
        return
      }
      if (!(await this.confirmPotentialDataLoss('returnHome'))) {
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
      syncRuntimeFromWorkspaceMeta(getWorkspaceMetaState())
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
      if (this.timer) {
        clearTimeout(this.timer)
        this.completedLocalFileWriteRequestId = Math.max(
          this.completedLocalFileWriteRequestId,
          this.localFileWriteRequestId
        )
      }
      this.timer = null
      const writeTask = this.createLocalWriteTask(content)
      if (!writeTask) {
        this.waitingWriteToLocalFile = this.hasPendingLocalWrite()
        return
      }
      this.waitingWriteToLocalFile = true
      markDocumentDirty(true)
      this.scheduleRecoveryDraftWrite(writeTask)
      this.timer = setTimeout(() => {
        this.timer = null
        void this.writeLocalFile(writeTask)
      }, LOCAL_FILE_WRITE_DEBOUNCE_MS)
    },

    scheduleRecoveryDraftWrite(writeTask) {
      if (this.recoveryTimer) {
        clearTimeout(this.recoveryTimer)
      }
      this.recoveryTimer = setTimeout(() => {
        this.recoveryTimer = null
        void this.writeRecoveryDraft(writeTask)
      }, RECOVERY_WRITE_DEBOUNCE_MS)
    },

    async writeRecoveryDraft(writeTask) {
      if (!writeTask?.fileRef || !writeTask.content) {
        return
      }
      try {
        await writeRecoveryDraftForFile({
          fileRef: writeTask.fileRef,
          data: writeTask.content,
          config: getConfig(),
          isFullDataFile: writeTask.isFullDataFile
        })
      } catch (error) {
        console.error('writeRecoveryDraft failed', error)
      }
    },

    onUnload(e) {
      if (this.hasPotentialDataLoss) {
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
          await setLastDirectory(directoryRef.path || '')
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
    async openDirectory() {
      if (!(await this.confirmPotentialDataLoss('openDirectory'))) {
        return
      }
      this.fileTreeVisible = false
      this.fileTreeExpand = true
      this.rootDirName = ''
      this.$nextTick(() => {
        this.fileTreeVisible = true
      })
    },

    // 编辑指定文件
    async editLocalFile(data) {
      if (!data || data.mode !== 'desktop') return
      if (!(await this.confirmPotentialDataLoss('editLocalFile'))) {
        return
      }
      void this.readFile(data)
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

    async openRecentFile(item) {
      if (!item || !item.path) return
      if (!(await this.confirmPotentialDataLoss('openRecentFile'))) {
        return
      }
      void this.readFile({
        ...item,
        mode: item.mode || 'desktop'
      })
    },

    // 打开本地文件
    async openLocalFile() {
      if (!(await this.confirmPotentialDataLoss('openFile'))) {
        return
      }
      try {
        const nextFileHandle = await platform.openMindMapFile({
          defaultPath: getLastDirectory()
        })
        if (!nextFileHandle) {
          return
        }
        const requestId = this.startLocalFileRead(nextFileHandle)
        if (!requestId) return
        const recoveredResult = await resolveFileContentWithRecovery(
          nextFileHandle,
          nextFileHandle.content
        )
        await this.applyLocalFileResult(
          {
            ...nextFileHandle,
            content: recoveredResult.content,
            recoveredFromDraft: recoveredResult.recovered
          },
          requestId
        )
      } catch (error) {
        console.error('openLocalFile failed', error)
        if (error.toString().includes('aborted')) {
          return
        }
        const fileError = createDesktopFsError(error)
        this.$message.error(
          fileError.message || this.$t('toolbar.fileOpenFailed')
        )
      }
    },

    // 读取本地文件
    async readFile(targetFileRef = null) {
      const fileRef = snapshotLocalFileRef(targetFileRef || getCurrentFileRef())
      if (!fileRef) return false
      const requestId = this.startLocalFileRead(fileRef)
      if (!requestId) return false
      try {
        const result = await platform.readMindMapFile(fileRef)
        const recoveredResult = await resolveFileContentWithRecovery(
          fileRef,
          result.content
        )
        return await this.applyLocalFileResult(
          {
            ...fileRef,
            ...result,
            content: recoveredResult.content,
            recoveredFromDraft: recoveredResult.recovered
          },
          requestId
        )
      } catch (error) {
        if (!this.isLatestLocalFileRead(requestId, fileRef)) {
          return false
        }
        if (requestId === this.localFileReadRequestId) {
          this.pendingLocalFileRef = null
        }
        console.error('readFile failed', error)
        const fileError = createDesktopFsError(error)
        this.$message.error(
          fileError.message || this.$t('toolbar.fileOpenFailed')
        )
        return false
      }
    },

    // 渲染读取的数据
    setData(str) {
      const normalized = parseToolbarLocalFileContent(
        str,
        this.$t('toolbar.fileContentError')
      )
      this.isFullDataFile = normalized.isFullDataFile
      this.$bus.$emit('setData', normalized.data)
      return normalized
    },

    startLocalFileRead(targetFileRef) {
      const fileRef = snapshotLocalFileRef(targetFileRef)
      if (!fileRef) return 0
      this.pendingLocalFileRef = fileRef
      return ++this.localFileReadRequestId
    },

    isLatestLocalFileRead(requestId, fileRef) {
      return (
        requestId === this.localFileReadRequestId &&
        isSameLocalFileRef(this.pendingLocalFileRef, fileRef)
      )
    },

    async applyLocalFileResult(fileResult, requestId) {
      const fileRef = snapshotLocalFileRef(fileResult)
      if (!fileRef) return false
      try {
        const normalized = parseToolbarLocalFileContent(
          fileResult.content,
          this.$t('toolbar.fileContentError')
        )
        if (!this.isLatestLocalFileRead(requestId, fileRef)) {
          return false
        }
        const nextFileRef = {
          ...fileRef,
          name: String(fileResult.name || fileRef.name || '').trim(),
          isFullDataFile: normalized.isFullDataFile
        }
        this.isFullDataFile = normalized.isFullDataFile
        setCurrentFileRef(nextFileRef, nextFileRef.mode || 'desktop')
        setIsHandleLocalFile(true)
        this.$bus.$emit('setData', normalized.data, {
          skipSave: true
        })
        await recordRecentFile(nextFileRef)
        if (!this.isLatestLocalFileRead(requestId, fileRef)) {
          return false
        }
        this.pendingLocalFileRef = null
        markDocumentDirty(!!fileResult.recoveredFromDraft)
        this.recoveredDraftLoaded = !!fileResult.recoveredFromDraft
        this.refreshRecentFiles()
        syncRuntimeFromWorkspaceMeta(getWorkspaceMetaState())
        Notification.closeAll()
        Notification({
          title: this.$t('toolbar.tip'),
          message: `${this.$t('toolbar.editingLocalFileTipFront')}${
            nextFileRef.name
          }${this.$t('toolbar.editingLocalFileTipEnd')}`,
          duration: 0,
          showClose: true
        })
        if (fileResult.recoveredFromDraft) {
          this.$message.success(this.$t('toolbar.recoveredDraftLoaded'))
        }
        return true
      } catch (error) {
        if (
          requestId === this.localFileReadRequestId &&
          isSameLocalFileRef(this.pendingLocalFileRef, fileRef)
        ) {
          this.pendingLocalFileRef = null
        }
        throw error
      }
    },

    createLocalWriteTask(content) {
      const fileRef = snapshotLocalFileRef(getCurrentFileRef())
      if (!fileRef || !this.isHandleLocalFile) {
        return null
      }
      const isFullDataFile =
        typeof this.isFullDataFile === 'boolean'
          ? this.isFullDataFile
          : !!fileRef.isFullDataFile
      return {
        id: ++this.localFileWriteRequestId,
        fileRef,
        content,
        isFullDataFile
      }
    },

    hasPendingLocalWrite(requestId = 0) {
      const completedRequestId = Math.max(
        this.completedLocalFileWriteRequestId,
        requestId
      )
      return (
        !!this.timer ||
        this.currentLocalFileWriteRequestId > completedRequestId ||
        this.localFileWriteRequestId > completedRequestId
      )
    },

    // 写入本地文件
    async writeLocalFile(writeTask) {
      if (!writeTask) {
        this.waitingWriteToLocalFile = this.hasPendingLocalWrite()
        return
      }
      let writeSucceeded = false
      this.currentLocalFileWriteRequestId = writeTask.id
      try {
        let content = writeTask.content
        if (!writeTask.isFullDataFile) {
          content = content.root
        }
        const string = JSON.stringify(content)
        await platform.writeMindMapFile(writeTask.fileRef, string)
        await recordRecentFile(writeTask.fileRef)
        this.refreshRecentFiles()
        writeSucceeded = true
      } catch (error) {
        console.error('writeLocalFile failed', error)
        const fileError = createDesktopFsError(error)
        this.$message.error(
          fileError.message || this.$t('toolbar.fileOpenFailed')
        )
      } finally {
        if (this.currentLocalFileWriteRequestId === writeTask.id) {
          this.currentLocalFileWriteRequestId = 0
        }
        this.completedLocalFileWriteRequestId = Math.max(
          this.completedLocalFileWriteRequestId,
          writeTask.id
        )
        const hasPendingLocalWrite = this.hasPendingLocalWrite(writeTask.id)
        this.waitingWriteToLocalFile = hasPendingLocalWrite
        if (!hasPendingLocalWrite && writeSucceeded) {
          if (this.recoveryTimer) {
            clearTimeout(this.recoveryTimer)
            this.recoveryTimer = null
          }
          try {
            await clearRecoveryDraftForFile(writeTask.fileRef)
          } catch (error) {
            console.error('clearRecoveryDraftForFile failed', error)
          }
          this.recoveredDraftLoaded = false
          markDocumentDirty(false)
        }
      }
    },

    // 创建本地文件
    async createNewLocalFile() {
      if (!(await this.confirmPotentialDataLoss('newFile'))) {
        return
      }
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
        const previousFileRef = snapshotLocalFileRef(getCurrentFileRef())
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
          const requestId = this.startLocalFileRead(nextFileHandle)
          if (!requestId) return
          await this.applyLocalFileResult(
            {
              ...nextFileHandle,
              content: JSON.stringify(content)
            },
            requestId
          )
          if (this.recoveryTimer) {
            clearTimeout(this.recoveryTimer)
            this.recoveryTimer = null
          }
          await Promise.all(
            [previousFileRef, nextFileHandle]
              .filter(Boolean)
              .map(item =>
                clearRecoveryDraftForFile(item).catch(error => {
                  console.error('clearRecoveryDraftForFile failed', error)
                })
              )
          )
          this.recoveredDraftLoaded = false
          this.$message.success(this.$t('toolbar.fileCreated'))
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
  --toolbar-surface: rgba(255, 255, 255, 0.9);
  --toolbar-border: rgba(15, 23, 42, 0.08);
  --toolbar-shadow: none;
  --toolbar-text-color: rgba(15, 23, 42, 0.72);
  --toolbar-text-hover-color: rgba(15, 23, 42, 0.96);
  --toolbar-subtle-text-color: #737373;
  --toolbar-icon-bg: transparent;
  --toolbar-icon-border: transparent;
  --toolbar-icon-shadow: none;
  --toolbar-icon-hover-bg: rgba(15, 23, 42, 0.06);
  --toolbar-icon-hover-border: transparent;
  --toolbar-icon-hover-shadow: none;
  --toolbar-icon-active-bg: rgba(15, 23, 42, 0.09);
  --toolbar-icon-active-border: transparent;
  --toolbar-icon-active-shadow: none;
  --toolbar-divider-color: rgba(15, 23, 42, 0.08);
  --toolbar-disabled-color: rgba(15, 23, 42, 0.24);

  &.isDark {
    --toolbar-surface: rgba(24, 28, 34, 0.92);
    --toolbar-border: rgba(255, 255, 255, 0.08);
    --toolbar-shadow: none;
    --toolbar-text-color: hsla(0, 0%, 100%, 0.74);
    --toolbar-text-hover-color: #fff;
    --toolbar-subtle-text-color: hsla(0, 0%, 100%, 0.52);
    --toolbar-icon-bg: transparent;
    --toolbar-icon-border: transparent;
    --toolbar-icon-shadow: none;
    --toolbar-icon-hover-bg: rgba(255, 255, 255, 0.1);
    --toolbar-icon-hover-border: transparent;
    --toolbar-icon-hover-shadow: none;
    --toolbar-icon-active-bg: rgba(255, 255, 255, 0.12);
    --toolbar-icon-active-border: transparent;
    --toolbar-icon-active-shadow: none;
    --toolbar-divider-color: rgba(255, 255, 255, 0.1);
    --toolbar-disabled-color: rgba(255, 255, 255, 0.2);

    .toolbar {
      color: var(--toolbar-text-color);
      .toolbarBlock {
        background-color: var(--toolbar-surface);

        .fileTreeBox {
          background-color: #20242b;
          border-color: rgba(255, 255, 255, 0.08);

          :deep(.el-tree) {
            background-color: #20242b;

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
          background: var(--toolbar-icon-bg);
          border-color: var(--toolbar-icon-border);
        }

        &:hover {
          &:not(.disabled) {
            .icon {
              background: var(--toolbar-icon-hover-bg);
            }
          }
        }

        &.disabled {
          color: var(--toolbar-disabled-color);
        }
      }

      .toolbarDivider {
        background: var(--toolbar-divider-color);
      }
    }
  }

  .toolbar {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    width: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-family:
      "Segoe UI",
      "PingFang SC",
      "Microsoft YaHei",
      sans-serif;
    font-weight: 400;
    color: var(--toolbar-text-color);
    z-index: 1200;
    min-height: 56px;
    padding: 0 16px;
    background: var(--toolbar-surface);
    border-bottom: 1px solid var(--toolbar-border);
    box-shadow: var(--toolbar-shadow);
    backdrop-filter: blur(18px);

    .toolbarBlock {
      display: flex;
      align-items: center;
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      box-shadow: none;
      border: none;
      flex-shrink: 0;
      position: relative;

      .fileTreeBox {
        position: absolute;
        left: 0;
        top: 52px;
        width: 100%;
        height: 30px;
        background-color: #fff;
        padding: 12px 5px;
        padding-top: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 16px;
        min-width: 200px;
        box-shadow: 0 22px 40px rgba(15, 23, 42, 0.14);
        border: 1px solid var(--toolbar-border);

        &.expand {
          height: 300px;

          .fileTreeWrap {
            visibility: visible;
          }
        }

        .fileTreeToolbar {
          width: 100%;
          height: 34px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--toolbar-divider-color);
          margin-bottom: 12px;
          padding-left: 12px;
          color: inherit;

          .fileTreeName {
          }

          .fileTreeActionList {
            .btn {
              width: 24px;
              height: 24px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 700;
              margin-left: 12px;
              cursor: pointer;
              line-height: 1;
              border-radius: 8px;
              transition:
                background 0.2s ease,
                transform 0.2s ease;

              &:hover {
                background: rgba(15, 23, 42, 0.06);
              }

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

    .toolbarBlock:first-of-type {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      margin-right: 12px;
    }

    .toolbarBlock:nth-of-type(2) {
      flex: 0 0 auto;
      gap: 4px;

      :deep(.el-dropdown) {
        display: inline-flex;
        align-items: center;
      }

      .fileActionBtn,
      :deep(.el-dropdown) > .toolbarBtn {
        min-width: 38px;
      }
    }

    .toolbarMetaBlock {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: 12px;

      .toolbarStatus {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 220px;
        padding: 8px 12px;
        border-radius: 10px;
        border: 1px solid var(--toolbar-border);
        background: rgba(15, 23, 42, 0.03);

        .statusDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #16a34a;
          flex-shrink: 0;
        }

        .statusText {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;

          strong {
            font-size: 12px;
            font-weight: 600;
            color: var(--toolbar-text-hover-color);
          }

          span {
            font-size: 11px;
            color: var(--toolbar-subtle-text-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 260px;
          }
        }

        &.autosaving .statusDot {
          background: #f59e0b;
        }

        &.recovered .statusDot {
          background: #2563eb;
        }

        &.dirty .statusDot {
          background: #dc2626;
        }
      }

      .toolbarQuickActions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .quickActionBtn {
        min-width: 38px;
      }

      .shortcutBadge {
        font-size: 14px;
        font-weight: 700;
      }
    }

    .toolbarBtn {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      cursor: pointer;
      min-width: 38px;
      flex-shrink: 0;
      color: inherit;
      transition:
        color 0.2s ease,
        transform 0.22s ease;

      &:hover {
        &:not(.disabled) {
          transform: translateY(-1px);

          .icon {
            background: var(--toolbar-icon-hover-bg);
            border-color: var(--toolbar-icon-hover-border);
            box-shadow: var(--toolbar-icon-hover-shadow);
          }
        }
      }

      &.active {
        .icon {
          background: var(--toolbar-icon-active-bg);
          border-color: var(--toolbar-icon-active-border);
          box-shadow: var(--toolbar-icon-active-shadow);
        }
      }

      &.disabled {
        color: var(--toolbar-disabled-color);
        cursor: not-allowed;
        pointer-events: none;
      }

      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        min-width: 32px;
        height: 32px;
        background: var(--toolbar-icon-bg);
        border-radius: 6px;
        border: 1px solid var(--toolbar-icon-border);
        text-align: center;
        padding: 0 6px;
        font-size: 15px;
        line-height: 1;
        box-shadow: var(--toolbar-icon-shadow);
        transition:
          background 0.2s ease,
          border-color 0.2s ease,
          box-shadow 0.22s ease;
      }

      .text {
        margin-top: 4px;
        line-height: 1.1;
        text-align: center;
        white-space: nowrap;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.01em;
        color: var(--toolbar-subtle-text-color);
      }
    }

    .toolbarDivider {
      width: 1px;
      height: 16px;
      background: var(--toolbar-divider-color);
      margin: 0 8px;
      flex-shrink: 0;
    }

    &.hideLabels {
      .toolbarBtn {
        min-width: 32px;

        .text {
          display: none;
        }
      }

      .fileActionsBlock {
        .fileActionBtn,
        :deep(.el-dropdown) > .toolbarBtn {
          min-width: 32px;
        }
      }

      .toolbarMetaBlock {
        .toolbarStatus {
          min-width: 190px;
        }
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

@media (max-width: 980px) {
  .toolbarContainer {
    .toolbar {
      .toolbarMetaBlock {
        display: none;
      }
    }
  }
}

@media (max-width: 720px) {
  .toolbarContainer {
    .toolbar {
      padding: 0 10px;
    }
  }
}
</style>
