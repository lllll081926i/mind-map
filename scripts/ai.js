const express = require('express')
const axios = require('axios')
const net = require('net')

const DEFAULT_PORT = 3456
const DEFAULT_TIMEOUT = 300000
const DEFAULT_BODY_LIMIT = '256kb'
const AUTH_HEADER_NAME = 'x-ai-proxy-token'

const parsePortNumber = value => {
  const port = Number(value)
  return Number.isInteger(port) && port > 0 ? port : null
}

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

const isPortUsed = port => {
  return new Promise(resolve => {
    const server = net.createServer()
    server.once('error', err => {
      if (err.code === 'EADDRINUSE') {
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

const createServe = (runtimePort = port) => {
  const app = express()
  app.use(express.json({ limit: DEFAULT_BODY_LIMIT }))
  app.use(express.urlencoded({ extended: true, limit: DEFAULT_BODY_LIMIT }))

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.header(
      'Access-Control-Allow-Headers',
      `Content-Type, ${AUTH_HEADER_NAME}`
    )
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204)
    }
    next()
  })

  app.use((req, res, next) => {
    if (!proxyAuthToken) {
      next()
      return
    }
    const requestToken = String(req.headers[AUTH_HEADER_NAME] || '').trim()
    if (requestToken !== proxyAuthToken) {
      res.status(401).json({
        code: 401,
        msg: 'AI 代理认证失败',
        detail: '缺少或无效的代理访问令牌'
      })
      return
    }
    next()
  })

  app.get('/ai/test', (req, res) => {
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

  app.use(async (error, req, res, _next) => {
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
  })

  app.listen(runtimePort, () => {
    console.log(`app listening on port ${runtimePort}`)
  })
}

const readStreamBody = async stream => {
  if (!stream || typeof stream.on !== 'function') return ''
  return new Promise(resolve => {
    const chunks = []
    stream.setEncoding('utf8')
    stream.on('data', chunk => {
      chunks.push(chunk)
    })
    stream.on('end', () => {
      resolve(chunks.join(''))
    })
    stream.on('error', () => {
      resolve(chunks.join(''))
    })
  })
}

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
    message = '上游 AI 服务请求超时'
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
      createServe(port)
    }
  })
}

module.exports = {
  DEFAULT_PORT,
  port,
  getProxyPort,
  isPortUsed,
  createServe,
  normalizeProxyError
}
