import test from 'node:test'
import assert from 'node:assert/strict'

import {
  compareVersions,
  normalizeVersion,
  parseGitHubLatestRelease,
  createManualUpdateResult
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
      body: '修复若干问题',
      html_url: 'https://github.com/lllll081926i/mind-map/releases/tag/v1.3.0',
      published_at: '2026-04-03T10:00:00Z'
    },
    'https://github.com/lllll081926i/mind-map/releases'
  )

  assert.deepEqual(manifest, {
    version: '1.3.0',
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
    notes: '旧格式说明',
    url: 'https://example.com/release',
    publishedAt: ''
  })
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
