<template>
    <div class="flowchartDockRail" :class="{ isOpen }">
      <button
        type="button"
        class="flowchartDockTrigger"
        :class="{ isActive: isOpen }"
        @click="$emit('toggle-inspector')"
      >
        <span class="flowchartDockGlyph" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="4.5" y="5" width="7" height="14" rx="2"></rect>
            <rect x="12.5" y="5" width="7" height="5" rx="1.5"></rect>
            <rect x="12.5" y="12" width="7" height="7" rx="1.8"></rect>
          </svg>
        </span>
        <span class="flowchartDockText">{{ labels.templatePanelTitle }}</span>
      </button>
    </div>

    <button
      v-if="isOpen"
      type="button"
      class="flowchartPanelBackdrop"
      @click="$emit('close-inspector')"
    ></button>

    <aside
      v-if="isOpen"
      class="flowchartFloatingPanel flowchartInspectorPanel"
    >
      <div class="flowchartPanelHeader">
        <div class="flowchartPanelTitle">{{ labels.templatePanelTitle }}</div>
        <button
          type="button"
          class="flowchartPanelClose"
          :aria-label="labels.close"
          @click="$emit('close-inspector')"
        >
          ×
        </button>
      </div>
      <div class="flowchartTemplateGrid">
        <button
          v-for="templateItem in templates"
          :key="templateItem.id"
          type="button"
          class="flowchartTemplateCard"
          @click="$emit('apply-template', templateItem.id)"
        >
          <span class="flowchartTemplatePreview" aria-hidden="true">
            <svg :viewBox="getTemplatePreviewViewBox(templateItem.preview)">
              <path
                v-for="edge in templateItem.preview.edges"
                :key="edge.id"
                class="flowchartTemplateEdge"
                :d="getTemplatePreviewPath(templateItem.preview, edge)"
              ></path>
              <template v-for="node in templateItem.preview.nodes" :key="node.id">
                <polygon
                  v-if="node.type === 'decision'"
                  class="flowchartTemplateNode"
                  :points="getDecisionPolygon(node)"
                ></polygon>
                <polygon
                  v-else-if="node.type === 'input'"
                  class="flowchartTemplateNode"
                  :points="getInputPolygon(node)"
                ></polygon>
                <rect
                  v-else
                  class="flowchartTemplateNode"
                  :x="node.x"
                  :y="node.y"
                  :width="node.width"
                  :height="node.height"
                  :rx="node.type === 'start' || node.type === 'end' ? 22 : 10"
                ></rect>
              </template>
            </svg>
          </span>
          <span class="flowchartTemplateName">{{ templateItem.label }}</span>
        </button>
      </div>
      <div v-if="selectedNode || selectedEdge" class="flowchartPanelSection">
        <div class="flowchartPanelSectionTitle">{{ labels.inspectorTitle }}</div>
      </div>
      <template v-if="selectedNode">
        <label class="fieldLabel">{{ labels.nodeType }}</label>
        <select
          class="fieldSelect"
          :value="selectedNode.type"
          @change="$emit('update-selected-node-type', $event.target.value)"
        >
          <option
            v-for="typeItem in flowchartNodeTypes"
            :key="typeItem.type"
            :value="typeItem.type"
          >
            {{ typeItem.label }}
          </option>
        </select>
        <label class="fieldLabel">{{ labels.nodeText }}</label>
        <textarea
          class="fieldInput"
          :value="selectedNode.text"
          @input="$emit('update-selected-node-text', $event.target.value)"
        ></textarea>
        <label class="fieldLabel">{{ labels.nodePreset }}</label>
        <div class="flowchartStylePresetGrid">
          <button
            v-for="preset in nodeStylePresets"
            :key="preset.id"
            type="button"
            class="flowchartStylePreset"
            @click="$emit('apply-selected-node-preset', preset)"
          >
            <span
              class="flowchartStylePresetSwatch"
              :style="{
                backgroundColor: preset.fill,
                borderColor: preset.stroke,
                color: preset.textColor
              }"
            >A</span>
          </button>
        </div>
        <label class="fieldLabel">{{ labels.nodeFill }}</label>
        <input
          class="fieldColorInput"
          type="color"
          :value="selectedNode.style?.fill || '#ffffff'"
          @input="$emit('update-selected-node-style', { fill: $event.target.value })"
        />
        <label class="fieldLabel">{{ labels.nodeStroke }}</label>
        <input
          class="fieldColorInput"
          type="color"
          :value="selectedNode.style?.stroke || '#111827'"
          @input="$emit('update-selected-node-style', { stroke: $event.target.value })"
        />
        <label class="fieldLabel">{{ labels.nodeTextColor }}</label>
        <input
          class="fieldColorInput"
          type="color"
          :value="selectedNode.style?.textColor || '#111827'"
          @input="$emit('update-selected-node-style', { textColor: $event.target.value })"
        />
        <button
          type="button"
          class="flowchartPanelBtn isBlock"
          @click="$emit('reset-selected-node-style')"
        >
          {{ labels.resetNodeStyle }}
        </button>
      </template>
      <template v-else-if="selectedEdge">
        <label class="fieldLabel">{{ labels.edgeLabel }}</label>
        <input
          class="fieldInput isSingleLine"
          :value="selectedEdge.label"
          @input="$emit('update-selected-edge-label', $event.target.value)"
        />
        <label class="fieldLabel">{{ labels.edgePreset }}</label>
        <div class="flowchartStylePresetGrid">
          <button
            v-for="preset in edgeStylePresets"
            :key="preset.id"
            type="button"
            class="flowchartStylePreset"
            @click="$emit('apply-selected-edge-preset', preset)"
          >
            <span
              class="flowchartEdgePresetSwatch"
              :style="{
                borderColor: preset.stroke,
                borderStyle: preset.dashed ? 'dashed' : 'solid'
              }"
            ></span>
          </button>
        </div>
        <label class="fieldLabel">{{ labels.edgeColor }}</label>
        <input
          class="fieldColorInput"
          type="color"
          :value="selectedEdge.style?.stroke || '#64748b'"
          @input="$emit('update-selected-edge-style', { stroke: $event.target.value })"
        />
        <label class="fieldLabel">{{ labels.edgeType }}</label>
        <select
          class="fieldSelect"
          :value="selectedEdge.style?.pathType || 'orthogonal'"
          @change="$emit('update-selected-edge-style', { pathType: $event.target.value })"
        >
          <option
            v-for="item in edgePathTypes"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </option>
        </select>
        <label class="fieldLabel flowchartToggleRow">
          <span>{{ labels.edgeDashed }}</span>
          <input
            type="checkbox"
            :checked="!!selectedEdge.style?.dashed"
            @change="$emit('update-selected-edge-style', { dashed: $event.target.checked })"
          />
        </label>
        <button
          type="button"
          class="flowchartPanelBtn isBlock"
          @click="$emit('reset-selected-edge-style')"
        >
          {{ labels.resetEdgeStyle }}
        </button>
      </template>
    </aside>
