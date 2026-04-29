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
  strictAlignment: false,
  backgroundStyle: 'grid'
}

const FLOWCHART_BACKGROUND_STYLES = ['none', 'dots', 'grid']

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
  { id: 'amber', stroke: '#d97706', dashed: true, dashPattern: 'dash', pathType: 'orthogonal' },
  { id: 'rose', stroke: '#e11d48', dashed: true, dashPattern: 'longDash', pathType: 'orthogonal' }
]

const FLOWCHART_EDGE_DASH_ARRAY_MAP = {
  solid: '',
  dash: '8 6',
  longDash: '14 8',
  dot: '2 6',
  dashDot: '10 6 2 6'
}

export const FLOWCHART_EDGE_DASH_PATTERNS = Object.keys(FLOWCHART_EDGE_DASH_ARRAY_MAP)

export const normalizeFlowchartEdgeDashPattern = (dashPattern, dashed = false) => {
  const normalizedPattern = String(dashPattern || '').trim()
  if (FLOWCHART_EDGE_DASH_PATTERNS.includes(normalizedPattern)) {
    return normalizedPattern
  }
  return dashed ? 'dash' : 'solid'
}

export const getFlowchartEdgeDashArray = (dashPattern, dashed = false) => {
  const normalizedPattern = normalizeFlowchartEdgeDashPattern(dashPattern, dashed)
  return FLOWCHART_EDGE_DASH_ARRAY_MAP[normalizedPattern] || ''
}

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
  enterpriseDelivery: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-demand', type: 'start', text: '需求进入', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-triage', type: 'process', text: '需求分级', x: 380, y: 120 }),
      createFlowchartNode({ id: 'node-scope', type: 'decision', text: '范围清晰？', x: 640, y: 108, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-solution', type: 'process', text: '方案设计', x: 900, y: 120 }),
      createFlowchartNode({ id: 'node-estimate', type: 'process', text: '成本评估', x: 1160, y: 120 }),
      createFlowchartNode({ id: 'node-approve', type: 'decision', text: '审批通过？', x: 1420, y: 108, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-contract', type: 'process', text: '合同确认', x: 120, y: 280 }),
      createFlowchartNode({ id: 'node-resource', type: 'process', text: '资源排期', x: 380, y: 280 }),
      createFlowchartNode({ id: 'node-procure', type: 'process', text: '采购准备', x: 640, y: 280 }),
      createFlowchartNode({ id: 'node-vendor', type: 'decision', text: '供应就绪？', x: 900, y: 268, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-kickoff', type: 'process', text: '项目启动', x: 1160, y: 280 }),
      createFlowchartNode({ id: 'node-plan', type: 'process', text: '交付计划', x: 1420, y: 280 }),
      createFlowchartNode({ id: 'node-build', type: 'process', text: '实施配置', x: 120, y: 440 }),
      createFlowchartNode({ id: 'node-integrate', type: 'process', text: '系统联调', x: 380, y: 440 }),
      createFlowchartNode({ id: 'node-data', type: 'input', text: '数据导入', x: 640, y: 440 }),
      createFlowchartNode({ id: 'node-qa', type: 'decision', text: '验收通过？', x: 900, y: 428, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-training', type: 'process', text: '用户培训', x: 1160, y: 440 }),
      createFlowchartNode({ id: 'node-live', type: 'process', text: '上线切换', x: 1420, y: 440 }),
      createFlowchartNode({ id: 'node-monitor', type: 'process', text: '运行监控', x: 120, y: 600 }),
      createFlowchartNode({ id: 'node-support', type: 'process', text: '问题响应', x: 380, y: 600 }),
      createFlowchartNode({ id: 'node-stabilize', type: 'decision', text: '运行稳定？', x: 640, y: 588, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-handover', type: 'process', text: '运营交接', x: 900, y: 600 }),
      createFlowchartNode({ id: 'node-review', type: 'process', text: '复盘沉淀', x: 1160, y: 600 }),
      createFlowchartNode({ id: 'node-close-delivery', type: 'end', text: '项目关闭', x: 1420, y: 600 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-demand-triage', source: 'node-demand', target: 'node-triage' }),
      createFlowchartEdge({ id: 'edge-triage-scope', source: 'node-triage', target: 'node-scope' }),
      createFlowchartEdge({ id: 'edge-scope-solution', source: 'node-scope', target: 'node-solution', label: '是' }),
      createFlowchartEdge({ id: 'edge-solution-estimate', source: 'node-solution', target: 'node-estimate' }),
      createFlowchartEdge({ id: 'edge-estimate-approve', source: 'node-estimate', target: 'node-approve' }),
      createFlowchartEdge({ id: 'edge-approve-contract', source: 'node-approve', target: 'node-contract', label: '通过' }),
      createFlowchartEdge({ id: 'edge-contract-resource', source: 'node-contract', target: 'node-resource' }),
      createFlowchartEdge({ id: 'edge-resource-procure', source: 'node-resource', target: 'node-procure' }),
      createFlowchartEdge({ id: 'edge-procure-vendor', source: 'node-procure', target: 'node-vendor' }),
      createFlowchartEdge({ id: 'edge-vendor-kickoff', source: 'node-vendor', target: 'node-kickoff', label: '是' }),
      createFlowchartEdge({ id: 'edge-kickoff-plan', source: 'node-kickoff', target: 'node-plan' }),
      createFlowchartEdge({ id: 'edge-plan-build', source: 'node-plan', target: 'node-build' }),
      createFlowchartEdge({ id: 'edge-build-integrate', source: 'node-build', target: 'node-integrate' }),
      createFlowchartEdge({ id: 'edge-integrate-data', source: 'node-integrate', target: 'node-data' }),
      createFlowchartEdge({ id: 'edge-data-qa', source: 'node-data', target: 'node-qa' }),
      createFlowchartEdge({ id: 'edge-qa-training', source: 'node-qa', target: 'node-training', label: '是' }),
      createFlowchartEdge({ id: 'edge-training-live', source: 'node-training', target: 'node-live' }),
      createFlowchartEdge({ id: 'edge-live-monitor', source: 'node-live', target: 'node-monitor' }),
      createFlowchartEdge({ id: 'edge-monitor-support', source: 'node-monitor', target: 'node-support' }),
      createFlowchartEdge({ id: 'edge-support-stabilize', source: 'node-support', target: 'node-stabilize' }),
      createFlowchartEdge({ id: 'edge-stabilize-handover', source: 'node-stabilize', target: 'node-handover', label: '是' }),
      createFlowchartEdge({ id: 'edge-handover-review', source: 'node-handover', target: 'node-review' }),
      createFlowchartEdge({ id: 'edge-review-close-delivery', source: 'node-review', target: 'node-close-delivery' }),
      createFlowchartEdge({ id: 'edge-scope-triage', source: 'node-scope', target: 'node-triage', label: '否', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-approve-estimate', source: 'node-approve', target: 'node-estimate', label: '退回', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-vendor-procure', source: 'node-vendor', target: 'node-procure', label: '否', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-qa-build', source: 'node-qa', target: 'node-build', label: '返工', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-stabilize-support', source: 'node-stabilize', target: 'node-support', label: '否', style: { dashed: true } })
    ]
  })
}

export const FLOWCHART_TEMPLATE_PRESETS = [
  { id: 'approval', labelKey: 'flowchart.templateApproval', categoryKey: 'flowchart.templateCategoryOps' },
  { id: 'crossFunctionalApproval', labelKey: 'flowchart.templateCrossFunctionalApproval', categoryKey: 'flowchart.templateCategoryOps' },
  { id: 'contentReview', labelKey: 'flowchart.templateContentReview', categoryKey: 'flowchart.templateCategoryOps' },
  { id: 'procurement', labelKey: 'flowchart.templateProcurement', categoryKey: 'flowchart.templateCategoryOps' },
  { id: 'release', labelKey: 'flowchart.templateRelease', categoryKey: 'flowchart.templateCategoryDelivery' },
  { id: 'projectPlan', labelKey: 'flowchart.templateProjectPlan', categoryKey: 'flowchart.templateCategoryDelivery' },
  { id: 'dataPipeline', labelKey: 'flowchart.templateDataPipeline', categoryKey: 'flowchart.templateCategoryDelivery' },
  { id: 'enterpriseDelivery', labelKey: 'flowchart.templateEnterpriseDelivery', categoryKey: 'flowchart.templateCategoryDelivery' },
  { id: 'ticket', labelKey: 'flowchart.templateTicket', categoryKey: 'flowchart.templateCategoryService' },
  { id: 'troubleshooting', labelKey: 'flowchart.templateTroubleshooting', categoryKey: 'flowchart.templateCategoryService' },
  { id: 'incident', labelKey: 'flowchart.templateIncident', categoryKey: 'flowchart.templateCategoryService' },
  { id: 'supportEscalation', labelKey: 'flowchart.templateSupportEscalation', categoryKey: 'flowchart.templateCategoryService' },
  { id: 'onboarding', labelKey: 'flowchart.templateOnboarding', categoryKey: 'flowchart.templateCategoryBusiness' },
  { id: 'customerJourney', labelKey: 'flowchart.templateCustomerJourney', categoryKey: 'flowchart.templateCategoryBusiness' },
  { id: 'salesPipeline', labelKey: 'flowchart.templateSalesPipeline', categoryKey: 'flowchart.templateCategoryBusiness' }
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

function normalizeFlowchartEdgeRoute(route) {
  if (!route || typeof route !== 'object') {
    return null
  }
  const manualPoints = (Array.isArray(route?.manualPoints) ? route.manualPoints : [])
    .map(point => {
      const x = Number(point?.x)
      const y = Number(point?.y)
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null
      }
      return {
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100
      }
    })
    .filter(Boolean)
  if (manualPoints.length) {
    return {
      manualPoints
    }
  }
  const laneAxis = String(route?.orthogonalLane?.axis || '').trim()
  const laneValue = Number(route?.orthogonalLane?.value)
  if (!['x', 'y'].includes(laneAxis) || !Number.isFinite(laneValue)) {
    return null
  }
  return {
    orthogonalLane: {
      axis: laneAxis,
      value: laneValue
    }
  }
}

export function normalizeFlowchartEdgeLabelPosition(labelPosition) {
  if (!labelPosition || typeof labelPosition !== 'object') {
    return null
  }
  const ratio = Math.max(0, Math.min(1, Number(labelPosition?.ratio)))
  const offsetX = Number(labelPosition?.offsetX)
  const offsetY = Number(labelPosition?.offsetY)
  const normalizedLabelPosition = {
    ratio: Number.isFinite(ratio) ? ratio : 0.5,
    offsetX: Number.isFinite(offsetX) ? offsetX : 0,
    offsetY: Number.isFinite(offsetY) ? offsetY : 0
  }
  if (
    Math.abs(normalizedLabelPosition.ratio - 0.5) <= 0.0001 &&
    Math.abs(normalizedLabelPosition.offsetX) <= 0.001 &&
    Math.abs(normalizedLabelPosition.offsetY) <= 0.001
  ) {
    return null
  }
  return normalizedLabelPosition
}

function createFlowchartEdge({
  id,
  source = '',
  target = '',
  label = '',
  sourceAnchor = null,
  targetAnchor = null,
  route = null,
  labelPosition = null,
  style = {}
} = {}) {
  return {
    id: String(id || ''),
    source: String(source || '').trim(),
    target: String(target || '').trim(),
    label: String(label || ''),
    sourceAnchor: normalizeFlowchartNodeAnchor(sourceAnchor),
    targetAnchor: normalizeFlowchartNodeAnchor(targetAnchor),
    route: normalizeFlowchartEdgeRoute(route),
    labelPosition: normalizeFlowchartEdgeLabelPosition(labelPosition),
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
    label: String(label || '').trim(),
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

const normalizeTemplateLayout = (
  templateData,
  { mode = 'document', templateId = 'blank' } = {}
) => {
  const normalizedTemplate = {
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
            pathType: 'orthogonal'
          }
        }))
      : [],
    lanes: Array.isArray(templateData?.lanes)
      ? templateData.lanes.map(lane => ({
          ...lane,
          label: ''
        }))
      : []
  }

  compactTemplateLayout(normalizedTemplate, mode, templateId)
  alignTemplateColumnNodes(normalizedTemplate)
  alignTemplateMergeNodes(normalizedTemplate)
  alignTemplateColumnNodes(normalizedTemplate)
  if (mode === 'preview') {
    resolveTemplateNodeOverlaps(normalizedTemplate)
  }
  return normalizedTemplate
}

const getNodeCenter = node => ({
  x: Number(node.x || 0) + Number(node.width || 0) / 2,
  y: Number(node.y || 0) + Number(node.height || 0) / 2
})

const getTemplateRowAnchor = node => Number(node?.y || 0)

const TEMPLATE_ALIGNMENT_SNAP = 12
const TEMPLATE_COLUMN_ALIGNMENT_THRESHOLD = 72
const FLOWCHART_AXIS_ALIGNMENT_TOLERANCE = 40
const MIN_ORTHOGONAL_TURN_SPAN = 36
const MAX_FLOWCHART_SINGLE_CORNER_SPAN = 120
const FLOWCHART_SINGLE_CORNER_DOMINANT_GAP = 24
const MIN_EDGE_ARROW_LENGTH = 56
const MAX_FLOWCHART_EDGE_ARROW_COUNT = 4
const DEFAULT_FLOWCHART_EDGE_ARROW_COUNT = 1
const MIN_FLOWCHART_EDGE_ARROW_SIZE = 0.6
const MAX_FLOWCHART_EDGE_ARROW_SIZE = 1.6
const DEFAULT_FLOWCHART_EDGE_ARROW_SIZE = 1
const FLOWCHART_ORTHOGONAL_STUB_LENGTH = 36
const FLOWCHART_ORTHOGONAL_LANE_GAP = 28
const FLOWCHART_ROUTE_OBSTACLE_PADDING = 18
const FLOWCHART_EDGE_DIRECTION_HYSTERESIS = 36
const FLOWCHART_EDGE_DIRECTION_AMBIGUOUS_THRESHOLD = 72
const TEMPLATE_LAYOUT_PRESETS = {
  document: {
    baseX: 132,
    baseY: 120,
    columnGap: 236,
    rowGap: 132,
    columnThreshold: 180,
    rowThreshold: 112
  },
  preview: {
    baseX: 84,
    baseY: 84,
    columnGap: 184,
    rowGap: 108,
    columnThreshold: 180,
    rowThreshold: 112
  }
}

const snapTemplateCoordinate = value => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return 0
  }
  return Math.round(numericValue / TEMPLATE_ALIGNMENT_SNAP) * TEMPLATE_ALIGNMENT_SNAP
}

const normalizeFlowchartEdgeArrowSize = value => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_FLOWCHART_EDGE_ARROW_SIZE
  }
  return Math.max(
    MIN_FLOWCHART_EDGE_ARROW_SIZE,
    Math.min(MAX_FLOWCHART_EDGE_ARROW_SIZE, numericValue)
  )
}

const normalizeFlowchartEdgeArrowCount = value => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_FLOWCHART_EDGE_ARROW_COUNT
  }
  return Math.max(
    0,
    Math.min(MAX_FLOWCHART_EDGE_ARROW_COUNT, Math.round(numericValue))
  )
}

const buildFlowchartPolylinePath = points => {
  if (!Array.isArray(points) || !points.length) {
    return ''
  }
  return points.reduce((result, point, index) => {
    const x = Number(point?.x || 0)
    const y = Number(point?.y || 0)
    return `${result}${index === 0 ? 'M' : ' L'} ${x} ${y}`
  }, '')
}

const getFlowchartPolylineSegments = points => {
  const normalizedPoints = Array.isArray(points) ? points : []
  const segments = []
  for (let index = 1; index < normalizedPoints.length; index += 1) {
    const start = normalizedPoints[index - 1]
    const end = normalizedPoints[index]
    const deltaX = Number(end?.x || 0) - Number(start?.x || 0)
    const deltaY = Number(end?.y || 0) - Number(start?.y || 0)
    const length = Math.hypot(deltaX, deltaY)
    if (length <= 0.001) {
      continue
    }
    segments.push({
      start,
      end,
      deltaX,
      deltaY,
      length,
      angle: (Math.atan2(deltaY, deltaX) * 180) / Math.PI,
      isHorizontal: Math.abs(deltaX) >= Math.abs(deltaY)
    })
  }
  return segments
}

