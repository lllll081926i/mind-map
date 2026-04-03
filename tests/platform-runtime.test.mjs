import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

import {
  detectDesktopRuntime,
  isDesktopRuntime
} from '../src/platform/runtime.mjs'
import {
  buildDesktopSaveDefaultPath,
  ensureSmmFilePath,
  normalizeSaveName
} from '../src/platform/desktop/index.js'

const require = createRequire(import.meta.url)
const createViteConfig = require('../vite.config.js')
const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'))
const tauriConfig = JSON.parse(
  fs.readFileSync(path.resolve('src-tauri/tauri.conf.json'), 'utf8')
)
const platformIndexSource = fs.readFileSync(
  path.resolve('src/platform/index.js'),
  'utf8'
)
const desktopPlatformSource = fs.readFileSync(
  path.resolve('src/platform/desktop/index.js'),
  'utf8'
)
const mainSource = fs.readFileSync(path.resolve('src/main.js'), 'utf8')
const configMigrationSource = fs.readFileSync(
  path.resolve('src/platform/shared/configMigration.js'),
  'utf8'
)
const editIndexSource = fs.readFileSync(
  path.resolve('src/pages/Edit/Index.vue'),
  'utf8'
)
const editSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Edit.vue'),
  'utf8'
)
const appStateSource = fs.readFileSync(
  path.resolve('src-tauri/src/services/app_state.rs'),
  'utf8'
)
const rustMainSource = fs.readFileSync(
  path.resolve('src-tauri/src/main.rs'),
  'utf8'
)
const fileAssociationServiceSource = fs.readFileSync(
  path.resolve('src-tauri/src/services/file_association.rs'),
  'utf8'
)
const defaultOptionsSource = fs.readFileSync(
  path.resolve('simple-mind-map/src/constants/defaultOptions.js'),
  'utf8'
)
const workspaceSettingsSource = fs.readFileSync(
  path.resolve('src/pages/Home/components/WorkspaceSettings.vue'),
  'utf8'
)
const settingPanelSource = fs.readFileSync(
  path.resolve('src/pages/Edit/components/Setting.vue'),
  'utf8'
)

test('detectDesktopRuntime 在存在 __TAURI_INTERNALS__ 时返回 true', () => {
  assert.equal(
    detectDesktopRuntime({
      __TAURI_INTERNALS__: {
        invoke() {}
      }
    }),
    true
  )
})

test('detectDesktopRuntime 在存在 __TAURI__ 时返回 true', () => {
  assert.equal(
    detectDesktopRuntime({
      __TAURI__: {
        invoke() {}
      }
    }),
    true
  )
})

test('detectDesktopRuntime 在普通环境下返回 false', () => {
  assert.equal(detectDesktopRuntime({}), false)
  assert.equal(detectDesktopRuntime(null), false)
})

test('isDesktopRuntime 在无 window 环境下返回 false', () => {
  assert.equal(isDesktopRuntime(), false)
})

test('桌面保存文件名会默认补齐 .smm 后缀', () => {
  assert.equal(normalizeSaveName('思维导图'), '思维导图.smm')
  assert.equal(normalizeSaveName('demo.smm'), 'demo.smm')
})

test('桌面保存路径会在对话框未补后缀时兜底追加 .smm', () => {
  assert.equal(
    ensureSmmFilePath('/tmp/mind-map'),
    '/tmp/mind-map.smm'
  )
  assert.equal(
    ensureSmmFilePath('C:\\Users\\demo\\MindMap'),
    'C:\\Users\\demo\\MindMap.smm'
  )
  assert.equal(
    ensureSmmFilePath('/tmp/already.smm'),
    '/tmp/already.smm'
  )
})

test('桌面保存默认路径会拼接目录和 .smm 文件名', () => {
  assert.equal(
    buildDesktopSaveDefaultPath({
      defaultPath: '/tmp/projects',
      suggestedName: '示例'
    }),
    '/tmp/projects/示例.smm'
  )
  assert.equal(
    buildDesktopSaveDefaultPath({
      defaultPath: 'C:\\Users\\demo\\Documents',
      suggestedName: '示例'
    }),
    'C:\\Users\\demo\\Documents\\示例.smm'
  )
})

