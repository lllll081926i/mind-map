<template>
    <div class="flowchartDockRail" :class="{ isOpen }">
      <button
        type="button"
        class="flowchartDockTrigger"
        :class="{ isActive: isOpen && panelSection === 'templates' }"
        @click="$emit('toggle-section', 'templates')"
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
      <button
        type="button"
        class="flowchartDockTrigger"
        :class="{ isActive: isOpen && panelSection === 'settings' }"
        @click="$emit('toggle-section', 'settings')"
      >
        <span class="flowchartDockGlyph" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 3.5v3"></path>
            <path d="M12 17.5v3"></path>
            <path d="M4.5 12h3"></path>
            <path d="M16.5 12h3"></path>
            <path d="M6.7 6.7l2.2 2.2"></path>
            <path d="M15.1 15.1l2.2 2.2"></path>
            <path d="M17.3 6.7l-2.2 2.2"></path>
            <path d="M8.9 15.1l-2.2 2.2"></path>
            <circle cx="12" cy="12" r="3.2"></circle>
          </svg>
        </span>
        <span class="flowchartDockText">{{ labels.settingsPanelTitle }}</span>
      </button>
      <button
        type="button"
        class="flowchartDockTrigger"
        :class="{ isActive: isOpen && panelSection === 'inspector' }"
        @click="$emit('toggle-section', 'inspector')"
      >
        <span class="flowchartDockGlyph" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="5" y="4.5" width="14" height="15" rx="2"></rect>
            <path d="M9 9h6"></path>
            <path d="M9 13h6"></path>
          </svg>
        </span>
        <span class="flowchartDockText">{{ labels.inspectorTitle }}</span>
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
        <div class="flowchartPanelTitle">{{ getPanelTitle() }}</div>
        <button
          type="button"
          class="flowchartPanelClose"
          :aria-label="labels.close"
          @click="$emit('close-inspector')"
        >
          ×
        </button>
      </div>
      <template v-if="panelSection === 'settings'">
        <div class="flowchartPanelSection isFirst">
          <div class="flowchartPanelSectionTitle">{{ labels.theme }}</div>
          <div class="flowchartThemeGrid">
            <button
              v-for="themeItem in flowchartThemePresets"
              :key="themeItem.id"
              type="button"
              class="flowchartThemeCard"
              :class="{ isActive: flowchartThemeId === themeItem.id }"
              @click="$emit('update-flowchart-theme', themeItem.id)"
            >
              <span
                class="flowchartThemeSwatch"
                :style="{
                  background: `linear-gradient(135deg, ${themeItem.canvasBg} 0%, ${themeItem.nodeFill} 100%)`,
                  borderColor: themeItem.nodeStroke
                }"
              >
                <span
                  class="flowchartThemeSwatchDot"
                  :style="{ backgroundColor: themeItem.accent }"
                ></span>
              </span>
              <span class="flowchartThemeName">{{ themeItem.label }}</span>
            </button>
          </div>
        </div>
        <div class="flowchartPanelSection">
          <div class="flowchartPanelSectionTitle">{{ labels.settingsPanelTitle }}</div>
          <label class="fieldLabel flowchartToggleRow">
            <span>{{ labels.strictAlignment }}</span>
            <input
              type="checkbox"
              :checked="strictAlignment"
              @change="$emit('update-flowchart-config', { strictAlignment: $event.target.checked })"
            />
          </label>
        </div>
      </template>

      <template v-else-if="panelSection === 'templates'">
        <div class="flowchartTemplateGrid">
          <button
            v-for="templateItem in templates"
            :key="templateItem.id"
            type="button"
            class="flowchartTemplateCard"
            @click="$emit('apply-template', templateItem.id)"
          >
            <span
              class="flowchartTemplatePreview"
              aria-hidden="true"
              :style="getTemplatePreviewStyle(templateItem)"
            >
              <svg :viewBox="getTemplatePreviewViewBox(templateItem.preview)">
                <g
                  v-for="lane in templateItem.preview.lanes"
                  :key="lane.id"
                  class="flowchartTemplateLane"
                >
                  <rect
                    :x="lane.x"
                    :y="lane.y"
                    :width="lane.width"
                    :height="lane.height"
                    rx="20"
                    :style="getTemplateLaneStyle(templateItem, lane)"
                  ></rect>
                </g>
                <path
                  v-for="edge in templateItem.preview.edges"
                  :key="edge.id"
                  class="flowchartTemplateEdge"
                  :d="getTemplatePreviewPath(templateItem, edge)"
                  :style="getTemplateEdgeStyle(templateItem, edge)"
                ></path>
                <template v-for="node in templateItem.preview.nodes" :key="node.id">
                  <polygon
                    v-if="node.type === 'decision'"
                    class="flowchartTemplateNode"
                    :points="getDecisionPolygon(node)"
                    :style="getTemplateNodeStyle(templateItem, node)"
                  ></polygon>
                  <polygon
                    v-else-if="node.type === 'input'"
                    class="flowchartTemplateNode"
                    :points="getInputPolygon(node)"
                    :style="getTemplateNodeStyle(templateItem, node)"
                  ></polygon>
                  <rect
                    v-else
                    class="flowchartTemplateNode"
                    :x="node.x"
                    :y="node.y"
                    :width="node.width"
                    :height="node.height"
                    :rx="node.type === 'start' || node.type === 'end' ? 22 : 10"
                    :style="getTemplateNodeStyle(templateItem, node)"
                  ></rect>
                </template>
              </svg>
            </span>
            <span class="flowchartTemplateName">{{ templateItem.label }}</span>
          </button>
        </div>
      </template>

      <template v-else-if="selectedNode">
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
      <div v-else class="emptyInspector">
        {{ labels.inspectorEmpty }}
      </div>
    </aside>
