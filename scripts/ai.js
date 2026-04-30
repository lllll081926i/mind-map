/**
 * @typedef {{
 *   authToken?: string
 *   allowedOrigin?: string
 *   host?: string
 * }} ProxyServerOptions
 */

const express = require('express')
const axios = require('axios')
const net = require('net')

const DEFAULT_PORT = 3456
const DEFAULT_TIMEOUT = 300000
const DEFAULT_BODY_LIMIT = '256kb'
const AUTH_HEADER_NAME = 'x-ai-proxy-token'
const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:5173'

/** @param {string} hostname */
const isPrivateOrReservedHostname = hostname => {
  if (!hostname) return true
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (lower === 'localhost' || lower.endsWith('.localhost')) return true
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number)
    if (octets.some(octet => octet < 0 || octet > 255)) return true
    const [first, second] = octets
    if (first === 0 || first === 10 || first === 127) return true
    if (first === 100 && second >= 64 && second <= 127) return true
    if (first === 169 && second === 254) return true
    if (first === 172 && second >= 16 && second <= 31) return true
    if (first === 192 && second === 168) return true
    if (first === 198 && (second === 18 || second === 19)) return true
    if (first >= 224) return true
    return false
  }
  if (lower === '::' || lower === '::1') return true
  if (lower.startsWith('::ffff:')) return true
  if (/^(fc|fd|fe80:|2001:db8:)/i.test(lower)) return true
  if (lower.endsWith('.local') || lower.endsWith('.internal')) return true
  return false
}

/**
 * Validates that a URL points to a public endpoint, not a private/internal address.
 * @param {string} urlString
 * @returns {{ valid: boolean, reason?: string }}
 */
const validateProxyTargetUrl = urlString => {
  const value = String(urlString || '').trim()
  if (!value) {
    return { valid: false, reason: 'API URL 不能为空 / API URL is required' }
  }
  let parsed
  try {
    parsed = new URL(value)
  } catch (_error) {
    return { valid: false, reason: 'API URL 格式无效 / Invalid API URL format' }
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, reason: '仅支持 http/https 协议 / Only http/https protocols are allowed' }
  }
  if (isPrivateOrReservedHostname(parsed.hostname)) {
    return {
      valid: false,
      reason: '不允许请求内网或保留地址 / Requests to private or reserved addresses are not allowed'
    }
  }
  return { valid: true }
}

/** @param {unknown} value */
const parsePortNumber = value => {
  const port = Number(value)
  return Number.isInteger(port) && port > 0 ? port : null
}

/**
 * @param {string[]} [argv]
 * @param {NodeJS.ProcessEnv} [env]
 */
const getProxyPort = (argv = [], env = process.env) => {
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i]
    if (typeof item !== 'string') continue
    if (item.startsWith('--port=')) {
      const port = parsePortNumber(item.slice('--port='.length))
      if (port) return port
      continue
    }
    if (item === '--port') {
      const port = parsePortNumber(argv[i + 1])
      if (port) return port
    }
  }

  const envPort =
    parsePortNumber(env?.AI_PROXY_PORT) || parsePortNumber(env?.PORT)
  return envPort || DEFAULT_PORT
}

const port = getProxyPort(process.argv.slice(2), process.env)
const proxyAuthToken = String(process.env.AI_PROXY_TOKEN || '').trim()

/** @param {unknown} value */
const resolveProxyAuthToken = value => {
  const normalizedToken = String(value || '').trim()
  if (!normalizedToken) {
    throw new Error(
      'AI_PROXY_TOKEN 未配置，AI 本地代理拒绝无认证启动\n' +
      'AI_PROXY_TOKEN is not set. The local AI proxy refuses to start without authentication.'
    )
  }
  return normalizedToken
}

/** @param {unknown} value */
const normalizeAllowedOrigins = value => {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean)
  }
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

/** @param {number} port */
const isPortUsed = port => {
  return new Promise(resolve => {
    const server = net.createServer()
    /** @param {NodeJS.ErrnoException} err */
    server.once('error', err => {
      const normalizedError = /** @type {NodeJS.ErrnoException} */ (err)
      if (normalizedError.code === 'EADDRINUSE') {
        resolve(true)
      } else {
        resolve(false)
      }
    })
    server.once('listening', () => {
      server.close(() => resolve(false))
    })
    server.listen(port)
  })
}

/**
 * @param {number} [runtimePort]
 * @param {ProxyServerOptions} [options]
 */
