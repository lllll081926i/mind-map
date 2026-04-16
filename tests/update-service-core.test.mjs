import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  compareVersions,
  normalizeVersion,
  parseGitHubLatestRelease,
  createManualUpdateResult,
  formatReleasePublishedAt,
  createReleaseNotesPreview
} from '../src/services/updateServiceCore.mjs'

test('normalizeVersion 会移除 v 前缀', () => {
  assert.equal(normalizeVersion('v1.2.3'), '1.2.3')
  assert.equal(normalizeVersion(' V2.0.0 '), '2.0.0')
})

test('compareVersions 可以正确比较版本号', () => {
  assert.equal(compareVersions('0.1.0', '0.1.1'), -1)
  assert.equal(compareVersions('1.2.0', '1.2.0'), 0)
  assert.equal(compareVersions('2.0.0', '1.9.9'), 1)
})

test('parseGitHubLatestRelease 支持 GitHub latest release 格式', () => {
  const manifest = parseGitHubLatestRelease(
    {
      tag_name: 'v1.3.0',
      name: 'v1.3.0 稳定版',
      body: '修复若干问题',
      html_url: 'https://github.com/lllll081926i/mind-map/releases/tag/v1.3.0',
      published_at: '2026-04-03T10:00:00Z'
    },
    'https://github.com/lllll081926i/mind-map/releases'
  )

  assert.deepEqual(manifest, {
    version: '1.3.0',
    releaseName: 'v1.3.0 稳定版',
    notes: '修复若干问题',
    url: 'https://github.com/lllll081926i/mind-map/releases/tag/v1.3.0',
    publishedAt: '2026-04-03T10:00:00Z'
  })
})

test('parseGitHubLatestRelease 在缺少 html_url 时回退到发布页地址', () => {
  const manifest = parseGitHubLatestRelease({
    tag_name: '1.4.0',
    body: '旧格式说明'
  }, 'https://example.com/release')

  assert.deepEqual(manifest, {
    version: '1.4.0',
    releaseName: '',
    notes: '旧格式说明',
    url: 'https://example.com/release',
    publishedAt: ''
  })
})

test('formatReleasePublishedAt 会把 ISO 时间格式化为稳定日期', () => {
  assert.equal(formatReleasePublishedAt('2026-04-03T10:00:00Z'), '2026-04-03')
  assert.equal(formatReleasePublishedAt(''), '')
  assert.equal(formatReleasePublishedAt('invalid-date'), '')
})

test('createReleaseNotesPreview 会折叠空白并裁剪超长说明', () => {
  const preview = createReleaseNotesPreview(
    '第一行\n\n\n第二行  \n\n' + 'A'.repeat(400),
    40
  )

  assert.equal(preview.includes('\n\n\n'), false)
  assert.equal(preview.startsWith('第一行\n\n第二行'), true)
  assert.equal(preview.endsWith('...'), true)
})

test('createManualUpdateResult 在发现新版本时返回 update-available', () => {
  const result = createManualUpdateResult('0.1.0', {
    version: '0.2.0',
    notes: '新版本',
    url: 'https://example.com/release',
    publishedAt: '2026-04-03T10:00:00Z'
  })

  assert.deepEqual(result, {
    status: 'update-available',
    latestVersion: '0.2.0',
    releaseName: '',
    notes: '新版本',
    url: 'https://example.com/release',
    publishedAt: '2026-04-03T10:00:00Z'
  })
})

test('createManualUpdateResult 在已是最新版本时返回 up-to-date', () => {
  const result = createManualUpdateResult('0.2.0', {
    version: '0.2.0',
    notes: '',
    url: 'https://example.com/release'
  })

  assert.deepEqual(result, {
    status: 'up-to-date',
    latestVersion: '0.2.0'
  })
})

test('检查更新服务统一依赖 GitHub latest release 结果，不再暴露降级状态', () => {
  const serviceSource = fs.readFileSync(
    path.resolve('src/services/updateService.js'),
    'utf8'
  )

  assert.match(serviceSource, /fetchLatestRelease/)
  assert.match(serviceSource, /createManualUpdateResult/)
  assert.match(serviceSource, /createUpdateDialogMessage/)
  assert.doesNotMatch(serviceSource, /release-page-only/)
  assert.doesNotMatch(serviceSource, /not-configured/)
})

test('设置页更新入口共享统一的更新提示构造函数', () => {
  const files = [
    path.resolve('src/pages/Edit/components/Setting.vue'),
    path.resolve('src/pages/Home/components/WorkspaceSettings.vue')
  ]

  files.forEach(file => {
    const source = fs.readFileSync(file, 'utf8')
    assert.match(source, /result\.status === 'update-available'/)
    assert.match(source, /result\.status === 'up-to-date'/)
    assert.match(source, /createUpdateDialogMessage/)
    assert.doesNotMatch(source, /release-page-only/)
    assert.doesNotMatch(source, /updateSourceNotConfigured/)
  })
})

test('设置页在打开发布页失败时会给出错误反馈，而不是静默吞掉异常', () => {
  const files = [
    path.resolve('src/pages/Edit/components/Setting.vue'),
    path.resolve('src/pages/Home/components/WorkspaceSettings.vue')
  ]

  files.forEach(file => {
    const source = fs.readFileSync(file, 'utf8')
    assert.match(source, /updateOpenReleasePageFailed/)
    assert.doesNotMatch(source, /\.catch\(\(\) => \{\}\)/)
  })
})

test('发布日期格式化不再直接截取 UTC ISO 字符串', () => {
  const coreSource = fs.readFileSync(
    path.resolve('src/services/updateServiceCore.mjs'),
    'utf8'
  )

  assert.doesNotMatch(coreSource, /toISOString\(\)\.slice\(0,\s*10\)/)
})
