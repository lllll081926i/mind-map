import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'))
const simpleMindMapPackageJson = JSON.parse(
  fs.readFileSync(path.resolve('simple-mind-map/package.json'), 'utf8')
)
const tsconfig = JSON.parse(fs.readFileSync(path.resolve('tsconfig.json'), 'utf8'))
const appStateSource = fs.readFileSync(
  path.resolve('src-tauri/src/services/app_state.rs'),
  'utf8'
)
const ciSource = fs.readFileSync(
  path.resolve('.github/workflows/ci.yml'),
  'utf8'
)
const releaseWorkflowSource = fs.readFileSync(
  path.resolve('.github/workflows/desktop-release.yml'),
  'utf8'
)
const viteConfigSource = fs.readFileSync(path.resolve('vite.config.js'), 'utf8')
const eslintConfigSource = fs.readFileSync(
  path.resolve('eslint.config.js'),
  'utf8'
)

test('类型检查配置已开启 strict 与 checkJs', () => {
  assert.equal(tsconfig.compilerOptions.strict, true)
  assert.equal(tsconfig.compilerOptions.checkJs, true)
})

test('AI 配置写入会走密钥安全存储而不是直接明文落盘', () => {
  assert.match(appStateSource, /keyring::Entry/)
  assert.match(appStateSource, /strip_ai_key_from_config/)
  assert.match(appStateSource, /hydrate_meta_state_with_secret/)
})

test('工程脚本接入行为测试与 E2E 测试', () => {
  assert.match(packageJson.scripts['test:all'], /test:behavior/)
  assert.equal(packageJson.scripts['test:e2e'], 'playwright test')
  assert.equal(
    packageJson.devDependencies['@playwright/test'].startsWith('^'),
    true
  )
})

test('CI 与发布校验都执行 E2E', () => {
  assert.match(ciSource, /Install Playwright Chromium/)
  assert.match(ciSource, /npm run test:e2e/)
  assert.match(releaseWorkflowSource, /Install Playwright Chromium/)
  assert.match(releaseWorkflowSource, /npm run test:e2e/)
})

test('浏览器模式访问本地 AI 代理时会注入认证令牌', () => {
  assert.match(viteConfigSource, /__APP_AI_PROXY_TOKEN__/)
  assert.match(eslintConfigSource, /__APP_AI_PROXY_TOKEN__/)
})

test('依赖清理已经移除 root 侧冗余 polyfill，并升级 simple-mind-map 的 ws', () => {
  assert.equal('core-js' in packageJson.dependencies, false)
  assert.equal('punycode' in packageJson.dependencies, false)
  assert.equal('tern' in simpleMindMapPackageJson.dependencies, false)
  assert.equal(simpleMindMapPackageJson.devDependencies.ws.startsWith('^8.'), true)
})

test('lint 入口已统一到 root flat config', () => {
  assert.doesNotMatch(eslintConfigSource, /'simple-mind-map\/\*\*'/)
  assert.doesNotMatch(eslintConfigSource, /'simple-mind-map-plugin-themes\/\*\*'/)
  assert.equal(fs.existsSync(path.resolve('simple-mind-map/.eslintrc.js')), false)
})

test('发布流程已接入代码签名配置入口', () => {
  assert.match(releaseWorkflowSource, /Import Windows code signing certificate/)
  assert.match(releaseWorkflowSource, /Apply Windows signing config/)
  assert.match(releaseWorkflowSource, /APPLE_CERTIFICATE:/)
  assert.match(releaseWorkflowSource, /APPLE_SIGNING_IDENTITY:/)
})
