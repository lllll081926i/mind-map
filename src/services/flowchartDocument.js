import { parseExternalJsonSafely } from '@/utils/json'

export const FLOWCHART_DOCUMENT_MODE = 'flowchart'
export const MINDMAP_DOCUMENT_MODE = 'mindmap'
export const FLOWCHART_DOCUMENT_VERSION = 1
export const DEFAULT_FLOWCHART_TITLE = '流程图'

export const FLOWCHART_NODE_TYPES = [
  { type: 'start', label: '开始' },
  { type: 'process', label: '处理' },
  { type: 'decision', label: '判断' },
  { type: 'input', label: '输入' },
  { type: 'end', label: '结束' }
]

const DEFAULT_FLOWCHART_CONFIG = {
  snapToGrid: true,
  gridSize: 24
}

const FLOWCHART_TEMPLATES = {
  blank: title => ({
    title,
    nodes: [
      createFlowchartNode({
        id: 'node-start',
        type: 'start',
        text: '开始',
        x: 120,
        y: 120,
        width: 140,
        height: 56
      }),
      createFlowchartNode({
        id: 'node-process',
        type: 'process',
        text: '处理步骤',
        x: 120,
        y: 236
      }),
      createFlowchartNode({
        id: 'node-end',
        type: 'end',
        text: '结束',
        x: 120,
        y: 352,
        width: 140,
        height: 56
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-process',
        source: 'node-start',
        target: 'node-process'
      }),
      createFlowchartEdge({
        id: 'edge-process-end',
        source: 'node-process',
        target: 'node-end'
      })
    ]
  }),
  approval: title => ({
    title,
    nodes: [
      createFlowchartNode({
        id: 'node-start',
        type: 'start',
        text: '提交申请',
        x: 120,
        y: 120
      }),
      createFlowchartNode({
        id: 'node-review',
        type: 'decision',
        text: '审批通过？',
        x: 120,
        y: 240,
        width: 168,
        height: 92
      }),
      createFlowchartNode({
        id: 'node-approved',
        type: 'process',
        text: '执行审批结果',
        x: 360,
        y: 240
      }),
      createFlowchartNode({
        id: 'node-rejected',
        type: 'end',
        text: '驳回结束',
        x: 120,
        y: 392
      }),
      createFlowchartNode({
        id: 'node-end',
        type: 'end',
        text: '流程完成',
        x: 360,
        y: 392
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-review',
        source: 'node-start',
        target: 'node-review'
      }),
      createFlowchartEdge({
        id: 'edge-review-approved',
        source: 'node-review',
        target: 'node-approved',
        label: '是'
      }),
      createFlowchartEdge({
        id: 'edge-review-rejected',
        source: 'node-review',
        target: 'node-rejected',
        label: '否'
      }),
      createFlowchartEdge({
        id: 'edge-approved-end',
        source: 'node-approved',
        target: 'node-end'
      })
    ]
  }),
  troubleshooting: title => ({
    title,
    nodes: [
      createFlowchartNode({
        id: 'node-start',
        type: 'start',
        text: '发现问题',
        x: 120,
        y: 120
      }),
      createFlowchartNode({
        id: 'node-collect',
        type: 'input',
        text: '收集现场信息',
        x: 120,
        y: 236
      }),
      createFlowchartNode({
        id: 'node-diagnose',
        type: 'decision',
        text: '定位到原因？',
        x: 120,
        y: 360,
        width: 168,
        height: 92
      }),
      createFlowchartNode({
        id: 'node-fix',
        type: 'process',
        text: '执行修复',
        x: 360,
        y: 360
      }),
      createFlowchartNode({
        id: 'node-loop',
        type: 'process',
        text: '补充排查',
        x: 120,
        y: 516
      }),
      createFlowchartNode({
        id: 'node-end',
        type: 'end',
        text: '验证完成',
        x: 360,
        y: 516
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-collect',
        source: 'node-start',
        target: 'node-collect'
      }),
      createFlowchartEdge({
        id: 'edge-collect-diagnose',
        source: 'node-collect',
        target: 'node-diagnose'
      }),
      createFlowchartEdge({
        id: 'edge-diagnose-fix',
        source: 'node-diagnose',
        target: 'node-fix',
        label: '是'
      }),
      createFlowchartEdge({
        id: 'edge-diagnose-loop',
        source: 'node-diagnose',
        target: 'node-loop',
        label: '否'
      }),
      createFlowchartEdge({
        id: 'edge-fix-end',
        source: 'node-fix',
        target: 'node-end'
      }),
      createFlowchartEdge({
        id: 'edge-loop-collect',
        source: 'node-loop',
        target: 'node-collect',
        label: '继续'
      })
    ]
  })
}

