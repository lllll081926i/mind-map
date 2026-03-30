import test from 'node:test'
import assert from 'node:assert/strict'

import {
  compareVersions,
  normalizeVersion,
  parseUpdateManifest,
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

test('parseUpdateManifest 支持 Tauri latest.json 格式', () => {
  const manifest = parseUpdateManifest(
    {
      version: 'v1.3.0',
      notes: '修复若干问题',
      platforms: {
        'windows-x86_64': {
          signature: 'sig',
          url: 'https://example.com/windows.exe'
        }
      }
    },
    'https://github.com/lllll081926i/mind-map/releases'
  )

  assert.deepEqual(manifest, {
    version: '1.3.0',
    notes: '修复若干问题',
    url: 'https://github.com/lllll081926i/mind-map/releases'
  })
})

test('parseUpdateManifest 支持旧简化格式', () => {
  const manifest = parseUpdateManifest({
    version: '1.4.0',
    notes: '旧格式说明',
    url: 'https://example.com/release'
  })

  assert.deepEqual(manifest, {
    version: '1.4.0',
    notes: '旧格式说明',
    url: 'https://example.com/release'
  })
})

test('createManualUpdateResult 在发现新版本时返回 update-available', () => {
  const result = createManualUpdateResult('0.1.0', {
    version: '0.2.0',
    notes: '新版本',
    url: 'https://example.com/release'
  })

  assert.deepEqual(result, {
    status: 'update-available',
    latestVersion: '0.2.0',
    notes: '新版本',
    url: 'https://example.com/release'
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
