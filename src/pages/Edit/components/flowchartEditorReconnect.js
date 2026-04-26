import { FLOWCHART_NODE_HIT_PADDING } from './flowchartEditorShared'
import {
  normalizeFlowchartEdgeLabelPosition,
  projectFlowchartPointToPolyline
} from '@/services/flowchartDocument'

export const flowchartReconnectMethods = {
  startEdgeReconnect(event, edgeId, endpoint) {
    this.beginEdgeReconnect(edgeId, endpoint, event)
  },

  startEdgeBendDrag(event, edgeId, bendIndex) {
    this.beginEdgeBendDrag(edgeId, bendIndex, event)
  },

  beginEdgeReconnect(edgeId, endpoint, pointerEvent) {
    const edge = this.edgesWithLayout.find(item => item.id === edgeId)
    if (!edge || !['source', 'target'].includes(endpoint)) {
      return
    }
    if (this.inlineTextEditorState) {
      void this.commitInlineTextEditor()
    }
    this.cancelEdgeBendDrag()
    this.cancelEdgeLabelDrag()
    const fixedNodeId = endpoint === 'source' ? edge.target : edge.source
    const fixedPoint = endpoint === 'source' ? edge.targetPoint : edge.sourcePoint
    const movingPoint = endpoint === 'source' ? edge.sourcePoint : edge.targetPoint
    const movingNodeId = endpoint === 'source' ? edge.source : edge.target
    const movingAnchor = endpoint === 'source' ? edge.sourceAnchor || null : edge.targetAnchor || null
    this.selectedEdgeId = edgeId
    this.selectedNodeIds = []
    this.edgeToolbarState = null
    this.edgeReconnectState = {
      edgeId,
      endpoint,
      fixedNodeId,
      movingNodeId,
      movingAnchor,
      fixedPoint,
      movingPoint,
      targetNodeId: '',
      targetAnchor: null
    }
    this.connectorPreview =
      endpoint === 'source'
        ? this.createConnectorPreview(movingPoint, fixedPoint)
        : this.createConnectorPreview(fixedPoint, movingPoint)
    window.addEventListener('mousemove', this.updateEdgeReconnect)
    window.addEventListener('mouseup', this.commitEdgeReconnect)
    this.pendingEdgeReconnectPoint = null
    pointerEvent?.preventDefault?.()
  },

  updateEdgeReconnect(pointerEvent) {
    if (!this.edgeReconnectState) {
      return
    }
    this.pendingEdgeReconnectPoint = this.getWorldPointFromEvent(pointerEvent)
    if (this.edgeReconnectFrameId) {
      return
    }
    this.edgeReconnectFrameId = window.requestAnimationFrame(() => {
      this.edgeReconnectFrameId = 0
      this.flushEdgeReconnectFrame()
    })
  },

  flushEdgeReconnectFrame() {
    if (!this.edgeReconnectState) {
      return
    }
    const currentPoint = this.pendingEdgeReconnectPoint
    this.pendingEdgeReconnectPoint = null
    if (!currentPoint) {
      return
    }
    const targetNode = this.findNodeAtWorldPoint(currentPoint, {
      excludeIds: [this.edgeReconnectState.fixedNodeId],
      padding: FLOWCHART_NODE_HIT_PADDING
    })
    const previewAnchor = targetNode
      ? this.getNodeConnectionAnchor(targetNode, currentPoint)
      : null
    const previewPoint = previewAnchor?.point || currentPoint
    this.edgeReconnectState = {
      ...this.edgeReconnectState,
      movingPoint: previewPoint,
      targetNodeId: targetNode?.id || '',
      targetAnchor: previewAnchor?.anchor || null
    }
    this.connectorPreview =
      this.edgeReconnectState.endpoint === 'source'
        ? this.createConnectorPreview(previewPoint, this.edgeReconnectState.fixedPoint)
        : this.createConnectorPreview(this.edgeReconnectState.fixedPoint, previewPoint)
  },

  commitEdgeReconnect(pointerEvent) {
    if (!this.edgeReconnectState) {
      return
    }
    const reconnectState = {
      ...this.edgeReconnectState
    }
    const releasePoint = this.getWorldPointFromEvent(pointerEvent)
    if (this.edgeReconnectFrameId) {
      window.cancelAnimationFrame(this.edgeReconnectFrameId)
      this.edgeReconnectFrameId = 0
    }
    this.pendingEdgeReconnectPoint = releasePoint
    this.flushEdgeReconnectFrame()
    const targetNode = this.findNodeAtWorldPoint(releasePoint, {
      excludeIds: [reconnectState.fixedNodeId],
      padding: FLOWCHART_NODE_HIT_PADDING
    })
    this.cancelEdgeReconnect()
    if (!targetNode) {
      this.syncEdgeToolbarState(reconnectState.edgeId)
      return
    }
    const edge = this.getEdgeById(reconnectState.edgeId)
    if (!edge) {
      return
    }
    const targetAnchor = this.getNodeConnectionAnchor(targetNode, releasePoint).anchor
    const nextSource = reconnectState.endpoint === 'source' ? targetNode.id : edge.source
    const nextTarget = reconnectState.endpoint === 'target' ? targetNode.id : edge.target
    if (!nextSource || !nextTarget || nextSource === nextTarget) {
      this.syncEdgeToolbarState(reconnectState.edgeId)
      return
    }
    const duplicatedEdge = this.flowchartData.edges.find(item => {
      return (
        item.id !== edge.id &&
        item.source === nextSource &&
        item.target === nextTarget
      )
    })
    if (duplicatedEdge) {
      this.selectedEdgeId = duplicatedEdge.id
      this.syncEdgeToolbarState(duplicatedEdge.id)
      this.$message.warning(this.$t('flowchart.reconnectDuplicate'))
      return
    }
    edge.source = nextSource
    edge.target = nextTarget
    if (reconnectState.endpoint === 'source') {
      edge.sourceAnchor = targetAnchor
    } else {
      edge.targetAnchor = targetAnchor
    }
    edge.route = null
    this.selectedEdgeId = edge.id
    this.syncEdgeToolbarState(edge.id)
    this.suppressPointerClick()
    void this.persistFlowchartState()
  },

  cancelEdgeReconnect() {
    this.edgeReconnectState = null
    this.connectorPreview = null
    this.pendingEdgeReconnectPoint = null
    if (this.edgeReconnectFrameId) {
      window.cancelAnimationFrame(this.edgeReconnectFrameId)
      this.edgeReconnectFrameId = 0
    }
    this.removeEdgeReconnectListeners()
  },

  removeEdgeReconnectListeners() {
    window.removeEventListener('mousemove', this.updateEdgeReconnect)
    window.removeEventListener('mouseup', this.commitEdgeReconnect)
  },

  beginEdgeBendDrag(edgeId, bendIndex, pointerEvent) {
    const edge = this.edgesWithLayout.find(item => item.id === edgeId)
    const bendHandles = Array.isArray(edge?.bendHandles) ? edge.bendHandles : []
    const bendHandle = bendHandles[bendIndex] || null
    if (!edge || !bendHandle) {
      return
    }
    if (this.inlineTextEditorState) {
      void this.commitInlineTextEditor()
    }
    this.cancelEdgeReconnect()
    this.cancelEdgeLabelDrag()
    this.selectedEdgeId = edgeId
    this.selectedNodeIds = []
    this.edgeToolbarState = null
    this.edgeBendDragState = {
      edgeId,
      bendIndex,
      axis: bendHandle.axis
    }
    this.pendingEdgeBendPoint = this.getWorldPointFromEvent(pointerEvent)
    window.addEventListener('mousemove', this.updateEdgeBendDrag)
    window.addEventListener('mouseup', this.commitEdgeBendDrag)
    pointerEvent?.preventDefault?.()
  },

  updateEdgeBendDrag(pointerEvent) {
    if (!this.edgeBendDragState) {
      return
    }
    this.pendingEdgeBendPoint = this.getWorldPointFromEvent(pointerEvent)
    if (this.edgeBendDragFrameId) {
      return
    }
    this.edgeBendDragFrameId = window.requestAnimationFrame(() => {
      this.edgeBendDragFrameId = 0
      this.flushEdgeBendDragFrame()
    })
  },

  flushEdgeBendDragFrame() {
    if (!this.edgeBendDragState) {
      return
    }
    const nextPoint = this.pendingEdgeBendPoint
    this.pendingEdgeBendPoint = null
    if (!nextPoint) {
      return
    }
    const edge = this.getEdgeById(this.edgeBendDragState.edgeId)
    if (!edge) {
      return
    }
    const axis = this.edgeBendDragState.axis === 'y' ? 'y' : 'x'
    const nextValue = axis === 'x' ? Number(nextPoint.x || 0) : Number(nextPoint.y || 0)
    edge.route = {
      orthogonalLane: {
        axis,
        value: nextValue
      }
    }
  },

  commitEdgeBendDrag(pointerEvent) {
    if (!this.edgeBendDragState) {
      return
    }
    this.pendingEdgeBendPoint = this.getWorldPointFromEvent(pointerEvent)
    if (this.edgeBendDragFrameId) {
      window.cancelAnimationFrame(this.edgeBendDragFrameId)
      this.edgeBendDragFrameId = 0
    }
    this.flushEdgeBendDragFrame()
    const edgeId = this.edgeBendDragState.edgeId
    this.cancelEdgeBendDrag()
    this.syncEdgeToolbarState(edgeId)
    this.suppressPointerClick()
    void this.persistFlowchartState()
  },

  cancelEdgeBendDrag() {
    this.edgeBendDragState = null
    this.pendingEdgeBendPoint = null
    if (this.edgeBendDragFrameId) {
      window.cancelAnimationFrame(this.edgeBendDragFrameId)
      this.edgeBendDragFrameId = 0
    }
    this.removeEdgeBendListeners()
  },

  removeEdgeBendListeners() {
    window.removeEventListener('mousemove', this.updateEdgeBendDrag)
    window.removeEventListener('mouseup', this.commitEdgeBendDrag)
  },

  startEdgeLabelDrag(event, edgeId) {
    this.beginEdgeLabelDrag(edgeId, event)
  },

  beginEdgeLabelDrag(edgeId, pointerEvent) {
    const edgeLayout = this.edgesWithLayout.find(item => item.id === edgeId)
    if (!edgeLayout) {
      return
    }
    this.cancelEdgeLabelDrag()
    if (this.inlineTextEditorState) {
      void this.commitInlineTextEditor()
    }
    this.cancelEdgeReconnect()
    this.cancelEdgeBendDrag()
    this.selectedEdgeId = edgeId
    this.selectedNodeIds = []
    this.edgeToolbarState = null
    const startPoint = this.getWorldPointFromEvent(pointerEvent)
    this.edgeLabelDragState = {
      edgeId,
      moved: false,
      startPoint
    }
    this.pendingEdgeLabelDragPoint = startPoint
    window.addEventListener('mousemove', this.updateEdgeLabelDrag)
    window.addEventListener('mouseup', this.commitEdgeLabelDrag)
    pointerEvent?.preventDefault?.()
  },

  updateEdgeLabelDrag(pointerEvent) {
    if (!this.edgeLabelDragState) {
      return
    }
    this.pendingEdgeLabelDragPoint = this.getWorldPointFromEvent(pointerEvent)
    if (this.edgeLabelDragFrameId) {
      return
    }
    this.edgeLabelDragFrameId = window.requestAnimationFrame(() => {
      this.edgeLabelDragFrameId = 0
      this.flushEdgeLabelDragFrame()
    })
  },

  flushEdgeLabelDragFrame() {
    if (!this.edgeLabelDragState) {
      return
    }
    const nextPoint = this.pendingEdgeLabelDragPoint
    this.pendingEdgeLabelDragPoint = null
    if (!nextPoint) {
      return
    }
    const edgeLayout = this.edgesWithLayout.find(
      item => item.id === this.edgeLabelDragState.edgeId
    )
    const edge = this.getEdgeById(this.edgeLabelDragState.edgeId)
    if (!edgeLayout || !edge) {
      return
    }
    const deltaX =
      Number(nextPoint.x || 0) - Number(this.edgeLabelDragState.startPoint?.x || 0)
    const deltaY =
      Number(nextPoint.y || 0) - Number(this.edgeLabelDragState.startPoint?.y || 0)
    if (!this.edgeLabelDragState.moved && Math.hypot(deltaX, deltaY) <= 2) {
      return
    }
    const projection = projectFlowchartPointToPolyline(
      edgeLayout.pathPoints,
      nextPoint
    )
    edge.labelPosition = normalizeFlowchartEdgeLabelPosition({
      ratio: projection.ratio,
      offsetX: Number(nextPoint.x || 0) - Number(projection.point?.x || 0),
      offsetY: Number(nextPoint.y || 0) - Number(projection.point?.y || 0)
    })
    this.edgeLabelDragState = {
      ...this.edgeLabelDragState,
      moved: true
    }
  },

  commitEdgeLabelDrag(pointerEvent) {
    if (!this.edgeLabelDragState) {
      return
    }
    this.pendingEdgeLabelDragPoint = this.getWorldPointFromEvent(pointerEvent)
    if (this.edgeLabelDragFrameId) {
      window.cancelAnimationFrame(this.edgeLabelDragFrameId)
      this.edgeLabelDragFrameId = 0
    }
    this.flushEdgeLabelDragFrame()
    const shouldPersist = this.edgeLabelDragState.moved
    this.cancelEdgeLabelDrag()
    if (shouldPersist) {
      this.suppressPointerClick()
      void this.persistFlowchartState()
    }
  },

  cancelEdgeLabelDrag() {
    this.edgeLabelDragState = null
    this.pendingEdgeLabelDragPoint = null
    if (this.edgeLabelDragFrameId) {
      window.cancelAnimationFrame(this.edgeLabelDragFrameId)
      this.edgeLabelDragFrameId = 0
    }
    this.removeEdgeLabelDragListeners()
  },

  removeEdgeLabelDragListeners() {
    window.removeEventListener('mousemove', this.updateEdgeLabelDrag)
    window.removeEventListener('mouseup', this.commitEdgeLabelDrag)
  }
}
