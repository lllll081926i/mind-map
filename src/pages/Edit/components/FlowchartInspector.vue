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
          <label class="fieldLabel">{{ labels.backgroundStyle }}</label>
          <div class="flowchartBackgroundOptionGrid">
            <button
              v-for="item in backgroundStyleOptions"
              :key="item.value"
              type="button"
              class="flowchartBackgroundOption"
              :class="{ isActive: backgroundStyle === item.value }"
              @click="$emit('update-flowchart-config', { backgroundStyle: item.value })"
            >
              <span
                class="flowchartBackgroundOptionPreview"
                :class="`is-${item.value}`"
              ></span>
              <span class="flowchartBackgroundOptionText">{{ item.label }}</span>
            </button>
          </div>
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
        <div
          v-for="templateGroup in templates"
          :key="templateGroup.id"
          class="flowchartTemplateGroup"
        >
          <div class="flowchartPanelSectionTitle flowchartTemplateGroupTitle">
            {{ templateGroup.label }}
          </div>
          <div class="flowchartTemplateGrid">
            <button
              v-for="templateItem in templateGroup.items"
              :key="templateItem.id"
              type="button"
              class="flowchartTemplateCard"
              @click="$emit('request-template-apply', templateItem.id)"
            >
              <span
                class="flowchartTemplatePreview"
                aria-hidden="true"
                :style="getTemplatePreviewStyle(templateItem)"
              >
                <svg :viewBox="getTemplatePreviewViewBox(templateItem.preview)">
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
        <div class="flowchartColorSwatchGrid">
          <button
            v-for="color in nodeFillPalette"
            :key="`node-fill-${color}`"
            type="button"
            class="flowchartColorSwatch"
            :class="{ isActive: getSelectedNodeColor('fill', '#ffffff') === color }"
            :style="{ backgroundColor: color }"
            @click="$emit('update-selected-node-style', { fill: color })"
          ></button>
          <label class="flowchartColorPickerButton">
            <input
              type="color"
              :value="getSelectedNodeColor('fill', '#ffffff')"
              @input="$emit('update-selected-node-style', { fill: $event.target.value })"
            />
          </label>
        </div>
        <label class="fieldLabel">{{ labels.nodeStroke }}</label>
        <div class="flowchartColorSwatchGrid">
          <button
            v-for="color in strokeColorPalette"
            :key="`node-stroke-${color}`"
            type="button"
            class="flowchartColorSwatch"
            :class="{ isActive: getSelectedNodeColor('stroke', '#111827') === color }"
            :style="{ backgroundColor: color }"
            @click="$emit('update-selected-node-style', { stroke: color })"
          ></button>
          <label class="flowchartColorPickerButton">
            <input
              type="color"
              :value="getSelectedNodeColor('stroke', '#111827')"
              @input="$emit('update-selected-node-style', { stroke: $event.target.value })"
            />
          </label>
        </div>
        <label class="fieldLabel">{{ labels.nodeTextColor }}</label>
        <div class="flowchartColorSwatchGrid">
          <button
            v-for="color in textColorPalette"
            :key="`node-text-${color}`"
            type="button"
            class="flowchartColorSwatch"
            :class="{ isActive: getSelectedNodeColor('textColor', '#111827') === color }"
            :style="{ backgroundColor: color }"
            @click="$emit('update-selected-node-style', { textColor: color })"
          ></button>
          <label class="flowchartColorPickerButton">
            <input
              type="color"
              :value="getSelectedNodeColor('textColor', '#111827')"
              @input="$emit('update-selected-node-style', { textColor: $event.target.value })"
            />
          </label>
        </div>
      </template>
      <template v-else-if="selectedEdge">
        <label class="fieldLabel">{{ labels.edgeLabel }}</label>
        <input
          class="fieldInput isSingleLine"
          :value="selectedEdge.label"
          @input="$emit('update-selected-edge-label', $event.target.value)"
        />
        <label class="fieldLabel">{{ labels.edgeLabelPosition }}</label>
        <div class="fieldMetaRow">
          <input
            class="fieldRange"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="Math.round(selectedEdgeLabelPosition.ratio * 100)"
            @input="$emit('update-selected-edge-label-position', { ratio: Number($event.target.value) / 100 })"
          />
          <span class="fieldHint">{{ formatLabelRatioLabel(selectedEdgeLabelPosition.ratio) }}</span>
        </div>
        <label class="fieldLabel">{{ labels.edgeLabelOffsetX }}</label>
        <input
          class="fieldInput isSingleLine"
          type="number"
          :value="selectedEdgeLabelPosition.offsetX"
          @input="$emit('update-selected-edge-label-position', { offsetX: Number($event.target.value) || 0 })"
        />
        <label class="fieldLabel">{{ labels.edgeLabelOffsetY }}</label>
        <input
          class="fieldInput isSingleLine"
          type="number"
          :value="selectedEdgeLabelPosition.offsetY"
          @input="$emit('update-selected-edge-label-position', { offsetY: Number($event.target.value) || 0 })"
        />
        <label class="fieldLabel">{{ labels.edgeColor }}</label>
        <div class="flowchartColorSwatchGrid">
          <button
            v-for="color in strokeColorPalette"
            :key="`edge-stroke-${color}`"
            type="button"
            class="flowchartColorSwatch"
            :class="{ isActive: selectedEdgeVisualStyle.stroke === color }"
            :style="{ backgroundColor: color }"
            @click="$emit('update-selected-edge-style', { stroke: color })"
          ></button>
          <label class="flowchartColorPickerButton">
            <input
              type="color"
              :value="selectedEdgeVisualStyle.stroke"
              @input="$emit('update-selected-edge-style', { stroke: $event.target.value })"
            />
          </label>
        </div>
        <label class="fieldLabel">{{ labels.edgeType }}</label>
        <select
          class="fieldSelect"
          :value="selectedEdgeVisualStyle.pathType"
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
        <label class="fieldLabel">{{ labels.edgeLineStyle }}</label>
        <div class="flowchartLineStyleGrid">
          <button
            v-for="item in edgeDashPatternOptions"
            :key="item.value"
            type="button"
            class="flowchartLineStyleOption"
            :class="{ isActive: selectedEdgeVisualStyle.dashPattern === item.value }"
            @click="$emit('update-selected-edge-style', { dashPattern: item.value })"
          >
            <span
              class="flowchartLineStyleSample"
            >
              <svg viewBox="0 0 92 8" aria-hidden="true">
                <path
                  d="M 2 4 H 90"
                  :stroke="selectedEdgeVisualStyle.stroke"
                  stroke-width="3"
                  stroke-linecap="round"
                  :stroke-dasharray="item.dashArray || null"
                ></path>
              </svg>
            </span>
            <span class="flowchartLineStyleText">{{ item.label }}</span>
          </button>
        </div>
      </template>
      <div v-else class="flowchartPanelEmpty">
        {{ labels.selectionEmpty }}
      </div>
    </aside>
