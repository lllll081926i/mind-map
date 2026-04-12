import { downTypeList } from '@/config'
import { createExportContext } from '@/services/workspaceProjectModel'

const EXPORT_STATE_STORAGE_KEY = 'mind-map.desktop.export-state.v1'
const PERSISTED_EXPORT_FIELDS = [
  'exportType',
  'withConfig',
  'isTransparent',
  'paddingX',
  'paddingY',
  'extraText',
  'isFitBg',
  'imageFormat'
]

const baseFormats = [
  ...((downTypeList.zh || []).filter(item => !['mm', 'xlsx'].includes(item.type))),
  {
    name: '高清PDF',
    type: 'pdf-hd',
    desc: '适合打印的高质量 PDF 导出',
    aliasType: 'pdf'
  },
  {
    name: 'HTML',
    type: 'html',
    desc: '桌面版 HTML 导出即将支持',
    disabled: true
  },
  {
    name: 'Word',
    type: 'word',
    desc: '桌面版 Word 导出即将支持',
    disabled: true
  }
]

export const getDesktopExportFormats = () => {
  const seen = new Set()
  return baseFormats.filter(item => {
    if (seen.has(item.type)) {
      return false
    }
    seen.add(item.type)
    return true
  })
}

export const createDefaultExportState = fileName => ({
  exportType: 'smm',
  fileName: fileName || '思维导图',
  withConfig: true,
  isTransparent: false,
  paddingX: 10,
  paddingY: 10,
  extraText: '',
  isFitBg: true,
  imageFormat: 'png'
})

export const createExportStateFromFileRef = fileRef => {
  const exportContext = createExportContext(fileRef)
  return createDefaultExportState(exportContext.fileName)
}

const getPersistedExportMap = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {}
  }
  try {
    const raw = window.localStorage.getItem(EXPORT_STATE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (error) {
    console.error('getPersistedExportMap failed', error)
    return {}
  }
}

const persistExportMap = stateMap => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  try {
    window.localStorage.setItem(
      EXPORT_STATE_STORAGE_KEY,
      JSON.stringify(stateMap || {})
    )
  } catch (error) {
    console.error('persistExportMap failed', error)
  }
}

const createExportStateStorageKey = fileRef => {
  const exportContext = createExportContext(fileRef)
  const path = String(exportContext.fileRef?.path || '').trim()
  return path || `unsaved:${exportContext.fileName}`
}

const pickPersistedExportState = state => {
  return PERSISTED_EXPORT_FIELDS.reduce((result, field) => {
    result[field] = state?.[field]
    return result
  }, {})
}

export const restorePersistedExportState = fileRef => {
  const exportContext = createExportContext(fileRef)
  const fallbackState = createDefaultExportState(exportContext.fileName)
  const stateMap = getPersistedExportMap()
  const persistedState = stateMap[createExportStateStorageKey(fileRef)]
  if (!persistedState || typeof persistedState !== 'object') {
    return fallbackState
  }
  return {
    ...fallbackState,
    ...pickPersistedExportState(persistedState)
  }
}

export const persistExportStateSnapshot = state => {
  const fileRef = state?.fileRef
  if (!fileRef) {
    return
  }
  const stateMap = getPersistedExportMap()
  stateMap[createExportStateStorageKey(fileRef)] = pickPersistedExportState(state)
  persistExportMap(stateMap)
}

export const resolveExportContext = fileRef => {
  return createExportContext(fileRef)
}

export const findExportFormat = type => {
  return getDesktopExportFormats().find(item => item.type === type) || null
}

export const isExportFormatDisabled = type => {
  const target = findExportFormat(type)
  return !!(target && target.disabled)
}

export const getResolvedExportType = type => {
  const target = findExportFormat(type)
  return target?.aliasType || type
}
