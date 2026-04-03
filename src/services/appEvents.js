const listenersMap = new Map()

export const APP_EVENTS = {
  WRITE_LOCAL_FILE: 'write_local_file',
  LOCAL_STORAGE_EXCEEDED: 'localStorageExceeded',
  BOOTSTRAP_STATE_READY: 'bootstrapStateReady',
  AI_CREATE_ALL: 'ai_create_all',
  AI_CREATE_PART: 'ai_create_part',
  AI_CHAT: 'ai_chat',
  AI_CHAT_STOP: 'ai_chat_stop',
  SHOW_AI_CONFIG_DIALOG: 'showAiConfigDialog',
  SHOW_LOADING: 'showLoading',
  SHOW_IMPORT: 'showImport',
  SHOW_EXPORT: 'showExport',
  SHOW_SEARCH: 'showSearch',
  TOGGLE_MINI_MAP: 'toggleMiniMap',
  SHOW_NODE_IMAGE: 'showNodeImage',
  SHOW_NODE_LINK: 'showNodeLink',
  SHOW_NODE_NOTE: 'showNodeNote',
  SHOW_NODE_TAG: 'showNodeTag'
}

const getListeners = eventName => {
  if (!listenersMap.has(eventName)) {
    listenersMap.set(eventName, new Set())
  }
  return listenersMap.get(eventName)
}

export const onAppEvent = (eventName, handler) => {
  const listeners = getListeners(eventName)
  listeners.add(handler)
  return () => {
    offAppEvent(eventName, handler)
  }
}

export const offAppEvent = (eventName, handler) => {
  const listeners = listenersMap.get(eventName)
  if (!listeners) return
  listeners.delete(handler)
  if (listeners.size <= 0) {
    listenersMap.delete(eventName)
  }
}

export const emitAppEvent = (eventName, ...args) => {
  const listeners = listenersMap.get(eventName)
  if (!listeners || listeners.size <= 0) return
  Array.from(listeners).forEach(handler => {
    try {
      handler(...args)
    } catch (error) {
      console.error(`emitAppEvent handler error [${eventName}]`, error)
    }
  })
}

export const onWriteLocalFile = handler =>
  onAppEvent(APP_EVENTS.WRITE_LOCAL_FILE, handler)

export const emitWriteLocalFile = payload =>
  emitAppEvent(APP_EVENTS.WRITE_LOCAL_FILE, payload)

export const onBootstrapStateReady = handler =>
  onAppEvent(APP_EVENTS.BOOTSTRAP_STATE_READY, handler)

export const emitBootstrapStateReady = payload =>
  emitAppEvent(APP_EVENTS.BOOTSTRAP_STATE_READY, payload)

export const onLocalStorageExceeded = handler =>
  onAppEvent(APP_EVENTS.LOCAL_STORAGE_EXCEEDED, handler)

export const emitLocalStorageExceeded = () =>
  emitAppEvent(APP_EVENTS.LOCAL_STORAGE_EXCEEDED)

export const onAiCreateAll = handler =>
  onAppEvent(APP_EVENTS.AI_CREATE_ALL, handler)

export const emitAiCreateAll = () => emitAppEvent(APP_EVENTS.AI_CREATE_ALL)

export const onAiCreatePart = handler =>
  onAppEvent(APP_EVENTS.AI_CREATE_PART, handler)

export const emitAiCreatePart = node =>
  emitAppEvent(APP_EVENTS.AI_CREATE_PART, node)

export const onAiChat = handler => onAppEvent(APP_EVENTS.AI_CHAT, handler)

export const emitAiChat = (...args) => emitAppEvent(APP_EVENTS.AI_CHAT, ...args)

export const onAiChatStop = handler =>
  onAppEvent(APP_EVENTS.AI_CHAT_STOP, handler)

export const emitAiChatStop = () => emitAppEvent(APP_EVENTS.AI_CHAT_STOP)

export const onShowAiConfigDialog = handler =>
  onAppEvent(APP_EVENTS.SHOW_AI_CONFIG_DIALOG, handler)

export const emitShowAiConfigDialog = () =>
  emitAppEvent(APP_EVENTS.SHOW_AI_CONFIG_DIALOG)

export const onShowLoading = handler =>
  onAppEvent(APP_EVENTS.SHOW_LOADING, handler)

export const emitShowLoading = () => emitAppEvent(APP_EVENTS.SHOW_LOADING)

export const onShowImport = handler => onAppEvent(APP_EVENTS.SHOW_IMPORT, handler)

export const emitShowImport = payload =>
  emitAppEvent(APP_EVENTS.SHOW_IMPORT, payload)

export const onShowExport = handler => onAppEvent(APP_EVENTS.SHOW_EXPORT, handler)

export const emitShowExport = payload =>
  emitAppEvent(APP_EVENTS.SHOW_EXPORT, payload)

export const onShowSearch = handler => onAppEvent(APP_EVENTS.SHOW_SEARCH, handler)

export const emitShowSearch = () => emitAppEvent(APP_EVENTS.SHOW_SEARCH)

export const onToggleMiniMap = handler =>
  onAppEvent(APP_EVENTS.TOGGLE_MINI_MAP, handler)

export const emitToggleMiniMap = payload =>
  emitAppEvent(APP_EVENTS.TOGGLE_MINI_MAP, payload)

export const onShowNodeImage = handler =>
  onAppEvent(APP_EVENTS.SHOW_NODE_IMAGE, handler)

export const emitShowNodeImage = payload =>
  emitAppEvent(APP_EVENTS.SHOW_NODE_IMAGE, payload)

export const onShowNodeLink = handler =>
  onAppEvent(APP_EVENTS.SHOW_NODE_LINK, handler)

export const emitShowNodeLink = payload =>
  emitAppEvent(APP_EVENTS.SHOW_NODE_LINK, payload)

export const onShowNodeNote = handler =>
  onAppEvent(APP_EVENTS.SHOW_NODE_NOTE, handler)

export const emitShowNodeNote = payload =>
  emitAppEvent(APP_EVENTS.SHOW_NODE_NOTE, payload)

export const onShowNodeTag = handler =>
  onAppEvent(APP_EVENTS.SHOW_NODE_TAG, handler)

export const emitShowNodeTag = payload =>
  emitAppEvent(APP_EVENTS.SHOW_NODE_TAG, payload)

export default {
  on: onAppEvent,
  off: offAppEvent,
  emit: emitAppEvent
}
