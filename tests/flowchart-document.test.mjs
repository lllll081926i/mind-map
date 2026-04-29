import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const flowchartDocumentPath = path.resolve('src/services/flowchartDocument.js')

const loadFlowchartDocumentModule = async () => {
  const source = fs
    .readFileSync(flowchartDocumentPath, 'utf8')
    .replace(
      "import { parseExternalJsonSafely } from '@/utils/json'",
      `const parseExternalJsonSafely = value => {
        try {
          return JSON.parse(String(value || ''))
        } catch (_error) {
          return null
        }
      }`
    )
  return import(
    `data:text/javascript;base64,${Buffer.from(source, 'utf8').toString('base64')}`
  )
}

const doesFlowchartTestSegmentEnterNodeInterior = (startPoint, endPoint, node) => {
  const left = Number(node.x || 0) + 0.1
  const right = Number(node.x || 0) + Number(node.width || 0) - 0.1
  const top = Number(node.y || 0) + 0.1
  const bottom = Number(node.y || 0) + Number(node.height || 0) - 0.1
  if (Math.abs(Number(startPoint.x || 0) - Number(endPoint.x || 0)) <= 0.001) {
    const x = Number(startPoint.x || 0)
    return (
      x > left &&
      x < right &&
      Math.min(Number(startPoint.y || 0), Number(endPoint.y || 0)) < bottom &&
      Math.max(Number(startPoint.y || 0), Number(endPoint.y || 0)) > top
    )
  }
  if (Math.abs(Number(startPoint.y || 0) - Number(endPoint.y || 0)) <= 0.001) {
    const y = Number(startPoint.y || 0)
    return (
      y > top &&
      y < bottom &&
      Math.min(Number(startPoint.x || 0), Number(endPoint.x || 0)) < right &&
      Math.max(Number(startPoint.x || 0), Number(endPoint.x || 0)) > left
    )
  }
  return false
}

const getFlowchartTestPolylineInteriorHits = (pathPoints, nodes, ignoredNodeIds = []) => {
  const ignoredIds = new Set(ignoredNodeIds)
  return nodes.filter(node => {
    if (ignoredIds.has(node.id)) {
      return false
    }
    return pathPoints.slice(0, -1).some((point, index) => {
      return doesFlowchartTestSegmentEnterNodeInterior(
        point,
        pathPoints[index + 1],
        node
      )
    })
  })
}

const doesFlowchartTestPathBacktrackNearEndpoint = (
  pathPoints,
  direction,
  endpoint = 'source'
) => {
  const points = endpoint === 'target' ? [...(pathPoints || [])].reverse() : [...(pathPoints || [])]
  if (points.length < 3) {
    return false
  }
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
  const sign = direction === 'right' || direction === 'bottom' ? 1 : -1
  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1]
    const currentPoint = points[index]
    const deltaAxis = Number(currentPoint?.[axis] || 0) - Number(previousPoint?.[axis] || 0)
    const deltaCross =
      axis === 'x'
        ? Number(currentPoint?.y || 0) - Number(previousPoint?.y || 0)
        : Number(currentPoint?.x || 0) - Number(previousPoint?.x || 0)
    if (Math.abs(deltaAxis) <= 0.001 && Math.abs(deltaCross) <= 0.001) {
      continue
    }
    if (Math.abs(deltaAxis) <= 0.001) {
      break
    }
    if (deltaAxis * sign < -0.001) {
      return true
    }
  }
  return false
}

test('流程图文档服务存在并暴露核心能力', () => {
  assert.equal(fs.existsSync(flowchartDocumentPath), true)
  const source = fs.readFileSync(flowchartDocumentPath, 'utf8')

  assert.match(source, /export\s+const\s+FLOWCHART_DOCUMENT_MODE/)
  assert.match(source, /export\s+const\s+createDefaultFlowchartData/)
  assert.match(source, /export\s+const\s+createFlowchartDocumentContent/)
  assert.match(source, /export\s+const\s+parseStoredDocumentContent/)
  assert.match(source, /export\s+const\s+serializeStoredDocumentContent/)
  assert.match(source, /export\s+const\s+convertMindMapToFlowchart/)
  assert.match(source, /export\s+const\s+normalizeFlowchartAiResult/)
  assert.match(source, /export\s+const\s+getFlowchartExportBounds/)
  assert.match(source, /export\s+const\s+buildFlowchartSvgMarkup/)
})

test('流程图文档模型包含节点、连线、视口和模板字段', () => {
  const source = fs.readFileSync(flowchartDocumentPath, 'utf8')

  assert.match(source, /strictAlignment:\s*false/)
  assert.match(source, /backgroundStyle:\s*'grid'/)
  assert.doesNotMatch(source, /laneBackgroundStyle:\s*'none'/)
  assert.match(source, /templateId/)
  assert.match(source, /FLOWCHART_TEMPLATE_PRESETS/)
  assert.match(source, /FLOWCHART_THEME_PRESETS/)
  assert.match(source, /getFlowchartThemeDefinition/)
  assert.match(source, /viewport/)
  assert.match(source, /lanes/)
  assert.match(source, /nodes/)
  assert.match(source, /edges/)
  assert.match(source, /sourceAnchor/)
  assert.match(source, /targetAnchor/)
  assert.match(source, /labelPosition/)
  assert.match(source, /type:\s*'start'/)
  assert.match(source, /type:\s*'process'/)
  assert.match(source, /type:\s*'decision'/)
  assert.match(source, /type:\s*'input'/)
  assert.match(source, /type:\s*'end'/)
  assert.match(source, /release:\s*title =>/)
  assert.match(source, /ticket:\s*title =>/)
  assert.match(source, /onboarding:\s*title =>/)
  assert.match(source, /customerJourney:\s*title =>/)
  assert.match(source, /incident:\s*title =>/)
  assert.match(source, /dataPipeline:\s*title =>/)
  assert.match(source, /projectPlan:\s*title =>/)
  assert.match(source, /crossFunctionalApproval:\s*title =>/)
  assert.match(source, /supportEscalation:\s*title =>/)
  assert.match(source, /contentReview:\s*title =>/)
  assert.match(source, /procurement:\s*title =>/)
  assert.match(source, /salesPipeline:\s*title =>/)
  assert.doesNotMatch(source, /customerOnboardingSwimlane:\s*title =>/)
  assert.doesNotMatch(source, /productLaunchSwimlane:\s*title =>/)
  assert.match(source, /FLOWCHART_TEMPLATE_PRESETS = \[/)
  assert.doesNotMatch(source, /FLOWCHART_TEMPLATE_PRESETS = \[[\s\S]*?\{ id: 'blank'/)
  assert.match(source, /categoryKey:\s*'flowchart\.templateCategory/)
  assert.match(source, /graphite:\s*\{/)
  assert.match(source, /clayWarm:\s*\{/)
  assert.match(source, /canvasBg:\s*'#ffffff'/)
  assert.doesNotMatch(source, /FLOWCHART_TEMPLATE_PRESETS[\s\S]*themeId:/)
})

test('流程图模板元数据会提供稳定分类，便于侧栏分组展示', async () => {
  const { FLOWCHART_TEMPLATE_PRESETS, getFlowchartTemplateMeta } =
    await loadFlowchartDocumentModule()

  const categoryKeys = new Set(
    FLOWCHART_TEMPLATE_PRESETS.map(item => String(item.categoryKey || ''))
  )
  const salesMeta = getFlowchartTemplateMeta('salesPipeline')
  const incidentMeta = getFlowchartTemplateMeta('incident')

  assert.ok(categoryKeys.size >= 4)
  assert.equal(String(salesMeta.categoryKey || '').startsWith('flowchart.templateCategory'), true)
  assert.equal(String(incidentMeta.categoryKey || '').startsWith('flowchart.templateCategory'), true)
})

test('流程图严格对齐配置会在文档层默认保留，并在导出时强制正交折线', () => {
  const source = fs.readFileSync(flowchartDocumentPath, 'utf8')

  assert.match(source, /strictAlignment:\s*false/)
  assert.match(source, /normalizeFlowchartBackgroundStyle/)
  assert.match(source, /pathType:\s*strictAlignment[\s\S]*?'orthogonal'/)
  assert.match(source, /strictAlignment:\s*!!normalizedConfig\.strictAlignment/)
})

test('流程图模板在生成时会统一改为自然转折连线布局', async () => {
  const { createDefaultFlowchartData } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('模板直线', 'approval')

  assert.ok(flowchartData.edges.length > 0)
  assert.equal(
    flowchartData.edges.every(edge => edge?.style?.pathType === 'orthogonal'),
    true
  )
})

test('非严格正交连线会优先使用朝向块的双转折路径，而不是末段方向错误的单拐点', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-natural-orthogonal',
      source: 'a',
      target: 'b',
      style: {
        pathType: 'orthogonal'
      }
    },
    {
      id: 'a',
      x: 120,
      y: 120,
      width: 168,
      height: 72
    },
    {
      id: 'b',
      x: 420,
      y: 320,
      width: 168,
      height: 72
    }
  )

  assert.equal(layout.style.pathType, 'orthogonal')
  assert.match(layout.path, /^M 288 156 L 354 156 L 354 356 L 420 356$/)
})

test('非严格正交连线在间距较小时保持四正中端点，并用两次转角保证箭头朝向节点', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-small-turn',
      source: 'a',
      target: 'b',
      style: {
        pathType: 'orthogonal'
      }
    },
    {
      id: 'a',
      x: 120,
      y: 120,
      width: 168,
      height: 72
    },
    {
      id: 'b',
      x: 320,
      y: 140,
      width: 168,
      height: 72
    }
  )

  assert.equal(layout.sourceDirection, 'right')
  assert.equal(layout.targetDirection, 'left')
  assert.deepEqual(layout.sourcePoint, { x: 288, y: 156 })
  assert.deepEqual(layout.targetPoint, { x: 320, y: 176 })
  assert.match(layout.path, /^M 288 156 L 304 156 L 304 176 L 320 176$/)
})

