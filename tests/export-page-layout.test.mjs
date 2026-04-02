import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const exportPagePath = path.resolve('src/pages/Export/Index.vue')
const langSourcePath = path.resolve('src/lang/index.js')

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
})

test('导出弹窗提供遮罩、Esc、右上角关闭入口', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(source, /exportOverlay[\s\S]{0,120}@click\.self="onMaskClick"/)
  assert.match(source, /class="dialogCloseBtn"/)
  assert.match(source, /closeDialog\(/)
  assert.match(source, /onKeydown\(/)
})

test('导出关闭操作受到导出中状态保护', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')

  assert.match(
    source,
    /onMaskClick\(\)\s*\{[\s\S]*?if \(this\.exporting\)[\s\S]*?return[\s\S]*?this\.closeDialog\(\)/
  )
  assert.match(
    source,
    /closeDialog\(\)\s*\{[\s\S]*?if \(this\.exporting\)[\s\S]*?return[\s\S]*?this\.goEdit\(\)/
  )
  assert.match(
    source,
    /onKeydown\(event\)\s*\{[\s\S]*?if \(this\.exporting\)[\s\S]*?if \(event\.key !== 'Escape'\)/
  )
  assert.match(source, /this\.boundExportKeydown = event => this\.onKeydown\(event\)/)
  assert.match(
    source,
    /window\.addEventListener\('keydown',\s*this\.boundExportKeydown\)/
  )
  assert.match(
    source,
    /window\.removeEventListener\('keydown',\s*this\.boundExportKeydown\)/
  )
})

test('导出弹窗预览区会同步尺寸，关闭按钮文案存在国际化定义', () => {
  const source = fs.readFileSync(exportPagePath, 'utf8')
  const langSource = fs.readFileSync(langSourcePath, 'utf8')

  assert.match(source, /boundPreviewResize:\s*null/)
  assert.match(source, /bindPreviewResize\(\)/)
  assert.match(source, /unbindPreviewResize\(\)/)
  assert.match(source, /syncPreviewViewport\(\)/)
  assert.match(source, /this\.mindMap\.emit\('resize'\)/)
  assert.match(source, /this\.mindMap\.view\.fit\(\)/)
  assert.match(source, /\$t\('dialog\.close'\)/)
  assert.match(langSource, /"dialog":\s*\{[\s\S]*"close":\s*"关闭"/)
})
