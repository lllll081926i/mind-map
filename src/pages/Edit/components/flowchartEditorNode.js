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
        type: payload,
        autoConnect: false,
        startInlineEdit: true
      }
    }
    return {
      type: payload?.type || 'process',
      worldPoint: payload?.worldPoint || null,
      autoConnect: !!payload?.autoConnect,
      startInlineEdit: payload?.startInlineEdit !== false
    }
  },

  async addNodeByType(payload = 'process') {
    const { type, worldPoint, autoConnect, startInlineEdit } =
      this.normalizeAddNodePayload(payload)
    const typeDef = FLOWCHART_NODE_TYPES.find(item => item.type === type)
    const size = this.getDefaultNodeSizeByType(type)
    const sourceNode =
      autoConnect && !worldPoint && this.selectedNodeIds.length === 1
        ? this.getNodeById(this.selectedNodeIds[0])
        : null
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
    if (sourceNode) {
      this.ensureFlowchartEdge(sourceNode.id, nextNode.id)
    }
    this.selectedNodeIds = [nextNode.id]
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
    this.closeInspector()
    await this.persistFlowchartState()
    if (startInlineEdit) {
      this.openInlineTextEditor({
        kind: 'node',
        id: nextNode.id
      })
    }
  },

  addNodeAtCanvasPoint(event) {
    const target = event?.target
    if (
      target?.closest?.(
        '.flowchartNode, .edgePath, .edgeLabel, .flowchartViewportToolbar, .flowchartEdgeToolbar, .flowchartInlineEditor, .flowchartConnectorHandle, .canvasEmptyActions'
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

  getNodeCenterPosition(node) {
    return {
      x: Number(node.x || 0) + Number(node.width || 0) / 2,
      y: Number(node.y || 0) + Number(node.height || 0) / 2
    }
  },

  getFlowchartTidyAxisConfig(orientation = 'horizontal') {
    return orientation === 'horizontal'
      ? {
          primaryKey: 'x',
          secondaryKey: 'y',
          primarySizeKey: 'width',
          secondarySizeKey: 'height'
        }
      : {
          primaryKey: 'y',
          secondaryKey: 'x',
          primarySizeKey: 'height',
          secondarySizeKey: 'width'
        }
  },

  getFlowchartNodeAxisStart(node, axisKey) {
    return Number(node?.[axisKey] || 0)
  },

  getFlowchartNodeAxisSize(node, sizeKey) {
    return Number(node?.[sizeKey] || 0)
  },

  getFlowchartNodeAxisCenter(node, axisKey, sizeKey) {
    return (
      this.getFlowchartNodeAxisStart(node, axisKey) +
      this.getFlowchartNodeAxisSize(node, sizeKey) / 2
    )
  },

  buildFlowchartNodeRelationMaps(nodes = []) {
    const nodeLookup = new Map(nodes.map(node => [node.id, node]))
    const outgoingMap = new Map(nodes.map(node => [node.id, []]))
    const incomingMap = new Map(nodes.map(node => [node.id, []]))
    const adjacentMap = new Map(nodes.map(node => [node.id, new Set()]))
    this.flowchartData.edges.forEach(edge => {
      if (!nodeLookup.has(edge.source) || !nodeLookup.has(edge.target)) {
        return
      }
      outgoingMap.get(edge.source).push(edge.target)
      incomingMap.get(edge.target).push(edge.source)
      adjacentMap.get(edge.source).add(edge.target)
      adjacentMap.get(edge.target).add(edge.source)
    })
    return {
      nodeLookup,
      outgoingMap,
      incomingMap,
      adjacentMap
    }
  },

  getFlowchartTidyLaneAssignments(nodes = [], axisConfig = null) {
    const resolvedAxisConfig = axisConfig || this.getFlowchartTidyAxisConfig()
    const lanes = Array.isArray(this.flowchartData?.lanes) ? this.flowchartData.lanes : []
    if (!lanes.length) {
      return new Map()
    }
    const sortedLanes = [...lanes].sort((a, b) => {
      return (
        this.getFlowchartNodeAxisStart(a, resolvedAxisConfig.secondaryKey) -
          this.getFlowchartNodeAxisStart(b, resolvedAxisConfig.secondaryKey) ||
        this.getFlowchartNodeAxisStart(a, resolvedAxisConfig.primaryKey) -
          this.getFlowchartNodeAxisStart(b, resolvedAxisConfig.primaryKey)
      )
    })
    return nodes.reduce((result, node) => {
      const centerPrimary = this.getFlowchartNodeAxisCenter(
        node,
        resolvedAxisConfig.primaryKey,
        resolvedAxisConfig.primarySizeKey
      )
      const centerSecondary = this.getFlowchartNodeAxisCenter(
        node,
        resolvedAxisConfig.secondaryKey,
        resolvedAxisConfig.secondarySizeKey
      )
      const lane = sortedLanes.find(item => {
        const lanePrimaryStart = this.getFlowchartNodeAxisStart(item, resolvedAxisConfig.primaryKey)
        const laneSecondaryStart = this.getFlowchartNodeAxisStart(item, resolvedAxisConfig.secondaryKey)
        return (
          centerPrimary >= lanePrimaryStart &&
          centerPrimary <= lanePrimaryStart + this.getFlowchartNodeAxisSize(item, resolvedAxisConfig.primarySizeKey) &&
          centerSecondary >= laneSecondaryStart &&
          centerSecondary <= laneSecondaryStart + this.getFlowchartNodeAxisSize(item, resolvedAxisConfig.secondarySizeKey)
        )
      })
      if (lane) {
        result.set(node.id, {
          laneId: lane.id,
          rank: sortedLanes.findIndex(item => item.id === lane.id)
        })
      }
      return result
    }, new Map())
  },

  getFlowchartConnectedComponents(nodes = [], relationMaps = null, axisConfig = null) {
    const resolvedAxisConfig = axisConfig || this.getFlowchartTidyAxisConfig()
    const maps = relationMaps || this.buildFlowchartNodeRelationMaps(nodes)
    const visited = new Set()
    const components = []
    nodes.forEach(node => {
      if (visited.has(node.id)) {
        return
      }
      const queue = [node.id]
      const componentNodes = []
      visited.add(node.id)
      while (queue.length) {
        const currentId = queue.shift()
        const currentNode = maps.nodeLookup.get(currentId)
        if (currentNode) {
          componentNodes.push(currentNode)
        }
        ;(maps.adjacentMap.get(currentId) || []).forEach(nextId => {
          if (visited.has(nextId)) {
            return
          }
          visited.add(nextId)
          queue.push(nextId)
        })
      }
      componentNodes.sort((a, b) => {
        return (
          this.getFlowchartNodeAxisStart(a, resolvedAxisConfig.primaryKey) -
            this.getFlowchartNodeAxisStart(b, resolvedAxisConfig.primaryKey) ||
          this.getFlowchartNodeAxisStart(a, resolvedAxisConfig.secondaryKey) -
            this.getFlowchartNodeAxisStart(b, resolvedAxisConfig.secondaryKey)
        )
      })
      components.push(componentNodes)
    })
    return components.sort((a, b) => {
      const firstA = a[0]
      const firstB = b[0]
      return (
        this.getFlowchartNodeAxisStart(firstA, resolvedAxisConfig.primaryKey) -
          this.getFlowchartNodeAxisStart(firstB, resolvedAxisConfig.primaryKey) ||
        this.getFlowchartNodeAxisStart(firstA, resolvedAxisConfig.secondaryKey) -
          this.getFlowchartNodeAxisStart(firstB, resolvedAxisConfig.secondaryKey)
      )
    })
  },

  getFlowchartTidyComponentLevels(componentNodes = [], relationMaps = null, orientation = 'horizontal') {
    const axisConfig = this.getFlowchartTidyAxisConfig(orientation)
    const maps = relationMaps || this.buildFlowchartNodeRelationMaps(componentNodes)
    const componentNodeIds = new Set(componentNodes.map(node => node.id))
    const indegreeMap = new Map(componentNodes.map(node => [node.id, 0]))
    componentNodes.forEach(node => {
      ;(maps.outgoingMap.get(node.id) || []).forEach(targetId => {
        if (componentNodeIds.has(targetId)) {
          indegreeMap.set(targetId, Number(indegreeMap.get(targetId) || 0) + 1)
        }
      })
    })
    const sortNodeIds = nodeIds => {
      return [...nodeIds].sort((aId, bId) => {
        const aNode = maps.nodeLookup.get(aId)
        const bNode = maps.nodeLookup.get(bId)
        if (!aNode || !bNode) {
          return 0
        }
        return (
          this.getFlowchartNodeAxisStart(aNode, axisConfig.secondaryKey) -
            this.getFlowchartNodeAxisStart(bNode, axisConfig.secondaryKey) ||
          this.getFlowchartNodeAxisStart(aNode, axisConfig.primaryKey) -
            this.getFlowchartNodeAxisStart(bNode, axisConfig.primaryKey)
        )
      })
    }
    const seedNodeIds = sortNodeIds(
      componentNodes
        .filter(node => {
          return node.type === 'start' || !Number(indegreeMap.get(node.id) || 0)
        })
        .map(node => node.id)
    )
    const pendingNodeIds = seedNodeIds.length
      ? [...seedNodeIds]
      : sortNodeIds(componentNodes.map(node => node.id).slice(0, 1))
    const enqueued = new Set(pendingNodeIds)
    const topoOrder = []
    while (pendingNodeIds.length) {
      const currentId = pendingNodeIds.shift()
      topoOrder.push(currentId)
      ;(maps.outgoingMap.get(currentId) || []).forEach(targetId => {
        if (!componentNodeIds.has(targetId)) {
          return
        }
        indegreeMap.set(targetId, Number(indegreeMap.get(targetId) || 0) - 1)
        if (!Number(indegreeMap.get(targetId) || 0) && !enqueued.has(targetId)) {
          enqueued.add(targetId)
          pendingNodeIds.push(targetId)
        }
      })
      pendingNodeIds.sort((aId, bId) => {
        const aNode = maps.nodeLookup.get(aId)
        const bNode = maps.nodeLookup.get(bId)
        if (!aNode || !bNode) {
          return 0
        }
        return (
          this.getFlowchartNodeAxisStart(aNode, axisConfig.secondaryKey) -
            this.getFlowchartNodeAxisStart(bNode, axisConfig.secondaryKey) ||
          this.getFlowchartNodeAxisStart(aNode, axisConfig.primaryKey) -
            this.getFlowchartNodeAxisStart(bNode, axisConfig.primaryKey)
        )
      })
    }
    const remainingIds = sortNodeIds(
      componentNodes
        .filter(node => !topoOrder.includes(node.id))
        .map(node => node.id)
    )
    topoOrder.push(...remainingIds)

    const levelMap = new Map(componentNodes.map(node => [node.id, 0]))
    topoOrder.forEach(nodeId => {
      const currentLevel = Number(levelMap.get(nodeId) || 0)
      ;(maps.outgoingMap.get(nodeId) || []).forEach(targetId => {
        if (!componentNodeIds.has(targetId)) {
          return
        }
        const nextLevel = currentLevel + 1
        if (nextLevel > Number(levelMap.get(targetId) || 0)) {
          levelMap.set(targetId, nextLevel)
        }
      })
    })
    return levelMap
  },

  createFlowchartTidyOrderIndexMap(levelNodes = []) {
    return new Map(levelNodes.map((node, index) => [node.id, index]))
  },

  getFlowchartTidyOrderWeight(node, {
    previousOrderMap = null,
    nextOrderMap = null,
    currentOrderMap = null,
    incomingMap = null,
    outgoingMap = null,
    axisConfig = null,
    laneAssignments = null
  } = {}) {
    const resolvedAxisConfig = axisConfig || this.getFlowchartTidyAxisConfig()
    const laneRank = laneAssignments?.get(node.id)?.rank
    const currentOrder = Number(currentOrderMap?.get(node.id) || 0)
    const currentSecondary = this.getFlowchartNodeAxisCenter(
      node,
      resolvedAxisConfig.secondaryKey,
      resolvedAxisConfig.secondarySizeKey
    )
    const parentOrders = (incomingMap?.get(node.id) || [])
      .map(parentId => previousOrderMap?.get(parentId))
      .filter(value => value !== undefined)
    const childOrders = (outgoingMap?.get(node.id) || [])
      .map(childId => nextOrderMap?.get(childId))
      .filter(value => value !== undefined)
    let score = 0
    let weight = 0
    if (parentOrders.length) {
      score +=
        (parentOrders.reduce((sum, value) => sum + value, 0) / parentOrders.length) * 0.6
      weight += 0.6
    }
    if (childOrders.length) {
      score +=
        (childOrders.reduce((sum, value) => sum + value, 0) / childOrders.length) * 0.25
      weight += 0.25
    }
    score += currentOrder * 0.15
    weight += 0.15
    return {
      laneRank: laneRank === undefined ? Number.MAX_SAFE_INTEGER : laneRank,
      score: weight ? score / weight : currentSecondary,
      currentSecondary
    }
  },

  sortFlowchartTidyLevelNodes(levelNodes = [], context = {}) {
    return [...levelNodes].sort((a, b) => {
      const aWeight = this.getFlowchartTidyOrderWeight(a, context)
      const bWeight = this.getFlowchartTidyOrderWeight(b, context)
      return (
        aWeight.laneRank - bWeight.laneRank ||
        aWeight.score - bWeight.score ||
        aWeight.currentSecondary - bWeight.currentSecondary
      )
    })
  },

  getFlowchartTidyLevelPrimaryPositions(groupedLevels = [], axisConfig = null) {
    const resolvedAxisConfig = axisConfig || this.getFlowchartTidyAxisConfig()
    const desiredAnchors = groupedLevels.map(([, levelNodes]) => {
      const starts = levelNodes.map(node => this.getFlowchartNodeAxisStart(node, resolvedAxisConfig.primaryKey))
      return starts.reduce((sum, value) => sum + value, 0) / Math.max(starts.length, 1)
    })
    const levelGap = resolvedAxisConfig.primaryKey === 'x' ? 156 : 132
    const positions = []
    groupedLevels.forEach(([, levelNodes], index) => {
      const maxPrimarySize = Math.max(
        ...levelNodes.map(node => this.getFlowchartNodeAxisSize(node, resolvedAxisConfig.primarySizeKey)),
        0
      )
      const desiredPrimary = Number.isFinite(desiredAnchors[index])
        ? desiredAnchors[index]
        : positions[index - 1] || 0
      if (!index) {
        positions.push(desiredPrimary)
        return
      }
      const previousPrimary = positions[index - 1]
      const previousPrimarySize = Math.max(
        ...groupedLevels[index - 1][1].map(node => {
          return this.getFlowchartNodeAxisSize(node, resolvedAxisConfig.primarySizeKey)
        }),
        0
      )
      positions.push(
        Math.max(
          desiredPrimary,
          previousPrimary + previousPrimarySize + levelGap
        )
      )
      if (!maxPrimarySize) {
        positions[index] = desiredPrimary
      }
    })
    return positions
  },

  getFlowchartTidyLevelSecondaryLayout(levelNodes = [], axisConfig = null) {
    const resolvedAxisConfig = axisConfig || this.getFlowchartTidyAxisConfig()
    const itemGap = resolvedAxisConfig.secondaryKey === 'y' ? 96 : 88
    const currentSecondaryCenter =
      levelNodes.reduce((sum, node) => {
        return (
          sum +
          this.getFlowchartNodeAxisCenter(
            node,
            resolvedAxisConfig.secondaryKey,
            resolvedAxisConfig.secondarySizeKey
          )
        )
      }, 0) / Math.max(levelNodes.length, 1)
    const totalSecondarySize = levelNodes.reduce((sum, node, nodeIndex) => {
      return (
        sum +
        this.getFlowchartNodeAxisSize(node, resolvedAxisConfig.secondarySizeKey) +
        (nodeIndex > 0 ? itemGap : 0)
      )
    }, 0)
    return {
      itemGap,
      currentSecondaryCenter,
      totalSecondarySize,
      startSecondary: currentSecondaryCenter - totalSecondarySize / 2
    }
  },

  getFlowchartTidyOrientation() {
    const edgeDirectionVotes = this.flowchartData.edges.reduce(
      (result, edge) => {
        const sourceNode = this.getNodeById(edge.source)
        const targetNode = this.getNodeById(edge.target)
        if (!sourceNode || !targetNode) {
          return result
        }
        const sourceCenter = this.getNodeCenterPosition(sourceNode)
        const targetCenter = this.getNodeCenterPosition(targetNode)
        if (Math.abs(targetCenter.x - sourceCenter.x) >= Math.abs(targetCenter.y - sourceCenter.y)) {
          result.horizontal += 1
        } else {
          result.vertical += 1
        }
        return result
      },
      {
        horizontal: 0,
        vertical: 0
      }
    )
    if (edgeDirectionVotes.horizontal || edgeDirectionVotes.vertical) {
      return edgeDirectionVotes.horizontal >= edgeDirectionVotes.vertical
        ? 'horizontal'
        : 'vertical'
    }
    const xPositions = this.flowchartData.nodes.map(node => Number(node.x || 0))
    const yPositions = this.flowchartData.nodes.map(node => Number(node.y || 0))
    return Math.max(...xPositions) - Math.min(...xPositions) >=
      Math.max(...yPositions) - Math.min(...yPositions)
      ? 'horizontal'
      : 'vertical'
  },

  async tidyFlowchartLayout(options = {}) {
    const { silent = false } = options || {}
    const nodes = this.flowchartData.nodes
    if (nodes.length < 2) {
      return
    }
    const orientation = this.getFlowchartTidyOrientation()
    const axisConfig = this.getFlowchartTidyAxisConfig(orientation)
    const relationMaps = this.buildFlowchartNodeRelationMaps(nodes)
    const laneAssignments = this.getFlowchartTidyLaneAssignments(nodes, axisConfig)
    const components = this.getFlowchartConnectedComponents(
      nodes,
      relationMaps,
      axisConfig
    )

    components.forEach(componentNodes => {
      const levelMap = this.getFlowchartTidyComponentLevels(
        componentNodes,
        relationMaps,
        orientation
      )
      const groupedLevels = Array.from(
        componentNodes.reduce((result, node) => {
          const level = Number(levelMap.get(node.id) || 0)
          if (!result.has(level)) {
            result.set(level, [])
          }
          result.get(level).push(node)
          return result
        }, new Map())
      ).sort((a, b) => a[0] - b[0])

      const orderedLevels = groupedLevels.map(([level, levelNodes]) => {
        return [
          level,
          [...levelNodes].sort((a, b) => {
            return (
              this.getFlowchartNodeAxisCenter(
                a,
                axisConfig.secondaryKey,
                axisConfig.secondarySizeKey
              ) -
                this.getFlowchartNodeAxisCenter(
                  b,
                  axisConfig.secondaryKey,
                  axisConfig.secondarySizeKey
                ) ||
              this.getFlowchartNodeAxisStart(a, axisConfig.primaryKey) -
                this.getFlowchartNodeAxisStart(b, axisConfig.primaryKey)
            )
          })
        ]
      })

      for (let index = 1; index < orderedLevels.length; index += 1) {
        const currentOrderMap = this.createFlowchartTidyOrderIndexMap(
          orderedLevels[index][1]
        )
        orderedLevels[index][1] = this.sortFlowchartTidyLevelNodes(
          orderedLevels[index][1],
          {
            previousOrderMap: this.createFlowchartTidyOrderIndexMap(
              orderedLevels[index - 1][1]
            ),
            nextOrderMap:
              index < orderedLevels.length - 1
                ? this.createFlowchartTidyOrderIndexMap(orderedLevels[index + 1][1])
                : null,
            currentOrderMap,
            incomingMap: relationMaps.incomingMap,
            outgoingMap: relationMaps.outgoingMap,
            axisConfig,
            laneAssignments
          }
        )
      }
      for (let index = orderedLevels.length - 2; index >= 0; index -= 1) {
        const currentOrderMap = this.createFlowchartTidyOrderIndexMap(
          orderedLevels[index][1]
        )
        orderedLevels[index][1] = this.sortFlowchartTidyLevelNodes(
          orderedLevels[index][1],
          {
            previousOrderMap:
              index > 0
                ? this.createFlowchartTidyOrderIndexMap(orderedLevels[index - 1][1])
                : null,
            nextOrderMap: this.createFlowchartTidyOrderIndexMap(
              orderedLevels[index + 1][1]
            ),
            currentOrderMap,
            incomingMap: relationMaps.incomingMap,
            outgoingMap: relationMaps.outgoingMap,
            axisConfig,
            laneAssignments
          }
        )
      }

      const levelPrimaryPositions = this.getFlowchartTidyLevelPrimaryPositions(
        orderedLevels,
        axisConfig
      )
      orderedLevels.forEach(([, levelNodes], levelIndex) => {
        const levelPrimary = levelPrimaryPositions[levelIndex]
        const secondaryLayout = this.getFlowchartTidyLevelSecondaryLayout(
          levelNodes,
          axisConfig
        )
        let cursorSecondary = secondaryLayout.startSecondary
        levelNodes.forEach(node => {
          const nextPosition =
            orientation === 'horizontal'
              ? {
                  x: levelPrimary,
                  y: cursorSecondary
                }
              : {
                  x: cursorSecondary,
                  y: levelPrimary
                }
          const snappedPosition = this.snapPositionToGrid(nextPosition)
          node.x = snappedPosition.x
          node.y = snappedPosition.y
          cursorSecondary +=
            this.getFlowchartNodeAxisSize(node, axisConfig.secondarySizeKey) +
            secondaryLayout.itemGap
        })
      })
    })

    this.clearAlignmentGuides()
    this.syncEdgeToolbarState()
    await this.persistFlowchartState()
    if (!silent) {
      this.$message.success(this.$t('flowchart.tidyLayoutDone'))
    }
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
      return this.getNodeCenterPosition(a).x - this.getNodeCenterPosition(b).x
    })
    const first = sortedNodes[0]
    const last = sortedNodes[sortedNodes.length - 1]
    const startX = this.getNodeCenterPosition(first).x
    const endX = this.getNodeCenterPosition(last).x
    const step = (endX - startX) / (sortedNodes.length - 1)
    sortedNodes.forEach((node, index) => {
      const targetCenterX = startX + step * index
      const snappedPosition = this.snapPositionToGrid({
        x: targetCenterX - Number(node.width || 0) / 2,
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
      return this.getNodeCenterPosition(a).y - this.getNodeCenterPosition(b).y
    })
    const first = sortedNodes[0]
    const last = sortedNodes[sortedNodes.length - 1]
    const startY = this.getNodeCenterPosition(first).y
    const endY = this.getNodeCenterPosition(last).y
    const step = (endY - startY) / (sortedNodes.length - 1)
    sortedNodes.forEach((node, index) => {
      const targetCenterY = startY + step * index
      const snappedPosition = this.snapPositionToGrid({
        x: Number(node.x || 0),
        y: targetCenterY - Number(node.height || 0) / 2
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
      snapLock: {
        x: null,
        y: null
      },
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
