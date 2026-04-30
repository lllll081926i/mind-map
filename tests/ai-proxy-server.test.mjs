import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'

import { createServe, validateProxyTargetUrl } from '../scripts/ai.js'

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

test('AI 代理会拒绝非白名单 Origin 的浏览器请求', async t => {
  const server = createServe(0, {
    authToken: 'mind-map-test-token',
    allowedOrigin: 'http://localhost:5173',
    host: '127.0.0.1'
  })
  await once(server, 'listening')
  t.after(async () => {
    await closeServer(server)
  })
  const address = /** @type {import('node:net').AddressInfo} */ (server.address())
  const { port } = address

  const response = await fetch(`http://127.0.0.1:${port}/ai/test`, {
    headers: {
      Origin: 'https://evil.example',
      'x-ai-proxy-token': 'mind-map-test-token'
    }
  })

  assert.equal(response.status, 403)
  const payload = await response.json()
  assert.equal(payload.code, 403)
})

test('AI 代理允许白名单 Origin 和无 Origin 的本地请求', async t => {
  const server = createServe(0, {
    authToken: 'mind-map-test-token',
    allowedOrigin: 'http://localhost:5173',
    host: '127.0.0.1'
  })
  await once(server, 'listening')
  t.after(async () => {
    await closeServer(server)
  })
  const address = /** @type {import('node:net').AddressInfo} */ (server.address())
  const { port } = address

  const browserResponse = await fetch(`http://127.0.0.1:${port}/ai/test`, {
    headers: {
      Origin: 'http://localhost:5173',
      'x-ai-proxy-token': 'mind-map-test-token'
    }
  })
  assert.equal(browserResponse.status, 200)
  assert.equal(
    browserResponse.headers.get('access-control-allow-origin'),
    'http://localhost:5173'
  )

  const localResponse = await fetch(`http://127.0.0.1:${port}/ai/test`, {
    headers: {
      'x-ai-proxy-token': 'mind-map-test-token'
    }
  })
  assert.equal(localResponse.status, 200)
})

test('AI 代理目标 URL 会拒绝私网、链路本地和保留地址', () => {
  const blockedUrls = [
    'http://127.0.0.1:11434/api/chat',
    'http://169.254.169.254/latest/meta-data',
    'http://100.64.0.1/v1/chat',
    'http://[::]/v1/chat',
    'http://[::ffff:127.0.0.1]/v1/chat'
  ]

  for (const url of blockedUrls) {
    assert.equal(validateProxyTargetUrl(url).valid, false, url)
  }

  assert.equal(validateProxyTargetUrl('https://api.openai.com/v1/chat/completions').valid, true)
})
