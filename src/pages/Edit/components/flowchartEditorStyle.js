export const flowchartStyleMethods = {
  updateSelectedNodeStyle(stylePatch = {}) {
    if (!this.selectedNode) {
      return
    }
    this.selectedNode.style = {
      ...(this.selectedNode.style || {}),
      ...stylePatch
    }
    void this.persistFlowchartState()
  },

  resetSelectedNodeStyle() {
    if (!this.selectedNode) {
      return
    }
    this.selectedNode.style = {}
    void this.persistFlowchartState()
  },

  applySelectedNodePreset(preset) {
    if (!preset) {
      return
    }
    this.updateSelectedNodeStyle({
      fill: preset.fill,
      stroke: preset.stroke,
      textColor: preset.textColor
    })
  },

  updateSelectedEdgeStyle(stylePatch = {}) {
    if (!this.selectedEdge) {
      return
    }
    this.selectedEdge.style = {
      ...(this.selectedEdge.style || {}),
      ...stylePatch
    }
    void this.persistFlowchartState()
  },

  resetSelectedEdgeStyle() {
    if (!this.selectedEdge) {
      return
    }
    this.selectedEdge.style = {}
    void this.persistFlowchartState()
  },

  applySelectedEdgePreset(preset) {
    if (!preset) {
      return
    }
    this.updateSelectedEdgeStyle({
      stroke: preset.stroke,
      dashed: !!preset.dashed,
      pathType: preset.pathType || 'orthogonal'
    })
  }
}