test('上下相连且连接点仅有轻微偏差时，不移动锚点并保持末段朝向目标节点', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-near-vertical',
      source: 'a',
      target: 'b',
      style: {
        pathType: 'orthogonal'
      }
    },
    {
      id: 'a',
      x: 60,
      y: 96,
      width: 140,
      height: 56
    },
    {
      id: 'b',
      x: 48,
      y: 216,
      width: 168,
      height: 72
    }
  )

  assert.equal(layout.sourceDirection, 'bottom')
  assert.equal(layout.targetDirection, 'top')
  assert.deepEqual(layout.sourcePoint, { x: 130, y: 152 })
  assert.deepEqual(layout.targetPoint, { x: 132, y: 216 })
  assert.match(layout.path, /^M 130 152 L 130 184 L 132 184 L 132 216$/)
})

test('上下节点轻微错列时保持上下锚点，并用中间通道自然转折', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-near-vertical-template',
      source: 'test',
      target: 'material',
      style: {
        pathType: 'orthogonal'
      }
    },
    {
      id: 'test',
      x: 552,
      y: 360,
      width: 168,
      height: 72
    },
    {
      id: 'material',
      x: 516,
      y: 504,
      width: 168,
      height: 72
    }
  )

  assert.equal(layout.sourceDirection, 'bottom')
  assert.equal(layout.targetDirection, 'top')
  assert.deepEqual(layout.sourcePoint, { x: 636, y: 432 })
  assert.deepEqual(layout.targetPoint, { x: 600, y: 504 })
  assert.match(layout.path, /^M 636 432 L 636 468 L 600 468 L 600 504$/)
})

test('非严格正交连线在前向空间不足时会切换方向，避免生成贴边小折线', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-double-turn',
      source: 'a',
      target: 'b',
      style: {
        pathType: 'orthogonal'
      }
    },
    {
      id: 'a',
      x: 120,
      y: 120,
      width: 168,
      height: 72
    },
    {
      id: 'b',
      x: 280,
      y: 240,
      width: 168,
      height: 72
    }
  )

  assert.equal(layout.style.pathType, 'orthogonal')
  assert.equal(layout.sourceDirection, 'bottom')
  assert.equal(layout.targetDirection, 'top')
  assert.deepEqual(layout.sourcePoint, { x: 204, y: 192 })
  assert.deepEqual(layout.targetPoint, { x: 364, y: 240 })
  assert.match(layout.path, /^M 204 192 L 204 216 L 364 216 L 364 240$/)
})

test('混合方向正交连线选择主通道时不会在源端或目标端形成回头线', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const sourceNode = {
    id: 'a',
    x: 696,
    y: 124,
    width: 149,
    height: 70
  }
  const targetNode = {
    id: 'b',
    x: 449,
    y: 136,
    width: 172,
    height: 78
  }
  const obstacleNode = {
    id: 'd',
    x: 646,
    y: 110,
    width: 154,
    height: 98
  }
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-no-backtrack-mixed-route',
      source: 'a',
      target: 'b',
      style: {
        pathType: 'orthogonal'
      }
    },
    sourceNode,
    targetNode,
    {
      nodes: [sourceNode, targetNode, obstacleNode]
    }
  )

  assert.equal(layout.sourceDirection, 'right')
  assert.equal(layout.targetDirection, 'bottom')
  assert.equal(
    doesFlowchartTestPathBacktrackNearEndpoint(
      layout.pathPoints,
      layout.sourceDirection,
      'source'
    ),
    false
  )
  assert.equal(
    doesFlowchartTestPathBacktrackNearEndpoint(
      layout.pathPoints,
      layout.targetDirection,
      'target'
    ),
    false
  )
})

test('横向重叠且受障碍物限制时，正交连线不会在源端附近先前进再折返', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const sourceNode = {
    id: 'qa',
    x: 684,
    y: 312,
    width: 188,
    height: 92
  }
  const targetNode = {
    id: 'training',
    x: 612,
    y: 312,
    width: 168,
    height: 72
  }
  const nodes = [
    sourceNode,
    targetNode,
    { id: 'vendor', x: 684, y: 192, width: 188, height: 92 },
    { id: 'data', x: 480, y: 312, width: 168, height: 72 },
    { id: 'handover', x: 696, y: 432, width: 168, height: 72 },
    { id: 'review', x: 912, y: 432, width: 168, height: 72 }
  ]
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-overlap-forward-lane',
      source: sourceNode.id,
      target: targetNode.id,
      style: {
        pathType: 'orthogonal'
      }
    },
    sourceNode,
    targetNode,
    {
      nodes
    }
  )

  assert.equal(
    doesFlowchartTestPathBacktrackNearEndpoint(
      layout.pathPoints,
      layout.sourceDirection,
      'source'
    ),
    false
  )
  assert.equal(
    doesFlowchartTestPathBacktrackNearEndpoint(
      layout.pathPoints,
      layout.targetDirection,
      'target'
    ),
    false
  )
  assert.deepEqual(
    getFlowchartTestPolylineInteriorHits(layout.pathPoints, nodes, [
      sourceNode.id,
      targetNode.id
    ]),
    []
  )
})

test('部分横向重叠的目标块会避免源端回头线，并保持目标箭头朝向块体', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const sourceNode = {
    id: 'qa',
    x: 684,
    y: 312,
    width: 188,
    height: 92
  }
  const targetNode = {
    id: 'training',
    x: 838,
    y: 312,
    width: 168,
    height: 72
  }
  const nodes = [
    sourceNode,
    targetNode,
    { id: 'vendor', x: 684, y: 192, width: 188, height: 92 },
    { id: 'handover', x: 696, y: 432, width: 168, height: 72 },
    { id: 'review', x: 912, y: 432, width: 168, height: 72 }
  ]
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-near-right-forward-lane',
      source: sourceNode.id,
      target: targetNode.id,
      style: {
        pathType: 'orthogonal'
      }
    },
    sourceNode,
    targetNode,
    {
      nodes
    }
  )

  assert.equal(
    doesFlowchartTestPathBacktrackNearEndpoint(
      layout.pathPoints,
      layout.sourceDirection,
      'source'
    ),
    false
  )
  assert.equal(
    doesFlowchartTestPathBacktrackNearEndpoint(
      layout.pathPoints,
      layout.targetDirection,
      'target'
    ),
    false
  )
  assert.deepEqual(layout.pathPoints[layout.pathPoints.length - 1], layout.targetPoint)
  assert.ok(layout.pathPoints.length <= 5)
})