const getFlowchartPolylinePointAtRatio = (points, ratio = 0.5) => {
  const segments = getFlowchartPolylineSegments(points)
  if (!segments.length) {
    const point = points?.[0] || { x: 0, y: 0 }
    return {
      point: {
        x: Number(point.x || 0),
        y: Number(point.y || 0)
      },
      ratio: 0.5,
      distance: 0,
      totalLength: 0
    }
  }
  const normalizedRatio = Math.max(0, Math.min(1, Number(ratio)))
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0)
  const targetDistance = totalLength * (Number.isFinite(normalizedRatio) ? normalizedRatio : 0.5)
  let traversedLength = 0
  for (const segment of segments) {
    const nextLength = traversedLength + segment.length
    if (targetDistance <= nextLength || segment === segments[segments.length - 1]) {
      const localRatio =
        segment.length > 0 ? (targetDistance - traversedLength) / segment.length : 0.5
      return {
        point: {
          x: Number(segment.start?.x || 0) + segment.deltaX * localRatio,
          y: Number(segment.start?.y || 0) + segment.deltaY * localRatio
        },
        ratio: Number.isFinite(normalizedRatio) ? normalizedRatio : 0.5,
        distance: targetDistance,
        totalLength
      }
    }
    traversedLength = nextLength
  }
  const lastPoint = points?.[points.length - 1] || points?.[0] || { x: 0, y: 0 }
  return {
    point: {
      x: Number(lastPoint.x || 0),
      y: Number(lastPoint.y || 0)
    },
    ratio: 1,
    distance: totalLength,
    totalLength
  }
}

export const projectFlowchartPointToPolyline = (points, referencePoint) => {
  const segments = getFlowchartPolylineSegments(points)
  if (!segments.length) {
    const point = points?.[0] || { x: 0, y: 0 }
    return {
      point: {
        x: Number(point.x || 0),
        y: Number(point.y || 0)
      },
      ratio: 0.5,
      distance: 0
    }
  }
  const normalizedReferencePoint = {
    x: Number(referencePoint?.x || 0),
    y: Number(referencePoint?.y || 0)
  }
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0)
  let traversedLength = 0
  let bestProjection = null
  segments.forEach(segment => {
    const lengthSquared = segment.length ** 2
    const projectionRatio =
      lengthSquared > 0
        ? (
            ((normalizedReferencePoint.x - segment.start.x) * segment.deltaX +
              (normalizedReferencePoint.y - segment.start.y) * segment.deltaY) /
            lengthSquared
          )
        : 0
    const clampedRatio = Math.max(0, Math.min(1, projectionRatio))
    const projectedPoint = {
      x: segment.start.x + segment.deltaX * clampedRatio,
      y: segment.start.y + segment.deltaY * clampedRatio
    }
    const distanceToReference = Math.hypot(
      normalizedReferencePoint.x - projectedPoint.x,
      normalizedReferencePoint.y - projectedPoint.y
    )
    const distanceOnPath = traversedLength + segment.length * clampedRatio
    const candidate = {
      point: projectedPoint,
      ratio: totalLength > 0 ? distanceOnPath / totalLength : 0.5,
      distance: distanceOnPath,
      distanceToReference
    }
    if (
      !bestProjection ||
      candidate.distanceToReference < bestProjection.distanceToReference
    ) {
      bestProjection = candidate
    }
    traversedLength += segment.length
  })
  return bestProjection || getFlowchartPolylinePointAtRatio(points, 0.5)
}

const createFlowchartEdgeLabelPlacementFromPoints = (
  points,
  { preferredSide = 'right', label = '', labelPosition = null } = {}
) => {
  void preferredSide
  void label
  const normalizedLabelPosition = normalizeFlowchartEdgeLabelPosition(labelPosition)
  const segments = getFlowchartPolylineSegments(points)
  let placementPoint = getFlowchartPolylinePointAtRatio(
    points,
    normalizedLabelPosition?.ratio ?? 0.5
  ).point
  if (!normalizedLabelPosition && segments.length) {
    const preferredSegment =
      segments
        .map((segment, index) => ({
          ...segment,
          index,
          score: segment.length + (index > 0 && index < segments.length - 1 ? 24 : 0)
        }))
        .sort((first, second) => second.score - first.score)[0] || null
    if (preferredSegment) {
      placementPoint = {
        x: preferredSegment.start.x + preferredSegment.deltaX * 0.5,
        y: preferredSegment.start.y + preferredSegment.deltaY * 0.5
      }
      const bends = (Array.isArray(points) ? points : []).slice(1, -1)
      const minBendDistance = bends.reduce((result, point) => {
        return Math.min(
          result,
          Math.hypot(
            placementPoint.x - Number(point?.x || 0),
            placementPoint.y - Number(point?.y || 0)
          )
        )
      }, Infinity)
      if (bends.length && minBendDistance < 40) {
        const offsetDistance = 56 - minBendDistance
        const isHorizontal = Math.abs(preferredSegment.deltaY) <= 0.001
        placementPoint = {
          x:
            placementPoint.x +
            (isHorizontal ? 0 : preferredSide === 'left' ? -offsetDistance : offsetDistance),
          y:
            placementPoint.y +
            (isHorizontal ? -offsetDistance : 0)
        }
      }
    }
  }
  return {
    labelX: placementPoint.x + Number(normalizedLabelPosition?.offsetX || 0),
    labelY: placementPoint.y + Number(normalizedLabelPosition?.offsetY || 0),
    labelPlacement: 'inline',
    labelPosition: normalizedLabelPosition || {
      ratio: 0.5,
      offsetX: 0,
      offsetY: 0
    }
  }
}

const buildFlowchartCurveSamplePoints = (
  sourcePoint,
  sourceControl,
  targetControl,
  targetPoint,
  steps = 24
) => {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const progress = index / steps
    return {
      x: getCubicBezierPoint(
        sourcePoint.x,
        sourceControl.x,
        targetControl.x,
        targetPoint.x,
        progress
      ),
      y: getCubicBezierPoint(
        sourcePoint.y,
        sourceControl.y,
        targetControl.y,
        targetPoint.y,
        progress
      )
    }
  })
}

const getFlowchartArrowMarkersFromPoints = (points, style) => {
  const desiredCount = normalizeFlowchartEdgeArrowCount(style?.arrowCount)
  if (!desiredCount) {
    return []
  }
  const segments = getFlowchartPolylineSegments(points)
  if (!segments.length) {
    return []
  }
  const totalLength = segments.reduce((total, segment) => total + segment.length, 0)
  const maxCountByLength = Math.max(1, Math.floor(totalLength / MIN_EDGE_ARROW_LENGTH))
  const arrowCount = Math.min(desiredCount, maxCountByLength)
  const distances =
    arrowCount === 1
      ? [totalLength]
      : [
          ...Array.from({ length: arrowCount - 1 }, (_, index) =>
            totalLength * ((index + 1) / arrowCount)
          ),
          totalLength
        ]
  return distances
    .map(distance => {
      let traversed = 0
      for (const segment of segments) {
        if (distance <= traversed + segment.length || segment === segments[segments.length - 1]) {
          const localDistance = Math.max(0, Math.min(segment.length, distance - traversed))
          const progress = segment.length <= 0 ? 0 : localDistance / segment.length
          return {
            x: segment.start.x + segment.deltaX * progress,
            y: segment.start.y + segment.deltaY * progress,
            angle: segment.angle,
            size: normalizeFlowchartEdgeArrowSize(style?.arrowSize)
          }
        }
        traversed += segment.length
      }
      return null
    })
    .filter(Boolean)
}

const getFlowchartDirectionVector = direction => {
  if (direction === 'left') {
    return { x: -1, y: 0 }
  }
  if (direction === 'right') {
    return { x: 1, y: 0 }
  }
  if (direction === 'top') {
    return { x: 0, y: -1 }
  }
  return { x: 0, y: 1 }
}

const offsetFlowchartPoint = (point, direction, distance) => {
  const vector = getFlowchartDirectionVector(direction)
  return {
    x: Number(point?.x || 0) + vector.x * distance,
    y: Number(point?.y || 0) + vector.y * distance
  }
}

const normalizeFlowchartAxisAlignedEndpoints = ({
  sourcePoint,
  targetPoint
}) => {
  return {
    sourcePoint: {
      x: Number(sourcePoint?.x || 0),
      y: Number(sourcePoint?.y || 0)
    },
    targetPoint: {
      x: Number(targetPoint?.x || 0),
      y: Number(targetPoint?.y || 0)
    }
  }
}

const areFlowchartPointsEqual = (firstPoint, secondPoint) => {
  return (
    Math.abs(Number(firstPoint?.x || 0) - Number(secondPoint?.x || 0)) <= 0.001 &&
    Math.abs(Number(firstPoint?.y || 0) - Number(secondPoint?.y || 0)) <= 0.001
  )
}

const isFlowchartCollinearPoint = (previousPoint, currentPoint, nextPoint) => {
  const previousDeltaX = Number(currentPoint?.x || 0) - Number(previousPoint?.x || 0)
  const previousDeltaY = Number(currentPoint?.y || 0) - Number(previousPoint?.y || 0)
  const nextDeltaX = Number(nextPoint?.x || 0) - Number(currentPoint?.x || 0)
  const nextDeltaY = Number(nextPoint?.y || 0) - Number(currentPoint?.y || 0)
  const isCollinear =
    (Math.abs(previousDeltaX) <= 0.001 && Math.abs(nextDeltaX) <= 0.001) ||
    (Math.abs(previousDeltaY) <= 0.001 && Math.abs(nextDeltaY) <= 0.001)
  if (!isCollinear) {
    return false
  }
  return previousDeltaX * nextDeltaX + previousDeltaY * nextDeltaY >= 0
}

const simplifyFlowchartOrthogonalPoints = points => {
  const uniquePoints = []
  ;(Array.isArray(points) ? points : []).forEach(point => {
    const normalizedPoint = {
      x: Number(point?.x || 0),
      y: Number(point?.y || 0)
    }
    if (!uniquePoints.length || !areFlowchartPointsEqual(uniquePoints[uniquePoints.length - 1], normalizedPoint)) {
      uniquePoints.push(normalizedPoint)
    }
  })
  const simplifiedPoints = []
  uniquePoints.forEach(point => {
    while (
      simplifiedPoints.length >= 2 &&
      isFlowchartCollinearPoint(
        simplifiedPoints[simplifiedPoints.length - 2],
        simplifiedPoints[simplifiedPoints.length - 1],
        point
      )
    ) {
      simplifiedPoints.pop()
    }
    simplifiedPoints.push(point)
  })
  return simplifiedPoints
}

const createFlowchartManualRouteTurnPoint = (
  currentPoint,
  targetPoint,
  previousAxis = ''
) => {
  const currentX = Number(currentPoint?.x || 0)
  const currentY = Number(currentPoint?.y || 0)
  const targetX = Number(targetPoint?.x || 0)
  const targetY = Number(targetPoint?.y || 0)
  if (Math.abs(currentX - targetX) <= 0.001 || Math.abs(currentY - targetY) <= 0.001) {
    return null
  }
  if (previousAxis === 'x') {
    return {
      x: currentX,
      y: targetY
    }
  }
  if (previousAxis === 'y') {
    return {
      x: targetX,
      y: currentY
    }
  }
  if (Math.abs(targetX - currentX) >= Math.abs(targetY - currentY)) {
    return {
      x: targetX,
      y: currentY
    }
  }
  return {
    x: currentX,
    y: targetY
  }
}

const buildFlowchartManualOrthogonalPathPoints = ({
  sourcePoint,
  targetPoint,
  manualPoints = []
}) => {
  const normalizedManualPoints = (Array.isArray(manualPoints) ? manualPoints : [])
    .map(point => ({
      x: Number(point?.x || 0),
      y: Number(point?.y || 0)
    }))
    .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
  const rawTargets = [...normalizedManualPoints, targetPoint].map(point => ({
    x: Number(point?.x || 0),
    y: Number(point?.y || 0)
  }))
  const pathPoints = [
    {
      x: Number(sourcePoint?.x || 0),
      y: Number(sourcePoint?.y || 0)
    }
  ]
  let previousAxis = ''
  rawTargets.forEach(target => {
    const currentPoint = pathPoints[pathPoints.length - 1]
    const turnPoint = createFlowchartManualRouteTurnPoint(
      currentPoint,
      target,
      previousAxis
    )
    if (turnPoint) {
      pathPoints.push(turnPoint)
      previousAxis =
        Math.abs(Number(turnPoint.x || 0) - Number(currentPoint.x || 0)) > 0.001
          ? 'x'
          : 'y'
    }
    pathPoints.push(target)
    const previousPoint = pathPoints[pathPoints.length - 2]
    previousAxis =
      Math.abs(Number(target.x || 0) - Number(previousPoint?.x || 0)) > 0.001
        ? 'x'
        : 'y'
  })
  return simplifyFlowchartOrthogonalPoints(pathPoints)
}

const createFlowchartManualOrthogonalRoute = ({
  sourcePoint,
  targetPoint,
  manualPoints = []
}) => {
  const pathPoints = buildFlowchartManualOrthogonalPathPoints({
    sourcePoint,
    targetPoint,
    manualPoints
  })
  const normalizedManualPoints = pathPoints.slice(1, -1)
  return {
    pathPoints,
    bendHandles: createFlowchartOrthogonalBendHandlesFromPoints(pathPoints),
    route: normalizedManualPoints.length
      ? {
          manualPoints: normalizedManualPoints
        }
      : null
  }
}

const getFlowchartNodeBounds = (node, padding = 0) => {
  const normalizedPadding = Math.max(0, Number(padding || 0))
  const left = Number(node?.x || 0) - normalizedPadding
  const top = Number(node?.y || 0) - normalizedPadding
  const right = Number(node?.x || 0) + Number(node?.width || 0) + normalizedPadding
  const bottom = Number(node?.y || 0) + Number(node?.height || 0) + normalizedPadding
  return {
    left,
    top,
    right,
    bottom
  }
}

const doesFlowchartSegmentIntersectBoundsInterior = (startPoint, endPoint, bounds) => {
  const startX = Number(startPoint?.x || 0)
  const startY = Number(startPoint?.y || 0)
  const endX = Number(endPoint?.x || 0)
  const endY = Number(endPoint?.y || 0)
  const epsilon = 0.001
  if (Math.abs(startX - endX) <= epsilon) {
    const x = startX
    if (x <= bounds.left + epsilon || x >= bounds.right - epsilon) {
      return false
    }
    const minY = Math.min(startY, endY)
    const maxY = Math.max(startY, endY)
    return minY < bounds.bottom - epsilon && maxY > bounds.top + epsilon
  }
  if (Math.abs(startY - endY) <= epsilon) {
    const y = startY
    if (y <= bounds.top + epsilon || y >= bounds.bottom - epsilon) {
      return false
    }
    const minX = Math.min(startX, endX)
    const maxX = Math.max(startX, endX)
    return minX < bounds.right - epsilon && maxX > bounds.left + epsilon
  }
  return false
}

const doesFlowchartPolylineIntersectObstacles = (
  points,
  obstacles = [],
  ignoredNodeIds = [],
  padding = FLOWCHART_ROUTE_OBSTACLE_PADDING
) => {
  const normalizedPoints = Array.isArray(points) ? points : []
  if (normalizedPoints.length < 2) {
    return false
  }
  const ignoredIds = new Set(ignoredNodeIds.map(item => String(item || '').trim()))
  return (Array.isArray(obstacles) ? obstacles : []).some(node => {
    const nodeId = String(node?.id || '').trim()
    if (ignoredIds.has(nodeId)) {
      return false
    }
    const bounds = getFlowchartNodeBounds(node, padding)
    return normalizedPoints.slice(0, -1).some((startPoint, index) => {
      return doesFlowchartSegmentIntersectBoundsInterior(
        startPoint,
        normalizedPoints[index + 1],
        bounds
      )
    })
  })
}

