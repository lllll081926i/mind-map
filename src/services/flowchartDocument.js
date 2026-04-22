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
  snapToGrid: false,
  gridSize: 24
}

export const FLOWCHART_NODE_STYLE_PRESETS = [
  { id: 'default', fill: '#ffffff', stroke: '#111827', textColor: '#111827' },
  { id: 'blue', fill: '#eff6ff', stroke: '#2563eb', textColor: '#1e3a8a' },
  { id: 'green', fill: '#ecfdf5', stroke: '#059669', textColor: '#065f46' },
  { id: 'amber', fill: '#fffbeb', stroke: '#d97706', textColor: '#92400e' },
  { id: 'rose', fill: '#fff1f2', stroke: '#e11d48', textColor: '#9f1239' },
  { id: 'slate', fill: '#f8fafc', stroke: '#475569', textColor: '#0f172a' }
]

export const FLOWCHART_EDGE_STYLE_PRESETS = [
  { id: 'default', stroke: '#64748b', dashed: false, pathType: 'orthogonal' },
  { id: 'blue', stroke: '#2563eb', dashed: false, pathType: 'orthogonal' },
  { id: 'green', stroke: '#059669', dashed: false, pathType: 'orthogonal' },
  { id: 'amber', stroke: '#d97706', dashed: true, pathType: 'orthogonal' },
  { id: 'rose', stroke: '#e11d48', dashed: true, pathType: 'orthogonal' }
]

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
  }),
  release: title => ({
    title,
    nodes: [
      createFlowchartNode({
        id: 'node-start',
        type: 'start',
        text: '开发完成',
        x: 120,
        y: 120
      }),
      createFlowchartNode({
        id: 'node-qa',
        type: 'process',
        text: '测试验证',
        x: 120,
        y: 236
      }),
      createFlowchartNode({
        id: 'node-check',
        type: 'decision',
        text: '验证通过？',
        x: 120,
        y: 360,
        width: 168,
        height: 92
      }),
      createFlowchartNode({
        id: 'node-release',
        type: 'process',
        text: '执行发布',
        x: 380,
        y: 360
      }),
      createFlowchartNode({
        id: 'node-fix',
        type: 'process',
        text: '修复问题',
        x: 120,
        y: 516
      }),
      createFlowchartNode({
        id: 'node-end',
        type: 'end',
        text: '上线完成',
        x: 380,
        y: 516
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-qa',
        source: 'node-start',
        target: 'node-qa'
      }),
      createFlowchartEdge({
        id: 'edge-qa-check',
        source: 'node-qa',
        target: 'node-check'
      }),
      createFlowchartEdge({
        id: 'edge-check-release',
        source: 'node-check',
        target: 'node-release',
        label: '是'
      }),
      createFlowchartEdge({
        id: 'edge-check-fix',
        source: 'node-check',
        target: 'node-fix',
        label: '否'
      }),
      createFlowchartEdge({
        id: 'edge-fix-qa',
        source: 'node-fix',
        target: 'node-qa'
      }),
      createFlowchartEdge({
        id: 'edge-release-end',
        source: 'node-release',
        target: 'node-end'
      })
    ]
  }),
  ticket: title => ({
    title,
    nodes: [
      createFlowchartNode({
        id: 'node-start',
        type: 'start',
        text: '收到工单',
        x: 120,
        y: 120
      }),
      createFlowchartNode({
        id: 'node-record',
        type: 'input',
        text: '记录问题',
        x: 120,
        y: 236
      }),
      createFlowchartNode({
        id: 'node-check',
        type: 'decision',
        text: '可直接解决？',
        x: 120,
        y: 360,
        width: 168,
        height: 92
      }),
      createFlowchartNode({
        id: 'node-assign',
        type: 'process',
        text: '分派处理',
        x: 380,
        y: 360
      }),
      createFlowchartNode({
        id: 'node-reply',
        type: 'process',
        text: '回复用户',
        x: 380,
        y: 500
      }),
      createFlowchartNode({
        id: 'node-end',
        type: 'end',
        text: '关闭工单',
        x: 380,
        y: 620
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-record',
        source: 'node-start',
        target: 'node-record'
      }),
      createFlowchartEdge({
        id: 'edge-record-check',
        source: 'node-record',
        target: 'node-check'
      }),
      createFlowchartEdge({
        id: 'edge-check-reply',
        source: 'node-check',
        target: 'node-reply',
        label: '是'
      }),
      createFlowchartEdge({
        id: 'edge-check-assign',
        source: 'node-check',
        target: 'node-assign',
        label: '否'
      }),
      createFlowchartEdge({
        id: 'edge-assign-reply',
        source: 'node-assign',
        target: 'node-reply'
      }),
      createFlowchartEdge({
        id: 'edge-reply-end',
        source: 'node-reply',
        target: 'node-end'
      })
    ]
  }),
  onboarding: title => ({
    title,
    nodes: [
      createFlowchartNode({
        id: 'node-start',
        type: 'start',
        text: '发起入职',
        x: 120,
        y: 120
      }),
      createFlowchartNode({
        id: 'node-prepare',
        type: 'process',
        text: '准备账号设备',
        x: 120,
        y: 236
      }),
      createFlowchartNode({
        id: 'node-check',
        type: 'decision',
        text: '资料齐全？',
        x: 120,
        y: 360,
        width: 168,
        height: 92
      }),
      createFlowchartNode({
        id: 'node-fix',
        type: 'input',
        text: '补齐资料',
        x: 120,
        y: 516
      }),
      createFlowchartNode({
        id: 'node-training',
        type: 'process',
        text: '安排培训',
        x: 380,
        y: 360
      }),
      createFlowchartNode({
        id: 'node-end',
        type: 'end',
        text: '完成入职',
        x: 380,
        y: 516
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-prepare',
        source: 'node-start',
        target: 'node-prepare'
      }),
      createFlowchartEdge({
        id: 'edge-prepare-check',
        source: 'node-prepare',
        target: 'node-check'
      }),
      createFlowchartEdge({
        id: 'edge-check-fix',
        source: 'node-check',
        target: 'node-fix',
        label: '否'
      }),
      createFlowchartEdge({
        id: 'edge-check-training',
        source: 'node-check',
        target: 'node-training',
        label: '是'
      }),
      createFlowchartEdge({
        id: 'edge-fix-check',
        source: 'node-fix',
        target: 'node-check'
      }),
      createFlowchartEdge({
        id: 'edge-training-end',
        source: 'node-training',
        target: 'node-end'
      })
    ]
  }),
  customerJourney: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '用户进入', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-touch', type: 'input', text: '触达入口', x: 120, y: 236 }),
      createFlowchartNode({ id: 'node-need', type: 'decision', text: '需求明确？', x: 120, y: 360, width: 168, height: 92 }),
      createFlowchartNode({ id: 'node-guide', type: 'process', text: '引导选择', x: 120, y: 516 }),
      createFlowchartNode({ id: 'node-action', type: 'process', text: '完成关键动作', x: 380, y: 360 }),
      createFlowchartNode({ id: 'node-feedback', type: 'input', text: '收集反馈', x: 380, y: 500 }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '留存跟进', x: 380, y: 620 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-start-touch', source: 'node-start', target: 'node-touch' }),
      createFlowchartEdge({ id: 'edge-touch-need', source: 'node-touch', target: 'node-need' }),
      createFlowchartEdge({ id: 'edge-need-action', source: 'node-need', target: 'node-action', label: '是' }),
      createFlowchartEdge({ id: 'edge-need-guide', source: 'node-need', target: 'node-guide', label: '否' }),
      createFlowchartEdge({ id: 'edge-guide-action', source: 'node-guide', target: 'node-action' }),
      createFlowchartEdge({ id: 'edge-action-feedback', source: 'node-action', target: 'node-feedback' }),
      createFlowchartEdge({ id: 'edge-feedback-end', source: 'node-feedback', target: 'node-end' })
    ]
  }),
  incident: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '告警触发', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-triage', type: 'process', text: '初步分级', x: 120, y: 236 }),
      createFlowchartNode({ id: 'node-major', type: 'decision', text: '重大故障？', x: 120, y: 360, width: 168, height: 92 }),
      createFlowchartNode({ id: 'node-warroom', type: 'process', text: '建立响应群', x: 380, y: 360 }),
      createFlowchartNode({ id: 'node-fix', type: 'process', text: '止血修复', x: 380, y: 500 }),
      createFlowchartNode({ id: 'node-normal', type: 'process', text: '常规处理', x: 120, y: 516 }),
      createFlowchartNode({ id: 'node-review', type: 'input', text: '复盘记录', x: 380, y: 640 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-start-triage', source: 'node-start', target: 'node-triage' }),
      createFlowchartEdge({ id: 'edge-triage-major', source: 'node-triage', target: 'node-major' }),
      createFlowchartEdge({ id: 'edge-major-warroom', source: 'node-major', target: 'node-warroom', label: '是' }),
      createFlowchartEdge({ id: 'edge-major-normal', source: 'node-major', target: 'node-normal', label: '否' }),
      createFlowchartEdge({ id: 'edge-warroom-fix', source: 'node-warroom', target: 'node-fix' }),
      createFlowchartEdge({ id: 'edge-fix-review', source: 'node-fix', target: 'node-review' }),
      createFlowchartEdge({ id: 'edge-normal-review', source: 'node-normal', target: 'node-review' })
    ]
  }),
  dataPipeline: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-source', type: 'input', text: '数据源', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-ingest', type: 'process', text: '采集入湖', x: 120, y: 236 }),
      createFlowchartNode({ id: 'node-quality', type: 'decision', text: '质量通过？', x: 120, y: 360, width: 168, height: 92 }),
      createFlowchartNode({ id: 'node-clean', type: 'process', text: '清洗转换', x: 380, y: 360 }),
      createFlowchartNode({ id: 'node-repair', type: 'process', text: '修复重跑', x: 120, y: 516 }),
      createFlowchartNode({ id: 'node-serve', type: 'process', text: '服务发布', x: 380, y: 500 }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '监控告警', x: 380, y: 620 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-source-ingest', source: 'node-source', target: 'node-ingest' }),
      createFlowchartEdge({ id: 'edge-ingest-quality', source: 'node-ingest', target: 'node-quality' }),
      createFlowchartEdge({ id: 'edge-quality-clean', source: 'node-quality', target: 'node-clean', label: '是' }),
      createFlowchartEdge({ id: 'edge-quality-repair', source: 'node-quality', target: 'node-repair', label: '否' }),
      createFlowchartEdge({ id: 'edge-repair-ingest', source: 'node-repair', target: 'node-ingest' }),
      createFlowchartEdge({ id: 'edge-clean-serve', source: 'node-clean', target: 'node-serve' }),
      createFlowchartEdge({ id: 'edge-serve-end', source: 'node-serve', target: 'node-end' })
    ]
  }),
  projectPlan: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '立项', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-scope', type: 'input', text: '确认范围', x: 120, y: 236 }),
      createFlowchartNode({ id: 'node-plan', type: 'process', text: '拆解计划', x: 120, y: 352 }),
      createFlowchartNode({ id: 'node-risk', type: 'decision', text: '风险可控？', x: 120, y: 476, width: 168, height: 92 }),
      createFlowchartNode({ id: 'node-execute', type: 'process', text: '执行交付', x: 380, y: 476 }),
      createFlowchartNode({ id: 'node-adjust', type: 'process', text: '调整方案', x: 120, y: 636 }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '验收归档', x: 380, y: 636 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-start-scope', source: 'node-start', target: 'node-scope' }),
      createFlowchartEdge({ id: 'edge-scope-plan', source: 'node-scope', target: 'node-plan' }),
      createFlowchartEdge({ id: 'edge-plan-risk', source: 'node-plan', target: 'node-risk' }),
      createFlowchartEdge({ id: 'edge-risk-execute', source: 'node-risk', target: 'node-execute', label: '是' }),
      createFlowchartEdge({ id: 'edge-risk-adjust', source: 'node-risk', target: 'node-adjust', label: '否' }),
      createFlowchartEdge({ id: 'edge-adjust-plan', source: 'node-adjust', target: 'node-plan' }),
      createFlowchartEdge({ id: 'edge-execute-end', source: 'node-execute', target: 'node-end' })
    ]
  })
}

