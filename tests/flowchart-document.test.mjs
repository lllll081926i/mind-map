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
  assert.match(source, /templateId/)
  assert.match(source, /FLOWCHART_TEMPLATE_PRESETS/)
  assert.match(source, /FLOWCHART_THEME_PRESETS/)
  assert.match(source, /getFlowchartThemeDefinition/)
  assert.match(source, /viewport/)
  assert.match(source, /lanes/)
  assert.match(source, /nodes/)
  assert.match(source, /edges/)
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
  assert.match(source, /graphite:\s*\{/)
  assert.match(source, /clayWarm:\s*\{/)
  assert.match(source, /canvasBg:\s*'#ffffff'/)
  assert.doesNotMatch(source, /FLOWCHART_TEMPLATE_PRESETS[\s\S]*themeId:/)
})

test('流程图严格对齐配置会在文档层默认保留，并在导出时强制正交折线', () => {
  const source = fs.readFileSync(flowchartDocumentPath, 'utf8')

  assert.match(source, /strictAlignment:\s*false/)
  assert.match(source, /pathType:\s*strictAlignment[\s\S]*?'orthogonal'/)
  assert.match(source, /strictAlignment:\s*!!flowchartConfig\?\.strictAlignment/)
})

test('流程图模板在生成时会统一改为纯直线连线布局', async () => {
  const { createDefaultFlowchartData } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('模板直线', 'approval')

  assert.ok(flowchartData.edges.length > 0)
  assert.equal(
    flowchartData.edges.every(edge => edge?.style?.pathType === 'straight'),
    true
  )
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

test('流程图连线标签会避开线段，竖线标签放到线段侧边', async () => {
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

  assert.equal(verticalLayout.labelPlacement, 'right')
  assert.notEqual(verticalLayout.labelX, verticalLayout.sourcePoint.x)
  assert.equal(horizontalLayout.labelPlacement, 'inline')
  assert.equal(horizontalLayout.labelY, horizontalLayout.sourcePoint.y)
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

test('流程图泳道模板会保留责任分区，并在 SVG 导出中先于节点和连线输出', async () => {
  const {
    buildFlowchartSvgMarkup,
    createDefaultFlowchartData,
    getFlowchartExportBounds
  } = await loadFlowchartDocumentModule()
  const flowchartData = createDefaultFlowchartData('客户交付', 'customerOnboardingSwimlane')
  const bounds = getFlowchartExportBounds(flowchartData, {
    paddingX: 40,
    paddingY: 40
  })
  const svgMarkup = buildFlowchartSvgMarkup(flowchartData, {
    paddingX: 40,
    paddingY: 40
  })

  assert.equal(flowchartData.lanes.length, 3)
  assert.equal(flowchartData.lanes[0].label, '销售')
  assert.equal(bounds.x <= 40, true)
  assert.match(svgMarkup, /flowchart-swimlane/)
  assert.match(svgMarkup, /客户成功/)
  assert.equal(svgMarkup.indexOf('flowchart-swimlane') < svgMarkup.indexOf('<g><path'), true)
  assert.equal(svgMarkup.indexOf('flowchart-swimlane') < svgMarkup.indexOf('合同签署'), true)
})
