import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const exportPagePath = path.resolve('src/pages/Export/Index.vue')

test('独立导出页存在并列出主要导出格式', () => {
  assert.equal(fs.existsSync(exportPagePath), true)
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(source, /const FORMAT_NAME_KEY_MAP = \{/)
  assert.match(source, /smm:\s*'smm'/)
  assert.match(source, /png:\s*'png'/)
  assert.match(source, /svg:\s*'svg'/)
  assert.match(source, /pdf:\s*'pdf'/)
  assert.match(source, /'pdf-hd':\s*'pdfHd'/)
  assert.match(source, /md:\s*'md'/)
  assert.match(source, /xmind:\s*'xmind'/)
  assert.match(source, /txt:\s*'txt'/)
  assert.match(source, /html:\s*'html'/)
  assert.match(source, /word:\s*'word'/)
  assert.match(source, /exportPage\.formatNames\.\$\{key\}/)
})

test('独立导出页包含文件名、说明、选项与导出操作区', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(source, /\$t\('exportPage\.fileName'\)/)
  assert.match(source, /\$t\('exportPage\.descriptionLabel'\)/)
  assert.match(source, /\$t\('exportPage\.optionsLabel'\)/)
  assert.match(source, /\$t\('exportPage\.export'\)/)
  assert.match(source, /class="exportOverlay"/)
  assert.match(source, /class="exportDialog"/)
  assert.match(source, /class="dialogFooter"/)
  assert.match(source, /class="previewPanel"/)
  assert.match(source, /class="previewSurface"/)
  assert.match(source, /\$t\('exportPage\.preview'\)/)
  assert.match(source, /\$t\('exportPage\.previewDesc'\)/)
  assert.match(source, /class="statusMetaList"/)
  assert.match(source, /\$t\('exportPage\.currentDocumentLabel'\)/)
  assert.match(source, /\$t\('exportPage\.rememberedLabel'\)/)
})

test('导出弹窗仅通过遮罩关闭，不再保留右上角按钮或 Esc 关闭', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(source, /exportOverlay[\s\S]{0,120}@click\.self="onMaskClick"/)
  assert.doesNotMatch(source, /class="dialogCloseBtn"/)
  assert.doesNotMatch(source, /dialogHeaderActions/)
  assert.doesNotMatch(source, /\$t\('exportPage\.backHome'\)/)
  assert.doesNotMatch(source, /\$t\('exportPage\.backEdit'\)/)
  assert.doesNotMatch(source, /onKeydown\(/)
  assert.doesNotMatch(source, /bindExportKeydown\(/)
  assert.doesNotMatch(source, /unbindExportKeydown\(/)
})

test('导出关闭操作仅保留遮罩点击，并受到导出中状态保护', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(
    source,
    /onMaskClick\(\)\s*\{[\s\S]*?if \(this\.exporting\)[\s\S]*?return[\s\S]*?await this\.goEdit\(\)/
  )
  assert.doesNotMatch(source, /\$t\('search\.cancel'\)/)
})

test('导出弹窗预览区会同步尺寸，且不再依赖关闭按钮国际化文案', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(source, /boundPreviewResize:\s*null/)
  assert.match(source, /bindPreviewResize\(\)/)
  assert.match(source, /unbindPreviewResize\(\)/)
  assert.match(source, /syncPreviewViewport\(\)/)
  assert.match(source, /this\.mindMap\.emit\('resize'\)/)
  assert.match(source, /this\.mindMap\.view\.fit\(\)/)
  assert.doesNotMatch(source, /\$t\('dialog\.close'\)/)
})

test('导出预览区扩大可视面积并允许拖动缩放预览', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(source, /readonly:\s*true/)
  assert.match(source, /mousewheelAction:\s*'zoom'/)
  assert.doesNotMatch(source, /pointer-events:\s*none/)
  assert.match(source, /cursor:\s*grab/)
  assert.doesNotMatch(source, /class="previewHint"/)
})

test('导出页会记住上次导出选项并预热当前格式的导出插件', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(source, /restorePersistedExportState/)
  assert.match(source, /persistExportStateSnapshot/)
  assert.match(source, /rememberedSummary/)
  assert.match(source, /\$t\('exportPage\.rememberedTip'\)/)
  assert.match(source, /scheduleExportWarmup\(\)/)
})

test('HTML 导出格式已启用并走独立 HTML 生成链路', () => {
  const exportPageSource = fs.readFileSync(exportPagePath, 'utf8')
  const exportStateSource = fs.readFileSync(
    path.resolve('src/services/exportState.js'),
    'utf8'
  )
  const htmlFormatBlock =
    exportStateSource.match(
      /\{\s*name:\s*'HTML'[\s\S]*?type:\s*'html'[\s\S]*?\}/
    )?.[0] || ''

  assert.match(exportStateSource, /type:\s*'html'/)
  assert.equal(htmlFormatBlock.includes('disabled: true'), false)
  assert.match(exportPageSource, /from '@\/services\/htmlExport'/)
  assert.match(
    exportPageSource,
    /if \(this\.exportState\.exportType === 'html'\)/
  )
  assert.match(
    exportPageSource,
    /await this\.mindMap\.export\(\s*'svg'\s*,\s*false\s*,\s*safeFileName/
  )
  assert.match(exportPageSource, /buildMindMapHtmlDocument\(/)
  assert.match(exportPageSource, /saveTextFileAs\(/)
})

test('导出完成反馈会包含文件名和扩展名', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(source, /\$t\('exportPage\.exportDoneMessage',\s*\{\s*fileName:/)
  assert.match(source, /extension:\s*this\.currentFileExtension/)
})
