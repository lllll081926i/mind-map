<template>
    <svg
      class="edgeLayer"
      xmlns="http://www.w3.org/2000/svg"
      :width="canvasWorldBounds.width"
      :height="canvasWorldBounds.height"
      :viewBox="`0 0 ${canvasWorldBounds.width} ${canvasWorldBounds.height}`"
    >
      <defs>
        <marker
          v-for="edge in edgesWithLayout"
          :id="getEdgeMarkerId(edge.id)"
          :key="`marker-${edge.id}`"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" :fill="getEdgeStroke(edge)"></path>
        </marker>
      </defs>
      <g v-for="edge in edgesWithLayout" :key="edge.id">
        <path
          class="edgePath"
          :class="{ isSelected: selectedEdgeId === edge.id }"
          :d="edge.path"
          :stroke="getEdgeStroke(edge)"
          :stroke-dasharray="edge.style.dashed ? '8 6' : null"
          :marker-end="`url(#${getEdgeMarkerId(edge.id)})`"
          @click.stop="$emit('select-edge', edge.id)"
          @dblclick.stop="$emit('edit-edge-label', edge.id)"
        />
        <rect
          v-if="edge.label"
          class="edgeLabelBackdrop"
          :x="getEdgeLabelRectX(edge)"
          :y="getEdgeLabelRectY(edge)"
          :width="getEdgeLabelWidth(edge)"
          :height="getEdgeLabelHeight()"
          rx="8"
          @click.stop="$emit('select-edge', edge.id)"
          @dblclick.stop="$emit('edit-edge-label', edge.id)"
        />
        <text
          v-if="edge.label"
          class="edgeLabel"
          :x="edge.labelX"
          :y="edge.labelY"
          :fill="edge.style.labelColor"
          dominant-baseline="middle"
          @click.stop="$emit('select-edge', edge.id)"
          @dblclick.stop="$emit('edit-edge-label', edge.id)"
        >
          {{ edge.label }}
        </text>
        <template v-if="selectedEdgeId === edge.id">
          <circle
            class="flowchartEdgeReconnectHandle"
            :cx="edge.sourcePoint.x"
            :cy="edge.sourcePoint.y"
            r="6"
            @mousedown.stop.prevent="$emit('start-edge-reconnect', $event, edge.id, 'source')"
          ></circle>
          <circle
            class="flowchartEdgeReconnectHandle"
            :cx="edge.targetPoint.x"
            :cy="edge.targetPoint.y"
            r="6"
            @mousedown.stop.prevent="$emit('start-edge-reconnect', $event, edge.id, 'target')"
          ></circle>
        </template>
      </g>
      <line
        v-for="guide in alignmentGuides"
        :key="guide.id"
        class="flowchartGuideLine"
        :x1="guide.x1"
        :y1="guide.y1"
        :x2="guide.x2"
        :y2="guide.y2"
      />
      <path
        v-if="connectorPreview"
        class="flowchartConnectorPreview"
        :d="connectorPreview.path"
      />
    </svg>

    <div
      v-if="edgeToolbarState"
      class="flowchartEdgeToolbar"
      :style="edgeToolbarState.style"
    >
      <button
        type="button"
        class="flowchartEdgeToolbarBtn"
        :aria-label="labels.edgeLabel"
        @click.stop="$emit('edit-edge-label', edgeToolbarState.edgeId)"
      >
        T
      </button>
      <button
        type="button"
        class="flowchartEdgeToolbarBtn"
        :aria-label="labels.addProcess"
        @click.stop="$emit('insert-node-on-edge', edgeToolbarState.edgeId)"
      >
        +
      </button>
      <button
        type="button"
        class="flowchartEdgeToolbarBtn"
        :aria-label="labels.delete"
        @click.stop="$emit('remove-edge', edgeToolbarState.edgeId)"
      >
        ×
      </button>
    </div>
</template>

<script>
export default {
  name: 'FlowchartEdgeLayer',
  emits: [
    'select-edge',
    'edit-edge-label',
    'insert-node-on-edge',
    'remove-edge',
    'start-edge-reconnect'
  ],
  props: {
    edgesWithLayout: {
      type: Array,
      required: true
    },
    selectedEdgeId: {
      type: String,
      default: ''
    },
    alignmentGuides: {
      type: Array,
      required: true
    },
    canvasWorldBounds: {
      type: Object,
      required: true
    },
    connectorPreview: {
      type: Object,
      default: null
    },
    edgeToolbarState: {
      type: Object,
      default: null
    },
    labels: {
      type: Object,
      required: true
    }
  },
  methods: {
    getEdgeMarkerId(edgeId) {
      return `flowchart-editor-arrow-${String(edgeId || '').replace(/[^a-zA-Z0-9_-]/g, '-')}`
    },
    getEdgeStroke(edge) {
      return this.selectedEdgeId === edge.id ? 'var(--flowchart-selection)' : edge.style.stroke
    },
    getEdgeLabelTextUnits(label = '') {
      return Array.from(String(label || '')).reduce((total, char) => {
        if (/\s/.test(char)) {
          return total + 0.45
        }
        if (/[\u1100-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(char)) {
          return total + 1.7
        }
        if (/[MW@#%&]/.test(char)) {
          return total + 1
        }
        return total + 0.72
      }, 0)
    },
    getEdgeLabelWidth(edge) {
      return Math.max(48, Math.ceil(this.getEdgeLabelTextUnits(edge?.label) * 7.6 + 20))
    },
    getEdgeLabelHeight() {
      return 24
    },
    getEdgeLabelRectX(edge) {
      return Number(edge?.labelX || 0) - this.getEdgeLabelWidth(edge) / 2
    },
    getEdgeLabelRectY(edge) {
      return Number(edge?.labelY || 0) - this.getEdgeLabelHeight() / 2
    }
  }
}
</script>