test('Vite 配置固定注入桌面运行时标识', () => {
  const config = createViteConfig({
    command: 'serve',
    mode: 'development'
  })

  assert.equal(config.define.__APP_RUNTIME__, JSON.stringify('desktop'))
})

test('Vite 构建输出目录固定为 dist-desktop', () => {
  const config = createViteConfig({
    command: 'build',
    mode: 'production'
  })

  assert.equal(config.build.outDir, 'dist-desktop')
})

test('Vite 不再暴露 vuex 兼容 alias', () => {
  const config = createViteConfig({
    command: 'serve',
    mode: 'development'
  })

  assert.equal('vuex' in config.resolve.alias, false)
})

test('package.json 不再依赖 vuex 包', () => {
  assert.equal('vuex' in (packageJson.dependencies || {}), false)
})

test('应用入口不再安装 legacy store 兼容层', () => {
  assert.equal(mainSource.includes("import store from './store'"), false)
  assert.equal(mainSource.includes('app.use(store)'), false)
})

test('legacy vuex 兼容层文件已移除', () => {
  assert.equal(fs.existsSync(path.resolve('src/store.js')), false)
})

test('Vite 不再 alias 到 @vue/compat', () => {
  const config = createViteConfig({
    command: 'serve',
    mode: 'development'
  })

  assert.notEqual(config.resolve.alias.vue, '@vue/compat')
})

test('应用入口不再调用 configureCompat', () => {
  assert.equal(mainSource.includes('configureCompat('), false)
})

test('package.json 不再依赖 @vue/compat', () => {
  assert.equal('@vue/compat' in (packageJson.dependencies || {}), false)
})

test('应用启动会等待 bootstrapPlatformState 完成后再挂载 UI', () => {
  assert.equal(mainSource.includes('await bootstrapPlatformState()'), true)
  assert.equal(
    mainSource.indexOf('bootstrapPlatformState()') <
      mainSource.indexOf('initApp()'),
    true
  )
})

test('桌面状态存储拆分为元数据与文档数据文件', () => {
  assert.equal(appStateSource.includes('app_state_meta.json'), true)
  assert.equal(appStateSource.includes('app_state_document.json'), true)
  assert.equal(appStateSource.includes('to_string_pretty'), false)
})

test('桌面状态服务保留旧单文件状态迁移入口', () => {
  assert.equal(appStateSource.includes('app_state.json'), true)
  assert.equal(appStateSource.includes('read_legacy_state'), true)
})

test('平台层提供文档状态延迟加载入口', () => {
  assert.equal(platformIndexSource.includes('ensureBootstrapDocumentState'), true)
  assert.equal(platformIndexSource.includes('readBootstrapMetaState'), true)
  assert.equal(platformIndexSource.includes('readBootstrapDocumentState'), true)
})

test('平台层会在 bootstrap 回填前校验启动期本地写入代次', () => {
  assert.equal(platformIndexSource.includes('metaMutationVersion'), true)
  assert.equal(platformIndexSource.includes('documentMutationVersion'), true)
  assert.equal(platformIndexSource.includes('startVersion'), true)
})

test('编辑页壳层改为异步加载 Toolbar 与 Edit', () => {
  assert.equal(editIndexSource.includes("import Toolbar from './components/Toolbar.vue'"), false)
  assert.equal(editIndexSource.includes("import Edit from './components/Edit.vue'"), false)
  assert.equal(editIndexSource.includes('defineAsyncComponent'), true)
})

