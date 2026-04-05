import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'

import { createServe } from '../scripts/ai.js'

/** @param {import('node:net').Server} server */
const closeServer = server => {
  return new Promise((resolve, reject) => {
    /** @param {Error | undefined | null} error */
    server.close(error => {
      if (error) {
        reject(error)
        return
      }
      resolve(undefined)
    })
  })
}

test('AI 代理启动时必须显式提供访问令牌', () => {
  assert.throws(() => createServe(0, { authToken: '' }), /AI_PROXY_TOKEN/)
})

test('AI 代理健康检查接口要求携带正确令牌', async t => {
  const server = createServe(0, {
    authToken: 'mind-map-test-token',
    host: '127.0.0.1'
  })
  await once(server, 'listening')
  t.after(async () => {
    await closeServer(server)
  })
  const address = /** @type {import('node:net').AddressInfo} */ (server.address())
  const { port } = address

  const unauthorizedResponse = await fetch(`http://127.0.0.1:${port}/ai/test`)
  assert.equal(unauthorizedResponse.status, 401)

  const authorizedResponse = await fetch(`http://127.0.0.1:${port}/ai/test`, {
    headers: {
      'x-ai-proxy-token': 'mind-map-test-token'
    }
  })
  assert.equal(authorizedResponse.status, 200)

  const payload = await authorizedResponse.json()
  assert.equal(payload.code, 0)
  assert.equal(payload.msg, '连接成功')
})
