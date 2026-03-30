const DEFAULT_PORT = 3456
const DEFAULT_METHOD = 'POST'
const DEFAULT_PROTOCOL = 'openai-compatible'
const DEFAULT_PROVIDER = 'volcanoArk'

export const AI_PROVIDER_LIST = [
  {
    value: 'volcanoArk',
    labelKey: 'ai.providerVolcanoArk',
    protocol: DEFAULT_PROTOCOL,
    adapter: DEFAULT_PROTOCOL,
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com',
    defaultApiPath: '/api/v3/chat/completions',
    defaultMethod: DEFAULT_METHOD
  },
  {
    value: 'openai',
    labelKey: 'ai.providerOpenAI',
    protocol: DEFAULT_PROTOCOL,
    adapter: DEFAULT_PROTOCOL,
    defaultBaseUrl: 'https://api.openai.com',
    defaultApiPath: '/v1/chat/completions',
    defaultMethod: DEFAULT_METHOD
  },
  {
    value: 'deepseek',
    labelKey: 'ai.providerDeepSeek',
    protocol: DEFAULT_PROTOCOL,
    adapter: DEFAULT_PROTOCOL,
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultApiPath: '/v1/chat/completions',
    defaultMethod: DEFAULT_METHOD
  },
  {
    value: 'siliconFlow',
    labelKey: 'ai.providerSiliconFlow',
    protocol: DEFAULT_PROTOCOL,
    adapter: DEFAULT_PROTOCOL,
    defaultBaseUrl: 'https://api.siliconflow.cn',
    defaultApiPath: '/v1/chat/completions',
    defaultMethod: DEFAULT_METHOD
  },
  {
    value: 'customOpenAI',
    labelKey: 'ai.providerCustomOpenAI',
    protocol: DEFAULT_PROTOCOL,
    adapter: DEFAULT_PROTOCOL,
    defaultBaseUrl: '',
    defaultApiPath: '/v1/chat/completions',
    defaultMethod: DEFAULT_METHOD
  }
]

export const AI_CONFIG_KEYS = [
  'provider',
  'protocol',
  'baseUrl',
  'apiPath',
  'api',
  'key',
  'model',
  'port',
  'method'
]

export const separateAppAndAiConfig = input => {
  const localConfig = {}
  const aiConfig = {}
  Object.keys(input || {}).forEach(key => {
    if (AI_CONFIG_KEYS.includes(key)) {
      aiConfig[key] = input[key]
      return
    }
    localConfig[key] = input[key]
  })
  return {
    localConfig,
    aiConfig
  }
}

export const shouldUseLocalProxyHealthcheck = isDesktop => {
  return !isDesktop
}

const trimTrailingSlash = value => String(value || '').replace(/\/+$/, '')

const normalizeApiPath = value => {
  const path = String(value || '').trim()
  if (!path) return ''
  return path.startsWith('/') ? path : `/${path}`
}

export const buildApiUrl = (baseUrl, apiPath) => {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl)
  const normalizedApiPath = normalizeApiPath(apiPath)
  if (!normalizedBaseUrl) return normalizedApiPath
  return `${normalizedBaseUrl}${normalizedApiPath}`
}

export const getAiProviderMeta = provider => {
  return (
    AI_PROVIDER_LIST.find(item => item.value === provider) ||
    AI_PROVIDER_LIST.find(item => item.value === DEFAULT_PROVIDER) ||
    AI_PROVIDER_LIST[0]
  )
}

const detectProviderByApi = api => {
  const url = String(api || '')
  if (!url) return 'volcanoArk'
  if (url.includes('ark.cn-beijing.volces.com')) return 'volcanoArk'
  if (url.includes('api.openai.com')) return 'openai'
  if (url.includes('api.deepseek.com')) return 'deepseek'
  if (url.includes('api.siliconflow.cn')) return 'siliconFlow'
  return 'customOpenAI'
}

const parseLegacyApi = api => {
  const value = String(api || '').trim()
  if (!value) {
    return {
      baseUrl: '',
      apiPath: ''
    }
  }
  try {
    const url = new URL(value)
    return {
      baseUrl: `${url.protocol}//${url.host}`,
      apiPath: `${url.pathname}${url.search || ''}`
    }
  } catch (error) {
    return {
      baseUrl: '',
      apiPath: normalizeApiPath(value)
    }
  }
}

export const getDefaultAiConfig = provider => {
  const meta = getAiProviderMeta(provider || DEFAULT_PROVIDER)
  return {
    provider: meta.value,
    protocol: meta.protocol,
    baseUrl: meta.defaultBaseUrl,
    apiPath: meta.defaultApiPath,
    api: buildApiUrl(meta.defaultBaseUrl, meta.defaultApiPath),
    key: '',
    model: '',
    port: DEFAULT_PORT,
    method: meta.defaultMethod || DEFAULT_METHOD
  }
}

export const normalizeAiConfig = config => {
  const input = config || {}
  const meta = getAiProviderMeta(input.provider || detectProviderByApi(input.api))
  const defaults = getDefaultAiConfig(meta.value)
  const legacyApi = parseLegacyApi(input.api)
  const baseUrl =
    trimTrailingSlash(input.baseUrl) ||
    trimTrailingSlash(legacyApi.baseUrl) ||
    defaults.baseUrl
  const apiPath =
    normalizeApiPath(input.apiPath) ||
    normalizeApiPath(legacyApi.apiPath) ||
    defaults.apiPath
  const portValue = Number(input.port)
  const port =
    Number.isFinite(portValue) && portValue > 0 ? portValue : defaults.port
  const method = String(input.method || defaults.method || DEFAULT_METHOD).toUpperCase()

  return {
    provider: meta.value,
    protocol: input.protocol || meta.protocol || defaults.protocol || DEFAULT_PROTOCOL,
    baseUrl,
    apiPath,
    api: buildApiUrl(baseUrl, apiPath),
    key: String(input.key || ''),
    model: String(input.model || ''),
    port,
    method
  }
}

export const validateAiConfig = config => {
  const normalized = normalizeAiConfig(config)
  if (!normalized.provider) {
    return { valid: false, messageKey: 'ai.providerValidateTip' }
  }
  if (!normalized.baseUrl) {
    return { valid: false, messageKey: 'ai.baseUrlValidateTip' }
  }
  if (!normalized.apiPath) {
    return { valid: false, messageKey: 'ai.apiPathValidateTip' }
  }
  if (!normalized.key) {
    return { valid: false, messageKey: 'ai.keyValidateTip' }
  }
  if (!normalized.model) {
    return { valid: false, messageKey: 'ai.modelValidateTip' }
  }
  if (!normalized.port) {
    return { valid: false, messageKey: 'ai.portValidateTip' }
  }
  return { valid: true, config: normalized }
}

export const buildAiRequestConfig = config => {
  const normalized = normalizeAiConfig(config)
  return {
    provider: normalized.provider,
    protocol: normalized.protocol,
    api: normalized.api,
    method: normalized.method,
    headers: {
      Authorization: `Bearer ${normalized.key}`
    },
    data: {
      model: normalized.model,
      stream: true
    }
  }
}

export const parseOpenAICompatibleStreamChunk = item => {
  if (!item || !Array.isArray(item.choices)) return ''
  return item.choices
    .map(choice => {
      const delta = choice && choice.delta
      return delta && typeof delta.content === 'string' ? delta.content : ''
    })
    .join('')
}
