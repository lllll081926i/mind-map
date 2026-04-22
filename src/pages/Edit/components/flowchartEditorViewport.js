import {
  DEFAULT_VIEWPORT,
  MAX_VIEWPORT_ZOOM,
  MIN_VIEWPORT_ZOOM,
  clampNumber
} from './flowchartEditorShared'

export const flowchartViewportMethods = {
  getCanvasElement() {
    return this.$refs.flowchartCanvas?.getCanvasElement?.() || null
  },

  syncCanvasViewportSize() {
    const canvasRect = this.getCanvasElement()?.getBoundingClientRect?.()
    this.canvasViewportSize = {
      width: Number(canvasRect?.width || 0),
      height: Number(canvasRect?.height || 0)
    }
  },

  getWorldPointFromEvent(event) {
    const canvasRect = this.getCanvasElement()?.getBoundingClientRect?.()
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

  centerViewportAt(point) {
    const canvasRect = this.getCanvasElement()?.getBoundingClientRect?.()
    if (!canvasRect) {
      return
    }
    const viewport = this.getViewport()
    const zoom = Number(viewport.zoom || 1) || 1
    this.setViewportPatch({
      x: canvasRect.width / 2 - Number(point?.x || 0) * zoom,
      y: canvasRect.height / 2 - Number(point?.y || 0) * zoom
    })
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
    this.setViewportPatch(
      {
        ...DEFAULT_VIEWPORT
      },
      {
        persist
      }
    )
  },

  isDefaultViewport(viewport = {}) {
    return (
      Number(viewport.x || 0) === 0 &&
      Number(viewport.y || 0) === 0 &&
      Number(viewport.zoom || 1) === 1
    )
  },

  setViewportZoom(nextZoom, originEvent = null) {
    const canvasRect = this.getCanvasElement()?.getBoundingClientRect?.()
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
    const canvasRect = this.getCanvasElement()?.getBoundingClientRect?.()
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
    this.setViewportPatch(
      {
        zoom,
        x: (canvasRect.width - contentWidth * zoom) / 2 - bounds.minX * zoom,
        y: (canvasRect.height - contentHeight * zoom) / 2 - bounds.minY * zoom
      },
      {
        persist
      }
    )
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
        '.flowchartNode, .edgePath, .edgeLabel, .edgeLabelBackdrop, .flowchartViewportToolbar, .flowchartEdgeToolbar, .flowchartInlineEditor, .flowchartConnectorHandle, .flowchartEdgeReconnectHandle'
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
    this.pendingCanvasPanPoint = {
      clientX: event.clientX,
      clientY: event.clientY
    }
    if (this.canvasPanFrameId) return
    this.canvasPanFrameId = window.requestAnimationFrame(() => {
      this.canvasPanFrameId = 0
      this.flushCanvasPanFrame()
    })
  },

  flushCanvasPanFrame() {
    if (!this.canvasPanState) return
    const nextPoint = this.pendingCanvasPanPoint
    this.pendingCanvasPanPoint = null
    if (!nextPoint) return
    this.applyCanvasPan(nextPoint)
  },

  applyCanvasPan({ clientX, clientY }) {
    if (!this.canvasPanState) return
    const deltaX = clientX - this.canvasPanState.startX
    const deltaY = clientY - this.canvasPanState.startY
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
    if (this.canvasPanFrameId) {
      cancelAnimationFrame(this.canvasPanFrameId)
      this.canvasPanFrameId = 0
    }
    this.flushCanvasPanFrame()
    const shouldClearSelection = !this.canvasPanState.moved
    const shouldPersist = this.canvasPanState.moved
    this.canvasPanState = null
    this.pendingCanvasPanPoint = null
    this.removeCanvasPanListeners()
    if (shouldClearSelection) {
      this.clearSelection()
      this.inlineTextEditorState = null
    }
    if (shouldPersist) {
      this.persistViewport()
    }
  },

  removeCanvasPanListeners() {
    window.removeEventListener('mousemove', this.onCanvasPan)
    window.removeEventListener('mouseup', this.stopCanvasPan)
    if (this.canvasPanFrameId) {
      cancelAnimationFrame(this.canvasPanFrameId)
      this.canvasPanFrameId = 0
    }
    this.pendingCanvasPanPoint = null
  },

  startAreaSelection(event) {
    if (event.button !== 0) {
      return
    }
    this.inlineTextEditorState = null
    const start = this.getWorldPointFromEvent(event)
    this.selectionState = {
      startX: start.x,
      startY: start.y,
      currentX: start.x,
      currentY: start.y
    }
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
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
  }
}
