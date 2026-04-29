import { normalizeFlowchartEdgeLabelPosition } from '@/services/flowchartDocument'

const EDGE_DASH_PATTERNS = new Set(['solid', 'dash', 'longDash', 'dot', 'dashDot'])

const normalizeEdgeArrowSize = value => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return 1
  }
  return Math.max(0.6, Math.min(1.6, numericValue))
}

const normalizeEdgeArrowCount = value => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return 1
  }
  return Math.max(0, Math.min(4, Math.round(numericValue)))
}

const normalizeBackgroundStyle = value => {
  return value === 'grid' || value === 'dots' ? value : 'none'
}

export const flowchartStyleMethods = {
  updateFlowchartConfig(configPatch = {}) {
    const wasStrictAlignment = !!this.flowchartConfig?.strictAlignment
    const nextFlowchartConfig = {
      ...this.flowchartConfig,
      ...configPatch
    }
    nextFlowchartConfig.backgroundStyle = normalizeBackgroundStyle(
      nextFlowchartConfig.backgroundStyle
    )
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
    this.queueInteractiveFlowchartPersist()
  },

  resetSelectedNodeStyle() {
    if (!this.selectedNode) {
      return
    }
    this.selectedNode.style = {}
    this.queueInteractiveFlowchartPersist()
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
    if (Object.prototype.hasOwnProperty.call(nextStylePatch, 'arrowSize')) {
      nextStylePatch.arrowSize = normalizeEdgeArrowSize(nextStylePatch.arrowSize)
    }
    if (Object.prototype.hasOwnProperty.call(nextStylePatch, 'arrowCount')) {
      nextStylePatch.arrowCount = normalizeEdgeArrowCount(nextStylePatch.arrowCount)
    }
    if (Object.prototype.hasOwnProperty.call(nextStylePatch, 'dashPattern')) {
      const normalizedDashPattern = EDGE_DASH_PATTERNS.has(nextStylePatch.dashPattern)
        ? nextStylePatch.dashPattern
        : 'solid'
      nextStylePatch.dashPattern = normalizedDashPattern
      nextStylePatch.dashed = normalizedDashPattern !== 'solid'
    } else if (Object.prototype.hasOwnProperty.call(nextStylePatch, 'dashed')) {
      nextStylePatch.dashPattern = nextStylePatch.dashed ? 'dash' : 'solid'
    }
    if (this.flowchartConfig.strictAlignment) {
      nextStylePatch.pathType = 'orthogonal'
    }
    this.selectedEdge.style = {
      ...(this.selectedEdge.style || {}),
      ...nextStylePatch
    }
    this.queueInteractiveFlowchartPersist()
  },

  updateSelectedEdgeLabelPosition(positionPatch = {}) {
    if (!this.selectedEdge) {
      return
    }
    this.selectedEdge.labelPosition = normalizeFlowchartEdgeLabelPosition({
      ...(this.selectedEdge.labelPosition || {}),
      ...positionPatch
    })
    this.queueInteractiveFlowchartPersist()
  },

  resetSelectedEdgeStyle() {
    if (!this.selectedEdge) {
      return
    }
    this.selectedEdge.style = {}
    this.queueInteractiveFlowchartPersist()
  },

  applySelectedEdgePreset(preset) {
    if (!preset) {
      return
    }
    this.updateSelectedEdgeStyle({
      stroke: preset.stroke,
      dashed: !!preset.dashed,
      dashPattern: preset.dashPattern || (preset.dashed ? 'dash' : 'solid'),
      pathType: this.flowchartConfig.strictAlignment
        ? 'orthogonal'
        : preset.pathType || 'orthogonal'
    })
  },

  resetSelectedEdgeLabelPosition() {
    if (!this.selectedEdge) {
      return
    }
    this.selectedEdge.labelPosition = null
    this.queueInteractiveFlowchartPersist()
  }
}
