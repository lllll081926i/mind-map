import {
  createNodeId,
  getNodeCenter
} from './flowchartEditorShared'

export const flowchartConnectorMethods = {
  getNodeById(nodeId) {
    return this.flowchartNodeLookup?.get(nodeId) || null
  },

  getEdgeById(edgeId) {
    return this.flowchartData.edges.find(edge => edge.id === edgeId) || null
  },

  showConnectorHandlesForNode(nodeId) {
    return (
      this.selectedNodeIds.length === 1 &&
      this.selectedNodeIds[0] === nodeId &&
      !this.dragState &&
      !this.selectionState &&
      !this.edgeReconnectState &&
      !this.inlineTextEditorState
    )
  },

  getNodeConnectorPoint(node, direction) {
    const x = Number(node?.x || 0)
    const y = Number(node?.y || 0)
    const width = Number(node?.width || 0)
    const height = Number(node?.height || 0)
    if (direction === 'top') {
      return {
        x: x + width / 2,
        y
      }
    }
    if (direction === 'right') {
      return {
        x: x + width,
        y: y + height / 2
      }
    }
    if (direction === 'bottom') {
      return {
        x: x + width / 2,
        y: y + height
      }
    }
    return {
      x,
      y: y + height / 2
    }
  },

  getConnectorHandleStyle(node, direction) {
    const halfSize = 8
    const anchor = this.getNodeConnectorPoint(node, direction)
    return {
      left: `${anchor.x - Number(node.x || 0) - halfSize}px`,
      top: `${anchor.y - Number(node.y || 0) - halfSize}px`
    }
  },

  createConnectorPreview(sourcePoint, targetPoint) {
    return {
      sourcePoint,
      targetPoint,
      path: `M ${sourcePoint.x} ${sourcePoint.y} L ${targetPoint.x} ${targetPoint.y}`
    }
  },

  findNodeAtWorldPoint(point, { excludeIds = [] } = {}) {
    const excluded = new Set(excludeIds)
    return (
      this.flowchartData.nodes.find(node => {
        if (excluded.has(node.id)) {
          return false
        }
        const left = Number(node.x || 0)
        const top = Number(node.y || 0)
        const right = left + Number(node.width || 0)
        const bottom = top + Number(node.height || 0)
        return (
          point.x >= left &&
          point.x <= right &&
          point.y >= top &&
          point.y <= bottom
        )
      }) || null
    )
  },

  getClosestConnectorPoint(node, referencePoint) {
    const directions = ['top', 'right', 'bottom', 'left']
    return directions
      .map(direction => this.getNodeConnectorPoint(node, direction))
      .sort((a, b) => {
        const distanceA =
          Math.abs(a.x - referencePoint.x) + Math.abs(a.y - referencePoint.y)
        const distanceB =
          Math.abs(b.x - referencePoint.x) + Math.abs(b.y - referencePoint.y)
        return distanceA - distanceB
      })[0]
  },

  ensureFlowchartEdge(source, target, label = '') {
    const existingEdge = this.flowchartData.edges.find(edge => {
      return edge.source === source && edge.target === target
    })
    if (existingEdge) {
      return existingEdge
    }
    const edge = {
      id: createNodeId('edge'),
      source,
      target,
      label,
      style: {}
    }
    this.flowchartData.edges.push(edge)
    return edge
  },

  createNodeFromConnectorDrag(sourceNode, direction, worldPoint) {
    const size = this.getDefaultNodeSizeByType('process')
    const gap = 104
    const center = getNodeCenter(sourceNode)
    const fallbackPosition = {
      top: {
        x: center.x - size.width / 2,
        y: Number(sourceNode.y || 0) - size.height - gap
      },
      right: {
        x: Number(sourceNode.x || 0) + Number(sourceNode.width || 0) + gap,
        y: center.y - size.height / 2
      },
      bottom: {
        x: center.x - size.width / 2,
        y: Number(sourceNode.y || 0) + Number(sourceNode.height || 0) + gap
      },
      left: {
        x: Number(sourceNode.x || 0) - size.width - gap,
        y: center.y - size.height / 2
      }
    }[direction]
    const nextPosition = this.snapPositionToGrid({
      x: Number.isFinite(Number(worldPoint?.x))
        ? Number(worldPoint.x) - size.width / 2
        : fallbackPosition.x,
      y: Number.isFinite(Number(worldPoint?.y))
        ? Number(worldPoint.y) - size.height / 2
        : fallbackPosition.y
    })
    return {
      id: createNodeId('process'),
      type: 'process',
      text: this.$t('flowchart.addProcess'),
      x: nextPosition.x,
      y: nextPosition.y,
      width: size.width,
      height: size.height,
      style: {}
    }
  },

  startConnectorDrag(event, nodeId, direction) {
    this.beginConnectorDrag(nodeId, direction, event)
  },

  beginConnectorDrag(nodeId, direction, pointerEvent) {
    const sourceNode = this.getNodeById(nodeId)
    if (!sourceNode) {
      return
    }
    const startPoint = this.getNodeConnectorPoint(sourceNode, direction)
    this.clearSelection()
    this.selectedNodeIds = [nodeId]
    this.connectorDragState = {
      nodeId,
      direction,
      startPoint,
      currentPoint: startPoint,
      targetNodeId: ''
    }
    this.connectorPreview = this.createConnectorPreview(startPoint, startPoint)
    this.edgeToolbarState = null
    window.addEventListener('mousemove', this.updateConnectorDrag)
    window.addEventListener('mouseup', this.commitConnectorDrag)
    pointerEvent?.preventDefault?.()
  },

  updateConnectorDrag(pointerEvent) {
    if (!this.connectorDragState) {
      return
    }
    const currentPoint = this.getWorldPointFromEvent(pointerEvent)
    const targetNode = this.findNodeAtWorldPoint(currentPoint, {
      excludeIds: [this.connectorDragState.nodeId]
    })
    const previewTarget = targetNode
      ? this.getClosestConnectorPoint(targetNode, currentPoint)
      : currentPoint
    this.connectorDragState = {
      ...this.connectorDragState,
      currentPoint,
      targetNodeId: targetNode?.id || ''
    }
    this.connectorPreview = this.createConnectorPreview(
      this.connectorDragState.startPoint,
      previewTarget
    )
  },

  async commitConnectorDrag(pointerEvent) {
    if (!this.connectorDragState) {
      return
    }
    const dragSnapshot = {
      ...this.connectorDragState
    }
    const releasePoint = this.getWorldPointFromEvent(pointerEvent)
    const sourceNode = this.getNodeById(dragSnapshot.nodeId)
    const targetNode = this.findNodeAtWorldPoint(releasePoint, {
      excludeIds: [dragSnapshot.nodeId]
    })
    this.cancelConnectorDrag()
    if (!sourceNode) {
      return
    }
    const delta =
      Math.abs(releasePoint.x - dragSnapshot.startPoint.x) +
      Math.abs(releasePoint.y - dragSnapshot.startPoint.y)
    if (targetNode) {
      const targetEdge = this.ensureFlowchartEdge(sourceNode.id, targetNode.id)
      this.selectedEdgeId = targetEdge.id
      this.selectedNodeIds = []
      this.syncEdgeToolbarState(targetEdge.id)
      void this.persistFlowchartState()
      return
    }
    if (delta < 24) {
      return
    }
    const newNode = this.createNodeFromConnectorDrag(
      sourceNode,
      dragSnapshot.direction,
      releasePoint
    )
    this.flowchartData.nodes.push(newNode)
    this.ensureFlowchartEdge(sourceNode.id, newNode.id)
    this.selectedNodeIds = [newNode.id]
    this.selectedEdgeId = ''
    this.closeInspector()
    await this.persistFlowchartState()
  },

  cancelConnectorDrag() {
    this.connectorDragState = null
    this.connectorPreview = null
    this.removeConnectorDragListeners()
  },

  removeConnectorDragListeners() {
    window.removeEventListener('mousemove', this.updateConnectorDrag)
    window.removeEventListener('mouseup', this.commitConnectorDrag)
  }
}