test('右出上入且拐角无障碍时会优先收敛为单拐点路径', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-single-bend-preferred',
      source: 'left',
      target: 'target',
      sourceAnchor: {
        xRatio: 1,
        yRatio: 0.5,
        handleKey: 'right',
        direction: 'right',
        locked: true
      },
      targetAnchor: {
        xRatio: 0.5,
        yRatio: 0,
        handleKey: 'top',
        direction: 'top',
        locked: true
      },
      style: {
        pathType: 'orthogonal'
      }
    },
    {
      id: 'left',
      x: 40,
      y: 140,
      width: 168,
      height: 72
    },
    {
      id: 'target',
      x: 160,
      y: 240,
      width: 252,
      height: 104
    }
  )

  assert.equal(layout.sourceDirection, 'right')
  assert.equal(layout.targetDirection, 'top')
  assert.deepEqual(layout.sourcePoint, { x: 208, y: 176 })
  assert.deepEqual(layout.targetPoint, { x: 286, y: 240 })
  assert.match(layout.path, /^M 208 176 L 286 176 L 286 240$/)
})

test('左上节点连接右下判断节点时，无遮挡单拐点应优先于双转折', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const sourceNode = {
    id: 'source-node',
    x: 20,
    y: 20,
    width: 252,
    height: 104
  }
  const targetNode = {
    id: 'target-node',
    x: 340,
    y: 330,
    width: 188,
    height: 92
  }

  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-upper-left-to-lower-right',
      source: sourceNode.id,
      target: targetNode.id,
      style: {
        pathType: 'orthogonal'
      }
    },
    sourceNode,
    targetNode,
    {
      nodes: [sourceNode, targetNode]
    }
  )

  assert.equal(layout.sourceDirection, 'right')
  assert.equal(layout.targetDirection, 'top')
  assert.equal(layout.pathPoints.length, 3)
  assert.equal(layout.route, null)
  assert.match(layout.path, /^M 272 72 L 434 72 L 434 330$/)
})

test('单拐点优化会覆盖上下左右八种混合入出方向', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const sourceSize = { width: 160, height: 72 }
  const targetSize = { width: 200, height: 100 }
  const createLockedAnchor = handle => {
    if (handle === 'top') {
      return { xRatio: 0.5, yRatio: 0, handleKey: 'top', direction: 'top', locked: true }
    }
    if (handle === 'right') {
      return { xRatio: 1, yRatio: 0.5, handleKey: 'right', direction: 'right', locked: true }
    }
    if (handle === 'bottom') {
      return { xRatio: 0.5, yRatio: 1, handleKey: 'bottom', direction: 'bottom', locked: true }
    }
    return { xRatio: 0, yRatio: 0.5, handleKey: 'left', direction: 'left', locked: true }
  }
  const createNodeFromAnchorPoint = ({ id, point, direction, size }) => {
    if (direction === 'top') {
      return { id, x: point.x - size.width / 2, y: point.y, width: size.width, height: size.height }
    }
    if (direction === 'right') {
      return { id, x: point.x - size.width, y: point.y - size.height / 2, width: size.width, height: size.height }
    }
    if (direction === 'bottom') {
      return { id, x: point.x - size.width / 2, y: point.y - size.height, width: size.width, height: size.height }
    }
    return { id, x: point.x, y: point.y - size.height / 2, width: size.width, height: size.height }
  }
  const basePoint = { x: 420, y: 260 }
  const cases = [
    { sourceDirection: 'right', targetDirection: 'top', targetOffset: { x: 80, y: 96 } },
    { sourceDirection: 'right', targetDirection: 'bottom', targetOffset: { x: 80, y: -96 } },
    { sourceDirection: 'left', targetDirection: 'top', targetOffset: { x: -80, y: 96 } },
    { sourceDirection: 'left', targetDirection: 'bottom', targetOffset: { x: -80, y: -96 } },
    { sourceDirection: 'top', targetDirection: 'left', targetOffset: { x: -96, y: -80 } },
    { sourceDirection: 'top', targetDirection: 'right', targetOffset: { x: 96, y: -80 } },
    { sourceDirection: 'bottom', targetDirection: 'left', targetOffset: { x: -96, y: 80 } },
    { sourceDirection: 'bottom', targetDirection: 'right', targetOffset: { x: 96, y: 80 } }
  ]

  for (const [index, item] of cases.entries()) {
    const sourceNode = createNodeFromAnchorPoint({
      id: `source-${index}`,
      point: basePoint,
      direction: item.sourceDirection,
      size: sourceSize
    })
    const targetNode = createNodeFromAnchorPoint({
      id: `target-${index}`,
      point: {
        x: basePoint.x + item.targetOffset.x,
        y: basePoint.y + item.targetOffset.y
      },
      direction: item.targetDirection,
      size: targetSize
    })
    const layout = getFlowchartEdgeLayout(
      {
        id: `edge-${index}`,
        source: sourceNode.id,
        target: targetNode.id,
        sourceAnchor: createLockedAnchor(item.sourceDirection),
        targetAnchor: createLockedAnchor(item.targetDirection),
        style: {
          pathType: 'orthogonal'
        }
      },
      sourceNode,
      targetNode
    )

    assert.equal(layout.sourceDirection, item.sourceDirection)
    assert.equal(layout.targetDirection, item.targetDirection)
    assert.equal(layout.pathPoints.length, 3)
    assert.equal(layout.route, null)
  }
})

test('所有流程图模板的初始连线路由都不会穿过非端点节点内部', async () => {
  const {
    createDefaultFlowchartData,
    getFlowchartEdgeLayout,
    getFlowchartTemplateIds
  } = await loadFlowchartDocumentModule()
  getFlowchartTemplateIds().forEach(templateId => {
    const flowchartData = createDefaultFlowchartData(templateId, templateId)
    const nodeLookup = new Map(flowchartData.nodes.map(node => [node.id, node]))
    const invalidEdges = flowchartData.edges
      .map(edge => {
        const sourceNode = nodeLookup.get(edge.source)
        const targetNode = nodeLookup.get(edge.target)
        const layout = getFlowchartEdgeLayout(edge, sourceNode, targetNode, {
          nodes: flowchartData.nodes
        })
        const hits = getFlowchartTestPolylineInteriorHits(
          layout.pathPoints,
          flowchartData.nodes,
          [edge.source, edge.target]
        )
        return {
          id: edge.id,
          hits: hits.map(node => node.id)
        }
      })
      .filter(item => item.hits.length > 0)

    assert.deepEqual(invalidEdges, [], `template ${templateId} has invalid edges`)
  })
})

test('复杂模板节点错位后，自动重算的连线路由仍不会穿过其他节点', async () => {
  const {
    createDefaultFlowchartData,
    getFlowchartEdgeLayout
  } = await loadFlowchartDocumentModule()
  const deterministicSeeds = [0, 1, 2, 3, 4]

  deterministicSeeds.forEach(seed => {
    const baseData = createDefaultFlowchartData('复杂模板错位路由验证', 'enterpriseDelivery')
    const nodes = baseData.nodes.map((node, index) => ({
      ...node,
      x: Number(node.x || 0) + (((seed * 37 + index * 19) % 5) - 2) * 48,
      y: Number(node.y || 0) + (((seed * 23 + index * 13) % 5) - 2) * 42
    }))
    const nodeLookup = new Map(nodes.map(node => [node.id, node]))
    const invalidEdges = baseData.edges
      .map(edge => {
        const sourceNode = nodeLookup.get(edge.source)
        const targetNode = nodeLookup.get(edge.target)
        const layout = getFlowchartEdgeLayout(edge, sourceNode, targetNode, {
          nodes
        })
        const hits = getFlowchartTestPolylineInteriorHits(
          layout.pathPoints,
          nodes,
          [edge.source, edge.target]
        )
        return {
          id: edge.id,
          hits: hits.map(node => node.id)
        }
      })
      .filter(item => item.hits.length > 0)

    assert.deepEqual(invalidEdges, [], `seed ${seed} has invalid edges`)
  })
})

