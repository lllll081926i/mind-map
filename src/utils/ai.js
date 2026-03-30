import {
  buildAiRequestConfig,
  consumeOpenAICompatibleStreamText,
  parseOpenAICompatibleStreamChunk
} from './aiProviders.mjs'
import platform, { isDesktopApp } from '@/platform'

class Ai {
  constructor(options = {}) {
    this.options = options

    this.baseData = {}
    this.controller = null
    this.currentChunk = ''
    this.content = ''
    this.requestId = ''
    this.unlistenList = []
    this.desktopRequestReject = null
  }

  init(type = {}, options = {}) {
    const config = typeof type === 'string' ? options : type
    this.baseData = buildAiRequestConfig(config)
    this.content = ''
    this.currentChunk = ''
  }

  async request(data, progress = () => {}, end = () => {}, err = () => {}) {
    try {
      this.content = ''
      this.currentChunk = ''
      this.requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      if (isDesktopApp()) {
        await this.requestByDesktop(data, progress, end, err)
        return
      }
      const res = await this.postMsg(data)
      const decoder = new TextDecoder()
      while (1) {
        const { done, value } = await res.read()
        if (done) {
          this.flushPendingChunk(progress)
          end(this.content)
          return
        }
        // 拿到当前切片的数据
        const text = decoder.decode(value, { stream: true })
        const isEnd = this.handleChunkData(text, progress)
        if (isEnd) {
          end(this.content)
          return
        }
      }
    } catch (error) {
      console.log(error)
      // 手动停止请求不需要触发错误回调
      if (!(error && error.name === 'AbortError')) {
        err(error)
      }
    } finally {
      this.clearDesktopListeners()
    }
  }

  async requestByDesktop(data, progress = () => {}, end = () => {}, err = () => {}) {
    return new Promise(async (resolve, reject) => {
      const request = {
        ...this.baseData,
        data: {
          ...this.baseData.data,
          ...data
        }
      }
      let finished = false

      const finishSuccess = () => {
        if (finished) return
        finished = true
        this.desktopRequestReject = null
        this.requestId = ''
        end(this.content)
        resolve()
      }

      const finishError = nextError => {
        if (finished) return
        finished = true
        this.desktopRequestReject = null
        this.requestId = ''
        err(nextError)
        reject(nextError)
      }
      this.desktopRequestReject = finishError

      const handleChunkText = text => {
        const isEnd = this.handleChunkData(text, progress)
        if (isEnd) {
          finishSuccess()
        }
      }

      const chunkUnlisten = await platform.listen('ai-proxy://chunk', event => {
        if (!event.payload || event.payload.requestId !== this.requestId) return
        try {
          handleChunkText(event.payload.chunk || '')
        } catch (error) {
          void platform.stopAiProxyRequest({
            requestId: this.requestId
          })
          finishError(error)
        }
      })
      const doneUnlisten = await platform.listen('ai-proxy://done', event => {
        if (!event.payload || event.payload.requestId !== this.requestId) return
        this.flushPendingChunk(progress)
        finishSuccess()
      })
      const errorUnlisten = await platform.listen('ai-proxy://error', event => {
        if (!event.payload || event.payload.requestId !== this.requestId) return
        const nextError = new Error(event.payload.message || '请求失败')
        nextError.status = event.payload.status
        finishError(nextError)
      })
      this.unlistenList = [chunkUnlisten, doneUnlisten, errorUnlisten]

      try {
        await platform.startAiProxyRequest({
          requestId: this.requestId,
          request
        })
      } catch (error) {
        finishError(error)
      }
    })
  }

  async postMsg(data) {
    this.controller = new AbortController()
    const res = await fetch(`http://localhost:${this.options.port}/ai/chat`, {
      signal: this.controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...this.baseData,
        data: {
          ...this.baseData.data,
          ...data
        }
      })
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
    return res.body.getReader()
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
    if (isDesktopApp() && this.requestId) {
      void platform.stopAiProxyRequest({
        requestId: this.requestId
      })
      if (typeof this.desktopRequestReject === 'function') {
        const abortError = new Error('AbortError')
        abortError.name = 'AbortError'
        this.desktopRequestReject(abortError)
      } else {
        this.clearDesktopListeners()
        this.requestId = ''
      }
    }
    if (this.controller) {
      this.controller.abort()
    }
    this.controller = null
  }

  clearDesktopListeners() {
    this.unlistenList.forEach(unlisten => {
      if (typeof unlisten === 'function') {
        unlisten()
      }
    })
    this.unlistenList = []
    this.desktopRequestReject = null
  }
}

export default Ai
