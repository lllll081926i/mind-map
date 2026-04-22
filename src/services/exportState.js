import { downTypeList } from '@/config'
import { createExportContext } from '@/services/workspaceProjectModel'
import { parseExternalJsonSafely } from '@/utils/json'

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
    desc: '单文件 HTML，只读浏览，可拖拽缩放查看导图'
  },
  {
    name: 'Word',
    type: 'word',
    desc: '桌面版 Word 导出即将支持',
    disabled: true
  }
]

const flowchartFormats = [
  {
    name: 'SVG',
    type: 'svg',
    desc: '导出矢量流程图'
  },
  {
    name: 'PNG',
    type: 'png',
    desc: '导出流程图图片'
  }
]

export const getDesktopExportFormats = (documentMode = 'mindmap') => {
  const sourceFormats =
    String(documentMode || '').trim() === 'flowchart'
      ? flowchartFormats
      : baseFormats
  const seen = new Set()
  return sourceFormats.filter(item => {
    if (seen.has(item.type)) {
      return false
    }
    seen.add(item.type)
    return true
  })
}

export const createDefaultExportState = (
  fileName,
  documentMode = 'mindmap'
) => ({
  exportType:
    String(documentMode || '').trim() === 'flowchart' ? 'svg' : 'smm',
  fileName: fileName || '思维导图',
  withConfig: true,
  isTransparent: false,
  paddingX: String(documentMode || '').trim() === 'flowchart' ? 120 : 10,
  paddingY: String(documentMode || '').trim() === 'flowchart' ? 120 : 10,
  extraText: '',
  isFitBg: true,
  imageFormat: 'png'
})

export const createExportStateFromFileRef = fileRef => {
  const exportContext = createExportContext(fileRef)
  return createDefaultExportState(
    exportContext.fileName,
    exportContext.fileRef?.documentMode || 'mindmap'
  )
}

const getPersistedExportMap = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {}
  }
  try {
    const raw = window.localStorage.getItem(EXPORT_STATE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = parseExternalJsonSafely(raw)
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
  const documentMode = exportContext.fileRef?.documentMode || 'mindmap'
  const fallbackState = createDefaultExportState(
    exportContext.fileName,
    documentMode
  )
  const stateMap = getPersistedExportMap()
  const persistedState = stateMap[createExportStateStorageKey(fileRef)]
  if (!persistedState || typeof persistedState !== 'object') {
    return fallbackState
  }
  const restoredState = {
    ...fallbackState,
    ...pickPersistedExportState(persistedState)
  }
  const availableTypes = new Set(
    getDesktopExportFormats(documentMode).map(item => item.type)
  )
  if (!availableTypes.has(restoredState.exportType)) {
    restoredState.exportType = fallbackState.exportType
  }
  return restoredState
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

export const findExportFormat = (type, documentMode = 'mindmap') => {
  return getDesktopExportFormats(documentMode).find(item => item.type === type) || null
}

export const isExportFormatDisabled = (type, documentMode = 'mindmap') => {
  const target = findExportFormat(type, documentMode)
  return !!(target && target.disabled)
}

export const getResolvedExportType = (type, documentMode = 'mindmap') => {
  const target = findExportFormat(type, documentMode)
  return target?.aliasType || type
}
