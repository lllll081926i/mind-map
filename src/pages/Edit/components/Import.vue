<template>
  <div>
    <el-dialog
      class="nodeImportDialog"
      :class="{ isDark: isDark }"
      :title="$t('import.title')"
      v-model="dialogVisible"
      width="350px"
    >
      <el-upload
        ref="upload"
        action="x"
        :accept="supportFileStr"
        :file-list="fileList"
        :auto-upload="false"
        :multiple="false"
        :on-change="onChange"
        :on-remove="onRemove"
        :limit="1"
        :on-exceed="onExceed"
      >
        <template #trigger>
          <el-button size="small" type="primary">{{
            $t('import.selectFile')
          }}</el-button>
        </template>
        <template #tip>
          <div class="el-upload__tip">
            {{ $t('import.support') }}{{ supportFileStr }}{{ $t('import.file') }}
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancel">{{ $t('dialog.cancel') }}</el-button>
          <el-button type="primary" @click="confirm">{{
            $t('dialog.confirm')
          }}</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog
      class="xmindCanvasSelectDialog"
      :class="{ isDark: isDark }"
      :title="$t('import.xmindCanvasSelectDialogTitle')"
      v-model="xmindCanvasSelectDialogVisible"
      width="300px"
      :show-close="false"
    >
      <el-radio-group v-model="selectCanvas" class="canvasList">
        <el-radio
          v-for="(item, index) in canvasList"
          :key="index"
          :value="index"
          >{{ item.title }}</el-radio
        >
      </el-radio-group>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="confirmSelect">{{
            $t('dialog.confirm')
          }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import xmind from 'simple-mind-map/src/parse/xmind.js'
import markdown from 'simple-mind-map/src/parse/markdown.js'
import { mapState } from 'pinia'
import { onShowImport } from '@/services/appEvents'
import { useThemeStore } from '@/stores/theme'
import { setActiveSidebar, setIsHandleLocalFile } from '@/stores/runtime'

const MAX_IMPORT_FILE_SIZE = 25 * 1024 * 1024
const ALLOWED_REMOTE_PROTOCOLS = new Set(['http:', 'https:'])

// 导入
export default {
  data() {
    return {
      dialogVisible: false,
      fileList: [],
      selectPromiseResolve: null,
      xmindCanvasSelectDialogVisible: false,
      selectCanvas: '',
      canvasList: [],
      mdStr: ''
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    supportFileStr() {
      return '.smm,.json,.xmind,.md'
    }
  },
  watch: {
    dialogVisible(val, oldVal) {
      if (!val && oldVal) {
        this.fileList = []
      }
    }
  },
  created() {
    this.removeShowImportListener = onShowImport(this.handleShowImport)
    this.$bus.$on('handle_file_url', this.handleFileURL)
    this.$bus.$on('importFile', this.handleImportFile)
  },
  beforeUnmount() {
    this.removeShowImportListener && this.removeShowImportListener()
    this.$bus.$off('handle_file_url', this.handleFileURL)
    this.$bus.$off('importFile', this.handleImportFile)
  },
  methods: {
    async openDialog() {
      await this.$nextTick()
      this.dialogVisible = true
    },

    handleShowImport() {
      this.openDialog()
    },

    getRegexp() {
      return /\.(smm|json|xmind|md)$/
    },

    getImportPayload(file) {
      return file?.raw || file || null
    },

    getImportFileError(file) {
      const payload = this.getImportPayload(file)
      const name = String(file?.name || payload?.name || '')
      if (!name || !this.getRegexp().test(name)) {
        return (
          this.$t('import.pleaseSelect') +
          this.supportFileStr +
          this.$t('import.file')
        )
      }
      const size = Number(payload?.size || 0)
      if (size <= 0) {
        return this.$t('import.fileContentError')
      }
      if (size > MAX_IMPORT_FILE_SIZE) {
        return `导入文件不能超过 ${Math.floor(MAX_IMPORT_FILE_SIZE / 1024 / 1024)} MB`
      }
      return ''
    },

    resolveSafeImportURL(fileURL) {
      try {
        const url = new URL(fileURL, window.location.href)
        if (!ALLOWED_REMOTE_PROTOCOLS.has(url.protocol)) {
          return ''
        }
        if (url.origin !== window.location.origin) {
          return ''
        }
        if (!this.getRegexp().test(url.pathname)) {
          return ''
        }
        return url.toString()
      } catch (error) {
        console.error('resolveSafeImportURL failed', error)
        return ''
      }
    },

    // 检查url中是否操作需要打开的文件
    async handleFileURL() {
      try {
        const fileURL = this.$route.query.fileURL
        if (!fileURL) return
        const safeURL = this.resolveSafeImportURL(fileURL)
        if (!safeURL) {
          return
        }
        const macth = this.getRegexp().exec(safeURL)
        if (!macth) {
          return
        }
        const type = macth[1]
        const res = await fetch(safeURL)
        if (!res.ok) {
          throw new Error('文件请求失败')
        }
        const file = await res.blob()
        const fileName = safeURL.split('/').pop() || `import.${type}`
        const nextFile = new File([file], fileName, {
          type: file.type || 'application/octet-stream'
        })
        const importError = this.getImportFileError(nextFile)
        if (importError) {
          this.$message.error(importError)
          return
        }
        const data = {
          raw: nextFile,
          name: fileName
        }
        if (type === 'smm' || type === 'json') {
          this.handleSmm(data)
        } else if (type === 'xmind') {
          this.handleXmind(data)
        } else if (type === 'md') {
          this.handleMd(data)
        }
      } catch (error) {
        console.error('handleFileURL failed', error)
      }
    },

    // 文件选择
    onChange(file) {
      const importError = this.getImportFileError(file)
      if (importError) {
        this.$message.error(importError)
        this.fileList = []
      } else {
        this.fileList.push(file)
      }
    },

    // 移除文件
    onRemove(file, fileList) {
      this.fileList = fileList
    },

    // 数量超出限制
    onExceed() {
      this.$message.error(this.$t('import.maxFileNum'))
    },

    // 取消
    cancel() {
      this.dialogVisible = false
    },

    // 确定
    confirm() {
      if (this.fileList.length <= 0) {
        return this.$message.error(this.$t('import.notSelectTip'))
      }
      setIsHandleLocalFile(false)
      let file = this.fileList[0]
      if (/\.(smm|json)$/.test(file.name)) {
        this.handleSmm(file)
      } else if (/\.xmind$/.test(file.name)) {
        this.handleXmind(file)
      } else if (/\.md$/.test(file.name)) {
        this.handleMd(file)
      }
      this.cancel()
      setActiveSidebar('')
    },

    // 处理.smm文件
    handleSmm(file) {
      let fileReader = new FileReader()
      fileReader.readAsText(file.raw)
      fileReader.onload = evt => {
        try {
          let data = JSON.parse(evt.target.result)
          if (!data || typeof data !== 'object') {
            throw new Error(this.$t('import.fileContentError'))
          }
          this.$bus.$emit('setData', data)
          this.$message.success(this.$t('import.importSuccess'))
        } catch (error) {
          console.error('handleSmm failed', error)
          this.$message.error(this.$t('import.fileParsingFailed'))
        }
      }
    },

    // 处理.xmind文件
    async handleXmind(file) {
      try {
        let data = await xmind.parseXmindFile(file.raw, content => {
          this.showSelectXmindCanvasDialog(content)
          return new Promise(resolve => {
            this.selectPromiseResolve = resolve
          })
        })
        this.$bus.$emit('setData', data)
        this.$message.success(this.$t('import.importSuccess'))
      } catch (error) {
        console.error('handleXmind failed', error)
        this.$message.error(this.$t('import.fileParsingFailed'))
      }
    },

    // 显示xmind文件的多个画布选择弹窗
    showSelectXmindCanvasDialog(content) {
      this.canvasList = content
      this.selectCanvas = 0
      this.xmindCanvasSelectDialogVisible = true
    },

    // 确认导入指定的画布
    confirmSelect() {
      this.selectPromiseResolve(this.canvasList[this.selectCanvas])
      this.xmindCanvasSelectDialogVisible = false
      this.canvasList = []
      this.selectCanvas = 0
    },

    // 处理markdown文件
    async handleMd(file) {
      let fileReader = new FileReader()
      fileReader.readAsText(file.raw)
      fileReader.onload = async evt => {
        try {
          let data = markdown.transformMarkdownTo(evt.target.result)
          this.$bus.$emit('setData', data)
          this.$message.success(this.$t('import.importSuccess'))
        } catch (error) {
          console.error('handleMd failed', error)
          this.$message.error(this.$t('import.fileParsingFailed'))
        }
      }
    },

    // 导入指定文件
    handleImportFile(file) {
      const importError = this.getImportFileError(file)
      if (importError) {
        this.$message.error(importError)
        return
      }
      this.onChange({
        raw: file,
        name: file.name
      })
      if (this.fileList.length <= 0) return
      this.confirm()
    }
  }
}
</script>

<style lang="less" scoped>
.nodeImportDialog,
.xmindCanvasSelectDialog {
  &.isDark {
    :deep(.el-dialog__body) {
      color: hsla(0, 0%, 100%, 0.85);
    }

    .el-upload__tip {
      color: hsla(0, 0%, 100%, 0.6);
    }

    .canvasList {
      :deep(.el-radio) {
        color: hsla(0, 0%, 100%, 0.85);
      }
    }
  }
}

.canvasList {
  display: flex;
  flex-direction: column;

  :deep(.el-radio) {
    margin-bottom: 12px;

    &:last-of-type {
      margin-bottom: 0;
    }
  }
}
</style>