</template>

<script>
export default {
  name: 'FlowchartInspector',
  emits: [
    'toggle-inspector',
    'close-inspector',
    'apply-template',
    'update-selected-node-type',
    'update-selected-node-text',
    'update-selected-edge-label',
    'apply-selected-node-preset',
    'apply-selected-edge-preset',
    'update-selected-node-style',
    'update-selected-edge-style',
    'reset-selected-node-style',
    'reset-selected-edge-style'
  ],
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    labels: {
      type: Object,
      required: true
    },
    templates: {
      type: Array,
      default: () => []
    },
    selectedNode: {
      type: Object,
      default: null
    },
    selectedEdge: {
      type: Object,
      default: null
    },
    flowchartNodeTypes: {
      type: Array,
      required: true
    },
    nodeStylePresets: {
      type: Array,
      default: () => []
    },
    edgeStylePresets: {
      type: Array,
      default: () => []
    },
    edgePathTypes: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getNodeCenter(node) {
      return {
        x: Number(node.x || 0) + Number(node.width || 0) / 2,
        y: Number(node.y || 0) + Number(node.height || 0) / 2
      }
    },
    getTemplatePreviewViewBox(preview) {
      const nodes = Array.isArray(preview?.nodes) ? preview.nodes : []
      if (!nodes.length) {
        return '0 0 320 200'
      }
      const bounds = nodes.reduce(
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
      return `${bounds.minX - 36} ${bounds.minY - 36} ${bounds.maxX - bounds.minX + 72} ${
        bounds.maxY - bounds.minY + 72
      }`
    },
    getTemplatePreviewPath(preview, edge) {
      const source = preview.nodes.find(node => node.id === edge.source)
      const target = preview.nodes.find(node => node.id === edge.target)
      if (!source || !target) {
        return ''
      }
      const sourcePoint = this.getNodeCenter(source)
      const targetPoint = this.getNodeCenter(target)
      return `M ${sourcePoint.x} ${sourcePoint.y} L ${targetPoint.x} ${targetPoint.y}`
    },
    getDecisionPolygon(node) {
      const x = Number(node.x || 0)
      const y = Number(node.y || 0)
      const width = Number(node.width || 0)
      const height = Number(node.height || 0)
      return [
        `${x + width / 2},${y}`,
        `${x + width},${y + height / 2}`,
        `${x + width / 2},${y + height}`,
        `${x},${y + height / 2}`
      ].join(' ')
    },
    getInputPolygon(node) {
      const x = Number(node.x || 0)
      const y = Number(node.y || 0)
      const width = Number(node.width || 0)
      const height = Number(node.height || 0)
      const offset = Math.max(width * 0.12, 16)
      return [
        `${x + offset},${y}`,
        `${x + width},${y}`,
        `${x + width - offset},${y + height}`,
        `${x},${y + height}`
      ].join(' ')
    }
  }
}
</script>
