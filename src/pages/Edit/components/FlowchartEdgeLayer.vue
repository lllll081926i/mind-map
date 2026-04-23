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
      :class="edgeToolbarState.placement ? `is-${edgeToolbarState.placement}` : ''"
      :style="edgeToolbarState.style"
    >
      <button
        type="button"
        class="flowchartEdgeToolbarBtn"
        :aria-label="labels.edgeEditText"
        :title="labels.edgeEditText"
        @click.stop="$emit('edit-edge-label', edgeToolbarState.edgeId)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20h4l9.5-9.5a2.1 2.1 0 0 0-3-3L5 17v3z"></path>
          <path d="M13.5 6.5l4 4"></path>
        </svg>
        <span class="flowchartEdgeToolbarText">{{ labels.edgeEditText }}</span>
      </button>
      <button
        type="button"
        class="flowchartEdgeToolbarBtn"
        :aria-label="labels.edgeInsertNode"
        :title="labels.edgeInsertNode"
        @click.stop="$emit('insert-node-on-edge', edgeToolbarState.edgeId)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
          <path d="M4 18h16"></path>
        </svg>
        <span class="flowchartEdgeToolbarText">{{ labels.edgeInsertNode }}</span>
      </button>
      <button
        type="button"
        class="flowchartEdgeToolbarBtn isDanger"
        :aria-label="labels.edgeDeleteLine"
        :title="labels.edgeDeleteLine"
        @click.stop="$emit('remove-edge', edgeToolbarState.edgeId)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 7h14"></path>
          <path d="M9 7V5h6v2"></path>
          <path d="M8 10v8"></path>
          <path d="M12 10v8"></path>
          <path d="M16 10v8"></path>
          <path d="M7 7l1 12h8l1-12"></path>
        </svg>
        <span class="flowchartEdgeToolbarText">{{ labels.edgeDeleteLine }}</span>
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
    }
  }
}
</script>
