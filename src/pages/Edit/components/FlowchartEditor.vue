<template>
  <div class="flowchartEditor" :class="{ isDark }">
    <header class="flowchartToolbarShell">
      <div class="flowchartToolbar">
        <div class="flowchartToolbarGroup isPrimary">
          <button type="button" class="flowchartToolbarBtn" @click="goHome">
            {{ $t('flowchart.returnHome') }}
          </button>
          <button type="button" class="flowchartToolbarBtn" @click="saveCurrentFile()">
            {{ $t('flowchart.save') }}
          </button>
          <button type="button" class="flowchartToolbarBtn" @click="saveAsFile()">
            {{ $t('flowchart.saveAs') }}
          </button>
          <button type="button" class="flowchartToolbarBtn" @click="importMindMapFile">
            {{ $t('flowchart.importMindMapFile') }}
          </button>
          <button type="button" class="flowchartToolbarBtn" @click="exportAsSvg">
            {{ $t('flowchart.exportSvg') }}
          </button>
          <button type="button" class="flowchartToolbarBtn" @click="exportAsPng">
            {{ $t('flowchart.exportPng') }}
          </button>
        </div>
        <div class="flowchartToolbarGroup isSecondary">
          <button type="button" class="flowchartToolbarBtn" @click="applyTemplate('blank')">
            {{ $t('flowchart.template') }}
          </button>
          <button type="button" class="flowchartToolbarBtn" @click="applyTemplate('approval')">
            {{ $t('flowchart.templateApproval') }}
          </button>
          <button
            type="button"
            class="flowchartToolbarBtn"
            @click="applyTemplate('troubleshooting')"
          >
            {{ $t('flowchart.templateTroubleshooting') }}
          </button>
          <button type="button" class="flowchartToolbarBtn" @click="convertCurrentMindMap">
            {{ $t('flowchart.convertMindMap') }}
          </button>
          <button type="button" class="flowchartToolbarBtn" @click="generateWithAi">
            {{ $t('flowchart.aiGenerate') }}
          </button>
        </div>
      </div>
    </header>

    <div class="flowchartStage">
      <main class="flowchartCanvasShell">
        <div
          ref="canvasRef"
          class="flowchartCanvasViewport"
          :class="{ isPanning: !!canvasPanState }"
          @mousedown="handleCanvasPointerDown"
          @wheel.prevent="handleCanvasWheel"
        >
          <div class="flowchartCanvasWorld" :style="canvasWorldStyle()">
            <svg
              class="edgeLayer"
              xmlns="http://www.w3.org/2000/svg"
              :width="canvasWorldBounds.width"
              :height="canvasWorldBounds.height"
              :viewBox="`0 0 ${canvasWorldBounds.width} ${canvasWorldBounds.height}`"
            >
              <g v-for="edge in edgesWithLayout" :key="edge.id">
                <path
                  class="edgePath"
                  :class="{ isSelected: selectedEdgeId === edge.id }"
                  :d="edge.path"
                  @click.stop="selectEdge(edge.id)"
                />
                <text
                  v-if="edge.label"
                  class="edgeLabel"
                  :x="edge.labelX"
                  :y="edge.labelY"
                  @click.stop="selectEdge(edge.id)"
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
            </svg>

            <div
              v-for="node in flowchartData.nodes"
              :key="node.id"
              class="flowchartNode"
              :class="[
                `nodeType-${node.type}`,
                { isSelected: selectedNodeIds.includes(node.id) }
              ]"
              :style="getNodeStyle(node)"
              @mousedown.stop="startNodeDrag($event, node)"
              @click.stop="selectNode(node.id, $event)"
              @dblclick.stop="editNodeText(node.id)"
            >
              <span class="nodeText">{{ node.text }}</span>
            </div>

            <div
              v-if="selectionState"
              class="flowchartSelectionBox"
              :style="getSelectionBoxStyle()"
            ></div>

            <div v-if="!flowchartData.nodes.length" class="canvasEmpty">
              <strong>{{ $t('flowchart.emptyTitle') }}</strong>
              <span>{{ $t('flowchart.canvasHint') }}</span>
              <div class="canvasEmptyActions">
                <button type="button" class="flowchartPanelBtn" @click="addNodeByType('start')">
                  {{ $t('flowchart.emptyAddStart') }}
                </button>
                <button
                  type="button"
                  class="flowchartPanelBtn"
                  @click="applyTemplate('approval')"
                >
                  {{ $t('flowchart.emptyUseTemplate') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div class="flowchartViewportToolbar">
        <button type="button" class="flowchartViewportBtn" @click="zoomOut">
          -
        </button>
        <button type="button" class="flowchartViewportBtn isLabel" @click="resetViewport">
          {{ viewportZoomLabel }}
        </button>
        <button type="button" class="flowchartViewportBtn" @click="fitCanvasToView">
          {{ $t('flowchart.fitView') }}
        </button>
        <button type="button" class="flowchartViewportBtn" @click="zoomIn">
          +
        </button>
      </div>

      <div class="flowchartDockRail">
        <button
          type="button"
          class="flowchartDockTrigger"
          :class="{ isActive: activePanel === 'palette' }"
          @click="togglePanel('palette')"
        >
          <span class="flowchartDockGlyph">+</span>
          <span class="flowchartDockText">{{ $t('flowchart.title') }}</span>
        </button>
        <button
          type="button"
          class="flowchartDockTrigger"
          :class="{ isActive: activePanel === 'inspector' }"
          @click="togglePanel('inspector')"
        >
          <span class="flowchartDockGlyph">≡</span>
          <span class="flowchartDockText">{{ $t('flowchart.inspectorTitle') }}</span>
        </button>
      </div>

      <button
        v-if="activePanel"
        type="button"
        class="flowchartPanelBackdrop"
        @click="activePanel = ''"
      ></button>

      <aside
        v-if="activePanel === 'palette'"
        class="flowchartFloatingPanel flowchartPalettePanel"
      >
        <div class="flowchartPanelHeader">
          <div class="flowchartPanelTitle">{{ $t('flowchart.title') }}</div>
          <button
            type="button"
            class="flowchartPanelClose"
            aria-label="关闭流程图面板"
            @click="activePanel = ''"
          >
            ×
          </button>
        </div>
        <div class="flowchartButtonGrid">
          <button type="button" class="flowchartPanelBtn" @click="addNodeByType('start')">
            {{ $t('flowchart.addStart') }}
          </button>
          <button type="button" class="flowchartPanelBtn" @click="addNodeByType('process')">
            {{ $t('flowchart.addProcess') }}
          </button>
          <button type="button" class="flowchartPanelBtn" @click="addNodeByType('decision')">
            {{ $t('flowchart.addDecision') }}
          </button>
          <button type="button" class="flowchartPanelBtn" @click="addNodeByType('input')">
            {{ $t('flowchart.addInput') }}
          </button>
          <button type="button" class="flowchartPanelBtn" @click="addNodeByType('end')">
            {{ $t('flowchart.addEnd') }}
          </button>
        </div>
        <div class="flowchartPanelActions">
          <button type="button" class="flowchartPanelBtn" @click="connectSelectedNodes">
            {{ $t('flowchart.connect') }}
          </button>
          <button type="button" class="flowchartPanelBtn" @click="removeSelection">
            {{ $t('flowchart.delete') }}
          </button>
        </div>
        <div class="flowchartPanelActions">
          <button type="button" class="flowchartPanelBtn" @click="copySelectedNodes">
            {{ $t('flowchart.copy') }}
          </button>
          <button type="button" class="flowchartPanelBtn" @click="pasteCopiedNodes">
            {{ $t('flowchart.paste') }}
          </button>
        </div>
        <div class="flowchartPanelActions isAlignment">
          <button type="button" class="flowchartPanelBtn" @click="alignSelectedNodesLeft">
            {{ $t('flowchart.alignLeft') }}
          </button>
          <button
            type="button"
            class="flowchartPanelBtn"
            @click="distributeSelectedNodesHorizontally"
          >
            {{ $t('flowchart.distributeHorizontal') }}
          </button>
          <button
            type="button"
            class="flowchartPanelBtn"
            @click="distributeSelectedNodesVertically"
          >
            {{ $t('flowchart.distributeVertical') }}
          </button>
        </div>
      </aside>

      <aside
        v-if="activePanel === 'inspector'"
        class="flowchartFloatingPanel flowchartInspectorPanel"
      >
        <div class="flowchartPanelHeader">
          <div class="flowchartPanelTitle">{{ $t('flowchart.inspectorTitle') }}</div>
          <button
            type="button"
            class="flowchartPanelClose"
            aria-label="关闭属性面板"
            @click="activePanel = ''"
          >
            ×
          </button>
        </div>
        <template v-if="selectedNode">
          <label class="fieldLabel">{{ $t('flowchart.nodeType') }}</label>
          <select
            class="fieldSelect"
            :value="selectedNode.type"
            @change="updateSelectedNodeType($event.target.value)"
          >
            <option
              v-for="typeItem in flowchartNodeTypes"
              :key="typeItem.type"
              :value="typeItem.type"
            >
              {{ typeItem.label }}
            </option>
          </select>
          <label class="fieldLabel">{{ $t('flowchart.nodeText') }}</label>
          <textarea
            class="fieldInput"
            :value="selectedNode.text"
            @input="updateSelectedNodeText($event.target.value)"
          ></textarea>
        </template>
        <template v-else-if="selectedEdge">
          <label class="fieldLabel">{{ $t('flowchart.edgeLabel') }}</label>
          <input
            class="fieldInput"
            :value="selectedEdge.label"
            @input="updateSelectedEdgeLabel($event.target.value)"
          />
        </template>
        <div v-else class="emptyInspector">{{ $t('flowchart.selectionEmpty') }}</div>
      </aside>

    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import platform, {
  getBootstrapState,
  ensureBootstrapDocumentState,
  isDesktopApp,
  recordRecentFile,
  saveBootstrapStatePatch
} from '@/platform'
import { useAiStore } from '@/stores/ai'
import { useEditorStore } from '@/stores/editor'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'
import {
  createDesktopFsError,
  getLastDirectory,
  markDocumentDirty,
  setCurrentFileRef
} from '@/services/documentSession'
import {
  clearRecoveryDraftForFile,
  resolveFileContentWithRecovery,
  writeRecoveryDraftForFile
} from '@/services/recoveryStorage'
import {
  FLOWCHART_NODE_TYPES,
  createDefaultFlowchartData,
  convertMindMapToFlowchart,
  normalizeFlowchartAiResult,
  parseStoredDocumentContent,
  serializeStoredDocumentContent
} from '@/services/flowchartDocument'
import {
  buildAiCreateFlowchartMessages,
  checkAiAvailability,
  requestAiStream
} from '@/services/aiService'

const cloneJson = value => JSON.parse(JSON.stringify(value))

const createNodeId = (prefix = 'node') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const getNodeCenter = node => ({
  x: Number(node.x || 0) + Number(node.width || 0) / 2,
  y: Number(node.y || 0) + Number(node.height || 0) / 2
})

const MIN_VIEWPORT_ZOOM = 0.25
const MAX_VIEWPORT_ZOOM = 2.5
const FLOWCHART_ALIGNMENT_THRESHOLD = 8
const FLOWCHART_HISTORY_LIMIT = 60
const DEFAULT_VIEWPORT = {
  x: 0,
  y: 0,
  zoom: 1
}

const clampNumber = (value, min, max) => {
  return Math.min(max, Math.max(min, Number(value)))
}

const escapeXml = value => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const buildSvgNodeShapeMarkup = (node, isDark) => {
  const x = Number(node.x || 0)
  const y = Number(node.y || 0)
  const width = Number(node.width || 0)
  const height = Number(node.height || 0)
  const fill = isDark ? '#1f2937' : '#ffffff'
  const stroke = '#111827'
  if (node.type === 'decision') {
    const points = [
      `${x + width / 2},${y}`,
      `${x + width},${y + height / 2}`,
      `${x + width / 2},${y + height}`,
      `${x},${y + height / 2}`
    ].join(' ')
    return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
  }
  if (node.type === 'input') {
    const offset = Math.max(width * 0.12, 16)
    const points = [
      `${x + offset},${y}`,
      `${x + width},${y}`,
      `${x + width - offset},${y + height}`,
      `${x},${y + height}`
    ].join(' ')
    return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
  }
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${
    node.type === 'start' || node.type === 'end' ? 28 : 14
  }" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
}

const hasConvertibleMindMapData = mindMapData => {
  const root = mindMapData?.root
  if (!root || typeof root !== 'object') {
    return false
  }
  const rootText = String(root.data?.text || '').trim()
  const hasChildren = Array.isArray(root.children) && root.children.length > 0
  return hasChildren || (!!rootText && rootText !== '思维导图')
}

export default {
  name: 'FlowchartEditor',
  data() {
    return {
      flowchartToolbar: [
        'save',
        'saveAs',
        'template',
        'convertMindMap',
        'importMindMapFile',
        'generateWithAi',
        'exportAsSvg',
        'exportAsPng'
      ],
      flowchartData: createDefaultFlowchartData(),
      flowchartConfig: {
        snapToGrid: true,
        gridSize: 24
      },
      flowchartNodeTypes: FLOWCHART_NODE_TYPES,
      flowchartShortcutRows: [
        { key: 'Ctrl / Cmd + Z', labelKey: 'flowchart.shortcutUndo' },
        { key: 'Ctrl / Cmd + Y', labelKey: 'flowchart.shortcutRedo' },
        { key: 'Ctrl / Cmd + A', labelKey: 'flowchart.shortcutSelectAll' },
        { key: 'Ctrl / Cmd + D', labelKey: 'flowchart.shortcutDuplicate' },
        { key: 'Alt + Shift + ↑↓←→', labelKey: 'flowchart.shortcutQuickConnect' },
        { key: 'Shift + Drag', labelKey: 'flowchart.shortcutAreaSelect' },
        { key: '?', labelKey: 'flowchart.shortcutHelp' }
      ],
      selectedNodeIds: [],
      selectedEdgeId: '',
      activePanel: '',
      dragState: null,
      selectionState: null,
      flowchartClipboard: null,
      flowchartHistory: {
        undoStack: [],
        redoStack: [],
        baseline: null,
        restoring: false
      },
      alignmentGuides: [],
      canvasPanState: null,
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
    ...mapState(useSettingsStore, {
      localConfig: 'localConfig'
    }),
    ...mapState(useAiStore, {
      aiConfig: 'config'
    }),
    documentTitle() {
      return (
        this.currentFileName ||
        this.currentDocument?.name ||
        `${this.flowchartData.title || this.$t('flowchart.fileNameFallback')}.smm`
      )
    },
    selectedNode() {
      if (!this.selectedNodeIds.length) return null
      return this.flowchartData.nodes.find(node => node.id === this.selectedNodeIds[0]) || null
    },
    selectedEdge() {
      if (!this.selectedEdgeId) return null
      return this.flowchartData.edges.find(edge => edge.id === this.selectedEdgeId) || null
    },
    edgesWithLayout() {
      return this.flowchartData.edges
        .map(edge => {
          const sourceNode = this.flowchartData.nodes.find(node => node.id === edge.source)
          const targetNode = this.flowchartData.nodes.find(node => node.id === edge.target)
          if (!sourceNode || !targetNode) return null
          const source = getNodeCenter(sourceNode)
          const target = getNodeCenter(targetNode)
          return {
            ...edge,
            path: `M ${source.x} ${source.y} L ${target.x} ${target.y}`,
            labelX: (source.x + target.x) / 2,
            labelY: (source.y + target.y) / 2 - 8
          }
        })
        .filter(Boolean)
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
      if (this.isDefaultViewport(this.flowchartData.viewport)) {
        this.fitCanvasToView({
          persist: false
        })
      }
    })
  },
  beforeUnmount() {
    this.removeDragListeners()
    this.removeCanvasPanListeners()
    this.removeAreaSelectionListeners()
    window.removeEventListener('keydown', this.handleGlobalKeydown)
    window.removeEventListener('beforeunload', this.onBeforeUnload)
    if (this.persistTimer) {
      clearTimeout(this.persistTimer)
      this.persistTimer = 0
    }
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
      this.recoveryTimer = 0
    }
  },
  methods: {
    loadFlowchartState() {
      const bootstrapState = getBootstrapState()
      this.flowchartData = cloneJson(
        bootstrapState.flowchartData || createDefaultFlowchartData()
      )
      this.flowchartConfig = {
        snapToGrid: true,
        gridSize: 24,
        ...cloneJson(bootstrapState.flowchartConfig || {})
      }
      this.ensureFlowchartViewport()
      this.initializeFlowchartHistory()
    },

    createFlowchartHistorySnapshot() {
      return {
        flowchartData: cloneJson(this.flowchartData),
        flowchartConfig: cloneJson(this.flowchartConfig)
      }
    },

    serializeFlowchartHistorySnapshot(snapshot) {
      return JSON.stringify(snapshot || {})
    },

    initializeFlowchartHistory() {
      this.flowchartHistory = {
        undoStack: [],
        redoStack: [],
        baseline: this.createFlowchartHistorySnapshot(),
        restoring: false
      }
    },

    commitFlowchartHistorySnapshot() {
      if (this.flowchartHistory.restoring) {
        return
      }
      const currentSnapshot = this.createFlowchartHistorySnapshot()
      const baseline =
        this.flowchartHistory.baseline || this.createFlowchartHistorySnapshot()
      if (
        this.serializeFlowchartHistorySnapshot(currentSnapshot) ===
        this.serializeFlowchartHistorySnapshot(baseline)
      ) {
        this.flowchartHistory.baseline = currentSnapshot
        return
      }
      this.flowchartHistory.undoStack.push(cloneJson(baseline))
      while (this.flowchartHistory.undoStack.length > FLOWCHART_HISTORY_LIMIT) {
        this.flowchartHistory.undoStack.shift()
      }
      this.flowchartHistory.redoStack = []
      this.flowchartHistory.baseline = currentSnapshot
    },

    restoreFlowchartHistorySnapshot(snapshot) {
      if (!snapshot) return
      this.flowchartHistory.restoring = true
      this.flowchartData = cloneJson(
        snapshot.flowchartData || createDefaultFlowchartData()
      )
      this.flowchartConfig = {
        snapToGrid: true,
        gridSize: 24,
        ...cloneJson(snapshot.flowchartConfig || {})
      }
      this.selectedNodeIds = []
      this.selectedEdgeId = ''
      this.clearAlignmentGuides()
      this.flowchartHistory.baseline = this.createFlowchartHistorySnapshot()
      this.flowchartHistory.restoring = false
    },

    undoFlowchartChange() {
      const previousSnapshot = this.flowchartHistory.undoStack.pop()
      if (!previousSnapshot) {
        return false
      }
      this.flowchartHistory.redoStack.push(this.createFlowchartHistorySnapshot())
      this.restoreFlowchartHistorySnapshot(previousSnapshot)
      void this.persistFlowchartState({
        recordHistory: false
      })
      return true
    },

    redoFlowchartChange() {
      const nextSnapshot = this.flowchartHistory.redoStack.pop()
      if (!nextSnapshot) {
        return false
      }
      this.flowchartHistory.undoStack.push(this.createFlowchartHistorySnapshot())
      this.restoreFlowchartHistorySnapshot(nextSnapshot)
      void this.persistFlowchartState({
        recordHistory: false
      })
      return true
    },

    getNodeStyle(node) {
      return {
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        height: `${node.height}px`
      }
    },

    getWorldPointFromEvent(event) {
      const canvasRect = this.$refs.canvasRef?.getBoundingClientRect?.()
      const viewport = this.getViewport()
      if (!canvasRect) {
        return {
          x: 0,
          y: 0
        }
      }
      return {
        x: (event.clientX - canvasRect.left - viewport.x) / viewport.zoom,
        y: (event.clientY - canvasRect.top - viewport.y) / viewport.zoom
      }
    },

    getViewport() {
      return {
        ...DEFAULT_VIEWPORT,
        ...(this.flowchartData.viewport || {})
      }
    },

    ensureFlowchartViewport() {
      const viewport = this.getViewport()
      this.flowchartData.viewport = {
        x: Number.isFinite(Number(viewport.x)) ? Number(viewport.x) : 0,
        y: Number.isFinite(Number(viewport.y)) ? Number(viewport.y) : 0,
        zoom: clampNumber(
          Number.isFinite(Number(viewport.zoom)) ? Number(viewport.zoom) : 1,
          MIN_VIEWPORT_ZOOM,
          MAX_VIEWPORT_ZOOM
        )
      }
    },

    canvasWorldStyle() {
      const viewport = this.getViewport()
      return {
        width: `${this.canvasWorldBounds.width}px`,
        height: `${this.canvasWorldBounds.height}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
      }
    },

    persistViewport({ autoSave = true } = {}) {
      void this.persistFlowchartState({
        dirty: true,
        autoSave
      })
    },

    setViewportPatch(patch, { persist = true } = {}) {
      this.ensureFlowchartViewport()
      this.flowchartData.viewport = {
        ...this.flowchartData.viewport,
        ...patch
      }
      this.ensureFlowchartViewport()
      if (persist) {
        this.persistViewport()
      }
    },

    resetViewport({ persist = true } = {}) {
      this.setViewportPatch({
        ...DEFAULT_VIEWPORT
      }, {
        persist
      })
    },

    isDefaultViewport(viewport = {}) {
      return (
        Number(viewport.x || 0) === 0 &&
        Number(viewport.y || 0) === 0 &&
        Number(viewport.zoom || 1) === 1
      )
    },

    setViewportZoom(nextZoom, originEvent = null) {
      const canvasRect = this.$refs.canvasRef?.getBoundingClientRect?.()
      const viewport = this.getViewport()
      const zoom = clampNumber(nextZoom, MIN_VIEWPORT_ZOOM, MAX_VIEWPORT_ZOOM)
      if (!canvasRect || !originEvent) {
        this.setViewportPatch({
          zoom
        })
        return
      }
      const originX = originEvent.clientX - canvasRect.left
      const originY = originEvent.clientY - canvasRect.top
      const worldX = (originX - viewport.x) / viewport.zoom
      const worldY = (originY - viewport.y) / viewport.zoom
      this.setViewportPatch({
        zoom,
        x: originX - worldX * zoom,
        y: originY - worldY * zoom
      })
    },

    zoomIn() {
      const viewport = this.getViewport()
      this.setViewportZoom(viewport.zoom + 0.1)
    },

    zoomOut() {
      const viewport = this.getViewport()
      this.setViewportZoom(viewport.zoom - 0.1)
    },

    fitCanvasToView({ persist = true } = {}) {
      const canvasRect = this.$refs.canvasRef?.getBoundingClientRect?.()
      if (!canvasRect || !this.flowchartData.nodes.length) {
        this.resetViewport({
          persist
        })
        return
      }
      const bounds = this.flowchartData.nodes.reduce(
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
      const padding = 96
      const contentWidth = Math.max(1, bounds.maxX - bounds.minX)
      const contentHeight = Math.max(1, bounds.maxY - bounds.minY)
      const zoom = clampNumber(
        Math.min(
          (canvasRect.width - padding) / contentWidth,
          (canvasRect.height - padding) / contentHeight,
          1
        ),
        MIN_VIEWPORT_ZOOM,
        MAX_VIEWPORT_ZOOM
      )
      this.setViewportPatch({
        zoom,
        x: (canvasRect.width - contentWidth * zoom) / 2 - bounds.minX * zoom,
        y: (canvasRect.height - contentHeight * zoom) / 2 - bounds.minY * zoom
      }, {
        persist
      })
    },

    handleCanvasWheel(event) {
      if (!event.ctrlKey && !event.metaKey) {
        return
      }
      const viewport = this.getViewport()
      const direction = event.deltaY > 0 ? -1 : 1
      this.setViewportZoom(viewport.zoom + direction * 0.08, event)
    },

    handleCanvasPointerDown(event) {
      const target = event.target
      if (
        target?.closest?.(
          '.flowchartNode, .edgePath, .edgeLabel, .flowchartViewportToolbar'
        )
      ) {
        return
      }
      if (event.shiftKey) {
        this.startAreaSelection(event)
        return
      }
      this.startCanvasPan(event)
    },

    startCanvasPan(event) {
      if (event.button !== 0) {
        return
      }
      const viewport = this.getViewport()
      this.canvasPanState = {
        startX: event.clientX,
        startY: event.clientY,
        viewportX: viewport.x,
        viewportY: viewport.y,
        moved: false
      }
      window.addEventListener('mousemove', this.onCanvasPan)
      window.addEventListener('mouseup', this.stopCanvasPan)
    },

    onCanvasPan(event) {
      if (!this.canvasPanState) return
      const deltaX = event.clientX - this.canvasPanState.startX
      const deltaY = event.clientY - this.canvasPanState.startY
      this.canvasPanState.moved =
        this.canvasPanState.moved ||
        Math.abs(deltaX) > 3 ||
        Math.abs(deltaY) > 3
      this.setViewportPatch(
        {
          x: this.canvasPanState.viewportX + deltaX,
          y: this.canvasPanState.viewportY + deltaY
        },
        {
          persist: false
        }
      )
    },

    stopCanvasPan() {
      if (!this.canvasPanState) return
      const shouldClearSelection = !this.canvasPanState.moved
      const shouldPersist = this.canvasPanState.moved
      this.canvasPanState = null
      this.removeCanvasPanListeners()
      if (shouldClearSelection) {
        this.clearSelection()
      }
      if (shouldPersist) {
        this.persistViewport()
      }
    },

    removeCanvasPanListeners() {
      window.removeEventListener('mousemove', this.onCanvasPan)
      window.removeEventListener('mouseup', this.stopCanvasPan)
    },

    startAreaSelection(event) {
      if (event.button !== 0) {
        return
      }
      const start = this.getWorldPointFromEvent(event)
      this.selectionState = {
        startX: start.x,
        startY: start.y,
        currentX: start.x,
        currentY: start.y
      }
      this.selectedEdgeId = ''
      window.addEventListener('mousemove', this.onAreaSelection)
      window.addEventListener('mouseup', this.stopAreaSelection)
    },

    onAreaSelection(event) {
      if (!this.selectionState) return
      const current = this.getWorldPointFromEvent(event)
      this.selectionState = {
        ...this.selectionState,
        currentX: current.x,
        currentY: current.y
      }
      this.selectedNodeIds = this.findNodesInSelectionBox()
    },

    stopAreaSelection() {
      if (!this.selectionState) return
      this.selectedNodeIds = this.findNodesInSelectionBox()
      this.selectionState = null
      this.removeAreaSelectionListeners()
      if (this.selectedNodeIds.length) {
        this.activePanel = 'inspector'
      }
    },

    removeAreaSelectionListeners() {
      window.removeEventListener('mousemove', this.onAreaSelection)
      window.removeEventListener('mouseup', this.stopAreaSelection)
    },

    getSelectionBounds() {
      if (!this.selectionState) return null
      const left = Math.min(this.selectionState.startX, this.selectionState.currentX)
      const top = Math.min(this.selectionState.startY, this.selectionState.currentY)
      const right = Math.max(this.selectionState.startX, this.selectionState.currentX)
      const bottom = Math.max(this.selectionState.startY, this.selectionState.currentY)
      return {
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top
      }
    },

    getSelectionBoxStyle() {
      const bounds = this.getSelectionBounds()
      if (!bounds) return {}
      return {
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`
      }
    },

    findNodesInSelectionBox() {
      const bounds = this.getSelectionBounds()
      if (!bounds) return []
      return this.flowchartData.nodes
        .filter(node => {
          const left = Number(node.x || 0)
          const top = Number(node.y || 0)
          const right = left + Number(node.width || 0)
          const bottom = top + Number(node.height || 0)
          return (
            right >= bounds.left &&
            left <= bounds.right &&
            bottom >= bounds.top &&
            top <= bounds.bottom
          )
        })
        .map(node => node.id)
    },

    snapPositionToGrid(position) {
      if (!this.flowchartConfig.snapToGrid) {
        return position
      }
      const gridSize = Number(this.flowchartConfig.gridSize || 24)
      if (!Number.isFinite(gridSize) || gridSize <= 1) {
        return position
      }
      return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize
      }
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

    async persistFlowchartState({
      dirty = true,
      autoSave = true,
      recordHistory = true
    } = {}) {
      if (recordHistory) {
        this.commitFlowchartHistorySnapshot()
      }
      await saveBootstrapStatePatch({
        flowchartData: cloneJson(this.flowchartData),
        flowchartConfig: cloneJson(this.flowchartConfig)
      })
      markDocumentDirty(dirty)
      if (dirty && this.currentDocument?.path) {
        this.queueRecoveryDraftWrite()
      }
      if (autoSave && this.currentDocument?.path) {
        this.queueAutoSave()
      }
    },

    queueRecoveryDraftWrite() {
      if (this.recoveryTimer) {
        clearTimeout(this.recoveryTimer)
      }
      this.recoveryTimer = window.setTimeout(() => {
        this.recoveryTimer = 0
        void this.writeRecoveryDraft()
      }, 500)
    },

    async writeRecoveryDraft() {
      if (!this.currentDocument?.path) {
        return
      }
      try {
        await writeRecoveryDraftForFile({
          fileRef: {
            ...this.currentDocument,
            documentMode: 'flowchart'
          },
          data: cloneJson(this.flowchartData),
          config: cloneJson(this.flowchartConfig),
          isFullDataFile: true,
          documentMode: 'flowchart'
        })
      } catch (error) {
        console.error('writeFlowchartRecoveryDraft failed', error)
      }
    },

    queueAutoSave() {
      if (this.persistTimer) {
        clearTimeout(this.persistTimer)
      }
      this.persistTimer = window.setTimeout(() => {
        this.persistTimer = 0
        void this.saveCurrentFile({
          silent: true
        }).catch(error => {
          console.error('autoSaveFlowchart failed', error)
        })
      }, 900)
    },

    async confirmPotentialFlowchartLeave() {
      if (!this.hasPotentialUnsavedFlowchart) {
        return true
      }
      try {
        await this.$confirm(
          this.$t('toolbar.leaveConfirmReturnHomeMessage'),
          this.$t('toolbar.leaveConfirmReturnHomeTitle'),
          {
            type: 'warning'
          }
        )
        return true
      } catch (_error) {
        return false
      }
    },

    onBeforeUnload(event) {
      if (!this.hasPotentialUnsavedFlowchart) {
        return undefined
      }
      const message = this.$t('toolbar.unsavedData')
      event.returnValue = message
      return message
    },

    selectNode(nodeId, event) {
      const isAppend = !!(event?.shiftKey || event?.ctrlKey || event?.metaKey)
      if (isAppend) {
        const nextIds = this.selectedNodeIds.includes(nodeId)
          ? this.selectedNodeIds.filter(id => id !== nodeId)
          : [...this.selectedNodeIds, nodeId]
        this.selectedNodeIds = nextIds
      } else {
        this.selectedNodeIds = [nodeId]
      }
      this.selectedEdgeId = ''
      this.activePanel = 'inspector'
    },

    selectEdge(edgeId) {
      this.selectedEdgeId = edgeId
      this.selectedNodeIds = []
      this.activePanel = 'inspector'
    },

    clearSelection() {
      this.selectedNodeIds = []
      this.selectedEdgeId = ''
    },

    togglePanel(panel) {
      this.activePanel = this.activePanel === panel ? '' : panel
    },

    toggleShortcutHelp() {
      this.togglePanel('shortcuts')
    },

    isTextEditingTarget(target) {
      const tagName = String(target?.tagName || '').toLowerCase()
      return (
        tagName === 'input' ||
        tagName === 'select' ||
        tagName === 'textarea' ||
        target?.isContentEditable
      )
    },

    handleGlobalKeydown(event) {
      if (this.isTextEditingTarget(event.target)) {
        return
      }
      const isMetaKey = event.ctrlKey || event.metaKey
      if (isMetaKey && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          this.redoFlowchartChange()
        } else {
          this.undoFlowchartChange()
        }
        return
      }
      if (isMetaKey && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        this.redoFlowchartChange()
        return
      }
      if (isMetaKey && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        this.selectAllNodes()
        return
      }
      if (isMetaKey && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        this.duplicateSelectedNodes()
        return
      }
      if (event.key === '?') {
        event.preventDefault()
        this.toggleShortcutHelp()
        return
      }
      if (event.altKey && event.shiftKey && event.key.startsWith('Arrow')) {
        event.preventDefault()
        this.cloneAndConnectSelectedNode(event.key)
        return
      }
      if (isMetaKey && event.key.toLowerCase() === 'c') {
        event.preventDefault()
        this.copySelectedNodes()
        return
      }
      if (isMetaKey && event.key.toLowerCase() === 'v') {
        event.preventDefault()
        this.pasteCopiedNodes()
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (this.selectedNodeIds.length || this.selectedEdgeId) {
          event.preventDefault()
          this.removeSelection()
        }
      }
      if (event.key.startsWith('Arrow') && this.selectedNodeIds.length) {
        event.preventDefault()
        this.nudgeSelectedNodes(event.key, event)
      }
    },

    addNodeByType(type = 'process') {
      const typeDef = FLOWCHART_NODE_TYPES.find(item => item.type === type)
      const offset = this.flowchartData.nodes.length
      const size = this.getDefaultNodeSizeByType(type)
      this.flowchartData.nodes.push({
        id: createNodeId(type),
        type,
        text: typeDef?.label || '新节点',
        x: 120 + (offset % 3) * 220,
        y: 120 + Math.floor(offset / 3) * 120,
        width: size.width,
        height: size.height,
        style: {}
      })
      this.selectedNodeIds = [this.flowchartData.nodes[this.flowchartData.nodes.length - 1].id]
      this.selectedEdgeId = ''
      this.activePanel = 'inspector'
      void this.persistFlowchartState()
    },

    getDefaultNodeSizeByType(type = 'process') {
      if (type === 'decision') {
        return {
          width: 176,
          height: 92
        }
      }
      if (type === 'start' || type === 'end') {
        return {
          width: 140,
          height: 56
        }
      }
      return {
        width: 168,
        height: 72
      }
    },

    updateSelectedNodeType(type) {
      if (!this.selectedNode) return
      const normalizedType = FLOWCHART_NODE_TYPES.some(item => item.type === type)
        ? type
        : 'process'
      const size = this.getDefaultNodeSizeByType(normalizedType)
      this.selectedNode.type = normalizedType
      this.selectedNode.width = size.width
      this.selectedNode.height = size.height
      void this.persistFlowchartState()
    },

    connectSelectedNodes() {
      if (this.selectedNodeIds.length < 2) {
        this.$message.warning(this.$t('flowchart.connectNeedTwoNodes'))
        return
      }
      const [source, target] = this.selectedNodeIds.slice(-2)
      const existingEdge = this.flowchartData.edges.find(edge => {
        return edge.source === source && edge.target === target
      })
      const targetEdge = existingEdge || {
        id: createNodeId('edge'),
        source,
        target,
        label: '',
        style: {}
      }
      if (!existingEdge) {
        this.flowchartData.edges.push(targetEdge)
      }
      this.selectedEdgeId = targetEdge.id
      this.activePanel = 'inspector'
      this.$message.success(this.$t('flowchart.connectSuccess'))
      void this.persistFlowchartState()
    },

    copySelectedNodes() {
      const selectedNodes = this.getSelectedNodes()
      if (!selectedNodes.length) {
        this.$message.warning(this.$t('flowchart.copyNeedSelection'))
        return
      }
      const selectedSet = new Set(selectedNodes.map(node => node.id))
      const copiedEdges = this.flowchartData.edges.filter(edge => {
        return selectedSet.has(edge.source) && selectedSet.has(edge.target)
      })
      this.flowchartClipboard = {
        nodes: cloneJson(selectedNodes),
        copiedEdges: cloneJson(copiedEdges)
      }
      this.$message.success(this.$t('flowchart.copySuccess'))
    },

    pasteCopiedNodes() {
      if (!this.flowchartClipboard?.nodes?.length) {
        this.$message.warning(this.$t('flowchart.pasteEmpty'))
        return
      }
      const sourceIdMap = new Map()
      const pastedNodes = this.flowchartClipboard.nodes.map(node => {
        const nextId = createNodeId(node.type || 'node')
        sourceIdMap.set(node.id, nextId)
        return {
          ...cloneJson(node),
          id: nextId,
          x: Number(node.x || 0) + 36,
          y: Number(node.y || 0) + 36
        }
      })
      const copiedEdges = this.flowchartClipboard.copiedEdges || []
      const pastedEdges = copiedEdges
        .map(edge => {
          const source = sourceIdMap.get(edge.source)
          const target = sourceIdMap.get(edge.target)
          if (!source || !target) return null
          return {
            ...cloneJson(edge),
            id: createNodeId('edge'),
            source,
            target
          }
        })
        .filter(Boolean)
      this.flowchartData.nodes.push(...pastedNodes)
      this.flowchartData.edges.push(...pastedEdges)
      this.selectedNodeIds = pastedNodes.map(node => node.id)
      this.selectedEdgeId = ''
      this.activePanel = 'inspector'
      void this.persistFlowchartState()
      this.$message.success(this.$t('flowchart.pasteSuccess'))
    },

    getSelectedNodes() {
      const selectedSet = new Set(this.selectedNodeIds)
      return this.flowchartData.nodes.filter(node => selectedSet.has(node.id))
    },

    selectAllNodes() {
      this.selectedNodeIds = this.flowchartData.nodes.map(node => node.id)
      this.selectedEdgeId = ''
      this.activePanel = 'inspector'
    },

    duplicateSelectedNodes() {
      const selectedNodes = this.getSelectedNodes()
      if (!selectedNodes.length) {
        this.$message.warning(this.$t('flowchart.copyNeedSelection'))
        return
      }
      const selectedSet = new Set(selectedNodes.map(node => node.id))
      const sourceIdMap = new Map()
      const duplicatedNodes = selectedNodes.map(node => {
        const nextId = createNodeId(node.type || 'node')
        sourceIdMap.set(node.id, nextId)
        return {
          ...cloneJson(node),
          id: nextId,
          x: Number(node.x || 0) + 48,
          y: Number(node.y || 0) + 48
        }
      })
      const duplicatedEdges = this.flowchartData.edges
        .filter(edge => selectedSet.has(edge.source) && selectedSet.has(edge.target))
        .map(edge => ({
          ...cloneJson(edge),
          id: createNodeId('edge'),
          source: sourceIdMap.get(edge.source),
          target: sourceIdMap.get(edge.target)
        }))
        .filter(edge => edge.source && edge.target)
      this.flowchartData.nodes.push(...duplicatedNodes)
      this.flowchartData.edges.push(...duplicatedEdges)
      this.selectedNodeIds = duplicatedNodes.map(node => node.id)
      this.selectedEdgeId = ''
      this.activePanel = 'inspector'
      void this.persistFlowchartState()
      this.$message.success(this.$t('flowchart.duplicateSuccess'))
    },

    cloneAndConnectSelectedNode(direction) {
      const selectedNodes = this.getSelectedNodes()
      if (selectedNodes.length !== 1) {
        this.$message.warning(this.$t('flowchart.quickConnectNeedOneNode'))
        return false
      }
      const sourceNode = selectedNodes[0]
      const gap = 96
      const deltaMap = {
        ArrowUp: {
          x: 0,
          y: -(Number(sourceNode.height || 0) + gap)
        },
        ArrowDown: {
          x: 0,
          y: Number(sourceNode.height || 0) + gap
        },
        ArrowLeft: {
          x: -(Number(sourceNode.width || 0) + gap),
          y: 0
        },
        ArrowRight: {
          x: Number(sourceNode.width || 0) + gap,
          y: 0
        }
      }
      const delta = deltaMap[direction]
      if (!delta) {
        return false
      }
      const nextId = createNodeId(sourceNode.type || 'node')
      const position = this.snapPositionToGrid({
        x: Number(sourceNode.x || 0) + delta.x,
        y: Number(sourceNode.y || 0) + delta.y
      })
      this.flowchartData.nodes.push({
        ...cloneJson(sourceNode),
        id: nextId,
        x: position.x,
        y: position.y
      })
      this.flowchartData.edges.push({
        id: createNodeId('edge'),
        source: sourceNode.id,
        target: nextId,
        label: '',
        style: {}
      })
      this.selectedNodeIds = [nextId]
      this.selectedEdgeId = ''
      this.activePanel = 'inspector'
      void this.persistFlowchartState()
      this.$message.success(this.$t('flowchart.quickConnectSuccess'))
      return true
    },

    getKeyboardNudgeStep(event = {}) {
      const gridSize = Number(this.flowchartConfig.gridSize || 24)
      const baseStep =
        this.flowchartConfig.snapToGrid && Number.isFinite(gridSize) && gridSize > 1
          ? gridSize
          : 8
      if (event.altKey) {
        return 1
      }
      return event.shiftKey ? baseStep * 4 : baseStep
    },

    nudgeSelectedNodes(direction, event = {}) {
      const selectedNodes = this.getSelectedNodes()
      if (!selectedNodes.length) {
        return false
      }
      const step = this.getKeyboardNudgeStep(event)
      const delta = {
        ArrowUp: { x: 0, y: -step },
        ArrowDown: { x: 0, y: step },
        ArrowLeft: { x: -step, y: 0 },
        ArrowRight: { x: step, y: 0 }
      }[direction]
      if (!delta) {
        return false
      }
      selectedNodes.forEach(node => {
        node.x = Number(node.x || 0) + delta.x
        node.y = Number(node.y || 0) + delta.y
      })
      void this.persistFlowchartState()
      return true
    },

    alignSelectedNodesLeft() {
      const selectedNodes = this.getSelectedNodes()
      if (selectedNodes.length < 2) {
        this.$message.warning(this.$t('flowchart.alignNeedTwoNodes'))
        return
      }
      const left = Math.min(...selectedNodes.map(node => Number(node.x || 0)))
      selectedNodes.forEach(node => {
        const snappedPosition = this.snapPositionToGrid({
          x: left,
          y: Number(node.y || 0)
        })
        node.x = snappedPosition.x
        node.y = snappedPosition.y
      })
      void this.persistFlowchartState()
    },

    distributeSelectedNodesHorizontally() {
      const selectedNodes = this.getSelectedNodes()
      if (selectedNodes.length < 3) {
        this.$message.warning(this.$t('flowchart.distributeNeedThreeNodes'))
        return
      }
      const sortedNodes = [...selectedNodes].sort((a, b) => {
        return Number(a.x || 0) - Number(b.x || 0)
      })
      const first = sortedNodes[0]
      const last = sortedNodes[sortedNodes.length - 1]
      const startX = Number(first.x || 0)
      const endX = Number(last.x || 0)
      const step = (endX - startX) / (sortedNodes.length - 1)
      sortedNodes.forEach((node, index) => {
        const snappedPosition = this.snapPositionToGrid({
          x: startX + step * index,
          y: Number(node.y || 0)
        })
        node.x = snappedPosition.x
        node.y = snappedPosition.y
      })
      void this.persistFlowchartState()
    },

    distributeSelectedNodesVertically() {
      const selectedNodes = this.getSelectedNodes()
      if (selectedNodes.length < 3) {
        this.$message.warning(this.$t('flowchart.distributeNeedThreeNodes'))
        return
      }
      const sortedNodes = [...selectedNodes].sort((a, b) => {
        return Number(a.y || 0) - Number(b.y || 0)
      })
      const first = sortedNodes[0]
      const last = sortedNodes[sortedNodes.length - 1]
      const startY = Number(first.y || 0)
      const endY = Number(last.y || 0)
      const step = (endY - startY) / (sortedNodes.length - 1)
      sortedNodes.forEach((node, index) => {
        const snappedPosition = this.snapPositionToGrid({
          x: Number(node.x || 0),
          y: startY + step * index
        })
        node.x = snappedPosition.x
        node.y = snappedPosition.y
      })
      void this.persistFlowchartState()
    },

    applyTemplate(templateId = 'blank') {
      this.flowchartData = createDefaultFlowchartData(
        this.flowchartData.title || this.$t('flowchart.fileNameFallback'),
        templateId
      )
      this.selectedNodeIds = []
      this.selectedEdgeId = ''
      this.$nextTick(() => {
        this.fitCanvasToView({
          persist: false
        })
        void this.persistFlowchartState()
      })
      this.$message.success(this.$t('flowchart.templateApplied'))
    },

    async exportAsSvg() {
      const svg = this.buildSvgMarkup()
      await platform.saveTextFileAs({
        suggestedName: this.getDocumentBaseName(),
        content: svg,
        defaultPath: this.currentDocument?.path || '',
        extension: 'svg',
        name: 'SVG 文件',
        mimeType: 'image/svg+xml;charset=utf-8'
      })
      this.$message.success(this.$t('flowchart.exportSvgDone'))
    },

    async exportAsPng() {
      const svgMarkup = this.buildSvgMarkup()
      const blob = new Blob([svgMarkup], {
        type: 'image/svg+xml;charset=utf-8'
      })
      const url = URL.createObjectURL(blob)
      try {
        const image = await this.loadImage(url)
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1280, image.width)
        canvas.height = Math.max(720, image.height)
        const context = canvas.getContext('2d')
        context.fillStyle = this.isDark ? '#171a1f' : '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `${this.getDocumentBaseName()}.png`
        link.click()
        this.$message.success(this.$t('flowchart.exportPngDone'))
      } finally {
        URL.revokeObjectURL(url)
      }
    },

    convertCurrentMindMap() {
      const bootstrapState = getBootstrapState()
      if (!hasConvertibleMindMapData(bootstrapState.mindMapData)) {
        this.$message.warning(this.$t('flowchart.noMindMapToConvert'))
        return
      }
      const nextDocument = convertMindMapToFlowchart(bootstrapState.mindMapData, {
        title: this.flowchartData.title || this.$t('flowchart.fileNameFallback')
      })
      this.applyGeneratedFlowchart(nextDocument)
      this.$message.success(this.$t('flowchart.mindMapConverted'))
    },

    async importMindMapFile() {
      try {
        const fileRef = await platform.openMindMapFile({
          defaultPath: getLastDirectory()
        })
        if (!fileRef) return
        const resolved = await resolveFileContentWithRecovery(fileRef, fileRef.content)
        const parsedDocument = parseStoredDocumentContent(resolved.content)
        if (
          parsedDocument.documentMode === 'flowchart' ||
          !hasConvertibleMindMapData(parsedDocument.mindMapData)
        ) {
          this.$message.warning(this.$t('flowchart.importMindMapFileInvalid'))
          return
        }
        const nextDocument = convertMindMapToFlowchart(parsedDocument.mindMapData, {
          title: this.flowchartData.title || this.$t('flowchart.fileNameFallback')
        })
        this.applyGeneratedFlowchart(nextDocument)
        this.$message.success(this.$t('flowchart.importMindMapFileDone'))
      } catch (error) {
        const normalizedError = createDesktopFsError(error)
        this.$message.error(
          normalizedError.message || this.$t('flowchart.importMindMapFileFailed')
        )
      }
    },

    async generateWithAi() {
      if (this.isGenerating) return
      let prompt
      try {
        const result = await this.$prompt(
          this.$t('flowchart.aiPromptMessage'),
          this.$t('flowchart.aiPromptTitle'),
          {
            inputPlaceholder: this.$t('flowchart.aiPromptPlaceholder')
          }
        )
        prompt = String(result.value || '').trim()
      } catch (_error) {
        return
      }
      if (!prompt) return
      try {
        await checkAiAvailability({
          aiConfig: this.aiConfig,
          t: this.$t,
          desktop: isDesktopApp()
        })
      } catch (error) {
        this.$message.error(error?.message || this.$t('ai.connectFailed'))
        return
      }
      this.aiBuffer = ''
      this.isGenerating = true
      this.$message.info(this.$t('flowchart.aiGenerating'))
      requestAiStream({
        aiConfig: this.aiConfig,
        messages: buildAiCreateFlowchartMessages({
          input: prompt,
          t: this.$t
        }),
        progress: chunk => {
          this.aiBuffer += String(chunk || '')
        },
        end: () => {
          try {
            const result = normalizeFlowchartAiResult(this.aiBuffer)
            this.applyGeneratedFlowchart(result)
            this.$message.success(this.$t('flowchart.aiGenerated'))
          } catch (error) {
            this.$message.error(error?.message || this.$t('ai.generationFailed'))
          } finally {
            this.isGenerating = false
          }
        },
        error: error => {
          this.isGenerating = false
          this.$message.error(error?.message || this.$t('ai.generationFailed'))
        }
      })
    },

    applyGeneratedFlowchart(result) {
      const normalized = normalizeFlowchartAiResult(result)
      this.flowchartData = cloneJson(normalized.flowchartData)
      this.flowchartConfig = cloneJson(normalized.flowchartConfig || {})
      this.selectedNodeIds = []
      this.selectedEdgeId = ''
      void this.persistFlowchartState()
    },

    async saveCurrentFile({ silent = false } = {}) {
      try {
        if (!this.currentDocument?.path) {
          await this.saveAsFile({
            silent
          })
          return true
        }
        const serialized = this.serializeCurrentDocument()
        await platform.writeMindMapFile(
          {
            ...this.currentDocument,
            documentMode: 'flowchart'
          },
          serialized
        )
        await recordRecentFile({
          ...this.currentDocument,
          documentMode: 'flowchart'
        })
        setCurrentFileRef(
          {
            ...this.currentDocument,
            documentMode: 'flowchart',
            isFullDataFile: true
          },
          this.currentDocument.source || 'desktop'
        )
        if (this.recoveryTimer) {
          clearTimeout(this.recoveryTimer)
          this.recoveryTimer = 0
        }
        try {
          await clearRecoveryDraftForFile({
            ...this.currentDocument,
            documentMode: 'flowchart'
          })
        } catch (error) {
          console.error('clearFlowchartRecoveryDraft failed', error)
        }
        markDocumentDirty(false)
        if (!silent) {
          this.$message.success(this.$t('flowchart.saveSuccess'))
        }
        return true
      } catch (error) {
        const normalizedError = createDesktopFsError(error)
        if (!silent) {
          this.$message.error(
            normalizedError.message || this.$t('home.actionFailed')
          )
        } else {
          console.error('saveFlowchartCurrentFile failed', error)
        }
        return false
      }
    },

    async saveAsFile({ silent = false } = {}) {
      const previousFileRef = this.currentDocument
        ? {
            ...this.currentDocument,
            documentMode: 'flowchart'
          }
        : null
      try {
        const { createWorkspaceFlowchartFile } = await import(
          '@/services/workspaceActions'
        )
        await createWorkspaceFlowchartFile({
          router: this.$router,
          content: cloneJson(this.flowchartData),
          config: cloneJson(this.flowchartConfig),
          suggestedName: this.getDocumentBaseName()
        })
        if (previousFileRef?.path) {
          try {
            await clearRecoveryDraftForFile(previousFileRef)
          } catch (error) {
            console.error('clearPreviousFlowchartRecoveryDraft failed', error)
          }
        }
        if (!silent) {
          this.$message.success(this.$t('flowchart.saveAsSuccess'))
        }
        return true
      } catch (error) {
        const normalizedError = createDesktopFsError(error)
        if (!silent) {
          this.$message.error(
            normalizedError.message || this.$t('home.actionFailed')
          )
        } else {
          console.error('saveFlowchartAsFile failed', error)
        }
        return false
      }
    },

    serializeCurrentDocument() {
      return serializeStoredDocumentContent({
        documentMode: 'flowchart',
        data: this.flowchartData,
        config: this.flowchartConfig
      })
    },

    getDocumentBaseName() {
      const raw = String(
        this.currentDocument?.name ||
          this.flowchartData.title ||
          this.$t('flowchart.fileNameFallback')
      ).trim()
      return raw.replace(/\.[^.]+$/u, '') || this.$t('flowchart.fileNameFallback')
    },

    async goHome() {
      if (!(await this.confirmPotentialFlowchartLeave())) {
        return
      }
      await this.$router.push('/home')
    },

    updateSelectedNodeText(value) {
      if (!this.selectedNode) return
      this.selectedNode.text = String(value || '').trim() || this.selectedNode.text
      void this.persistFlowchartState()
    },

    updateSelectedEdgeLabel(value) {
      if (!this.selectedEdge) return
      this.selectedEdge.label = String(value || '')
      void this.persistFlowchartState()
    },

    async editNodeText(nodeId) {
      const targetNode = this.flowchartData.nodes.find(node => node.id === nodeId)
      if (!targetNode) return
      try {
        const result = await this.$prompt(
          this.$t('flowchart.nodeText'),
          this.$t('flowchart.inspectorTitle'),
          {
            inputValue: targetNode.text
          }
        )
        targetNode.text = String(result.value || '').trim() || targetNode.text
        void this.persistFlowchartState()
      } catch (_error) {
        return
      }
    },

    removeSelection() {
      if (!this.selectedEdgeId && !this.selectedNodeIds.length) {
        this.$message.warning(this.$t('flowchart.selectionEmpty'))
        return
      }
      if (this.selectedEdgeId) {
        this.flowchartData.edges = this.flowchartData.edges.filter(edge => edge.id !== this.selectedEdgeId)
        this.selectedEdgeId = ''
      }
      if (this.selectedNodeIds.length) {
        const selectedSet = new Set(this.selectedNodeIds)
        this.flowchartData.nodes = this.flowchartData.nodes.filter(node => !selectedSet.has(node.id))
        this.flowchartData.edges = this.flowchartData.edges.filter(edge => {
          return !selectedSet.has(edge.source) && !selectedSet.has(edge.target)
        })
        this.selectedNodeIds = []
      }
      this.$message.success(this.$t('flowchart.deleteSuccess'))
      void this.persistFlowchartState()
    },

    startNodeDrag(event, node) {
      const isAppendSelectionDrag = !!(event.shiftKey || event.ctrlKey || event.metaKey)
      if (isAppendSelectionDrag && !this.selectedNodeIds.includes(node.id)) {
        return
      }
      const selectedIds = this.selectedNodeIds.includes(node.id)
        ? [...this.selectedNodeIds]
        : [node.id]
      this.selectedNodeIds = selectedIds
      this.selectedEdgeId = ''
      this.dragState = {
        primaryId: node.id,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        nodes: selectedIds
          .map(id => this.flowchartData.nodes.find(item => item.id === id))
          .filter(Boolean)
          .map(item => ({
            id: item.id,
            x: item.x,
            y: item.y
          }))
      }
      window.addEventListener('mousemove', this.onNodeDrag)
      window.addEventListener('mouseup', this.stopNodeDrag)
    },

    onNodeDrag(event) {
      if (!this.dragState) return
      const viewport = this.getViewport()
      const deltaX = (event.clientX - this.dragState.startX) / viewport.zoom
      const deltaY = (event.clientY - this.dragState.startY) / viewport.zoom
      const primarySnapshot =
        this.dragState.nodes.find(snapshot => snapshot.id === this.dragState.primaryId) ||
        this.dragState.nodes[0]
      const primaryNode = this.flowchartData.nodes.find(node => {
        return node.id === primarySnapshot?.id
      })
      const alignmentSnap = this.computeAlignmentSnap({
        node: primaryNode,
        x: Number(primarySnapshot?.x || 0) + deltaX,
        y: Number(primarySnapshot?.y || 0) + deltaY,
        selectedIds: this.selectedNodeIds
      })
      const adjustedDeltaX = deltaX + alignmentSnap.offsetX
      const adjustedDeltaY = deltaY + alignmentSnap.offsetY
      this.alignmentGuides = alignmentSnap.guides
      let didMoveNode = false
      this.dragState.nodes.forEach(snapshot => {
        const currentNode = this.flowchartData.nodes.find(node => node.id === snapshot.id)
        if (!currentNode) return
        const snappedPosition = this.snapPositionToGrid({
          x: snapshot.x + adjustedDeltaX,
          y: snapshot.y + adjustedDeltaY
        })
        didMoveNode =
          didMoveNode ||
          Number(currentNode.x || 0) !== snappedPosition.x ||
          Number(currentNode.y || 0) !== snappedPosition.y
        currentNode.x = snappedPosition.x
        currentNode.y = snappedPosition.y
      })
      this.dragState.moved = this.dragState.moved || didMoveNode
    },

    stopNodeDrag() {
      if (!this.dragState) return
      const shouldPersist = this.dragState.moved
      this.dragState = null
      this.clearAlignmentGuides()
      this.removeDragListeners()
      if (shouldPersist) {
        void this.persistFlowchartState()
      }
    },

    removeDragListeners() {
      window.removeEventListener('mousemove', this.onNodeDrag)
      window.removeEventListener('mouseup', this.stopNodeDrag)
    },

    getFlowchartExportBounds() {
      if (!this.flowchartData.nodes.length) {
        return {
          x: 0,
          y: 0,
          width: 1200,
          height: 720
        }
      }
      const padding = 120
      const bounds = this.flowchartData.nodes.reduce(
        (result, node) => ({
          minX: Math.min(result.minX, Number(node.x || 0)),
          minY: Math.min(result.minY, Number(node.y || 0)),
          maxX: Math.max(
            result.maxX,
            Number(node.x || 0) + Number(node.width || 0)
          ),
          maxY: Math.max(
            result.maxY,
            Number(node.y || 0) + Number(node.height || 0)
          )
        }),
        {
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity
        }
      )
      return {
        x: Math.floor(bounds.minX - padding),
        y: Math.floor(bounds.minY - padding),
        width: Math.max(1200, Math.ceil(bounds.maxX - bounds.minX + padding * 2)),
        height: Math.max(720, Math.ceil(bounds.maxY - bounds.minY + padding * 2))
      }
    },

    buildSvgMarkup() {
      const bounds = this.getFlowchartExportBounds()
      const edges = this.edgesWithLayout
        .map(edge => {
          return `<g><path d="${edge.path}" fill="none" stroke="#64748b" stroke-width="2"/><text x="${edge.labelX}" y="${edge.labelY}" font-size="12" fill="#475569" text-anchor="middle">${escapeXml(edge.label)}</text></g>`
        })
        .join('')
      const nodes = this.flowchartData.nodes
        .map(node => {
          return `<g>${buildSvgNodeShapeMarkup(node, this.isDark)}<text x="${
            node.x + node.width / 2
          }" y="${node.y + node.height / 2 + 5}" font-size="14" fill="${
            this.isDark ? '#f8fafc' : '#111827'
          }" text-anchor="middle">${escapeXml(node.text)}</text></g>`
        })
        .join('')
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"><rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${
        this.isDark ? '#171a1f' : '#ffffff'
      }"/>${edges}${nodes}</svg>`
    },

    loadImage(url) {
      return new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = url
      })
    }
  }
}
</script>

