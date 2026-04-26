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
  assert.match(source, /customerOnboardingSwimlane:\s*title =>/)
  assert.match(source, /productLaunchSwimlane:\s*title =>/)
  assert.match(source, /FLOWCHART_TEMPLATE_PRESETS = \[/)
  assert.doesNotMatch(source, /FLOWCHART_TEMPLATE_PRESETS = \[[\s\S]*?\{ id: 'blank'/)
  assert.match(source, /graphite:\s*\{/)
  assert.match(source, /clayWarm:\s*\{/)
  assert.match(source, /canvasBg:\s*'#ffffff'/)
  assert.doesNotMatch(source, /FLOWCHART_TEMPLATE_PRESETS[\s\S]*themeId:/)
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

test('非严格正交连线在间距较小时会压平成自然直线，避免小幅折线', async () => {
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

  assert.match(layout.path, /^M 288 166 L 320 166$/)
})

test('上下相连且连接点仅有轻微偏差时，连线会压平成真正直线', async () => {
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

  assert.match(layout.path, /^M 131 152 L 131 216$/)
})

test('上下节点轻微错列时仍保持直线连接，避免为了小偏差绕一圈', async () => {
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
  assert.match(layout.path, /^M 618 432 L 618 504$/)
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
  assert.match(layout.path, /^M 284 192 L 284 240$/)
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
        yRatio: 0.5
      },
      targetAnchor: {
        xRatio: 1,
        yRatio: 0.5
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

test('流程图连线支持保存自定义锚点，并按锚点计算端点位置', async () => {
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
  assert.equal(layout.sourcePoint.y, 192)
  assert.equal(layout.targetPoint.x, 420)
  assert.equal(layout.targetPoint.y, 320)
  assert.match(layout.path, /^M 288 192 L 420 320$/)
  assert.deepEqual(parsed.flowchartData.edges[0].sourceAnchor, { xRatio: 1, yRatio: 1 })
  assert.deepEqual(parsed.flowchartData.edges[0].targetAnchor, { xRatio: 0, yRatio: 0 })
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
  assert.match(svgMarkup, /marker-end="url\(#flowchart-arrow-edge-a-b\)"/)
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
  assert.match(svgMarkup, /markerWidth="8\.4"/)
  assert.match(svgMarkup, /class="flowchart-arrow-head"/)
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

test('流程图泳道模板会保留责任分区并参与边界计算，但导出时不再单独渲染泳道背景', async () => {
  const {
    buildFlowchartSvgMarkup,
    createFlowchartDocumentContent,
    createDefaultFlowchartData,
    getFlowchartExportBounds
  } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('客户交付', 'customerOnboardingSwimlane')
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

  assert.equal(flowchartData.lanes.length, 3)
  assert.equal(flowchartData.lanes[0].label, '')
  assert.deepEqual(flowchartData.lanes.map(lane => lane.label), ['', '', ''])
  assert.equal(flowchartDocument.flowchartConfig.backgroundStyle, 'grid')
  assert.equal(
    Object.prototype.hasOwnProperty.call(flowchartDocument.flowchartConfig, 'laneBackgroundStyle'),
    false
  )
  assert.equal(bounds.x <= 40, true)
  assert.doesNotMatch(svgMarkup, /flowchart-swimlane/)
  assert.doesNotMatch(svgMarkup, /data-background-style=/)
  assert.doesNotMatch(svgMarkup, /客户成功/)
})

test('流程图旧泳道背景配置会被忽略，不再导出强调背景', async () => {
  const {
    buildFlowchartSvgMarkup,
    createDefaultFlowchartData
  } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('产品上线', 'productLaunchSwimlane')
  const svgMarkup = buildFlowchartSvgMarkup(flowchartData, {
    flowchartConfig: {
      laneBackgroundStyle: 'accent'
    }
  })

  assert.deepEqual(flowchartData.lanes.map(lane => lane.label), ['', '', '', ''])
  assert.doesNotMatch(svgMarkup, /data-background-style=/)
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