test('正交连线在起点终点已经同轴时会强制退回纯直线，不保留额外折点', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-axis-direct',
      source: 'a',
      target: 'b',
      style: {
        pathType: 'orthogonal'
      },
      route: {
        orthogonalLane: {
          axis: 'x',
          value: 360
        }
      }
    },
    {
      id: 'a',
      x: 120,
      y: 120,
      width: 168,
      height: 72
    },
    {
      id: 'b',
      x: 120,
      y: 320,
      width: 168,
      height: 72
    }
  )

  assert.match(layout.path, /^M 204 192 L 204 320$/)
  assert.deepEqual(layout.pathPoints, [
    { x: 204, y: 192 },
    { x: 204, y: 320 }
  ])
})

test('正交连线同轴但端点方向不相对时会保留转折，确保箭头朝向目标节点', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-axis-side-anchor',
      source: 'a',
      target: 'b',
      sourceAnchor: {
        xRatio: 1,
        yRatio: 0.5,
        locked: true
      },
      targetAnchor: {
        xRatio: 1,
        yRatio: 0.5,
        locked: true
      },
      style: {
        pathType: 'orthogonal'
      }
    },
    {
      id: 'a',
      x: 100,
      y: 100,
      width: 100,
      height: 80
    },
    {
      id: 'b',
      x: 300,
      y: 100,
      width: 100,
      height: 80
    }
  )

  assert.notEqual(layout.path, 'M 200 140 L 400 140')
  assert.equal(layout.targetDirection, 'right')
  assert.ok(layout.pathPoints.length > 2)
  const [beforeTargetPoint, targetPoint] = layout.pathPoints.slice(-2)
  assert.equal(targetPoint.x, 400)
  assert.equal(targetPoint.y, 140)
  assert.equal(beforeTargetPoint.y, targetPoint.y)
  assert.ok(beforeTargetPoint.x > targetPoint.x)
})

test('流程图手工路由点支持自由拖拽后的任意控制点，并会修正为正交折线', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-manual-route-point',
      source: 'a',
      target: 'b',
      style: {
        pathType: 'orthogonal'
      },
      route: {
        manualPoints: [{ x: 340, y: 260 }]
      }
    },
    {
      id: 'a',
      x: 120,
      y: 120,
      width: 168,
      height: 72
    },
    {
      id: 'b',
      x: 420,
      y: 320,
      width: 168,
      height: 72
    }
  )

  assert.ok(Array.isArray(layout.route?.manualPoints))
  assert.ok(layout.route.manualPoints.length >= 2)
  layout.pathPoints.slice(0, -1).forEach((point, index) => {
    const nextPoint = layout.pathPoints[index + 1]
    assert.equal(
      Math.abs(Number(point.x || 0) - Number(nextPoint.x || 0)) <= 0.001 ||
        Math.abs(Number(point.y || 0) - Number(nextPoint.y || 0)) <= 0.001,
      true
    )
  })
})

test('流程图手工双折线路由在拖到同轴时会自动吸附收敛为单折线', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-manual-route-collapse',
      source: 'a',
      target: 'b',
      style: {
        pathType: 'orthogonal'
      },
      route: {
        manualPoints: [
          { x: 420, y: 156 },
          { x: 420, y: 260 }
        ]
      }
    },
    {
      id: 'a',
      x: 120,
      y: 120,
      width: 168,
      height: 72
    },
    {
      id: 'b',
      x: 420,
      y: 320,
      width: 168,
      height: 72
    }
  )

  assert.equal(layout.pathPoints.length, 3)
  assert.deepEqual(layout.route?.manualPoints, [{ x: 420, y: 156 }])
  assert.match(layout.path, /^M 288 156 L 420 156 L 420 356$/)
})

test('流程图旧自定义锚点会保留存储值，但未锁定锚点不会再劫持自动布局', async () => {
  const {
    FLOWCHART_DOCUMENT_MODE,
    getFlowchartEdgeLayout,
    parseStoredDocumentContent,
    serializeStoredDocumentContent
  } = await loadFlowchartDocumentModule()
  const edge = {
    id: 'edge-anchored',
    source: 'a',
    target: 'b',
    sourceAnchor: { xRatio: 1, yRatio: 1 },
    targetAnchor: { xRatio: 0, yRatio: 0 },
    style: {
      pathType: 'straight'
    }
  }
  const sourceNode = {
    id: 'a',
    x: 120,
    y: 120,
    width: 168,
    height: 72
  }
  const targetNode = {
    id: 'b',
    x: 420,
    y: 320,
    width: 168,
    height: 72
  }
  const layout = getFlowchartEdgeLayout(edge, sourceNode, targetNode)
  const serialized = serializeStoredDocumentContent({
    documentMode: FLOWCHART_DOCUMENT_MODE,
    flowchartData: {
      title: '锚点测试',
      templateId: 'blank',
      nodes: [sourceNode, targetNode],
      edges: [edge]
    }
  })
  const parsed = parseStoredDocumentContent(serialized)

  assert.equal(layout.sourcePoint.x, 288)
  assert.equal(layout.sourcePoint.y, 156)
  assert.equal(layout.targetPoint.x, 420)
  assert.equal(layout.targetPoint.y, 356)
  assert.match(layout.path, /^M 288 156 L 420 356$/)
  assert.deepEqual(parsed.flowchartData.edges[0].sourceAnchor, { xRatio: 1, yRatio: 1 })
  assert.deepEqual(parsed.flowchartData.edges[0].targetAnchor, { xRatio: 0, yRatio: 0 })

  const legacyDecisionLayout = getFlowchartEdgeLayout(
    {
      id: 'edge-legacy-diagonal-anchor',
      source: 'a',
      target: 'b',
      sourceAnchor: { xRatio: 0.75, yRatio: 0.75, handleKey: 'bottom-right' },
      targetAnchor: { xRatio: 0.25, yRatio: 0.25, handleKey: 'top-left' },
      style: {
        pathType: 'straight'
      }
    },
    { ...sourceNode, type: 'decision' },
    { ...targetNode, type: 'decision' }
  )

  assert.equal(legacyDecisionLayout.sourcePoint.x, 288)
  assert.equal(legacyDecisionLayout.sourcePoint.y, 156)
  assert.equal(legacyDecisionLayout.targetPoint.x, 420)
  assert.equal(legacyDecisionLayout.targetPoint.y, 356)

  const lockedAnchorLayout = getFlowchartEdgeLayout(
    {
      id: 'edge-locked-anchor',
      source: 'a',
      target: 'b',
      sourceAnchor: {
        xRatio: 0,
        yRatio: 0.5,
        handleKey: 'left',
        direction: 'left',
        locked: true
      },
      style: {
        pathType: 'straight'
      }
    },
    { ...sourceNode, type: 'decision' },
    { ...targetNode, type: 'process' }
  )

  assert.equal(lockedAnchorLayout.sourcePoint.x, 120)
  assert.equal(lockedAnchorLayout.sourcePoint.y, 156)
})

