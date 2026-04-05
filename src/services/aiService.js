import Ai from '@/utils/ai'
import { isDesktopApp } from '@/platform'
import {
  buildAiProxyAuthHeaders,
  normalizeAiConfig,
  shouldUseLocalProxyHealthcheck,
  validateAiConfig
} from '@/utils/aiProviders.mjs'

const AI_HEALTHCHECK_TIMEOUT_MS = 5000

const createAiError = (message, code = 'AI_ERROR', status) => {
  const error = new Error(message)
  error.code = code
  if (status) {
    error.status = status
  }
  return error
}

const fetchWithTimeout = async (
  fetcher,
  url,
  options = {},
  timeoutMs = AI_HEALTHCHECK_TIMEOUT_MS
) => {
  const controller =
    typeof AbortController === 'function' ? new AbortController() : null
  const timer = setTimeout(() => {
    controller?.abort()
  }, timeoutMs)
  try {
    return await fetcher(url, {
      ...options,
      signal: controller?.signal
    })
  } finally {
    clearTimeout(timer)
  }
}

export const normalizeAiMessages = messageList => {
  return (messageList || []).map(msg => {
    if (typeof msg === 'string') {
      return {
        role: 'user',
        content: msg
      }
    }
    return {
      role: msg.role || 'user',
      content: msg.content || ''
    }
  })
}

export const buildAiCreateAllMessages = ({ input, t }) => {
  const content = String(input || '').trim()
  return [
    {
      role: 'user',
      content: `${t('ai.aiCreateMsgPrefix')}${content}${t(
        'ai.aiCreateMsgPostfix'
      )}`
    }
  ]
}

export const buildAiCreatePartMessages = ({ input, t }) => {
  return [
    {
      role: 'user',
      content: `${String(input || '').trim()}${t('ai.aiCreatePartMsgHelp')}`
    }
  ]
}

export const createAiClient = aiConfig => {
  const config = normalizeAiConfig(aiConfig)
  const ai = new Ai({
    port: config.port
  })
  ai.init(config)
  return {
    ai,
    config
  }
}

export const checkAiAvailability = async ({
  aiConfig,
  t,
  fetcher = fetch,
  desktop = isDesktopApp()
}) => {
  const validation = validateAiConfig(aiConfig)
  if (!validation.valid) {
    throw createAiError(
      t(validation.messageKey || 'ai.configurationMissing'),
      'AI_CONFIG_INVALID'
    )
  }
  if (!shouldUseLocalProxyHealthcheck(desktop)) {
    return validation.config
  }
  try {
    const response = await fetchWithTimeout(
      fetcher,
      `http://localhost:${validation.config.port}/ai/test`,
      {
        method: 'GET',
        headers: buildAiProxyAuthHeaders()
      },
      AI_HEALTHCHECK_TIMEOUT_MS
    )
    if (!response || !response.ok) {
      throw createAiError(
        t('ai.connectFailed'),
        'AI_PROXY_UNAVAILABLE',
        response?.status
      )
    }
    return validation.config
  } catch (error) {
    throw createAiError(
      t('ai.connectFailed'),
      'AI_PROXY_UNAVAILABLE',
      error?.status
    )
  }
}

export const requestAiStream = ({
  aiConfig,
  messages,
  progress = () => {},
  end = () => {},
  error = () => {}
}) => {
  const { ai, config } = createAiClient(aiConfig)
  ai.request(
    {
      messages: normalizeAiMessages(messages)
    },
    progress,
    end,
    error
  )
  return {
    ai,
    config
  }
}