</template>

<script>
import {
  getFlowchartEdgeDashArray,
  getFlowchartEdgeLayout,
  getFlowchartEdgeVisualStyle,
  normalizeFlowchartEdgeLabelPosition
} from '@/services/flowchartDocument'

const NODE_FILL_PALETTE = [
  '#ffffff',
  '#f8fafc',
  '#eff6ff',
  '#ecfdf5',
  '#fffbeb',
  '#fff1f2',
  '#f5f3ff',
  '#ecfeff'
]
const STROKE_COLOR_PALETTE = [
  '#111827',
  '#64748b',
  '#2563eb',
  '#059669',
  '#d97706',
  '#e11d48',
  '#7c3aed',
  '#0891b2'
]
const TEXT_COLOR_PALETTE = [
  '#111827',
  '#334155',
  '#1e3a8a',
  '#065f46',
  '#92400e',
  '#9f1239',
  '#4c1d95',
  '#164e63'
]

export default {
  name: 'FlowchartInspector',
  emits: [
    'toggle-inspector',
    'toggle-section',
    'close-inspector',
    'request-template-apply',
    'update-selected-node-type',
    'update-selected-node-text',
    'update-selected-edge-label',
    'update-selected-edge-label-position',
    'apply-selected-node-preset',
    'update-flowchart-theme',
    'update-flowchart-config',
    'update-selected-node-style',
    'update-selected-edge-style',
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
    resolvedTheme: {
      type: Object,
      default: () => ({})
    },
    strictAlignment: {
      type: Boolean,
      default: false
    },
    backgroundStyle: {
      type: String,
      default: 'grid'
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
    edgePathTypes: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    selectedEdgeVisualStyle() {
      if (!this.selectedEdge) {
        return {
          pathType: 'orthogonal',
          stroke: this.resolvedTheme.edgeStroke || '#64748b',
          labelColor: this.resolvedTheme.edgeLabelColor || '#64748b',
          dashPattern: 'solid',
          arrowCount: 1
        }
      }
      return getFlowchartEdgeVisualStyle(this.selectedEdge, {
        theme: this.resolvedTheme,
        strictAlignment: this.strictAlignment
      })
    },
    backgroundStyleOptions() {
      return [
        { value: 'none', label: this.labels.backgroundStyleNone },
        { value: 'dots', label: this.labels.backgroundStyleDots },
        { value: 'grid', label: this.labels.backgroundStyleGrid }
      ]
    },
    nodeFillPalette() {
      return NODE_FILL_PALETTE
    },
    strokeColorPalette() {
      return STROKE_COLOR_PALETTE
    },
    textColorPalette() {
      return TEXT_COLOR_PALETTE
    },
    edgeDashPatternOptions() {
      return [
        {
          value: 'solid',
          label: this.labels.edgeLineStyleSolid,
          dashArray: getFlowchartEdgeDashArray('solid')
        },
        {
          value: 'dash',
          label: this.labels.edgeLineStyleDash,
          dashArray: getFlowchartEdgeDashArray('dash')
        },
        {
          value: 'longDash',
          label: this.labels.edgeLineStyleLongDash,
          dashArray: getFlowchartEdgeDashArray('longDash')
        },
        {
          value: 'dot',
          label: this.labels.edgeLineStyleDot,
          dashArray: getFlowchartEdgeDashArray('dot')
        },
        {
          value: 'dashDot',
          label: this.labels.edgeLineStyleDashDot,
          dashArray: getFlowchartEdgeDashArray('dashDot')
        }
      ]
    },
    selectedEdgeLabelPosition() {
      return (
        normalizeFlowchartEdgeLabelPosition(this.selectedEdge?.labelPosition) || {
          ratio: 0.5,
          offsetX: 0,
          offsetY: 0
        }
      )
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
    getSelectedNodeColor(styleKey, fallback) {
      const themeFallbackMap = {
        fill: this.resolvedTheme.nodeFill || fallback,
        stroke: this.resolvedTheme.nodeStroke || fallback,
        textColor: this.resolvedTheme.nodeTextColor || fallback
      }
      return String(
        this.selectedNode?.style?.[styleKey] ||
          themeFallbackMap[styleKey] ||
          fallback
      ).trim()
    },
    getTemplatePreviewViewBox(preview) {
      const nodes = Array.isArray(preview?.nodes) ? preview.nodes : []
      const items = [...nodes]
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
      return getFlowchartEdgeLayout(edge, source, target, {
        nodes: preview.nodes
      }).path
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
        strokeDasharray: getFlowchartEdgeDashArray(
          edge?.style?.dashPattern,
          edge?.style?.dashed
        ) || null
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
    },
    formatLabelRatioLabel(value) {
      return `${Math.round(Number(value || 0.5) * 100)}%`
    }
  }
}
</script>
