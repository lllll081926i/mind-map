import assert from 'node:assert/strict'
import {
  buildAiRequestConfig,
  buildApiUrl,
  getDefaultAiConfig,
  normalizeAiConfig,
  separateAppAndAiConfig,
  shouldUseLocalProxyHealthcheck,
  validateAiConfig
} from '../src/utils/aiProviders.mjs'
import proxyModule from './ai.js'

const { normalizeProxyError, getProxyPort, DEFAULT_PORT } = proxyModule

const legacyVolcanoConfig = normalizeAiConfig({
  api: 'http://ark.cn-beijing.volces.com/api/v3/chat/completions',
  key: 'demo-key',
  model: 'ep-test',
  port: 3456,
  method: 'POST'
})

assert.equal(legacyVolcanoConfig.provider, 'volcanoArk')
assert.equal(legacyVolcanoConfig.baseUrl, 'http://ark.cn-beijing.volces.com')
assert.equal(legacyVolcanoConfig.apiPath, '/api/v3/chat/completions')
assert.equal(
  legacyVolcanoConfig.api,
  'http://ark.cn-beijing.volces.com/api/v3/chat/completions'
)

const openAiConfig = normalizeAiConfig({
  provider: 'openai',
  baseUrl: 'https://api.openai.com/',
  apiPath: 'v1/chat/completions',
  key: 'demo-key',
  model: 'gpt-4.1-mini',
  port: 4567
})

assert.equal(openAiConfig.provider, 'openai')
assert.equal(openAiConfig.baseUrl, 'https://api.openai.com')
assert.equal(openAiConfig.apiPath, '/v1/chat/completions')
assert.equal(openAiConfig.api, 'https://api.openai.com/v1/chat/completions')

const requestConfig = buildAiRequestConfig(openAiConfig)
assert.equal(requestConfig.api, 'https://api.openai.com/v1/chat/completions')
assert.equal(requestConfig.method, 'POST')
assert.equal(requestConfig.headers.Authorization, 'Bearer demo-key')
assert.equal(requestConfig.data.model, 'gpt-4.1-mini')
assert.equal(requestConfig.data.stream, true)

const invalidConfig = validateAiConfig({
  provider: 'customOpenAI',
  baseUrl: '',
  apiPath: '/v1/chat/completions',
  key: '',
  model: '',
  port: 3456
})

assert.equal(invalidConfig.valid, false)
assert.equal(invalidConfig.messageKey, 'ai.baseUrlValidateTip')

const defaultConfig = getDefaultAiConfig('deepseek')
assert.equal(
  buildApiUrl(defaultConfig.baseUrl, defaultConfig.apiPath),
  'https://api.deepseek.com/v1/chat/completions'
)

const unknownProviderConfig = normalizeAiConfig({
  provider: 'not-exists',
  key: 'demo-key',
  model: 'demo-model'
})
assert.equal(unknownProviderConfig.provider, 'volcanoArk')

const separatedConfig = separateAppAndAiConfig({
  isDark: true,
  enableAi: true,
  provider: 'openai',
  key: 'demo-key',
  model: 'gpt-4.1-mini',
  apiPath: '/v1/chat/completions'
})
assert.deepEqual(separatedConfig.localConfig, {
  isDark: true,
  enableAi: true
})
assert.deepEqual(separatedConfig.aiConfig, {
  provider: 'openai',
  key: 'demo-key',
  model: 'gpt-4.1-mini',
  apiPath: '/v1/chat/completions'
})

assert.equal(shouldUseLocalProxyHealthcheck(true), false)
assert.equal(shouldUseLocalProxyHealthcheck(false), true)

assert.equal(DEFAULT_PORT, 3456)
assert.equal(getProxyPort([], {}), 3456)
assert.equal(getProxyPort(['--port=4567'], {}), 4567)
assert.equal(getProxyPort(['--port', '5678'], {}), 5678)
assert.equal(getProxyPort([], { AI_PROXY_PORT: '6789' }), 6789)
assert.equal(getProxyPort([], { PORT: '7890' }), 7890)
assert.equal(getProxyPort(['--port=4567'], { AI_PROXY_PORT: '6789' }), 4567)

const proxyTimeoutError = await normalizeProxyError({
  code: 'ECONNABORTED',
  message: 'timeout of 300000ms exceeded',
  response: {
    status: 504,
    data: '{"message":"gateway timeout"}'
  }
})
assert.equal(proxyTimeoutError.status, 504)
assert.equal(proxyTimeoutError.message, '上游 AI 服务请求超时')

console.log('ai provider tests passed')
