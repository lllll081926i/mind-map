import { FLOWCHART_NODE_TYPES } from '@/services/flowchartDocument'
import { createNodeId } from './flowchartEditorShared'

export const flowchartInlineEditMethods = {
  updateSelectedNodeText(value) {
    if (!this.selectedNode) return
    this.selectedNode.text = String(value || '').trim() || this.selectedNode.text
    if (
      this.inlineTextEditorState &&
      this.inlineTextEditorState.kind === 'node' &&
      this.inlineTextEditorState.id === this.selectedNode.id
    ) {
      this.inlineTextEditorState = {
        ...this.inlineTextEditorState,
        value: this.selectedNode.text
      }
    }
    this.queueInteractiveFlowchartPersist()
  },

  updateSelectedEdgeLabel(value) {
    if (!this.selectedEdge) return
    this.selectedEdge.label = String(value || '')
    if (
      this.inlineTextEditorState &&
      this.inlineTextEditorState.kind === 'edge' &&
      this.inlineTextEditorState.id === this.selectedEdge.id
    ) {
      this.inlineTextEditorState = {
        ...this.inlineTextEditorState,
        value: this.selectedEdge.label
      }
    }
    this.queueInteractiveFlowchartPersist()
  },

  getInlineTextEditorStyle(kind, target) {
    if (kind === 'node') {
      return {
        left: `${Number(target.x || 0)}px`,
        top: `${Number(target.y || 0)}px`,
        width: `${Number(target.width || 0)}px`,
        minHeight: `${Number(target.height || 0)}px`
      }
    }
    return {
      left: `${Number(target.labelX || 0)}px`,
      top: `${Number(target.labelY || 0)}px`,
      width: '168px'
    }
  },

  openInlineTextEditor({ kind, id }) {
    const target =
      kind === 'node'
        ? this.getNodeById(id)
        : this.edgesWithLayout.find(edge => edge.id === id) || this.getEdgeById(id)
    if (!target) {
      return
    }
    const value =
      kind === 'node' ? String(target.text || '') : String(target.label || '')
    this.inlineTextEditorState = {
      kind,
      id,
      value,
      style: this.getInlineTextEditorStyle(kind, target)
    }
    if (kind === 'edge') {
      this.selectedEdgeId = id
      this.selectedNodeIds = []
      this.edgeToolbarState = null
    } else {
      this.selectedNodeIds = [id]
      this.selectedEdgeId = ''
    }
    this.$nextTick(() => {
      const editor = this.$refs.inlineTextEditorRef
      const inputEl = Array.isArray(editor) ? editor[0] : editor
      inputEl?.focus?.()
      inputEl?.select?.()
    })
  },

  discardInlineTextEditor() {
    this.inlineTextEditorState = null
    this.syncEdgeToolbarState()
  },

  handleInlineTextEditorKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      this.discardInlineTextEditor()
      return
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      this.commitInlineTextEditor()
    }
  },

  getInlineTextEditorLiveValue() {
    const editor = this.$refs.inlineTextEditorRef
    const inputEl = Array.isArray(editor) ? editor[0] : editor
    if (inputEl && typeof inputEl.value === 'string') {
      return inputEl.value
    }
    return this.inlineTextEditorState?.value || ''
  },

  async commitInlineTextEditor() {
    const editorState = this.inlineTextEditorState
    if (!editorState) {
      return
    }
    const liveValue = this.getInlineTextEditorLiveValue()
    this.inlineTextEditorState = null
    const { kind, id } = editorState
    const normalizedValue = String(liveValue || '').trim()
    if (kind === 'node') {
      const targetNode = this.getNodeById(id)
      if (targetNode) {
        targetNode.text = normalizedValue || targetNode.text
        await this.persistFlowchartState()
      }
    } else {
      const targetEdge = this.getEdgeById(id)
      if (targetEdge) {
        targetEdge.label = normalizedValue
        await this.persistFlowchartState()
      }
    }
    this.syncEdgeToolbarState()
  },

  editNodeText(nodeId) {
    this.openInlineTextEditor({
      kind: 'node',
      id: nodeId
    })
  },

  editEdgeLabel(edgeId = this.selectedEdgeId) {
    if (!edgeId) {
      return
    }
    this.openInlineTextEditor({
      kind: 'edge',
      id: edgeId
    })
  },

  removeEdge(edgeId = this.selectedEdgeId) {
    if (!edgeId) {
      return
    }
    this.flowchartData.edges = this.flowchartData.edges.filter(edge => edge.id !== edgeId)
    if (this.selectedEdgeId === edgeId) {
      this.selectedEdgeId = ''
    }
    if (
      this.inlineTextEditorState &&
      this.inlineTextEditorState.kind === 'edge' &&
      this.inlineTextEditorState.id === edgeId
    ) {
      this.inlineTextEditorState = null
    }
    this.edgeToolbarState = null
    void this.persistFlowchartState()
  },

  async insertNodeOnEdge(edgeId, type = 'process') {
    const targetEdge = this.getEdgeById(edgeId)
    if (!targetEdge) {
      return
    }
    const edgeLayout = this.edgesWithLayout.find(edge => edge.id === edgeId)
    const size = this.getDefaultNodeSizeByType(type)
    const middleX = edgeLayout ? edgeLayout.labelX : 0
    const middleY = edgeLayout ? edgeLayout.labelY + 8 : 0
    const position = this.snapPositionToGrid({
      x: middleX - size.width / 2,
      y: middleY - size.height / 2
    })
    const newNode = {
      id: createNodeId(type),
      type,
      text:
        FLOWCHART_NODE_TYPES.find(item => item.type === type)?.label ||
        this.$t('flowchart.addProcess'),
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      style: {}
    }
    this.flowchartData.nodes.push(newNode)
    this.flowchartData.edges = this.flowchartData.edges.filter(edge => edge.id !== edgeId)
    this.ensureFlowchartEdge(targetEdge.source, newNode.id)
    this.ensureFlowchartEdge(newNode.id, targetEdge.target)
    this.selectedNodeIds = [newNode.id]
    this.selectedEdgeId = ''
    this.edgeToolbarState = null
    await this.persistFlowchartState()
    this.openInlineTextEditor({
      kind: 'node',
      id: newNode.id
    })
  }
}
