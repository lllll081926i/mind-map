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
  gridSize: 24,
  themeId: 'blueprint',
  strictAlignment: false
}

const FLOWCHART_THEME_PRESET_MAP = {
  blueprint: {
    labelKey: 'flowchart.themeBlueprint',
    light: {
      canvasBg: '#ffffff',
      gridColor: 'rgba(0, 0, 0, 0.08)',
      floatingBg: 'rgba(255, 255, 255, 0.96)',
      floatingBorder: 'rgba(0, 0, 0, 0.1)',
      floatingShadow: 'rgba(0, 0, 0, 0.04) 0px 4px 18px, rgba(0, 0, 0, 0.027) 0px 2.025px 7.84688px, rgba(0, 0, 0, 0.02) 0px 0.8px 2.925px, rgba(0, 0, 0, 0.01) 0px 0.175px 1.04062px',
      dockBg: 'rgba(255, 255, 255, 0.94)',
      dockBorder: 'rgba(0, 0, 0, 0.1)',
      dockShadow: 'rgba(0, 0, 0, 0.04) 0px 4px 18px, rgba(0, 0, 0, 0.027) 0px 2.025px 7.84688px, rgba(0, 0, 0, 0.02) 0px 0.8px 2.925px, rgba(0, 0, 0, 0.01) 0px 0.175px 1.04062px',
      dockActiveBg: 'rgba(0, 117, 222, 0.08)',
      dockActiveText: '#0075de',
      text: 'rgba(0, 0, 0, 0.95)',
      subtleText: '#615d59',
      toolbarBg: 'rgba(255, 255, 255, 0.88)',
      toolbarBorder: 'rgba(0, 0, 0, 0.1)',
      toolbarBtnHover: 'rgba(0, 0, 0, 0.04)',
      nodeBg: '#ffffff',
      nodeBorder: 'rgba(0, 0, 0, 0.1)',
      nodeShadow: 'rgba(0, 0, 0, 0.04) 0px 4px 18px, rgba(0, 0, 0, 0.027) 0px 2.025px 7.84688px, rgba(0, 0, 0, 0.02) 0px 0.8px 2.925px, rgba(0, 0, 0, 0.01) 0px 0.175px 1.04062px',
      accent: '#0075de',
      accentRing: 'rgba(0, 117, 222, 0.16)',
      connector: '#0075de',
      connectorPreview: 'rgba(0, 117, 222, 0.5)',
      overlay: 'rgba(15, 23, 42, 0.2)',
      templatePreviewBg: 'rgba(0, 0, 0, 0.04)',
      templateEdgeStroke: 'rgba(0, 0, 0, 0.82)',
      templateNodeFill: 'rgba(255, 255, 255, 0.94)',
      templateNodeStroke: 'rgba(0, 0, 0, 0.72)',
      iconStroke: '#31302e',
      nodeFill: '#ffffff',
      nodeStroke: '#31302e',
      nodeTextColor: '#31302e',
      edgeStroke: '#31302e',
      edgeLabelColor: '#31302e'
    },
    dark: {
      canvasBg: '#0d172d',
      gridColor: 'rgba(96, 165, 250, 0.12)',
      floatingBg: 'rgba(13, 23, 45, 0.92)',
      floatingBorder: 'rgba(96, 165, 250, 0.2)',
      floatingShadow: '0 20px 40px rgba(2, 6, 23, 0.42)',
      dockBg: 'rgba(10, 19, 38, 0.94)',
      dockBorder: 'rgba(96, 165, 250, 0.18)',
      dockShadow: '0 18px 36px rgba(2, 6, 23, 0.42)',
      dockActiveBg: 'rgba(96, 165, 250, 0.18)',
      dockActiveText: '#bfdbfe',
      text: '#e5eefc',
      subtleText: '#97aed6',
      toolbarBg: 'rgba(10, 19, 38, 0.9)',
      toolbarBorder: 'rgba(96, 165, 250, 0.18)',
      toolbarBtnHover: 'rgba(96, 165, 250, 0.12)',
      nodeBg: '#10203d',
      nodeBorder: '#3156ab',
      nodeShadow: '0 14px 30px rgba(2, 6, 23, 0.36)',
      accent: '#7dd3fc',
      accentRing: 'rgba(125, 211, 252, 0.22)',
      connector: '#7dd3fc',
      connectorPreview: 'rgba(125, 211, 252, 0.56)',
      overlay: 'rgba(2, 6, 23, 0.48)',
      templatePreviewBg: 'rgba(125, 211, 252, 0.1)',
      templateEdgeStroke: 'rgba(125, 211, 252, 0.9)',
      templateNodeFill: 'rgba(16, 32, 61, 0.92)',
      templateNodeStroke: 'rgba(191, 219, 254, 0.7)',
      iconStroke: '#dbeafe',
      nodeFill: '#10203d',
      nodeStroke: '#6ea8ff',
      nodeTextColor: '#eff6ff',
      edgeStroke: '#7dd3fc',
      edgeLabelColor: '#bfdbfe'
    }
  },
  opsWarm: {
    labelKey: 'flowchart.themeOpsWarm',
    light: {
      canvasBg: '#fff7ed',
      gridColor: 'rgba(234, 88, 12, 0.08)',
      floatingBg: 'rgba(255, 251, 245, 0.94)',
      floatingBorder: 'rgba(234, 88, 12, 0.14)',
      floatingShadow: '0 18px 32px rgba(194, 65, 12, 0.12)',
      dockBg: 'rgba(255, 250, 244, 0.95)',
      dockBorder: 'rgba(234, 88, 12, 0.12)',
      dockShadow: '0 16px 30px rgba(194, 65, 12, 0.1)',
      dockActiveBg: 'rgba(249, 115, 22, 0.14)',
      dockActiveText: '#c2410c',
      text: '#431407',
      subtleText: '#9a5b32',
      toolbarBg: 'rgba(255, 250, 244, 0.9)',
      toolbarBorder: 'rgba(234, 88, 12, 0.12)',
      toolbarBtnHover: 'rgba(249, 115, 22, 0.1)',
      nodeBg: '#fffdf9',
      nodeBorder: '#fdba74',
      nodeShadow: '0 12px 26px rgba(194, 65, 12, 0.1)',
      accent: '#ea580c',
      accentRing: 'rgba(234, 88, 12, 0.18)',
      connector: '#ea580c',
      connectorPreview: 'rgba(234, 88, 12, 0.52)',
      overlay: 'rgba(67, 20, 7, 0.18)',
      templatePreviewBg: 'rgba(249, 115, 22, 0.1)',
      templateEdgeStroke: 'rgba(234, 88, 12, 0.82)',
      templateNodeFill: 'rgba(255, 252, 247, 0.94)',
      templateNodeStroke: 'rgba(194, 65, 12, 0.72)',
      iconStroke: '#7c2d12',
      nodeFill: '#fffaf0',
      nodeStroke: '#c2410c',
      nodeTextColor: '#7c2d12',
      edgeStroke: '#ea580c',
      edgeLabelColor: '#c2410c'
    },
    dark: {
      canvasBg: '#2b160c',
      gridColor: 'rgba(251, 146, 60, 0.12)',
      floatingBg: 'rgba(44, 24, 15, 0.94)',
      floatingBorder: 'rgba(251, 146, 60, 0.18)',
      floatingShadow: '0 20px 38px rgba(0, 0, 0, 0.34)',
      dockBg: 'rgba(39, 20, 12, 0.95)',
      dockBorder: 'rgba(251, 146, 60, 0.16)',
      dockShadow: '0 18px 34px rgba(0, 0, 0, 0.32)',
      dockActiveBg: 'rgba(251, 146, 60, 0.18)',
      dockActiveText: '#fed7aa',
      text: '#ffedd5',
      subtleText: '#fdba74',
      toolbarBg: 'rgba(39, 20, 12, 0.9)',
      toolbarBorder: 'rgba(251, 146, 60, 0.16)',
      toolbarBtnHover: 'rgba(251, 146, 60, 0.12)',
      nodeBg: '#3a2013',
      nodeBorder: '#c2410c',
      nodeShadow: '0 16px 30px rgba(0, 0, 0, 0.34)',
      accent: '#fb923c',
      accentRing: 'rgba(251, 146, 60, 0.24)',
      connector: '#fb923c',
      connectorPreview: 'rgba(251, 146, 60, 0.56)',
      overlay: 'rgba(0, 0, 0, 0.42)',
      templatePreviewBg: 'rgba(251, 146, 60, 0.1)',
      templateEdgeStroke: 'rgba(251, 146, 60, 0.86)',
      templateNodeFill: 'rgba(58, 32, 19, 0.94)',
      templateNodeStroke: 'rgba(254, 215, 170, 0.68)',
      iconStroke: '#ffedd5',
      nodeFill: '#3a2013',
      nodeStroke: '#fb923c',
      nodeTextColor: '#fff7ed',
      edgeStroke: '#fb923c',
      edgeLabelColor: '#fed7aa'
    }
  },
  serviceMint: {
    labelKey: 'flowchart.themeServiceMint',
    light: {
      canvasBg: '#ecfdf5',
      gridColor: 'rgba(16, 185, 129, 0.08)',
      floatingBg: 'rgba(248, 255, 252, 0.92)',
      floatingBorder: 'rgba(16, 185, 129, 0.14)',
      floatingShadow: '0 18px 32px rgba(5, 150, 105, 0.12)',
      dockBg: 'rgba(248, 255, 252, 0.95)',
      dockBorder: 'rgba(16, 185, 129, 0.12)',
      dockShadow: '0 16px 28px rgba(5, 150, 105, 0.1)',
      dockActiveBg: 'rgba(16, 185, 129, 0.12)',
      dockActiveText: '#047857',
      text: '#07281f',
      subtleText: '#4b7768',
      toolbarBg: 'rgba(248, 255, 252, 0.9)',
      toolbarBorder: 'rgba(16, 185, 129, 0.12)',
      toolbarBtnHover: 'rgba(16, 185, 129, 0.1)',
      nodeBg: '#ffffff',
      nodeBorder: '#86efac',
      nodeShadow: '0 12px 24px rgba(5, 150, 105, 0.08)',
      accent: '#10b981',
      accentRing: 'rgba(16, 185, 129, 0.18)',
      connector: '#10b981',
      connectorPreview: 'rgba(16, 185, 129, 0.5)',
      overlay: 'rgba(6, 78, 59, 0.16)',
      templatePreviewBg: 'rgba(16, 185, 129, 0.1)',
      templateEdgeStroke: 'rgba(5, 150, 105, 0.8)',
      templateNodeFill: 'rgba(255, 255, 255, 0.94)',
      templateNodeStroke: 'rgba(5, 150, 105, 0.72)',
      iconStroke: '#065f46',
      nodeFill: '#f0fdf4',
      nodeStroke: '#059669',
      nodeTextColor: '#065f46',
      edgeStroke: '#10b981',
      edgeLabelColor: '#047857'
    },
    dark: {
      canvasBg: '#04251c',
      gridColor: 'rgba(52, 211, 153, 0.12)',
      floatingBg: 'rgba(6, 36, 28, 0.94)',
      floatingBorder: 'rgba(52, 211, 153, 0.18)',
      floatingShadow: '0 20px 38px rgba(0, 0, 0, 0.34)',
      dockBg: 'rgba(4, 31, 24, 0.95)',
      dockBorder: 'rgba(52, 211, 153, 0.16)',
      dockShadow: '0 18px 34px rgba(0, 0, 0, 0.32)',
      dockActiveBg: 'rgba(52, 211, 153, 0.18)',
      dockActiveText: '#a7f3d0',
      text: '#d1fae5',
      subtleText: '#6ee7b7',
      toolbarBg: 'rgba(4, 31, 24, 0.9)',
      toolbarBorder: 'rgba(52, 211, 153, 0.16)',
      toolbarBtnHover: 'rgba(52, 211, 153, 0.12)',
      nodeBg: '#073428',
      nodeBorder: '#0f766e',
      nodeShadow: '0 16px 30px rgba(0, 0, 0, 0.34)',
      accent: '#34d399',
      accentRing: 'rgba(52, 211, 153, 0.24)',
      connector: '#34d399',
      connectorPreview: 'rgba(52, 211, 153, 0.58)',
      overlay: 'rgba(0, 0, 0, 0.42)',
      templatePreviewBg: 'rgba(52, 211, 153, 0.1)',
      templateEdgeStroke: 'rgba(52, 211, 153, 0.86)',
      templateNodeFill: 'rgba(7, 52, 40, 0.94)',
      templateNodeStroke: 'rgba(167, 243, 208, 0.68)',
      iconStroke: '#d1fae5',
      nodeFill: '#073428',
      nodeStroke: '#34d399',
      nodeTextColor: '#ecfdf5',
      edgeStroke: '#34d399',
      edgeLabelColor: '#a7f3d0'
    }
  },
  incidentDark: {
    labelKey: 'flowchart.themeIncidentDark',
    light: {
      canvasBg: '#15171f',
      gridColor: 'rgba(248, 113, 113, 0.1)',
      floatingBg: 'rgba(28, 31, 40, 0.94)',
      floatingBorder: 'rgba(248, 113, 113, 0.14)',
      floatingShadow: '0 22px 40px rgba(0, 0, 0, 0.42)',
      dockBg: 'rgba(24, 27, 36, 0.95)',
      dockBorder: 'rgba(248, 113, 113, 0.14)',
      dockShadow: '0 18px 34px rgba(0, 0, 0, 0.4)',
      dockActiveBg: 'rgba(248, 113, 113, 0.16)',
      dockActiveText: '#fecaca',
      text: '#f8fafc',
      subtleText: '#94a3b8',
      toolbarBg: 'rgba(24, 27, 36, 0.92)',
      toolbarBorder: 'rgba(248, 113, 113, 0.14)',
      toolbarBtnHover: 'rgba(248, 113, 113, 0.12)',
      nodeBg: '#1f2432',
      nodeBorder: '#ef4444',
      nodeShadow: '0 16px 30px rgba(0, 0, 0, 0.36)',
      accent: '#f87171',
      accentRing: 'rgba(248, 113, 113, 0.26)',
      connector: '#f87171',
      connectorPreview: 'rgba(248, 113, 113, 0.56)',
      overlay: 'rgba(2, 6, 23, 0.48)',
      templatePreviewBg: 'rgba(248, 113, 113, 0.1)',
      templateEdgeStroke: 'rgba(248, 113, 113, 0.86)',
      templateNodeFill: 'rgba(31, 36, 50, 0.94)',
      templateNodeStroke: 'rgba(254, 202, 202, 0.68)',
      iconStroke: '#fca5a5',
      nodeFill: '#1f2432',
      nodeStroke: '#f87171',
      nodeTextColor: '#f8fafc',
      edgeStroke: '#f87171',
      edgeLabelColor: '#fecaca'
    },
    dark: {
      canvasBg: '#0f1218',
      gridColor: 'rgba(248, 113, 113, 0.12)',
      floatingBg: 'rgba(20, 24, 31, 0.94)',
      floatingBorder: 'rgba(248, 113, 113, 0.16)',
      floatingShadow: '0 24px 42px rgba(0, 0, 0, 0.46)',
      dockBg: 'rgba(16, 20, 28, 0.95)',
      dockBorder: 'rgba(248, 113, 113, 0.16)',
      dockShadow: '0 18px 36px rgba(0, 0, 0, 0.42)',
      dockActiveBg: 'rgba(248, 113, 113, 0.18)',
      dockActiveText: '#fee2e2',
      text: '#f8fafc',
      subtleText: '#9aa5b8',
      toolbarBg: 'rgba(16, 20, 28, 0.92)',
      toolbarBorder: 'rgba(248, 113, 113, 0.16)',
      toolbarBtnHover: 'rgba(248, 113, 113, 0.12)',
      nodeBg: '#151a22',
      nodeBorder: '#ef4444',
      nodeShadow: '0 16px 32px rgba(0, 0, 0, 0.4)',
      accent: '#fb7185',
      accentRing: 'rgba(251, 113, 133, 0.24)',
      connector: '#fb7185',
      connectorPreview: 'rgba(251, 113, 133, 0.56)',
      overlay: 'rgba(2, 6, 23, 0.52)',
      templatePreviewBg: 'rgba(248, 113, 113, 0.1)',
      templateEdgeStroke: 'rgba(251, 113, 133, 0.88)',
      templateNodeFill: 'rgba(21, 26, 34, 0.94)',
      templateNodeStroke: 'rgba(254, 226, 226, 0.66)',
      iconStroke: '#fee2e2',
      nodeFill: '#151a22',
      nodeStroke: '#fb7185',
      nodeTextColor: '#fff1f2',
      edgeStroke: '#fb7185',
      edgeLabelColor: '#fecdd3'
    }
  },
  graphite: {
    labelKey: 'flowchart.themeGraphite',
    light: {
      canvasBg: '#f7f8f8',
      gridColor: 'rgba(15, 16, 17, 0.06)',
      floatingBg: 'rgba(255, 255, 255, 0.92)',
      floatingBorder: 'rgba(52, 52, 58, 0.16)',
      floatingShadow: 'rgba(0, 0, 0, 0.08) 0px 12px 30px',
      dockBg: 'rgba(255, 255, 255, 0.94)',
      dockBorder: 'rgba(52, 52, 58, 0.16)',
      dockShadow: 'rgba(0, 0, 0, 0.08) 0px 12px 28px',
      dockActiveBg: 'rgba(94, 106, 210, 0.12)',
      dockActiveText: '#5e6ad2',
      text: '#191a1b',
      subtleText: '#62666d',
      toolbarBg: 'rgba(255, 255, 255, 0.9)',
      toolbarBorder: 'rgba(52, 52, 58, 0.12)',
      toolbarBtnHover: 'rgba(25, 26, 27, 0.05)',
      nodeBg: '#ffffff',
      nodeBorder: '#d0d6e0',
      nodeShadow: 'rgba(0, 0, 0, 0.08) 0px 10px 24px',
      accent: '#5e6ad2',
      accentRing: 'rgba(113, 112, 255, 0.18)',
      connector: '#7170ff',
      connectorPreview: 'rgba(113, 112, 255, 0.48)',
      overlay: 'rgba(8, 9, 10, 0.18)',
      templatePreviewBg: 'rgba(25, 26, 27, 0.04)',
      templateEdgeStroke: 'rgba(25, 26, 27, 0.84)',
      templateNodeFill: 'rgba(255, 255, 255, 0.96)',
      templateNodeStroke: 'rgba(25, 26, 27, 0.72)',
      iconStroke: '#191a1b',
      nodeFill: '#ffffff',
      nodeStroke: '#23252a',
      nodeTextColor: '#191a1b',
      edgeStroke: '#23252a',
      edgeLabelColor: '#23252a'
    },
    dark: {
      canvasBg: '#08090a',
      gridColor: 'rgba(255, 255, 255, 0.05)',
      floatingBg: 'rgba(15, 16, 17, 0.94)',
      floatingBorder: 'rgba(255, 255, 255, 0.08)',
      floatingShadow: 'rgba(0, 0, 0, 0.32) 0px 18px 36px',
      dockBg: 'rgba(15, 16, 17, 0.95)',
      dockBorder: 'rgba(255, 255, 255, 0.08)',
      dockShadow: 'rgba(0, 0, 0, 0.32) 0px 18px 36px',
      dockActiveBg: 'rgba(94, 106, 210, 0.2)',
      dockActiveText: '#c8d0ff',
      text: '#f7f8f8',
      subtleText: '#8a8f98',
      toolbarBg: 'rgba(15, 16, 17, 0.92)',
      toolbarBorder: 'rgba(255, 255, 255, 0.08)',
      toolbarBtnHover: 'rgba(255, 255, 255, 0.05)',
      nodeBg: '#191a1b',
      nodeBorder: 'rgba(255, 255, 255, 0.08)',
      nodeShadow: 'rgba(0, 0, 0, 0.34) 0px 16px 32px',
      accent: '#5e6ad2',
      accentRing: 'rgba(113, 112, 255, 0.24)',
      connector: '#7170ff',
      connectorPreview: 'rgba(113, 112, 255, 0.56)',
      overlay: 'rgba(0, 0, 0, 0.48)',
      templatePreviewBg: 'rgba(255, 255, 255, 0.06)',
      templateEdgeStroke: 'rgba(247, 248, 248, 0.86)',
      templateNodeFill: 'rgba(25, 26, 27, 0.96)',
      templateNodeStroke: 'rgba(247, 248, 248, 0.7)',
      iconStroke: '#f7f8f8',
      nodeFill: '#191a1b',
      nodeStroke: '#d0d6e0',
      nodeTextColor: '#f7f8f8',
      edgeStroke: '#d0d6e0',
      edgeLabelColor: '#f7f8f8'
    }
  },
  clayWarm: {
    labelKey: 'flowchart.themeClayWarm',
    light: {
      canvasBg: '#faf9f7',
      gridColor: 'rgba(218, 212, 200, 0.82)',
      floatingBg: 'rgba(255, 255, 255, 0.92)',
      floatingBorder: '#dad4c8',
      floatingShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 1px, rgba(0, 0, 0, 0.04) 0px -1px 1px inset, rgba(0, 0, 0, 0.05) 0px -0.5px 1px',
      dockBg: 'rgba(250, 249, 247, 0.96)',
      dockBorder: '#dad4c8',
      dockShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 1px, rgba(0, 0, 0, 0.04) 0px -1px 1px inset, rgba(0, 0, 0, 0.05) 0px -0.5px 1px',
      dockActiveBg: 'rgba(248, 189, 65, 0.18)',
      dockActiveText: '#9d6a09',
      text: '#000000',
      subtleText: '#9f9b93',
      toolbarBg: 'rgba(250, 249, 247, 0.92)',
      toolbarBorder: '#dad4c8',
      toolbarBtnHover: 'rgba(251, 189, 65, 0.12)',
      nodeBg: '#ffffff',
      nodeBorder: '#dad4c8',
      nodeShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 1px, rgba(0, 0, 0, 0.04) 0px -1px 1px inset, rgba(0, 0, 0, 0.05) 0px -0.5px 1px',
      accent: '#fbbd41',
      accentRing: 'rgba(251, 189, 65, 0.24)',
      connector: '#078a52',
      connectorPreview: 'rgba(7, 138, 82, 0.44)',
      overlay: 'rgba(51, 51, 51, 0.16)',
      templatePreviewBg: 'rgba(218, 212, 200, 0.22)',
      templateEdgeStroke: 'rgba(0, 0, 0, 0.82)',
      templateNodeFill: 'rgba(255, 255, 255, 0.96)',
      templateNodeStroke: 'rgba(0, 0, 0, 0.72)',
      iconStroke: '#000000',
      nodeFill: '#ffffff',
      nodeStroke: '#000000',
      nodeTextColor: '#000000',
      edgeStroke: '#000000',
      edgeLabelColor: '#000000'
    },
    dark: {
      canvasBg: '#32037d',
      gridColor: 'rgba(193, 176, 255, 0.14)',
      floatingBg: 'rgba(50, 3, 125, 0.92)',
      floatingBorder: 'rgba(193, 176, 255, 0.22)',
      floatingShadow: 'rgba(0, 0, 0, 0.28) 0px 16px 34px',
      dockBg: 'rgba(50, 3, 125, 0.94)',
      dockBorder: 'rgba(193, 176, 255, 0.22)',
      dockShadow: 'rgba(0, 0, 0, 0.28) 0px 16px 34px',
      dockActiveBg: 'rgba(248, 189, 65, 0.18)',
      dockActiveText: '#f8cc65',
      text: '#ffffff',
      subtleText: '#c1b0ff',
      toolbarBg: 'rgba(50, 3, 125, 0.9)',
      toolbarBorder: 'rgba(193, 176, 255, 0.18)',
      toolbarBtnHover: 'rgba(255, 255, 255, 0.08)',
      nodeBg: 'rgba(255, 255, 255, 0.08)',
      nodeBorder: 'rgba(255, 255, 255, 0.18)',
      nodeShadow: 'rgba(0, 0, 0, 0.28) 0px 16px 30px',
      accent: '#fbbd41',
      accentRing: 'rgba(251, 189, 65, 0.22)',
      connector: '#84e7a5',
      connectorPreview: 'rgba(132, 231, 165, 0.46)',
      overlay: 'rgba(0, 0, 0, 0.42)',
      templatePreviewBg: 'rgba(255, 255, 255, 0.08)',
      templateEdgeStroke: 'rgba(255, 255, 255, 0.88)',
      templateNodeFill: 'rgba(255, 255, 255, 0.08)',
      templateNodeStroke: 'rgba(255, 255, 255, 0.72)',
      iconStroke: '#ffffff',
      nodeFill: 'rgba(255, 255, 255, 0.08)',
      nodeStroke: '#ffffff',
      nodeTextColor: '#ffffff',
      edgeStroke: '#ffffff',
      edgeLabelColor: '#ffffff'
    }
  }
}

