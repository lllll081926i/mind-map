export const flowchartReconnectMethods = {
  startEdgeReconnect(event, edgeId, endpoint) {
    this.beginEdgeReconnect(edgeId, endpoint, event)
  },

  beginEdgeReconnect(edgeId, endpoint, pointerEvent) {
    const edge = this.edgesWithLayout.find(item => item.id === edgeId)
    if (!edge || !['source', 'target'].includes(endpoint)) {
      return
    }
    const fixedNodeId = endpoint === 'source' ? edge.target : edge.source
    const fixedPoint = endpoint === 'source' ? edge.targetPoint : edge.sourcePoint
    const movingPoint = endpoint === 'source' ? edge.sourcePoint : edge.targetPoint
    this.selectedEdgeId = edgeId
    this.selectedNodeIds = []
    this.edgeToolbarState = null
    this.edgeReconnectState = {
      edgeId,
      endpoint,
      fixedNodeId,
      fixedPoint,
      movingPoint,
      targetNodeId: ''
    }
    this.connectorPreview =
      endpoint === 'source'
        ? this.createConnectorPreview(movingPoint, fixedPoint)
        : this.createConnectorPreview(fixedPoint, movingPoint)
    window.addEventListener('mousemove', this.updateEdgeReconnect)
    window.addEventListener('mouseup', this.commitEdgeReconnect)
    pointerEvent?.preventDefault?.()
  },

  updateEdgeReconnect(pointerEvent) {
    if (!this.edgeReconnectState) {
      return
    }
    const currentPoint = this.getWorldPointFromEvent(pointerEvent)
    const targetNode = this.findNodeAtWorldPoint(currentPoint, {
      excludeIds: [this.edgeReconnectState.fixedNodeId]
    })
    const previewPoint = targetNode
      ? this.getClosestConnectorPoint(targetNode, currentPoint)
      : currentPoint
    this.edgeReconnectState = {
      ...this.edgeReconnectState,
      movingPoint: previewPoint,
      targetNodeId: targetNode?.id || ''
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
    const targetNode = this.findNodeAtWorldPoint(releasePoint, {
      excludeIds: [reconnectState.fixedNodeId]
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
    this.selectedEdgeId = edge.id
    this.syncEdgeToolbarState(edge.id)
    void this.persistFlowchartState()
  },

  cancelEdgeReconnect() {
    this.edgeReconnectState = null
    this.connectorPreview = null
    this.removeEdgeReconnectListeners()
  },

  removeEdgeReconnectListeners() {
    window.removeEventListener('mousemove', this.updateEdgeReconnect)
    window.removeEventListener('mouseup', this.commitEdgeReconnect)
  }
}
