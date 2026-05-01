<template>
  <div class="flowchartEditor" :class="{ isDark }" :style="flowchartThemeStyleVars">
    <FlowchartToolbar
      :labels="flowchartToolbarText"
      :is-dark="isDark"
      :is-generating="isGenerating"
      @go-home="goHome"
      @save="saveCurrentFile()"
      @save-as="saveAsFile()"
      @import-mind-map-file="importMindMapFile"
      @open-export="openExportCenter"
      @convert-mind-map="convertCurrentMindMap"
      @toggle-dark="toggleAppearance"
      @generate-ai="generateWithAi"
      @tidy-layout="tidyFlowchartLayout"
    />

    <div class="flowchartStage">
      <FlowchartCanvas
        ref="flowchartCanvas"
        :is-panning="!!canvasPanState"
        :background-style="flowchartConfig.backgroundStyle"
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
        @apply-template="requestApplyTemplate"
        @generate-ai="generateWithAi"
      >
        <template #world>
          <FlowchartEdgeLayer
            :edges-with-layout="edgesWithLayout"
            :selected-edge-id="selectedEdgeId"
            :alignment-guides="alignmentGuides"
            :canvas-world-bounds="canvasWorldBounds"
            :connector-preview="connectorPreview"
            :labels="flowchartUiText"
            @select-edge="selectEdge"
            @edit-edge-label="editEdgeLabel"
            @start-edge-label-drag="startEdgeLabelDrag"
            @start-edge-reconnect="startEdgeReconnect"
            @start-edge-bend-drag="startEdgeBendDrag"
            @start-edge-segment-drag="startEdgeSegmentDrag"
          />

          <FlowchartNodeLayer
            :nodes="flowchartData.nodes"
            :selected-node-ids="selectedNodeIds"
            :get-node-style="getNodeStyle"
            :get-connector-handle-style="getConnectorHandleStyle"
            :get-connector-directions-for-node="getConnectorDirectionsForNode"
            :show-connector-handles-for-node="showConnectorHandlesForNode"
            :show-resize-handles-for-node="showResizeHandlesForNode"
            :connector-target-node-id="connectorDragState?.targetNodeId || edgeReconnectState?.targetNodeId || ''"
            :connector-target-direction="connectorTargetDirection"
            :new-node-ids="newNodeIds"
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
        :edges="minimapEdges"
        :lanes="flowchartLanes"
        :viewport="getViewport()"
        :canvas-viewport-size="canvasViewportSize"
        :labels="flowchartUiText"
        @jump-to-point="centerViewportAt"
      />

      <FlowchartQuickAddBar
        :node-types="flowchartNodeTypes"
        :labels="flowchartUiText"
        @add-node="addNodeByType"
      />

      <FlowchartInspector
        :is-open="isInspectorOpen"
        :panel-section="inspectorPanelSection"
        :labels="flowchartUiText"
        :templates="flowchartTemplates"
        :flowchart-theme-presets="flowchartThemePresets"
        :flowchart-theme-id="flowchartConfig.themeId"
        :resolved-theme="resolvedFlowchartTheme"
        :strict-alignment="flowchartConfig.strictAlignment"
        :background-style="flowchartConfig.backgroundStyle"
        :selected-node="selectedNode"
        :selected-edge="selectedEdge"
        :flowchart-node-types="flowchartNodeTypes"
        :node-style-presets="flowchartNodeStylePresets"
        :edge-path-types="flowchartEdgePathTypes"
        @toggle-inspector="toggleInspector"
        @toggle-section="toggleInspectorSection"
        @close-inspector="closeInspector"
        @request-template-apply="requestApplyTemplate"
        @update-flowchart-config="updateFlowchartConfig"
        @update-selected-node-type="updateSelectedNodeType"
        @update-selected-node-text="updateSelectedNodeText"
        @update-selected-edge-label="updateSelectedEdgeLabel"
        @update-selected-edge-label-position="updateSelectedEdgeLabelPosition"
        @apply-selected-node-preset="applySelectedNodePreset"
        @update-flowchart-theme="updateFlowchartTheme"
        @update-selected-node-style="updateSelectedNodeStyle"
        @update-selected-edge-style="updateSelectedEdgeStyle"
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
import { toggleThemeMode } from '@/stores/runtime'
import {
  FLOWCHART_NODE_STYLE_PRESETS,
  FLOWCHART_TEMPLATE_PRESETS,
  FLOWCHART_THEME_PRESETS,
  FLOWCHART_NODE_TYPES,
  createDefaultFlowchartData,
  createFlowchartTemplatePreviewData,
  getFlowchartAnchorHandleKey,
  getFlowchartEdgeLayout,
  getFlowchartNodeVisualStyle,
  getFlowchartThemeDefinition
} from '@/services/flowchartDocument'
import FlowchartCanvas from './FlowchartCanvas.vue'
import FlowchartEdgeLayer from './FlowchartEdgeLayer.vue'
import FlowchartInspector from './FlowchartInspector.vue'
import FlowchartMinimap from './FlowchartMinimap.vue'
import FlowchartNodeLayer from './FlowchartNodeLayer.vue'
import FlowchartQuickAddBar from './FlowchartQuickAddBar.vue'
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
import { flowchartAutoScrollMethods } from './flowchartEditorAutoScroll'
import { flowchartStyleMethods } from './flowchartEditorStyle'
import { flowchartDocumentMethods } from './flowchartEditorDocument'
import { flowchartAiMethods } from './flowchartEditorAi'
import {
  FLOWCHART_ALIGNMENT_THRESHOLD,
  FLOWCHART_STRAIGHT_EDGE_SNAP_THRESHOLD,
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
    FlowchartToolbar
  },
  data() {
    return {
      flowchartData: createDefaultFlowchartData(),
      flowchartConfig: {
        snapToGrid: false,
        gridSize: 24,
        themeId: 'blueprint',
        strictAlignment: false,
        backgroundStyle: 'grid'
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
      connectorDragFrameId: 0,
      pendingConnectorPoint: null,
      edgeReconnectState: null,
      edgeReconnectFrameId: 0,
      pendingEdgeReconnectPoint: null,
      edgeBendDragState: null,
      edgeBendDragFrameId: 0,
      pendingEdgeBendPoint: null,
      edgeLabelDragState: null,
      edgeLabelDragFrameId: 0,
      pendingEdgeLabelDragPoint: null,
      edgeDirectionLockMap: null,
      edgeToolbarState: null,
      inspectorPanelSection: 'templates',
      inlineTextEditorState: null,
      flowchartClipboard: null,
      flowchartHistory: {
        undoStack: [],
        redoStack: [],
        baseline: null,
        restoring: false
      },
      interactionClickGuardUntil: 0,
      interactivePersistTimer: 0,
      interactivePersistOptions: null,
      alignmentGuides: [],
      canvasPanState: null,
      canvasPanFrameId: 0,
      pendingCanvasPanPoint: null,
      autoScrollState: null,
      autoScrollFrameId: 0,
      newNodeIds: null,
      canvasViewportSize: {
        width: 0,
        height: 0
      },
      resizeState: null,
      persistTimer: 0,
      recoveryTimer: 0,
      isFlowchartUnmounted: false,
      aiBuffer: '',
      isGenerating: false,
      flowchartAiClient: null,
      flowchartAiRequestToken: 0
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
    connectorTargetDirection() {
      const previewAnchor =
        this.edgeReconnectState?.targetAnchor ||
        this.connectorDragState?.targetAnchor ||
        null
      return getFlowchartAnchorHandleKey(previewAnchor, '')
    },
    isInteractiveEdgeRouting() {
      return !!(
        this.dragState ||
        this.connectorDragState ||
        this.edgeReconnectState ||
        this.edgeBendDragState ||
        this.edgeLabelDragState ||
        this.resizeState
      )
    },
    edgesWithLayout() {
      const interactiveEdgeIds = this.getInteractiveEdgeLayoutEdgeIds()
      const nextEdgeLayoutCache = new Map()
      const edgesWithLayout = this.flowchartData.edges
        .map(edge => {
          const sourceNode = this.flowchartNodeLookup.get(edge.source)
          const targetNode = this.flowchartNodeLookup.get(edge.target)
          if (!sourceNode || !targetNode) return null
          const cacheKey = this.createEdgeLayoutCacheKey(edge, sourceNode, targetNode)
          const cachedLayoutEntry = this._edgeLayoutCache?.get(edge.id) || null
          const layout =
            this.isInteractiveEdgeRouting && !interactiveEdgeIds.has(edge.id)
              ? cachedLayoutEntry?.cacheKey === cacheKey
                ? cachedLayoutEntry.layout
                : this.resolveEdgeLayoutForRender(edge, sourceNode, targetNode)
              : this.resolveEdgeLayoutForRender(edge, sourceNode, targetNode)
          nextEdgeLayoutCache.set(edge.id, {
            cacheKey,
            layout
          })
          return {
            ...edge,
            ...layout
          }
        })
        .filter(Boolean)
      this._edgeLayoutCache = nextEdgeLayoutCache
      return edgesWithLayout
    },
    minimapEdges() {
      return this.edgesWithLayout
    },
    flowchartLanes() {
      return Array.isArray(this.flowchartData.lanes) ? this.flowchartData.lanes : []
    },
    flowchartNodeStylePresets() {
      return FLOWCHART_NODE_STYLE_PRESETS
    },
    resolvedFlowchartTheme() {
      return getFlowchartThemeDefinition(this.flowchartConfig.themeId, {
        isDark: this.isDark
      })
    },
    flowchartThemeStyleVars() {
      const theme = this.resolvedFlowchartTheme
      return {
        '--flowchart-canvas-bg': theme.canvasBg,
        '--flowchart-grid-color': theme.gridColor,
        '--flowchart-floating-bg': theme.floatingBg,
        '--flowchart-floating-border': theme.floatingBorder,
        '--flowchart-floating-shadow': theme.floatingShadow,
        '--flowchart-dock-bg': theme.dockBg,
        '--flowchart-dock-border': theme.dockBorder,
        '--flowchart-dock-shadow': theme.dockShadow,
        '--flowchart-dock-active-bg': theme.dockActiveBg,
        '--flowchart-dock-active-text': theme.dockActiveText,
        '--flowchart-text': theme.text,
        '--flowchart-subtle-text': theme.subtleText,
        '--flowchart-toolbar-bg': theme.toolbarBg,
        '--flowchart-toolbar-border': theme.toolbarBorder,
        '--flowchart-toolbar-btn-hover': theme.toolbarBtnHover,
        '--flowchart-node-bg': theme.nodeBg,
        '--flowchart-node-border': theme.nodeBorder,
        '--flowchart-node-shadow': theme.nodeShadow,
        '--flowchart-accent': theme.accent,
        '--flowchart-accent-ring': theme.accentRing,
        '--flowchart-connector': theme.connector,
        '--flowchart-connector-preview': theme.connectorPreview,
        '--flowchart-overlay': theme.overlay,
        '--flowchart-template-preview-bg': theme.templatePreviewBg,
        '--flowchart-template-edge': theme.templateEdgeStroke,
        '--flowchart-template-node-fill': theme.templateNodeFill,
        '--flowchart-template-node-stroke': theme.templateNodeStroke,
        '--flowchart-icon-stroke': theme.iconStroke
      }
    },
    flowchartThemePresets() {
      return FLOWCHART_THEME_PRESETS.map(item => {
        const preview = getFlowchartThemeDefinition(item.id, {
          isDark: this.isDark
        })
        return {
          id: item.id,
          label: this.$t(item.labelKey),
          ...preview
        }
      })
    },
    canvasWorldBounds() {
      const boundsItems = [
        ...this.flowchartLanes,
        ...this.flowchartData.nodes
      ]
      const nodeBounds = boundsItems.reduce(
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
      if (this.flowchartConfig.strictAlignment) {
        return [
          {
            value: 'orthogonal',
            label: this.$t('flowchart.edgeTypeOrthogonal')
          }
        ]
      }
      return [
        {
          value: 'orthogonal',
          label: this.$t('flowchart.edgeTypeOrthogonal')
        },
        {
          value: 'curved',
          label: this.$t('flowchart.edgeTypeCurved')
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
        theme: this.$t('flowchart.theme'),
        templatePanelTitle: this.$t('flowchart.templatePanelTitle'),
        convertMindMap: this.$t('flowchart.convertMindMap'),
        importMindMapFile: this.$t('flowchart.importMindMapFile'),
        aiGenerate: this.$t('flowchart.aiGenerate'),
        exportCenter: this.$t('toolbar.exportCenter'),
        addStart: this.$t('flowchart.addStart'),
        addProcess: this.$t('flowchart.addProcess'),
        addDecision: this.$t('flowchart.addDecision'),
        addInput: this.$t('flowchart.addInput'),
        addEnd: this.$t('flowchart.addEnd'),
        shapeSearchPlaceholder: this.$t('flowchart.shapeSearchPlaceholder'),
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
        edgeLabel: this.$t('flowchart.edgeLabel'),
        edgeLabelPosition: this.$t('flowchart.edgeLabelPosition'),
        edgeLabelOffsetX: this.$t('flowchart.edgeLabelOffsetX'),
        edgeLabelOffsetY: this.$t('flowchart.edgeLabelOffsetY'),
        edgeColor: this.$t('flowchart.edgeColor'),
        edgeType: this.$t('flowchart.edgeType'),
        edgeLineStyle: this.$t('flowchart.edgeLineStyle'),
        edgeLineStyleSolid: this.$t('flowchart.edgeLineStyleSolid'),
        edgeLineStyleDashed: this.$t('flowchart.edgeLineStyleDashed'),
        edgeTypeStraight: this.$t('flowchart.edgeTypeStraight'),
        edgeTypeCurved: this.$t('flowchart.edgeTypeCurved'),
        edgeTypeOrthogonal: this.$t('flowchart.edgeTypeOrthogonal'),
        strictAlignment: this.$t('flowchart.strictAlignment'),
        backgroundStyle: this.$t('flowchart.backgroundStyle'),
        backgroundStyleNone: this.$t('flowchart.backgroundStyleNone'),
        backgroundStyleDots: this.$t('flowchart.backgroundStyleDots'),
        backgroundStyleGrid: this.$t('flowchart.backgroundStyleGrid'),
        settingsPanelTitle: this.$t('flowchart.settingsPanelTitle'),
        minimap: this.$t('flowchart.minimap'),
        delete: this.$t('flowchart.delete'),
        selectionEmpty: this.$t('flowchart.selectionEmpty'),
        fitView: this.$t('flowchart.fitView'),
        tidyLayout: this.$t('flowchart.tidyLayout'),
        templateApproval: this.$t('flowchart.templateApproval'),
        templateRelease: this.$t('flowchart.templateRelease'),
        templateTicket: this.$t('flowchart.templateTicket'),
        templateOnboarding: this.$t('flowchart.templateOnboarding'),
        templateTroubleshooting: this.$t('flowchart.templateTroubleshooting'),
        templateCustomerJourney: this.$t('flowchart.templateCustomerJourney'),
        templateIncident: this.$t('flowchart.templateIncident'),
        templateDataPipeline: this.$t('flowchart.templateDataPipeline'),
        templateProjectPlan: this.$t('flowchart.templateProjectPlan'),
        templateCrossFunctionalApproval: this.$t('flowchart.templateCrossFunctionalApproval'),
        templateSupportEscalation: this.$t('flowchart.templateSupportEscalation'),
        templateContentReview: this.$t('flowchart.templateContentReview'),
        templateProcurement: this.$t('flowchart.templateProcurement'),
        templateSalesPipeline: this.$t('flowchart.templateSalesPipeline'),
        templateEnterpriseDelivery: this.$t('flowchart.templateEnterpriseDelivery'),
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
        convertMindMap: this.$t('flowchart.convertMindMapShort'),
        tidyLayout: this.$t('flowchart.tidyLayout'),
        darkMode: this.$t('navigatorToolbar.darkMode'),
        lightMode: this.$t('navigatorToolbar.lightMode')
      }
    },
    flowchartTemplates() {
      const groupedTemplates = FLOWCHART_TEMPLATE_PRESETS.reduce((result, item) => {
        const categoryId = String(item.categoryKey || 'flowchart.templateCategoryOps')
        if (!result.has(categoryId)) {
          result.set(categoryId, {
            id: categoryId,
            label: this.$t(categoryId),
            items: []
          })
        }
        result.get(categoryId).items.push({
          id: item.id,
          label: this.$t(item.labelKey),
          category: this.$t(item.categoryKey),
          preview: createFlowchartTemplatePreviewData(this.$t('flowchart.title'), item.id)
        })
        return result
      }, new Map())
      return Array.from(groupedTemplates.values())
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
  created() {
    this._edgeLayoutCache = new Map()
    this.autoScrollTick = this.autoScrollTick.bind(this)
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
    this.isFlowchartUnmounted = true
    this.stopAutoScroll()
    this.cancelFlowchartAiRequest({
      resetGenerating: true
    })
    this.removeDragListeners()
    this.removeNodeResizeListeners()
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    this.cancelEdgeBendDrag()
    this.cancelEdgeLabelDrag()
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
    if (this.interactivePersistTimer) {
      clearTimeout(this.interactivePersistTimer)
      this.interactivePersistTimer = 0
    }
    this.interactivePersistOptions = null
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
    markNodesAsNew(nodeIds) {
      if (!nodeIds?.length) return
      this.newNodeIds = new Set(nodeIds)
      setTimeout(() => {
        if (this.newNodeIds) {
          this.newNodeIds = null
        }
      }, 250)
    },
    toggleInspectorSection(section = 'templates') {
      const nextSection = ['templates', 'settings', 'inspector'].includes(section)
        ? section
        : 'templates'
      if (this.isInspectorOpen && this.inspectorPanelSection === nextSection) {
        this.closeInspector()
        return
      }
      this.inspectorPanelSection = nextSection
      this.isInspectorOpen = true
    },
    showInspectorSection(section = 'templates') {
      this.inspectorPanelSection = ['templates', 'settings', 'inspector'].includes(section)
        ? section
        : 'templates'
      this.isInspectorOpen = true
    },
    async toggleAppearance() {
      try {
        await toggleThemeMode()
      } catch (error) {
        console.error('toggleAppearance failed', error)
        this.$message.error(error?.message || this.$t('flowchart.saveFailed'))
      }
    },
    loadFlowchartState() {
      const bootstrapState = getBootstrapState()
      this._edgeLayoutCache = new Map()
      this.flowchartData = cloneJson(
        bootstrapState.flowchartData || createDefaultFlowchartData()
      )
      const nextFlowchartConfig = {
        snapToGrid: false,
        gridSize: 24,
        themeId: 'blueprint',
        strictAlignment: false,
        backgroundStyle: 'grid',
        ...cloneJson(bootstrapState.flowchartConfig || {})
      }
      nextFlowchartConfig.snapToGrid = false
      nextFlowchartConfig.backgroundStyle =
        ['grid', 'dots'].includes(nextFlowchartConfig.backgroundStyle)
          ? nextFlowchartConfig.backgroundStyle
          : 'none'
      this.flowchartConfig = nextFlowchartConfig
      this.ensureFlowchartViewport()
      this.initializeFlowchartHistory()
    },
    ...flowchartHistoryMethods,

    createEdgeLayoutCacheKey(edge, sourceNode, targetNode) {
      const sa = edge.sourceAnchor
      const ta = edge.targetAnchor
      const r = edge.route
      const lp = edge.labelPosition
      const s = edge.style
      const ld = this.edgeDirectionLockMap?.[edge.id]
      const routeStr = r
        ? Array.isArray(r.manualPoints) && r.manualPoints.length
          ? r.manualPoints
              .map(point => `${Number(point?.x || 0)},${Number(point?.y || 0)}`)
              .join(';')
          : `${r.orthogonalLane?.axis || ''}:${r.orthogonalLane?.value ?? ''}`
        : ''
      const ldStr = ld
        ? `${ld.sourceDirection || ''}:${ld.targetDirection || ''}`
        : ''
      return [
        edge.id,
        sourceNode.id, Number(sourceNode.x || 0), Number(sourceNode.y || 0),
        Number(sourceNode.width || 0), Number(sourceNode.height || 0),
        targetNode.id, Number(targetNode.x || 0), Number(targetNode.y || 0),
        Number(targetNode.width || 0), Number(targetNode.height || 0),
        sa ? `${sa.handleKey || ''}${sa.xRatio ?? ''}${sa.yRatio ?? ''}` : '',
        ta ? `${ta.handleKey || ''}${ta.xRatio ?? ''}${ta.yRatio ?? ''}` : '',
        routeStr,
        edge.label || '',
        lp ? `${lp.ratio ?? ''}${lp.offsetX ?? ''}${lp.offsetY ?? ''}` : '',
        s ? `${s.pathType || ''}${s.strokeColor || ''}${s.strokeWidth ?? ''}` : '',
        this.flowchartConfig.themeId || '',
        this.isDark ? 1 : 0,
        this.flowchartConfig.strictAlignment ? 1 : 0,
        ldStr
      ].join('|')
    },

    resolveEdgeLayoutForRender(edge, sourceNode, targetNode) {
      return getFlowchartEdgeLayout(edge, sourceNode, targetNode, {
        theme: this.resolvedFlowchartTheme,
        strictAlignment: !!this.flowchartConfig.strictAlignment,
        lockedDirections: this.edgeDirectionLockMap?.[edge.id] || null,
        nodes: this.flowchartData.nodes,
        interactive: this.isInteractiveEdgeRouting
      })
    },

    getInteractiveEdgeLayoutEdgeIds() {
      const interactiveEdgeIds = new Set()
      const addNodeEdges = nodeIds => {
        if (!nodeIds?.size) {
          return
        }
        this.flowchartData.edges.forEach(edge => {
          if (nodeIds.has(edge.source) || nodeIds.has(edge.target)) {
            interactiveEdgeIds.add(edge.id)
          }
        })
      }
      if (this.dragState?.nodes?.length) {
        addNodeEdges(new Set(this.dragState.nodes.map(item => item.id)))
      }
      if (this.resizeState?.nodeId) {
        addNodeEdges(new Set([this.resizeState.nodeId]))
      }
      if (this.edgeReconnectState?.edgeId) {
        interactiveEdgeIds.add(this.edgeReconnectState.edgeId)
      }
      if (this.edgeBendDragState?.edgeId) {
        interactiveEdgeIds.add(this.edgeBendDragState.edgeId)
      }
      if (this.edgeLabelDragState?.edgeId) {
        interactiveEdgeIds.add(this.edgeLabelDragState.edgeId)
      }
      return interactiveEdgeIds
    },

    getNodeStyle(node) {
      const visualStyle = getFlowchartNodeVisualStyle(node, {
        isDark: this.isDark,
        theme: this.resolvedFlowchartTheme
      })
      const usesPolygonShape =
        node?.type === 'decision' || node?.type === 'input'
      return {
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        height: `${node.height}px`,
        backgroundColor: usesPolygonShape ? 'transparent' : visualStyle.fill,
        borderColor: visualStyle.stroke,
        color: visualStyle.textColor,
        '--flowchart-node-fill-current': visualStyle.fill,
        '--flowchart-node-stroke-current': visualStyle.stroke,
        '--flowchart-node-text-current': visualStyle.textColor
      }
    },
    ...flowchartConnectorMethods,
    ...flowchartReconnectMethods,
    ...flowchartViewportMethods,
    ...flowchartSelectionMethods,
    ...flowchartInlineEditMethods,
    ...flowchartNodeMethods,
    ...flowchartResizeMethods,
    ...flowchartAutoScrollMethods,
    ...flowchartStyleMethods,
    ...flowchartDocumentMethods,
    ...flowchartAiMethods,

    relaxConnectedOrthogonalEdgeRoutes(nodeIds = []) {
      const movedNodeIds = new Set(nodeIds.filter(Boolean))
      if (!movedNodeIds.size) {
        return
      }
      this.flowchartData.edges.forEach(edge => {
        if (
          !edge?.route ||
          !movedNodeIds.has(edge.source) &&
            !movedNodeIds.has(edge.target)
        ) {
          return
        }
        const sourceNode = this.flowchartNodeLookup.get(edge.source)
        const targetNode = this.flowchartNodeLookup.get(edge.target)
        if (!sourceNode || !targetNode) {
          return
        }
        const relaxedLayout = getFlowchartEdgeLayout(
          {
            ...edge,
            route: null
          },
          sourceNode,
          targetNode,
          {
            theme: this.resolvedFlowchartTheme,
            strictAlignment: !!this.flowchartConfig.strictAlignment,
            nodes: this.flowchartData.nodes
          }
        )
        if (Array.isArray(relaxedLayout?.pathPoints) && relaxedLayout.pathPoints.length <= 3) {
          edge.route = null
        }
      })
    },

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

    getAlignmentSnapThreshold() {
      const viewport = this.getViewport()
      const zoom = Math.max(0.25, Number(viewport.zoom || 1) || 1)
      const baseThreshold = FLOWCHART_ALIGNMENT_THRESHOLD / zoom
      if (this.flowchartConfig.strictAlignment) {
        return Math.max(8, Math.min(20, baseThreshold * 1.45))
      }
      return Math.max(4, Math.min(14, baseThreshold))
    },

    getStraightEdgeSnapThreshold() {
      const viewport = this.getViewport()
      const zoom = Math.max(0.25, Number(viewport.zoom || 1) || 1)
      const baseThreshold = FLOWCHART_STRAIGHT_EDGE_SNAP_THRESHOLD / zoom
      return Math.max(8, Math.min(24, baseThreshold))
    },

    resolveAlignmentCandidate(candidates, axis, threshold, releaseThreshold) {
      const lock = this.dragState?.snapLock?.[axis] || null
      if (!candidates.length) {
        return null
      }
      if (lock) {
        const lockedCandidate = candidates.find(candidate => {
          return candidate.lockKey === lock.lockKey
        })
        if (
          lockedCandidate &&
          Math.abs(lockedCandidate.diff) <= releaseThreshold
        ) {
          return lockedCandidate
        }
      }
      const activeCandidates = candidates.filter(candidate => {
        return Math.abs(candidate.diff) <= (candidate.snapThreshold || threshold)
      })
      if (!activeCandidates.length) {
        return null
      }
      return activeCandidates.sort((a, b) => {
        if ((b.priority || 0) !== (a.priority || 0)) {
          return (b.priority || 0) - (a.priority || 0)
        }
        return Math.abs(a.diff) - Math.abs(b.diff)
      })[0]
    },

    getConnectedNodeIds(nodeId) {
      if (!nodeId) {
        return new Set()
      }
      return this.flowchartData.edges.reduce((result, edge) => {
        if (edge.source === nodeId && edge.target) {
          result.add(edge.target)
        }
        if (edge.target === nodeId && edge.source) {
          result.add(edge.source)
        }
        return result
      }, new Set())
    },

    createAlignmentGuideSpan(axis, guideValue, movingMetrics, candidateMetrics) {
      const padding = 40
      if (axis === 'x') {
        return {
          x1: guideValue,
          y1: Math.max(
            0,
            Math.min(movingMetrics.top, candidateMetrics.top) - padding
          ),
          x2: guideValue,
          y2: Math.min(
            this.canvasWorldBounds.height,
            Math.max(movingMetrics.bottom, candidateMetrics.bottom) + padding
          )
        }
      }
      return {
        x1: Math.max(
          0,
          Math.min(movingMetrics.left, candidateMetrics.left) - padding
        ),
        y1: guideValue,
        x2: Math.min(
          this.canvasWorldBounds.width,
          Math.max(movingMetrics.right, candidateMetrics.right) + padding
        ),
        y2: guideValue
      }
    },

    computeStraightEdgeSnap({
      node,
      movingMetrics,
      selectedSet,
      threshold,
      releaseThreshold
    }) {
      const connectedNodeIds = this.getConnectedNodeIds(node.id)
      const xCandidates = []
      const yCandidates = []
      if (!connectedNodeIds.size) {
        return { xCandidates, yCandidates }
      }
      const axisDistanceFloor = 24
      this.flowchartData.nodes.forEach(candidate => {
        if (!connectedNodeIds.has(candidate.id) || selectedSet.has(candidate.id)) {
          return
        }
        const candidateMetrics = this.createNodeAlignmentMetrics(candidate)
        const centerXDiff = candidateMetrics.centerX - movingMetrics.centerX
        const centerYDiff = candidateMetrics.centerY - movingMetrics.centerY
        const centerXDistance = Math.abs(centerXDiff)
        const centerYDistance = Math.abs(centerYDiff)
        if (
          centerXDistance <= releaseThreshold &&
          centerYDistance >= Math.max(axisDistanceFloor, centerXDistance * 2)
        ) {
          xCandidates.push({
            diff: centerXDiff,
            guideX: candidateMetrics.centerX,
            candidateMetrics,
            priority: 8,
            snapThreshold: threshold,
            lockKey: `straight:${candidate.id}:centerX`
          })
        }
        if (
          centerYDistance <= releaseThreshold &&
          centerXDistance >= Math.max(axisDistanceFloor, centerYDistance * 2)
        ) {
          yCandidates.push({
            diff: centerYDiff,
            guideY: candidateMetrics.centerY,
            candidateMetrics,
            priority: 8,
            snapThreshold: threshold,
            lockKey: `straight:${candidate.id}:centerY`
          })
        }
      })
      return { xCandidates, yCandidates }
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
      const threshold = this.getAlignmentSnapThreshold()
      const straightThreshold = this.getStraightEdgeSnapThreshold()
      const releaseThreshold = threshold * 1.75
      const straightReleaseThreshold = straightThreshold * 1.75
      const strictAlignment = !!this.flowchartConfig.strictAlignment
      const connectedNodeIds = this.getConnectedNodeIds(node.id)
      const xCandidates = []
      const yCandidates = []
      const straightSnap = this.computeStraightEdgeSnap({
        node,
        movingMetrics,
        selectedSet,
        threshold: straightThreshold,
        releaseThreshold: straightReleaseThreshold
      })
      xCandidates.push(...straightSnap.xCandidates)
      yCandidates.push(...straightSnap.yCandidates)
      this.flowchartData.nodes.forEach(candidate => {
        if (selectedSet.has(candidate.id)) return
        const candidateMetrics = this.createNodeAlignmentMetrics(candidate)
        ;[
          ['left', 'left'],
          ['centerX', 'centerX'],
          ['right', 'right']
        ].forEach(([movingKey, candidateKey]) => {
          const diff = candidateMetrics[candidateKey] - movingMetrics[movingKey]
          if (Math.abs(diff) <= releaseThreshold) {
            const isConnected = connectedNodeIds.has(candidate.id)
            const isCenterAlignment = movingKey === 'centerX'
            xCandidates.push({
              diff,
              guideX: candidateMetrics[candidateKey],
              candidateMetrics,
              priority:
                strictAlignment && isConnected && isCenterAlignment
                  ? 4
                  : strictAlignment && isCenterAlignment
                    ? 2
                    : isConnected
                      ? 1
                      : 0,
              lockKey: `${candidate.id}:${candidateKey}:${movingKey}`
            })
          }
        })
        ;[
          ['top', 'top'],
          ['centerY', 'centerY'],
          ['bottom', 'bottom']
        ].forEach(([movingKey, candidateKey]) => {
          const diff = candidateMetrics[candidateKey] - movingMetrics[movingKey]
          if (Math.abs(diff) <= releaseThreshold) {
            const isConnected = connectedNodeIds.has(candidate.id)
            const isCenterAlignment = movingKey === 'centerY'
            yCandidates.push({
              diff,
              guideY: candidateMetrics[candidateKey],
              candidateMetrics,
              priority:
                strictAlignment && isConnected && isCenterAlignment
                  ? 4
                  : strictAlignment && isCenterAlignment
                    ? 2
                    : isConnected
                      ? 1
                      : 0,
              lockKey: `${candidate.id}:${candidateKey}:${movingKey}`
            })
          }
        })
      })
      const bestX = this.resolveAlignmentCandidate(
        xCandidates,
        'x',
        threshold,
        Math.max(releaseThreshold, straightReleaseThreshold)
      )
      const bestY = this.resolveAlignmentCandidate(
        yCandidates,
        'y',
        threshold,
        Math.max(releaseThreshold, straightReleaseThreshold)
      )
      const guides = []
      if (bestX) {
        guides.push({
          id: `vertical-${bestX.guideX}`,
          ...this.createAlignmentGuideSpan(
            'x',
            bestX.guideX,
            movingMetrics,
            bestX.candidateMetrics
          )
        })
      }
      if (bestY) {
        guides.push({
          id: `horizontal-${bestY.guideY}`,
          ...this.createAlignmentGuideSpan(
            'y',
            bestY.guideY,
            movingMetrics,
            bestY.candidateMetrics
          )
        })
      }
      if (this.dragState?.snapLock) {
        this.dragState.snapLock = {
          x: bestX ? { lockKey: bestX.lockKey } : null,
          y: bestY ? { lockKey: bestY.lockKey } : null
        }
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