const createServe = (
  runtimePort = port,
  { authToken = proxyAuthToken, allowedOrigin = DEFAULT_ALLOWED_ORIGIN, host } = {}
) => {
  const requiredAuthToken = resolveProxyAuthToken(authToken)
  const allowedOrigins = new Set(normalizeAllowedOrigins(allowedOrigin))
  const app = express()
  app.use(express.json({ limit: DEFAULT_BODY_LIMIT }))
  app.use(express.urlencoded({ extended: true, limit: DEFAULT_BODY_LIMIT }))

  /** @type {import('express').RequestHandler} */
  const requireAllowedOrigin = (req, res, next) => {
    const requestOrigin = String(req.headers.origin || '').trim()
    if (!requestOrigin || allowedOrigins.size === 0 || allowedOrigins.has(requestOrigin)) {
      next()
      return
    }
    res.status(403).json({
      code: 403,
      msg: 'AI 代理来源未授权 / Origin not allowed',
      detail: '当前浏览器来源不在本地代理白名单内 / The browser origin is not in the proxy allowlist'
    })
  }
  app.use(requireAllowedOrigin)

  /** @type {import('express').RequestHandler} */
  const applyCorsHeaders = (req, res, next) => {
    const requestOrigin = String(req.headers.origin || '').trim()
    if (requestOrigin && allowedOrigins.has(requestOrigin)) {
      res.header('Access-Control-Allow-Origin', requestOrigin)
      res.header('Vary', 'Origin')
    }
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.header(
      'Access-Control-Allow-Headers',
      `Content-Type, ${AUTH_HEADER_NAME}`
    )
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204)
    }
    next()
  }
  app.use(applyCorsHeaders)

  /** @type {import('express').RequestHandler} */
  const requireProxyToken = (req, res, next) => {
    const requestToken = String(req.headers[AUTH_HEADER_NAME] || '').trim()
    if (requestToken !== requiredAuthToken) {
      res.status(401).json({
        code: 401,
        msg: 'AI 代理认证失败 / Authentication failed',
        detail: '缺少或无效的代理访问令牌 / Missing or invalid proxy access token'
      })
      return
    }
    next()
  }
  app.use(requireProxyToken)

  app.get('/ai/test', (_req, res) => {
    res
      .json({
        code: 0,
        data: null,
        msg: '连接成功'
      })
      .end()
  })

  app.post('/ai/chat', async (req, res, next) => {
    const {
      api,
      method = 'POST',
      headers = {},
      data,
      timeout = DEFAULT_TIMEOUT
    } = req.body

    const urlValidation = validateProxyTargetUrl(api)
    if (!urlValidation.valid) {
      res.status(400).json({
        code: 400,
        msg: 'API URL 校验失败 / API URL validation failed',
        detail: urlValidation.reason
      })
      return
    }

    try {
      const response = await axios({
        url: api,
        method,
        headers,
        data,
        timeout,
        responseType: 'stream'
      })
      res.status(response.status)
      res.setHeader(
        'Content-Type',
        response.headers['content-type'] || 'text/event-stream'
      )
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      response.data.pipe(res)
    } catch (error) {
      next(error)
    }
  })

  /** @type {import('express').ErrorRequestHandler} */
  const handleProxyError = async (error, _req, res, _next) => {
    const payload = await normalizeProxyError(error)
    if (res.headersSent) {
      console.error('AI proxy error after headers sent:', payload)
      return res.end()
    }
    res.status(payload.status).json({
      code: payload.status,
      msg: payload.message,
      detail: payload.detail
    })
  }
  app.use(handleProxyError)

  const onListen = () => {
    console.log(`app listening on port ${runtimePort}`)
  }
  const server = host
    ? app.listen(runtimePort, host, onListen)
    : app.listen(runtimePort, onListen)
  return server
}

const MAX_ERROR_BODY_BYTES = 4096

/** @param {NodeJS.ReadableStream | null | undefined} stream */
const readStreamBody = async stream => {
  if (!stream || typeof stream.on !== 'function') return ''
  return new Promise(resolve => {
    /** @type {string[]} */
    const chunks = []
    let totalBytes = 0
    let truncated = false
    stream.setEncoding('utf8')
    /** @param {string} chunk */
    stream.on('data', chunk => {
      if (truncated) return
      totalBytes += Buffer.byteLength(chunk, 'utf8')
      chunks.push(chunk)
      if (totalBytes > MAX_ERROR_BODY_BYTES) {
        truncated = true
        resolve(chunks.join('').slice(0, MAX_ERROR_BODY_BYTES))
      }
    })
    stream.on('end', () => {
      if (!truncated) resolve(chunks.join(''))
    })
    stream.on('error', () => {
      if (!truncated) resolve(chunks.join(''))
    })
  })
}

/** @param {any} error */
const normalizeProxyError = async error => {
  const status = error?.response?.status || error?.status || 500
  let message = error?.message || '请求失败'
  let detail = ''
  const responseData = error?.response?.data

  if (responseData) {
    if (typeof responseData === 'string') {
      detail = responseData
    } else if (typeof responseData.on === 'function') {
      detail = await readStreamBody(responseData)
    } else if (typeof responseData === 'object') {
      detail =
        responseData.detail ||
        responseData.msg ||
        responseData.message ||
        JSON.stringify(responseData)
    }
  }

  if (detail) {
    try {
      const parsed = JSON.parse(detail)
      message = parsed.msg || parsed.message || parsed.error?.message || message
      detail = parsed.detail || detail
    } catch (_parseError) {
      message = detail
    }
  }

  if (error?.code === 'ECONNABORTED') {
    message = '上游 AI 服务请求超时 / Upstream AI service request timed out'
  }

  return {
    status,
    message,
    detail
  }
}

if (require.main === module) {
  isPortUsed(port).then(isUsed => {
    if (isUsed) {
      console.error(`端口 ${port} 被占用`)
      process.exitCode = 1
    } else {
      try {
        createServe(port)
      } catch (error) {
        console.error(error instanceof Error ? error.message : error)
        process.exitCode = 1
      }
    }
  })
}

module.exports = {
  DEFAULT_PORT,
  AUTH_HEADER_NAME,
  port,
  getProxyPort,
  isPortUsed,
  createServe,
  resolveProxyAuthToken,
  normalizeProxyError,
  validateProxyTargetUrl
}
