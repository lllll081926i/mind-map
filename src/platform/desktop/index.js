import { isDesktopRuntime } from '../runtime.mjs'

const getFileName = filePath => {
  return String(filePath || '')
    .split(/[\\/]/)
    .pop()
}

const browserFileStore = new Map()
const MAX_BROWSER_FILE_STORE_SIZE = 12

const setBrowserFileEntry = (path, entry) => {
  if (!path) return
  if (browserFileStore.has(path)) {
    browserFileStore.delete(path)
  }
  browserFileStore.set(path, entry)
  while (browserFileStore.size > MAX_BROWSER_FILE_STORE_SIZE) {
    const oldestKey = browserFileStore.keys().next().value
    if (!oldestKey) break
    browserFileStore.delete(oldestKey)
  }
}

const getBrowserFileEntry = path => {
  const entry = browserFileStore.get(path)
  if (!entry) return null
  setBrowserFileEntry(path, entry)
  return entry
}

const readBrowserFileText = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => {
      reject(reader.error || new Error('read browser file failed'))
    }
    reader.readAsText(file)
  })
}

const createBrowserFilePath = name => {
  const safeName = String(name || 'mind-map.smm').trim() || 'mind-map.smm'
  return `memory://${Date.now()}-${Math.random().toString(36).slice(2)}/${safeName}`
}

export const normalizeSaveName = suggestedName => {
  const baseName = String(suggestedName || '思维导图').trim() || '思维导图'
  return /\.smm$/i.test(baseName) ? baseName : `${baseName}.smm`
}

export const ensureSmmFilePath = filePath => {
  const normalizedPath = String(filePath || '').trim()
  if (!normalizedPath) {
    return normalizeSaveName()
  }
  return /\.smm$/i.test(normalizedPath)
    ? normalizedPath
    : `${normalizedPath}.smm`
}

export const buildDesktopSaveDefaultPath = ({
  defaultPath,
  suggestedName
} = {}) => {
  const normalizedName = normalizeSaveName(suggestedName)
  const normalizedDefaultPath = String(defaultPath || '').trim()
  if (!normalizedDefaultPath) {
    return normalizedName
  }
  if (/\.smm$/i.test(normalizedDefaultPath)) {
    return ensureSmmFilePath(normalizedDefaultPath)
  }
  const sanitizedBasePath = normalizedDefaultPath.replace(/[\\/]+$/, '')
  if (!sanitizedBasePath) {
    return normalizedName
  }
  const separator =
    sanitizedBasePath.includes('\\') && !sanitizedBasePath.includes('/')
      ? '\\'
      : '/'
  return `${sanitizedBasePath}${separator}${normalizedName}`
}

const normalizeInvokeErrorMessage = (error, fallbackMessage) => {
  const rawMessage =
    error?.message || error?.msg || error?.cause?.message || fallbackMessage
  const normalizedMessage = String(rawMessage || '').trim()
  return normalizedMessage || fallbackMessage
}