<style lang="less" scoped>
.flowchartEditor {
  --flowchart-bg: #f5f7fb;
  --flowchart-panel-bg: rgba(255, 255, 255, 0.9);
  --flowchart-panel-border: rgba(15, 23, 42, 0.08);
  --flowchart-panel-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
  --flowchart-dock-bg: rgba(255, 255, 255, 0.92);
  --flowchart-dock-border: rgba(15, 23, 42, 0.08);
  --flowchart-dock-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
  --flowchart-dock-active-bg: rgba(37, 99, 235, 0.1);
  --flowchart-dock-active-text: #1d4ed8;
  --flowchart-text: rgba(15, 23, 42, 0.92);
  --flowchart-subtle-text: #6b7280;
  --flowchart-toolbar-bg: rgba(255, 255, 255, 0.88);
  --flowchart-toolbar-border: rgba(15, 23, 42, 0.08);
  --flowchart-toolbar-btn-bg: transparent;
  --flowchart-toolbar-btn-hover: rgba(15, 23, 42, 0.06);
  --flowchart-node-bg: #ffffff;
  --flowchart-node-border: #cbd5e1;
  --flowchart-node-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  --flowchart-canvas-grid: rgba(15, 23, 42, 0.05);
  --flowchart-selection: #2563eb;
  --flowchart-selection-ring: rgba(37, 99, 235, 0.18);
  --flowchart-overlay: rgba(15, 23, 42, 0.2);
  min-height: 100vh;
  background: var(--flowchart-bg);
  color: var(--flowchart-text);
}

