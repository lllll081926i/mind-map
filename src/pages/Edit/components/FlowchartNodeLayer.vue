<template>
  <div
    v-for="node in nodes"
    :key="node.id"
    class="flowchartNode"
    :class="[
      `nodeType-${node.type}`,
      {
        isSelected: selectedNodeIds.includes(node.id),
        isConnectorTarget: connectorTargetNodeId === node.id
      }
    ]"
    :style="getNodeStyle(node)"
    @mousedown.stop="$emit('start-node-drag', $event, node)"
    @click.stop="$emit('select-node', node.id, $event)"
    @dblclick.stop="$emit('edit-node-text', node.id)"
  >
    <svg
      v-if="usesPolygonShape(node)"
      class="flowchartNodeShapeSvg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon
        v-if="node.type === 'decision'"
        class="flowchartNodeShapePolygon"
        :points="getDecisionPolygonPoints()"
      ></polygon>
      <polygon
        v-else
        class="flowchartNodeShapePolygon"
        :points="getInputPolygonPoints()"
      ></polygon>
    </svg>
    <span class="nodeText">{{ node.text }}</span>
    <template v-if="showConnectorHandlesForNode(node.id)">
      <button
        v-for="direction in connectorDirections"
        :key="direction"
        type="button"
        class="flowchartConnectorHandle"
        :class="`is-${direction}`"
        :style="getConnectorHandleStyle(node, direction)"
        @mousedown.stop.prevent="$emit('start-connector-drag', $event, node.id, direction)"
      ></button>
    </template>
    <template v-if="showResizeHandlesForNode(node.id)">
      <button
        v-for="direction in resizeDirections"
        :key="direction"
        type="button"
        class="flowchartResizeHandle"
        :class="`is-${direction}`"
        @mousedown.stop.prevent="$emit('start-node-resize', $event, node, direction)"
      ></button>
    </template>
  </div>
</template>

<script>
const CONNECTOR_DIRECTIONS = ['top', 'right', 'bottom', 'left']
const RESIZE_DIRECTIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

export default {
  name: 'FlowchartNodeLayer',
  emits: [
    'start-node-drag',
    'select-node',
    'edit-node-text',
    'start-connector-drag',
    'start-node-resize'
  ],
  props: {
    nodes: {
      type: Array,
      required: true
    },
    selectedNodeIds: {
      type: Array,
      required: true
    },
    getNodeStyle: {
      type: Function,
      required: true
    },
    getConnectorHandleStyle: {
      type: Function,
      required: true
    },
    showConnectorHandlesForNode: {
      type: Function,
      required: true
    },
    showResizeHandlesForNode: {
      type: Function,
      required: true
    },
    connectorTargetNodeId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      connectorDirections: CONNECTOR_DIRECTIONS,
      resizeDirections: RESIZE_DIRECTIONS
    }
  },
  methods: {
    usesPolygonShape(node) {
      return node?.type === 'decision' || node?.type === 'input'
    },
    getDecisionPolygonPoints() {
      return '50,1 99,50 50,99 1,50'
    },
    getInputPolygonPoints() {
      return '13,1 99,1 87,99 1,99'
    }
  }
}
</script>
