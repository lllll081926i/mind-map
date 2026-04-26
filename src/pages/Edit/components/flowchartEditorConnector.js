import {
  normalizeFlowchartNodeAnchor
} from '@/services/flowchartDocument'
import {
  FLOWCHART_NODE_HIT_PADDING,
  createNodeId,
  getNodeCenter
} from './flowchartEditorShared'

const FLOWCHART_CORNER_SNAP_DISTANCE = 22

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
      !this.connectorDragState &&
      !this.edgeReconnectState &&
      !this.inlineTextEditorState
    )
  },

  getNodeConnectorPoint(node, direction) {
    const x = Number(node?.x || 0)
    const y = Number(node?.y || 0)
    const width = Number(node?.width || 0)
    const height = Number(node?.height || 0)
    const normalizedAnchor = normalizeFlowchartNodeAnchor(direction)
    if (normalizedAnchor) {
      return {
        x: x + width * normalizedAnchor.xRatio,
        y: y + height * normalizedAnchor.yRatio
      }
    }
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

  getDirectionAnchor(direction) {
    const anchorMap = {
      top: { xRatio: 0.5, yRatio: 0 },
      right: { xRatio: 1, yRatio: 0.5 },
      bottom: { xRatio: 0.5, yRatio: 1 },
      left: { xRatio: 0, yRatio: 0.5 }
    }
    return normalizeFlowchartNodeAnchor(anchorMap[direction] || anchorMap.right)
  },

  getNodeConnectionAnchor(node, referencePoint) {
    const width = Math.max(1, Number(node?.width || 0))
    const height = Math.max(1, Number(node?.height || 0))
    const localX = Math.max(
      0,
      Math.min(width, Number(referencePoint?.x || 0) - Number(node?.x || 0))
    )
    const localY = Math.max(
      0,
      Math.min(height, Number(referencePoint?.y || 0) - Number(node?.y || 0))
    )
    const corners = [
      { xRatio: 0, yRatio: 0 },
      { xRatio: 1, yRatio: 0 },
      { xRatio: 1, yRatio: 1 },
      { xRatio: 0, yRatio: 1 }
    ]
    const snappedCorner =
      corners
        .map(anchor => ({
          anchor,
          distance: Math.hypot(
            localX - width * anchor.xRatio,
            localY - height * anchor.yRatio
          )
        }))
        .sort((first, second) => first.distance - second.distance)[0] || null
    if (snappedCorner && snappedCorner.distance <= FLOWCHART_CORNER_SNAP_DISTANCE) {
      const anchor = normalizeFlowchartNodeAnchor(snappedCorner.anchor)
      return {
        anchor,
        point: this.getNodeConnectorPoint(node, anchor)
      }
    }
    const edgeDistances = [
      {
        edge: 'top',
        distance: localY,
        anchor: {
          xRatio: width <= 0 ? 0.5 : localX / width,
          yRatio: 0
        }
      },
      {
        edge: 'right',
        distance: width - localX,
        anchor: {
          xRatio: 1,
          yRatio: height <= 0 ? 0.5 : localY / height
        }
      },
      {
        edge: 'bottom',
        distance: height - localY,
        anchor: {
          xRatio: width <= 0 ? 0.5 : localX / width,
          yRatio: 1
        }
      },
      {
        edge: 'left',
        distance: localX,
        anchor: {
          xRatio: 0,
          yRatio: height <= 0 ? 0.5 : localY / height
        }
      }
    ]
    const bestEdge = edgeDistances.sort((first, second) => first.distance - second.distance)[0]
    const anchor = normalizeFlowchartNodeAnchor(bestEdge?.anchor)
    return {
      anchor,
      point: this.getNodeConnectorPoint(node, anchor)
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

  findNodeAtWorldPoint(point, { excludeIds = [], padding = 0 } = {}) {
    const excluded = new Set(excludeIds)
    return (
      [...this.flowchartData.nodes].reverse().find(node => {
        if (excluded.has(node.id)) {
          return false
        }
        const hitPadding = Math.max(0, Number(padding || 0))
        const left = Number(node.x || 0)
        const top = Number(node.y || 0)
        const right = left + Number(node.width || 0)
        const bottom = top + Number(node.height || 0)
        return (
          point.x >= left - hitPadding &&
          point.x <= right + hitPadding &&
          point.y >= top - hitPadding &&
          point.y <= bottom + hitPadding
        )
      }) || null
    )
  },

  getClosestConnectorPoint(node, referencePoint) {
    return this.getNodeConnectionAnchor(node, referencePoint).point
  },

  ensureFlowchartEdge(source, target, label = '', edgePatch = {}) {
    const existingEdge = this.flowchartData.edges.find(edge => {
      return edge.source === source && edge.target === target
    })
    if (existingEdge) {
      if (Object.prototype.hasOwnProperty.call(edgePatch, 'sourceAnchor')) {
        existingEdge.sourceAnchor = edgePatch.sourceAnchor || null
      }
      if (Object.prototype.hasOwnProperty.call(edgePatch, 'targetAnchor')) {
        existingEdge.targetAnchor = edgePatch.targetAnchor || null
      }
      if (
        Object.prototype.hasOwnProperty.call(edgePatch, 'sourceAnchor') ||
        Object.prototype.hasOwnProperty.call(edgePatch, 'targetAnchor')
      ) {
        existingEdge.route = null
      }
      return existingEdge
    }
    const edge = {
      id: createNodeId('edge'),
      source,
      target,
      label,
      sourceAnchor: edgePatch.sourceAnchor || null,
      targetAnchor: edgePatch.targetAnchor || null,
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
    if (this.inlineTextEditorState) {
      void this.commitInlineTextEditor()
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
    this.pendingConnectorPoint = this.getWorldPointFromEvent(pointerEvent)
    if (this.connectorDragFrameId) {
      return
    }
    this.connectorDragFrameId = window.requestAnimationFrame(() => {
      this.connectorDragFrameId = 0
      this.flushConnectorDragFrame()
    })
  },

  flushConnectorDragFrame() {
    if (!this.connectorDragState) {
      return
    }
    const currentPoint = this.pendingConnectorPoint
    this.pendingConnectorPoint = null
    if (!currentPoint) {
      return
    }
    const targetNode = this.findNodeAtWorldPoint(currentPoint, {
      excludeIds: [this.connectorDragState.nodeId],
      padding: FLOWCHART_NODE_HIT_PADDING
    })
    const previewAnchor = targetNode
      ? this.getNodeConnectionAnchor(targetNode, currentPoint)
      : null
    const previewTarget = previewAnchor
      ? previewAnchor.point
      : currentPoint
    this.connectorDragState = {
      ...this.connectorDragState,
      currentPoint,
      targetNodeId: targetNode?.id || '',
      targetAnchor: previewAnchor?.anchor || null
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
    if (this.connectorDragFrameId) {
      window.cancelAnimationFrame(this.connectorDragFrameId)
      this.connectorDragFrameId = 0
    }
    this.pendingConnectorPoint = releasePoint
    this.flushConnectorDragFrame()
    const sourceNode = this.getNodeById(dragSnapshot.nodeId)
    const targetNode = this.findNodeAtWorldPoint(releasePoint, {
      excludeIds: [dragSnapshot.nodeId],
      padding: FLOWCHART_NODE_HIT_PADDING
    })
    this.cancelConnectorDrag()
    if (!sourceNode) {
      return
    }
    const delta =
      Math.abs(releasePoint.x - dragSnapshot.startPoint.x) +
      Math.abs(releasePoint.y - dragSnapshot.startPoint.y)
    if (targetNode) {
      const targetAnchor = this.getNodeConnectionAnchor(targetNode, releasePoint).anchor
      const targetEdge = this.ensureFlowchartEdge(sourceNode.id, targetNode.id, '', {
        sourceAnchor: this.getDirectionAnchor(dragSnapshot.direction),
        targetAnchor
      })
      this.selectedEdgeId = targetEdge.id
      this.selectedNodeIds = []
      this.syncEdgeToolbarState(targetEdge.id)
      this.suppressPointerClick()
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
    this.ensureFlowchartEdge(sourceNode.id, newNode.id, '', {
      sourceAnchor: this.getDirectionAnchor(dragSnapshot.direction),
      targetAnchor: this.getDirectionAnchor(
        {
          top: 'bottom',
          right: 'left',
          bottom: 'top',
          left: 'right'
        }[dragSnapshot.direction] || 'left'
      )
    })
    this.selectedNodeIds = [newNode.id]
    this.selectedEdgeId = ''
    this.closeInspector()
    this.suppressPointerClick()
    await this.persistFlowchartState()
  },

  cancelConnectorDrag() {
    this.connectorDragState = null
    this.connectorPreview = null
    this.pendingConnectorPoint = null
    if (this.connectorDragFrameId) {
      window.cancelAnimationFrame(this.connectorDragFrameId)
      this.connectorDragFrameId = 0
    }
    this.removeConnectorDragListeners()
  },

  removeConnectorDragListeners() {
    window.removeEventListener('mousemove', this.updateConnectorDrag)
    window.removeEventListener('mouseup', this.commitConnectorDrag)
  }
}
