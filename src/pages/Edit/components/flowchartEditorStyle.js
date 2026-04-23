export const flowchartStyleMethods = {
  updateFlowchartConfig(configPatch = {}) {
    const wasStrictAlignment = !!this.flowchartConfig?.strictAlignment
    const nextFlowchartConfig = {
      ...this.flowchartConfig,
      ...configPatch
    }
    if (nextFlowchartConfig.strictAlignment) {
      this.flowchartData.edges.forEach(edge => {
        edge.style = {
          ...(edge.style || {}),
          pathType: 'orthogonal'
        }
      })
      if (this.selectedEdge?.style) {
        this.selectedEdge.style.pathType = 'orthogonal'
      }
    }
    this.flowchartConfig = nextFlowchartConfig
    if (nextFlowchartConfig.strictAlignment && !wasStrictAlignment) {
      if ((this.flowchartData?.nodes || []).length > 1) {
        void this.tidyFlowchartLayout({
          silent: true
        })
        return
      }
    }
    void this.persistFlowchartState()
  },

  updateFlowchartTheme(themeId) {
    const normalizedThemeId = String(themeId || '').trim() || 'blueprint'
    this.flowchartConfig = {
      ...this.flowchartConfig,
      themeId: normalizedThemeId
    }
    void this.persistFlowchartState()
  },

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
    const nextStylePatch = { ...stylePatch }
    if (this.flowchartConfig.strictAlignment) {
      nextStylePatch.pathType = 'orthogonal'
    }
    this.selectedEdge.style = {
      ...(this.selectedEdge.style || {}),
      ...nextStylePatch
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
      pathType: this.flowchartConfig.strictAlignment
        ? 'orthogonal'
        : preset.pathType || 'orthogonal'
    })
  }
}