const roundFlowchartRouteCoordinate = value => {
  return Math.round(Number(value || 0) * 100) / 100
}

const isFlowchartPointInsideBoundsInterior = (point, bounds) => {
  const x = Number(point?.x || 0)
  const y = Number(point?.y || 0)
  const epsilon = 0.001
  return (
    x > bounds.left + epsilon &&
    x < bounds.right - epsilon &&
    y > bounds.top + epsilon &&
    y < bounds.bottom - epsilon
  )
}

const getFlowchartRoutingObstacleBounds = (
  obstacles = [],
  ignoredNodeIds = [],
  padding = FLOWCHART_ROUTE_OBSTACLE_PADDING
) => {
  const ignoredIds = new Set(ignoredNodeIds.map(item => String(item || '').trim()))
  return (Array.isArray(obstacles) ? obstacles : [])
    .filter(node => !ignoredIds.has(String(node?.id || '').trim()))
    .map(node => getFlowchartNodeBounds(node, padding))
}

const doesFlowchartSegmentIntersectObstacleBounds = (
  startPoint,
  endPoint,
  obstacleBounds = []
) => {
  return obstacleBounds.some(bounds => {
    return doesFlowchartSegmentIntersectBoundsInterior(startPoint, endPoint, bounds)
  })
}

const createFlowchartOrthogonalBendHandlesFromPoints = points => {
  const normalizedPoints = simplifyFlowchartOrthogonalPoints(points)
  if (normalizedPoints.length <= 2) {
    return []
  }
  return normalizedPoints.slice(1, -1).map((point, index) => {
    const previousPoint = normalizedPoints[index]
    const incomingIsVertical =
      Math.abs(Number(previousPoint?.x || 0) - Number(point?.x || 0)) <= 0.001
    return {
      x: Number(point?.x || 0),
      y: Number(point?.y || 0),
      axis: incomingIsVertical ? 'x' : 'y'
    }
  })
}

const getFlowchartDirectionBetweenPoints = (startPoint, endPoint) => {
  const deltaX = Number(endPoint?.x || 0) - Number(startPoint?.x || 0)
  const deltaY = Number(endPoint?.y || 0) - Number(startPoint?.y || 0)
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? 'right' : 'left'
  }
  return deltaY >= 0 ? 'bottom' : 'top'
}

const buildFlowchartObstacleAvoidingOrthogonalRoute = ({
  sourcePoint,
  targetPoint,
  sourceDirection,
  targetDirection,
  obstacles = [],
  ignoredNodeIds = []
}) => {
  const sourceStub = offsetFlowchartPoint(
    sourcePoint,
    sourceDirection,
    FLOWCHART_ORTHOGONAL_STUB_LENGTH
  )
  const targetStub = offsetFlowchartPoint(
    targetPoint,
    targetDirection,
    FLOWCHART_ORTHOGONAL_STUB_LENGTH
  )
  const obstacleBounds = getFlowchartRoutingObstacleBounds(
    obstacles,
    ignoredNodeIds,
    0
  )
  if (
    obstacleBounds.some(bounds => isFlowchartPointInsideBoundsInterior(sourceStub, bounds)) ||
    obstacleBounds.some(bounds => isFlowchartPointInsideBoundsInterior(targetStub, bounds))
  ) {
    return null
  }
  const xValues = new Set(
    [sourcePoint.x, targetPoint.x, sourceStub.x, targetStub.x].map(roundFlowchartRouteCoordinate)
  )
  const yValues = new Set(
    [sourcePoint.y, targetPoint.y, sourceStub.y, targetStub.y].map(roundFlowchartRouteCoordinate)
  )
  const extent = {
    minX: Math.min(sourcePoint.x, targetPoint.x, sourceStub.x, targetStub.x),
    maxX: Math.max(sourcePoint.x, targetPoint.x, sourceStub.x, targetStub.x),
    minY: Math.min(sourcePoint.y, targetPoint.y, sourceStub.y, targetStub.y),
    maxY: Math.max(sourcePoint.y, targetPoint.y, sourceStub.y, targetStub.y)
  }
  obstacleBounds.forEach(bounds => {
    xValues.add(roundFlowchartRouteCoordinate(bounds.left))
    xValues.add(roundFlowchartRouteCoordinate(bounds.right))
    yValues.add(roundFlowchartRouteCoordinate(bounds.top))
    yValues.add(roundFlowchartRouteCoordinate(bounds.bottom))
    extent.minX = Math.min(extent.minX, bounds.left)
    extent.maxX = Math.max(extent.maxX, bounds.right)
    extent.minY = Math.min(extent.minY, bounds.top)
    extent.maxY = Math.max(extent.maxY, bounds.bottom)
  })
  const extentSpanX = extent.maxX - extent.minX
  const extentSpanY = extent.maxY - extent.minY
  const boundaryMargin = Math.max(72, Math.max(extentSpanX, extentSpanY) * 0.25)
  xValues.add(roundFlowchartRouteCoordinate(extent.minX - boundaryMargin))
  xValues.add(roundFlowchartRouteCoordinate(extent.maxX + boundaryMargin))
  yValues.add(roundFlowchartRouteCoordinate(extent.minY - boundaryMargin))
  yValues.add(roundFlowchartRouteCoordinate(extent.maxY + boundaryMargin))
  const xCoordinates = [...xValues].sort((first, second) => first - second)
  const yCoordinates = [...yValues].sort((first, second) => first - second)
  const points = []
  const pointIndexByKey = new Map()
  const addPoint = point => {
    const normalizedPoint = {
      x: roundFlowchartRouteCoordinate(point?.x),
      y: roundFlowchartRouteCoordinate(point?.y)
    }
    const pointKey = `${normalizedPoint.x}:${normalizedPoint.y}`
    if (pointIndexByKey.has(pointKey)) {
      return pointIndexByKey.get(pointKey)
    }
    if (obstacleBounds.some(bounds => isFlowchartPointInsideBoundsInterior(normalizedPoint, bounds))) {
      return null
    }
    const nextIndex = points.length
    points.push(normalizedPoint)
    pointIndexByKey.set(pointKey, nextIndex)
    return nextIndex
  }
  xCoordinates.forEach(x => {
    yCoordinates.forEach(y => {
      addPoint({ x, y })
    })
  })
  const sourceIndex = addPoint(sourceStub)
  const targetIndex = addPoint(targetStub)
  if (sourceIndex === null || targetIndex === null) {
    return null
  }
  const neighbors = Array.from({ length: points.length }, () => [])
  const rows = new Map()
  const columns = new Map()
  points.forEach((point, index) => {
    const rowKey = String(point.y)
    const columnKey = String(point.x)
    if (!rows.has(rowKey)) {
      rows.set(rowKey, [])
    }
    if (!columns.has(columnKey)) {
      columns.set(columnKey, [])
    }
    rows.get(rowKey).push(index)
    columns.get(columnKey).push(index)
  })
  const connectAdjacentPointIndexes = indexes => {
    indexes
      .slice()
      .sort((firstIndex, secondIndex) => {
        const firstPoint = points[firstIndex]
        const secondPoint = points[secondIndex]
        if (Math.abs(firstPoint.x - secondPoint.x) <= 0.001) {
          return firstPoint.y - secondPoint.y
        }
        return firstPoint.x - secondPoint.x
      })
      .forEach((pointIndex, index, sortedIndexes) => {
        if (index === 0) {
          return
        }
        const previousIndex = sortedIndexes[index - 1]
        const startPoint = points[previousIndex]
        const endPoint = points[pointIndex]
        if (doesFlowchartSegmentIntersectObstacleBounds(startPoint, endPoint, obstacleBounds)) {
          return
        }
        const distance = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y)
        if (distance <= 0.001) {
          return
        }
        neighbors[previousIndex].push({ index: pointIndex, distance })
        neighbors[pointIndex].push({ index: previousIndex, distance })
      })
  }
  rows.forEach(connectAdjacentPointIndexes)
  columns.forEach(connectAdjacentPointIndexes)
  const startStateKey = `${sourceIndex}:start`
  const queue = [{ pointIndex: sourceIndex, previousDirection: 'start', cost: 0 }]
  const bestCosts = new Map([[startStateKey, 0]])
  const previousState = new Map()
  let bestEndStateKey = ''
  const insertSorted = (item) => {
    let low = 0
    let high = queue.length
    while (low < high) {
      const mid = (low + high) >>> 1
      if (queue[mid].cost <= item.cost) {
        low = mid + 1
      } else {
        high = mid
      }
    }
    queue.splice(low, 0, item)
  }
  while (queue.length) {
    const current = queue.shift()
    const currentStateKey = `${current.pointIndex}:${current.previousDirection}`
    const currentBestCost = bestCosts.get(currentStateKey)
    if (currentBestCost !== current.cost) {
      continue
    }
    if (current.pointIndex === targetIndex) {
      bestEndStateKey = currentStateKey
      break
    }
    neighbors[current.pointIndex].forEach(neighbor => {
      const nextDirection = getFlowchartDirectionBetweenPoints(
        points[current.pointIndex],
        points[neighbor.index]
      )
      const bendPenalty =
        current.previousDirection !== 'start' && current.previousDirection !== nextDirection
          ? FLOWCHART_ORTHOGONAL_STUB_LENGTH * 4 + neighbor.distance * 0.5
          : 0
      const nextCost = current.cost + neighbor.distance + bendPenalty
      const nextStateKey = `${neighbor.index}:${nextDirection}`
      if (bestCosts.has(nextStateKey) && bestCosts.get(nextStateKey) <= nextCost) {
        return
      }
      bestCosts.set(nextStateKey, nextCost)
      previousState.set(nextStateKey, currentStateKey)
      insertSorted({
        pointIndex: neighbor.index,
        previousDirection: nextDirection,
        cost: nextCost
      })
    })
  }
  if (!bestEndStateKey) {
    return null
  }
  const routePoints = []
  let currentStateKey = bestEndStateKey
  while (currentStateKey) {
    const [pointIndexText] = currentStateKey.split(':')
    const pointIndex = Number(pointIndexText)
    routePoints.push(points[pointIndex])
    currentStateKey = previousState.get(currentStateKey) || ''
  }
  routePoints.reverse()
  const fullPoints = simplifyFlowchartOrthogonalPoints([
    sourcePoint,
    ...routePoints,
    targetPoint
  ])
  if (
    doesFlowchartPolylineIntersectObstacles(
      fullPoints,
      obstacles,
      ignoredNodeIds,
      0
    )
  ) {
    return null
  }
  return {
    pathPoints: fullPoints,
    bendHandles: createFlowchartOrthogonalBendHandlesFromPoints(fullPoints),
    route: null
  }
}

const finalizeFlowchartOrthogonalRoute = (
  candidateRoute,
  {
    sourcePoint,
    targetPoint,
    sourceDirection,
    targetDirection,
    obstacles,
    ignoredNodeIds,
    interactive = false
  }
) => {
  const normalizedPathPoints = simplifyFlowchartOrthogonalPoints(candidateRoute?.pathPoints || [])
  const normalizedRoute =
    Array.isArray(candidateRoute?.route?.manualPoints) &&
    candidateRoute.route.manualPoints.length
      ? {
          ...candidateRoute,
          pathPoints: normalizedPathPoints,
          route: normalizedPathPoints.length > 2
            ? {
                manualPoints: normalizedPathPoints.slice(1, -1)
              }
            : null,
          bendHandles: createFlowchartOrthogonalBendHandlesFromPoints(normalizedPathPoints)
        }
      : {
          ...candidateRoute,
          pathPoints: normalizedPathPoints
        }
  if (
    !doesFlowchartPolylineIntersectObstacles(
      normalizedPathPoints,
      obstacles,
      ignoredNodeIds,
      0
    )
  ) {
    return normalizedRoute
  }
  if (interactive) {
    return normalizedRoute
  }
  return (
    buildFlowchartObstacleAvoidingOrthogonalRoute({
      sourcePoint,
      targetPoint,
      sourceDirection,
      targetDirection,
      obstacles,
      ignoredNodeIds
    }) || normalizedRoute
  )
}

const collectFlowchartLaneCandidateValues = ({
  axis,
  sourcePoint,
  targetPoint,
  sourceStub,
  targetStub,
  desiredLane,
  obstacles = [],
  ignoredNodeIds = []
}) => {
  const ignoredIds = new Set(ignoredNodeIds.map(item => String(item || '').trim()))
  const candidateValues = new Set([
    Math.round(Number(desiredLane || 0) * 100) / 100
  ])
  const primaryMin =
    axis === 'x'
      ? Math.min(sourceStub.y, targetStub.y)
      : Math.min(sourceStub.x, targetStub.x)
  const primaryMax =
    axis === 'x'
      ? Math.max(sourceStub.y, targetStub.y)
      : Math.max(sourceStub.x, targetStub.x)
  const extentMin =
    axis === 'x'
      ? Math.min(sourcePoint.x, targetPoint.x, sourceStub.x, targetStub.x)
      : Math.min(sourcePoint.y, targetPoint.y, sourceStub.y, targetStub.y)
  const extentMax =
    axis === 'x'
      ? Math.max(sourcePoint.x, targetPoint.x, sourceStub.x, targetStub.x)
      : Math.max(sourcePoint.y, targetPoint.y, sourceStub.y, targetStub.y)

  candidateValues.add(Math.round((extentMax + 72) * 100) / 100)
  candidateValues.add(Math.round((extentMin - 72) * 100) / 100)

  ;(Array.isArray(obstacles) ? obstacles : []).forEach(node => {
    const nodeId = String(node?.id || '').trim()
    if (ignoredIds.has(nodeId)) {
      return
    }
    const bounds = getFlowchartNodeBounds(node, FLOWCHART_ROUTE_OBSTACLE_PADDING)
    const overlapsPrimaryRange =
      axis === 'x'
        ? primaryMin < bounds.bottom && primaryMax > bounds.top
        : primaryMin < bounds.right && primaryMax > bounds.left
    if (!overlapsPrimaryRange) {
      return
    }
    candidateValues.add(
      Math.round(((axis === 'x' ? bounds.left : bounds.top) - FLOWCHART_ORTHOGONAL_LANE_GAP) * 100) /
        100
    )
    candidateValues.add(
      Math.round(((axis === 'x' ? bounds.right : bounds.bottom) + FLOWCHART_ORTHOGONAL_LANE_GAP) * 100) /
        100
    )
  })

  return [...candidateValues].sort((first, second) => {
    return Math.abs(first - desiredLane) - Math.abs(second - desiredLane)
  })
}

const getFlowchartLaneDirectionSign = (axis, direction) => {
  if (axis === 'x') {
    if (direction === 'right') {
      return 1
    }
    if (direction === 'left') {
      return -1
    }
    return 0
  }
  if (direction === 'bottom') {
    return 1
  }
  if (direction === 'top') {
    return -1
  }
  return 0
}

const pushFlowchartLaneValueAwayFromEndpoint = ({
  axis,
  laneValue,
  pointValue,
  direction
}) => {
  const directionSign = getFlowchartLaneDirectionSign(axis, direction)
  if (!directionSign) {
    return laneValue
  }
  if (Math.abs(laneValue - pointValue) >= FLOWCHART_ORTHOGONAL_LANE_GAP) {
    return laneValue
  }
  return pointValue + directionSign * FLOWCHART_ORTHOGONAL_LANE_GAP
}

const isFlowchartLaneValueForwardFromStubs = ({
  axis,
  laneValue,
  sourceStub,
  targetStub,
  sourceDirection,
  targetDirection
}) => {
  const epsilon = 0.001
  const isForwardFromStub = (stub, direction) => {
    if (axis === 'x') {
      if (direction === 'right') {
        return laneValue >= Number(stub?.x || 0) - epsilon
      }
      if (direction === 'left') {
        return laneValue <= Number(stub?.x || 0) + epsilon
      }
      return true
    }
    if (direction === 'bottom') {
      return laneValue >= Number(stub?.y || 0) - epsilon
    }
    if (direction === 'top') {
      return laneValue <= Number(stub?.y || 0) + epsilon
    }
    return true
  }
  return (
    isForwardFromStub(sourceStub, sourceDirection) &&
    isForwardFromStub(targetStub, targetDirection)
  )
}