function createFlowchartNode({
  id,
  type = 'process',
  text = '',
  x = 0,
  y = 0,
  width = 168,
  height = 72,
  style = {}
} = {}) {
  return {
    id: String(id || ''),
    type,
    text: String(text || '').trim() || '未命名节点',
    x: Number.isFinite(Number(x)) ? Number(x) : 0,
    y: Number.isFinite(Number(y)) ? Number(y) : 0,
    width: Number.isFinite(Number(width)) ? Number(width) : 168,
    height: Number.isFinite(Number(height)) ? Number(height) : 72,
    style: style && typeof style === 'object' ? { ...style } : {}
  }
}

function createFlowchartEdge({
  id,
  source = '',
  target = '',
  label = '',
  style = {}
} = {}) {
  return {
    id: String(id || ''),
    source: String(source || '').trim(),
    target: String(target || '').trim(),
    label: String(label || ''),
    style: style && typeof style === 'object' ? { ...style } : {}
  }
}

const createFlowchartViewport = viewport => {
  return {
    x: Number.isFinite(Number(viewport?.x)) ? Number(viewport.x) : 0,
    y: Number.isFinite(Number(viewport?.y)) ? Number(viewport.y) : 0,
    zoom: Number.isFinite(Number(viewport?.zoom))
      ? Math.max(0.2, Number(viewport.zoom))
      : 1
  }
}

const createNodeId = (prefix, index) => `${prefix}-${index + 1}`

const createUniqueFlowchartId = ({ id, prefix, index, usedIds }) => {
  const baseId = String(id || '').trim() || createNodeId(prefix, index)
  let nextId = baseId
  let suffix = 2
  while (usedIds.has(nextId)) {
    nextId = `${baseId}-${suffix}`
    suffix += 1
  }
  usedIds.add(nextId)
  return nextId
}

const createFallbackMindMapData = () => ({
  root: {
    data: {
      text: '思维导图'
    },
    children: []
  },
  theme: {
    template: 'classic4',
    config: {}
  },
  layout: 'logicalStructure'
})

const normalizeMindMapData = data => {
  if (data && typeof data === 'object' && data.root) {
    return data
  }
  const defaults = createFallbackMindMapData()
  return {
    ...defaults,
    root: data || defaults.root
  }
}

const normalizeFlowchartNode = (node, index) => {
  const fallbackType = FLOWCHART_NODE_TYPES.some(item => item.type === node?.type)
    ? node.type
    : 'process'
  return createFlowchartNode({
    ...node,
    id: String(node?.id || '').trim() || createNodeId('node', index),
    type: fallbackType,
    text: node?.text || FLOWCHART_NODE_TYPES.find(item => item.type === fallbackType)?.label
  })
}

const normalizeFlowchartEdge = (edge, index, nodes) => {
  const source = String(edge?.source || '').trim()
  const target = String(edge?.target || '').trim()
  if (!source || !target) return null
  if (!nodes.some(item => item.id === source) || !nodes.some(item => item.id === target)) {
    return null
  }
  return createFlowchartEdge({
    ...edge,
    id: String(edge?.id || '').trim() || createNodeId('edge', index),
    source,
    target
  })
}

const normalizeFlowchartConfig = config => {
  return config && typeof config === 'object'
    ? {
        ...DEFAULT_FLOWCHART_CONFIG,
        ...config
      }
    : { ...DEFAULT_FLOWCHART_CONFIG }
}

