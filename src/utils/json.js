const BLOCKED_JSON_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

const validateJsonValue = value => {
  if (!value || typeof value !== 'object') {
    return
  }
  if (Array.isArray(value)) {
    value.forEach(item => {
      validateJsonValue(item)
    })
    return
  }
  Object.keys(value).forEach(key => {
    if (BLOCKED_JSON_KEYS.has(key)) {
      throw new Error('JSON 内容包含不安全字段')
    }
    validateJsonValue(value[key])
  })
}

export const parseExternalJsonSafely = input => {
  let parsed
  try {
    parsed = JSON.parse(String(input || ''))
  } catch (error) {
    throw new Error('JSON 解析失败', {
      cause: error
    })
  }
  validateJsonValue(parsed)
  return parsed
}
