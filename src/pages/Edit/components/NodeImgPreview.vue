<template>
  <div class="nodeImgPreviewRoot">
    <img v-if="previewUrl" ref="previewImg" :src="previewUrl" alt="" />
  </div>
</template>

<script>
let viewerLoader = null

const loadViewer = async () => {
  if (!viewerLoader) {
    viewerLoader = Promise.all([
      import('viewerjs'),
      import('viewerjs/dist/viewer.css')
    ]).then(([module]) => module.default || module)
  }
  return viewerLoader
}

export default {
  props: {
    mindMap: {
      type: Object,
      default() {
        return null
      }
    }
  },
  data() {
    return {
      previewUrl: '',
      viewer: null
    }
  },
  mounted() {
    this.mindMap.on('node_img_dblclick', this.onNodeTmgDblclick)
  },
  beforeDestroy() {
    this.mindMap.off('node_img_dblclick', this.onNodeTmgDblclick)
    this.destroyViewer()
  },
  methods: {
    async onNodeTmgDblclick(node, e) {
      e.stopPropagation()
      e.preventDefault()
      this.previewUrl = node.getImageUrl()
      await this.$nextTick()
      this.destroyViewer()
      const Viewer = await loadViewer()
      this.viewer = new Viewer(this.$refs.previewImg, {
        hidden: () => {
          this.destroyViewer()
          this.previewUrl = ''
        }
      })
      this.viewer.show()
    },

    destroyViewer() {
      if (this.viewer) {
        this.viewer.destroy()
        this.viewer = null
      }
    }
  }
}
</script>

<style scoped>
.nodeImgPreviewRoot {
  display: none;
}
</style>
