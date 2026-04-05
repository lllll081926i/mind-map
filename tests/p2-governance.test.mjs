import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const tauriConfigSource = fs.readFileSync(
  path.resolve('src-tauri/tauri.conf.json'),
  'utf8'
)
const tauriReleaseConfigSource = fs.readFileSync(
  path.resolve('src-tauri/tauri.release.conf.json'),
  'utf8'
)

test('P2 治理文件已经补齐', () => {
  assert.equal(fs.existsSync(path.resolve('CHANGELOG.md')), true)
  assert.equal(fs.existsSync(path.resolve('CONTRIBUTING.md')), true)
  assert.equal(
    fs.existsSync(path.resolve('.github/PULL_REQUEST_TEMPLATE.md')),
    true
  )
  assert.equal(fs.existsSync(path.resolve('.github/ISSUE_TEMPLATE')), true)
  assert.equal(fs.existsSync(path.resolve('.github/CODEOWNERS')), true)
})

test('Tauri 开发态 CSP 不再使用 localhost 通配符', () => {
  assert.doesNotMatch(tauriConfigSource, /http:\/\/localhost:\*/)
  assert.doesNotMatch(tauriConfigSource, /ws:\/\/localhost:\*/)
  assert.match(tauriConfigSource, /http:\/\/localhost:5173/)
  assert.match(tauriConfigSource, /ws:\/\/localhost:5173/)
  assert.match(tauriConfigSource, /http:\/\/localhost:3456/)
})

test('Tauri 发布态 CSP 保持仅远程安全连接源', () => {
  assert.doesNotMatch(tauriReleaseConfigSource, /http:\/\/localhost/)
  assert.doesNotMatch(tauriReleaseConfigSource, /ws:\/\/localhost/)
  assert.match(tauriReleaseConfigSource, /connect-src 'self' https: wss:/)
})
