<template>
  <Sidebar
    ref="sidebar"
    :title="$t('note.title')"
    :force-show="activeSidebar === 'noteSidebar'"
  >
    <div class="noteContentWrap" ref="noteContentWrap"></div>
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import { mapState } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { setActiveSidebar } from '@/stores/runtime'

let noteSidebarViewerLoader = null

const loadNoteSidebarViewer = async () => {
  if (!noteSidebarViewerLoader) {
    noteSidebarViewerLoader = Promise.all([
      import('@toast-ui/editor/dist/toastui-editor-viewer'),
      import('@toast-ui/editor/dist/toastui-editor-viewer.css')
    ]).then(([module]) => module.default || module)
  }
  return noteSidebarViewerLoader
}

export default {
  components: {
    Sidebar
  },
  props: {
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      editor: null,
      node: null
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useAppStore, {
      activeSidebar: 'activeSidebar'
    })
  },
  watch: {
    activeSidebar: {
      immediate: true,
      handler(val) {
        this.$nextTick(() => {
          if (!this.$refs.sidebar) return
          if (val === 'noteSidebar') {
            this.$refs.sidebar.show = true
          } else {
            this.$refs.sidebar.show = false
          }
        })
      }
    }
  },
  created() {
    this.$bus.$on('node_active', this.onNodeActive)
    this.mindMap.on('node_note_click', this.onNodeNoteClick)
  },
  mounted() {
    if (this.activeSidebar === 'noteSidebar') {
      this.$refs.sidebar.show = true
    }
  },
  beforeUnmount() {
    this.$bus.$off('node_active', this.onNodeActive)
    this.mindMap.off('node_note_click', this.onNodeNoteClick)
  },
  methods: {
    onNodeActive(...args) {
      if (this.activeSidebar !== 'noteSidebar') {
        return
      }
      const nodes = [...(args[1] || [])]
      if (nodes.length > 0) {
        if (nodes[0] !== this.node) {
          setActiveSidebar('')
        }
      } else {
        setActiveSidebar(null)
      }
    },

    // 初始化编辑器
    async initEditor() {
      if (!this.editor) {
        const Viewer = await loadNoteSidebarViewer()
        this.editor = new Viewer({
          el: this.$refs.noteContentWrap
        })
      }
    },

    async onNodeNoteClick(node) {
      this.node = node
      setActiveSidebar('noteSidebar')
      await this.initEditor()
      this.editor.setMarkdown(node.getData('note'))
    }
  }
}
</script>

<style lang="less" scoped>
.noteContentWrap {
  padding: 12px 20px;
}
</style>
