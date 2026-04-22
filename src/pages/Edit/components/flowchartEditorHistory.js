import { createDefaultFlowchartData } from '@/services/flowchartDocument'
import {
  FLOWCHART_HISTORY_LIMIT,
  cloneJson
} from './flowchartEditorShared'

export const flowchartHistoryMethods = {
  createFlowchartHistorySnapshot() {
    return {
      flowchartData: cloneJson(this.flowchartData),
      flowchartConfig: cloneJson(this.flowchartConfig)
    }
  },

  serializeFlowchartHistorySnapshot(snapshot) {
    return JSON.stringify(snapshot || {})
  },

  initializeFlowchartHistory() {
    this.flowchartHistory = {
      undoStack: [],
      redoStack: [],
      baseline: this.createFlowchartHistorySnapshot(),
      restoring: false
    }
  },

  commitFlowchartHistorySnapshot() {
    if (this.flowchartHistory.restoring) {
      return
    }
    const currentSnapshot = this.createFlowchartHistorySnapshot()
    const baseline =
      this.flowchartHistory.baseline || this.createFlowchartHistorySnapshot()
    if (
      this.serializeFlowchartHistorySnapshot(currentSnapshot) ===
      this.serializeFlowchartHistorySnapshot(baseline)
    ) {
      this.flowchartHistory.baseline = currentSnapshot
      return
    }
    this.flowchartHistory.undoStack.push(cloneJson(baseline))
    while (this.flowchartHistory.undoStack.length > FLOWCHART_HISTORY_LIMIT) {
      this.flowchartHistory.undoStack.shift()
    }
    this.flowchartHistory.redoStack = []
    this.flowchartHistory.baseline = currentSnapshot
  },

  restoreFlowchartHistorySnapshot(snapshot) {
    if (!snapshot) return
    this.flowchartHistory.restoring = true
    this.flowchartData = cloneJson(
      snapshot.flowchartData || createDefaultFlowchartData()
    )
    const nextFlowchartConfig = {
      snapToGrid: false,
      gridSize: 24,
      ...cloneJson(snapshot.flowchartConfig || {})
    }
    nextFlowchartConfig.snapToGrid = false
    this.flowchartConfig = nextFlowchartConfig
    this.selectedNodeIds = []
    this.selectedEdgeId = ''
    this.clearAlignmentGuides()
    this.edgeToolbarState = null
    this.inlineTextEditorState = null
    this.cancelConnectorDrag()
    this.flowchartHistory.baseline = this.createFlowchartHistorySnapshot()
    this.flowchartHistory.restoring = false
  },

  undoFlowchartChange() {
    const previousSnapshot = this.flowchartHistory.undoStack.pop()
    if (!previousSnapshot) {
      return false
    }
    this.flowchartHistory.redoStack.push(this.createFlowchartHistorySnapshot())
    this.restoreFlowchartHistorySnapshot(previousSnapshot)
    void this.persistFlowchartState({
      recordHistory: false
    })
    return true
  },

  redoFlowchartChange() {
    const nextSnapshot = this.flowchartHistory.redoStack.pop()
    if (!nextSnapshot) {
      return false
    }
    this.flowchartHistory.undoStack.push(this.createFlowchartHistorySnapshot())
    this.restoreFlowchartHistorySnapshot(nextSnapshot)
    void this.persistFlowchartState({
      recordHistory: false
    })
    return true
  }
}