test('流程图节点连接点统一收敛为上下左右四个正中锚点，所有节点类型一致', async () => {
  const {
    getFlowchartAnchorHandleKey,
    getFlowchartNodeAnchorPresets,
    getFlowchartNodeConnectionPoint,
    normalizeFlowchartNodeAnchor
  } = await loadFlowchartDocumentModule()
  const decisionNode = {
    id: 'decision-node',
    type: 'decision',
    x: 20,
    y: 40,
    width: 200,
    height: 100
  }
  const inputNode = {
    id: 'input-node',
    type: 'input',
    x: 300,
    y: 80,
    width: 200,
    height: 100
  }
  const decisionAnchors = getFlowchartNodeAnchorPresets(decisionNode)
  const inputAnchors = getFlowchartNodeAnchorPresets(inputNode)

  assert.deepEqual(decisionAnchors.map(anchor => anchor.handleKey), [
    'top',
    'right',
    'bottom',
    'left'
  ])
  assert.deepEqual(inputAnchors.map(anchor => anchor.handleKey), [
    'top',
    'right',
    'bottom',
    'left'
  ])
  assert.deepEqual(getFlowchartNodeConnectionPoint(decisionNode, 'top'), {
    x: 120,
    y: 40
  })
  assert.deepEqual(getFlowchartNodeConnectionPoint(decisionNode, 'left'), {
    x: 20,
    y: 90
  })
  assert.deepEqual(getFlowchartNodeConnectionPoint(inputNode, 'top'), {
    x: 412,
    y: 80
  })
  assert.deepEqual(getFlowchartNodeConnectionPoint(inputNode, 'left'), {
    x: 312,
    y: 130
  })
  assert.equal(
    getFlowchartAnchorHandleKey(
      normalizeFlowchartNodeAnchor({ xRatio: 0.5, yRatio: 0, handleKey: 'top' }),
      ''
    ),
    'top'
  )
})

test('流程图串行模板会把同列节点按中心线对齐', async () => {
  const { createDefaultFlowchartData } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('空白流程', 'blank')
  const getNodeById = nodeId =>
    flowchartData.nodes.find(node => node.id === nodeId) || null
  const getNodeCenterX = node =>
    Number(node?.x || 0) + Number(node?.width || 0) / 2

  const startNode = getNodeById('node-start')
  const processNode = getNodeById('node-process')
  const endNode = getNodeById('node-end')

  assert.ok(startNode)
  assert.ok(processNode)
  assert.ok(endNode)
  assert.ok(Math.abs(getNodeCenterX(startNode) - getNodeCenterX(processNode)) <= 12)
  assert.ok(Math.abs(getNodeCenterX(processNode) - getNodeCenterX(endNode)) <= 12)
  assert.ok(Number(processNode.y) - Number(startNode.y) >= 108)
  assert.ok(Number(endNode.y) - Number(processNode.y) >= 108)
})

test('流程图模板会把位于分支下方的汇合节点自动对齐到中线', async () => {
  const { createDefaultFlowchartData } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('工单流程', 'ticket')
  const getNodeById = nodeId =>
    flowchartData.nodes.find(node => node.id === nodeId) || null
  const getNodeCenterX = node =>
    Number(node?.x || 0) + Number(node?.width || 0) / 2

  const checkNode = getNodeById('node-check')
  const assignNode = getNodeById('node-assign')
  const replyNode = getNodeById('node-reply')

  assert.ok(checkNode)
  assert.ok(assignNode)
  assert.ok(replyNode)

  const branchMidpoint = (getNodeCenterX(checkNode) + getNodeCenterX(assignNode)) / 2
  assert.ok(Math.abs(getNodeCenterX(replyNode) - branchMidpoint) <= 12)
  assert.ok(Number(replyNode.x) < Number(assignNode.x))
})

test('流程图实际模板会做紧凑排版，避免初始布局横向过散', async () => {
  const { createDefaultFlowchartData } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('销售漏斗', 'salesPipeline')
  const maxRight = Math.max(
    ...flowchartData.nodes.map(node => Number(node.x || 0) + Number(node.width || 0))
  )

  assert.ok(maxRight <= 940)
})

test('流程图模板预览会走更紧凑的专用排版结果', async () => {
  const {
    createFlowchartTemplatePreviewData
  } = await loadFlowchartDocumentModule()
  const previewData = createFlowchartTemplatePreviewData('销售漏斗', 'salesPipeline')
  const maxRight = Math.max(
    ...previewData.nodes.map(node => Number(node.x || 0) + Number(node.width || 0))
  )

  assert.ok(maxRight <= 760)
})

test('流程图模板行聚类不会把尾部节点错误压成同一位置', async () => {
  const { createDefaultFlowchartData } = await loadFlowchartDocumentModule()
  const dataPipeline = createDefaultFlowchartData('数据管道', 'dataPipeline')
  const customerJourney = createDefaultFlowchartData('客户旅程', 'customerJourney')

  const dataServe = dataPipeline.nodes.find(node => node.id === 'node-serve')
  const dataEnd = dataPipeline.nodes.find(node => node.id === 'node-end')
  const journeyFeedback = customerJourney.nodes.find(node => node.id === 'node-feedback')
  const journeyEnd = customerJourney.nodes.find(node => node.id === 'node-end')

  assert.ok(dataServe)
  assert.ok(dataEnd)
  assert.ok(journeyFeedback)
  assert.ok(journeyEnd)
  assert.notDeepEqual(
    { x: dataServe.x, y: dataServe.y },
    { x: dataEnd.x, y: dataEnd.y }
  )
  assert.notDeepEqual(
    { x: journeyFeedback.x, y: journeyFeedback.y },
    { x: journeyEnd.x, y: journeyEnd.y }
  )
})

test('流程图模板预览不会出现节点相互压住的情况', async () => {
  const { FLOWCHART_TEMPLATE_PRESETS, createFlowchartTemplatePreviewData } =
    await loadFlowchartDocumentModule()

  FLOWCHART_TEMPLATE_PRESETS.forEach(template => {
    const previewData = createFlowchartTemplatePreviewData('预览', template.id)
    previewData.nodes.forEach((node, index) => {
      previewData.nodes.slice(index + 1).forEach(nextNode => {
        const overlapX =
          Math.min(
            Number(node.x || 0) + Number(node.width || 0),
            Number(nextNode.x || 0) + Number(nextNode.width || 0)
          ) - Math.max(Number(node.x || 0), Number(nextNode.x || 0))
        const overlapY =
          Math.min(
            Number(node.y || 0) + Number(node.height || 0),
            Number(nextNode.y || 0) + Number(nextNode.height || 0)
          ) - Math.max(Number(node.y || 0), Number(nextNode.y || 0))
        assert.ok(
          overlapX <= 0.001 || overlapY <= 0.001,
          `template ${template.id} has overlapping preview nodes: ${node.id} / ${nextNode.id}`
        )
      })
    })
  })
})

test('思维导图文档解析与序列化会保留 config 字段', () => {
  const source = fs.readFileSync(flowchartDocumentPath, 'utf8')

  assert.match(source, /config:\s*parsed\.config/)
  assert.match(source, /mindMapConfig:\s*parsed\.config/)
  assert.match(source, /mindMapConfig \|\| config \? \{ config: mindMapConfig \|\| config \} : \{\}/)
})

test('流程图规范化会修复外部数据里的重复节点和连线 ID', async () => {
  const { normalizeFlowchartAiResult } = await loadFlowchartDocumentModule()
  const normalized = normalizeFlowchartAiResult({
    title: '重复 ID 流程',
    nodes: [
      { id: 'same', type: 'start', text: '开始', x: 0, y: 0 },
      { id: 'same', type: 'process', text: '处理', x: 0, y: 120 }
    ],
    edges: [
      { id: 'edge', source: 'same', target: 'same' },
      { id: 'edge', source: 'same', target: 'same' }
    ]
  })

  const nodeIds = normalized.flowchartData.nodes.map(node => node.id)
  const edgeIds = normalized.flowchartData.edges.map(edge => edge.id)

  assert.equal(new Set(nodeIds).size, nodeIds.length)
  assert.equal(new Set(edgeIds).size, edgeIds.length)
})

test('思维导图转流程图会修复重复 uid 并保持连线指向真实节点', async () => {
  const { convertMindMapToFlowchart } = await loadFlowchartDocumentModule()
  const converted = convertMindMapToFlowchart({
    root: {
      data: {
        uid: 'same',
        text: '父节点'
      },
      children: [
        {
          data: {
            uid: 'same',
            text: '子节点'
          },
          children: []
        }
      ]
    }
  })

  const nodeIds = converted.flowchartData.nodes.map(node => node.id)
  const [edge] = converted.flowchartData.edges

  assert.equal(new Set(nodeIds).size, nodeIds.length)
  assert.equal(nodeIds.includes(edge.source), true)
  assert.equal(nodeIds.includes(edge.target), true)
  assert.notEqual(edge.source, edge.target)
})

