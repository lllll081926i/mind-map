const express = require('express')
const axios = require('axios')
const net = require('net')

const DEFAULT_PORT = 3456
const DEFAULT_TIMEOUT = 300000

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
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', '*')
    res.header('Access-Control-Allow-Headers', '*')
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
    const { api, method = 'POST', headers = {}, data, timeout = DEFAULT_TIMEOUT } =
      req.body

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

  app.use(async (error, req, res, next) => {
    const payload = await normalizeProxyError(error)
    if (res.headersSent) {
      return next(error)
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
      message =
        parsed.msg ||
        parsed.message ||
        parsed.error?.message ||
        message
      detail = parsed.detail || detail
    } catch (parseError) {
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