.flowchartEditor.isDark {
  --flowchart-bg: #11161d;
  --flowchart-panel-bg: rgba(24, 28, 34, 0.92);
  --flowchart-panel-border: rgba(255, 255, 255, 0.08);
  --flowchart-panel-shadow: 0 18px 36px rgba(0, 0, 0, 0.28);
  --flowchart-dock-bg: rgba(24, 28, 34, 0.94);
  --flowchart-dock-border: rgba(255, 255, 255, 0.08);
  --flowchart-dock-shadow: 0 18px 36px rgba(0, 0, 0, 0.28);
  --flowchart-dock-active-bg: rgba(96, 165, 250, 0.14);
  --flowchart-dock-active-text: #93c5fd;
  --flowchart-text: rgba(255, 255, 255, 0.92);
  --flowchart-subtle-text: rgba(255, 255, 255, 0.56);
  --flowchart-toolbar-bg: rgba(24, 28, 34, 0.9);
  --flowchart-toolbar-border: rgba(255, 255, 255, 0.08);
  --flowchart-toolbar-btn-bg: transparent;
  --flowchart-toolbar-btn-hover: rgba(255, 255, 255, 0.1);
  --flowchart-node-bg: #1f2937;
  --flowchart-node-border: rgba(255, 255, 255, 0.16);
  --flowchart-node-shadow: 0 10px 30px rgba(0, 0, 0, 0.24);
  --flowchart-canvas-grid: rgba(255, 255, 255, 0.04);
  --flowchart-selection: #60a5fa;
  --flowchart-selection-ring: rgba(96, 165, 250, 0.22);
  --flowchart-overlay: rgba(2, 6, 23, 0.46);
}