const resolveFlowchartOrthogonalLaneValue = ({
  axis,
  sourcePoint,
  targetPoint,
  sourceStub,
  targetStub,
  sourceDirection,
  targetDirection,
  route = null
}) => {
  const sourceValue = axis === 'x' ? sourceStub.x : sourceStub.y
  const targetValue = axis === 'x' ? targetStub.x : targetStub.y
  const manualLane =
    route?.orthogonalLane?.axis === axis && Number.isFinite(Number(route?.orthogonalLane?.value))
      ? Number(route.orthogonalLane.value)
      : null
  const minLane = Math.min(sourceValue, targetValue) - 160
  const maxLane = Math.max(sourceValue, targetValue) + 160
  let laneValue =
    manualLane ??
    (() => {
      if (Math.abs(targetValue - sourceValue) >= MIN_ORTHOGONAL_TURN_SPAN) {
        return sourceValue + (targetValue - sourceValue) / 2
      }
      const positiveDirection =
        axis === 'x'
          ? sourceDirection === 'right' || targetDirection === 'right'
          : sourceDirection === 'bottom' || targetDirection === 'bottom'
      const extentMax =
        axis === 'x'
          ? Math.max(sourcePoint.x, targetPoint.x, sourceStub.x, targetStub.x)
          : Math.max(sourcePoint.y, targetPoint.y, sourceStub.y, targetStub.y)
      const extentMin =
        axis === 'x'
          ? Math.min(sourcePoint.x, targetPoint.x, sourceStub.x, targetStub.x)
          : Math.min(sourcePoint.y, targetPoint.y, sourceStub.y, targetStub.y)
      return positiveDirection ? extentMax + 72 : extentMin - 72
    })()
  laneValue = Math.max(minLane, Math.min(maxLane, laneValue))
  laneValue = pushFlowchartLaneValueAwayFromEndpoint({
    axis,
    laneValue,
    pointValue: axis === 'x' ? sourcePoint.x : sourcePoint.y,
    direction: sourceDirection
  })
  laneValue = pushFlowchartLaneValueAwayFromEndpoint({
    axis,
    laneValue,
    pointValue: axis === 'x' ? targetPoint.x : targetPoint.y,
    direction: targetDirection
  })
  if (Math.abs(laneValue - sourceValue) < FLOWCHART_ORTHOGONAL_LANE_GAP) {
    laneValue =
      sourceValue +
      (laneValue >= sourceValue ? FLOWCHART_ORTHOGONAL_LANE_GAP : -FLOWCHART_ORTHOGONAL_LANE_GAP)
  }
  if (Math.abs(laneValue - targetValue) < FLOWCHART_ORTHOGONAL_LANE_GAP) {
    laneValue =
      targetValue +
      (laneValue >= targetValue ? FLOWCHART_ORTHOGONAL_LANE_GAP : -FLOWCHART_ORTHOGONAL_LANE_GAP)
  }
  return laneValue
}

const shouldUseStraightFlowchartOrthogonalRoute = ({
  sourcePoint,
  targetPoint,
  sourceDirection,
  targetDirection
}) => {
  const sourceHorizontal =
    sourceDirection === 'left' || sourceDirection === 'right'
  const targetHorizontal =
    targetDirection === 'left' || targetDirection === 'right'
  return (
    (Math.abs(sourcePoint.x - targetPoint.x) <= 0.001 &&
      (targetPoint.y >= sourcePoint.y
        ? sourceDirection === 'bottom' && targetDirection === 'top'
        : sourceDirection === 'top' && targetDirection === 'bottom')) ||
    (Math.abs(sourcePoint.y - targetPoint.y) <= 0.001 &&
      (targetPoint.x >= sourcePoint.x
        ? sourceDirection === 'right' && targetDirection === 'left'
        : sourceDirection === 'left' && targetDirection === 'right')) ||
    sourceHorizontal === targetHorizontal &&
    ((sourceHorizontal &&
      Math.abs(sourcePoint.y - targetPoint.y) <= 0.001 &&
      ((sourceDirection === 'right' && targetDirection === 'left' && sourcePoint.x <= targetPoint.x) ||
        (sourceDirection === 'left' && targetDirection === 'right' && sourcePoint.x >= targetPoint.x))) ||
      (!sourceHorizontal &&
        Math.abs(sourcePoint.x - targetPoint.x) <= 0.001 &&
        ((sourceDirection === 'bottom' && targetDirection === 'top' && sourcePoint.y <= targetPoint.y) ||
          (sourceDirection === 'top' && targetDirection === 'bottom' && sourcePoint.y >= targetPoint.y))))
  )
}

const FLOWCHART_ANCHOR_HANDLES = ['top', 'right', 'bottom', 'left']

const getFlowchartConnectionCandidateHandles = (lockedAnchor, fallbackDirection = '') => {
  const lockedHandle = isFlowchartAnchorLocked(lockedAnchor)
    ? getFlowchartAnchorHandleKey(lockedAnchor, '')
    : ''
  if (lockedHandle && FLOWCHART_ANCHOR_HANDLES.includes(lockedHandle)) {
    return [lockedHandle]
  }
  const preferredHandle = FLOWCHART_ANCHOR_HANDLES.includes(String(fallbackDirection || '').trim())
    ? String(fallbackDirection || '').trim()
    : ''
  return preferredHandle
    ? [preferredHandle, ...FLOWCHART_ANCHOR_HANDLES.filter(handle => handle !== preferredHandle)]
    : [...FLOWCHART_ANCHOR_HANDLES]
}

const getFlowchartPolylineLength = points => {
  return getFlowchartPolylineSegments(points).reduce((total, segment) => total + segment.length, 0)
}

const getFlowchartDirectionAlignmentScore = (direction, deltaX, deltaY) => {
  const vector = getFlowchartDirectionVector(direction)
  return deltaX * vector.x + deltaY * vector.y
}

const doesFlowchartPathBacktrackNearEndpoint = (
  pathPoints,
  direction,
  endpoint = 'source'
) => {
  const points = endpoint === 'target' ? [...(pathPoints || [])].reverse() : [...(pathPoints || [])]
  if (points.length < 3) {
    return false
  }
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
  const sign = direction === 'right' || direction === 'bottom' ? 1 : -1
  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1]
    const currentPoint = points[index]
    const deltaAxis = Number(currentPoint?.[axis] || 0) - Number(previousPoint?.[axis] || 0)
    const deltaCross =
      axis === 'x'
        ? Number(currentPoint?.y || 0) - Number(previousPoint?.y || 0)
        : Number(currentPoint?.x || 0) - Number(previousPoint?.x || 0)
    if (Math.abs(deltaAxis) <= 0.001 && Math.abs(deltaCross) <= 0.001) {
      continue
    }
    if (Math.abs(deltaAxis) <= 0.001) {
      break
    }
    if (deltaAxis * sign < -0.001) {
      return true
    }
  }
  return false
}

const doesFlowchartPathBacktrackAtEitherEndpoint = (
  pathPoints,
  sourceDirection,
  targetDirection
) => {
  return (
    doesFlowchartPathBacktrackNearEndpoint(pathPoints, sourceDirection, 'source') ||
    doesFlowchartPathBacktrackNearEndpoint(pathPoints, targetDirection, 'target')
  )
}

const scoreFlowchartConnectionCandidate = ({
  sourceDirection,
  targetDirection,
  sourceNode = null,
  targetNode = null,
  sourceCenter,
  targetCenter,
  sourcePoint,
  targetPoint,
  pathPoints,
  pathType,
  nodes = [],
  ignoredNodeIds = [],
  previousDirections = null
}) => {
  const deltaX = Number(targetCenter?.x || 0) - Number(sourceCenter?.x || 0)
  const deltaY = Number(targetCenter?.y || 0) - Number(sourceCenter?.y || 0)
  const sourceAlignment = getFlowchartDirectionAlignmentScore(
    sourceDirection,
    deltaX,
    deltaY
  )
  const targetAlignment = getFlowchartDirectionAlignmentScore(
    targetDirection,
    -deltaX,
    -deltaY
  )
  const pathLength = getFlowchartPolylineLength(pathPoints)
  const bendCount = Math.max(0, (Array.isArray(pathPoints) ? pathPoints.length : 0) - 2)
  const directDistance = Math.hypot(
    Number(targetPoint?.x || 0) - Number(sourcePoint?.x || 0),
    Number(targetPoint?.y || 0) - Number(sourcePoint?.y || 0)
  )
  const routeWaste = Math.max(0, pathLength - directDistance)
  const isHorizontalOpposite =
    (sourceDirection === 'right' && targetDirection === 'left') ||
    (sourceDirection === 'left' && targetDirection === 'right')
  const isVerticalOpposite =
    (sourceDirection === 'bottom' && targetDirection === 'top') ||
    (sourceDirection === 'top' && targetDirection === 'bottom')
  const sourceLeft = Number(sourceNode?.x || 0)
  const sourceRight = sourceLeft + Number(sourceNode?.width || 0)
  const sourceTop = Number(sourceNode?.y || 0)
  const sourceBottom = sourceTop + Number(sourceNode?.height || 0)
  const targetLeft = Number(targetNode?.x || 0)
  const targetRight = targetLeft + Number(targetNode?.width || 0)
  const targetTop = Number(targetNode?.y || 0)
  const targetBottom = targetTop + Number(targetNode?.height || 0)
  const overlapX = Math.max(0, Math.min(sourceRight, targetRight) - Math.max(sourceLeft, targetLeft))
  const overlapY = Math.max(0, Math.min(sourceBottom, targetBottom) - Math.max(sourceTop, targetTop))
  const endpointDeltaX = Math.abs(Number(targetPoint?.x || 0) - Number(sourcePoint?.x || 0))
  const endpointDeltaY = Math.abs(Number(targetPoint?.y || 0) - Number(sourcePoint?.y || 0))
  const obstacleHit = doesFlowchartPolylineIntersectObstacles(
    pathPoints,
    nodes,
    ignoredNodeIds,
    0
  )
  const bufferedObstacleHit = doesFlowchartPolylineIntersectObstacles(
    pathPoints,
    nodes,
    ignoredNodeIds
  )
  const sourceEndpointBacktrack = doesFlowchartPathBacktrackNearEndpoint(
    pathPoints,
    sourceDirection,
    'source'
  )
  const targetEndpointBacktrack = doesFlowchartPathBacktrackNearEndpoint(
    pathPoints,
    targetDirection,
    'target'
  )
  let score = 0
  score += obstacleHit ? 1000000 : 0
  score += !obstacleHit && bufferedObstacleHit ? 2200 : 0
  score += sourceEndpointBacktrack ? 2800 : 0
  score += targetEndpointBacktrack ? 2800 : 0
  score += bendCount * 180
  score += pathLength * 0.08
  score += routeWaste * 1.8
  score += Math.max(0, -sourceAlignment) * 12
  score += Math.max(0, -targetAlignment) * 12
  score -= Math.max(0, sourceAlignment) * 0.12
  score -= Math.max(0, targetAlignment) * 0.12
  if (isHorizontalOpposite) {
    const forwardSpan =
      sourceDirection === 'right'
        ? Number(targetPoint?.x || 0) - Number(sourcePoint?.x || 0)
        : Number(sourcePoint?.x || 0) - Number(targetPoint?.x || 0)
    score -= 140
    score += endpointDeltaY <= FLOWCHART_AXIS_ALIGNMENT_TOLERANCE ? -120 : endpointDeltaY * 0.8
    score += forwardSpan <= 0 ? 720 : forwardSpan < MIN_ORTHOGONAL_TURN_SPAN ? 80 : 0
  }
  if (isVerticalOpposite) {
    const forwardSpan =
      sourceDirection === 'bottom'
        ? Number(targetPoint?.y || 0) - Number(sourcePoint?.y || 0)
        : Number(sourcePoint?.y || 0) - Number(targetPoint?.y || 0)
    score -= 140
    score += endpointDeltaX <= FLOWCHART_AXIS_ALIGNMENT_TOLERANCE ? -120 : endpointDeltaX * 0.8
    score += forwardSpan <= 0 ? 720 : forwardSpan < MIN_ORTHOGONAL_TURN_SPAN ? 80 : 0
  }
  if (overlapX > 0) {
    score += isVerticalOpposite ? -260 : 160
  }
  if (overlapY > 0) {
    score += isHorizontalOpposite ? -260 : 160
  }
  const prefersVerticalStack =
    Math.abs(deltaY) >= 96 && Math.abs(deltaX) <= Math.abs(deltaY) * 1.35
  if (prefersVerticalStack) {
    const preferredSourceDirection = deltaY >= 0 ? 'bottom' : 'top'
    const preferredTargetDirection = deltaY >= 0 ? 'top' : 'bottom'
    score += sourceDirection === preferredSourceDirection ? -240 : 140
    score += targetDirection === preferredTargetDirection ? -240 : 140
  }
  if (Math.abs(deltaY) > Math.abs(deltaX) + 24) {
    score += ['top', 'bottom'].includes(sourceDirection) ? -28 : 44
    score += ['top', 'bottom'].includes(targetDirection) ? -28 : 44
  } else if (Math.abs(deltaX) > Math.abs(deltaY) + 24) {
    score += ['left', 'right'].includes(sourceDirection) ? -28 : 44
    score += ['left', 'right'].includes(targetDirection) ? -28 : 44
  }
  const isMixedDirection =
    ['left', 'right'].includes(sourceDirection) !==
    ['left', 'right'].includes(targetDirection)
  const prefersDominantSingleCorner =
    isMixedDirection &&
    bendCount === 1 &&
    !obstacleHit &&
    !bufferedObstacleHit &&
    !sourceEndpointBacktrack &&
    !targetEndpointBacktrack &&
    ((['left', 'right'].includes(sourceDirection) &&
      endpointDeltaX > MAX_FLOWCHART_SINGLE_CORNER_SPAN) ||
      (['top', 'bottom'].includes(sourceDirection) &&
        endpointDeltaY > MAX_FLOWCHART_SINGLE_CORNER_SPAN)) &&
    ((['left', 'right'].includes(sourceDirection) &&
      endpointDeltaY >= endpointDeltaX + FLOWCHART_SINGLE_CORNER_DOMINANT_GAP) ||
      (['top', 'bottom'].includes(sourceDirection) &&
        endpointDeltaX >= endpointDeltaY + FLOWCHART_SINGLE_CORNER_DOMINANT_GAP))
  if (prefersDominantSingleCorner) {
    score -= 320
  }
  if (pathType === 'orthogonal' && bendCount <= 0) {
    score -= 36
  }
  if (previousDirections) {
    score += previousDirections.sourceDirection === sourceDirection ? -18 : 8
    score += previousDirections.targetDirection === targetDirection ? -18 : 8
  }
  return score
}

const buildFlowchartRouteForConnection = ({
  style,
  sourcePoint,
  targetPoint,
  sourceDirection,
  targetDirection,
  route = null,
  nodes = [],
  ignoredNodeIds = [],
  interactive = false
}) => {
  if (style.pathType === 'straight') {
    const pathPoints = [sourcePoint, targetPoint]
    return {
      path: buildFlowchartPolylinePath(pathPoints),
      pathPoints,
      bendHandles: [],
      route: null
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
          x: sourcePoint.x + (sourceDirection === 'left' ? -strength : strength),
          y: sourcePoint.y
        }
      : {
          x: sourcePoint.x,
          y: sourcePoint.y + (sourceDirection === 'top' ? -strength : strength)
        }
    const targetControl = horizontalCurve
      ? {
          x: targetPoint.x + (targetDirection === 'left' ? -strength : strength),
          y: targetPoint.y
        }
      : {
          x: targetPoint.x,
          y: targetPoint.y + (targetDirection === 'top' ? -strength : strength)
        }
    const pathPoints = buildFlowchartCurveSamplePoints(
      sourcePoint,
      sourceControl,
      targetControl,
      targetPoint
    )
    return {
      path: `M ${sourcePoint.x} ${sourcePoint.y} C ${sourceControl.x} ${sourceControl.y} ${targetControl.x} ${targetControl.y} ${targetPoint.x} ${targetPoint.y}`,
      pathPoints,
      bendHandles: [],
      route: null
    }
  }
  const orthogonalRoute = buildFlowchartOrthogonalRoute({
    sourcePoint,
    targetPoint,
    sourceDirection,
    targetDirection,
    route,
    obstacles: nodes,
    ignoredNodeIds,
    interactive
  })
  return {
    path: buildFlowchartPolylinePath(orthogonalRoute.pathPoints),
    pathPoints: orthogonalRoute.pathPoints,
    bendHandles: orthogonalRoute.bendHandles,
    route: orthogonalRoute.route
  }
}

