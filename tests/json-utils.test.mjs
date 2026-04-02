import test from 'node:test'
import assert from 'node:assert/strict'

import { parseExternalJsonSafely } from '../src/utils/json.js'

test('parseExternalJsonSafely 可以解析普通 JSON', () => {
  const value = parseExternalJsonSafely('{"root":{"data":{"text":"demo"}}}')
  assert.equal(value.root.data.text, 'demo')
})

test('parseExternalJsonSafely 会拒绝非法 JSON', () => {
  assert.throws(() => {
    parseExternalJsonSafely('{invalid json}')
  }, /JSON 解析失败/)
})

test('parseExternalJsonSafely 会拒绝原型链污染字段', () => {
  assert.throws(() => {
    parseExternalJsonSafely('{"__proto__":{"polluted":true}}')
  }, /不安全字段/)
})

test('parseExternalJsonSafely 会递归检查数组中的危险字段', () => {
  assert.throws(() => {
    parseExternalJsonSafely('[{"safe":1},{"constructor":{"prototype":{"x":1}}}]')
  }, /不安全字段/)
})