test('流程图 SVG 导出会保留节点形状并按完整边界生成 viewBox', async () => {
  const {
    buildFlowchartSvgMarkup,
    createDefaultFlowchartData,
    getFlowchartExportBounds
  } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('导出测试', 'approval')
  flowchartData.nodes[0].x = -240
  const bounds = getFlowchartExportBounds(flowchartData, {
    paddingX: 120,
    paddingY: 120
  })
  const svgMarkup = buildFlowchartSvgMarkup(flowchartData, {
    paddingX: 120,
    paddingY: 120
  })

  assert.equal(bounds.x < 0, true)
  assert.match(svgMarkup, /<svg[^>]+viewBox="/)
  assert.match(svgMarkup, /<polygon/)
  assert.match(svgMarkup, /审批通过？/)
})

test('流程图导出边界会包含连线标签与折线额外占位，避免复杂导出被裁切', async () => {
  const {
    buildFlowchartSvgMarkup,
    getFlowchartEdgeLayout,
    getFlowchartExportBounds
  } = await loadFlowchartDocumentModule()
  const sourceNode = {
    id: 'node-a',
    type: 'process',
    text: '来源节点',
    x: 120,
    y: 160,
    width: 168,
    height: 72
  }
  const targetNode = {
    id: 'node-b',
    type: 'process',
    text: '目标节点',
    x: 520,
    y: 420,
    width: 168,
    height: 72
  }
  const edge = {
    id: 'edge-a-b',
    source: 'node-a',
    target: 'node-b',
    label: '远离节点的标签',
    labelPosition: {
      ratio: 0.5,
      offsetX: 0,
      offsetY: -220
    },
    style: {
      pathType: 'orthogonal'
    }
  }
  const layout = getFlowchartEdgeLayout(edge, sourceNode, targetNode, {
    nodes: [sourceNode, targetNode]
  })
  const bounds = getFlowchartExportBounds(
    {
      title: '边界扩展',
      nodes: [sourceNode, targetNode],
      edges: [edge]
    },
    {
      paddingX: 40,
      paddingY: 40,
      edgeLayouts: [{ edge, layout }]
    }
  )
  const svgMarkup = buildFlowchartSvgMarkup(
    {
      title: '边界扩展',
      nodes: [sourceNode, targetNode],
      edges: [edge]
    },
    {
      paddingX: 40,
      paddingY: 40
    }
  )

  assert.equal(bounds.y <= Math.floor(layout.labelY - 13 - 40), true)
  assert.match(svgMarkup, new RegExp(`viewBox="[^"]* ${bounds.y} `))
  assert.match(svgMarkup, /远离节点的标签/)
})

test('流程图 SVG 导出会保留节点和连线样式，并输出箭头与折线路径', async () => {
  const {
    buildFlowchartSvgMarkup,
    createDefaultFlowchartData
  } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('样式导出', 'blank')
  flowchartData.nodes = [
    {
      id: 'node-a',
      type: 'process',
      text: '开始处理',
      x: 120,
      y: 120,
      width: 168,
      height: 72,
      style: {
        fill: '#eff6ff',
        stroke: '#2563eb',
        textColor: '#1e3a8a'
      }
    },
    {
      id: 'node-b',
      type: 'decision',
      text: '继续？',
      x: 420,
      y: 320,
      width: 176,
      height: 92,
      style: {
        fill: '#fffbeb',
        stroke: '#d97706',
        textColor: '#92400e'
      }
    }
  ]
  flowchartData.edges = [
    {
      id: 'edge-a-b',
      source: 'node-a',
      target: 'node-b',
      label: '条件满足',
      style: {
        stroke: '#e11d48',
        dashed: true,
        pathType: 'orthogonal'
      }
    }
  ]

  const svgMarkup = buildFlowchartSvgMarkup(flowchartData)

  assert.match(svgMarkup, /fill="#eff6ff"/)
  assert.match(svgMarkup, /stroke="#2563eb"/)
  assert.match(svgMarkup, /fill="#1e3a8a"/)
  assert.match(svgMarkup, /stroke="#e11d48"/)
  assert.match(svgMarkup, /stroke-dasharray="8 6"/)
  assert.match(svgMarkup, /class="flowchart-arrow-layer"/)
  assert.match(svgMarkup, /class="flowchart-arrow-head"/)
  assert.doesNotMatch(svgMarkup, /marker-end=/)
  assert.match(svgMarkup, /dominant-baseline="middle"/)
  assert.match(svgMarkup, /paint-order="stroke"/)
  assert.match(svgMarkup, /rx="10"/)
  assert.match(svgMarkup, /条件满足/)
  assert.match(svgMarkup, /M 288 156 L 354 156 L 354 366 L 420 366/)
  assert.doesNotMatch(svgMarkup, /<path[^>]*\/><rect[^>]*rx="8"[^>]*\/><text[^>]*>条件满足/)
})

test('流程图连线样式会保留箭头大小和数量，并为额外箭头输出图形', async () => {
  const { getFlowchartEdgeLayout, buildFlowchartSvgMarkup } = await loadFlowchartDocumentModule()
  const edge = {
    id: 'edge-arrow-style',
    source: 'a',
    target: 'b',
    style: {
      pathType: 'orthogonal',
      arrowSize: 1.4,
      arrowCount: 3
    }
  }
  const sourceNode = {
    id: 'a',
    x: 120,
    y: 120,
    width: 168,
    height: 72
  }
  const targetNode = {
    id: 'b',
    x: 420,
    y: 320,
    width: 168,
    height: 72
  }
  const layout = getFlowchartEdgeLayout(edge, sourceNode, targetNode)
  const svgMarkup = buildFlowchartSvgMarkup({
    title: '箭头样式',
    nodes: [sourceNode, targetNode],
    edges: [edge]
  })

  assert.equal(layout.style.arrowSize, 1.4)
  assert.equal(layout.style.arrowCount, 3)
  assert.equal(layout.arrowMarkers.length, 3)
  assert.equal((svgMarkup.match(/class="flowchart-arrow-head"/g) || []).length, 3)
  assert.match(svgMarkup, /d="M 0 0 L -8\.4 3\.92 L -8\.4 -3\.92 Z"/)
})

test('流程图默认箭头尺寸会更克制，避免压住节点边缘', async () => {
  const { getFlowchartEdgeLayout, buildFlowchartSvgMarkup } = await loadFlowchartDocumentModule()
  const sourceNode = {
    id: 'a',
    x: 120,
    y: 120,
    width: 168,
    height: 72
  }
  const targetNode = {
    id: 'b',
    x: 420,
    y: 120,
    width: 168,
    height: 72
  }
  const edge = {
    id: 'edge-default-arrow',
    source: 'a',
    target: 'b',
    style: {
      pathType: 'orthogonal'
    }
  }
  const layout = getFlowchartEdgeLayout(edge, sourceNode, targetNode)
  const svgMarkup = buildFlowchartSvgMarkup({
    title: '默认箭头',
    nodes: [sourceNode, targetNode],
    edges: [edge]
  })

  assert.equal(layout.style.arrowSize, 1)
  assert.match(svgMarkup, /d="M 0 0 L -6 2\.8 L -6 -2\.8 Z"/)
})

test('流程图连线线型支持多种可视化虚线并兼容旧 dashed 字段', async () => {
  const {
    getFlowchartEdgeDashArray,
    getFlowchartEdgeVisualStyle
  } = await loadFlowchartDocumentModule()

  assert.equal(getFlowchartEdgeDashArray('solid'), '')
  assert.equal(getFlowchartEdgeDashArray('dash'), '8 6')
  assert.equal(getFlowchartEdgeDashArray('longDash'), '14 8')
  assert.equal(getFlowchartEdgeDashArray('dot'), '2 6')
  assert.equal(getFlowchartEdgeDashArray('dashDot'), '10 6 2 6')
  assert.deepEqual(
    {
      dashPattern: getFlowchartEdgeVisualStyle({ style: { dashed: true } }).dashPattern,
      dashArray: getFlowchartEdgeVisualStyle({ style: { dashed: true } }).dashArray
    },
    {
      dashPattern: 'dash',
      dashArray: '8 6'
    }
  )
})

test('流程图曲线连线布局会生成贝塞尔路径并支持主题回退色', async () => {
  const {
    getFlowchartEdgeLayout,
    getFlowchartThemeDefinition
  } = await loadFlowchartDocumentModule()
  const theme = getFlowchartThemeDefinition('incidentDark')
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-curved',
      source: 'a',
      target: 'b',
      label: '升级',
      style: {
        pathType: 'curved'
      }
    },
    {
      id: 'a',
      x: 120,
      y: 120,
      width: 168,
      height: 72
    },
    {
      id: 'b',
      x: 420,
      y: 320,
      width: 168,
      height: 72
    },
    {
      theme
    }
  )

  assert.match(layout.path, /^M 288 156 C /)
  assert.equal(layout.style.pathType, 'curved')
  assert.equal(layout.style.stroke, theme.edgeStroke)
})

