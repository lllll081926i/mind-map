import {
  FLOWCHART_NODE_HIT_PADDING,
  FLOWCHART_STRAIGHT_EDGE_SNAP_THRESHOLD
} from './flowchartEditorShared'
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

  startEdgeSegmentDrag(event, edgeId, segmentIndex) {
    this.beginEdgeSegmentDrag(edgeId, segmentIndex, event)
  },

  getEdgeStraightRouteSnap(edge, axis) {
    const sourcePoint = edge?.sourcePoint || null
    const targetPoint = edge?.targetPoint || null
    if (!sourcePoint || !targetPoint) {
      return null
    }
    const sourceValue = axis === 'y' ? Number(sourcePoint.y || 0) : Number(sourcePoint.x || 0)
    const targetValue = axis === 'y' ? Number(targetPoint.y || 0) : Number(targetPoint.x || 0)
    if (Math.abs(sourceValue - targetValue) > 0.001) {
      return null
    }
    return {
      axis,
      value: sourceValue
    }
  },

  getEdgeManualRoutePoints(edge) {
    const pathPoints = Array.isArray(edge?.pathPoints) ? edge.pathPoints : []
    return pathPoints.slice(1, -1)
      .map(point => ({
        x: Number(point?.x || 0),
        y: Number(point?.y || 0)
      }))
  },

  getEdgeRouteDragSnapValue({
    edge,
    axis,
    affectedIndexes = [],
    nextValue,
    threshold
  }) {
    const pathPoints = Array.isArray(edge?.pathPoints) ? edge.pathPoints : []
    const candidates = new Set()
    affectedIndexes.forEach(manualIndex => {
      const previousPoint = pathPoints[manualIndex] || null
      const nextPoint = pathPoints[manualIndex + 2] || null
      const manualPoint = pathPoints[manualIndex + 1] || null
      ;[previousPoint, nextPoint, manualPoint, edge?.sourcePoint, edge?.targetPoint].forEach(
        point => {
          const candidateValue = Number(point?.[axis])
          if (Number.isFinite(candidateValue)) {
            candidates.add(candidateValue)
          }
        }
      )
    })
    let bestValue = null
    let bestDiff = Infinity
    candidates.forEach(candidateValue => {
      const diff = Math.abs(candidateValue - nextValue)
      if (diff <= threshold && diff < bestDiff) {
        bestValue = candidateValue
        bestDiff = diff
      }
    })
    return bestValue
  },

  simplifyEdgeManualRoutePoints(edge, manualPoints = []) {
    const points = [
      edge?.sourcePoint || null,
      ...(Array.isArray(manualPoints) ? manualPoints : []),
      edge?.targetPoint || null
    ]
      .map(point => ({
        x: Number(point?.x || 0),
        y: Number(point?.y || 0)
      }))
      .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
    const simplifiedPoints = []
    const isSamePoint = (firstPoint, secondPoint) => {
      return (
        Math.abs(Number(firstPoint?.x || 0) - Number(secondPoint?.x || 0)) <= 0.001 &&
        Math.abs(Number(firstPoint?.y || 0) - Number(secondPoint?.y || 0)) <= 0.001
      )
    }
    const isCollinearPoint = (previousPoint, currentPoint, nextPoint) => {
      const previousDeltaX =
        Number(currentPoint?.x || 0) - Number(previousPoint?.x || 0)
      const previousDeltaY =
        Number(currentPoint?.y || 0) - Number(previousPoint?.y || 0)
      const nextDeltaX =
        Number(nextPoint?.x || 0) - Number(currentPoint?.x || 0)
      const nextDeltaY =
        Number(nextPoint?.y || 0) - Number(currentPoint?.y || 0)
      const isCollinear =
        (Math.abs(previousDeltaX) <= 0.001 && Math.abs(nextDeltaX) <= 0.001) ||
        (Math.abs(previousDeltaY) <= 0.001 && Math.abs(nextDeltaY) <= 0.001)
      if (!isCollinear) {
        return false
      }
      return previousDeltaX * nextDeltaX + previousDeltaY * nextDeltaY >= 0
    }
    points.forEach(point => {
      if (
        simplifiedPoints.length &&
        isSamePoint(simplifiedPoints[simplifiedPoints.length - 1], point)
      ) {
        return
      }
      while (
        simplifiedPoints.length >= 2 &&
        isCollinearPoint(
          simplifiedPoints[simplifiedPoints.length - 2],
          simplifiedPoints[simplifiedPoints.length - 1],
          point
        )
      ) {
        simplifiedPoints.pop()
      }
      simplifiedPoints.push(point)
    })
    return simplifiedPoints.slice(1, -1)
  },

  applyManualRouteToEdge(edge, manualPoints = []) {
    const normalizedManualPoints = this.simplifyEdgeManualRoutePoints(
      edge,
      (Array.isArray(manualPoints) ? manualPoints : [])
      .map(point => ({
        x: Number(point?.x || 0),
        y: Number(point?.y || 0)
      }))
      .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
    )
    edge.route = normalizedManualPoints.length
      ? {
          manualPoints: normalizedManualPoints
        }
      : null
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
    this.startAutoScroll(pointerEvent?.clientX, pointerEvent?.clientY)
    pointerEvent?.preventDefault?.()
  },

  updateEdgeReconnect(pointerEvent) {
    if (!this.edgeReconnectState) {
      return
    }
    this.updateAutoScroll(pointerEvent?.clientX, pointerEvent?.clientY)
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
      padding: FLOWCHART_NODE_HIT_PADDING,
      preferredNodeId: this.edgeReconnectState.targetNodeId
    })
    const edge = this.getEdgeById(this.edgeReconnectState.edgeId)
    const fixedNode = this.getNodeById(this.edgeReconnectState.fixedNodeId)
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
    if (targetNode && fixedNode && edge) {
      this.connectorPreview =
        this.edgeReconnectState.endpoint === 'source'
          ? this.createFlowchartConnectionPreview({
              sourceNode: targetNode,
              targetNode: fixedNode,
              sourceAnchor: previewAnchor?.anchor || null,
              targetAnchor: edge.targetAnchor || null,
              style: edge.style || {},
              fallbackSourcePoint: previewPoint,
              fallbackTargetPoint: this.edgeReconnectState.fixedPoint
            })
          : this.createFlowchartConnectionPreview({
              sourceNode: fixedNode,
              targetNode,
              sourceAnchor: edge.sourceAnchor || null,
              targetAnchor: previewAnchor?.anchor || null,
              style: edge.style || {},
              fallbackSourcePoint: this.edgeReconnectState.fixedPoint,
              fallbackTargetPoint: previewPoint
            })
      return
    }
    this.connectorPreview =
      this.edgeReconnectState.endpoint === 'source'
        ? this.createConnectorPreview(previewPoint, this.edgeReconnectState.fixedPoint)
        : this.createConnectorPreview(this.edgeReconnectState.fixedPoint, previewPoint)
  },

  async commitEdgeReconnect(pointerEvent) {
    if (!this.edgeReconnectState) {
      return
    }
    this.stopAutoScroll()
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
      padding: FLOWCHART_NODE_HIT_PADDING,
      preferredNodeId: reconnectState.targetNodeId
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
    await this.persistFlowchartState()
  },

  cancelEdgeReconnect() {
    this.stopAutoScroll()
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

  beginEdgeSegmentDrag(edgeId, segmentIndex, pointerEvent) {
    const edge = this.edgesWithLayout.find(item => item.id === edgeId)
    const pathPoints = Array.isArray(edge?.pathPoints) ? edge.pathPoints : []
    const startPoint = pathPoints[segmentIndex]
    const endPoint = pathPoints[segmentIndex + 1]
    if (!edge || !startPoint || !endPoint) {
      return
    }
    const isVertical =
      Math.abs(Number(startPoint.x || 0) - Number(endPoint.x || 0)) <= 0.001
    const isHorizontal =
      Math.abs(Number(startPoint.y || 0) - Number(endPoint.y || 0)) <= 0.001
    if (!isVertical && !isHorizontal) {
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
    const manualPoints = this.getEdgeManualRoutePoints(edge)
    this.edgeBendDragState = {
      edgeId,
      kind: 'segment',
      segmentIndex: Number(segmentIndex || 0),
      axis: isVertical ? 'x' : 'y',
      manualPoints,
      straightSnap: this.getEdgeStraightRouteSnap(edge, isVertical ? 'x' : 'y')
    }
    this.pendingEdgeBendPoint = this.getWorldPointFromEvent(pointerEvent)
    window.addEventListener('mousemove', this.updateEdgeBendDrag)
    window.addEventListener('mouseup', this.commitEdgeBendDrag)
    this.startAutoScroll(pointerEvent?.clientX, pointerEvent?.clientY)
    pointerEvent?.preventDefault?.()
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
    const manualPoints = this.getEdgeManualRoutePoints(edge)
    this.edgeBendDragState = {
      edgeId,
      kind: 'bend',
      bendIndex,
      axis: bendHandle.axis,
      manualPoints,
      straightSnap: this.getEdgeStraightRouteSnap(edge, bendHandle.axis)
    }
    this.pendingEdgeBendPoint = this.getWorldPointFromEvent(pointerEvent)
    window.addEventListener('mousemove', this.updateEdgeBendDrag)
    window.addEventListener('mouseup', this.commitEdgeBendDrag)
    this.startAutoScroll(pointerEvent?.clientX, pointerEvent?.clientY)
    pointerEvent?.preventDefault?.()
  },

  updateEdgeBendDrag(pointerEvent) {
    if (!this.edgeBendDragState) {
      return
    }
    this.updateAutoScroll(pointerEvent?.clientX, pointerEvent?.clientY)
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
    const dragState = this.edgeBendDragState
    const manualPoints = (Array.isArray(dragState.manualPoints) ? dragState.manualPoints : [])
      .map(point => ({ ...point }))
    const snapThreshold = this.getStraightEdgeSnapThreshold
      ? this.getStraightEdgeSnapThreshold()
      : FLOWCHART_STRAIGHT_EDGE_SNAP_THRESHOLD
    if (dragState.kind === 'segment') {
      const pathPoints = Array.isArray(edge?.pathPoints) ? edge.pathPoints : []
      const segmentIndex = Number(dragState.segmentIndex || 0)
      const startPoint = pathPoints[segmentIndex] || null
      const endPoint = pathPoints[segmentIndex + 1] || null
      if (!startPoint || !endPoint) {
        return
      }
      const axis = dragState.axis === 'y' ? 'y' : 'x'
      let nextValue = axis === 'x' ? Number(nextPoint.x || 0) : Number(nextPoint.y || 0)
      const affectedIndexes = []
      if (segmentIndex > 0) {
        affectedIndexes.push(segmentIndex - 1)
      }
      if (segmentIndex < pathPoints.length - 2) {
        affectedIndexes.push(segmentIndex)
      }
      if (
        dragState.straightSnap?.axis === axis &&
        Math.abs(nextValue - this.edgeBendDragState.straightSnap.value) <= snapThreshold
      ) {
        edge.route = null
        return
      }
      const snappedValue = this.getEdgeRouteDragSnapValue({
        edge,
        axis,
        affectedIndexes,
        nextValue,
        threshold: snapThreshold
      })
      if (Number.isFinite(snappedValue)) {
        nextValue = snappedValue
      }
      if (!affectedIndexes.length) {
        const firstPoint = pathPoints[0] || edge.sourcePoint
        const lastPoint = pathPoints[pathPoints.length - 1] || edge.targetPoint
        this.applyManualRouteToEdge(edge, [
          axis === 'x'
            ? { x: nextValue, y: Number(firstPoint?.y || 0) }
            : { x: Number(firstPoint?.x || 0), y: nextValue },
          axis === 'x'
            ? { x: nextValue, y: Number(lastPoint?.y || 0) }
            : { x: Number(lastPoint?.x || 0), y: nextValue }
        ])
        return
      }
      affectedIndexes.forEach(index => {
        if (!manualPoints[index]) {
          return
        }
        manualPoints[index][axis] = nextValue
      })
      this.applyManualRouteToEdge(edge, manualPoints)
      return
    }
    const nextManualPoint = {
      x: Number(nextPoint.x || 0),
      y: Number(nextPoint.y || 0)
    }
    if (!manualPoints.length) {
      manualPoints.push(nextManualPoint)
    } else {
      const bendIndex = Math.max(0, Math.min(manualPoints.length - 1, Number(dragState.bendIndex || 0)))
      manualPoints[bendIndex] = nextManualPoint
    }
    const snapAxisList = ['x', 'y']
    snapAxisList.forEach(axis => {
      const snappedValue = this.getEdgeRouteDragSnapValue({
        edge,
        axis,
        affectedIndexes: [Math.max(0, Number(dragState.bendIndex || 0))],
        nextValue: Number(nextManualPoint[axis] || 0),
        threshold: snapThreshold
      })
      if (Number.isFinite(snappedValue)) {
        manualPoints[Math.max(0, Number(dragState.bendIndex || 0))][axis] = snappedValue
      }
    })
    this.applyManualRouteToEdge(edge, manualPoints)
  },

  async commitEdgeBendDrag(pointerEvent) {
    if (!this.edgeBendDragState) {
      return
    }
    this.stopAutoScroll()
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
    await this.persistFlowchartState()
  },

  cancelEdgeBendDrag() {
    this.stopAutoScroll()
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
    this.startAutoScroll(pointerEvent?.clientX, pointerEvent?.clientY)
    pointerEvent?.preventDefault?.()
  },

  updateEdgeLabelDrag(pointerEvent) {
    if (!this.edgeLabelDragState) {
      return
    }
    this.updateAutoScroll(pointerEvent?.clientX, pointerEvent?.clientY)
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

  async commitEdgeLabelDrag(pointerEvent) {
    if (!this.edgeLabelDragState) {
      return
    }
    this.stopAutoScroll()
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
      await this.persistFlowchartState()
    }
  },

  cancelEdgeLabelDrag() {
    this.stopAutoScroll()
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
