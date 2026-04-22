import { FLOWCHART_NODE_TYPES } from '@/services/flowchartDocument'
import { cloneJson, createNodeId } from './flowchartEditorShared'

export const flowchartNodeMethods = {
  getViewportCenterWorldPoint() {
    const canvasRect = this.getCanvasElement()?.getBoundingClientRect?.()
    const viewport = this.getViewport()
    if (!canvasRect) {
      return {
        x: 280,
        y: 180
      }
    }
    return {
      x: (canvasRect.width / 2 - viewport.x) / viewport.zoom,
      y: (canvasRect.height / 2 - viewport.y) / viewport.zoom
    }
  },

  getNodePlacementPoint(type = 'process', worldPoint = null) {
    if (
      Number.isFinite(Number(worldPoint?.x)) &&
      Number.isFinite(Number(worldPoint?.y))
    ) {
      return {
        x: Number(worldPoint.x),
        y: Number(worldPoint.y)
      }
    }
    if (this.selectedNodeIds.length === 1) {
      const sourceNode = this.getNodeById(this.selectedNodeIds[0])
      if (sourceNode) {
        const size = this.getDefaultNodeSizeByType(type)
        return {
          x: Number(sourceNode.x || 0) + Number(sourceNode.width || 0) + size.width / 2 + 96,
          y: Number(sourceNode.y || 0) + Number(sourceNode.height || 0) / 2
        }
      }
    }
    return this.getViewportCenterWorldPoint()
  },

  normalizeAddNodePayload(payload = 'process') {
    if (typeof payload === 'string') {
      return {
        type: payload
      }
    }
    return {
      type: payload?.type || 'process',
      worldPoint: payload?.worldPoint || null
    }
  },

  async addNodeByType(payload = 'process') {
    const { type, worldPoint } = this.normalizeAddNodePayload(payload)
    const typeDef = FLOWCHART_NODE_TYPES.find(item => item.type === type)
    const size = this.getDefaultNodeSizeByType(type)
    const placementPoint = this.getNodePlacementPoint(type, worldPoint)
    const nextNode = {
      id: createNodeId(type),
      type,
      text: typeDef?.label || '新节点',
      x: placementPoint.x - size.width / 2,
      y: placementPoint.y - size.height / 2,
      width: size.width,
      height: size.height,
      style: {}
    }
    this.flowchartData.nodes.push(nextNode)
    this.selectedNodeIds = [nextNode.id]
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
    this.closeInspector()
    await this.persistFlowchartState()
    this.openInlineTextEditor({
      kind: 'node',
      id: nextNode.id
    })
  },

  addNodeAtCanvasPoint(event) {
    const target = event?.target
    if (
      target?.closest?.(
        '.flowchartNode, .edgePath, .edgeLabel, .edgeLabelBackdrop, .flowchartViewportToolbar, .flowchartEdgeToolbar, .flowchartInlineEditor, .flowchartConnectorHandle, .canvasEmptyActions'
      )
    ) {
      return
    }
    const worldPoint = this.getWorldPointFromEvent(event)
    void this.addNodeByType({
      type: 'process',
      worldPoint
    })
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
    const currentCenterX =
      Number(this.selectedNode.x || 0) + Number(this.selectedNode.width || 0) / 2
    const currentCenterY =
      Number(this.selectedNode.y || 0) + Number(this.selectedNode.height || 0) / 2
    const nextPosition = this.snapPositionToGrid({
      x: currentCenterX - size.width / 2,
      y: currentCenterY - size.height / 2
    })
    this.selectedNode.type = normalizedType
    this.selectedNode.x = nextPosition.x
    this.selectedNode.y = nextPosition.y
    this.selectedNode.width = size.width
    this.selectedNode.height = size.height
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
    void this.persistFlowchartState()
    this.$message.success(this.$t('flowchart.pasteSuccess'))
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

  bringSelectedNodesToFront() {
    const selectedSet = new Set(this.selectedNodeIds)
    if (!selectedSet.size) {
      return
    }
    const selectedNodes = []
    const remainingNodes = []
    this.flowchartData.nodes.forEach(node => {
      if (selectedSet.has(node.id)) {
        selectedNodes.push(node)
      } else {
        remainingNodes.push(node)
      }
    })
    this.flowchartData.nodes = [...remainingNodes, ...selectedNodes]
    void this.persistFlowchartState()
  },

  sendSelectedNodesToBack() {
    const selectedSet = new Set(this.selectedNodeIds)
    if (!selectedSet.size) {
      return
    }
    const selectedNodes = []
    const remainingNodes = []
    this.flowchartData.nodes.forEach(node => {
      if (selectedSet.has(node.id)) {
        selectedNodes.push(node)
      } else {
        remainingNodes.push(node)
      }
    })
    this.flowchartData.nodes = [...selectedNodes, ...remainingNodes]
    void this.persistFlowchartState()
  },

  startNodeDrag(event, node) {
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    this.inlineTextEditorState = null
    const isAppendSelectionDrag = !!(event.shiftKey || event.ctrlKey || event.metaKey)
    if (isAppendSelectionDrag && !this.selectedNodeIds.includes(node.id)) {
      return
    }
    const selectedIds = this.selectedNodeIds.includes(node.id)
      ? [...this.selectedNodeIds]
      : [node.id]
    this.selectedNodeIds = selectedIds
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
    this.dragState = {
      primaryId: node.id,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      nodes: selectedIds
        .map(id => this.getNodeById(id))
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
    this.pendingDragPoint = {
      clientX: event.clientX,
      clientY: event.clientY
    }
    if (this.dragFrameId) return
    this.dragFrameId = window.requestAnimationFrame(() => {
      this.dragFrameId = 0
      this.flushNodeDragFrame()
    })
  },

  flushNodeDragFrame() {
    if (!this.dragState) return
    const nextPoint = this.pendingDragPoint
    this.pendingDragPoint = null
    if (!nextPoint) return
    this.applyNodeDrag(nextPoint)
  },

  applyNodeDrag({ clientX, clientY }) {
    if (!this.dragState) return
    const viewport = this.getViewport()
    const deltaX = (clientX - this.dragState.startX) / viewport.zoom
    const deltaY = (clientY - this.dragState.startY) / viewport.zoom
    const primarySnapshot =
      this.dragState.nodes.find(snapshot => snapshot.id === this.dragState.primaryId) ||
      this.dragState.nodes[0]
    const primaryNode = this.getNodeById(primarySnapshot?.id)
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
      const currentNode = this.getNodeById(snapshot.id)
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
    if (this.dragFrameId) {
      cancelAnimationFrame(this.dragFrameId)
      this.dragFrameId = 0
    }
    this.flushNodeDragFrame()
    const shouldPersist = this.dragState.moved
    this.dragState = null
    this.pendingDragPoint = null
    this.clearAlignmentGuides()
    this.removeDragListeners()
    this.syncEdgeToolbarState()
    if (shouldPersist) {
      void this.persistFlowchartState()
    }
  },

  removeDragListeners() {
    window.removeEventListener('mousemove', this.onNodeDrag)
    window.removeEventListener('mouseup', this.stopNodeDrag)
    if (this.dragFrameId) {
      cancelAnimationFrame(this.dragFrameId)
      this.dragFrameId = 0
    }
    this.pendingDragPoint = null
  }
}