export const FLOWCHART_THEME_PRESETS = Object.entries(FLOWCHART_THEME_PRESET_MAP).map(
  ([id, definition]) => ({
    id,
    labelKey: definition.labelKey
  })
)

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
  }),
  crossFunctionalApproval: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-request', type: 'start', text: '提交需求', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-product', type: 'process', text: '产品评估', x: 120, y: 240 }),
      createFlowchartNode({ id: 'node-design', type: 'process', text: '设计确认', x: 400, y: 240 }),
      createFlowchartNode({ id: 'node-tech', type: 'process', text: '技术评审', x: 680, y: 240 }),
      createFlowchartNode({
        id: 'node-approve',
        type: 'decision',
        text: '跨部门通过？',
        x: 400,
        y: 392,
        width: 188,
        height: 92
      }),
      createFlowchartNode({ id: 'node-rework', type: 'process', text: '补充材料', x: 120, y: 560 }),
      createFlowchartNode({ id: 'node-schedule', type: 'process', text: '排期执行', x: 680, y: 560 }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '进入交付', x: 680, y: 692 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-request-product', source: 'node-request', target: 'node-product' }),
      createFlowchartEdge({ id: 'edge-product-design', source: 'node-product', target: 'node-design' }),
      createFlowchartEdge({ id: 'edge-design-tech', source: 'node-design', target: 'node-tech' }),
      createFlowchartEdge({
        id: 'edge-tech-approve',
        source: 'node-tech',
        target: 'node-approve'
      }),
      createFlowchartEdge({ id: 'edge-approve-rework', source: 'node-approve', target: 'node-rework', label: '否' }),
      createFlowchartEdge({ id: 'edge-approve-schedule', source: 'node-approve', target: 'node-schedule', label: '是' }),
      createFlowchartEdge({
        id: 'edge-rework-product',
        source: 'node-rework',
        target: 'node-product',
        label: '补齐后重审',
        style: { dashed: true }
      }),
      createFlowchartEdge({ id: 'edge-schedule-end', source: 'node-schedule', target: 'node-end' })
    ]
  }),
  supportEscalation: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-ticket', type: 'start', text: '收到故障工单', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-l1', type: 'process', text: 'L1 初步排查', x: 120, y: 248 }),
      createFlowchartNode({
        id: 'node-severity',
        type: 'decision',
        text: '影响范围升级？',
        x: 120,
        y: 388,
        width: 188,
        height: 92
      }),
      createFlowchartNode({ id: 'node-l2', type: 'process', text: 'L2 深入诊断', x: 420, y: 388 }),
      createFlowchartNode({ id: 'node-comm', type: 'input', text: '同步客户状态', x: 720, y: 388 }),
      createFlowchartNode({ id: 'node-warroom', type: 'process', text: '启动应急响应', x: 420, y: 560 }),
      createFlowchartNode({ id: 'node-recover', type: 'process', text: '恢复服务', x: 720, y: 560 }),
      createFlowchartNode({ id: 'node-postmortem', type: 'end', text: '复盘归档', x: 720, y: 708 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-ticket-l1', source: 'node-ticket', target: 'node-l1' }),
      createFlowchartEdge({ id: 'edge-l1-severity', source: 'node-l1', target: 'node-severity' }),
      createFlowchartEdge({ id: 'edge-severity-l2', source: 'node-severity', target: 'node-l2', label: '是' }),
      createFlowchartEdge({
        id: 'edge-l2-comm',
        source: 'node-l2',
        target: 'node-comm'
      }),
      createFlowchartEdge({ id: 'edge-comm-warroom', source: 'node-comm', target: 'node-warroom' }),
      createFlowchartEdge({ id: 'edge-warroom-recover', source: 'node-warroom', target: 'node-recover' }),
      createFlowchartEdge({ id: 'edge-recover-postmortem', source: 'node-recover', target: 'node-postmortem' }),
      createFlowchartEdge({
        id: 'edge-severity-postmortem',
        source: 'node-severity',
        target: 'node-postmortem',
        label: '否',
        style: { dashed: true }
      })
    ]
  }),
  contentReview: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-brief', type: 'start', text: '提交稿件', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-edit', type: 'process', text: '编辑初审', x: 120, y: 236 }),
      createFlowchartNode({ id: 'node-brand', type: 'process', text: '品牌校对', x: 380, y: 236 }),
      createFlowchartNode({
        id: 'node-legal',
        type: 'decision',
        text: '是否涉及合规？',
        x: 640,
        y: 236,
        width: 188,
        height: 92
      }),
      createFlowchartNode({ id: 'node-compliance', type: 'process', text: '法务复审', x: 640, y: 404 }),
      createFlowchartNode({ id: 'node-revise', type: 'process', text: '修改回退', x: 120, y: 520 }),
      createFlowchartNode({ id: 'node-publish', type: 'end', text: '排期发布', x: 640, y: 568 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-brief-edit', source: 'node-brief', target: 'node-edit' }),
      createFlowchartEdge({ id: 'edge-edit-brand', source: 'node-edit', target: 'node-brand' }),
      createFlowchartEdge({ id: 'edge-brand-legal', source: 'node-brand', target: 'node-legal' }),
      createFlowchartEdge({ id: 'edge-legal-compliance', source: 'node-legal', target: 'node-compliance', label: '是' }),
      createFlowchartEdge({ id: 'edge-legal-publish', source: 'node-legal', target: 'node-publish', label: '否' }),
      createFlowchartEdge({ id: 'edge-compliance-publish', source: 'node-compliance', target: 'node-publish' }),
      createFlowchartEdge({
        id: 'edge-compliance-revise',
        source: 'node-compliance',
        target: 'node-revise',
        label: '需修改',
        style: { dashed: true }
      }),
      createFlowchartEdge({ id: 'edge-revise-edit', source: 'node-revise', target: 'node-edit' })
    ]
  }),
  procurement: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-apply', type: 'start', text: '提出采购申请', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-budget', type: 'process', text: '预算核验', x: 120, y: 236 }),
      createFlowchartNode({
        id: 'node-vendor',
        type: 'decision',
        text: '已有合格供应商？',
        x: 120,
        y: 376,
        width: 196,
        height: 92
      }),
      createFlowchartNode({ id: 'node-rfq', type: 'process', text: '询价比选', x: 420, y: 376 }),
      createFlowchartNode({ id: 'node-contract', type: 'process', text: '合同审批', x: 700, y: 376 }),
      createFlowchartNode({ id: 'node-purchase', type: 'process', text: '下单采购', x: 700, y: 544 }),
      createFlowchartNode({ id: 'node-receive', type: 'end', text: '到货验收', x: 700, y: 688 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-apply-budget', source: 'node-apply', target: 'node-budget' }),
      createFlowchartEdge({ id: 'edge-budget-vendor', source: 'node-budget', target: 'node-vendor' }),
      createFlowchartEdge({ id: 'edge-vendor-rfq', source: 'node-vendor', target: 'node-rfq', label: '否' }),
      createFlowchartEdge({
        id: 'edge-vendor-contract',
        source: 'node-vendor',
        target: 'node-contract',
        label: '是'
      }),
      createFlowchartEdge({ id: 'edge-rfq-contract', source: 'node-rfq', target: 'node-contract' }),
      createFlowchartEdge({ id: 'edge-contract-purchase', source: 'node-contract', target: 'node-purchase' }),
      createFlowchartEdge({ id: 'edge-purchase-receive', source: 'node-purchase', target: 'node-receive' })
    ]
  }),
  salesPipeline: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-lead', type: 'start', text: '线索进入', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-qualify', type: 'process', text: '线索筛选', x: 120, y: 248 }),
      createFlowchartNode({ id: 'node-demo', type: 'process', text: '方案演示', x: 420, y: 248 }),
      createFlowchartNode({
        id: 'node-intent',
        type: 'decision',
        text: '客户有明确意向？',
        x: 720,
        y: 248,
        width: 196,
        height: 92
      }),
      createFlowchartNode({ id: 'node-proposal', type: 'process', text: '报价提案', x: 720, y: 420 }),
      createFlowchartNode({ id: 'node-follow', type: 'process', text: '继续跟进', x: 420, y: 560 }),
      createFlowchartNode({ id: 'node-contract', type: 'process', text: '合同签署', x: 980, y: 420 }),
      createFlowchartNode({ id: 'node-close', type: 'end', text: '成交回款', x: 980, y: 580 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-lead-qualify', source: 'node-lead', target: 'node-qualify' }),
      createFlowchartEdge({ id: 'edge-qualify-demo', source: 'node-qualify', target: 'node-demo' }),
      createFlowchartEdge({ id: 'edge-demo-intent', source: 'node-demo', target: 'node-intent' }),
      createFlowchartEdge({ id: 'edge-intent-proposal', source: 'node-intent', target: 'node-proposal', label: '是' }),
      createFlowchartEdge({
        id: 'edge-intent-follow',
        source: 'node-intent',
        target: 'node-follow',
        label: '否',
        style: { dashed: true }
      }),
      createFlowchartEdge({ id: 'edge-follow-demo', source: 'node-follow', target: 'node-demo', label: '复访' }),
      createFlowchartEdge({ id: 'edge-proposal-contract', source: 'node-proposal', target: 'node-contract' }),
      createFlowchartEdge({ id: 'edge-contract-close', source: 'node-contract', target: 'node-close' })
    ]
  }),
  customerOnboardingSwimlane: title => ({
    title,
    lanes: [
      createFlowchartLane({ id: 'lane-sales', label: '销售', x: 80, y: 96, width: 1020, height: 150 }),
      createFlowchartLane({ id: 'lane-success', label: '客户成功', x: 80, y: 266, width: 1020, height: 150 }),
      createFlowchartLane({ id: 'lane-ops', label: '交付/运维', x: 80, y: 436, width: 1020, height: 150 })
    ],
    nodes: [
      createFlowchartNode({ id: 'node-contract', type: 'start', text: '合同签署', x: 150, y: 134 }),
      createFlowchartNode({ id: 'node-kickoff', type: 'process', text: '启动会', x: 390, y: 134 }),
      createFlowchartNode({ id: 'node-success-plan', type: 'process', text: '成功计划', x: 390, y: 304 }),
      createFlowchartNode({ id: 'node-data', type: 'input', text: '客户资料交接', x: 150, y: 304 }),
      createFlowchartNode({ id: 'node-config', type: 'process', text: '环境配置', x: 630, y: 474 }),
      createFlowchartNode({ id: 'node-verify', type: 'decision', text: '验收通过？', x: 870, y: 454, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-training', type: 'process', text: '培训上线', x: 630, y: 304 }),
      createFlowchartNode({ id: 'node-live', type: 'end', text: '进入运营', x: 870, y: 304 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-contract-kickoff', source: 'node-contract', target: 'node-kickoff' }),
      createFlowchartEdge({ id: 'edge-kickoff-data', source: 'node-kickoff', target: 'node-data' }),
      createFlowchartEdge({ id: 'edge-data-plan', source: 'node-data', target: 'node-success-plan' }),
      createFlowchartEdge({ id: 'edge-plan-config', source: 'node-success-plan', target: 'node-config', label: '交付资料' }),
      createFlowchartEdge({ id: 'edge-config-verify', source: 'node-config', target: 'node-verify' }),
      createFlowchartEdge({ id: 'edge-verify-training', source: 'node-verify', target: 'node-training', label: '是' }),
      createFlowchartEdge({ id: 'edge-training-live', source: 'node-training', target: 'node-live' }),
      createFlowchartEdge({
        id: 'edge-verify-config',
        source: 'node-verify',
        target: 'node-config',
        label: '否',
        style: { dashed: true }
      })
    ]
  }),
  productLaunchSwimlane: title => ({
    title,
    lanes: [
      createFlowchartLane({ id: 'lane-product', label: '产品', x: 80, y: 96, width: 1180, height: 140 }),
      createFlowchartLane({ id: 'lane-rd', label: '研发', x: 80, y: 256, width: 1180, height: 140 }),
      createFlowchartLane({ id: 'lane-market', label: '市场/运营', x: 80, y: 416, width: 1180, height: 140 }),
      createFlowchartLane({ id: 'lane-support', label: '客服支持', x: 80, y: 576, width: 1180, height: 140 })
    ],
    nodes: [
      createFlowchartNode({ id: 'node-prd', type: 'start', text: 'PRD 定稿', x: 150, y: 130 }),
      createFlowchartNode({ id: 'node-scope', type: 'decision', text: '范围冻结？', x: 390, y: 116, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-dev', type: 'process', text: '开发联调', x: 390, y: 290 }),
      createFlowchartNode({ id: 'node-test', type: 'process', text: '测试验收', x: 630, y: 290 }),
      createFlowchartNode({ id: 'node-material', type: 'input', text: '物料准备', x: 630, y: 450 }),
      createFlowchartNode({ id: 'node-training', type: 'process', text: '客服培训', x: 870, y: 610 }),
      createFlowchartNode({ id: 'node-release', type: 'process', text: '灰度发布', x: 870, y: 290 }),
      createFlowchartNode({ id: 'node-launch', type: 'end', text: '正式上线', x: 1110, y: 450 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-prd-scope', source: 'node-prd', target: 'node-scope' }),
      createFlowchartEdge({ id: 'edge-scope-dev', source: 'node-scope', target: 'node-dev', label: '是' }),
      createFlowchartEdge({
        id: 'edge-scope-prd',
        source: 'node-scope',
        target: 'node-prd',
        label: '否',
        style: { dashed: true }
      }),
      createFlowchartEdge({ id: 'edge-dev-test', source: 'node-dev', target: 'node-test' }),
      createFlowchartEdge({ id: 'edge-test-release', source: 'node-test', target: 'node-release' }),
      createFlowchartEdge({ id: 'edge-test-material', source: 'node-test', target: 'node-material' }),
      createFlowchartEdge({ id: 'edge-material-training', source: 'node-material', target: 'node-training' }),
      createFlowchartEdge({ id: 'edge-training-launch', source: 'node-training', target: 'node-launch', label: '支持就绪' }),
      createFlowchartEdge({ id: 'edge-release-launch', source: 'node-release', target: 'node-launch' })
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
  { id: 'projectPlan', labelKey: 'flowchart.templateProjectPlan' },
  { id: 'crossFunctionalApproval', labelKey: 'flowchart.templateCrossFunctionalApproval' },
  { id: 'supportEscalation', labelKey: 'flowchart.templateSupportEscalation' },
  { id: 'contentReview', labelKey: 'flowchart.templateContentReview' },
  { id: 'procurement', labelKey: 'flowchart.templateProcurement' },
  { id: 'salesPipeline', labelKey: 'flowchart.templateSalesPipeline' },
  { id: 'customerOnboardingSwimlane', labelKey: 'flowchart.templateCustomerOnboardingSwimlane' },
  { id: 'productLaunchSwimlane', labelKey: 'flowchart.templateProductLaunchSwimlane' }
]

export const getFlowchartTemplateMeta = templateId => {
  return (
    FLOWCHART_TEMPLATE_PRESETS.find(item => item.id === templateId) ||
    FLOWCHART_TEMPLATE_PRESETS[0]
  )
}

export const getFlowchartThemeDefinition = (themeId, { isDark = false } = {}) => {
  const fallbackTheme = FLOWCHART_THEME_PRESET_MAP.blueprint
  const normalizedThemeId = String(themeId || '').trim()
  const resolvedThemeId =
    Object.prototype.hasOwnProperty.call(FLOWCHART_THEME_PRESET_MAP, normalizedThemeId)
      ? normalizedThemeId
      : 'blueprint'
  const themeDefinition = FLOWCHART_THEME_PRESET_MAP[resolvedThemeId] || fallbackTheme
  const palette = themeDefinition[isDark ? 'dark' : 'light'] || themeDefinition.light
  return {
    id: resolvedThemeId,
    labelKey: themeDefinition.labelKey,
    ...palette
  }
}

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

function createFlowchartLane({
  id,
  label = '',
  x = 0,
  y = 0,
  width = 960,
  height = 140,
  accent = ''
} = {}) {
  return {
    id: String(id || ''),
    label: String(label || '').trim() || '泳道',
    x: Number.isFinite(Number(x)) ? Number(x) : 0,
    y: Number.isFinite(Number(y)) ? Number(y) : 0,
    width: Number.isFinite(Number(width)) ? Number(width) : 960,
    height: Number.isFinite(Number(height)) ? Number(height) : 140,
    accent: String(accent || '').trim()
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

const normalizeTemplateLayout = templateData => {
  return {
    ...templateData,
    nodes: Array.isArray(templateData?.nodes)
      ? templateData.nodes.map(node => ({
          ...node,
          style: {
            ...(node.style || {})
          }
        }))
      : [],
    edges: Array.isArray(templateData?.edges)
      ? templateData.edges.map(edge => ({
          ...edge,
          style: {
            ...(edge.style || {}),
            pathType: 'straight'
          }
        }))
      : [],
    lanes: Array.isArray(templateData?.lanes)
      ? templateData.lanes.map(lane => ({
          ...lane
        }))
      : []
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

const resolveFlowchartThemeFromConfig = (
  flowchartConfig,
  _templateId = 'blank',
  { isDark = false } = {}
) => {
  const themeId = flowchartConfig?.themeId || DEFAULT_FLOWCHART_CONFIG.themeId
  return getFlowchartThemeDefinition(themeId, {
    isDark
  })
}

export const getFlowchartNodeVisualStyle = (
  node,
  { isDark = false, theme = null } = {}
) => {
  const resolvedTheme =
    theme || getFlowchartThemeDefinition('blueprint', { isDark })
  return {
    fill: getStyleColor(node?.style?.fill, resolvedTheme.nodeFill),
    stroke: getStyleColor(node?.style?.stroke, resolvedTheme.nodeStroke),
    textColor: getStyleColor(node?.style?.textColor, resolvedTheme.nodeTextColor)
  }
}

export const getFlowchartEdgeVisualStyle = (
  edge,
  { theme = null, strictAlignment = false } = {}
) => {
  const resolvedTheme = theme || getFlowchartThemeDefinition('blueprint')
  const pathType = String(edge?.style?.pathType || '').trim()
  return {
    stroke: getStyleColor(edge?.style?.stroke, resolvedTheme.edgeStroke),
    labelColor: getStyleColor(edge?.style?.labelColor, resolvedTheme.edgeLabelColor),
    dashed: !!edge?.style?.dashed,
    pathType: strictAlignment
      ? 'orthogonal'
      : ['straight', 'curved', 'orthogonal'].includes(pathType)
        ? pathType
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

const getCubicBezierPoint = (start, control1, control2, end, progress) => {
  const t = Math.max(0, Math.min(1, Number(progress || 0)))
  const inverse = 1 - t
  return (
    inverse ** 3 * start +
    3 * inverse ** 2 * t * control1 +
    3 * inverse * t ** 2 * control2 +
    t ** 3 * end
  )
}

const createFlowchartEdgeLabelPlacement = ({
  startPoint,
  endPoint,
  preferredSide = 'right'
} = {}) => {
  const horizontal = Math.abs(endPoint.x - startPoint.x) >= Math.abs(endPoint.y - startPoint.y)
  const offset = 18
  if (horizontal) {
    return {
      labelX: (startPoint.x + endPoint.x) / 2,
      labelY: (startPoint.y + endPoint.y) / 2,
      labelPlacement: 'inline'
    }
  }
  const sideOffset = preferredSide === 'left' ? -offset : offset
  return {
    labelX: (startPoint.x + endPoint.x) / 2 + sideOffset,
    labelY: (startPoint.y + endPoint.y) / 2,
    labelPlacement: preferredSide === 'left' ? 'left' : 'right'
  }
}

export const getFlowchartEdgeLayout = (edge, sourceNode, targetNode, options = {}) => {
  const style = getFlowchartEdgeVisualStyle(edge, options)
  const { sourceDirection, targetDirection } = resolveFlowchartEdgeDirections(
    sourceNode,
    targetNode
  )
  const sourcePoint = getFlowchartNodeConnectionPoint(sourceNode, sourceDirection)
  const targetPoint = getFlowchartNodeConnectionPoint(targetNode, targetDirection)
  if (style.pathType === 'straight') {
    const labelPlacement = createFlowchartEdgeLabelPlacement({
      startPoint: sourcePoint,
      endPoint: targetPoint,
      preferredSide: targetPoint.x < sourcePoint.x ? 'left' : 'right'
    })
    return {
      path: `M ${sourcePoint.x} ${sourcePoint.y} L ${targetPoint.x} ${targetPoint.y}`,
      ...labelPlacement,
      sourcePoint,
      targetPoint,
      style
    }
  }
  if (style.pathType === 'curved') {
    const horizontalCurve =
      sourceDirection === 'left' || sourceDirection === 'right'
    const distance = horizontalCurve
      ? Math.abs(targetPoint.x - sourcePoint.x)
      : Math.abs(targetPoint.y - sourcePoint.y)
    const strength = Math.max(52, Math.min(168, distance * 0.42))
    const sourceControl = horizontalCurve
      ? {
          x:
            sourcePoint.x +
            (sourceDirection === 'left' ? -strength : strength),
          y: sourcePoint.y
        }
      : {
          x: sourcePoint.x,
          y:
            sourcePoint.y +
            (sourceDirection === 'top' ? -strength : strength)
        }
    const targetControl = horizontalCurve
      ? {
          x:
            targetPoint.x +
            (targetDirection === 'left' ? -strength : strength),
          y: targetPoint.y
        }
      : {
          x: targetPoint.x,
          y:
            targetPoint.y +
            (targetDirection === 'top' ? -strength : strength)
        }
    const curveMidPoint = {
      x: getCubicBezierPoint(
        sourcePoint.x,
        sourceControl.x,
        targetControl.x,
        targetPoint.x,
        0.5
      ),
      y: getCubicBezierPoint(
        sourcePoint.y,
        sourceControl.y,
        targetControl.y,
        targetPoint.y,
        0.5
      )
    }
    const labelPlacement = createFlowchartEdgeLabelPlacement({
      startPoint: sourcePoint,
      endPoint: targetPoint,
      preferredSide: targetPoint.x < sourcePoint.x ? 'left' : 'right'
    })
    return {
      path: `M ${sourcePoint.x} ${sourcePoint.y} C ${sourceControl.x} ${sourceControl.y} ${targetControl.x} ${targetControl.y} ${targetPoint.x} ${targetPoint.y}`,
      ...labelPlacement,
      labelX: labelPlacement.labelPlacement === 'inline'
        ? curveMidPoint.x
        : curveMidPoint.x + (labelPlacement.labelPlacement === 'left' ? -18 : 18),
      labelY: curveMidPoint.y,
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
  const labelSegmentStart = useHorizontalMid
    ? sourcePoint
    : sourcePoint
  const labelSegmentEnd = useHorizontalMid
    ? {
        x: midX,
        y: sourcePoint.y
      }
    : {
        x: sourcePoint.x,
        y: midY
      }
  const labelPlacement = createFlowchartEdgeLabelPlacement({
    startPoint: labelSegmentStart,
    endPoint: labelSegmentEnd,
    preferredSide: targetPoint.x < sourcePoint.x ? 'left' : 'right'
  })
  return {
    path,
    ...labelPlacement,
    sourcePoint,
    targetPoint,
    style
  }
}

export const getFlowchartLabelTextUnits = label => {
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

export const getFlowchartEdgeLabelBox = layout => {
  const height = 26
  const label =
    layout?.edge?.label !== undefined ? layout.edge.label : layout?.label
  const width = Math.max(
    56,
    Math.ceil(getFlowchartLabelTextUnits(label) * 7.6 + 24)
  )
  return {
    x: Number(layout?.labelX || 0) - width / 2,
    y: Number(layout?.labelY || 0) - height / 2,
    width,
    height
  }
}

const buildSvgNodeShapeMarkup = (node, { isDark = false, theme = null } = {}) => {
  const x = Number(node.x || 0)
  const y = Number(node.y || 0)
  const width = Number(node.width || 0)
  const height = Number(node.height || 0)
  const visualStyle = getFlowchartNodeVisualStyle(node, {
    isDark,
    theme
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

const buildSvgLaneMarkup = (lane, { theme = null } = {}) => {
  const x = Number(lane.x || 0)
  const y = Number(lane.y || 0)
  const width = Number(lane.width || 0)
  const height = Number(lane.height || 0)
  const accent = escapeXml(
    String(lane.accent || theme?.accent || '#2563eb').trim() || '#2563eb'
  )
  const labelX = x + 24
  const labelY = y + Math.min(34, Math.max(24, height / 2))
  return `<g class="flowchart-swimlane"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="${accent}" opacity="0.08" stroke="${accent}" stroke-width="1.5" stroke-dasharray="10 8"/><rect x="${x}" y="${y}" width="8" height="${height}" rx="4" fill="${accent}" opacity="0.56"/><text x="${labelX}" y="${labelY}" font-size="13" font-weight="700" fill="${accent}" text-anchor="start">${escapeXml(lane.label)}</text></g>`
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

const normalizeFlowchartLane = (lane, index) => {
  return createFlowchartLane({
    ...lane,
    id: String(lane?.id || '').trim() || createNodeId('lane', index)
  })
}

const normalizeFlowchartConfig = (config, _templateId = 'blank') => {
  const nextConfig =
    config && typeof config === 'object'
      ? {
          ...DEFAULT_FLOWCHART_CONFIG,
          ...config
        }
      : {
          ...DEFAULT_FLOWCHART_CONFIG
        }
  nextConfig.themeId =
    String(nextConfig.themeId || DEFAULT_FLOWCHART_CONFIG.themeId).trim() ||
    DEFAULT_FLOWCHART_CONFIG.themeId
  return nextConfig
}

const normalizeFlowchartData = input => {
  const templateId = String(input?.templateId || 'blank').trim() || 'blank'
  const baseTemplate =
    FLOWCHART_TEMPLATES[templateId] || FLOWCHART_TEMPLATES.blank
  const baseData = baseTemplate(
    String(input?.title || DEFAULT_FLOWCHART_TITLE).trim() || DEFAULT_FLOWCHART_TITLE
  )
  const nodes = Array.isArray(input?.nodes) && input.nodes.length > 0 ? input.nodes : baseData.nodes
  const lanes = Array.isArray(input?.lanes) ? input.lanes : baseData.lanes || []
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
    lanes: lanes.map((lane, index) => normalizeFlowchartLane(lane, index)),
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
  const templateData = normalizeTemplateLayout(
    templateFactory(String(title || DEFAULT_FLOWCHART_TITLE))
  )
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
  const resolvedTemplateId =
    flowchartData?.templateId || String(templateId || 'blank').trim() || 'blank'
  return {
    documentMode: FLOWCHART_DOCUMENT_MODE,
    flowchartData:
      flowchartData && typeof flowchartData === 'object'
        ? normalizeFlowchartData(flowchartData)
        : createDefaultFlowchartData(title, resolvedTemplateId),
    flowchartConfig: normalizeFlowchartConfig(flowchartConfig, resolvedTemplateId)
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
      lanes: [],
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
    lanes: payload.lanes,
    nodes: payload.nodes,
    edges: payload.edges
  })
  return {
    title: flowchartData.title,
    flowchartData,
    flowchartConfig: normalizeFlowchartConfig(
      payload.flowchartConfig,
      flowchartData.templateId
    )
  }
}

export const getFlowchartExportBounds = (
  flowchartData,
  { paddingX = 120, paddingY = 120 } = {}
) => {
  const nodes = Array.isArray(flowchartData?.nodes) ? flowchartData.nodes : []
  const lanes = Array.isArray(flowchartData?.lanes) ? flowchartData.lanes : []
  const items = [...lanes, ...nodes]
  if (!items.length) {
    return {
      x: 0,
      y: 0,
      width: 1200,
      height: 720
    }
  }
  const bounds = items.reduce(
    (result, item) => ({
      minX: Math.min(result.minX, Number(item.x || 0)),
      minY: Math.min(result.minY, Number(item.y || 0)),
      maxX: Math.max(
        result.maxX,
        Number(item.x || 0) + Number(item.width || 0)
      ),
      maxY: Math.max(
        result.maxY,
        Number(item.y || 0) + Number(item.height || 0)
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
    flowchartConfig = null,
    isDark = false,
    transparent = false,
    paddingX = 120,
    paddingY = 120
  } = {}
) => {
  const normalizedData = normalizeFlowchartData(flowchartData || {})
  const theme = resolveFlowchartThemeFromConfig(
    flowchartConfig,
    normalizedData.templateId,
    { isDark }
  )
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
        layout: getFlowchartEdgeLayout(edge, sourceNode, targetNode, {
          theme,
          strictAlignment: !!flowchartConfig?.strictAlignment
        })
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
      const label = edge.label
        ? `<text x="${layout.labelX}" y="${layout.labelY}" font-size="12" font-weight="700" fill="${escapeXml(layout.style.labelColor)}" stroke="${escapeXml(theme.canvasBg)}" stroke-width="4" paint-order="stroke" stroke-linejoin="round" text-anchor="middle" dominant-baseline="middle">${escapeXml(edge.label)}</text>`
        : ''
      return `<g><path d="${layout.path}" fill="none" stroke="${escapeXml(layout.style.stroke)}" stroke-width="2"${dash} marker-end="url(#${markerId})"/>${label}</g>`
    })
    .join('')
  const lanes = normalizedData.lanes
    .map(lane => buildSvgLaneMarkup(lane, { theme }))
    .join('')
  const nodes = normalizedData.nodes
    .map(node => {
      const visualStyle = getFlowchartNodeVisualStyle(node, {
        isDark,
        theme
      })
      return `<g>${buildSvgNodeShapeMarkup(node, {
        isDark,
        theme
      })}<text x="${
        Number(node.x || 0) + Number(node.width || 0) / 2
      }" y="${
        Number(node.y || 0) + Number(node.height || 0) / 2 + 5
      }" font-size="14" fill="${escapeXml(visualStyle.textColor)}" text-anchor="middle">${escapeXml(node.text)}</text></g>`
    })
    .join('')
  const background = transparent
    ? ''
    : `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${
        theme.canvasBg
      }"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"><defs>${markerDefs}</defs>${background}${lanes}${edges}${nodes}</svg>`
}

export const getFlowchartTemplateIds = () => Object.keys(FLOWCHART_TEMPLATES)
