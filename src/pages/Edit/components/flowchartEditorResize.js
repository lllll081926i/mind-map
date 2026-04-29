const MIN_NODE_WIDTH = 96
const MIN_NODE_HEIGHT = 48

export const flowchartResizeMethods = {
  showResizeHandlesForNode(nodeId) {
    return (
      this.selectedNodeIds.length === 1 &&
      this.selectedNodeIds[0] === nodeId &&
      !this.dragState &&
      !this.selectionState &&
      !this.connectorDragState &&
      !this.edgeReconnectState &&
      !this.inlineTextEditorState
    )
  },

  startNodeResize(event, node, direction) {
    if (!node || !direction) {
      return
    }
    if (this.inlineTextEditorState) {
      void this.commitInlineTextEditor()
    }
    this.resizeState = {
      nodeId: node.id,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      originalNode: {
        x: Number(node.x || 0),
        y: Number(node.y || 0),
        width: Number(node.width || 0),
        height: Number(node.height || 0)
      },
      moved: false
    }
    this.pendingResizeEvent = null
    this.resizeFrameId = 0
    window.addEventListener('mousemove', this.onNodeResize)
    window.addEventListener('mouseup', this.stopNodeResize)
    this.startAutoScroll(event.clientX, event.clientY)
    event.preventDefault?.()
  },

  onNodeResize(event) {
    if (!this.resizeState) {
      return
    }
    this.updateAutoScroll(event.clientX, event.clientY)
    this.pendingResizeEvent = event
    if (this.resizeFrameId) {
      return
    }
    this.resizeFrameId = window.requestAnimationFrame(() => {
      this.resizeFrameId = 0
      this.flushNodeResizeFrame()
    })
  },

  flushNodeResizeFrame() {
    if (!this.resizeState) {
      return
    }
    const event = this.pendingResizeEvent
    this.pendingResizeEvent = null
    if (!event) {
      return
    }
    const node = this.getNodeById(this.resizeState.nodeId)
    if (!node) {
      return
    }
    const zoom = Number(this.getViewport().zoom || 1) || 1
    const deltaX = (event.clientX - this.resizeState.startX) / zoom
    const deltaY = (event.clientY - this.resizeState.startY) / zoom
    const originalNode = this.resizeState.originalNode
    let nextX = originalNode.x
    let nextY = originalNode.y
    let nextWidth = originalNode.width
    let nextHeight = originalNode.height
    if (this.resizeState.direction.includes('right')) {
      nextWidth = Math.max(MIN_NODE_WIDTH, originalNode.width + deltaX)
    }
    if (this.resizeState.direction.includes('left')) {
      nextWidth = Math.max(MIN_NODE_WIDTH, originalNode.width - deltaX)
      nextX = originalNode.x + (originalNode.width - nextWidth)
    }
    if (this.resizeState.direction.includes('bottom')) {
      nextHeight = Math.max(MIN_NODE_HEIGHT, originalNode.height + deltaY)
    }
    if (this.resizeState.direction.includes('top')) {
      nextHeight = Math.max(MIN_NODE_HEIGHT, originalNode.height - deltaY)
      nextY = originalNode.y + (originalNode.height - nextHeight)
    }
    node.x = nextX
    node.y = nextY
    node.width = nextWidth
    node.height = nextHeight
    this.resizeState.moved =
      this.resizeState.moved ||
      Math.abs(deltaX) > 2 ||
      Math.abs(deltaY) > 2
    if (this.inlineTextEditorState?.kind === 'node' && this.inlineTextEditorState.id === node.id) {
      this.inlineTextEditorState = {
        ...this.inlineTextEditorState,
        style: this.getInlineTextEditorStyle('node', node)
      }
    }
  },

  stopNodeResize(event) {
    if (!this.resizeState) {
      return
    }
    this.stopAutoScroll()
    if (this.resizeFrameId) {
      window.cancelAnimationFrame(this.resizeFrameId)
      this.resizeFrameId = 0
    }
    this.pendingResizeEvent = event || null
    this.flushNodeResizeFrame()
    const shouldPersist = this.resizeState.moved
    const movedNodeId = this.resizeState.nodeId
    this.resizeState = null
    this.pendingResizeEvent = null
    this.removeNodeResizeListeners()
    if (shouldPersist) {
      this.relaxConnectedOrthogonalEdgeRoutes([movedNodeId])
      this.suppressPointerClick()
    }
    if (shouldPersist) {
      void this.persistFlowchartState()
    }
  },

  removeNodeResizeListeners() {
    this.stopAutoScroll()
    window.removeEventListener('mousemove', this.onNodeResize)
    window.removeEventListener('mouseup', this.stopNodeResize)
  }
}