export const FLOWCHART_TEMPLATE_PRESETS = [
  { id: 'blank', labelKey: 'flowchart.templateBlank' },
  { id: 'approval', labelKey: 'flowchart.templateApproval' },
  { id: 'troubleshooting', labelKey: 'flowchart.templateTroubleshooting' },
  { id: 'release', labelKey: 'flowchart.templateRelease' },
  { id: 'ticket', labelKey: 'flowchart.templateTicket' },
  { id: 'onboarding', labelKey: 'flowchart.templateOnboarding' },
  { id: 'customerJourney', labelKey: 'flowchart.templateCustomerJourney' },
  { id: 'incident', labelKey: 'flowchart.templateIncident' },
  { id: 'dataPipeline', labelKey: 'flowchart.templateDataPipeline' },
  { id: 'projectPlan', labelKey: 'flowchart.templateProjectPlan' }
]

const escapeXml = value => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const createSvgSafeId = value =>
  String(value || 'item').replace(/[^a-zA-Z0-9_-]/g, '-')

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

const getNodeCenter = node => ({
  x: Number(node.x || 0) + Number(node.width || 0) / 2,
  y: Number(node.y || 0) + Number(node.height || 0) / 2
})

const getStyleColor = (value, fallback) => {
  const color = String(value || '').trim()
  return color || fallback
}

