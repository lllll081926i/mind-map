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
        v-for="lane in lanes"
        :key="lane.id"
        class="flowchartMinimapLane"
        :x="lane.x"
        :y="lane.y"
        :width="lane.width"
        :height="lane.height"
        rx="20"
      ></rect>
      <path
        v-for="edge in edges"
        :key="edge.id"
        class="flowchartMinimapEdge"
        :d="edge.path"
      ></path>
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
    edges: {
      type: Array,
      default: () => []
    },
    lanes: {
      type: Array,
      default: () => []
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
      dragActive: false,
      dragFrameId: 0,
      pendingClientPoint: null,
      dragPointerOffset: null,
      lastWorldPoint: null
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
      const items = [...this.lanes, ...this.nodes]
      const bounds = items.reduce(
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
    getMinimapCenterSlowdownRadius() {
      const bounds = this.contentBounds
      return Math.max(96, Math.min(bounds.width, bounds.height) * 0.2)
    },
    applyCenterSlowdownToWorldPoint(worldPoint) {
      if (!worldPoint) {
        return null
      }
      const bounds = this.contentBounds
      const contentCenterX = bounds.x + bounds.width / 2
      const contentCenterY = bounds.y + bounds.height / 2
      const deltaX = worldPoint.x - contentCenterX
      const deltaY = worldPoint.y - contentCenterY
      const distance = Math.hypot(deltaX, deltaY)
      const slowdownRadius = this.getMinimapCenterSlowdownRadius()
      if (distance < 0.001 || distance >= slowdownRadius) {
        return worldPoint
      }
      const progress = distance / slowdownRadius
      const speedFactor = 0.38 + 0.62 * progress * progress
      return {
        x: contentCenterX + deltaX * speedFactor,
        y: contentCenterY + deltaY * speedFactor
      }
    },
    resolveWorldPointFromClientPoint(clientPoint) {
      const rect = this.$el?.getBoundingClientRect?.()
      const bounds = this.contentBounds
      if (!rect.width || !rect.height) {
        return null
      }
      const ratioX = Math.max(
        0,
        Math.min(1, (clientPoint.clientX - rect.left) / rect.width)
      )
      const ratioY = Math.max(
        0,
        Math.min(1, (clientPoint.clientY - rect.top) / rect.height)
      )
      return {
        x: bounds.x + bounds.width * ratioX,
        y: bounds.y + bounds.height * ratioY
      }
    },
    isPointInsideViewportRect(point) {
      const viewportRect = this.viewportRect
      return (
        point.x >= viewportRect.x &&
        point.x <= viewportRect.x + viewportRect.width &&
        point.y >= viewportRect.y &&
        point.y <= viewportRect.y + viewportRect.height
      )
    },
    buildViewportCenterPoint(worldPoint) {
      const viewportRect = this.viewportRect
      const adjustedWorldPoint = this.applyCenterSlowdownToWorldPoint(worldPoint)
      const offset = this.dragPointerOffset || {
        x: viewportRect.width / 2,
        y: viewportRect.height / 2
      }
      return {
        x: adjustedWorldPoint.x - offset.x + viewportRect.width / 2,
        y: adjustedWorldPoint.y - offset.y + viewportRect.height / 2
      }
    },
    emitJump(worldPoint, { persist = false } = {}) {
      if (!worldPoint) {
        return
      }
      const centerPoint = this.buildViewportCenterPoint(worldPoint)
      this.lastWorldPoint = worldPoint
      this.$emit('jump-to-point', {
        ...centerPoint,
        persist
      })
    },
    startMinimapDrag(event) {
      const worldPoint = this.resolveWorldPointFromClientPoint(event)
      if (!worldPoint) {
        return
      }
      const viewportRect = this.viewportRect
      this.dragPointerOffset = this.isPointInsideViewportRect(worldPoint)
        ? {
            x: worldPoint.x - viewportRect.x,
            y: worldPoint.y - viewportRect.y
          }
        : {
            x: viewportRect.width / 2,
            y: viewportRect.height / 2
          }
      this.dragActive = true
      this.emitJump(worldPoint, {
        persist: false
      })
      window.addEventListener('mousemove', this.onMinimapDrag)
      window.addEventListener('mouseup', this.stopMinimapDrag)
    },
    flushMinimapDragFrame() {
      this.dragFrameId = 0
      if (!this.dragActive || !this.pendingClientPoint) {
        return
      }
      const worldPoint = this.resolveWorldPointFromClientPoint(
        this.pendingClientPoint
      )
      this.pendingClientPoint = null
      this.emitJump(worldPoint, {
        persist: false
      })
    },
    onMinimapDrag(event) {
      if (!this.dragActive) {
        return
      }
      this.pendingClientPoint = {
        clientX: event.clientX,
        clientY: event.clientY
      }
      if (this.dragFrameId) {
        return
      }
      this.dragFrameId = window.requestAnimationFrame(() => {
        this.flushMinimapDragFrame()
      })
    },
    stopMinimapDrag(event) {
      if (this.dragFrameId) {
        cancelAnimationFrame(this.dragFrameId)
        this.dragFrameId = 0
      }
      const finalWorldPoint = event
        ? this.resolveWorldPointFromClientPoint({
            clientX: event.clientX,
            clientY: event.clientY
          })
        : this.pendingClientPoint
          ? this.resolveWorldPointFromClientPoint(this.pendingClientPoint)
          : this.lastWorldPoint
      this.pendingClientPoint = null
      if (this.dragActive && finalWorldPoint) {
        this.emitJump(finalWorldPoint, {
          persist: true
        })
      }
      this.dragActive = false
      this.dragPointerOffset = null
      this.lastWorldPoint = null
      window.removeEventListener('mousemove', this.onMinimapDrag)
      window.removeEventListener('mouseup', this.stopMinimapDrag)
    }
  },
  beforeUnmount() {
    this.stopMinimapDrag()
  }
}
</script>