const normalizeFlowchartData = input => {
  const templateId = String(input?.templateId || 'blank').trim() || 'blank'
  const baseTemplate =
    FLOWCHART_TEMPLATES[templateId] || FLOWCHART_TEMPLATES.blank
  const baseData = baseTemplate(
    String(input?.title || DEFAULT_FLOWCHART_TITLE).trim() || DEFAULT_FLOWCHART_TITLE
  )
  const nodes = Array.isArray(input?.nodes) && input.nodes.length > 0 ? input.nodes : baseData.nodes
  const usedNodeIds = new Set()
  const normalizedNodes = nodes.map((node, index) =>
    normalizeFlowchartNode(
      {
        ...node,
        id: createUniqueFlowchartId({
          id: node?.id,
          prefix: 'node',
          index,
          usedIds: usedNodeIds
        })
      },
      index
    )
  )
  const edges = Array.isArray(input?.edges) ? input.edges : baseData.edges
  const usedEdgeIds = new Set()
  return {
    version: FLOWCHART_DOCUMENT_VERSION,
    title:
      String(input?.title || baseData.title || DEFAULT_FLOWCHART_TITLE).trim() ||
      DEFAULT_FLOWCHART_TITLE,
    templateId,
    viewport: createFlowchartViewport(input?.viewport),
    nodes: normalizedNodes,
    edges: edges
      .map((edge, index) => normalizeFlowchartEdge(edge, index, normalizedNodes))
      .filter(Boolean)
      .map((edge, index) => ({
        ...edge,
        id: createUniqueFlowchartId({
          id: edge.id,
          prefix: 'edge',
          index,
          usedIds: usedEdgeIds
        })
      }))
  }
}

const extractJsonObject = value => {
  const content = String(value || '').trim()
  if (!content) {
    return null
  }
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return parseExternalJsonSafely(fencedMatch[1])
  }
  const firstBrace = content.indexOf('{')
  const lastBrace = content.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return parseExternalJsonSafely(content.slice(firstBrace, lastBrace + 1))
  }
  return parseExternalJsonSafely(content)
}

const createFlowNodeFromMindMapNode = ({ node, index, level, column, usedIds }) => {
  const hasChildren = Array.isArray(node?.children) && node.children.length > 0
  const type =
    level === 0
      ? 'start'
      : hasChildren && node.children.length > 1
        ? 'decision'
        : hasChildren
          ? 'process'
          : 'end'
  const sourceId = String(node?.data?.uid || createNodeId('mindmap-node', index))
  return createFlowchartNode({
    id: createUniqueFlowchartId({
      id: sourceId,
      prefix: 'mindmap-node',
      index,
      usedIds
    }),
    type,
    text: String(node?.data?.text || '').trim() || `步骤 ${index + 1}`,
    x: 120 + column * 240,
    y: 120 + index * 116,
    width: type === 'decision' ? 176 : 168,
    height: type === 'decision' ? 92 : 72
  })
}

export const createDefaultFlowchartData = (
  title = DEFAULT_FLOWCHART_TITLE,
  templateId = 'blank'
) => {
  const templateFactory =
    FLOWCHART_TEMPLATES[templateId] || FLOWCHART_TEMPLATES.blank
  const templateData = templateFactory(String(title || DEFAULT_FLOWCHART_TITLE))
  return normalizeFlowchartData({
    ...templateData,
    title: String(title || templateData.title || DEFAULT_FLOWCHART_TITLE),
    templateId
  })
}

export const createFlowchartDocumentContent = ({
  title = DEFAULT_FLOWCHART_TITLE,
  templateId = 'blank',
  flowchartData,
  flowchartConfig = null
} = {}) => {
  return {
    documentMode: FLOWCHART_DOCUMENT_MODE,
    flowchartData:
      flowchartData && typeof flowchartData === 'object'
        ? normalizeFlowchartData(flowchartData)
        : createDefaultFlowchartData(title, templateId),
    flowchartConfig: normalizeFlowchartConfig(flowchartConfig)
  }
}