test('严格对齐开启后会把连线布局强制为正交折线', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-strict-curved',
      source: 'a',
      target: 'b',
      style: {
        pathType: 'curved'
      }
    },
    {
      id: 'a',
      x: 120,
      y: 120,
      width: 168,
      height: 72
    },
    {
      id: 'b',
      x: 420,
      y: 320,
      width: 168,
      height: 72
    },
    {
      strictAlignment: true
    }
  )

  assert.equal(layout.style.pathType, 'orthogonal')
  assert.match(layout.path, /^M 288 156 L 354 156 L 354 356 L 420 356$/)
})

test('流程图连线标签会居中显示，竖线标签也保持在线段中轴', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const verticalLayout = getFlowchartEdgeLayout(
    {
      id: 'edge-vertical',
      source: 'a',
      target: 'b',
      label: '否',
      style: {
        pathType: 'straight'
      }
    },
    {
      id: 'a',
      x: 120,
      y: 120,
      width: 168,
      height: 72
    },
    {
      id: 'b',
      x: 120,
      y: 320,
      width: 168,
      height: 72
    }
  )
  const horizontalLayout = getFlowchartEdgeLayout(
    {
      id: 'edge-horizontal',
      source: 'a',
      target: 'b',
      label: '是',
      style: {
        pathType: 'straight'
      }
    },
    {
      id: 'a',
      x: 120,
      y: 120,
      width: 168,
      height: 72
    },
    {
      id: 'b',
      x: 420,
      y: 120,
      width: 168,
      height: 72
    }
  )

  assert.equal(verticalLayout.labelPlacement, 'inline')
  assert.equal(verticalLayout.labelX, verticalLayout.sourcePoint.x)
  assert.equal(horizontalLayout.labelPlacement, 'inline')
  assert.equal(horizontalLayout.labelY, horizontalLayout.sourcePoint.y)
})

test('多段正交连线的默认标签会避开拐点，优先落在可读性更好的长直线段上', async () => {
  const {
    createDefaultFlowchartData,
    getFlowchartEdgeLayout
  } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('复杂模板标签验证', 'enterpriseDelivery')
  const nodeLookup = new Map(flowchartData.nodes.map(node => [node.id, node]))
  const targetEdgeIds = ['edge-vendor-procure', 'edge-approve-contract']

  targetEdgeIds.forEach(edgeId => {
    const edge = flowchartData.edges.find(item => item.id === edgeId)
    assert.ok(edge, `missing edge ${edgeId}`)
    const layout = getFlowchartEdgeLayout(
      edge,
      nodeLookup.get(edge.source),
      nodeLookup.get(edge.target),
      {
        nodes: flowchartData.nodes
      }
    )
    const bends = layout.pathPoints.slice(1, -1)
    const minBendDistance = bends.reduce((result, point) => {
      return Math.min(
        result,
        Math.hypot(layout.labelX - point.x, layout.labelY - point.y)
      )
    }, Infinity)

    assert.ok(minBendDistance >= 40, `${edgeId} label too close to bend: ${minBendDistance}`)
  })
})

test('流程图连线标签位置支持持久化比例与偏移，并按自定义位置输出布局', async () => {
  const {
    FLOWCHART_DOCUMENT_MODE,
    getFlowchartEdgeLayout,
    parseStoredDocumentContent,
    serializeStoredDocumentContent
  } = await loadFlowchartDocumentModule()
  const edge = {
    id: 'edge-custom-label-position',
    source: 'a',
    target: 'b',
    label: '自定义',
    labelPosition: {
      ratio: 0.25,
      offsetX: 18,
      offsetY: -12
    },
    style: {
      pathType: 'straight'
    }
  }
  const sourceNode = {
    id: 'a',
    x: 120,
    y: 120,
    width: 168,
    height: 72
  }
  const targetNode = {
    id: 'b',
    x: 420,
    y: 120,
    width: 168,
    height: 72
  }
  const layout = getFlowchartEdgeLayout(edge, sourceNode, targetNode)
  const serialized = serializeStoredDocumentContent({
    documentMode: FLOWCHART_DOCUMENT_MODE,
    flowchartData: {
      title: '标签位置',
      templateId: 'approval',
      nodes: [sourceNode, targetNode],
      edges: [edge]
    }
  })
  const parsed = parseStoredDocumentContent(serialized)

  assert.equal(layout.labelPlacement, 'inline')
  assert.equal(layout.labelX, 339)
  assert.equal(layout.labelY, 144)
  assert.deepEqual(parsed.flowchartData.edges[0].labelPosition, {
    ratio: 0.25,
    offsetX: 18,
    offsetY: -12
  })
})

test('流程图拖动预览保留方向迟滞，但前向空间不足时会切到更自然的连接方向', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const sourceNode = {
    id: 'a',
    x: 120,
    y: 120,
    width: 168,
    height: 72
  }
  const targetNode = {
    id: 'b',
    x: 300,
    y: 310,
    width: 168,
    height: 72
  }
  const stabilizedLayout = getFlowchartEdgeLayout(
    {
      id: 'edge-drag-stabilized',
      source: 'a',
      target: 'b',
      style: {
        pathType: 'orthogonal'
      }
    },
    sourceNode,
    targetNode,
    {
      lockedDirections: {
        sourceDirection: 'right',
        targetDirection: 'left'
      }
    }
  )
  const defaultLayout = getFlowchartEdgeLayout(
    {
      id: 'edge-drag-default',
      source: 'a',
      target: 'b',
      style: {
        pathType: 'orthogonal'
      }
    },
    sourceNode,
    targetNode
  )

  assert.equal(stabilizedLayout.sourceDirection, 'bottom')
  assert.equal(stabilizedLayout.targetDirection, 'top')
  assert.equal(defaultLayout.sourceDirection, 'bottom')
  assert.equal(defaultLayout.targetDirection, 'top')
})

test('流程图在接近对角线的上下节点间默认优先使用竖向连接，避免箭头卡到节点侧边', async () => {
  const { getFlowchartEdgeLayout } = await loadFlowchartDocumentModule()
  const layout = getFlowchartEdgeLayout(
    {
      id: 'edge-vertical-priority',
      source: 'material',
      target: 'training',
      style: {
        pathType: 'orthogonal'
      }
    },
    {
      id: 'material',
      x: 516,
      y: 504,
      width: 168,
      height: 72
    },
    {
      id: 'training',
      x: 738,
      y: 691,
      width: 168,
      height: 72
    }
  )

  assert.equal(layout.sourceDirection, 'bottom')
  assert.equal(layout.targetDirection, 'top')
  assert.match(layout.path, /^M 600 576 L 600 [\d.]+ L 822 [\d.]+ L 822 691$/)
})

test('流程图 SVG 导出会带上主题配色，而不是退回默认白底', async () => {
  const {
    buildFlowchartSvgMarkup,
    createDefaultFlowchartData,
    getFlowchartThemeDefinition
  } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('主题导出', 'supportEscalation')
  const theme = getFlowchartThemeDefinition('incidentDark')
  const svgMarkup = buildFlowchartSvgMarkup(flowchartData, {
    flowchartConfig: {
      themeId: 'incidentDark'
    }
  })

  assert.match(svgMarkup, new RegExp(`fill="${theme.canvasBg}"`))
  assert.match(svgMarkup, new RegExp(`stroke="${theme.edgeStroke}"`))
})

