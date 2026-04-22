<template>
  <div class="flowchartEditor" :class="{ isDark }">
    <FlowchartToolbar
      :labels="flowchartToolbarText"
      :is-generating="isGenerating"
      @go-home="goHome"
      @save="saveCurrentFile()"
      @save-as="saveAsFile()"
      @import-mind-map-file="importMindMapFile"
      @open-export="openExportCenter"
      @convert-mind-map="convertCurrentMindMap"
      @generate-ai="generateWithAi"
    />

    <div class="flowchartStage">
      <FlowchartCanvas
        ref="flowchartCanvas"
        :is-panning="!!canvasPanState"
        :canvas-world-style="canvasWorldStyle()"
        :viewport-zoom-label="viewportZoomLabel"
        :has-nodes="!!flowchartData.nodes.length"
        :labels="flowchartUiText"
        @canvas-pointer-down="handleCanvasPointerDown"
        @canvas-double-click="addNodeAtCanvasPoint"
        @canvas-wheel="handleCanvasWheel"
        @zoom-out="zoomOut"
        @reset-viewport="resetViewport"
        @fit-canvas="fitCanvasToView"
        @zoom-in="zoomIn"
        @add-node="addNodeByType"
        @apply-template="applyTemplate"
        @generate-ai="generateWithAi"
      >
        <template #world>
          <FlowchartEdgeLayer
            :edges-with-layout="edgesWithLayout"
            :selected-edge-id="selectedEdgeId"
            :alignment-guides="alignmentGuides"
            :canvas-world-bounds="canvasWorldBounds"
            :connector-preview="connectorPreview"
            :edge-toolbar-state="edgeToolbarState"
            :labels="flowchartUiText"
            @select-edge="selectEdge"
            @edit-edge-label="editEdgeLabel"
            @insert-node-on-edge="insertNodeOnEdge"
            @remove-edge="removeEdge"
            @start-edge-reconnect="startEdgeReconnect"
          />

          <FlowchartNodeLayer
            :nodes="flowchartData.nodes"
            :selected-node-ids="selectedNodeIds"
            :get-node-style="getNodeStyle"
            :get-connector-handle-style="getConnectorHandleStyle"
            :show-connector-handles-for-node="showConnectorHandlesForNode"
            :show-resize-handles-for-node="showResizeHandlesForNode"
            :connector-target-node-id="connectorDragState?.targetNodeId || edgeReconnectState?.targetNodeId || ''"
            @start-node-drag="startNodeDrag"
            @select-node="selectNode"
            @edit-node-text="editNodeText"
            @start-connector-drag="startConnectorDrag"
            @start-node-resize="startNodeResize"
          />

          <div
            v-if="selectionState"
            class="flowchartSelectionBox"
            :style="getSelectionBoxStyle()"
          ></div>

          <div
            v-if="inlineTextEditorState"
            class="flowchartInlineEditor"
            :class="`is-${inlineTextEditorState.kind}`"
            :style="inlineTextEditorState.style"
          >
            <textarea
              v-if="inlineTextEditorState.kind === 'node'"
              ref="inlineTextEditorRef"
              v-model="inlineTextEditorState.value"
              class="flowchartInlineTextarea"
              @keydown.stop="handleInlineTextEditorKeydown"
              @blur="commitInlineTextEditor"
            ></textarea>
            <input
              v-else
              ref="inlineTextEditorRef"
              v-model="inlineTextEditorState.value"
              class="flowchartInlineInput"
              @keydown.stop="handleInlineTextEditorKeydown"
              @blur="commitInlineTextEditor"
            />
          </div>
        </template>
      </FlowchartCanvas>

      <FlowchartMinimap
        :nodes="flowchartData.nodes"
        :viewport="getViewport()"
        :canvas-viewport-size="canvasViewportSize"
        :labels="flowchartUiText"
        @jump-to-point="centerViewportAt"
      />

      <FlowchartSelectionToolbar
        :selected-node-count="selectedNodeIds.length"
        :labels="flowchartUiText"
        @align-left="alignSelectedNodesLeft"
        @distribute-horizontal="distributeSelectedNodesHorizontally"
        @distribute-vertical="distributeSelectedNodesVertically"
        @bring-front="bringSelectedNodesToFront"
        @send-back="sendSelectedNodesToBack"
        @duplicate="duplicateSelectedNodes"
        @delete="removeSelection"
      />

      <FlowchartQuickAddBar
        :node-types="flowchartNodeTypes"
        :labels="flowchartUiText"
        @add-node="addNodeByType"
      />

      <FlowchartInspector
        :is-open="isInspectorOpen"
        :labels="flowchartUiText"
        :templates="flowchartTemplates"
        :selected-node="selectedNode"
        :selected-edge="selectedEdge"
        :flowchart-node-types="flowchartNodeTypes"
        :node-style-presets="flowchartNodeStylePresets"
        :edge-style-presets="flowchartEdgeStylePresets"
        :edge-path-types="flowchartEdgePathTypes"
        @toggle-inspector="toggleInspector"
        @close-inspector="closeInspector"
        @apply-template="applyTemplate"
        @update-selected-node-type="updateSelectedNodeType"
        @update-selected-node-text="updateSelectedNodeText"
        @update-selected-edge-label="updateSelectedEdgeLabel"
        @apply-selected-node-preset="applySelectedNodePreset"
        @apply-selected-edge-preset="applySelectedEdgePreset"
        @update-selected-node-style="updateSelectedNodeStyle"
        @update-selected-edge-style="updateSelectedEdgeStyle"
        @reset-selected-node-style="resetSelectedNodeStyle"
        @reset-selected-edge-style="resetSelectedEdgeStyle"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import {
  getBootstrapState,
  ensureBootstrapDocumentState
} from '@/platform'
import { useAiStore } from '@/stores/ai'
import { useEditorStore } from '@/stores/editor'
import { useThemeStore } from '@/stores/theme'
import {
  FLOWCHART_EDGE_STYLE_PRESETS,
  FLOWCHART_NODE_STYLE_PRESETS,
  FLOWCHART_TEMPLATE_PRESETS,
  FLOWCHART_NODE_TYPES,
  createDefaultFlowchartData,
  getFlowchartEdgeLayout,
  getFlowchartNodeVisualStyle
} from '@/services/flowchartDocument'
import FlowchartCanvas from './FlowchartCanvas.vue'
import FlowchartEdgeLayer from './FlowchartEdgeLayer.vue'
import FlowchartInspector from './FlowchartInspector.vue'
import FlowchartMinimap from './FlowchartMinimap.vue'
import FlowchartNodeLayer from './FlowchartNodeLayer.vue'
import FlowchartQuickAddBar from './FlowchartQuickAddBar.vue'
import FlowchartSelectionToolbar from './FlowchartSelectionToolbar.vue'
import FlowchartToolbar from './FlowchartToolbar.vue'
import './FlowchartEditor.less'
import { flowchartHistoryMethods } from './flowchartEditorHistory'
import { flowchartViewportMethods } from './flowchartEditorViewport'
import { flowchartConnectorMethods } from './flowchartEditorConnector'
import { flowchartReconnectMethods } from './flowchartEditorReconnect'
import { flowchartNodeMethods } from './flowchartEditorNode'
import { flowchartSelectionMethods } from './flowchartEditorSelection'
import { flowchartInlineEditMethods } from './flowchartEditorInlineEdit'
import { flowchartResizeMethods } from './flowchartEditorResize'
import { flowchartStyleMethods } from './flowchartEditorStyle'
import { flowchartDocumentMethods } from './flowchartEditorDocument'
import { flowchartAiMethods } from './flowchartEditorAi'
import {
  FLOWCHART_ALIGNMENT_THRESHOLD,
  cloneJson
} from './flowchartEditorShared'