.flowchartToolbarShell {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1200;
  background: var(--flowchart-toolbar-bg);
  border-bottom: 1px solid var(--flowchart-toolbar-border);
  backdrop-filter: blur(18px);
}

.flowchartToolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 0 16px;
  font-size: 12px;
  color: var(--flowchart-subtle-text);
}

.flowchartToolbarGroup {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.flowchartToolbarGroup.isPrimary {
  flex: 1 1 auto;
}

.flowchartToolbarGroup.isSecondary {
  flex: 0 1 auto;
}

.flowchartToolbarBtn {
  border: none;
  background: var(--flowchart-toolbar-btn-bg);
  color: inherit;
  border-radius: 8px;
  padding: 8px 10px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: var(--flowchart-toolbar-btn-hover);
    color: var(--flowchart-text);
  }
}

.flowchartStage {
  position: relative;
  min-height: 100vh;
  padding-top: 56px;
}

.flowchartCanvasShell {
  min-height: calc(100vh - 56px);
}

.flowchartCanvasViewport {
  position: relative;
  min-height: calc(100vh - 56px);
  overflow: hidden;
  isolation: isolate;
  cursor: grab;
  background-color: var(--flowchart-bg);
  background-image:
    linear-gradient(var(--flowchart-canvas-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--flowchart-canvas-grid) 1px, transparent 1px);
  background-size: 24px 24px;
}

