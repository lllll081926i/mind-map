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

test('首页设置页提供恢复文件状态与清理入口', () => {
  const source = fs.readFileSync(settingsPagePath, 'utf8')

  assert.match(source, /恢复文件/)
  assert.match(source, /清理恢复文件/)
  assert.match(source, /recoverySummary/)
  assert.match(source, /clearRecoveryFiles/)
})

test('首页设置页补充工作流与效率提示卡片', () => {
  const source = fs.readFileSync(settingsPagePath, 'utf8')

  assert.match(source, /workflowGuideCard/)
  assert.match(source, /efficiencyGuideCard/)
  assert.match(source, /恢复文件会在正式保存后自动清理/)
  assert.match(source, /Ctrl \+ F 可快速搜索节点/)
  assert.match(source, /导出中心会记住你最近一次的导出参数/)
})
