import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsPagePath = path.resolve('src/pages/Home/components/WorkspaceSettings.vue')

test('首页设置页存在并包含左侧分类导航', () => {
  assert.equal(fs.existsSync(settingsPagePath), true)
  const source = fs.readFileSync(settingsPagePath, 'utf8')

  ;['基础', '字体', '快捷键', '右键菜单', 'AI', '图床', '同步空间'].forEach(
    item => {
      assert.match(source, new RegExp(item))
    }
  )
})

test('首页设置页复用现有应用级设置项', () => {
  const source = fs.readFileSync(settingsPagePath, 'utf8')

  assert.match(source, /是否显示滚动条/)
  assert.match(source, /是否允许直接拖拽文件到页面进行导入/)
  assert.match(source, /是否开启AI功能/)
})
