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
          viewBox="0 0 8 8"
          :refX="getEdgeMarkerRefX(edge)"
          refY="4"
          :markerWidth="getEdgeMarkerSize(edge)"
          :markerHeight="getEdgeMarkerSize(edge)"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" :fill="getEdgeStroke(edge)"></path>
        </marker>
      </defs>
      <g v-for="edge in edgesWithLayout" :key="edge.id">
        <path
          class="edgeHitArea"
          :d="edge.path"
          @click.stop="$emit('select-edge', edge.id)"
          @dblclick.stop="$emit('edit-edge-label', edge.id)"
        />
        <path
          class="edgePath"
          :class="{ isSelected: selectedEdgeId === edge.id }"
          :d="edge.path"
          :stroke="getEdgeStroke(edge)"
          :stroke-dasharray="edge.style.dashed ? '8 6' : null"
          :marker-end="edge.style.arrowCount ? `url(#${getEdgeMarkerId(edge.id)})` : null"
          pointer-events="none"
        />
        <path
          v-for="(marker, markerIndex) in getInlineArrowMarkers(edge)"
          :key="`arrow-${edge.id}-${markerIndex}`"
          class="flowchartArrowHead"
          :d="getArrowPath(marker)"
          :transform="`translate(${marker.x} ${marker.y}) rotate(${marker.angle})`"
          :fill="getEdgeStroke(edge)"
          pointer-events="none"
        />
        <text
          v-if="edge.label"
          class="edgeLabel"
          :class="{ isSelected: selectedEdgeId === edge.id }"
          :x="edge.labelX"
          :y="edge.labelY"
          :fill="edge.style.labelColor"
          dominant-baseline="middle"
          @mousedown.stop="$emit('start-edge-label-drag', $event, edge.id)"
          @click.stop="$emit('select-edge', edge.id)"
          @dblclick.stop="$emit('edit-edge-label', edge.id)"
        >
          {{ edge.label }}
        </text>
        <template v-if="selectedEdgeId === edge.id">
          <circle
            v-for="(bendHandle, bendIndex) in getBendHandles(edge)"
            :key="`bend-hit-${edge.id}-${bendIndex}`"
            class="flowchartEdgeHandleHitArea"
            :class="bendHandle.axis === 'y' ? 'isVertical' : 'isHorizontal'"
            :cx="bendHandle.x"
            :cy="bendHandle.y"
            r="15"
            @mousedown.stop.prevent="$emit('start-edge-bend-drag', $event, edge.id, bendIndex)"
          ></circle>
          <circle
            v-for="(bendHandle, bendIndex) in getBendHandles(edge)"
            :key="`bend-${edge.id}-${bendIndex}`"
            class="flowchartEdgeBendHandle"
            :class="bendHandle.axis === 'y' ? 'isVertical' : 'isHorizontal'"
            :cx="bendHandle.x"
            :cy="bendHandle.y"
            r="6.5"
          ></circle>
          <circle
            class="flowchartEdgeHandleHitArea"
            :cx="edge.sourcePoint.x"
            :cy="edge.sourcePoint.y"
            r="16"
            @mousedown.stop.prevent="$emit('start-edge-reconnect', $event, edge.id, 'source')"
          ></circle>
          <circle
            class="flowchartEdgeHandleHitArea"
            :cx="edge.targetPoint.x"
            :cy="edge.targetPoint.y"
            r="16"
            @mousedown.stop.prevent="$emit('start-edge-reconnect', $event, edge.id, 'target')"
          ></circle>
          <circle
            class="flowchartEdgeReconnectHandle"
            :cx="edge.sourcePoint.x"
            :cy="edge.sourcePoint.y"
            r="7.5"
          ></circle>
          <circle
            class="flowchartEdgeReconnectHandle"
            :cx="edge.targetPoint.x"
            :cy="edge.targetPoint.y"
            r="7.5"
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

</template>

<script>
import { getFlowchartArrowHeadPath } from '@/services/flowchartDocument'

export default {
  name: 'FlowchartEdgeLayer',
  emits: [
    'select-edge',
    'edit-edge-label',
    'start-edge-label-drag',
    'start-edge-reconnect',
    'start-edge-bend-drag'
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
    labels: {
      type: Object,
      required: true
    }
  },
  methods: {
    getEdgeMarkerId(edgeId) {
      return `flowchart-editor-arrow-${String(edgeId || '').replace(/[^a-zA-Z0-9_-]/g, '-')}`
    },
    getEdgeMarkerSize(edge) {
      return Math.round(6 * Number(edge?.style?.arrowSize || 1) * 100) / 100
    },
    getEdgeMarkerRefX(edge) {
      return Math.round(7.6 * Number(edge?.style?.arrowSize || 1) * 100) / 100
    },
    getEdgeStroke(edge) {
      return this.selectedEdgeId === edge.id ? 'var(--flowchart-selection)' : edge.style.stroke
    },
    getArrowPath(marker) {
      return getFlowchartArrowHeadPath(marker)
    },
    getInlineArrowMarkers(edge) {
      const markers = Array.isArray(edge?.arrowMarkers) ? edge.arrowMarkers : []
      if (markers.length <= 1) {
        return []
      }
      return markers.slice(0, -1)
    },
    getBendHandles(edge) {
      return Array.isArray(edge?.bendHandles) ? edge.bendHandles : []
    }
  }
}
</script>
