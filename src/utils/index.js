import DOMPurify from 'dompurify'
export { parseExternalJsonSafely } from './json'

const INVALID_FILE_NAME_CHARS = /[<>:"/\\|?*]/g
const INVALID_FILE_NAME_EDGE = /^[.\s]+|[.\s]+$/g

// 全屏事件检测
const getOnFullscreenEvent = () => {
  if (document.documentElement.requestFullScreen) {
    return 'onfullscreenchange'
  } else if (document.documentElement.webkitRequestFullScreen) {
    return 'onwebkitfullscreenchange'
  } else if (document.documentElement.mozRequestFullScreen) {
    return 'onmozfullscreenchange'
  } else if (document.documentElement.msRequestFullscreen) {
    return 'onmsfullscreenchange'
  }
}

export const fullscreenEvent = getOnFullscreenEvent()

// 全屏
export const fullScreen = element => {
  if (element.requestFullScreen) {
    element.requestFullScreen()
  } else if (element.webkitRequestFullScreen) {
    element.webkitRequestFullScreen()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
  }
}

// 文件转buffer
export const fileToBuffer = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.onerror = () => {
      reject(reader.error || new Error('fileToBuffer failed'))
    }
    reader.readAsArrayBuffer(file)
  })
}

export const sanitizeRichTextFragment = html => {
  return DOMPurify.sanitize(String(html || ''), {
    ALLOWED_TAGS: [
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'span',
      'font',
      'sub',
      'sup',
      'mark',
      'code'
    ],
    ALLOWED_ATTR: ['style'],
    KEEP_CONTENT: true
  })
}

export const sanitizeFileName = (value, fallback = 'mind-map') => {
  const normalized = Array.from(String(value || ''))
    .filter(char => char.charCodeAt(0) >= 32)
    .join('')
    .replace(INVALID_FILE_NAME_CHARS, '-')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')
    .replace(INVALID_FILE_NAME_EDGE, '')
    .trim()
  if (normalized) {
    return normalized
  }
  const safeFallback = Array.from(String(fallback || ''))
    .filter(char => char.charCodeAt(0) >= 32)
    .join('')
    .replace(INVALID_FILE_NAME_CHARS, '-')
    .replace(INVALID_FILE_NAME_EDGE, '')
    .trim()
  return safeFallback || 'mind-map'
}

// 复制文本到剪贴板
export const copy = text => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackCopy(text)
    })
  } else {
    fallbackCopy(text)
  }
}

const fallbackCopy = text => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
  } catch (e) {
    console.error('copy failed', e)
  }
  document.body.removeChild(textarea)
}

// 复制文本到剪贴板
export const setDataToClipboard = data => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(data)
  }
}

// 复制图片到剪贴板
export const setImgToClipboard = img => {
  if (navigator.clipboard && navigator.clipboard.write) {
    const data = [new ClipboardItem({ ['image/png']: img })]
    navigator.clipboard.write(data)
  }
}

// 打印大纲
export const printOutline = el => {
  const printContent = DOMPurify.sanitize(el.outerHTML, {
    ADD_TAGS: ['style'],
    ADD_ATTR: ['class']
  })
  const iframe = document.createElement('iframe')
  iframe.setAttribute('style', 'position: absolute; width: 0; height: 0;')
  document.body.appendChild(iframe)
  const iframeDoc = iframe.contentWindow.document
  iframeDoc.open()
  iframeDoc.write('<!doctype html><html><head></head><body></body></html>')
  iframeDoc.close()
  // 将当前页面的所有样式添加到iframe中
  const styleList = document.querySelectorAll('style')
  Array.from(styleList).forEach(el => {
    iframeDoc.head.insertAdjacentHTML('beforeend', el.outerHTML)
  })
  // 设置打印展示方式 - 纵向展示
  iframeDoc.head.insertAdjacentHTML(
    'beforeend',
    '<style media="print">@page {size: portrait;}</style>'
  )
  // 写入内容
  const wrapper = iframeDoc.createElement('div')
  wrapper.innerHTML = printContent
  iframeDoc.body.appendChild(wrapper)
  setTimeout(function () {
    iframe.contentWindow?.print()
    document.body.removeChild(iframe)
  }, 500)
}

export const getParentWithClass = (el, className) => {
  if (el.classList.contains(className)) {
    return el
  }
  if (el.parentNode && el.parentNode !== document.body) {
    return getParentWithClass(el.parentNode, className)
  }
  return null
}