export const getFlowchartNodeVisualStyle = (node, { isDark = false } = {}) => {
  return {
    fill: getStyleColor(node?.style?.fill, isDark ? '#1f2937' : '#ffffff'),
    stroke: getStyleColor(node?.style?.stroke, '#111827'),
    textColor: getStyleColor(node?.style?.textColor, isDark ? '#f8fafc' : '#111827')
  }
}

export const getFlowchartEdgeVisualStyle = edge => {
  return {
    stroke: getStyleColor(edge?.style?.stroke, '#64748b'),
    labelColor: getStyleColor(edge?.style?.labelColor, '#475569'),
    dashed: !!edge?.style?.dashed,
    pathType:
      String(edge?.style?.pathType || '').trim() === 'straight'
        ? 'straight'
        : 'orthogonal'
  }
}

export const getFlowchartNodeConnectionPoint = (node, direction = 'right') => {
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
  if (direction === 'bottom') {
    return {
      x: x + width / 2,
      y: y + height
    }
  }
  if (direction === 'left') {
    return {
      x,
      y: y + height / 2
    }
  }
  return {
    x: x + width,
    y: y + height / 2
  }
}

const resolveFlowchartEdgeDirections = (sourceNode, targetNode) => {
  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)
  const deltaX = targetCenter.x - sourceCenter.x
  const deltaY = targetCenter.y - sourceCenter.y
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? { sourceDirection: 'right', targetDirection: 'left' }
      : { sourceDirection: 'left', targetDirection: 'right' }
  }
  return deltaY >= 0
    ? { sourceDirection: 'bottom', targetDirection: 'top' }
    : { sourceDirection: 'top', targetDirection: 'bottom' }
}

