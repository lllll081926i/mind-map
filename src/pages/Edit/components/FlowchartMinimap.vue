<template>
  <button
    v-if="hasNodes"
    type="button"
    class="flowchartMinimap"
    :aria-label="labels.minimap"
    @mousedown.prevent="startMinimapDrag"
  >
    <svg :viewBox="minimapViewBox">
      <rect
        v-for="node in nodes"
        :key="node.id"
        class="flowchartMinimapNode"
        :x="node.x"
        :y="node.y"
        :width="node.width"
        :height="node.height"
        :rx="node.type === 'start' || node.type === 'end' ? 18 : 8"
      ></rect>
      <rect
        class="flowchartMinimapViewport"
        :x="viewportRect.x"
        :y="viewportRect.y"
        :width="viewportRect.width"
        :height="viewportRect.height"
      ></rect>
    </svg>
  </button>
</template>

<script>
export default {
  name: 'FlowchartMinimap',
  emits: ['jump-to-point'],
  props: {
    nodes: {
      type: Array,
      required: true
    },
    viewport: {
      type: Object,
      required: true
    },
    canvasViewportSize: {
      type: Object,
      required: true
    },
    labels: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      dragActive: false
    }
  },
  computed: {
    hasNodes() {
      return this.nodes.length > 0
    },
    contentBounds() {
      if (!this.nodes.length) {
        return {
          x: 0,
          y: 0,
          width: 800,
          height: 480
        }
      }
      const bounds = this.nodes.reduce(
        (result, node) => ({
          minX: Math.min(result.minX, Number(node.x || 0)),
          minY: Math.min(result.minY, Number(node.y || 0)),
          maxX: Math.max(result.maxX, Number(node.x || 0) + Number(node.width || 0)),
          maxY: Math.max(result.maxY, Number(node.y || 0) + Number(node.height || 0))
        }),
        {
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity
        }
      )
      const padding = 160
      const viewportRect = this.viewportRect
      const minX = Math.min(bounds.minX, viewportRect.x) - padding
      const minY = Math.min(bounds.minY, viewportRect.y) - padding
      const maxX = Math.max(bounds.maxX, viewportRect.x + viewportRect.width) + padding
      const maxY = Math.max(bounds.maxY, viewportRect.y + viewportRect.height) + padding
      return {
        x: minX,
        y: minY,
        width: Math.max(320, maxX - minX),
        height: Math.max(220, maxY - minY)
      }
    },
    minimapViewBox() {
      const bounds = this.contentBounds
      return `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`
    },
    viewportRect() {
      const zoom = Number(this.viewport.zoom || 1) || 1
      return {
        x: -Number(this.viewport.x || 0) / zoom,
        y: -Number(this.viewport.y || 0) / zoom,
        width: Number(this.canvasViewportSize.width || 0) / zoom,
        height: Number(this.canvasViewportSize.height || 0) / zoom
      }
    }
  },
  methods: {
    emitJump(event) {
      const rect = event.currentTarget.getBoundingClientRect()
      const bounds = this.contentBounds
      if (!rect.width || !rect.height) {
        return
      }
      const ratioX = (event.clientX - rect.left) / rect.width
      const ratioY = (event.clientY - rect.top) / rect.height
      this.$emit('jump-to-point', {
        x: bounds.x + bounds.width * ratioX,
        y: bounds.y + bounds.height * ratioY
      })
    },
    startMinimapDrag(event) {
      this.dragActive = true
      this.emitJump(event)
      window.addEventListener('mousemove', this.onMinimapDrag)
      window.addEventListener('mouseup', this.stopMinimapDrag)
    },
    onMinimapDrag(event) {
      if (!this.dragActive || !this.$el) {
        return
      }
      this.emitJump({
        clientX: event.clientX,
        clientY: event.clientY,
        currentTarget: this.$el
      })
    },
    stopMinimapDrag() {
      this.dragActive = false
      window.removeEventListener('mousemove', this.onMinimapDrag)
      window.removeEventListener('mouseup', this.stopMinimapDrag)
    }
  },
  beforeUnmount() {
    this.stopMinimapDrag()
  }
}
</script>
