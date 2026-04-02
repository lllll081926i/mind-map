import { downTypeList } from '@/config'
import { createExportContext } from '@/services/workspaceProjectModel'

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
