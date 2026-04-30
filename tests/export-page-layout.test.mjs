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

test('独立导出页包含文件名、选项、预览与导出操作区', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(source, /\$t\('exportPage\.fileName'\)/)
  assert.match(source, /\$t\('exportPage\.optionsLabel'\)/)
  assert.match(source, /\$t\('exportPage\.export'\)/)
  assert.match(source, /class="exportOverlay"/)
  assert.match(source, /class="exportDialog"/)
  assert.match(source, /class="dialogFooter"/)
  assert.match(source, /class="previewPanel"/)
  assert.match(source, /class="previewSurface"/)
  assert.match(source, /\$t\('exportPage\.preview'\)/)
})

test('独立导出页已移除附加说明文案区块', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.doesNotMatch(source, /\$t\('exportPage\.description'\)/)
  assert.doesNotMatch(source, /\$t\('exportPage\.descriptionLabel'\)/)
  assert.doesNotMatch(source, /\$t\('exportPage\.previewDesc'\)/)
  assert.doesNotMatch(source, /\$t\('exportPage\.disabledTip'\)/)
  assert.doesNotMatch(source, /\$t\('exportPage\.noExtraOptions'\)/)
  assert.doesNotMatch(source, /\$t\('exportPage\.rememberedTip'\)/)
  assert.doesNotMatch(source, /\$t\('exportPage\.warmupHint'\)/)
  assert.doesNotMatch(source, /class="statusMetaList"/)
  assert.doesNotMatch(source, /class="previewHeader"/)
  assert.doesNotMatch(source, /class="previewWarmupHint"/)
  assert.doesNotMatch(source, /class="statusText"/)
})

test('导出弹窗支持遮罩点击和 Escape 键关闭，不再保留右上角按钮', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(source, /exportOverlay[\s\S]{0,120}@click\.self="onMaskClick"/)
  assert.doesNotMatch(source, /class="dialogCloseBtn"/)
  assert.doesNotMatch(source, /dialogHeaderActions/)
  assert.doesNotMatch(source, /\$t\('exportPage\.backHome'\)/)
  assert.doesNotMatch(source, /\$t\('exportPage\.backEdit'\)/)
  assert.match(source, /bindExportKeydown\(/)
  assert.match(source, /unbindExportKeydown\(/)
  assert.match(source, /event\.key === 'Escape'/)
})

test('导出关闭操作支持遮罩点击和 Escape 键，并受到导出中状态保护', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(
    source,
    /onMaskClick\(\)\s*\{[\s\S]*?if \(this\.exporting\)[\s\S]*?return[\s\S]*?await this\.goEdit\(\)/
  )
  assert.match(
    source,
    /event\.key === 'Escape'[\s\S]*?!this\.exporting/
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
  assert.match(source, /scheduleExportWarmup\(\)/)
})

test('导出页会根据当前文档模式切换流程图导出格式与预览链路', () => {
  const exportPageSource = fs.readFileSync(exportPagePath, 'utf8')
  const exportStateSource = fs.readFileSync(
    path.resolve('src/services/exportState.js'),
    'utf8'
  )

  assert.match(exportStateSource, /const flowchartFormats = \[/)
  assert.match(exportStateSource, /String\(documentMode \|\| ''\)\.trim\(\) === 'flowchart'/)
  assert.match(exportPageSource, /documentMode\(\)/)
  assert.match(exportPageSource, /getDesktopExportFormats\(this\.documentMode\)/)
  assert.match(exportPageSource, /if \(this\.documentMode === 'flowchart'\)/)
  assert.match(exportPageSource, /initFlowchartPreview\(/)
  assert.match(exportPageSource, /handleFlowchartExport\(/)
  assert.match(exportPageSource, /buildFlowchartSvgMarkup\(/)
  assert.match(exportPageSource, /saveBinaryFileAs\(/)
  assert.match(exportPageSource, /showFlowchartBackgroundOption\(\)/)
  assert.match(exportPageSource, /transparent:\s*!this\.exportState\.withBackground/)
  assert.match(exportPageSource, /transparent:\s*!withBackground/)
  assert.match(exportPageSource, /extension = 'png',\s*transparent = false/)
  assert.match(exportStateSource, /'withBackground'/)
  assert.match(exportStateSource, /withBackground:\s*String\(documentMode \|\| ''\)\.trim\(\) === 'flowchart' \? false : true/)
  assert.doesNotMatch(exportPageSource, /link\.download =/)
  assert.match(exportPageSource, /class="previewCanvas"/)
  assert.match(exportPageSource, /previewCanvasClass/)
})

test('流程图导出预览不再通过 innerHTML 直接注入 SVG 字符串', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(source, /renderFlowchartPreviewSvg\(/)
  assert.match(source, /new DOMParser\(\)/)
  assert.match(source, /previewEl\.replaceChildren\(/)
  assert.doesNotMatch(source, /previewEl\.innerHTML\s*=/)
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

test('导出保存对话框文件类型名称使用国际化文案', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.doesNotMatch(source, /name:\s*['"]JPG 文件['"]/)
  assert.doesNotMatch(source, /name:\s*['"]PNG 文件['"]/)
  assert.doesNotMatch(source, /name:\s*['"]SVG 文件['"]/)
  assert.match(source, /\$t\('exportPage\.fileTypeJpg'\)/)
  assert.match(source, /\$t\('exportPage\.fileTypePng'\)/)
  assert.match(source, /\$t\('exportPage\.fileTypeSvg'\)/)
})