const resolveFlowchartConnectionLayout = ({
  edge,
  sourceNode,
  targetNode,
  style,
  lockedSourceAnchor,
  lockedTargetAnchor,
  autoDirections,
  options = {}
}) => {
  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)
  const nodes = Array.isArray(options?.nodes) ? options.nodes : []
  const ignoredNodeIds = [sourceNode?.id, targetNode?.id]
  const interactive = options?.interactive === true
  const sourceHandles = getFlowchartConnectionCandidateHandles(
    lockedSourceAnchor,
    autoDirections.sourceDirection
  ).slice(0, interactive ? 1 : undefined)
  const targetHandles = getFlowchartConnectionCandidateHandles(
    lockedTargetAnchor,
    autoDirections.targetDirection
  ).slice(0, interactive ? 1 : undefined)
  const candidates = []
  sourceHandles.forEach(sourceDirection => {
    targetHandles.forEach(targetDirection => {
      const rawSourcePoint = getFlowchartNodeConnectionPoint(
        sourceNode,
        lockedSourceAnchor || sourceDirection
      )
      const rawTargetPoint = getFlowchartNodeConnectionPoint(
        targetNode,
        lockedTargetAnchor || targetDirection
      )
      const { sourcePoint, targetPoint } = normalizeFlowchartAxisAlignedEndpoints({
        sourcePoint: rawSourcePoint,
        targetPoint: rawTargetPoint
      })
      const routeLayout = buildFlowchartRouteForConnection({
        style,
        sourcePoint,
        targetPoint,
        sourceDirection,
        targetDirection,
        route: null,
        nodes,
        ignoredNodeIds,
        interactive
      })
      candidates.push({
        sourcePoint,
        targetPoint,
        sourceDirection,
        targetDirection,
        score: scoreFlowchartConnectionCandidate({
          sourceDirection,
          targetDirection,
          sourceNode,
          targetNode,
          sourceCenter,
          targetCenter,
          sourcePoint,
          targetPoint,
          pathPoints: routeLayout.pathPoints,
          pathType: style.pathType,
          nodes,
          ignoredNodeIds,
          previousDirections: options?.lockedDirections || null
        }),
        routeLayout
      })
    })
  })
  const bestCandidate =
    candidates.sort((first, second) => first.score - second.score)[0] || null
  if (!bestCandidate) {
    const sourceDirection = autoDirections.sourceDirection
    const targetDirection = autoDirections.targetDirection
    const sourcePoint = getFlowchartNodeConnectionPoint(sourceNode, sourceDirection)
    const targetPoint = getFlowchartNodeConnectionPoint(targetNode, targetDirection)
    const routeLayout = buildFlowchartRouteForConnection({
      style,
      sourcePoint,
      targetPoint,
      sourceDirection,
      targetDirection,
      route: null,
      nodes,
      ignoredNodeIds,
      interactive
    })
    return {
      sourcePoint,
      targetPoint,
      sourceDirection,
      targetDirection,
      ...routeLayout
    }
  }
  const routeLayout = buildFlowchartRouteForConnection({
    style,
    sourcePoint: bestCandidate.sourcePoint,
    targetPoint: bestCandidate.targetPoint,
    sourceDirection: bestCandidate.sourceDirection,
    targetDirection: bestCandidate.targetDirection,
    route: options?.strictAlignment ? null : edge?.route || null,
    nodes,
    ignoredNodeIds,
    interactive
  })
  return {
    sourcePoint: bestCandidate.sourcePoint,
    targetPoint: bestCandidate.targetPoint,
    sourceDirection: bestCandidate.sourceDirection,
    targetDirection: bestCandidate.targetDirection,
    ...routeLayout
  }
}

const buildFlowchartOrthogonalRoute = ({
  sourcePoint,
  targetPoint,
  sourceDirection,
  targetDirection,
  route = null,
  obstacles = [],
  ignoredNodeIds = [],
  interactive = false
}) => {
  const finalizeRoute = candidateRoute => {
    return finalizeFlowchartOrthogonalRoute(candidateRoute, {
      sourcePoint,
      targetPoint,
      sourceDirection,
      targetDirection,
      obstacles,
      ignoredNodeIds,
      interactive
    })
  }
  if (Array.isArray(route?.manualPoints) && route.manualPoints.length) {
    return finalizeRoute(
      createFlowchartManualOrthogonalRoute({
        sourcePoint,
        targetPoint,
        manualPoints: route.manualPoints
      })
    )
  }
  if (
    shouldUseStraightFlowchartOrthogonalRoute({
      sourcePoint,
      targetPoint,
      sourceDirection,
      targetDirection
    })
  ) {
    return finalizeRoute({
      pathPoints: [sourcePoint, targetPoint],
      bendHandles: [],
      route: null
    })
  }
  const sourceHorizontal =
    sourceDirection === 'left' || sourceDirection === 'right'
  const targetHorizontal =
    targetDirection === 'left' || targetDirection === 'right'
  if (sourceHorizontal !== targetHorizontal) {
    const singleCornerPoint = sourceHorizontal
      ? {
          x: targetPoint.x,
          y: sourcePoint.y
        }
      : {
          x: sourcePoint.x,
          y: targetPoint.y
        }
    const sourceForward =
      sourceHorizontal
        ? sourceDirection === 'right'
          ? singleCornerPoint.x >= sourcePoint.x
          : singleCornerPoint.x <= sourcePoint.x
        : sourceDirection === 'bottom'
          ? singleCornerPoint.y >= sourcePoint.y
          : singleCornerPoint.y <= sourcePoint.y
    const targetForward =
      targetHorizontal
        ? targetDirection === 'right'
          ? singleCornerPoint.x <= targetPoint.x
          : singleCornerPoint.x >= targetPoint.x
        : targetDirection === 'bottom'
          ? singleCornerPoint.y >= targetPoint.y
          : singleCornerPoint.y <= targetPoint.y
    const singleCornerTravel = sourceHorizontal
      ? Math.abs(Number(targetPoint?.x || 0) - Number(sourcePoint?.x || 0))
      : Math.abs(Number(targetPoint?.y || 0) - Number(sourcePoint?.y || 0))
    const singleCornerDominantGap = sourceHorizontal
      ? Math.abs(Number(targetPoint?.y || 0) - Number(sourcePoint?.y || 0))
      : Math.abs(Number(targetPoint?.x || 0) - Number(sourcePoint?.x || 0))
    const allowExtendedSingleCorner =
      singleCornerDominantGap >=
      singleCornerTravel + FLOWCHART_SINGLE_CORNER_DOMINANT_GAP
    if (sourceForward && targetForward) {
      const singleCornerRoutePoints = simplifyFlowchartOrthogonalPoints([
        sourcePoint,
        singleCornerPoint,
        targetPoint
      ])
      if (
        (singleCornerTravel <= MAX_FLOWCHART_SINGLE_CORNER_SPAN ||
          allowExtendedSingleCorner) &&
        singleCornerRoutePoints.length <= 3 &&
        !doesFlowchartPolylineIntersectObstacles(
          singleCornerRoutePoints,
          obstacles,
          ignoredNodeIds,
          0
        )
      ) {
        return finalizeRoute({
          pathPoints: singleCornerRoutePoints,
          bendHandles: [],
          route: null
        })
      }
    }
  }
  const isHorizontalOpposite =
    (sourceDirection === 'right' && targetDirection === 'left') ||
    (sourceDirection === 'left' && targetDirection === 'right')
  const isVerticalOpposite =
    (sourceDirection === 'bottom' && targetDirection === 'top') ||
    (sourceDirection === 'top' && targetDirection === 'bottom')
  const horizontalForwardSpan =
    sourceDirection === 'right'
      ? Number(targetPoint?.x || 0) - Number(sourcePoint?.x || 0)
      : Number(sourcePoint?.x || 0) - Number(targetPoint?.x || 0)
  const verticalForwardSpan =
    sourceDirection === 'bottom'
      ? Number(targetPoint?.y || 0) - Number(sourcePoint?.y || 0)
      : Number(sourcePoint?.y || 0) - Number(targetPoint?.y || 0)
  if (
    (isHorizontalOpposite && horizontalForwardSpan > 0) ||
    (isVerticalOpposite && verticalForwardSpan > 0)
  ) {
    const laneAxis = isHorizontalOpposite ? 'x' : 'y'
    const desiredLane =
      laneAxis === 'x'
        ? (Number(sourcePoint?.x || 0) + Number(targetPoint?.x || 0)) / 2
        : (Number(sourcePoint?.y || 0) + Number(targetPoint?.y || 0)) / 2
    const buildOppositeRoutePointsForLaneValue = laneValue => {
      const firstLanePoint =
        laneAxis === 'x'
          ? { x: laneValue, y: sourcePoint.y }
          : { x: sourcePoint.x, y: laneValue }
      const secondLanePoint =
        laneAxis === 'x'
          ? { x: laneValue, y: targetPoint.y }
          : { x: targetPoint.x, y: laneValue }
      return simplifyFlowchartOrthogonalPoints([
        sourcePoint,
        firstLanePoint,
        secondLanePoint,
        targetPoint
      ])
    }
    const laneCandidates = collectFlowchartLaneCandidateValues({
      axis: laneAxis,
      sourcePoint,
      targetPoint,
      sourceStub: sourcePoint,
      targetStub: targetPoint,
      desiredLane,
      obstacles,
      ignoredNodeIds
    })
    const resolvedLaneValue =
      route?.orthogonalLane?.axis === laneAxis &&
      Number.isFinite(Number(route?.orthogonalLane?.value))
        ? Number(route.orthogonalLane.value)
        : laneCandidates.find(candidateLaneValue => {
          const candidatePoints = buildOppositeRoutePointsForLaneValue(candidateLaneValue)
          if (
            doesFlowchartPathBacktrackAtEitherEndpoint(
              candidatePoints,
              sourceDirection,
              targetDirection
            )
          ) {
            return false
          }
          if (
            !isFlowchartLaneValueForwardFromStubs({
              axis: laneAxis,
              laneValue: candidateLaneValue,
              sourceStub: sourcePoint,
              targetStub: targetPoint,
              sourceDirection,
              targetDirection
            })
          ) {
            return false
          }
          return !doesFlowchartPolylineIntersectObstacles(
            candidatePoints,
            obstacles,
            ignoredNodeIds,
            0
            )
          }) ??
          laneCandidates.find(candidateLaneValue => {
            const candidatePoints = buildOppositeRoutePointsForLaneValue(candidateLaneValue)
            return (
              !doesFlowchartPathBacktrackAtEitherEndpoint(
                candidatePoints,
                sourceDirection,
                targetDirection
              ) &&
              isFlowchartLaneValueForwardFromStubs({
                axis: laneAxis,
                laneValue: candidateLaneValue,
                sourceStub: sourcePoint,
                targetStub: targetPoint,
                sourceDirection,
                targetDirection
              })
            )
          }) ??
          desiredLane
    const firstLanePoint =
      laneAxis === 'x'
        ? { x: resolvedLaneValue, y: sourcePoint.y }
        : { x: sourcePoint.x, y: resolvedLaneValue }
    const secondLanePoint =
      laneAxis === 'x'
        ? { x: resolvedLaneValue, y: targetPoint.y }
        : { x: targetPoint.x, y: resolvedLaneValue }
    const directRoute = {
      pathPoints: buildOppositeRoutePointsForLaneValue(resolvedLaneValue),
      bendHandles: [
        {
          x: firstLanePoint.x,
          y: firstLanePoint.y,
          axis: laneAxis
        },
        {
          x: secondLanePoint.x,
          y: secondLanePoint.y,
          axis: laneAxis
        }
      ],
      route: {
        orthogonalLane: {
          axis: laneAxis,
          value: resolvedLaneValue
        }
      }
    }
    if (
      route?.orthogonalLane?.axis === laneAxis ||
      !doesFlowchartPolylineIntersectObstacles(
        directRoute.pathPoints,
        obstacles,
        ignoredNodeIds,
        0
      )
    ) {
      return finalizeRoute(directRoute)
    }
    const detourAxis = laneAxis === 'x' ? 'y' : 'x'
    const sourceStub = offsetFlowchartPoint(
      sourcePoint,
      sourceDirection,
      FLOWCHART_ORTHOGONAL_STUB_LENGTH
    )
    const targetStub = offsetFlowchartPoint(
      targetPoint,
      targetDirection,
      FLOWCHART_ORTHOGONAL_STUB_LENGTH
    )
    const detourExtentMin =
      detourAxis === 'x'
        ? Math.min(sourcePoint.x, targetPoint.x, sourceStub.x, targetStub.x)
        : Math.min(sourcePoint.y, targetPoint.y, sourceStub.y, targetStub.y)
    const detourExtentMax =
      detourAxis === 'x'
        ? Math.max(sourcePoint.x, targetPoint.x, sourceStub.x, targetStub.x)
        : Math.max(sourcePoint.y, targetPoint.y, sourceStub.y, targetStub.y)
    const desiredDetourLane = detourExtentMin - 72
    const buildDetourRoutePointsForLaneValue = laneValue => {
      const firstDetourLanePoint =
        detourAxis === 'x'
          ? { x: laneValue, y: sourceStub.y }
          : { x: sourceStub.x, y: laneValue }
      const secondDetourLanePoint =
        detourAxis === 'x'
          ? { x: laneValue, y: targetStub.y }
          : { x: targetStub.x, y: laneValue }
      return simplifyFlowchartOrthogonalPoints([
        sourcePoint,
        sourceStub,
        firstDetourLanePoint,
        secondDetourLanePoint,
        targetStub,
        targetPoint
      ])
    }
    const detourLaneCandidates = collectFlowchartLaneCandidateValues({
        axis: detourAxis,
        sourcePoint,
        targetPoint,
        sourceStub,
        targetStub,
        desiredLane: desiredDetourLane,
        obstacles,
        ignoredNodeIds
      })
    const resolvedDetourLaneValue =
      detourLaneCandidates.find(candidateLaneValue => {
        const candidatePoints = buildDetourRoutePointsForLaneValue(candidateLaneValue)
        if (
          doesFlowchartPathBacktrackAtEitherEndpoint(
            candidatePoints,
            sourceDirection,
            targetDirection
          )
        ) {
          return false
        }
        return !doesFlowchartPolylineIntersectObstacles(
          candidatePoints,
          obstacles,
          ignoredNodeIds,
          0
        )
      }) ??
      detourLaneCandidates.find(candidateLaneValue => {
        const candidatePoints = buildDetourRoutePointsForLaneValue(candidateLaneValue)
        return !doesFlowchartPathBacktrackAtEitherEndpoint(
          candidatePoints,
          sourceDirection,
          targetDirection
        )
      }) ??
      detourExtentMax + 72
    const firstDetourLanePoint =
      detourAxis === 'x'
        ? { x: resolvedDetourLaneValue, y: sourceStub.y }
        : { x: sourceStub.x, y: resolvedDetourLaneValue }
    const secondDetourLanePoint =
      detourAxis === 'x'
        ? { x: resolvedDetourLaneValue, y: targetStub.y }
        : { x: targetStub.x, y: resolvedDetourLaneValue }
    return finalizeRoute({
      pathPoints: buildDetourRoutePointsForLaneValue(resolvedDetourLaneValue),
      bendHandles: [
        {
          x: firstDetourLanePoint.x,
          y: firstDetourLanePoint.y,
          axis: detourAxis
        },
        {
          x: secondDetourLanePoint.x,
          y: secondDetourLanePoint.y,
          axis: detourAxis
        }
      ],
      route: {
        orthogonalLane: {
          axis: detourAxis,
          value: resolvedDetourLaneValue
        }
      }
    })
  }
  const sourceStub = offsetFlowchartPoint(
    sourcePoint,
    sourceDirection,
    FLOWCHART_ORTHOGONAL_STUB_LENGTH
  )
  const targetStub = offsetFlowchartPoint(
    targetPoint,
    targetDirection,
    FLOWCHART_ORTHOGONAL_STUB_LENGTH
  )
  const needsPerpendicularLane =
    sourceHorizontal === targetHorizontal &&
    ((sourceHorizontal && Math.abs(sourcePoint.y - targetPoint.y) <= 0.001) ||
      (!sourceHorizontal && Math.abs(sourcePoint.x - targetPoint.x) <= 0.001))
  const laneAxis = needsPerpendicularLane
    ? sourceHorizontal
      ? 'y'
      : 'x'
    : sourceHorizontal
      ? 'x'
      : 'y'
  const laneValue = resolveFlowchartOrthogonalLaneValue({
    axis: laneAxis,
    sourcePoint,
    targetPoint,
    sourceStub,
    targetStub,
    sourceDirection,
    targetDirection,
    route
  })
  const buildRoutePointsForLaneValue = nextLaneValue => {
    const firstLanePoint =
      laneAxis === 'x'
        ? { x: nextLaneValue, y: sourceStub.y }
        : { x: sourceStub.x, y: nextLaneValue }
    const secondLanePoint =
      laneAxis === 'x'
        ? { x: nextLaneValue, y: targetStub.y }
        : { x: targetStub.x, y: nextLaneValue }
    return simplifyFlowchartOrthogonalPoints([
      sourcePoint,
      sourceStub,
      firstLanePoint,
      secondLanePoint,
      targetStub,
      targetPoint
    ])
  }
  const laneCandidates = collectFlowchartLaneCandidateValues({
          axis: laneAxis,
          sourcePoint,
          targetPoint,
          sourceStub,
          targetStub,
          desiredLane: laneValue,
          obstacles,
          ignoredNodeIds
        })
  const resolvedLaneValue =
    route?.orthogonalLane?.axis === laneAxis &&
    Number.isFinite(Number(route?.orthogonalLane?.value))
      ? laneValue
      : laneCandidates.find(candidateLaneValue => {
          const candidatePoints = buildRoutePointsForLaneValue(candidateLaneValue)
          if (
            doesFlowchartPathBacktrackAtEitherEndpoint(
              candidatePoints,
              sourceDirection,
              targetDirection
            )
          ) {
            return false
          }
          if (
            !isFlowchartLaneValueForwardFromStubs({
              axis: laneAxis,
              laneValue: candidateLaneValue,
              sourceStub,
              targetStub,
              sourceDirection,
              targetDirection
            })
          ) {
            return false
          }
          return !doesFlowchartPolylineIntersectObstacles(
            candidatePoints,
            obstacles,
            ignoredNodeIds,
            0
          )
        }) ??
        laneCandidates.find(candidateLaneValue => {
          const candidatePoints = buildRoutePointsForLaneValue(candidateLaneValue)
          return (
            !doesFlowchartPathBacktrackAtEitherEndpoint(
              candidatePoints,
              sourceDirection,
              targetDirection
            ) &&
            isFlowchartLaneValueForwardFromStubs({
              axis: laneAxis,
              laneValue: candidateLaneValue,
              sourceStub,
              targetStub,
              sourceDirection,
              targetDirection
            })
          )
        }) ??
        laneValue
  const firstLanePoint =
    laneAxis === 'x'
      ? { x: resolvedLaneValue, y: sourceStub.y }
      : { x: sourceStub.x, y: resolvedLaneValue }
  const secondLanePoint =
    laneAxis === 'x'
      ? { x: resolvedLaneValue, y: targetStub.y }
      : { x: targetStub.x, y: resolvedLaneValue }
  return finalizeRoute({
    pathPoints: buildRoutePointsForLaneValue(resolvedLaneValue),
    bendHandles: [
      {
        x: firstLanePoint.x,
        y: firstLanePoint.y,
        axis: laneAxis
      },
      {
        x: secondLanePoint.x,
        y: secondLanePoint.y,
        axis: laneAxis
      }
    ],
    route: {
      orthogonalLane: {
        axis: laneAxis,
        value: resolvedLaneValue
      }
    }
  })
}

