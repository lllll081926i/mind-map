import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const targets = [
  'src/pages/Edit/components/Sidebar.vue',
  'src/pages/Edit/components/SidebarTrigger.vue',
  'src/pages/Edit/components/Setting.vue',
  'src/pages/Edit/components/Edit.vue',
  'src/pages/Edit/components/Theme.vue',
  'src/pages/Edit/components/Import.vue',
  'src/pages/Edit/components/Toolbar.vue',
  'src/pages/Edit/components/ToolbarNodeBtnList.vue',
  'src/pages/Edit/components/OutlineSidebar.vue',
  'src/pages/Edit/components/OutlineEdit.vue',
  'src/pages/Edit/components/NavigatorToolbar.vue',
  'src/pages/Edit/components/Export.vue',
  'src/pages/Edit/components/FormulaSidebar.vue',
  'src/pages/Edit/components/NodeIconToolbar.vue',
  'src/pages/Edit/components/NodeNoteSidebar.vue',
  'src/pages/Edit/components/Outline.vue',
  'src/pages/Edit/components/MouseAction.vue',
  'src/pages/Edit/components/Navigator.vue',
  'src/pages/Edit/components/NodeHyperlink.vue',
  'src/pages/Edit/components/NodeImage.vue',
  'src/pages/Edit/components/NodeNote.vue',
  'src/pages/Edit/components/NodeTag.vue',
  'src/pages/Edit/components/Count.vue',
  'src/pages/Edit/components/Color.vue',
  'src/pages/Edit/components/Scrollbar.vue',
  'src/pages/Edit/components/Search.vue',
  'src/pages/Edit/components/ShortcutKey.vue',
  'src/pages/Edit/components/NodeIconSidebar.vue',
  'src/pages/Edit/components/AssociativeLineStyle.vue',
  'src/pages/Edit/components/NodeTagStyle.vue',
  'src/pages/Edit/components/Structure.vue',
  'src/pages/Edit/components/RichTextToolbar.vue',
  'src/pages/Edit/components/NodeOuterFrame.vue',
  'src/pages/Edit/components/Contextmenu.vue',
  'src/pages/Edit/components/Style.vue',
  'src/pages/Edit/components/BaseStyle.vue'
]

test('编辑器核心组件只通过当前 store 层访问运行时状态', () => {
  const offenders = targets.filter(filePath => {
    const source = fs.readFileSync(path.resolve(filePath), 'utf8')
    return /from ['"]vuex['"]/.test(source)
  })

  assert.deepEqual(offenders, [])
})

test('api 模块保持与历史全局 store 解耦', () => {
  const source = fs.readFileSync(path.resolve('src/api/index.js'), 'utf8')

  assert.equal(source.includes("import vuexStore from '@/store'"), false)
})
