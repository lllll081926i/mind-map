<template>
  <el-dialog
    class="nodeNoteDialog"
    :class="{ isDark: isDark }"
    :title="$t('nodeNote.title')"
    :visible.sync="dialogVisible"
    :width="isMobile ? '90%' : '50%'"
    :top="isMobile ? '20px' : '15vh'"
  >
    <!-- <el-input
      type="textarea"
      :autosize="{ minRows: 3, maxRows: 5 }"
      placeholder="请输入内容"
      v-model="note"
    >
    </el-input> -->
    <div class="noteEditor" ref="noteEditor" @keyup.stop @keydown.stop></div>
    <!-- <div class="tip">换行请使用：Enter+Shift</div> -->
    <span slot="footer" class="dialog-footer">
      <el-button @click="cancel">{{ $t('dialog.cancel') }}</el-button>
      <el-button type="primary" @click="confirm">{{
        $t('dialog.confirm')
      }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { isMobile } from 'simple-mind-map/src/utils/index'
import { mapState } from 'vuex'

let noteEditorLoader = null

const loadNoteEditor = async () => {
  if (!noteEditorLoader) {
    noteEditorLoader = Promise.all([
      import('@toast-ui/editor'),
      import('@toast-ui/editor/dist/toastui-editor.css')
    ]).then(([module]) => module.default || module)
  }
  return noteEditorLoader
}

// 节点备注内容设置
export default {
  name: 'NodeNote',
  data() {
    return {
      dialogVisible: false,
      note: '',
      activeNodes: [],
      editor: null,
      isMobile: isMobile(),
      appointNode: null
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark
    })
  },
  watch: {
    dialogVisible(val, oldVal) {
      if (!val && oldVal) {
        this.$bus.$emit('endTextEdit')
      }
    }
  },
  created() {
    this.$bus.$on('node_active', this.handleNodeActive)
    this.$bus.$on('showNodeNote', this.handleShowNodeNote)
  },
  beforeDestroy() {
    this.$bus.$off('node_active', this.handleNodeActive)
    this.$bus.$off('showNodeNote', this.handleShowNodeNote)
  },
  methods: {
    handleNodeActive(...args) {
      this.activeNodes = [...args[1]]
      this.updateNoteInfo()
    },

    updateNoteInfo() {
      if (this.activeNodes.length > 0) {
        let firstNode = this.activeNodes[0]
        this.note = firstNode.getData('note') || ''
      } else {
        this.note = ''
      }
    },

    async handleShowNodeNote(node) {
      this.$bus.$emit('startTextEdit')
      if (node) {
        this.appointNode = node
        this.note = node.getData('note') || ''
      }
      this.dialogVisible = true
      this.$nextTick(async () => {
        await this.initEditor()
      })
    },

    async initEditor() {
      if (!this.editor) {
        const Editor = await loadNoteEditor()
        this.editor = new Editor({
          el: this.$refs.noteEditor,
          height: '500px',
          initialEditType: 'markdown',
          previewStyle: 'vertical'
        })
      }
      this.editor.setMarkdown(this.note)
    },

    cancel() {
      this.dialogVisible = false
      if (this.appointNode) {
        this.appointNode = null
        this.updateNoteInfo()
      }
    },

    confirm() {
      this.note = this.editor.getMarkdown()
      if (this.appointNode) {
        this.appointNode.setNote(this.note)
      } else {
        this.activeNodes.forEach(node => {
          node.setNote(this.note)
        })
      }

      this.cancel()
    }
  }
}
</script>

<style lang="less" scoped>
.nodeNoteDialog {
  &.isDark {
    /deep/ .toastui-editor-defaultUI {
      border-color: hsla(0, 0%, 100%, 0.1);
    }

    /deep/ .toastui-editor-defaultUI-toolbar,
    /deep/ .toastui-editor-main-container {
      background-color: #363b3f;
    }

    /deep/ .toastui-editor-md-container,
    /deep/ .toastui-editor-ww-container,
    /deep/ .toastui-editor-md-tab-container {
      background-color: #363b3f;
      color: hsla(0, 0%, 100%, 0.85);
    }

    /deep/ .toastui-editor-toolbar-icons {
      filter: invert(1) hue-rotate(180deg);
    }
  }

  .tip {
    margin-top: 5px;
    color: #dcdfe6;
  }
}
</style>