.flowchartCanvasViewport.isPanning {
  cursor: grabbing;
}

.flowchartCanvasWorld {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.flowchartSelectionBox {
  position: absolute;
  z-index: 8;
  pointer-events: none;
  border: 1px solid var(--flowchart-selection);
  border-radius: 8px;
  background: var(--flowchart-selection-ring);
  box-shadow: 0 0 0 1px var(--flowchart-selection-ring);
}

.flowchartViewportToolbar {
  position: fixed;
  right: 90px;
  bottom: 24px;
  z-index: 24;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--flowchart-dock-border);
  border-radius: 18px;
  background: var(--flowchart-dock-bg);
  box-shadow: var(--flowchart-dock-shadow);
  backdrop-filter: blur(18px);
}

.flowchartViewportBtn {
  min-width: 34px;
  height: 32px;
  padding: 0 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--flowchart-subtle-text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease;

  &:hover {
    color: var(--flowchart-text);
    background: var(--flowchart-toolbar-btn-hover);
  }
}

.flowchartViewportBtn.isLabel {
  min-width: 54px;
}

.flowchartDockRail {
  position: fixed;
  top: 50%;
  right: 16px;
  z-index: 28;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transform: translateY(-50%);
}

.flowchartDockTrigger {
  width: 58px;
  min-height: 78px;
  padding: 12px 8px;
  border: 1px solid var(--flowchart-dock-border);
  border-radius: 18px;
  background: var(--flowchart-dock-bg);
  color: var(--flowchart-subtle-text);
  box-shadow: var(--flowchart-dock-shadow);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;

  &:hover,
  &.isActive {
    color: var(--flowchart-dock-active-text);
    border-color: var(--flowchart-selection-ring);
    background: var(--flowchart-dock-active-bg);
    transform: translateX(-3px);
  }
}

