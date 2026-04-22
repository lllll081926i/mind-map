export const flowchartSelectionMethods = {
  selectNode(nodeId, event) {
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    if (
      this.inlineTextEditorState &&
      !(this.inlineTextEditorState.kind === 'node' && this.inlineTextEditorState.id === nodeId)
    ) {
      this.inlineTextEditorState = null
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
  },

  selectEdge(edgeId) {
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    if (
      this.inlineTextEditorState &&
      !(this.inlineTextEditorState.kind === 'edge' && this.inlineTextEditorState.id === edgeId)
    ) {
      this.inlineTextEditorState = null
    }
    this.selectedEdgeId = edgeId
    this.selectedNodeIds = []
    this.syncEdgeToolbarState(edgeId)
  },

  clearSelection() {
    this.cancelConnectorDrag()
    this.cancelEdgeReconnect()
    this.selectedNodeIds = []
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
  },

  syncEdgeToolbarState(edgeId = this.selectedEdgeId) {
    if (!edgeId || this.inlineTextEditorState?.kind === 'edge') {
      this.edgeToolbarState = null
      return
    }
    const edge = this.edgesWithLayout.find(item => item.id === edgeId)
    if (!edge) {
      this.edgeToolbarState = null
      return
    }
    this.edgeToolbarState = {
      edgeId,
      style: {
        left: `${edge.labelX}px`,
        top: `${edge.labelY}px`
      }
    }
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
      this.inlineTextEditorState = null
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
    this.inlineTextEditorState = null
    this.$message.success(this.$t('flowchart.deleteSuccess'))
    void this.persistFlowchartState()
  }
}