</template>

<script>
import {
  getFlowchartEdgeLayout
} from '@/services/flowchartDocument'

export default {
  name: 'FlowchartInspector',
  emits: [
    'toggle-inspector',
    'toggle-section',
    'close-inspector',
    'apply-template',
    'update-selected-node-type',
    'update-selected-node-text',
    'update-selected-edge-label',
    'apply-selected-node-preset',
    'apply-selected-edge-preset',
    'update-flowchart-theme',
    'update-flowchart-config',
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
    panelSection: {
      type: String,
      default: 'templates'
    },
    labels: {
      type: Object,
      required: true
    },
    templates: {
      type: Array,
      default: () => []
    },
    flowchartThemePresets: {
      type: Array,
      default: () => []
    },
    flowchartThemeId: {
      type: String,
      default: 'blueprint'
    },
    strictAlignment: {
      type: Boolean,
      default: false
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
    getPanelTitle() {
      if (this.panelSection === 'settings') {
        return this.labels.settingsPanelTitle
      }
      if (this.panelSection === 'inspector') {
        return this.labels.inspectorTitle
      }
      return this.labels.templatePanelTitle
    },
    getThemeById(themeId) {
      return (
        this.flowchartThemePresets.find(item => item.id === themeId) ||
        this.flowchartThemePresets[0] ||
        null
      )
    },
    getNodeCenter(node) {
      return {
        x: Number(node.x || 0) + Number(node.width || 0) / 2,
        y: Number(node.y || 0) + Number(node.height || 0) / 2
      }
    },
    getTemplatePreviewViewBox(preview) {
      const nodes = Array.isArray(preview?.nodes) ? preview.nodes : []
      const lanes = Array.isArray(preview?.lanes) ? preview.lanes : []
      const items = [...lanes, ...nodes]
      if (!items.length) {
        return '0 0 320 200'
      }
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
      return `${bounds.minX - 36} ${bounds.minY - 36} ${bounds.maxX - bounds.minX + 72} ${
        bounds.maxY - bounds.minY + 72
      }`
    },
    getTemplatePreviewPath(templateItem, edge) {
      const preview = templateItem?.preview
      const source = preview.nodes.find(node => node.id === edge.source)
      const target = preview.nodes.find(node => node.id === edge.target)
      if (!source || !target) {
        return ''
      }
      return getFlowchartEdgeLayout(edge, source, target).path
    },
    getTemplatePreviewStyle(_templateItem) {
      return {
        backgroundColor: '#ffffff'
      }
    },
    getTemplateNodeStyle(_templateItem, _node) {
      return {
        fill: '#ffffff',
        stroke: '#111111'
      }
    },
    getTemplateEdgeStyle(_templateItem, edge) {
      return {
        stroke: '#111111',
        strokeDasharray: edge?.style?.dashed ? '18 12' : null
      }
    },
    getTemplateLaneStyle(_templateItem, _lane) {
      return {
        fill: '#111111',
        fillOpacity: 0.04,
        stroke: '#111111',
        strokeOpacity: 0.18,
        strokeDasharray: '24 16'
      }
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
