import { createDefaultFlowchartData } from '@/services/flowchartDocument'

export const cloneJson = value => JSON.parse(JSON.stringify(value))

export const createNodeId = (prefix = 'node') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const getNodeCenter = node => ({
  x: Number(node.x || 0) + Number(node.width || 0) / 2,
  y: Number(node.y || 0) + Number(node.height || 0) / 2
})

export const MIN_VIEWPORT_ZOOM = 0.25
export const MAX_VIEWPORT_ZOOM = 2.5
export const FLOWCHART_ALIGNMENT_THRESHOLD = 8
export const FLOWCHART_HISTORY_LIMIT = 60
export const FLOWCHART_AUTO_SAVE_INTERVAL = 60 * 1000
export const FLOWCHART_INTERACTION_CLICK_GUARD_MS = 160
export const FLOWCHART_NODE_HIT_PADDING = 28
export const FLOWCHART_SELECTION_BOX_MIN_SIZE = 10
export const DEFAULT_VIEWPORT = {
  x: 0,
  y: 0,
  zoom: 1
}

export const clampNumber = (value, min, max) => {
  return Math.min(max, Math.max(min, Number(value)))
}

export const hasConvertibleMindMapData = mindMapData => {
  const root = mindMapData?.root
  if (!root || typeof root !== 'object') {
    return false
  }
  const rootText = String(root.data?.text || '').trim()
  const hasChildren = Array.isArray(root.children) && root.children.length > 0
  return hasChildren || (!!rootText && rootText !== '思维导图')
}

export const createEmptyHistorySnapshot = () => createDefaultFlowchartData()