export const parseStoredDocumentContent = content => {
  const parsed =
    typeof content === 'string' ? parseExternalJsonSafely(content) : content
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('文件内容不是有效的项目数据')
  }
  if (
    parsed.documentMode === FLOWCHART_DOCUMENT_MODE ||
    (parsed.flowchartData && typeof parsed.flowchartData === 'object')
  ) {
    const flowchartDocument = createFlowchartDocumentContent({
      title: parsed.flowchartData?.title || parsed.title,
      templateId: parsed.flowchartData?.templateId || 'blank',
      flowchartData: parsed.flowchartData || parsed,
      flowchartConfig: parsed.flowchartConfig || null
    })
    return {
      documentMode: FLOWCHART_DOCUMENT_MODE,
      data: flowchartDocument.flowchartData,
      config: flowchartDocument.flowchartConfig,
      flowchartData: flowchartDocument.flowchartData,
      flowchartConfig: flowchartDocument.flowchartConfig,
      isFullDataFile: true
    }
  }

  const isFullDataFile = !!parsed.root
  const mindMapData = normalizeMindMapData(parsed)
  return {
    documentMode: MINDMAP_DOCUMENT_MODE,
    data: mindMapData,
    config: parsed.config,
    mindMapData,
    mindMapConfig: parsed.config,
    isFullDataFile
  }
}

export const serializeStoredDocumentContent = ({
  documentMode = MINDMAP_DOCUMENT_MODE,
  data = null,
  config = null,
  isFullDataFile = true,
  mindMapData = null,
  mindMapConfig = null,
  flowchartData = null,
  flowchartConfig = null
} = {}) => {
  if (documentMode === FLOWCHART_DOCUMENT_MODE) {
    return JSON.stringify(
      createFlowchartDocumentContent({
        flowchartData: flowchartData || data,
        flowchartConfig: flowchartConfig || config
      })
    )
  }
  const nextData = mindMapData || data || createFallbackMindMapData()
  if (!isFullDataFile && nextData?.root) {
    return JSON.stringify(nextData.root)
  }
  return JSON.stringify({
    ...nextData,
    ...(mindMapConfig || config ? { config: mindMapConfig || config } : {})
  })
}

export const convertMindMapToFlowchart = (mindMapData, options = {}) => {
  const normalized = normalizeMindMapData(mindMapData)
  const nodes = []
  const edges = []
  const usedNodeIds = new Set()

  const visit = (node, level = 0, column = 0, parentId = '') => {
    const currentIndex = nodes.length
    const currentNode = createFlowNodeFromMindMapNode({
      node,
      index: currentIndex,
      level,
      column,
      usedIds: usedNodeIds
    })
    nodes.push(currentNode)
    if (parentId) {
      edges.push(
        createFlowchartEdge({
          id: createNodeId('edge', edges.length),
          source: parentId,
          target: currentNode.id
        })
      )
    }
    const children = Array.isArray(node?.children) ? node.children : []
    children.forEach((child, childIndex) => {
      visit(child, level + 1, column + childIndex, currentNode.id)
    })
  }

  visit(normalized.root, 0, 0, '')

  return createFlowchartDocumentContent({
    title:
      String(
        options?.title || normalized.root?.data?.text || DEFAULT_FLOWCHART_TITLE
      ).trim() || DEFAULT_FLOWCHART_TITLE,
    templateId: 'blank',
    flowchartData: {
      title:
        String(
          options?.title || normalized.root?.data?.text || DEFAULT_FLOWCHART_TITLE
        ).trim() || DEFAULT_FLOWCHART_TITLE,
      templateId: 'blank',
      viewport: {
        x: 0,
        y: 0,
        zoom: 1
      },
      nodes,
      edges
    }
  })
}

export const normalizeFlowchartAiResult = result => {
  const parsed =
    typeof result === 'string'
      ? extractJsonObject(result)
      : result && typeof result === 'object'
        ? result
        : null
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI 返回的流程图数据无效')
  }
  const payload =
    parsed.flowchartData && typeof parsed.flowchartData === 'object'
      ? {
          ...parsed.flowchartData,
          flowchartConfig: parsed.flowchartConfig || null
        }
      : parsed
  const flowchartData = normalizeFlowchartData({
    title: payload.title || DEFAULT_FLOWCHART_TITLE,
    templateId: payload.templateId || 'blank',
    viewport: payload.viewport,
    nodes: payload.nodes,
    edges: payload.edges
  })
  return {
    title: flowchartData.title,
    flowchartData,
    flowchartConfig: normalizeFlowchartConfig(payload.flowchartConfig)
  }
}

export const getFlowchartTemplateIds = () => Object.keys(FLOWCHART_TEMPLATES)