export default {
  name: 'FlowchartEditor',
  components: {
    FlowchartCanvas,
    FlowchartEdgeLayer,
    FlowchartInspector,
    FlowchartMinimap,
    FlowchartNodeLayer,
    FlowchartQuickAddBar,
    FlowchartSelectionToolbar,
    FlowchartToolbar
  },
  data() {
    return {
      flowchartData: createDefaultFlowchartData(),
      flowchartConfig: {
        snapToGrid: false,
        gridSize: 24
      },
      flowchartNodeTypes: FLOWCHART_NODE_TYPES,
      selectedNodeIds: [],
      selectedEdgeId: '',
      isInspectorOpen: false,
      dragState: null,
      dragFrameId: 0,
      pendingDragPoint: null,
      selectionState: null,
      connectorPreview: null,
      connectorDragState: null,
      edgeReconnectState: null,
      edgeToolbarState: null,
      inlineTextEditorState: null,
      flowchartClipboard: null,
      flowchartHistory: {
        undoStack: [],
        redoStack: [],
        baseline: null,
        restoring: false
      },
      alignmentGuides: [],
      canvasPanState: null,
      canvasPanFrameId: 0,
      pendingCanvasPanPoint: null,
      canvasViewportSize: {
        width: 0,
        height: 0
      },
      resizeState: null,
      persistTimer: 0,
      recoveryTimer: 0,
      aiBuffer: '',
      isGenerating: false
    }
  },
  computed: {
    ...mapState(useThemeStore, {
      isDark: 'isDark'
    }),
    ...mapState(useEditorStore, {
      currentDocument: 'currentDocument',
      currentFileName: 'currentFileName'
    }),
    ...mapState(useAiStore, {
      aiConfig: 'config'
    }),
    flowchartNodeLookup() {
      return new Map(this.flowchartData.nodes.map(node => [node.id, node]))
    },
    documentTitle() {
      return (
        this.currentFileName ||
        this.currentDocument?.name ||
        `${this.flowchartData.title || this.$t('flowchart.fileNameFallback')}.smm`
      )
    },
    selectedNode() {
      if (!this.selectedNodeIds.length) return null
      return this.flowchartNodeLookup.get(this.selectedNodeIds[0]) || null
    },
    selectedEdge() {
      if (!this.selectedEdgeId) return null
      return this.flowchartData.edges.find(edge => edge.id === this.selectedEdgeId) || null
    },
    edgesWithLayout() {
      return this.flowchartData.edges
        .map(edge => {
          const sourceNode = this.flowchartNodeLookup.get(edge.source)
          const targetNode = this.flowchartNodeLookup.get(edge.target)
          if (!sourceNode || !targetNode) return null
          return {
            ...edge,
            ...getFlowchartEdgeLayout(edge, sourceNode, targetNode)
          }
        })
        .filter(Boolean)
    },
    flowchartNodeStylePresets() {
      return FLOWCHART_NODE_STYLE_PRESETS
    },
    flowchartEdgeStylePresets() {
      return FLOWCHART_EDGE_STYLE_PRESETS
    },
    canvasWorldBounds() {
      const nodeBounds = this.flowchartData.nodes.reduce(
        (bounds, node) => {
          return {
            minX: Math.min(bounds.minX, Number(node.x || 0)),
            minY: Math.min(bounds.minY, Number(node.y || 0)),
            maxX: Math.max(
              bounds.maxX,
              Number(node.x || 0) + Number(node.width || 0)
            ),
            maxY: Math.max(
              bounds.maxY,
              Number(node.y || 0) + Number(node.height || 0)
            )
          }
        },
        {
          minX: 0,
          minY: 0,
          maxX: 1280,
          maxY: 720
        }
      )
      return {
        minX: nodeBounds.minX,
        minY: nodeBounds.minY,
        width: Math.max(1600, nodeBounds.maxX + 480),
        height: Math.max(1000, nodeBounds.maxY + 420)
      }
    },
    viewportZoomLabel() {
      const viewport = this.getViewport()
      return `${Math.round(viewport.zoom * 100)}%`
    },
    flowchartEdgePathTypes() {
      return [
        {
          value: 'orthogonal',
          label: this.$t('flowchart.edgeTypeOrthogonal')
        },
        {
          value: 'straight',
          label: this.$t('flowchart.edgeTypeStraight')
        }
      ]
    },
    flowchartUiText() {
      return {
        save: this.$t('flowchart.save'),
        saveAs: this.$t('flowchart.saveAs'),
        returnHome: this.$t('flowchart.returnHome'),
        template: this.$t('flowchart.template'),
        templatePanelTitle: this.$t('flowchart.templatePanelTitle'),
        templateBlank: this.$t('flowchart.templateBlank'),
        convertMindMap: this.$t('flowchart.convertMindMap'),
        importMindMapFile: this.$t('flowchart.importMindMapFile'),
        aiGenerate: this.$t('flowchart.aiGenerate'),
        exportCenter: this.$t('toolbar.exportCenter'),
        addStart: this.$t('flowchart.addStart'),
        addProcess: this.$t('flowchart.addProcess'),
        addDecision: this.$t('flowchart.addDecision'),
        addInput: this.$t('flowchart.addInput'),
        addEnd: this.$t('flowchart.addEnd'),
        duplicate: this.$t('flowchart.duplicate'),
        alignLeft: this.$t('flowchart.alignLeft'),
        distributeHorizontal: this.$t('flowchart.distributeHorizontal'),
        distributeVertical: this.$t('flowchart.distributeVertical'),
        arrangeFront: this.$t('flowchart.arrangeFront'),
        arrangeBack: this.$t('flowchart.arrangeBack'),
        emptyAddStart: this.$t('flowchart.emptyAddStart'),
        emptyUseTemplate: this.$t('flowchart.emptyUseTemplate'),
        inspectorTitle: this.$t('flowchart.inspectorTitle'),
        nodeType: this.$t('flowchart.nodeType'),
        nodeText: this.$t('flowchart.nodeText'),
        nodePreset: this.$t('flowchart.nodePreset'),
        nodeFill: this.$t('flowchart.nodeFill'),
        nodeStroke: this.$t('flowchart.nodeStroke'),
        nodeTextColor: this.$t('flowchart.nodeTextColor'),
        resetNodeStyle: this.$t('flowchart.resetNodeStyle'),
        edgeLabel: this.$t('flowchart.edgeLabel'),
        edgePreset: this.$t('flowchart.edgePreset'),
        edgeColor: this.$t('flowchart.edgeColor'),
        edgeType: this.$t('flowchart.edgeType'),
        edgeDashed: this.$t('flowchart.edgeDashed'),
        edgeTypeStraight: this.$t('flowchart.edgeTypeStraight'),
        edgeTypeOrthogonal: this.$t('flowchart.edgeTypeOrthogonal'),
        resetEdgeStyle: this.$t('flowchart.resetEdgeStyle'),
        minimap: this.$t('flowchart.minimap'),
        delete: this.$t('flowchart.delete'),
        selectionEmpty: this.$t('flowchart.selectionEmpty'),
        fitView: this.$t('flowchart.fitView'),
        templateApproval: this.$t('flowchart.templateApproval'),
        templateRelease: this.$t('flowchart.templateRelease'),
        templateTicket: this.$t('flowchart.templateTicket'),
        templateOnboarding: this.$t('flowchart.templateOnboarding'),
        templateTroubleshooting: this.$t('flowchart.templateTroubleshooting'),
        templateCustomerJourney: this.$t('flowchart.templateCustomerJourney'),
        templateIncident: this.$t('flowchart.templateIncident'),
        templateDataPipeline: this.$t('flowchart.templateDataPipeline'),
        templateProjectPlan: this.$t('flowchart.templateProjectPlan'),
        close: this.$t('ai.close')
      }
    },
    flowchartToolbarText() {
      return {
        save: this.$t('flowchart.save'),
        saveAs: this.$t('flowchart.saveAsShort'),
        returnHome: this.$t('flowchart.returnHomeShort'),
        importMindMapFile: this.$t('flowchart.importMindMapFileShort'),
        aiGenerate: this.$t('flowchart.aiGenerateShort'),
        exportCenter: this.$t('toolbar.exportCenter'),
        convertMindMap: this.$t('flowchart.convertMindMapShort')
      }
    },
    flowchartTemplates() {
      return FLOWCHART_TEMPLATE_PRESETS.map(item => ({
        id: item.id,
        label: this.$t(item.labelKey),
        preview: createDefaultFlowchartData(this.$t('flowchart.title'), item.id)
      }))
    },
    hasPotentialUnsavedFlowchart() {
      return (
        !!this.currentDocument?.dirty ||
        !!this.persistTimer ||
        !!this.recoveryTimer ||
        !!this.isGenerating
      )
    }
  },
  async mounted() {
    await ensureBootstrapDocumentState()
    this.loadFlowchartState()
    window.addEventListener('keydown', this.handleGlobalKeydown)
    window.addEventListener('beforeunload', this.onBeforeUnload)
    this.$nextTick(() => {
      this.syncCanvasViewportSize()
      if (this.isDefaultViewport(this.flowchartData.viewport)) {
        this.fitCanvasToView({
          persist: false
        })
      }
    })
    window.addEventListener('resize', this.syncCanvasViewportSize)
  },
  beforeUnmount() {
    this.removeDragListeners()
    this.removeNodeResizeListeners()
    this.removeConnectorDragListeners()
    this.removeEdgeReconnectListeners()
    this.removeCanvasPanListeners()
    this.removeAreaSelectionListeners()
    window.removeEventListener('keydown', this.handleGlobalKeydown)
    window.removeEventListener('beforeunload', this.onBeforeUnload)
    window.removeEventListener('resize', this.syncCanvasViewportSize)
    if (this.persistTimer) {
      clearTimeout(this.persistTimer)
      this.persistTimer = 0
    }
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
      this.recoveryTimer = 0
    }
    if (this.dragFrameId) {
      cancelAnimationFrame(this.dragFrameId)
      this.dragFrameId = 0
    }
    this.pendingDragPoint = null
    if (this.canvasPanFrameId) {
      cancelAnimationFrame(this.canvasPanFrameId)
      this.canvasPanFrameId = 0
    }
    this.pendingCanvasPanPoint = null
  },
  methods: {
    loadFlowchartState() {
      const bootstrapState = getBootstrapState()
      this.flowchartData = cloneJson(
        bootstrapState.flowchartData || createDefaultFlowchartData()
      )
      const nextFlowchartConfig = {
        snapToGrid: false,
        gridSize: 24,
        ...cloneJson(bootstrapState.flowchartConfig || {})
      }
      nextFlowchartConfig.snapToGrid = false
      this.flowchartConfig = nextFlowchartConfig
      this.ensureFlowchartViewport()
      this.initializeFlowchartHistory()
    },
    ...flowchartHistoryMethods,

    getNodeStyle(node) {
      const visualStyle = getFlowchartNodeVisualStyle(node, {
        isDark: this.isDark
      })
      return {
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        height: `${node.height}px`,
        backgroundColor: visualStyle.fill,
        borderColor: visualStyle.stroke,
        color: visualStyle.textColor
      }
    },
    ...flowchartConnectorMethods,
    ...flowchartReconnectMethods,
    ...flowchartViewportMethods,
    ...flowchartSelectionMethods,
    ...flowchartInlineEditMethods,
    ...flowchartNodeMethods,
    ...flowchartResizeMethods,
    ...flowchartStyleMethods,
    ...flowchartDocumentMethods,
    ...flowchartAiMethods,

    snapPositionToGrid(position) {
      return position
    },

    clearAlignmentGuides() {
      this.alignmentGuides = []
    },

    createNodeAlignmentMetrics(node, x = Number(node?.x || 0), y = Number(node?.y || 0)) {
      const width = Number(node?.width || 0)
      const height = Number(node?.height || 0)
      return {
        left: x,
        centerX: x + width / 2,
        right: x + width,
        top: y,
        centerY: y + height / 2,
        bottom: y + height
      }
    },

    computeAlignmentSnap({ node, x, y, selectedIds = [] } = {}) {
      if (!node) {
        return {
          offsetX: 0,
          offsetY: 0,
          guides: []
        }
      }
      const selectedSet = new Set(selectedIds)
      const movingMetrics = this.createNodeAlignmentMetrics(node, x, y)
      let bestX = null
      let bestY = null
      this.flowchartData.nodes.forEach(candidate => {
        if (selectedSet.has(candidate.id)) return
        const candidateMetrics = this.createNodeAlignmentMetrics(candidate)
        ;[
          ['left', 'left'],
          ['centerX', 'centerX'],
          ['right', 'right']
        ].forEach(([movingKey, candidateKey]) => {
          const diff = candidateMetrics[candidateKey] - movingMetrics[movingKey]
          if (
            Math.abs(diff) <= FLOWCHART_ALIGNMENT_THRESHOLD &&
            (!bestX || Math.abs(diff) < Math.abs(bestX.diff))
          ) {
            bestX = {
              diff,
              guideX: candidateMetrics[candidateKey]
            }
          }
        })
        ;[
          ['top', 'top'],
          ['centerY', 'centerY'],
          ['bottom', 'bottom']
        ].forEach(([movingKey, candidateKey]) => {
          const diff = candidateMetrics[candidateKey] - movingMetrics[movingKey]
          if (
            Math.abs(diff) <= FLOWCHART_ALIGNMENT_THRESHOLD &&
            (!bestY || Math.abs(diff) < Math.abs(bestY.diff))
          ) {
            bestY = {
              diff,
              guideY: candidateMetrics[candidateKey]
            }
          }
        })
      })
      const bounds = this.canvasWorldBounds
      const guides = []
      if (bestX) {
        guides.push({
          id: `vertical-${bestX.guideX}`,
          x1: bestX.guideX,
          y1: 0,
          x2: bestX.guideX,
          y2: bounds.height
        })
      }
      if (bestY) {
        guides.push({
          id: `horizontal-${bestY.guideY}`,
          x1: 0,
          y1: bestY.guideY,
          x2: bounds.width,
          y2: bestY.guideY
        })
      }
      return {
        offsetX: bestX?.diff || 0,
        offsetY: bestY?.diff || 0,
        guides
      }
    },

  }
}
</script>