const getTemplateLayoutPreset = mode => {
  const normalizedMode = String(mode || '').trim()
  return (
    TEMPLATE_LAYOUT_PRESETS[normalizedMode] || TEMPLATE_LAYOUT_PRESETS.document
  )
}

const createTemplateAxisClusters = (values, threshold) => {
  const numericValues = values
    .map(value => Number(value))
    .filter(value => Number.isFinite(value))
    .sort((a, b) => a - b)
  if (!numericValues.length) {
    return []
  }
  return numericValues.reduce((clusters, value) => {
    const lastCluster = clusters[clusters.length - 1]
    if (
      !lastCluster ||
      value - lastCluster.max > threshold ||
      value - lastCluster.min > threshold
    ) {
      clusters.push({
        min: value,
        max: value,
        sum: value,
        count: 1
      })
      return clusters
    }
    lastCluster.max = value
    lastCluster.sum += value
    lastCluster.count += 1
    return clusters
  }, [])
}

const resolveTemplateClusterIndex = (value, clusters) => {
  if (!clusters.length) {
    return 0
  }
  let bestIndex = 0
  let bestDiff = Infinity
  clusters.forEach((cluster, index) => {
    const average = cluster.sum / cluster.count
    const diff = Math.abs(Number(value || 0) - average)
    if (diff < bestDiff) {
      bestDiff = diff
      bestIndex = index
    }
  })
  return bestIndex
}

const createTemplateColumnCenters = (clusters, preset) => {
  return clusters.map((_cluster, index) => {
    return preset.baseX + index * preset.columnGap
  })
}

const TEMPLATE_LAYOUT_VARIANTS = {
  enterpriseDelivery: {
    document: {
      columnGap: 228,
      rowGap: 148
    },
    preview: {
      columnGap: 178,
      rowGap: 118
    }
  },
  supportEscalation: {
    document: {
      columnGap: 224,
      rowGap: 120
    },
    preview: {
      columnGap: 176,
      rowGap: 98
    }
  },
  salesPipeline: {
    document: {
      columnGap: 228,
      rowGap: 120
    },
    preview: {
      columnGap: 180,
      rowGap: 98
    }
  }
}

const getTemplateAxisConfig = orientation => {
  return orientation === 'vertical'
    ? {
        primaryKey: 'y',
        secondaryKey: 'x',
        primarySizeKey: 'height',
        secondarySizeKey: 'width'
      }
    : {
        primaryKey: 'x',
        secondaryKey: 'y',
        primarySizeKey: 'width',
        secondarySizeKey: 'height'
      }
}

const getTemplateNodeAxisStart = (node, key) => Number(node?.[key] || 0)

const getTemplateNodeAxisSize = (node, key) => Number(node?.[key] || 0)

const getTemplateNodeAxisCenter = (node, axisKey, sizeKey) => {
  return (
    getTemplateNodeAxisStart(node, axisKey) +
    getTemplateNodeAxisSize(node, sizeKey) / 2
  )
}

const buildTemplateRelationMaps = templateData => {
  const nodes = Array.isArray(templateData?.nodes) ? templateData.nodes : []
  const nodeLookup = new Map(nodes.map(node => [node.id, node]))
  const incomingMap = new Map(nodes.map(node => [node.id, []]))
  const outgoingMap = new Map(nodes.map(node => [node.id, []]))
  ;(Array.isArray(templateData?.edges) ? templateData.edges : []).forEach(edge => {
    if (!nodeLookup.has(edge?.source) || !nodeLookup.has(edge?.target)) {
      return
    }
    outgoingMap.get(edge.source)?.push(edge.target)
    incomingMap.get(edge.target)?.push(edge.source)
  })
  return {
    nodeLookup,
    incomingMap,
    outgoingMap
  }
}

const resolveTemplateLayoutPreset = (mode, templateId = 'blank') => {
  const basePreset = getTemplateLayoutPreset(mode)
  const templateVariant = TEMPLATE_LAYOUT_VARIANTS[templateId]?.[mode] || {}
  return {
    ...basePreset,
    ...templateVariant
  }
}

const resolveTemplateOrientation = templateData => {
  const nodes = Array.isArray(templateData?.nodes) ? templateData.nodes : []
  if (nodes.length < 2) {
    return 'horizontal'
  }
  const minX = Math.min(...nodes.map(node => Number(node.x || 0)))
  const maxX = Math.max(
    ...nodes.map(node => Number(node.x || 0) + Number(node.width || 0))
  )
  const minY = Math.min(...nodes.map(node => Number(node.y || 0)))
  const maxY = Math.max(
    ...nodes.map(node => Number(node.y || 0) + Number(node.height || 0))
  )
  return maxY - minY > maxX - minX * 1.1 ? 'vertical' : 'horizontal'
}

const sortTemplateNodeIds = (nodeIds, nodeLookup, axisConfig) => {
  return [...nodeIds].sort((firstId, secondId) => {
    const firstNode = nodeLookup.get(firstId)
    const secondNode = nodeLookup.get(secondId)
    if (!firstNode || !secondNode) {
      return 0
    }
    return (
      getTemplateNodeAxisCenter(
        firstNode,
        axisConfig.secondaryKey,
        axisConfig.secondarySizeKey
      ) -
        getTemplateNodeAxisCenter(
          secondNode,
          axisConfig.secondaryKey,
          axisConfig.secondarySizeKey
        ) ||
      getTemplateNodeAxisCenter(
        firstNode,
        axisConfig.primaryKey,
        axisConfig.primarySizeKey
      ) -
        getTemplateNodeAxisCenter(
          secondNode,
          axisConfig.primaryKey,
          axisConfig.primarySizeKey
        )
    )
  })
}

const createTemplateLevelMap = (templateData, axisConfig) => {
  const nodes = Array.isArray(templateData?.nodes) ? templateData.nodes : []
  const relationMaps = buildTemplateRelationMaps(templateData)
  const indegreeMap = new Map(nodes.map(node => [node.id, 0]))
  nodes.forEach(node => {
    ;(relationMaps.outgoingMap.get(node.id) || []).forEach(targetId => {
      indegreeMap.set(targetId, Number(indegreeMap.get(targetId) || 0) + 1)
    })
  })
  const seedNodeIds = sortTemplateNodeIds(
    nodes
      .filter(node => node.type === 'start' || !Number(indegreeMap.get(node.id) || 0))
      .map(node => node.id),
    relationMaps.nodeLookup,
    axisConfig
  )
  const pendingIds = seedNodeIds.length
    ? [...seedNodeIds]
    : sortTemplateNodeIds(
        nodes.slice(0, 1).map(node => node.id),
        relationMaps.nodeLookup,
        axisConfig
      )
  const seenIds = new Set(pendingIds)
  const topoOrder = []
  while (pendingIds.length) {
    const currentId = pendingIds.shift()
    topoOrder.push(currentId)
    ;(relationMaps.outgoingMap.get(currentId) || []).forEach(targetId => {
      indegreeMap.set(targetId, Number(indegreeMap.get(targetId) || 0) - 1)
      if (!Number(indegreeMap.get(targetId) || 0) && !seenIds.has(targetId)) {
        seenIds.add(targetId)
        pendingIds.push(targetId)
      }
    })
    pendingIds.sort((firstId, secondId) => {
      const firstNode = relationMaps.nodeLookup.get(firstId)
      const secondNode = relationMaps.nodeLookup.get(secondId)
      if (!firstNode || !secondNode) {
        return 0
      }
      return (
        getTemplateNodeAxisCenter(
          firstNode,
          axisConfig.secondaryKey,
          axisConfig.secondarySizeKey
        ) -
          getTemplateNodeAxisCenter(
            secondNode,
            axisConfig.secondaryKey,
            axisConfig.secondarySizeKey
          ) ||
        getTemplateNodeAxisCenter(
          firstNode,
          axisConfig.primaryKey,
          axisConfig.primarySizeKey
        ) -
          getTemplateNodeAxisCenter(
            secondNode,
            axisConfig.primaryKey,
            axisConfig.primarySizeKey
          )
      )
    })
  }
  nodes.forEach(node => {
    if (!topoOrder.includes(node.id)) {
      topoOrder.push(node.id)
    }
  })
  const levelMap = new Map(nodes.map(node => [node.id, 0]))
  topoOrder.forEach(nodeId => {
    const currentLevel = Number(levelMap.get(nodeId) || 0)
    ;(relationMaps.outgoingMap.get(nodeId) || []).forEach(targetId => {
      const nextLevel = currentLevel + 1
      if (nextLevel > Number(levelMap.get(targetId) || 0)) {
        levelMap.set(targetId, nextLevel)
      }
    })
  })
  return {
    levelMap,
    relationMaps
  }
}

const sortTemplateLevelNodes = (levelNodes, { relationMaps, axisConfig, previousOrderMap = null } = {}) => {
  return [...levelNodes].sort((firstNode, secondNode) => {
    const getWeight = currentNode => {
      const parentOrders = (relationMaps.incomingMap.get(currentNode.id) || [])
        .map(parentId => previousOrderMap?.get(parentId))
        .filter(value => value !== undefined)
      if (parentOrders.length) {
        return parentOrders.reduce((sum, value) => sum + value, 0) / parentOrders.length
      }
      return getTemplateNodeAxisCenter(
        currentNode,
        axisConfig.secondaryKey,
        axisConfig.secondarySizeKey
      )
    }
    return (
      getWeight(firstNode) - getWeight(secondNode) ||
      getTemplateNodeAxisCenter(
        firstNode,
        axisConfig.secondaryKey,
        axisConfig.secondarySizeKey
      ) -
        getTemplateNodeAxisCenter(
          secondNode,
          axisConfig.secondaryKey,
          axisConfig.secondarySizeKey
        )
    )
  })
}

const _layoutTemplateByGraphLevels = (
  templateData,
  { mode = 'document', templateId = 'blank' } = {}
) => {
  const nodes = Array.isArray(templateData?.nodes) ? templateData.nodes : []
  const edges = Array.isArray(templateData?.edges) ? templateData.edges : []
  if (nodes.length <= 0) {
    return
  }
  if (edges.length <= 0) {
    compactTemplateGridLayout(templateData, resolveTemplateLayoutPreset(mode, templateId))
    return
  }
  const orientation = resolveTemplateOrientation(templateData)
  const axisConfig = getTemplateAxisConfig(orientation)
  const preset = resolveTemplateLayoutPreset(mode, templateId)
  const { levelMap, relationMaps } = createTemplateLevelMap(templateData, axisConfig)
  const groupedLevels = Array.from(
    nodes.reduce((result, node) => {
      const level = Number(levelMap.get(node.id) || 0)
      if (!result.has(level)) {
        result.set(level, [])
      }
      result.get(level).push(node)
      return result
    }, new Map())
  ).sort((first, second) => first[0] - second[0])

  let previousOrderMap = null
  groupedLevels.forEach(([levelIndex, levelNodes]) => {
    const sortedNodes = sortTemplateLevelNodes(levelNodes, {
      relationMaps,
      axisConfig,
      previousOrderMap
    })
    const totalSecondarySize = sortedNodes.reduce((sum, node, nodeIndex) => {
      return (
        sum +
        getTemplateNodeAxisSize(node, axisConfig.secondarySizeKey) +
        (nodeIndex > 0
          ? orientation === 'horizontal'
            ? preset.rowGap
            : preset.columnGap
          : 0)
      )
    }, 0)
    let secondaryCursor = preset.baseY
    if (orientation === 'vertical') {
      secondaryCursor = preset.baseX
    }
    sortedNodes.forEach((node, nodeIndex) => {
      const primaryCenter =
        (orientation === 'horizontal' ? preset.baseX : preset.baseY) +
        levelIndex *
          (orientation === 'horizontal' ? preset.columnGap : preset.rowGap)
      const secondaryStart =
        secondaryCursor +
        (nodeIndex > 0
          ? orientation === 'horizontal'
            ? preset.rowGap
            : preset.columnGap
          : 0)
      secondaryCursor =
        secondaryStart + getTemplateNodeAxisSize(node, axisConfig.secondarySizeKey)
      const secondaryPosition =
        secondaryStart +
        Math.max(0, totalSecondarySize > 0 ? 0 : 0)
      if (orientation === 'horizontal') {
        node.x = snapTemplateCoordinate(primaryCenter - Number(node.width || 0) / 2)
        node.y = snapTemplateCoordinate(secondaryPosition)
      } else {
        node.x = snapTemplateCoordinate(secondaryPosition)
        node.y = snapTemplateCoordinate(primaryCenter - Number(node.height || 0) / 2)
      }
    })
    previousOrderMap = new Map(sortedNodes.map((node, index) => [node.id, index]))
  })
}

