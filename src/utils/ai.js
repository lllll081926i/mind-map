import {
  buildAiRequestConfig,
  consumeOpenAICompatibleStreamText,
  parseOpenAICompatibleStreamChunk
} from './aiProviders.mjs'
import platform, { isDesktopApp } from '@/platform'

const createAbortError = () => {
  const abortError = new Error('AbortError')
  abortError.name = 'AbortError'
  return abortError
}

class BrowserAiTransport {
  constructor(options = {}) {
    this.options = options
    this.controller = null
  }

  async request({
    request,
    handleChunkData,
    flushPendingChunk,
    getContent,
    progress = () => {},
    end = () => {}
  }) {
    this.controller = new AbortController()
    const res = await fetch(`http://localhost:${this.options.port}/ai/chat`, {
      signal: this.controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })
    if (!res.ok) {
      let message = '请求失败'
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const errorData = await res.json()
        message =
          errorData.msg ||
          errorData.message ||
          errorData.error?.message ||
          message
      } else {
        const errorText = await res.text()
        if (errorText) {
          message = errorText
        }
      }
      const error = new Error(message)
      error.status = res.status
      throw error
    }
    if (!res.body) {
      throw new Error('响应体为空')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let reading = true
    while (reading) {
      const { done, value } = await reader.read()
      if (done) {
        flushPendingChunk(progress)
        end(getContent())
        return
      }
      const text = decoder.decode(value, { stream: true })
      const isEnd = handleChunkData(text, progress)
      if (isEnd) {
        end(getContent())
        return
      }
    }
  }

  stop() {
    if (this.controller) {
      this.controller.abort()
    }
  }

  cleanup() {
    this.controller = null
  }
}

class DesktopAiTransport {
  constructor() {
    this.requestId = ''
    this.requestReject = null
    this.unlistenList = []
  }

  async request({
    requestId,
    request,
    handleChunkData,
    flushPendingChunk,
    getContent,
    progress = () => {},
    end = () => {}
  }) {
    this.requestId = requestId
    return new Promise((resolve, reject) => {
      let finished = false

      const finishSuccess = () => {
        if (finished) return
        finished = true
        end(getContent())
        this.cleanup()
        resolve()
      }

      const finishError = error => {
        if (finished) return
        finished = true
        this.cleanup()
        reject(error)
      }

      this.requestReject = finishError

      void (async () => {
        try {
          const chunkUnlisten = await platform.listen(
            'ai-proxy://chunk',
            event => {
              if (!event.payload || event.payload.requestId !== this.requestId) {
                return
              }
              try {
                const isEnd = handleChunkData(event.payload.chunk || '', progress)
                if (isEnd) {
                  finishSuccess()
                }
              } catch (error) {
                void platform.stopAiProxyRequest({
                  requestId: this.requestId
                })
                finishError(error)
              }
            }
          )
          const doneUnlisten = await platform.listen(
            'ai-proxy://done',
            event => {
              if (!event.payload || event.payload.requestId !== this.requestId) {
                return
              }
              flushPendingChunk(progress)
              finishSuccess()
            }
          )
          const errorUnlisten = await platform.listen(
            'ai-proxy://error',
            event => {
              if (!event.payload || event.payload.requestId !== this.requestId) {
                return
              }
              const error = new Error(event.payload.message || '请求失败')
              error.status = event.payload.status
              finishError(error)
            }
          )
          this.unlistenList = [chunkUnlisten, doneUnlisten, errorUnlisten]

          await platform.startAiProxyRequest({
            requestId: this.requestId,
            request
          })
        } catch (error) {
          finishError(error)
        }
      })()
    })
  }

  stop() {
    if (!this.requestId) return
    void platform.stopAiProxyRequest({
      requestId: this.requestId
    })
    if (typeof this.requestReject === 'function') {
      this.requestReject(createAbortError())
      return
    }
    this.cleanup()
  }

  cleanup() {
    this.unlistenList.forEach(unlisten => {
      if (typeof unlisten === 'function') {
        unlisten()
      }
    })
    this.unlistenList = []
    this.requestReject = null
    this.requestId = ''
  }
}

const createAiTransport = options => {
  return isDesktopApp()
    ? new DesktopAiTransport()
    : new BrowserAiTransport(options)
}

class Ai {
  constructor(options = {}) {
    this.options = options
    this.baseData = {}
    this.currentChunk = ''
    this.content = ''
    this.transport = createAiTransport(options)
  }

  init(type = {}, options = {}) {
    const config = typeof type === 'string' ? options : type
    this.baseData = buildAiRequestConfig(config)
    this.content = ''
    this.currentChunk = ''
    this.transport.cleanup()
    this.transport = createAiTransport(this.options)
  }

  buildRequest(data) {
    return {
      ...this.baseData,
      data: {
        ...this.baseData.data,
        ...data
      }
    }
  }

  async request(data, progress = () => {}, end = () => {}, err = () => {}) {
    try {
      this.content = ''
      this.currentChunk = ''
      await this.transport.request({
        requestId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        request: this.buildRequest(data),
        handleChunkData: (chunk, nextProgress) =>
          this.handleChunkData(chunk, nextProgress),
        flushPendingChunk: nextProgress => this.flushPendingChunk(nextProgress),
        getContent: () => this.content,
        progress,
        end
      })
    } catch (error) {
      console.error('Ai.request failed', error)
      if (!(error && error.name === 'AbortError')) {
        err(error)
      }
    } finally {
      this.transport.cleanup()
    }
  }

  appendChunkContent(list) {
    list.forEach(item => {
      if (item && item.error) {
        throw new Error(item.error.message || '请求失败')
      }
      this.content += parseOpenAICompatibleStreamChunk(item)
    })
  }

  handleChunkData(chunk, progress = () => {}) {
    const result = consumeOpenAICompatibleStreamText(this.currentChunk, chunk)
    this.currentChunk = result.pending
    this.appendChunkContent(result.items)
    progress(this.content)
    return result.done
  }

  flushPendingChunk(progress = () => {}) {
    if (!this.currentChunk) return
    const result = consumeOpenAICompatibleStreamText(this.currentChunk, '\n\n')
    this.currentChunk = result.pending
    this.appendChunkContent(result.items)
    progress(this.content)
  }

  stop() {
    this.transport.stop()
  }
}

export default Ai
