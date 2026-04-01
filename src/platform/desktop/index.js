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

const normalizeSaveName = suggestedName => {
  const baseName = String(suggestedName || '思维导图').trim() || '思维导图'
  return /\.smm$/i.test(baseName) ? baseName : `${baseName}.smm`
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
      const name = normalizeSaveName(options?.defaultPath)
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

export const desktopPlatform = {
  async readBootstrapState() {
    const { invoke } = await loadTauriModules()
    return invoke('read_bootstrap_state')
  },

  async readBootstrapMetaState() {
    const { invoke } = await loadTauriModules()
    return invoke('read_bootstrap_meta_state')
  },

  async readBootstrapDocumentState() {
    const { invoke } = await loadTauriModules()
    return invoke('read_bootstrap_document_state')
  },

  async writeBootstrapState(state) {
    const { invoke } = await loadTauriModules()
    return invoke('write_bootstrap_state', { state })
  },

  async writeBootstrapMetaState(state) {
    const { invoke } = await loadTauriModules()
    return invoke('write_bootstrap_meta_state', { state })
  },

  async writeBootstrapDocumentState(state) {
    const { invoke } = await loadTauriModules()
    return invoke('write_bootstrap_document_state', { state })
  },

  async openMindMapFile(options = {}) {
    const { open, invoke } = await loadTauriModules()
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
    const content = await invoke('read_text_file', {
      path: selectedPath
    })
    return {
      mode: 'desktop',
      path: selectedPath,
      name: getFileName(selectedPath),
      content
    }
  },

  async saveMindMapFileAs({ suggestedName, content, defaultPath }) {
    const { save, invoke } = await loadTauriModules()
    const selectedPath = await save({
      defaultPath: defaultPath || suggestedName,
      filters: [
        {
          name: 'Mind Map',
          extensions: ['smm']
        }
      ]
    })
    if (!selectedPath) return null
    await invoke('write_text_file', {
      path: selectedPath,
      content
    })
    return {
      mode: 'desktop',
      path: selectedPath,
      name: getFileName(selectedPath)
    }
  },

  async readMindMapFile(fileRef) {
    const { invoke } = await loadTauriModules()
    const content = await invoke('read_text_file', {
      path: fileRef.path
    })
    return {
      ...fileRef,
      content
    }
  },

  async writeMindMapFile(fileRef, content) {
    const { invoke } = await loadTauriModules()
    await invoke('write_text_file', {
      path: fileRef.path,
      content
    })
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
    const { invoke } = await loadTauriModules()
    return invoke('list_directory_entries', {
      path: directoryRef.path
    })
  },

  async recordRecentFile(fileRef) {
    if (!fileRef || !fileRef.path) return
    const { invoke } = await loadTauriModules()
    return invoke('record_recent_file', {
      item: {
        path: fileRef.path,
        name: fileRef.name || getFileName(fileRef.path),
        updatedAt: Date.now()
      }
    })
  },

  async openExternalUrl(url) {
    const { invoke } = await loadTauriModules()
    return invoke('open_external_url', {
      url
    })
  },

  async startAiProxyRequest({ requestId, request }) {
    const { invoke } = await loadTauriModules()
    return invoke('start_ai_proxy_request', {
      requestId,
      request
    })
  },

  async stopAiProxyRequest({ requestId }) {
    const { invoke } = await loadTauriModules()
    return invoke('stop_ai_proxy_request', {
      requestId
    })
  },

  async listen(eventName, handler) {
    const { listen } = await loadTauriModules()
    return listen(eventName, handler)
  }
}
