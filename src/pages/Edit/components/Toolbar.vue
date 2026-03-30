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
          v-model="popoverShow"
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
            <div class="toolbarBtn">
              <span class="icon iconfont icongongshi"></span>
              <span class="text">{{ $t('toolbar.more') }}</span>
            </div>
          </template>
        </el-popover>
      </div>
      <!-- 导出 -->
      <div class="toolbarBlock">
        <div class="toolbarBtn" @click="openDirectory" v-if="!isMobile">
          <span class="icon iconfont icondakai"></span>
          <span class="text">{{ $t('toolbar.directory') }}</span>
        </div>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.newFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div class="toolbarBtn" @click="createNewLocalFile">
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
          <div class="toolbarBtn" @click="openLocalFile">
            <span class="icon iconfont iconwenjian1"></span>
            <span class="text">{{ $t('toolbar.openFile') }}</span>
          </div>
        </el-tooltip>
        <el-dropdown
          v-if="!isMobile && isDesktopRuntime"
          trigger="click"
          @command="openRecentFile"
        >
          <div class="toolbarBtn">
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
        <div class="toolbarBtn" @click="saveLocalFile" v-if="!isMobile">
          <span class="icon iconfont iconlingcunwei"></span>
          <span class="text">{{ $t('toolbar.saveAs') }}</span>
        </div>
        <div class="toolbarBtn" @click="openImportDialog">
          <span class="icon iconfont icondaoru"></span>
          <span class="text">{{ $t('toolbar.import') }}</span>
        </div>
        <div
          class="toolbarBtn"
          @click="openExportDialog"
          style="margin-right: 0;"
        >
          <span class="icon iconfont iconexport"></span>
          <span class="text">{{ $t('toolbar.export') }}</span>
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
                :class="[
                  fileTreeExpand ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
                ]"
                @click="fileTreeExpand = !fileTreeExpand"
              ></div>
              <div
                class="btn el-icon-close"
                @click="fileTreeVisible = false"
              ></div>
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
                    size="mini"
                    v-if="data.enableEdit"
                    @click="editLocalFile(data)"
                    >编辑</el-button
                  >
                  <el-button
                    type="text"
                    size="mini"
                    v-else
                    @click="importLocalFile(data)"
                    >导入</el-button
                  >
                </div>
                </span>
              </template>
            </el-tree>
          </div>
        </div>
      </div>
    </div>
    <NodeImage v-if="mountedPanels.nodeImage"></NodeImage>
    <NodeHyperlink v-if="mountedPanels.nodeHyperlink"></NodeHyperlink>
    <NodeNote v-if="mountedPanels.nodeNote"></NodeNote>
    <NodeTag v-if="mountedPanels.nodeTag"></NodeTag>
    <Export v-if="mountedPanels.export"></Export>
    <Import v-if="mountedPanels.import" ref="ImportRef"></Import>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { ElNotification as Notification } from 'element-plus'