.flowchartDockGlyph {
  font-size: 22px;
  line-height: 1;
}

.flowchartDockText {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
}

.flowchartPanelBackdrop {
  display: none;
}

.flowchartFloatingPanel {
  position: fixed;
  top: 88px;
  right: 88px;
  z-index: 30;
  width: 248px;
  max-height: calc(100vh - 112px);
  overflow: auto;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--flowchart-panel-border);
  background: var(--flowchart-panel-bg);
  box-shadow: var(--flowchart-panel-shadow);
  backdrop-filter: blur(18px);
}

.flowchartInspectorPanel {
  width: 280px;
}

.flowchartShortcutPanel {
  width: 320px;
}

.flowchartPanelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.flowchartPanelTitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--flowchart-text);
}

.flowchartPanelClose {
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: transparent;
  color: var(--flowchart-subtle-text);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease;

  &:hover {
    color: var(--flowchart-text);
    background: var(--flowchart-toolbar-btn-hover);
  }
}

.flowchartButtonGrid,
.flowchartPanelActions {
  display: grid;
  gap: 8px;
}

.flowchartButtonGrid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.flowchartPanelActions {
  margin-top: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.flowchartPanelActions.isAlignment {
  grid-template-columns: 1fr;
}

.flowchartShortcutList {
  display: grid;
  gap: 8px;
}

.flowchartShortcutRow {
  display: grid;
  grid-template-columns: minmax(112px, auto) 1fr;
  align-items: center;
  gap: 10px;
  color: var(--flowchart-subtle-text);
  font-size: 12px;

  kbd {
    justify-self: start;
    border: 1px solid var(--flowchart-panel-border);
    border-radius: 8px;
    padding: 5px 8px;
    background: var(--flowchart-toolbar-btn-hover);
    color: var(--flowchart-text);
    font-family: inherit;
    font-size: 11px;
    line-height: 1;
  }
}

.edgeLayer {
  position: absolute;
  top: 0;
  left: 0;
  overflow: visible;
}

.edgePath {
  fill: none;
  stroke: #64748b;
  stroke-width: 2;
  cursor: pointer;
}

.edgePath.isSelected {
  stroke: var(--flowchart-selection);
  stroke-width: 3;
}

.edgeLabel {
  fill: #475569;
  font-size: 12px;
  text-anchor: middle;
  cursor: pointer;
}

.flowchartGuideLine {
  stroke: var(--flowchart-selection);
  stroke-width: 1;
  stroke-dasharray: 6 6;
  opacity: 0.58;
  pointer-events: none;
}

.flowchartNode {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid var(--flowchart-node-border);
  background: var(--flowchart-node-bg);
  box-shadow: var(--flowchart-node-shadow);
  user-select: none;
  cursor: move;
  color: var(--flowchart-text);
}

.flowchartNode.isSelected {
  border-color: var(--flowchart-selection);
  box-shadow: 0 0 0 2px var(--flowchart-selection-ring);
}

.nodeType-start,
.nodeType-end {
  border-radius: 999px;
}

.nodeType-process {
  border-radius: 12px;
}

.nodeType-decision {
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0 50%);
}

