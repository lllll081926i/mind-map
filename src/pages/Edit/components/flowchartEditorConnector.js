import {
  getFlowchartEdgeLayout,
  getFlowchartNodeConnectionPoint,
  getFlowchartNodeAnchorPresets,
  normalizeFlowchartNodeAnchor
} from '@/services/flowchartDocument'
import {
  FLOWCHART_NODE_HIT_PADDING,
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
      !this.connectorDragState &&
      !this.edgeReconnectState &&
      !this.inlineTextEditorState
    )
  },

  getConnectorDirectionsForNode(node) {
    return getFlowchartNodeAnchorPresets(node).map(anchor => anchor.handleKey)
  },

  getNodeConnectorPoint(node, direction) {
    return getFlowchartNodeConnectionPoint(node, direction)
  },

  getDirectionAnchor(direction, node = null) {
    const presets = getFlowchartNodeAnchorPresets(node)
    const presetAnchor = presets.find(anchor => anchor?.handleKey === direction)
    if (presetAnchor) {
      return normalizeFlowchartNodeAnchor({
        ...presetAnchor,
        locked: true
      })
    }
    const anchorMap = {
      top: { handleKey: 'top', xRatio: 0.5, yRatio: 0, direction: 'top' },
      right: { handleKey: 'right', xRatio: 1, yRatio: 0.5, direction: 'right' },
      bottom: { handleKey: 'bottom', xRatio: 0.5, yRatio: 1, direction: 'bottom' },
      left: { handleKey: 'left', xRatio: 0, yRatio: 0.5, direction: 'left' }
    }
    return normalizeFlowchartNodeAnchor({
      ...(anchorMap[direction] || anchorMap.right),
      locked: true
    })
  },

  getNodeConnectionAnchor(node, referencePoint) {
    const presetAnchors = getFlowchartNodeAnchorPresets(node)
    const snappedPreset =
      presetAnchors
        .map(anchor => {
          const point = this.getNodeConnectorPoint(node, anchor)
          return {
            anchor,
            point,
            distance: Math.hypot(
              Number(referencePoint?.x || 0) - Number(point.x || 0),
              Number(referencePoint?.y || 0) - Number(point.y || 0)
            )
          }
        })
        .sort((first, second) => first.distance - second.distance)[0] || null
    if (snappedPreset) {
      return {
        anchor: normalizeFlowchartNodeAnchor({
          ...snappedPreset.anchor,
          locked: true
        }),
        point: snappedPreset.point
      }
    }
    const fallbackAnchor = this.getDirectionAnchor('right', node)
    return {
      anchor: fallbackAnchor,
      point: this.getNodeConnectorPoint(node, fallbackAnchor)
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

  createFlowchartConnectionPreview({
    sourceNode,
    targetNode,
    sourceAnchor = null,
    targetAnchor = null,
    style = {},
    fallbackSourcePoint = null,
    fallbackTargetPoint = null
  }) {
    if (!sourceNode || !targetNode) {
      return this.createConnectorPreview(
        fallbackSourcePoint || { x: 0, y: 0 },
        fallbackTargetPoint || fallbackSourcePoint || { x: 0, y: 0 }
      )
    }
    const layout = getFlowchartEdgeLayout(
      {
        id: 'flowchart-preview-edge',
        source: sourceNode.id,
        target: targetNode.id,
        sourceAnchor,
        targetAnchor,
        style: {
          pathType: 'orthogonal',
          ...(style || {})
        }
      },
      sourceNode,
      targetNode,
      {
        theme: this.resolvedFlowchartTheme,
        strictAlignment: !!this.flowchartConfig.strictAlignment,
        nodes: this.flowchartData.nodes
      }
    )
    return {
      sourcePoint: layout.sourcePoint,
      targetPoint: layout.targetPoint,
      path: layout.path
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
    const sourceNode = this.getNodeById(this.connectorDragState.nodeId)
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
    this.connectorPreview =
      targetNode && sourceNode
        ? this.createFlowchartConnectionPreview({
            sourceNode,
            targetNode,
            sourceAnchor: this.getDirectionAnchor(
              this.connectorDragState.direction,
              sourceNode
            ),
            targetAnchor: previewAnchor?.anchor || null,
            fallbackSourcePoint: this.connectorDragState.startPoint,
            fallbackTargetPoint: previewTarget
          })
        : this.createConnectorPreview(
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
        sourceAnchor: this.getDirectionAnchor(dragSnapshot.direction, sourceNode),
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
      sourceAnchor: this.getDirectionAnchor(dragSnapshot.direction, sourceNode),
      targetAnchor: this.getNodeConnectionAnchor(newNode, getNodeCenter(sourceNode)).anchor
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