export const getFlowchartEdgeLayout = (edge, sourceNode, targetNode) => {
  const style = getFlowchartEdgeVisualStyle(edge)
  const { sourceDirection, targetDirection } = resolveFlowchartEdgeDirections(
    sourceNode,
    targetNode
  )
  const sourcePoint = getFlowchartNodeConnectionPoint(sourceNode, sourceDirection)
  const targetPoint = getFlowchartNodeConnectionPoint(targetNode, targetDirection)
  if (style.pathType === 'straight') {
    return {
      path: `M ${sourcePoint.x} ${sourcePoint.y} L ${targetPoint.x} ${targetPoint.y}`,
      labelX: (sourcePoint.x + targetPoint.x) / 2,
      labelY: (sourcePoint.y + targetPoint.y) / 2 - 8,
      sourcePoint,
      targetPoint,
      style
    }
  }
  const useHorizontalMid =
    sourceDirection === 'left' || sourceDirection === 'right'
  const midX = (sourcePoint.x + targetPoint.x) / 2
  const midY = (sourcePoint.y + targetPoint.y) / 2
  const path = useHorizontalMid
    ? `M ${sourcePoint.x} ${sourcePoint.y} L ${midX} ${sourcePoint.y} L ${midX} ${targetPoint.y} L ${targetPoint.x} ${targetPoint.y}`
    : `M ${sourcePoint.x} ${sourcePoint.y} L ${sourcePoint.x} ${midY} L ${targetPoint.x} ${midY} L ${targetPoint.x} ${targetPoint.y}`
  return {
    path,
    labelX: useHorizontalMid ? midX : (sourcePoint.x + targetPoint.x) / 2,
    labelY: useHorizontalMid ? midY - 8 : midY - 8,
    sourcePoint,
    targetPoint,
    style
  }
}