.nodeType-input {
  clip-path: polygon(12% 0%, 100% 0, 88% 100%, 0 100%);
}

.nodeText {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  line-height: 1.35;
  pointer-events: none;
}

.canvasEmpty,
.emptyInspector {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex-direction: column;
  gap: 8px;
  color: var(--flowchart-subtle-text);
  padding: 24px;
}

.canvasEmptyActions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.fieldLabel {
  display: block;
  font-size: 12px;
  color: var(--flowchart-subtle-text);
  margin-bottom: 8px;
}

.fieldSelect,
.fieldInput {
  width: 100%;
  border: 1px solid var(--flowchart-panel-border);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--flowchart-panel-bg);
  color: var(--flowchart-text);
}

.fieldSelect {
  margin-bottom: 12px;
}

.fieldInput {
  min-height: 120px;
  resize: vertical;
}

.flowchartPanelBtn {
  border: none;
  border-radius: 10px;
  background: var(--flowchart-toolbar-btn-bg);
  color: var(--flowchart-text);
  padding: 10px 12px;
  font-size: 13px;
  text-align: center;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: var(--flowchart-toolbar-btn-hover);
  }
}

@media (max-width: 1180px) {
  .flowchartToolbar {
    flex-wrap: wrap;
    padding: 8px 12px;
  }

  .flowchartToolbarGroup {
    width: 100%;
  }

  .flowchartStage {
    padding-top: 128px;
  }

  .flowchartCanvasShell,
  .flowchartCanvasViewport {
    min-height: calc(100vh - 128px);
  }

  .flowchartDockRail {
    top: auto;
    bottom: 18px;
    right: 12px;
    transform: none;
  }

  .flowchartViewportToolbar {
    right: auto;
    left: 12px;
    bottom: 18px;
  }

  .flowchartDockTrigger {
    width: 56px;
    min-height: 72px;
  }

  .flowchartPanelBackdrop {
    position: fixed;
    inset: 0;
    z-index: 26;
    display: block;
    border: none;
    background: var(--flowchart-overlay);
  }

  .flowchartFloatingPanel {
    top: auto;
    left: 12px;
    right: 80px;
    bottom: 18px;
    width: auto;
    max-height: min(52vh, 420px);
  }

  .flowchartInspectorPanel {
    width: auto;
  }
}

@media (max-width: 900px) {
  .flowchartStage {
    padding-top: 92px;
  }

  .flowchartCanvasShell,
  .flowchartCanvasViewport {
    min-height: calc(100vh - 92px);
  }
}

@media (max-width: 640px) {
  .flowchartToolbar {
    gap: 8px;
    padding: 8px 10px;
  }

  .flowchartToolbarBtn {
    padding: 8px;
    font-size: 11px;
  }

  .flowchartButtonGrid,
  .flowchartPanelActions {
    grid-template-columns: 1fr;
  }

  .flowchartViewportToolbar {
    gap: 4px;
    padding: 8px;
  }

  .flowchartViewportBtn {
    min-width: 30px;
    height: 30px;
    padding: 0 8px;
    font-size: 12px;
  }

  .flowchartViewportBtn.isLabel {
    min-width: 46px;
  }
}
</style>