const pickBrowserFile = ({ accept = '' } = {}) => {
  return new Promise(resolve => {
    if (typeof document === 'undefined') {
      resolve(null)
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'
    input.addEventListener(
      'change',
      () => {
        const file = input.files && input.files[0] ? input.files[0] : null
        input.remove()
        resolve(file)
      },
      {
        once: true
      }
    )
    document.body.appendChild(input)
    input.click()
  })
}

const downloadBrowserFile = ({ name, content }) => {
  if (typeof document === 'undefined') return
  const blob = new Blob([content], {
    type: 'application/json;charset=utf-8'
  })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = name
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}

const createBrowserTauriModules = () => {
  return {
    invoke: async (command, payload = {}) => {
      switch (command) {
        case 'take_pending_associated_files':
          return []
        case 'read_text_file': {
          const entry = getBrowserFileEntry(payload.path)
          if (!entry) {
            throw new Error('当前环境不支持读取未缓存的本地文件')
          }
          return entry.content
        }
        case 'write_text_file': {
          const path = payload.path
          const currentEntry = getBrowserFileEntry(path) || {
            name: getFileName(path),
            content: ''
          }
          const nextEntry = {
            ...currentEntry,
            content: String(payload.content || ''),
            pendingDownload: false
          }
          setBrowserFileEntry(path, nextEntry)
          if (currentEntry.pendingDownload) {
            downloadBrowserFile({
              name: currentEntry.name,
              content: nextEntry.content
            })
          }
          return null
        }
        case 'open_external_url': {
          if (typeof window !== 'undefined' && payload.url) {
            window.open(payload.url, '_blank', 'noopener,noreferrer')
          }
          return null
        }
        default:
          throw new Error(`当前环境不支持命令：${command}`)
      }
    },
    listen: async () => {
      return () => {}
    },
    open: async options => {
      if (options?.directory) {
        throw new Error('当前环境不支持选择文件夹')
      }
      const file = await pickBrowserFile({
        accept: '.smm,.json,application/json'
      })
      if (!file) return null
      const path = createBrowserFilePath(file.name)
      setBrowserFileEntry(path, {
        name: file.name,
        content: await readBrowserFileText(file),
        pendingDownload: false
      })
      return path
    },
    save: async options => {
      const name = getFileName(
        buildDesktopSaveDefaultPath({
          defaultPath: options?.defaultPath,
          suggestedName: options?.suggestedName
        })
      )
      const path = createBrowserFilePath(name)
      setBrowserFileEntry(path, {
        name,
        content: '',
        pendingDownload: true
      })
      return path
    }
  }
}

let tauriModulesPromise = null

const loadTauriModules = async () => {
  if (!tauriModulesPromise) {
    if (!isDesktopRuntime()) {
      tauriModulesPromise = Promise.resolve(createBrowserTauriModules())
      return tauriModulesPromise
    }
    tauriModulesPromise = Promise.all([
      import('@tauri-apps/api/core'),
      import('@tauri-apps/api/event'),
      import('@tauri-apps/plugin-dialog')
    ]).then(([core, event, dialog]) => {
      if (
        typeof core?.invoke !== 'function' ||
        typeof dialog?.open !== 'function' ||
        typeof dialog?.save !== 'function'
      ) {
        return createBrowserTauriModules()
      }
      return {
        invoke: core.invoke,
        listen: event.listen,
        open: dialog.open,
        save: dialog.save
      }
    })
  }
  return tauriModulesPromise
}

const invokeCommand = async (
  command,
  payload = {},
  fallbackMessage = '桌面命令执行失败'
) => {
  const { invoke } = await loadTauriModules()
  try {
    return await invoke(command, payload)
  } catch (error) {
    const normalizedMessage = normalizeInvokeErrorMessage(
      error,
      fallbackMessage
    )
    console.error(`invoke ${command} failed`, error)
    throw new Error(normalizedMessage, {
      cause: error
    })
  }
}

export const desktopPlatform = {
  async readBootstrapState() {
    return invokeCommand('read_bootstrap_state', {}, '读取应用状态失败')
  },

  async takePendingAssociatedFiles() {
    return invokeCommand(
      'take_pending_associated_files',
      {},
      '读取待打开文件失败'
    )
  },

  async readBootstrapMetaState() {
    return invokeCommand(
      'read_bootstrap_meta_state',
      {},
      '读取工作区状态失败'
    )
  },

  async readBootstrapDocumentState() {
    return invokeCommand(
      'read_bootstrap_document_state',
      {},
      '读取文档状态失败'
    )
  },

  async writeBootstrapState(state) {
    return invokeCommand('write_bootstrap_state', { state }, '写入应用状态失败')
  },

  async writeBootstrapMetaState(state) {
    return invokeCommand(
      'write_bootstrap_meta_state',
      { state },
      '写入工作区状态失败'
    )
  },

  async writeBootstrapDocumentState(state) {
    return invokeCommand(
      'write_bootstrap_document_state',
      { state },
      '写入文档状态失败'
    )
  },

  async openMindMapFile(options = {}) {
    const { open } = await loadTauriModules()
    const selectedPath = await open({
      multiple: false,
      directory: false,
      defaultPath: options.defaultPath || undefined,
      filters: [
        {
          name: 'Mind Map',
          extensions: ['smm', 'json']
        }
      ]
    })
    if (!selectedPath || Array.isArray(selectedPath)) {
      return null
    }
    const content = await invokeCommand(
      'read_text_file',
      {
        path: selectedPath
      },
      '读取思维导图文件失败'
    )
    return {
      mode: 'desktop',
      path: selectedPath,
      name: getFileName(selectedPath),
      content
    }
  },

  async saveMindMapFileAs({ suggestedName, content, defaultPath }) {
    const { save } = await loadTauriModules()
    const selectedPath = await save({
      defaultPath: buildDesktopSaveDefaultPath({
        defaultPath,
        suggestedName
      }),
      suggestedName: normalizeSaveName(suggestedName),
      filters: [
        {
          name: 'Mind Map',
          extensions: ['smm']
        }
      ]
    })
    if (!selectedPath) return null
    const normalizedSelectedPath = ensureSmmFilePath(selectedPath)
    await invokeCommand(
      'write_text_file',
      {
        path: normalizedSelectedPath,
        content
      },
      '保存思维导图文件失败'
    )
    return {
      mode: 'desktop',
      path: normalizedSelectedPath,
      name: getFileName(normalizedSelectedPath)
    }
  },

  async readMindMapFile(fileRef) {
    const content = await invokeCommand(
      'read_text_file',
      {
        path: fileRef.path
      },
      '读取思维导图文件失败'
    )
    return {
      ...fileRef,
      content
    }
  },

  async writeMindMapFile(fileRef, content) {
    await invokeCommand(
      'write_text_file',
      {
        path: fileRef.path,
        content
      },
      '写入思维导图文件失败'
    )
    return fileRef
  },

  async pickDirectory(options = {}) {
    const { open } = await loadTauriModules()
    const selectedPath = await open({
      multiple: false,
      directory: true,
      defaultPath: options.defaultPath || undefined
    })
    if (!selectedPath || Array.isArray(selectedPath)) {
      return null
    }
    return {
      mode: 'desktop',
      path: selectedPath,
      name: getFileName(selectedPath)
    }
  },

  async listDirectoryEntries(directoryRef) {
    return invokeCommand(
      'list_directory_entries',
      {
        path: directoryRef.path
      },
      '读取目录内容失败'
    )
  },

  async recordRecentFile(fileRef) {
    if (!fileRef || !fileRef.path) return
    return invokeCommand(
      'record_recent_file',
      {
        item: {
          path: fileRef.path,
          name: fileRef.name || getFileName(fileRef.path),
          updatedAt: Date.now()
        }
      },
      '记录最近文件失败'
    )
  },

  async openExternalUrl(url) {
    return invokeCommand(
      'open_external_url',
      {
        url
      },
      '打开外部链接失败'
    )
  },

  async startAiProxyRequest({ requestId, request }) {
    return invokeCommand(
      'start_ai_proxy_request',
      {
        requestId,
        request
      },
      '启动 AI 请求失败'
    )
  },

  async stopAiProxyRequest({ requestId }) {
    return invokeCommand(
      'stop_ai_proxy_request',
      {
        requestId
      },
      '停止 AI 请求失败'
    )
  },

  async listen(eventName, handler) {
    const { listen } = await loadTauriModules()
    return listen(eventName, handler)
  },

  async listenAssociatedFileOpen(handler) {
    return this.listen('desktop://open-associated-files', event => {
      handler(event?.payload || { paths: [] })
    })
  }
}
