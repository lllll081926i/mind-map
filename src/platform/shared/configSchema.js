import { getDefaultAiConfig } from '@/utils/aiProviders.mjs'

export const DESKTOP_STATE_VERSION = 1
export const DEFAULT_MIND_MAP_THEME_TEMPLATE = 'classic4'
export const DEFAULT_MIND_MAP_LAYOUT = 'logicalStructure'

export const DEFAULT_LOCAL_CONFIG = {
  isZenMode: false,
  openNodeRichText: true,
  showToolbarLabels: true,
  useLeftKeySelectionRightKeyDrag: false,
  isShowScrollbar: false,
  isDark: false,
  lastDarkTheme: 'dark4',
  lastLightTheme: 'default',
  enableAi: false,
  enableDragImport: false
}

export const createDefaultMindMapData = (title = '思维导图') => ({
  root: {
    data: {
      text: String(title || '思维导图')
    },
    children: []
  },
  theme: {
    template: DEFAULT_MIND_MAP_THEME_TEMPLATE,
    config: {}
  },
  layout: DEFAULT_MIND_MAP_LAYOUT
})

export const DEFAULT_BOOTSTRAP_STATE = () => ({
  version: DESKTOP_STATE_VERSION,
  mindMapData: null,
  mindMapConfig: null,
  localConfig: {
    ...DEFAULT_LOCAL_CONFIG
  },
  aiConfig: getDefaultAiConfig('volcanoArk'),
  recentFiles: [],
  lastDirectory: '',
  currentDocument: null
})
