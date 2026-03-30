const listenersMap = new Map()

const getListeners = eventName => {
  if (!listenersMap.has(eventName)) {
    listenersMap.set(eventName, new Set())
  }
  return listenersMap.get(eventName)
}

const legacyBus = {
  $on(eventName, handler) {
    getListeners(eventName).add(handler)
  },
  $off(eventName, handler) {
    const listeners = listenersMap.get(eventName)
    if (!listeners) return
    listeners.delete(handler)
    if (listeners.size <= 0) {
      listenersMap.delete(eventName)
    }
  },
  $emit(eventName, ...args) {
    const listeners = listenersMap.get(eventName)
    if (!listeners) return
    Array.from(listeners).forEach(handler => {
      handler(...args)
    })
  }
}

export default legacyBus
