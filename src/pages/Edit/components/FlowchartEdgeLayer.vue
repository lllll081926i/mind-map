<template>
    <svg
      class="edgeLayer"
      xmlns="http://www.w3.org/2000/svg"
      :width="canvasWorldBounds.width"
      :height="canvasWorldBounds.height"
      :viewBox="`0 0 ${canvasWorldBounds.width} ${canvasWorldBounds.height}`"
    >
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
          :stroke-dasharray="edge.style.dashArray || null"
          pointer-events="none"
        />
        <text
          v-if="edge.label"
          class="edgeLabel"
          :class="{ isSelected: selectedEdgeId === edge.id }"
          :x="edge.labelX"
          :y="edge.labelY"
          :fill="edge.style.labelColor"
          text-anchor="middle"
          dominant-baseline="middle"
          @mousedown.stop="$emit('start-edge-label-drag', $event, edge.id)"
          @click.stop="$emit('select-edge', edge.id)"
          @dblclick.stop="$emit('edit-edge-label', edge.id)"
        >
          {{ edge.label }}
        </text>
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

    <svg
      class="edgeArrowLayer"
      xmlns="http://www.w3.org/2000/svg"
      :width="canvasWorldBounds.width"
      :height="canvasWorldBounds.height"
      :viewBox="`0 0 ${canvasWorldBounds.width} ${canvasWorldBounds.height}`"
    >
      <g v-for="edge in edgesWithLayout" :key="`arrows-${edge.id}`">
        <path
          v-for="(marker, markerIndex) in getRenderedArrowMarkers(edge)"
          :key="`arrow-${edge.id}-${markerIndex}`"
          class="flowchartArrowHead"
          :d="getArrowPath(marker)"
          :transform="`translate(${marker.x} ${marker.y}) rotate(${marker.angle})`"
          :fill="getEdgeStroke(edge)"
          pointer-events="none"
        />
      </g>
    </svg>

    <svg
      v-if="selectedEdges.length"
      class="edgeHandleLayer"
      xmlns="http://www.w3.org/2000/svg"
      :width="canvasWorldBounds.width"
      :height="canvasWorldBounds.height"
      :viewBox="`0 0 ${canvasWorldBounds.width} ${canvasWorldBounds.height}`"
    >
      <g v-for="edge in selectedEdges" :key="`handles-${edge.id}`">
        <line
          v-for="segmentHandle in getSegmentHandles(edge)"
          :key="`segment-hit-${edge.id}-${segmentHandle.index}`"
          class="flowchartEdgeSegmentHitArea"
          :class="segmentHandle.axis === 'y' ? 'isHorizontal' : 'isVertical'"
          :x1="segmentHandle.start.x"
          :y1="segmentHandle.start.y"
          :x2="segmentHandle.end.x"
          :y2="segmentHandle.end.y"
          @mousedown.stop.prevent="$emit('start-edge-segment-drag', $event, edge.id, segmentHandle.index)"
        ></line>
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
          r="18"
          @mousedown.stop.prevent="$emit('start-edge-reconnect', $event, edge.id, 'source')"
        ></circle>
        <circle
          class="flowchartEdgeHandleHitArea"
          :cx="edge.targetPoint.x"
          :cy="edge.targetPoint.y"
          r="18"
          @mousedown.stop.prevent="$emit('start-edge-reconnect', $event, edge.id, 'target')"
        ></circle>
        <circle
          class="flowchartEdgeReconnectHandle"
          :cx="edge.sourcePoint.x"
          :cy="edge.sourcePoint.y"
          r="8"
        ></circle>
        <circle
          class="flowchartEdgeReconnectHandle"
          :cx="edge.targetPoint.x"
          :cy="edge.targetPoint.y"
          r="8"
        ></circle>
      </g>
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
    'start-edge-bend-drag',
    'start-edge-segment-drag'
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
  computed: {
    selectedEdges() {
      if (!this.selectedEdgeId) {
        return []
      }
      return this.edgesWithLayout.filter(edge => edge.id === this.selectedEdgeId)
    }
  },
  methods: {
    getEdgeStroke(edge) {
      return this.selectedEdgeId === edge.id ? 'var(--flowchart-selection)' : edge.style.stroke
    },
    getArrowPath(marker) {
      return getFlowchartArrowHeadPath(marker)
    },
    getRenderedArrowMarkers(edge) {
      return Array.isArray(edge?.arrowMarkers) ? edge.arrowMarkers : []
    },
    getBendHandles(edge) {
      return Array.isArray(edge?.bendHandles) ? edge.bendHandles : []
    },
    getSegmentHandles(edge) {
      const points = Array.isArray(edge?.pathPoints) ? edge.pathPoints : []
      if (points.length < 2 || edge?.style?.pathType !== 'orthogonal') {
        return []
      }
      return points.slice(0, -1).reduce((result, start, index) => {
        const end = points[index + 1]
        const isVertical = Math.abs(Number(start?.x || 0) - Number(end?.x || 0)) <= 0.001
        const isHorizontal = Math.abs(Number(start?.y || 0) - Number(end?.y || 0)) <= 0.001
        const moveAxis = isVertical ? 'x' : 'y'
        const segmentLength = Math.hypot(
          Number(end?.x || 0) - Number(start?.x || 0),
          Number(end?.y || 0) - Number(start?.y || 0)
        )
        if (
          (!isVertical && !isHorizontal) ||
          segmentLength < 24
        ) {
          return result
        }
        result.push({
          index,
          start,
          end,
          axis: moveAxis
        })
        return result
      }, [])
    }
  }
}
</script>