test('流程图连线标签底板尺寸同时兼容编辑态 layout.label 与导出态 layout.edge.label', async () => {
  const { getFlowchartEdgeLabelBox } = await loadFlowchartDocumentModule()

  const editorLayoutBox = getFlowchartEdgeLabelBox({
    label: '这是一个比较长的流程图标签',
    labelX: 240,
    labelY: 120
  })
  const exportLayoutBox = getFlowchartEdgeLabelBox({
    edge: {
      label: '这是一个比较长的流程图标签'
    },
    labelX: 240,
    labelY: 120
  })

  assert.equal(editorLayoutBox.width, exportLayoutBox.width)
  assert.equal(editorLayoutBox.width > 56, true)
})

test('流程图旧泳道数据会参与边界计算，但模板体系不再提供泳道模板', async () => {
  const {
    buildFlowchartSvgMarkup,
    createFlowchartDocumentContent,
    createDefaultFlowchartData,
    getFlowchartExportBounds,
    FLOWCHART_TEMPLATE_PRESETS
  } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('旧泳道数据', 'approval')
  flowchartData.lanes = [
    { id: 'lane-legacy-1', label: '历史分区', x: -160, y: -120, width: 420, height: 120 },
    { id: 'lane-legacy-2', label: '历史分区', x: -160, y: 20, width: 420, height: 120 }
  ]
  const flowchartDocument = createFlowchartDocumentContent({
    flowchartData
  })
  const bounds = getFlowchartExportBounds(flowchartData, {
    paddingX: 40,
    paddingY: 40
  })
  const svgMarkup = buildFlowchartSvgMarkup(flowchartData, {
    paddingX: 40,
    paddingY: 40
  })

  assert.equal(
    FLOWCHART_TEMPLATE_PRESETS.some(item => /swimlane/i.test(item.id)),
    false
  )
  assert.equal(flowchartDocument.flowchartData.lanes.length, 2)
  assert.deepEqual(flowchartDocument.flowchartData.lanes.map(lane => lane.label), ['历史分区', '历史分区'])
  assert.equal(flowchartDocument.flowchartConfig.backgroundStyle, 'grid')
  assert.equal(
    Object.prototype.hasOwnProperty.call(flowchartDocument.flowchartConfig, 'laneBackgroundStyle'),
    false
  )
  assert.equal(bounds.x <= 40, true)
  assert.doesNotMatch(svgMarkup, /flowchart-swimlane/)
  assert.doesNotMatch(svgMarkup, /data-background-style=/)
  assert.doesNotMatch(svgMarkup, /历史分区/)
})

test('流程图旧泳道背景配置会被忽略，不再导出强调背景', async () => {
  const {
    buildFlowchartSvgMarkup,
    createDefaultFlowchartData
  } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('旧泳道背景', 'approval')
  flowchartData.lanes = [
    { id: 'lane-legacy-bg', label: '历史背景', x: 80, y: 96, width: 960, height: 140, accent: '#2563eb' }
  ]
  const svgMarkup = buildFlowchartSvgMarkup(flowchartData, {
    flowchartConfig: {
      laneBackgroundStyle: 'accent'
    }
  })

  assert.doesNotMatch(svgMarkup, /data-background-style=/)
  assert.doesNotMatch(svgMarkup, /历史背景/)
  assert.doesNotMatch(svgMarkup, /opacity="0\.08"/)
  assert.doesNotMatch(svgMarkup, /opacity="0\.56"/)
})

test('流程图画布背景样式会保留点阵和方格导出，并可在透明导出时移除底板', async () => {
  const {
    buildFlowchartSvgMarkup,
    createFlowchartDocumentContent,
    createDefaultFlowchartData
  } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('背景导出', 'approval')
  const flowchartDocument = createFlowchartDocumentContent({
    flowchartData,
    flowchartConfig: {
      backgroundStyle: 'dots'
    }
  })
  const dotsSvgMarkup = buildFlowchartSvgMarkup(flowchartData, {
    flowchartConfig: {
      backgroundStyle: 'dots'
    }
  })
  const transparentSvgMarkup = buildFlowchartSvgMarkup(flowchartData, {
    flowchartConfig: {
      backgroundStyle: 'dots'
    },
    transparent: true
  })

  assert.equal(flowchartDocument.flowchartConfig.backgroundStyle, 'dots')
  assert.match(dotsSvgMarkup, /<pattern id="flowchart-bg-/)
  assert.match(dotsSvgMarkup, /<circle cx="2" cy="2" r="1\.4"/)
  assert.match(dotsSvgMarkup, /fill="url\(#flowchart-bg-/)
  assert.doesNotMatch(transparentSvgMarkup, /fill="url\(#flowchart-bg-/)
})

test('流程图提供 20 个节点以上的普通复杂模板用于编辑手感验证', async () => {
  const {
    FLOWCHART_TEMPLATE_PRESETS,
    createDefaultFlowchartData
  } = await loadFlowchartDocumentModule()
  const templateMeta = FLOWCHART_TEMPLATE_PRESETS.find(
    item => item.id === 'enterpriseDelivery'
  )
  const flowchartData = createDefaultFlowchartData('复杂模板验证', 'enterpriseDelivery')

  assert.ok(templateMeta)
  assert.equal(flowchartData.nodes.length, 24)
  assert.ok(flowchartData.edges.length >= 28)
  assert.equal(flowchartData.lanes.length, 0)
  assert.ok(flowchartData.nodes.every(node => !node.style || Object.keys(node.style).length === 0))
  assert.ok(flowchartData.edges.every(edge => edge?.style?.pathType === 'orthogonal'))
})

test('getFlowchartLabelTextUnits 使用预编译正则而非逐字符编译', async () => {
  const module = await loadFlowchartDocumentModule()
  const source = fs.readFileSync(flowchartDocumentPath, 'utf8')

  // 函数内部不应包含内联正则字面量
  const fnMatch = source.match(
    /export const getFlowchartLabelTextUnits = label => \{[\s\S]*?\n\}/
  )
  assert.ok(fnMatch, '应找到 getFlowchartLabelTextUnits 函数')
  const fnBody = fnMatch[0]
  assert.doesNotMatch(fnBody, /\/\\s\//, '函数体内不应有 /\\s/ 内联正则')
  assert.doesNotMatch(fnBody, /\/\[\\u1100/, '函数体内不应有 CJK 内联正则')
  assert.doesNotMatch(fnBody, /\/\[MW@/, '函数体内不应有宽字符内联正则')

  // 验证函数输出不变
  const { getFlowchartLabelTextUnits } = module
  assert.equal(getFlowchartLabelTextUnits(''), 0)
  assert.equal(getFlowchartLabelTextUnits(null), 0)
  assert.ok(getFlowchartLabelTextUnits('abc') > 0)
  assert.ok(getFlowchartLabelTextUnits('你好') > getFlowchartLabelTextUnits('ab'))
  assert.ok(getFlowchartLabelTextUnits('MW') > getFlowchartLabelTextUnits('ab'))
  assert.ok(getFlowchartLabelTextUnits('a b') > getFlowchartLabelTextUnits('ab'))
})

test('getFlowchartNodeAnchorPresets 返回缓存常量而非每次创建', async () => {
  const module = await loadFlowchartDocumentModule()
  const source = fs.readFileSync(flowchartDocumentPath, 'utf8')

  // 应存在模块级缓存常量
  assert.match(
    source,
    /const (CACHED_|_CACHED|FLOWCHART_NODE_ANCHOR_PRESETS_CACHE)/,
    '应存在模块级锚点预设缓存常量'
  )

  // 函数应返回同一个引用
  const { getFlowchartNodeAnchorPresets } = module
  const result1 = getFlowchartNodeAnchorPresets(null)
  const result2 = getFlowchartNodeAnchorPresets(null)
  assert.equal(result1, result2, '多次调用应返回同一个数组引用')
  assert.equal(result1.length, 4)
})
