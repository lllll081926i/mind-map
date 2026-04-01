import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const runtimeModulePath = pathToFileURL(
  path.resolve(currentDir, '../src/platform/runtime.mjs')
).href

test('导入桌面运行时模块时不输出 MODULE_TYPELESS_PACKAGE_JSON 警告', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `import ${JSON.stringify(runtimeModulePath)};`
    ],
    {
      encoding: 'utf8'
    }
  )

  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.equal(
    result.stderr.includes('MODULE_TYPELESS_PACKAGE_JSON'),
    false,
    result.stderr
  )
})