import exampleData from 'simple-mind-map/example/exampleData'
import { getData } from '../../../api'
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
import {
  createDesktopFsError,
  setCurrentFileRef,
  updateCurrentFileRef
} from '@/services/documentSession'
import {
  emitShowExport,
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

const NodeImage = () => import('./NodeImage.vue')
const NodeHyperlink = () => import('./NodeHyperlink.vue')
const NodeNote = () => import('./NodeNote.vue')
const NodeTag = () => import('./NodeTag.vue')
const Export = () => import('./Export.vue')
const Import = () => import('./Import.vue')

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
  // 'attachment',
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
    Export,
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
      mountedPanels: {
        nodeImage: false,
        nodeHyperlink: false,
        nodeNote: false,
        nodeTag: false,
        export: false,
        import: false
      }
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark,
      isHandleLocalFile: state => state.isHandleLocalFile,
      openNodeRichText: state => state.localConfig.openNodeRichText,
      enableAi: state => state.localConfig.enableAi
    }),

    isDesktopRuntime() {
      return isDesktopApp()
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
      deep: true,
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
  },
  beforeUnmount() {
    this.removeWriteLocalFileListener && this.removeWriteLocalFileListener()
    window.removeEventListener('resize', this.computeToolbarShowThrottle)
    window.removeEventListener('beforeunload', this.onUnload)
    this.$bus.$off('node_note_dblclick', this.onNodeNoteDblclick)
  },
  methods: {
    async waitForRef(refName, retries = 40) {
      if (this.$refs[refName]) {
        return this.$refs[refName]
      }
      if (retries <= 0) {
        return null
      }
      await new Promise(resolve => {
        setTimeout(resolve, 16)
      })
      return this.waitForRef(refName, retries - 1)
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
      await this.ensurePanelMounted('import', 'ImportRef')
      emitShowImport()
    },

    async openExportDialog() {
      await this.ensurePanelMounted('export')
      emitShowExport()
    },

    async openNodeImageDialog(activeNodes = []) {
      await this.ensurePanelMounted('nodeImage')
      emitShowNodeImage({
        activeNodes
      })
    },

    async openNodeLinkDialog(activeNodes = []) {
      await this.ensurePanelMounted('nodeHyperlink')
      emitShowNodeLink({
        activeNodes
      })
    },

    async openNodeNoteDialog(activeNodes = []) {
      await this.ensurePanelMounted('nodeNote')
      emitShowNodeNote({
        activeNodes
      })
    },

    async openNodeTagDialog(activeNodes = []) {
      await this.ensurePanelMounted('nodeTag')
      emitShowNodeTag({
        activeNodes
      })
    },

    refreshRecentFiles() {
      this.recentFiles = this.isDesktopRuntime ? getRecentFiles() : []
      setRecentFiles(this.recentFiles)
    },

    // 计算工具按钮如何显示
    computeToolbarShow() {
      if (!this.$refs.toolbarRef) return
      const windowWidth = window.innerWidth - 40
      const all = [...this.btnLit]
      let index = 1
      const loopCheck = () => {
        if (index > all.length) return done()
        this.horizontalList = all.slice(0, index)
        this.$nextTick(() => {
          const width = this.$refs.toolbarRef.getBoundingClientRect().width
          if (width < windowWidth) {
            index++
            loopCheck()
          } else if (index > 0 && width > windowWidth) {
            index--
            this.horizontalList = all.slice(0, index)
            done()
          }
        })
      }
      const done = () => {
        this.verticalList = all.slice(index)
        this.showMoreBtn = this.verticalList.length > 0
      }
      loopCheck()
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
      }, 1000)
    },

    onUnload(e) {
      if (this.waitingWriteToLocalFile) {
        const msg = '存在未保存的数据'
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
        console.log(error)
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
      if (data.mode === 'desktop' || data.handle) {
        setCurrentFileRef(data.mode === 'desktop' ? data : data.handle, data.mode)
        syncEditorFileSession(data)
        this.readFile()
      }
    },

    // 导入指定文件
    async importLocalFile(data) {
      try {
        const importRef = await this.ensurePanelMounted('import', 'ImportRef')
        if (!importRef) return
        let file = null
        if (data.mode === 'desktop') {
          const result = await platform.readMindMapFile(data)
          file = new File([result.content], result.name, {
            type: 'application/json'
          })
        } else {
          file = await data.handle.getFile()
        }
        importRef.onChange({
          raw: file,
          name: file.name
        })
        importRef.confirm()
      } catch (error) {
        console.log(error)
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
        console.log(error)
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
        if (isDesktopApp()) {
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
          return
        }
        let file = await currentFileRef.getFile()
        let fileReader = new FileReader()
        fileReader.onload = async () => {
          setIsHandleLocalFile(true)
          this.setData(fileReader.result)
          syncEditorFileSession({
            path: currentFileRef.path || currentFileRef.name || file.name,
            name: file.name
          })
          markDocumentDirty(false)
          Notification.closeAll()
          Notification({
            title: this.$t('toolbar.tip'),
            message: `${this.$t('toolbar.editingLocalFileTipFront')}${
              file.name
            }${this.$t('toolbar.editingLocalFileTipEnd')}`,
            duration: 0,
            showClose: true
          })
        }
        fileReader.readAsText(file)
      } catch (error) {
        console.log(error)
        const fileError = createDesktopFsError(error)
        this.$message.error(fileError.message || this.$t('toolbar.fileOpenFailed'))
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
            ...exampleData,
            root: data
          }
        }
        this.$bus.$emit('setData', data)
      } catch (error) {
        console.log(error)
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
        let string = JSON.stringify(content)
        if (isDesktopApp()) {
          await platform.writeMindMapFile(currentFileRef, string)
          await recordRecentFile(currentFileRef)
          markDocumentDirty(false)
          this.refreshRecentFiles()
          return
        }
        const writable = await currentFileRef.createWritable()
        await writable.write(string)
        await writable.close()
        markDocumentDirty(false)
      } catch (error) {
        console.log(error)
        const fileError = createDesktopFsError(error)
        this.$message.error(fileError.message || this.$t('toolbar.fileOpenFailed'))
      } finally {
        this.waitingWriteToLocalFile = false
      }
    },

    // 创建本地文件
    async createNewLocalFile() {
      await this.createLocalFile(exampleData)
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
          spinner: 'el-icon-loading',
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
        console.log(error)
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
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: rgba(26, 26, 26, 0.8);
    z-index: 2;

    .toolbarBlock {
      display: flex;
      background-color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.06);
      margin-right: 20px;
      flex-shrink: 0;
      position: relative;

      &:last-of-type {
        margin-right: 0;
      }

      .fileTreeBox {
        position: absolute;
        left: 0;
        top: 68px;
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
              font-size: 18px;
              margin-left: 12px;
              cursor: pointer;
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
      flex-direction: column;
      cursor: pointer;
      margin-right: 20px;

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
      }
    }
  }
}
</style>