const compactTemplateGridLayout = (templateData, preset) => {
  const nodes = Array.isArray(templateData?.nodes) ? templateData.nodes : []
  if (nodes.length <= 0) {
    return
  }
  const xClusters = createTemplateAxisClusters(
    nodes.map(node => getNodeCenter(node).x),
    preset.columnThreshold
  )
  const yClusters = createTemplateAxisClusters(
    nodes.map(node => getTemplateRowAnchor(node)),
    preset.rowThreshold
  )
  const columnCenters = createTemplateColumnCenters(xClusters, preset)
  const rowCenters = yClusters.map((_cluster, index) => {
    return preset.baseY + index * preset.rowGap
  })

  nodes.forEach(node => {
    const center = getNodeCenter(node)
    const columnIndex = resolveTemplateClusterIndex(center.x, xClusters)
    const rowIndex = resolveTemplateClusterIndex(getTemplateRowAnchor(node), yClusters)
    node.x = snapTemplateCoordinate(
      Number(columnCenters[columnIndex] || preset.baseX) -
        Number(node.width || 0) / 2
    )
    node.y = snapTemplateCoordinate(
      Number(rowCenters[rowIndex] || preset.baseY) - Number(node.height || 0) / 2
    )
  })
}

const compactTemplateLayout = (templateData, mode = 'document', templateId = 'blank') => {
  compactTemplateGridLayout(
    templateData,
    resolveTemplateLayoutPreset(mode, templateId)
  )
}

const alignTemplateColumnNodes = templateData => {
  const nodes = Array.isArray(templateData?.nodes) ? templateData.nodes : []
  const edges = Array.isArray(templateData?.edges) ? templateData.edges : []
  if (nodes.length <= 1 || edges.length <= 0) {
    return
  }

  const nodeLookup = new Map(nodes.map(node => [node.id, node]))
  const adjacencyMap = new Map(nodes.map(node => [node.id, new Set()]))

  edges.forEach(edge => {
    const sourceNode = nodeLookup.get(edge?.source)
    const targetNode = nodeLookup.get(edge?.target)
    if (!sourceNode || !targetNode) {
      return
    }
    const sourceCenter = getNodeCenter(sourceNode)
    const targetCenter = getNodeCenter(targetNode)
    const deltaX = Math.abs(targetCenter.x - sourceCenter.x)
    const deltaY = Math.abs(targetCenter.y - sourceCenter.y)
    if (deltaY <= deltaX) {
      return
    }
    if (deltaX > TEMPLATE_COLUMN_ALIGNMENT_THRESHOLD) {
      return
    }
    adjacencyMap.get(sourceNode.id)?.add(targetNode.id)
    adjacencyMap.get(targetNode.id)?.add(sourceNode.id)
  })

  const visited = new Set()
  nodes.forEach(node => {
    if (visited.has(node.id)) {
      return
    }
    const queue = [node.id]
    const groupIds = []
    visited.add(node.id)
    while (queue.length > 0) {
      const currentId = queue.shift()
      groupIds.push(currentId)
      ;(adjacencyMap.get(currentId) || []).forEach(nextId => {
        if (visited.has(nextId)) {
          return
        }
        visited.add(nextId)
        queue.push(nextId)
      })
    }

    if (groupIds.length < 2) {
      return
    }

    const groupNodes = groupIds.map(nodeId => nodeLookup.get(nodeId)).filter(Boolean)
    const averageCenterX =
      groupNodes.reduce((sum, currentNode) => sum + getNodeCenter(currentNode).x, 0) /
      groupNodes.length
    groupNodes.forEach(groupNode => {
      groupNode.x = snapTemplateCoordinate(
        averageCenterX - Number(groupNode.width || 0) / 2
      )
    })
  })
}

const alignTemplateMergeNodes = templateData => {
  const nodes = Array.isArray(templateData?.nodes) ? templateData.nodes : []
  const edges = Array.isArray(templateData?.edges) ? templateData.edges : []
  if (nodes.length <= 0 || edges.length <= 0) {
    return
  }

  const nodeLookup = new Map(nodes.map(node => [node.id, node]))
  const incomingEdgeMap = new Map()
  edges.forEach(edge => {
    const targetId = String(edge?.target || '').trim()
    if (!targetId) {
      return
    }
    const edgeList = incomingEdgeMap.get(targetId) || []
    edgeList.push(edge)
    incomingEdgeMap.set(targetId, edgeList)
  })

  nodes.forEach(node => {
    const incomingEdges = incomingEdgeMap.get(node.id) || []
    if (incomingEdges.length < 2) {
      return
    }
    const sourceNodes = incomingEdges
      .map(edge => nodeLookup.get(edge.source))
      .filter(Boolean)
    if (sourceNodes.length < 2) {
      return
    }
    const sourceCenters = sourceNodes.map(getNodeCenter)
    const minSourceX = Math.min(...sourceCenters.map(point => point.x))
    const maxSourceX = Math.max(...sourceCenters.map(point => point.x))
    const maxSourceY = Math.max(...sourceCenters.map(point => point.y))
    const currentCenter = getNodeCenter(node)

    if (maxSourceX - minSourceX < 120) {
      return
    }
    if (currentCenter.y <= maxSourceY + 24) {
      return
    }

    const averageCenterX =
      sourceCenters.reduce((sum, point) => sum + point.x, 0) / sourceCenters.length
    node.x = snapTemplateCoordinate(averageCenterX - Number(node.width || 0) / 2)
  })
}

const resolveTemplateNodeOverlaps = templateData => {
  const nodes = Array.isArray(templateData?.nodes) ? templateData.nodes : []
  if (nodes.length < 2) {
    return
  }
  const horizontalGap = 24
  const verticalGap = 24
  for (let pass = 0; pass < 4; pass += 1) {
    let hasAdjustment = false
    const sortedNodes = [...nodes].sort((firstNode, secondNode) => {
      return (
        Number(firstNode.y || 0) - Number(secondNode.y || 0) ||
        Number(firstNode.x || 0) - Number(secondNode.x || 0)
      )
    })
    for (let index = 0; index < sortedNodes.length; index += 1) {
      const currentNode = sortedNodes[index]
      for (let nextIndex = index + 1; nextIndex < sortedNodes.length; nextIndex += 1) {
        const nextNode = sortedNodes[nextIndex]
        const overlapX =
          Math.min(
            Number(currentNode.x || 0) + Number(currentNode.width || 0),
            Number(nextNode.x || 0) + Number(nextNode.width || 0)
          ) - Math.max(Number(currentNode.x || 0), Number(nextNode.x || 0))
        const overlapY =
          Math.min(
            Number(currentNode.y || 0) + Number(currentNode.height || 0),
            Number(nextNode.y || 0) + Number(nextNode.height || 0)
          ) - Math.max(Number(currentNode.y || 0), Number(nextNode.y || 0))
        if (overlapX <= 0.001 || overlapY <= 0.001) {
          continue
        }
        const currentCenter = getNodeCenter(currentNode)
        const nextCenter = getNodeCenter(nextNode)
        if (Math.abs(nextCenter.x - currentCenter.x) >= Math.abs(nextCenter.y - currentCenter.y)) {
          nextNode.x = snapTemplateCoordinate(Number(nextNode.x || 0) + overlapX + horizontalGap)
        } else {
          nextNode.y = snapTemplateCoordinate(Number(nextNode.y || 0) + overlapY + verticalGap)
        }
        hasAdjustment = true
      }
    }
    if (!hasAdjustment) {
      break
    }
  }
}

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

const normalizeFlowchartBackgroundStyle = value => {
  const normalizedValue = String(value || '').trim()
  if (FLOWCHART_BACKGROUND_STYLES.includes(normalizedValue)) {
    return normalizedValue
  }
  return DEFAULT_FLOWCHART_CONFIG.backgroundStyle
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
  const dashPattern = normalizeFlowchartEdgeDashPattern(
    edge?.style?.dashPattern,
    edge?.style?.dashed
  )
  return {
    stroke: getStyleColor(edge?.style?.stroke, resolvedTheme.edgeStroke),
    labelColor: getStyleColor(edge?.style?.labelColor, resolvedTheme.edgeLabelColor),
    dashed: dashPattern !== 'solid',
    dashPattern,
    dashArray: getFlowchartEdgeDashArray(dashPattern),
    arrowSize: normalizeFlowchartEdgeArrowSize(edge?.style?.arrowSize),
    arrowCount: normalizeFlowchartEdgeArrowCount(edge?.style?.arrowCount),
    pathType: strictAlignment
      ? 'orthogonal'
      : ['straight', 'curved', 'orthogonal'].includes(pathType)
        ? pathType
        : 'orthogonal'
  }
}

export function normalizeFlowchartNodeAnchor(anchor) {
  if (!anchor || typeof anchor !== 'object') {
    return null
  }
  const xRatio = Number(anchor.xRatio)
  const yRatio = Number(anchor.yRatio)
  if (!Number.isFinite(xRatio) || !Number.isFinite(yRatio)) {
    return null
  }
  const nextAnchor = {
    xRatio: Math.max(0, Math.min(1, xRatio)),
    yRatio: Math.max(0, Math.min(1, yRatio))
  }
  const handleKey = String(anchor.handleKey || '').trim()
  if (handleKey) {
    nextAnchor.handleKey = handleKey
  }
  const direction = String(anchor.direction || '').trim()
  if (['top', 'right', 'bottom', 'left'].includes(direction)) {
    nextAnchor.direction = direction
  }
  const directions = Array.isArray(anchor.directions)
    ? anchor.directions
        .map(item => String(item || '').trim())
        .filter(item => ['top', 'right', 'bottom', 'left'].includes(item))
    : []
  if (directions.length > 0) {
    nextAnchor.directions = [...new Set(directions)]
  }
  if (anchor.locked === true) {
    nextAnchor.locked = true
  }
  return nextAnchor
}

const isFlowchartAnchorLocked = anchor => {
  return normalizeFlowchartNodeAnchor(anchor)?.locked === true
}

const getFlowchartAnchorDirectionalCandidates = anchor => {
  const normalizedAnchor = normalizeFlowchartNodeAnchor(anchor)
  if (!normalizedAnchor) {
    return []
  }
  if (Array.isArray(normalizedAnchor.directions) && normalizedAnchor.directions.length > 0) {
    return normalizedAnchor.directions
  }
  if (normalizedAnchor.direction) {
    return [normalizedAnchor.direction]
  }
  const distances = [
    { edge: 'left', distance: normalizedAnchor.xRatio },
    { edge: 'right', distance: 1 - normalizedAnchor.xRatio },
    { edge: 'top', distance: normalizedAnchor.yRatio },
    { edge: 'bottom', distance: 1 - normalizedAnchor.yRatio }
  ].sort((first, second) => first.distance - second.distance)
  return [distances[0]?.edge || 'right']
}

export const getFlowchartAnchorHandleKey = (anchor, fallbackHandle = 'right') => {
  const normalizedAnchor = normalizeFlowchartNodeAnchor(anchor)
  if (!normalizedAnchor) {
    return fallbackHandle
  }
  if (
    ['top', 'right', 'bottom', 'left'].includes(
      String(normalizedAnchor.handleKey || '').trim()
    )
  ) {
    return normalizedAnchor.handleKey
  }
  return getFlowchartAnchorDirectionalCandidates(normalizedAnchor)[0] || fallbackHandle
}

export const getFlowchartAnchorDirection = (anchor, fallbackDirection = 'right') => {
  const candidates = getFlowchartAnchorDirectionalCandidates(anchor)
  if (!candidates.length) {
    return fallbackDirection
  }
  return candidates[0]
}

export const resolveFlowchartAnchorDirection = (
  anchor,
  originPoint = null,
  referencePoint = null,
  fallbackDirection = 'right'
) => {
  void originPoint
  void referencePoint
  return getFlowchartAnchorDirection(anchor, fallbackDirection)
}

const CACHED_FLOWCHART_NODE_ANCHOR_PRESETS = [
  {
    handleKey: 'top',
    xRatio: 0.5,
    yRatio: 0,
    direction: 'top'
  },
  {
    handleKey: 'right',
    xRatio: 1,
    yRatio: 0.5,
    direction: 'right'
  },
  {
    handleKey: 'bottom',
    xRatio: 0.5,
    yRatio: 1,
    direction: 'bottom'
  },
  {
    handleKey: 'left',
    xRatio: 0,
    yRatio: 0.5,
    direction: 'left'
  }
].map(normalizeFlowchartNodeAnchor)

export const getFlowchartNodeAnchorPresets = _node => {
  return CACHED_FLOWCHART_NODE_ANCHOR_PRESETS
}

const getFlowchartPresetAnchorByDirection = (node, direction, referencePoint = null) => {
  void referencePoint
  const directionKey = String(direction || '').trim()
  return (
    getFlowchartNodeAnchorPresets(node).find(anchor => {
      return (
        anchor?.handleKey === directionKey ||
        anchor?.direction === directionKey ||
        anchor?.directions?.includes(directionKey)
      )
    }) || null
  )
}

const getClosestFlowchartPresetAnchor = (node, anchor) => {
  const normalizedAnchor = normalizeFlowchartNodeAnchor(anchor)
  if (!normalizedAnchor) {
    return null
  }
  const presetAnchors = getFlowchartNodeAnchorPresets(node)
  return (
    presetAnchors.find(item => item?.handleKey === normalizedAnchor.handleKey) ||
    presetAnchors
      .map(item => ({
        anchor: item,
        distance: Math.hypot(
          Number(item?.xRatio || 0) - normalizedAnchor.xRatio,
          Number(item?.yRatio || 0) - normalizedAnchor.yRatio
        )
      }))
      .sort((first, second) => first.distance - second.distance)[0]?.anchor ||
    null
  )
}

const getFlowchartPresetAnchorPoint = (node, anchor) => {
  const resolvedAnchor =
    typeof anchor === 'string'
      ? getFlowchartPresetAnchorByDirection(node, anchor)
      : getClosestFlowchartPresetAnchor(node, anchor)
  if (!resolvedAnchor) {
    return null
  }
  const x = Number(node?.x || 0)
  const y = Number(node?.y || 0)
  const width = Number(node?.width || 0)
  const height = Number(node?.height || 0)
  const handleKey = String(resolvedAnchor.handleKey || resolvedAnchor.direction || '').trim()
  if (node?.type === 'input') {
    const offset = Math.max(width * 0.12, 16)
    if (handleKey === 'top') {
      return {
        x: x + (offset + width) / 2,
        y
      }
    }
    if (handleKey === 'right') {
      return {
        x: x + width - offset / 2,
        y: y + height / 2
      }
    }
    if (handleKey === 'bottom') {
      return {
        x: x + (width - offset) / 2,
        y: y + height
      }
    }
    if (handleKey === 'left') {
      return {
        x: x + offset / 2,
        y: y + height / 2
      }
    }
  }
  return {
    x: x + width * Number(resolvedAnchor.xRatio || 0),
    y: y + height * Number(resolvedAnchor.yRatio || 0)
  }
}

export const getFlowchartNodeConnectionPoint = (
  node,
  direction = 'right',
  referencePoint = null
) => {
  void referencePoint
  return (
    getFlowchartPresetAnchorPoint(node, direction) ||
    getFlowchartPresetAnchorPoint(node, 'right') || { x: 0, y: 0 }
  )
}

