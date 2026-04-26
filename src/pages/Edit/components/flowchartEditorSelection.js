import { FLOWCHART_INTERACTION_CLICK_GUARD_MS } from './flowchartEditorShared'

export const flowchartSelectionMethods = {
  suppressPointerClick(duration = FLOWCHART_INTERACTION_CLICK_GUARD_MS) {
    this.interactionClickGuardUntil = Date.now() + Math.max(0, Number(duration || 0))
  },

  hasSuppressedPointerClick() {
    return Number(this.interactionClickGuardUntil || 0) > Date.now()
  },

  selectNode(nodeId, event) {
    if (this.hasSuppressedPointerClick()) {
      return
    }
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    this.cancelEdgeBendDrag()
    this.cancelEdgeLabelDrag()
    if (
      this.inlineTextEditorState &&
      !(this.inlineTextEditorState.kind === 'node' && this.inlineTextEditorState.id === nodeId)
    ) {
      void this.commitInlineTextEditor()
    }
    const isAppend = !!(event?.shiftKey || event?.ctrlKey || event?.metaKey)
    if (isAppend) {
      const nextIds = this.selectedNodeIds.includes(nodeId)
        ? this.selectedNodeIds.filter(id => id !== nodeId)
        : [...this.selectedNodeIds, nodeId]
      this.selectedNodeIds = nextIds
    } else {
      this.selectedNodeIds = [nodeId]
    }
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
    if (this.isInspectorOpen) {
      this.inspectorPanelSection = 'inspector'
    }
  },

  selectEdge(edgeId) {
    if (this.hasSuppressedPointerClick()) {
      return
    }
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    this.cancelEdgeBendDrag()
    this.cancelEdgeLabelDrag()
    if (
      this.inlineTextEditorState &&
      !(this.inlineTextEditorState.kind === 'edge' && this.inlineTextEditorState.id === edgeId)
    ) {
      void this.commitInlineTextEditor()
    }
    this.selectedEdgeId = edgeId
    this.selectedNodeIds = []
    this.inspectorPanelSection = 'inspector'
    this.isInspectorOpen = true
    this.edgeToolbarState = null
  },

  clearSelection() {
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    this.cancelEdgeBendDrag()
    this.cancelEdgeLabelDrag()
    this.selectedNodeIds = []
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
  },

  syncEdgeToolbarState(edgeId = this.selectedEdgeId) {
    void edgeId
    this.edgeToolbarState = null
  },

  toggleInspector() {
    this.isInspectorOpen = !this.isInspectorOpen
  },

  closeInspector() {
    this.isInspectorOpen = false
  },

  isTextEditingTarget(target) {
    const tagName = String(target?.tagName || '').toLowerCase()
    return (
      tagName === 'input' ||
      tagName === 'select' ||
      tagName === 'textarea' ||
      target?.isContentEditable
    )
  },

  handleGlobalKeydown(event) {
    if (this.isTextEditingTarget(event.target)) {
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      this.discardInlineTextEditor()
      this.closeInspector()
      this.clearSelection()
      return
    }
    const isMetaKey = event.ctrlKey || event.metaKey
    if (isMetaKey && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      if (event.shiftKey) {
        this.redoFlowchartChange()
      } else {
        this.undoFlowchartChange()
      }
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'y') {
      event.preventDefault()
      this.redoFlowchartChange()
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      this.selectAllNodes()
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'd') {
      event.preventDefault()
      this.duplicateSelectedNodes()
      return
    }
    if (event.altKey && event.shiftKey && event.key.startsWith('Arrow')) {
      event.preventDefault()
      this.cloneAndConnectSelectedNode(event.key)
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'c') {
      event.preventDefault()
      this.copySelectedNodes()
      return
    }
    if (isMetaKey && event.key.toLowerCase() === 'v') {
      event.preventDefault()
      this.pasteCopiedNodes()
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selectedNodeIds.length || this.selectedEdgeId) {
        event.preventDefault()
        this.removeSelection()
      }
    }
    if (event.key.startsWith('Arrow') && this.selectedNodeIds.length) {
      event.preventDefault()
      this.nudgeSelectedNodes(event.key, event)
    }
  },

  getSelectedNodes() {
    const selectedSet = new Set(this.selectedNodeIds)
    return this.flowchartData.nodes.filter(node => selectedSet.has(node.id))
  },

  selectAllNodes() {
    this.selectedNodeIds = this.flowchartData.nodes.map(node => node.id)
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
  },

  removeSelection() {
    if (!this.selectedEdgeId && !this.selectedNodeIds.length) {
      this.$message.warning(this.$t('flowchart.selectionEmpty'))
      return
    }
    if (this.selectedEdgeId) {
      this.flowchartData.edges = this.flowchartData.edges.filter(
        edge => edge.id !== this.selectedEdgeId
      )
      this.selectedEdgeId = ''
      this.edgeToolbarState = null
    }
    if (this.selectedNodeIds.length) {
      const selectedSet = new Set(this.selectedNodeIds)
      this.flowchartData.nodes = this.flowchartData.nodes.filter(node => !selectedSet.has(node.id))
      this.flowchartData.edges = this.flowchartData.edges.filter(edge => {
        return !selectedSet.has(edge.source) && !selectedSet.has(edge.target)
      })
      this.selectedNodeIds = []
    }
    this.discardInlineTextEditor()
    this.$message.success(this.$t('flowchart.deleteSuccess'))
    void this.persistFlowchartState()
  }
}
