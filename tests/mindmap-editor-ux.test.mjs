import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const contextmenuSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Contextmenu.vue'),
  'utf8'
)
const outlineSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Outline.vue'),
  'utf8'
)
const navigatorSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Navigator.vue'),
  'utf8'
)
const baseStyleSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/BaseStyle.vue'),
  'utf8'
)
const settingSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Setting.vue'),
  'utf8'
)
const richTextToolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/RichTextToolbar.vue'),
  'utf8'
)
const toolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Toolbar.vue'),
  'utf8'
)
const flowchartToolbarSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/FlowchartToolbar.vue'),
  'utf8'
)
const editSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Edit.vue'),
  'utf8'
)
const langSource = fs.readFileSync(path.resolve('src/lang/index.js'), 'utf8')
const editorToolbarActionPath = path.resolve(
  'src/pages/Edit/components/EditorToolbarAction.vue'
)
const editorToolbarActionSource = fs.readFileSync(editorToolbarActionPath, 'utf8')

// ─── Contextmenu position fix ───

test('Contextmenu show() sets left/top before isShow=true', () => {
  const showMatch = contextmenuSource.match(/show\s*\(\s*e\s*,\s*node\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/)
  assert.ok(showMatch, 'show() method should exist')
  const body = showMatch[0]
  const isShowIdx = body.indexOf('this.isShow = true')
  assert.ok(isShowIdx > 0, 'should set isShow=true')
  const leftIdx = body.indexOf('this.left =')
  const topIdx = body.indexOf('this.top =')
  assert.ok(leftIdx >= 0, 'should set this.left')
  assert.ok(topIdx >= 0, 'should set this.top')
  assert.ok(leftIdx < isShowIdx, 'this.left should be set BEFORE isShow=true')
  assert.ok(topIdx < isShowIdx, 'this.top should be set BEFORE isShow=true')
})

test('Contextmenu show2() sets left/top before isShow=true', () => {
  const show2Match = contextmenuSource.match(/show2\s*\(\s*e\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/)
  assert.ok(show2Match, 'show2() method should exist')
  const body = show2Match[0]
  const isShowIdx = body.indexOf('this.isShow = true')
  assert.ok(isShowIdx > 0, 'should set isShow=true')
  const leftIdx = body.indexOf('this.left =')
  const topIdx = body.indexOf('this.top =')
  assert.ok(leftIdx >= 0, 'should set this.left')
  assert.ok(topIdx >= 0, 'should set this.top')
  assert.ok(leftIdx < isShowIdx, 'this.left should be set BEFORE isShow=true')
  assert.ok(topIdx < isShowIdx, 'this.top should be set BEFORE isShow=true')
})

// ─── Outline debounce ───

test('Outline scheduleRefresh uses setTimeout debounce, not rAF', () => {
  assert.ok(
    outlineSource.includes('setTimeout'),
    'Outline should use setTimeout for debounce'
  )
  // Should NOT use rAF for refresh scheduling
  const scheduleRefreshMatch = outlineSource.match(
    /scheduleRefresh\s*\(\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(scheduleRefreshMatch, 'scheduleRefresh method should exist')
  const body = scheduleRefreshMatch[0]
  assert.ok(
    !body.includes('requestAnimationFrame'),
    'scheduleRefresh should not use requestAnimationFrame'
  )
  assert.ok(body.includes('setTimeout'), 'scheduleRefresh should use setTimeout')
})

test('Outline scheduleRefresh debounce is between 100ms and 300ms', () => {
  const match = outlineSource.match(/setTimeout\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*(\d+)\s*\)/)
  assert.ok(match, 'should find setTimeout with delay')
  const delay = parseInt(match[1], 10)
  assert.ok(delay >= 100 && delay <= 300, `debounce delay should be 100-300ms, got ${delay}`)
})

test('Outline cleans up refreshTimer in beforeUnmount', () => {
  const beforeUnmountMatch = outlineSource.match(
    /beforeUnmount\s*\(\)\s*\{[\s\S]*?\n\s{2}\}/
  )
  assert.ok(beforeUnmountMatch, 'beforeUnmount should exist')
  const body = beforeUnmountMatch[0]
  assert.ok(
    body.includes('clearTimeout') && body.includes('refreshTimer'),
    'beforeUnmount should clear refreshTimer'
  )
})

// ─── Navigator debounce ───

test('Navigator data_change debounce is 300ms or less', () => {
  // Find the data_change method
  const match = navigatorSource.match(
    /data_change\s*\(\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(match, 'data_change method should exist')
  const body = match[0]
  const timerMatch = body.match(/setTimeout\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*(\d+)\s*\)/)
  assert.ok(timerMatch, 'should find setTimeout in data_change')
  const delay = parseInt(timerMatch[1], 10)
  assert.ok(delay <= 300, `debounce should be <= 300ms, got ${delay}`)
})

// ─── BaseStyle persistence debounce ───

test('BaseStyle update() debounces storeData call', () => {
  const updateMatch = baseStyleSource.match(
    /update\s*\(\s*key\s*,\s*value\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(updateMatch, 'update() method should exist')
  const body = updateMatch[0]
  assert.ok(body.includes('storeData'), 'update() should call storeData')
  assert.ok(
    body.includes('setTimeout') || body.includes('clearTimeout'),
    'update() should debounce storeData'
  )
  assert.ok(
    body.includes('storeDataTimer') || body.includes('debounce'),
    'update() should use a timer variable for debounce'
  )
})

test('BaseStyle updateMargin() debounces storeData call', () => {
  const match = baseStyleSource.match(
    /updateMargin\s*\(\s*type\s*,\s*value\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(match, 'updateMargin() method should exist')
  const body = match[0]
  assert.ok(body.includes('storeData'), 'updateMargin() should call storeData')
  assert.ok(
    body.includes('setTimeout') || body.includes('clearTimeout'),
    'updateMargin() should debounce storeData'
  )
})

test('BaseStyle updateOuterFramePadding() debounces storeConfig call', () => {
  const match = baseStyleSource.match(
    /updateOuterFramePadding\s*\(\s*\w+\s*,\s*\w+\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(match, 'updateOuterFramePadding() method should exist')
  const body = match[0]
  assert.ok(body.includes('storeConfig'), 'updateOuterFramePadding() should call storeConfig')
  assert.ok(
    body.includes('setTimeout') || body.includes('clearTimeout'),
    'updateOuterFramePadding() should debounce storeConfig'
  )
})

// ─── Setting persistence debounce ───

test('Setting updateOtherConfig() debounces storeConfig call', () => {
  const match = settingSource.match(
    /updateOtherConfig\s*\(\s*key\s*,\s*value\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(match, 'updateOtherConfig() method should exist')
  const body = match[0]
  assert.ok(body.includes('storeConfig'), 'updateOtherConfig() should call storeConfig')
  assert.ok(
    body.includes('setTimeout') || body.includes('clearTimeout'),
    'updateOtherConfig() should debounce storeConfig'
  )
  assert.ok(
    body.includes('storeConfigTimer') || body.includes('debounce'),
    'updateOtherConfig() should use a timer variable for debounce'
  )
})

// ─── RichTextToolbar boundary check ───

test('RichTextToolbar checks viewport boundaries', () => {
  const match = richTextToolbarSource.match(
    /onRichTextSelectionChange\s*\(\s*hasRange\s*,\s*rect\s*,\s*formatInfo\s*\)\s*\{[\s\S]*?(?=\n\s{4}\w|\n\s{4}\/\/)/
  )
  assert.ok(match, 'onRichTextSelectionChange should exist')
  const body = match[0]
  assert.ok(
    body.includes('window.innerHeight') || body.includes('top < ') || body.includes('top < 0'),
    'should check top boundary'
  )
})

test('RichTextToolbar has CSS transition', () => {
  assert.ok(
    richTextToolbarSource.includes('transition'),
    'RichTextToolbar should have CSS transition'
  )
})

test('思维导图顶部快捷区提供专注、大纲和粘贴大纲入口', () => {
  assert.equal(fs.existsSync(editorToolbarActionPath), true)
  assert.match(toolbarSource, /EditorToolbarAction/)
  assert.match(flowchartToolbarSource, /EditorToolbarAction/)
  assert.doesNotMatch(editorToolbarActionSource, /@keydown\.\w+\.prevent/)
  assert.match(editorToolbarActionSource, /v-on="keyboardListeners"/)
  assert.match(toolbarSource, /toggleZenMode\(/)
  assert.match(toolbarSource, /openOutlinePanel\(/)
  assert.match(toolbarSource, /pasteOutlineFromClipboard\(/)
  assert.match(toolbarSource, /\$t\('toolbar\.focusModeAction'\)/)
  assert.match(toolbarSource, /\$t\('toolbar\.outlineAction'\)/)
  assert.match(toolbarSource, /\$t\('toolbar\.pasteOutlineAction'\)/)
  assert.match(langSource, /"focusModeAction": "专注"/)
  assert.match(langSource, /"outlineAction": "大纲"/)
  assert.match(langSource, /"pasteOutlineAction": "粘贴大纲"/)
})

test('思维导图支持把剪贴板多行文本作为当前节点的子主题导入', () => {
  assert.match(toolbarSource, /\$bus\.\$emit\('pasteOutlineFromClipboard'\)/)
  assert.match(editSource, /\$bus\.\$on\(\s*'pasteOutlineFromClipboard'/)
  assert.match(editSource, /\$bus\.\$off\(\s*'pasteOutlineFromClipboard'/)
  assert.match(editSource, /readClipboardText\(/)
  assert.match(editSource, /parsePastedOutlineText\(/)
  assert.match(editSource, /INSERT_MULTI_CHILD_NODE/)
  assert.match(editSource, /renderer\?\.activeNodeList|renderer\.activeNodeList/)
  assert.match(editSource, /\$t\('toolbar\.pasteOutlineNeedSelection'\)/)
  assert.match(editSource, /\$t\('toolbar\.pasteOutlineEmpty'\)/)
  assert.match(langSource, /"pasteOutlineNeedSelection": "请先选择一个主题"/)
  assert.match(langSource, /"pasteOutlineSuccess": "已从剪贴板生成子主题"/)
})