const createFlowchartDirectionalPair = orientation => {
  if (orientation === 'horizontal') {
    return (deltaX, _deltaY) => {
      return deltaX >= 0
        ? { sourceDirection: 'right', targetDirection: 'left' }
        : { sourceDirection: 'left', targetDirection: 'right' }
    }
  }
  return (_deltaX, deltaY) => {
    return deltaY >= 0
      ? { sourceDirection: 'bottom', targetDirection: 'top' }
      : { sourceDirection: 'top', targetDirection: 'bottom' }
  }
}

const hasEnoughForwardSpaceForOrientation = ({
  sourceNode,
  targetNode,
  deltaX,
  deltaY,
  orientation
}) => {
  if (orientation === 'horizontal') {
    const sourceExitX =
      deltaX >= 0 ? Number(sourceNode?.x || 0) + Number(sourceNode?.width || 0) : Number(sourceNode?.x || 0)
    const targetEntryX =
      deltaX >= 0 ? Number(targetNode?.x || 0) : Number(targetNode?.x || 0) + Number(targetNode?.width || 0)
    return Math.abs(targetEntryX - sourceExitX) >= MIN_ORTHOGONAL_TURN_SPAN
  }
  const sourceExitY =
    deltaY >= 0 ? Number(sourceNode?.y || 0) + Number(sourceNode?.height || 0) : Number(sourceNode?.y || 0)
  const targetEntryY =
    deltaY >= 0 ? Number(targetNode?.y || 0) : Number(targetNode?.y || 0) + Number(targetNode?.height || 0)
  return Math.abs(targetEntryY - sourceExitY) >= MIN_ORTHOGONAL_TURN_SPAN
}

const resolveFlowchartOrientationForwardSpace = ({
  sourceNode,
  targetNode,
  deltaX,
  deltaY,
  orientation
}) => {
  if (
    orientation === 'horizontal' &&
    Math.abs(deltaY) > FLOWCHART_AXIS_ALIGNMENT_TOLERANCE &&
    !hasEnoughForwardSpaceForOrientation({
      sourceNode,
      targetNode,
      deltaX,
      deltaY,
      orientation: 'horizontal'
    })
  ) {
    return 'vertical'
  }
  if (
    orientation === 'vertical' &&
    Math.abs(deltaX) > FLOWCHART_AXIS_ALIGNMENT_TOLERANCE &&
    !hasEnoughForwardSpaceForOrientation({
      sourceNode,
      targetNode,
      deltaX,
      deltaY,
      orientation: 'vertical'
    })
  ) {
    return 'horizontal'
  }
  return orientation
}

const resolveFlowchartEdgeDirections = (sourceNode, targetNode, previousDirections = null) => {
  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)
  const deltaX = targetCenter.x - sourceCenter.x
  const deltaY = targetCenter.y - sourceCenter.y
  const absoluteDeltaX = Math.abs(deltaX)
  const absoluteDeltaY = Math.abs(deltaY)
  const preferredOrientation =
    previousDirections?.sourceDirection === 'left' ||
    previousDirections?.sourceDirection === 'right'
      ? 'horizontal'
      : previousDirections?.sourceDirection === 'top' ||
          previousDirections?.sourceDirection === 'bottom'
        ? 'vertical'
        : ''
  if (preferredOrientation === 'horizontal') {
    if (absoluteDeltaY > absoluteDeltaX + FLOWCHART_EDGE_DIRECTION_HYSTERESIS) {
      return createFlowchartDirectionalPair('vertical')(deltaX, deltaY)
    }
    return createFlowchartDirectionalPair(
      resolveFlowchartOrientationForwardSpace({
        sourceNode,
        targetNode,
        deltaX,
        deltaY,
        orientation: 'horizontal'
      })
    )(deltaX, deltaY)
  }
  if (preferredOrientation === 'vertical') {
    if (absoluteDeltaX > absoluteDeltaY + FLOWCHART_EDGE_DIRECTION_HYSTERESIS) {
      return createFlowchartDirectionalPair('horizontal')(deltaX, deltaY)
    }
    return createFlowchartDirectionalPair(
      resolveFlowchartOrientationForwardSpace({
        sourceNode,
        targetNode,
        deltaX,
        deltaY,
        orientation: 'vertical'
      })
    )(deltaX, deltaY)
  }
  if (absoluteDeltaX > absoluteDeltaY + FLOWCHART_EDGE_DIRECTION_AMBIGUOUS_THRESHOLD) {
    return createFlowchartDirectionalPair(
      resolveFlowchartOrientationForwardSpace({
        sourceNode,
        targetNode,
        deltaX,
        deltaY,
        orientation: 'horizontal'
      })
    )(deltaX, deltaY)
  }
  if (absoluteDeltaY > absoluteDeltaX + FLOWCHART_EDGE_DIRECTION_AMBIGUOUS_THRESHOLD) {
    return createFlowchartDirectionalPair(
      resolveFlowchartOrientationForwardSpace({
        sourceNode,
        targetNode,
        deltaX,
        deltaY,
        orientation: 'vertical'
      })
    )(deltaX, deltaY)
  }
  const maxNodeWidth = Math.max(
    Number(sourceNode?.width || 0),
    Number(targetNode?.width || 0)
  )
  const maxNodeHeight = Math.max(
    Number(sourceNode?.height || 0),
    Number(targetNode?.height || 0)
  )
  const spansMultipleColumns = absoluteDeltaX > maxNodeWidth
  const spansMultipleRows = absoluteDeltaY > maxNodeHeight
  if (spansMultipleColumns && spansMultipleRows) {
    return createFlowchartDirectionalPair(
      resolveFlowchartOrientationForwardSpace({
        sourceNode,
        targetNode,
        deltaX,
        deltaY,
        orientation: 'vertical'
      })
    )(deltaX, deltaY)
  }
  const fallbackOrientation = absoluteDeltaX >= absoluteDeltaY ? 'horizontal' : 'vertical'
  return createFlowchartDirectionalPair(
    resolveFlowchartOrientationForwardSpace({
      sourceNode,
      targetNode,
      deltaX,
      deltaY,
      orientation: fallbackOrientation
    })
  )(deltaX, deltaY)
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

const _createFlowchartEdgeLabelPlacement = ({
  startPoint,
  endPoint,
  preferredSide = 'right',
  labelPosition = null
} = {}) => {
  void preferredSide
  return createFlowchartEdgeLabelPlacementFromPoints(
    [startPoint, endPoint],
    {
      preferredSide,
      labelPosition
    }
  )
}

export const getFlowchartEdgeLayout = (edge, sourceNode, targetNode, options = {}) => {
  const style = getFlowchartEdgeVisualStyle(edge, options)
  const autoDirections = resolveFlowchartEdgeDirections(
    sourceNode,
    targetNode,
    options?.lockedDirections || null
  )
  const lockedSourceAnchor = isFlowchartAnchorLocked(edge?.sourceAnchor)
    ? edge.sourceAnchor
    : null
  const lockedTargetAnchor = isFlowchartAnchorLocked(edge?.targetAnchor)
    ? edge.targetAnchor
    : null
  const connectionLayout = resolveFlowchartConnectionLayout({
    edge,
    sourceNode,
    targetNode,
    style,
    lockedSourceAnchor,
    lockedTargetAnchor,
    autoDirections,
    options
  })
  const {
    sourcePoint,
    targetPoint,
    sourceDirection,
    targetDirection,
    path,
    pathPoints,
    bendHandles,
    route
  } = connectionLayout
  const preferredSide = targetPoint.x < sourcePoint.x ? 'left' : 'right'
  const labelPlacement = createFlowchartEdgeLabelPlacementFromPoints(pathPoints, {
    preferredSide,
    label: edge?.label,
    labelPosition: edge?.labelPosition
  })
  return {
    path,
    ...labelPlacement,
    sourcePoint,
    targetPoint,
    sourceDirection,
    targetDirection,
    pathPoints,
    bendHandles,
    route,
    arrowMarkers: getFlowchartArrowMarkersFromPoints(pathPoints, style),
    style
  }
}

const LABEL_TEXT_REGEX_WHITESPACE = /\s/
const LABEL_TEXT_REGEX_CJK = /[\u1100-\u9fff\u3040-\u30ff\uac00-\ud7af]/
const LABEL_TEXT_REGEX_WIDE = /[MW@#%&]/

export const getFlowchartLabelTextUnits = label => {
  return Array.from(String(label || '')).reduce((total, char) => {
    if (LABEL_TEXT_REGEX_WHITESPACE.test(char)) {
      return total + 0.45
    }
    if (LABEL_TEXT_REGEX_CJK.test(char)) {
      return total + 1.7
    }
    if (LABEL_TEXT_REGEX_WIDE.test(char)) {
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

export const getFlowchartArrowHeadPath = marker => {
  const arrowSize = normalizeFlowchartEdgeArrowSize(marker?.size)
  const length = Math.round(6 * arrowSize * 100) / 100
  const halfWidth = Math.round(2.8 * arrowSize * 100) / 100
  return `M 0 0 L ${-length} ${halfWidth} L ${-length} ${-halfWidth} Z`
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

const buildSvgLaneMarkup = (lane, { theme = null, flowchartConfig = null } = {}) => {
  void lane
  void theme
  void flowchartConfig
  return ''
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
  nextConfig.backgroundStyle = normalizeFlowchartBackgroundStyle(
    nextConfig.backgroundStyle
  )
  delete nextConfig.laneBackgroundStyle
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
    templateFactory(String(title || DEFAULT_FLOWCHART_TITLE)),
    {
      mode: 'document',
      templateId
    }
  )
  return normalizeFlowchartData({
    ...templateData,
    title: String(title || templateData.title || DEFAULT_FLOWCHART_TITLE),
    templateId
  })
}

export const createFlowchartTemplatePreviewData = (
  title = DEFAULT_FLOWCHART_TITLE,
  templateId = 'blank'
) => {
  const templateFactory =
    FLOWCHART_TEMPLATES[templateId] || FLOWCHART_TEMPLATES.blank
  const templateData = normalizeTemplateLayout(
    templateFactory(String(title || DEFAULT_FLOWCHART_TITLE)),
    {
      mode: 'preview',
      templateId
    }
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
  { paddingX = 120, paddingY = 120, edgeLayouts = [] } = {}
) => {
  const nodes = Array.isArray(flowchartData?.nodes) ? flowchartData.nodes : []
  const lanes = Array.isArray(flowchartData?.lanes) ? flowchartData.lanes : []
  const items = [...lanes, ...nodes]
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
  let hasContent = items.length > 0
  const extendBoundsWithPoint = point => {
    const x = Number(point?.x)
    const y = Number(point?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return
    }
    bounds.minX = Math.min(bounds.minX, x)
    bounds.minY = Math.min(bounds.minY, y)
    bounds.maxX = Math.max(bounds.maxX, x)
    bounds.maxY = Math.max(bounds.maxY, y)
    hasContent = true
  }
  const extendBoundsWithRect = rect => {
    const x = Number(rect?.x)
    const y = Number(rect?.y)
    const width = Number(rect?.width)
    const height = Number(rect?.height)
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height)
    ) {
      return
    }
    bounds.minX = Math.min(bounds.minX, x)
    bounds.minY = Math.min(bounds.minY, y)
    bounds.maxX = Math.max(bounds.maxX, x + width)
    bounds.maxY = Math.max(bounds.maxY, y + height)
    hasContent = true
  }
  edgeLayouts.forEach(entry => {
    const edge = entry?.edge || entry
    const layout = entry?.layout || entry
    ;(Array.isArray(layout?.pathPoints) ? layout.pathPoints : []).forEach(
      extendBoundsWithPoint
    )
    ;(Array.isArray(layout?.arrowMarkers) ? layout.arrowMarkers : []).forEach(marker => {
      const arrowReach = Math.max(6, Number(marker?.size || 1) * 6)
      extendBoundsWithRect({
        x: Number(marker?.x || 0) - arrowReach,
        y: Number(marker?.y || 0) - arrowReach,
        width: arrowReach * 2,
        height: arrowReach * 2
      })
    })
    if (edge?.label) {
      extendBoundsWithRect(
        getFlowchartEdgeLabelBox({
          ...layout,
          edge
        })
      )
    }
  })
  if (!hasContent) {
    return {
      x: 0,
      y: 0,
      width: 1200,
      height: 720
    }
  }
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
  const normalizedConfig = normalizeFlowchartConfig(
    flowchartConfig,
    normalizedData.templateId
  )
  const theme = resolveFlowchartThemeFromConfig(
    normalizedConfig,
    normalizedData.templateId,
    { isDark }
  )
  const edgeItems = normalizedData.edges
    .map(edge => {
      const sourceNode = normalizedData.nodes.find(node => node.id === edge.source)
      const targetNode = normalizedData.nodes.find(node => node.id === edge.target)
      if (!sourceNode || !targetNode) return null
      return {
        edge,
        layout: getFlowchartEdgeLayout(edge, sourceNode, targetNode, {
          theme,
          strictAlignment: !!normalizedConfig.strictAlignment,
          nodes: normalizedData.nodes
        })
      }
    })
    .filter(Boolean)
  const bounds = getFlowchartExportBounds(normalizedData, {
    paddingX,
    paddingY,
    edgeLayouts: edgeItems
  })
  const backgroundStyle = normalizeFlowchartBackgroundStyle(
    normalizedConfig.backgroundStyle
  )
  const backgroundPatternId = `flowchart-bg-${createSvgSafeId(
    `${normalizedData.title || 'document'}-${backgroundStyle}`
  )}`
  const backgroundPatternDefs =
    backgroundStyle === 'dots'
      ? `<pattern id="${backgroundPatternId}" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="${escapeXml(
          theme.canvasBg
        )}"/><circle cx="2" cy="2" r="1.4" fill="${escapeXml(
          theme.gridColor
        )}"/></pattern>`
      : backgroundStyle === 'grid'
      ? `<pattern id="${backgroundPatternId}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${escapeXml(
          theme.canvasBg
        )}"/><path d="M 24 0 L 0 0 0 24" fill="none" stroke="${escapeXml(
          theme.gridColor
        )}" stroke-width="1"/></pattern>`
      : ''
  const edges = edgeItems
    .map(({ edge, layout }) => {
      const dash = layout.style.dashArray ? ` stroke-dasharray="${layout.style.dashArray}"` : ''
      const label = edge.label
        ? `<text x="${layout.labelX}" y="${layout.labelY}" font-size="14" font-weight="700" fill="${escapeXml(layout.style.labelColor)}" stroke="${escapeXml(theme.canvasBg)}" stroke-width="4" paint-order="stroke" stroke-linejoin="round" text-anchor="middle" dominant-baseline="middle">${escapeXml(edge.label)}</text>`
        : ''
      return `<g><path d="${layout.path}" fill="none" stroke="${escapeXml(layout.style.stroke)}" stroke-width="2"${dash}/>${label}</g>`
    })
    .join('')
  const arrows = edgeItems
    .map(({ layout }) => {
      return (layout.arrowMarkers || [])
        .map(marker => {
          return `<path class="flowchart-arrow-head" d="${getFlowchartArrowHeadPath(
            marker
          )}" transform="translate(${marker.x} ${marker.y}) rotate(${marker.angle})" fill="${escapeXml(layout.style.stroke)}"/>`
        })
        .join('')
    })
    .join('')
  const lanes = normalizedData.lanes
    .map(lane =>
      buildSvgLaneMarkup(lane, {
        theme,
        flowchartConfig: normalizedConfig
      })
    )
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
        Number(node.y || 0) + Number(node.height || 0) / 2
      }" font-size="16" fill="${escapeXml(visualStyle.textColor)}" text-anchor="middle" dominant-baseline="middle">${escapeXml(node.text)}</text></g>`
    })
    .join('')
  const background = transparent
    ? ''
    : `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${
        backgroundStyle === 'grid'
          ? `url(#${backgroundPatternId})`
          : backgroundStyle === 'dots'
            ? `url(#${backgroundPatternId})`
          : theme.canvasBg
      }"/>`
  const arrowLayer = arrows ? `<g class="flowchart-arrow-layer">${arrows}</g>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"><defs>${backgroundPatternDefs}</defs>${background}${lanes}${edges}${nodes}${arrowLayer}</svg>`
}

export const getFlowchartTemplateIds = () => Object.keys(FLOWCHART_TEMPLATES)