const getFlowchartLabelTextUnits = label => {
  return Array.from(String(label || '')).reduce((total, char) => {
    if (/\s/.test(char)) {
      return total + 0.45
    }
    if (/[\u1100-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(char)) {
      return total + 1.7
    }
    if (/[MW@#%&]/.test(char)) {
      return total + 1
    }
    return total + 0.72
  }, 0)
}

const getFlowchartEdgeLabelBox = layout => {
  const height = 24
  const width = Math.max(
    48,
    Math.ceil(getFlowchartLabelTextUnits(layout?.edge?.label) * 7.6 + 20)
  )
  return {
    x: Number(layout?.labelX || 0) - width / 2,
    y: Number(layout?.labelY || 0) - height / 2,
    width,
    height
  }
}

const buildSvgNodeShapeMarkup = (node, isDark) => {
  const x = Number(node.x || 0)
  const y = Number(node.y || 0)
  const width = Number(node.width || 0)
  const height = Number(node.height || 0)
  const visualStyle = getFlowchartNodeVisualStyle(node, {
    isDark
  })
  if (node.type === 'decision') {
    const points = [
      `${x + width / 2},${y}`,
      `${x + width},${y + height / 2}`,
      `${x + width / 2},${y + height}`,
      `${x},${y + height / 2}`
    ].join(' ')
    return `<polygon points="${points}" fill="${escapeXml(visualStyle.fill)}" stroke="${escapeXml(visualStyle.stroke)}" stroke-width="2"/>`
  }
  if (node.type === 'input') {
    const offset = Math.max(width * 0.12, 16)
    const points = [
      `${x + offset},${y}`,
      `${x + width},${y}`,
      `${x + width - offset},${y + height}`,
      `${x},${y + height}`
    ].join(' ')
    return `<polygon points="${points}" fill="${escapeXml(visualStyle.fill)}" stroke="${escapeXml(visualStyle.stroke)}" stroke-width="2"/>`
  }
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${
    node.type === 'start' || node.type === 'end' ? 22 : 10
  }" fill="${escapeXml(visualStyle.fill)}" stroke="${escapeXml(visualStyle.stroke)}" stroke-width="2"/>`
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

export const getFlowchartExportBounds = (
  flowchartData,
  { paddingX = 120, paddingY = 120 } = {}
) => {
  const nodes = Array.isArray(flowchartData?.nodes) ? flowchartData.nodes : []
  if (!nodes.length) {
    return {
      x: 0,
      y: 0,
      width: 1200,
      height: 720
    }
  }
  const bounds = nodes.reduce(
    (result, node) => ({
      minX: Math.min(result.minX, Number(node.x || 0)),
      minY: Math.min(result.minY, Number(node.y || 0)),
      maxX: Math.max(
        result.maxX,
        Number(node.x || 0) + Number(node.width || 0)
      ),
      maxY: Math.max(
        result.maxY,
        Number(node.y || 0) + Number(node.height || 0)
      )
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    }
  )
  return {
    x: Math.floor(bounds.minX - paddingX),
    y: Math.floor(bounds.minY - paddingY),
    width: Math.max(1200, Math.ceil(bounds.maxX - bounds.minX + paddingX * 2)),
    height: Math.max(720, Math.ceil(bounds.maxY - bounds.minY + paddingY * 2))
  }
}

export const buildFlowchartSvgMarkup = (
  flowchartData,
  {
    isDark = false,
    transparent = false,
    paddingX = 120,
    paddingY = 120
  } = {}
) => {
  const normalizedData = normalizeFlowchartData(flowchartData || {})
  const bounds = getFlowchartExportBounds(normalizedData, {
    paddingX,
    paddingY
  })
  const edgeItems = normalizedData.edges
    .map(edge => {
      const sourceNode = normalizedData.nodes.find(node => node.id === edge.source)
      const targetNode = normalizedData.nodes.find(node => node.id === edge.target)
      if (!sourceNode || !targetNode) return null
      return {
        edge,
        markerId: `flowchart-arrow-${createSvgSafeId(edge.id)}`,
        layout: getFlowchartEdgeLayout(edge, sourceNode, targetNode)
      }
    })
    .filter(Boolean)
  const markerDefs = edgeItems
    .map(({ markerId, layout }) => {
      return `<marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${escapeXml(layout.style.stroke)}"/></marker>`
    })
    .join('')
  const edges = edgeItems
    .map(({ edge, markerId, layout }) => {
      const dash = layout.style.dashed ? ' stroke-dasharray="8 6"' : ''
      const labelBox = getFlowchartEdgeLabelBox({
        ...layout,
        edge
      })
      const label = edge.label
        ? `<rect x="${labelBox.x}" y="${labelBox.y}" width="${labelBox.width}" height="${labelBox.height}" rx="8" fill="${escapeXml(isDark ? 'rgba(24, 28, 34, 0.92)' : 'rgba(255, 255, 255, 0.88)')}" stroke="${escapeXml(isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.07)')}"/><text x="${layout.labelX}" y="${layout.labelY}" font-size="12" fill="${escapeXml(layout.style.labelColor)}" text-anchor="middle" dominant-baseline="middle">${escapeXml(edge.label)}</text>`
        : ''
      return `<g><path d="${layout.path}" fill="none" stroke="${escapeXml(layout.style.stroke)}" stroke-width="2"${dash} marker-end="url(#${markerId})"/>${label}</g>`
    })
    .join('')
  const nodes = normalizedData.nodes
    .map(node => {
      const visualStyle = getFlowchartNodeVisualStyle(node, {
        isDark
      })
      return `<g>${buildSvgNodeShapeMarkup(node, isDark)}<text x="${
        Number(node.x || 0) + Number(node.width || 0) / 2
      }" y="${
        Number(node.y || 0) + Number(node.height || 0) / 2 + 5
      }" font-size="14" fill="${escapeXml(visualStyle.textColor)}" text-anchor="middle">${escapeXml(node.text)}</text></g>`
    })
    .join('')
  const background = transparent
    ? ''
    : `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${
        isDark ? '#171a1f' : '#ffffff'
      }"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"><defs>${markerDefs}</defs>${background}${edges}${nodes}</svg>`
}

export const getFlowchartTemplateIds = () => Object.keys(FLOWCHART_TEMPLATES)