test('编辑器首屏不再静态引入导出与富文本重插件', () => {
  assert.equal(editSource.includes("import ExportPDF from 'simple-mind-map/src/plugins/ExportPDF.js'"), false)
  assert.equal(editSource.includes("import ExportXMind from 'simple-mind-map/src/plugins/ExportXMind.js'"), false)
  assert.equal(editSource.includes("import Export from 'simple-mind-map/src/plugins/Export.js'"), false)
  assert.equal(editSource.includes("import RichText from 'simple-mind-map/src/plugins/RichText.js'"), false)
  assert.equal(editSource.includes("import Formula from 'simple-mind-map/src/plugins/Formula.js'"), false)
})

test('平台入口不再引用 legacy localStorage 迁移逻辑', () => {
  assert.equal(
    platformIndexSource.includes('readLegacyLocalStorageSnapshot'),
    false
  )
})

test('配置迁移模块不再导出 legacy localStorage 迁移函数', () => {
  assert.equal(
    configMigrationSource.includes('readLegacyLocalStorageSnapshot'),
    false
  )
})

test('.smm 文件关联配置已接入 Tauri 打包配置', () => {
  const association = (tauriConfig.bundle.fileAssociations || []).find(item =>
    Array.isArray(item?.ext) && item.ext.includes('smm')
  )

  assert.ok(association)
  assert.equal(association.mimeType, 'application/x-mindmap-smm')
  assert.equal(association.exportedType.identifier, 'com.mindmap.document.smm')
  assert.equal(
    tauriConfig.bundle.windows.nsis.installerHooks,
    'file-association/windows/smm-file-association.nsh'
  )
  assert.equal(
    tauriConfig.bundle.macOS.infoPlist,
    'file-association/macos/Info.plist'
  )
  assert.equal(
    tauriConfig.bundle.linux.deb.postInstallScript,
    'file-association/linux/postinstall.sh'
  )
})

test('.smm 文件关联资源文件存在', () => {
  const resourceFiles = [
    'src-tauri/file-association/smm-document.svg',
    'src-tauri/file-association/icons/smm-document.ico',
    'src-tauri/file-association/icons/smm-document.icns',
    'src-tauri/file-association/icons/application-x-mindmap-smm.svg',
    'src-tauri/file-association/icons/application-x-mindmap-smm.png',
    'src-tauri/file-association/windows/smm-file-association.nsh',
    'src-tauri/file-association/macos/Info.plist',
    'src-tauri/file-association/linux/application-x-mindmap-smm.xml',
    'src-tauri/file-association/linux/postinstall.sh',
    'src-tauri/file-association/linux/postremove.sh'
  ]

  resourceFiles.forEach(file => {
    assert.equal(fs.existsSync(path.resolve(file)), true, file)
  })
})

test('桌面平台提供关联文件监听与提取入口', () => {
  assert.equal(
    desktopPlatformSource.includes('takePendingAssociatedFiles'),
    true
  )
  assert.equal(
    desktopPlatformSource.includes('listenAssociatedFileOpen'),
    true
  )
})

test('应用入口会在启动后处理关联文件打开事件', () => {
  assert.equal(
    mainSource.includes('setupDesktopAssociatedFileHandling'),
    true
  )
  assert.equal(mainSource.includes('takePendingAssociatedFiles'), true)
  assert.equal(mainSource.includes('listenAssociatedFileOpen'), true)
})

test('Rust 桌面入口已接入单实例与关联文件队列', () => {
  assert.equal(
    rustMainSource.includes('tauri_plugin_single_instance::init'),
    true
  )
  assert.equal(
    rustMainSource.includes('take_pending_associated_files'),
    true
  )
  assert.equal(
    fileAssociationServiceSource.includes('OPEN_ASSOCIATED_FILES_EVENT'),
    true
  )
  assert.equal(
    fileAssociationServiceSource.includes('resolve_associated_paths'),
    true
  )
})

test('性能模式默认开启并与桌面设置默认值保持一致', () => {
  assert.equal(defaultOptionsSource.includes('openPerformance: true'), true)
  assert.equal(workspaceSettingsSource.includes('openPerformance: true'), true)
  assert.equal(settingPanelSource.includes('openPerformance: true'), true)
})
