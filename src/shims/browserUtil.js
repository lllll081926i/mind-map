const noop = () => {}

const inspectCustom =
  typeof Symbol === 'function' && typeof Symbol.for === 'function'
    ? Symbol.for('nodejs.util.inspect.custom')
    : 'inspect'

const promisifyCustom =
  typeof Symbol === 'function' && typeof Symbol.for === 'function'
    ? Symbol.for('nodejs.util.promisify.custom')
    : 'promisify'

const seenTag = '[Circular]'

function formatValue(value, seen = new WeakSet()) {
  if (value === null) return 'null'
  const type = typeof value
  if (type === 'undefined') return 'undefined'
  if (type === 'string') return value
  if (type === 'number' || type === 'boolean' || type === 'bigint') {
    return String(value)
  }
  if (type === 'symbol') {
    return value.toString()
  }
  if (type === 'function') {
    return value.name ? `[Function ${value.name}]` : '[Function anonymous]'
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) return seenTag
    seen.add(value)
    return `[${value.map(item => formatValue(item, seen)).join(', ')}]`
  }
  if (type === 'object') {
    if (seen.has(value)) return seenTag
    seen.add(value)
    if (inspectCustom && typeof value[inspectCustom] === 'function') {
      try {
        return String(value[inspectCustom]())
      } catch (error) {
        return seenTag
      }
    }
    const entries = Object.keys(value).map(
      key => `${key}: ${formatValue(value[key], seen)}`
    )
    return `{ ${entries.join(', ')} }`
  }
  return String(value)
}

export function inspect(value) {
  return formatValue(value)
}

inspect.custom = inspectCustom

export function debuglog() {
  return noop
}

export function deprecate(fn) {
  if (typeof fn !== 'function') return noop
  return function deprecatedWrapper(...args) {
    return fn.apply(this, args)
  }
}

export function format(...args) {
  return args
    .map(item => (typeof item === 'string' ? item : inspect(item)))
    .join(' ')
}

export function inherits(ctor, superCtor) {
  if (!ctor || !superCtor) return ctor
  ctor.super_ = superCtor
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  })
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(ctor, superCtor)
  } else {
    ctor.__proto__ = superCtor
  }
  return ctor
}

export function promisify(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('The "original" argument must be of type Function')
  }
  return function promisified(...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (error, value) => {
        if (error) {
          reject(error)
          return
        }
        resolve(value)
      })
    })
  }
}

promisify.custom = promisifyCustom

export function _extend(target, source) {
  return Object.assign(target || {}, source || {})
}

export default {
  debuglog,
  deprecate,
  format,
  inherits,
  inspect,
  promisify,
  _extend
}
