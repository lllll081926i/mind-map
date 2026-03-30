import { getDefaultAiConfig } from '@/utils/aiProviders.mjs'

export const DESKTOP_STATE_VERSION = 1

export const DEFAULT_LOCAL_CONFIG = {
  isZenMode: false,
  openNodeRichText: true,
  useLeftKeySelectionRightKeyDrag: false,
  isShowScrollbar: false,
  isDark: false,
  lastDarkTheme: 'dark4',
  lastLightTheme: 'default',
  enableAi: false,
  enableDragImport: false
}

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
