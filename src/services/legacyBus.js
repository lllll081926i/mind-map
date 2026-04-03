import appEvents from './appEvents.js'

const legacyBus = {
  $on(eventName, handler) {
    appEvents.on(eventName, handler)
  },
  $off(eventName, handler) {
    appEvents.off(eventName, handler)
  },
  $emit(eventName, ...args) {
    appEvents.emit(eventName, ...args)
  }
}

export default legacyBus
