import { defineStore } from 'pinia'
import {
  getDefaultAiConfig,
  normalizeAiConfig
} from '@/utils/aiProviders.mjs'
import { parseExternalJsonSafely } from '@/utils/json'

const AI_CHAT_STORAGE_KEY = 'mindmap-ai-chat-session-v1'
const MAX_CHAT_MESSAGES = 30
let aiUidSeed = 0

const createAiUid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  aiUidSeed += 1
  return `ai-${Date.now()}-${aiUidSeed}`
}

const createChatMessage = (type, content = '', extra = {}) => {
  return {
    id: createAiUid(),
    type,
    content: String(content || ''),
    rawContent:
      typeof extra.rawContent === 'string'
        ? extra.rawContent
        : String(content || ''),
    status: extra.status || 'done',
    includeInHistory:
      typeof extra.includeInHistory === 'boolean'
        ? extra.includeInHistory
        : true,
    createdAt: extra.createdAt || Date.now()
  }
}

const canUseStorage = () => {
  return typeof window !== 'undefined' && !!window.localStorage
}

const normalizeChatMessage = item => {
  if (!item || typeof item !== 'object') return null
  const type = item.type === 'ai' ? 'ai' : item.type === 'user' ? 'user' : ''
  if (!type) return null
  return {
    id: item.id || createAiUid(),
    type,
    content: String(item.content || ''),
    rawContent: String(item.rawContent || item.content || ''),
    status: item.status || 'done',
    includeInHistory:
      typeof item.includeInHistory === 'boolean' ? item.includeInHistory : true,
    createdAt: Number(item.createdAt) || Date.now()
  }
}

const readChatSession = () => {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(AI_CHAT_STORAGE_KEY)
    if (!raw) return null
    const parsed = parseExternalJsonSafely(raw)
    return {
      chatDraft: String(parsed.chatDraft || ''),
      chatStatus: parsed.chatStatus === 'streaming' ? 'streaming' : 'idle',
      chatError: String(parsed.chatError || ''),
      lastUserMessageText: String(parsed.lastUserMessageText || ''),
      activeAssistantMessageId: '',
      chatList: Array.isArray(parsed.chatList)
        ? parsed.chatList
            .map(normalizeChatMessage)
            .filter(Boolean)
            .slice(-MAX_CHAT_MESSAGES)
        : []
    }
  } catch (error) {
    console.error('readChatSession failed', error)
    return null
  }
}

const writeChatSession = state => {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(
      AI_CHAT_STORAGE_KEY,
      JSON.stringify({
        chatDraft: state.chatDraft || '',
        chatStatus: state.chatStatus === 'streaming' ? 'streaming' : 'idle',
        chatError: state.chatError || '',
        lastUserMessageText: state.lastUserMessageText || '',
        chatList: (state.chatList || []).slice(-MAX_CHAT_MESSAGES)
      })
    )
  } catch (error) {
    console.error('writeChatSession failed', error)
  }
}

const createDefaultChatState = () => ({
  chatDraft: '',
  chatList: [],
  chatStatus: 'idle',
  chatError: '',
  activeAssistantMessageId: '',
  lastUserMessageText: '',
  chatSessionHydrated: false
})

export const useAiStore = defineStore('ai', {
  state: () => ({
    config: getDefaultAiConfig('volcanoArk'),
    enabled: false,
    ...createDefaultChatState()
  }),
  actions: {
    setConfig(nextConfig) {
      const normalizedConfig = normalizeAiConfig(nextConfig)
      this.config = normalizedConfig
      this.enabled = !!(normalizedConfig.model && normalizedConfig.key)
    },

    hydrateChatSession() {
      if (this.chatSessionHydrated) return
      this.chatSessionHydrated = true
      const cachedState = readChatSession()
      if (!cachedState) return
      Object.assign(this, cachedState)
    },

    persistChatSession() {
      writeChatSession(this.$state)
    },

    setChatDraft(value) {
      this.chatDraft = String(value || '')
      this.persistChatSession()
    },

    appendUserMessage(content) {
      const message = createChatMessage('user', content, {
        rawContent: String(content || '')
      })
      this.chatList = [...this.chatList, message].slice(-MAX_CHAT_MESSAGES)
      this.lastUserMessageText = message.rawContent
      this.persistChatSession()
      return message.id
    },

    appendAssistantPlaceholder() {
      const message = createChatMessage('ai', '', {
        rawContent: '',
        status: 'streaming',
        includeInHistory: false
      })
      this.chatList = [...this.chatList, message].slice(-MAX_CHAT_MESSAGES)
      this.activeAssistantMessageId = message.id
      this.persistChatSession()
      return message.id
    },

    updateAssistantMessage({
      id,
      content = '',
      rawContent = '',
      status = 'streaming',
      includeInHistory = true
    }) {
      if (!id) return
      this.chatList = this.chatList.map(item => {
        if (item.id !== id) return item
        return {
          ...item,
          content: String(content || ''),
          rawContent: String(rawContent || ''),
          status,
          includeInHistory
        }
      })
      this.persistChatSession()
    },

    startChatRequest(question) {
      this.chatError = ''
      this.chatStatus = 'streaming'
      this.appendUserMessage(question)
      const assistantId = this.appendAssistantPlaceholder()
      this.chatDraft = ''
      this.persistChatSession()
      return assistantId
    },

    finishChatRequest({ id, content = '', rawContent = '' }) {
      this.updateAssistantMessage({
        id,
        content,
        rawContent,
        status: 'done',
        includeInHistory: !!String(rawContent || '').trim()
      })
      this.chatStatus = 'idle'
      this.chatError = ''
      this.activeAssistantMessageId = ''
      this.persistChatSession()
    },

    failChatRequest({ id, content = '', rawContent = '', message = '' }) {
      const normalizedRaw = String(rawContent || '').trim()
      const normalizedContent = String(content || '').trim()
      if (id) {
        this.chatList = this.chatList.map(item => {
          if (item.id !== id) return item
          return {
            ...item,
            content: normalizedContent,
            rawContent: normalizedRaw,
            status: 'error',
            includeInHistory: !!normalizedRaw
          }
        })
      }
      this.chatStatus = 'idle'
      this.chatError = String(message || '')
      this.activeAssistantMessageId = ''
      this.persistChatSession()
    },

    stopChatRequest({ id, content = '', rawContent = '' } = {}) {
      const normalizedRaw = String(rawContent || '').trim()
      if (id) {
        this.chatList = this.chatList
          .map(item => {
            if (item.id !== id) return item
            if (!normalizedRaw && !item.rawContent && !item.content) {
              return {
                ...item,
                content: String(content || ''),
                rawContent: '',
                status: 'stopped',
                includeInHistory: false
              }
            }
            return {
              ...item,
              content: String(content || item.content || ''),
              rawContent: normalizedRaw || item.rawContent || '',
              status: 'stopped',
              includeInHistory: !!(normalizedRaw || item.rawContent)
            }
          })
          .filter(Boolean)
      }
      this.chatStatus = 'idle'
      this.chatError = ''
      this.activeAssistantMessageId = ''
      this.persistChatSession()
    },

    clearChatSession() {
      Object.assign(this, createDefaultChatState())
      this.chatSessionHydrated = true
      this.persistChatSession()
    },

    getHistoryMessages() {
      return this.chatList
        .filter(item => item.includeInHistory)
        .map(item => {
          return {
            role: item.type === 'ai' ? 'assistant' : 'user',
            content: item.rawContent || item.content
          }
        })
    }
  }
})
