import { isDesktopRuntime } from '../runtime.mjs'

const getFileName = filePath => {
  return String(filePath || '')
    .split(/[\\/]/)
    .pop()
}

const browserFileStore = new Map()
const MAX_BROWSER_FILE_STORE_SIZE = 12
const browserRecoveryDraftStore = new Map()

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

const normalizeBrowserRecoveryDraft = draft => {
  if (!draft || !draft.sourcePath) return null
  const documentMode =
    String(draft.documentMode || '').trim() === 'flowchart' ||
    (draft.flowchartData && typeof draft.flowchartData === 'object')
      ? 'flowchart'
      : 'mindmap'
  return {
    documentId: String(draft.documentId || '').trim(),
    title: String(draft.title || '').trim(),
    sourcePath: String(draft.sourcePath || '').trim(),
    updatedAt: Number(draft.updatedAt || Date.now()),
    dirty: !!draft.dirty,
    documentMode,
    draftFile:
      String(draft.draftFile || '').trim() ||
      `${String(draft.documentId || '').trim() || 'draft'}.json`,
    origin: String(draft.origin || 'memory').trim() || 'memory',
    isFullDataFile: !!draft.isFullDataFile,
    mindMapData:
      draft.mindMapData && typeof draft.mindMapData === 'object'
        ? draft.mindMapData
        : null,
    mindMapConfig:
      draft.mindMapConfig && typeof draft.mindMapConfig === 'object'
        ? draft.mindMapConfig
        : null,
    flowchartData:
      draft.flowchartData && typeof draft.flowchartData === 'object'
        ? draft.flowchartData
        : null,
    flowchartConfig:
      draft.flowchartConfig && typeof draft.flowchartConfig === 'object'
        ? draft.flowchartConfig
        : null,
    fileRef:
      draft.fileRef && typeof draft.fileRef === 'object' ? draft.fileRef : null
  }
}

const getBrowserRecoveryEntries = () => {
  return Array.from(browserRecoveryDraftStore.values())
    .filter(Boolean)
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .map(item => ({
      documentId: item.documentId,
      title: item.title,
      sourcePath: item.sourcePath,
      updatedAt: item.updatedAt,
      dirty: item.dirty,
      draftFile: item.draftFile,
      origin: item.origin
    }))
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

const normalizeFileExtension = extension => {
  const normalized = String(extension || '')
    .trim()
    .replace(/^\.+/, '')
    .toLowerCase()
  return normalized || 'txt'
}

const normalizeBinaryContent = content => {
  if (content instanceof Uint8Array) {
    return content
  }
  if (content instanceof ArrayBuffer) {
    return new Uint8Array(content)
  }
  if (ArrayBuffer.isView(content)) {
    return new Uint8Array(
      content.buffer,
      content.byteOffset,
      content.byteLength
    )
  }
  if (Array.isArray(content)) {
    return Uint8Array.from(content)
  }
  return Uint8Array.from([])
}

export const normalizeSaveName = suggestedName => {
  const baseName = String(suggestedName || '思维导图').trim() || '思维导图'
  return /\.smm$/i.test(baseName) ? baseName : `${baseName}.smm`
}

export const saveTextFileName = (suggestedName, extension = 'txt') => {
  const normalizedExtension = normalizeFileExtension(extension)
  const baseName = String(suggestedName || '思维导图').trim() || '思维导图'
  return new RegExp(`\\.${normalizedExtension}$`, 'i').test(baseName)
    ? baseName
    : `${baseName}.${normalizedExtension}`
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

export const buildGenericSaveDefaultPath = ({
  defaultPath,
  suggestedName,
  extension = 'txt'
} = {}) => {
  const normalizedName = saveTextFileName(suggestedName, extension)
  const normalizedDefaultPath = String(defaultPath || '').trim()
  if (!normalizedDefaultPath) {
    return normalizedName
  }
  const sanitizedBasePath = normalizedDefaultPath.replace(/[\\/]+$/, '')
  if (!sanitizedBasePath) {
    return normalizedName
  }
  const lastBackwardSlashIndex = sanitizedBasePath.lastIndexOf('\\')
  const lastForwardSlashIndex = sanitizedBasePath.lastIndexOf('/')
  const lastSeparatorIndex = Math.max(
    lastBackwardSlashIndex,
    lastForwardSlashIndex
  )
  const trailingSegment =
    lastSeparatorIndex >= 0
      ? sanitizedBasePath.slice(lastSeparatorIndex + 1)
      : sanitizedBasePath
  const hasFileExtension = /\.[^./\\]+$/.test(trailingSegment)
  if (hasFileExtension) {
    if (lastSeparatorIndex < 0) {
      return normalizedName
    }
    const parentPath = sanitizedBasePath.slice(0, lastSeparatorIndex)
    if (!parentPath) {
      return normalizedName
    }
    const separator =
      lastBackwardSlashIndex > lastForwardSlashIndex ? '\\' : '/'
    return `${parentPath}${separator}${normalizedName}`
  }
  const separator =
    lastBackwardSlashIndex > lastForwardSlashIndex ? '\\' : '/'
  return `${sanitizedBasePath}${separator}${normalizedName}`
}

export const buildDesktopSaveDefaultPath = ({
  defaultPath,
  suggestedName
} = {}) => {
  return buildGenericSaveDefaultPath({
    defaultPath,
    suggestedName: normalizeSaveName(suggestedName),
    extension: 'smm'
  })
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

const downloadBrowserFile = ({ name, content, mimeType }) => {
  if (typeof document === 'undefined') return
  const normalizedContent =
    typeof content === 'string' ? content : normalizeBinaryContent(content)
  const blob = new Blob([normalizedContent], {
    type: mimeType || 'text/plain;charset=utf-8'
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
        case 'remember_user_selected_path':
          return null
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
            content: '',
            mimeType: 'text/plain;charset=utf-8'
          }
          const nextEntry = {
            ...currentEntry,
            content: String(payload.content || ''),
            pendingDownload: !!currentEntry.pendingDownload,
            mimeType:
              String(payload.mimeType || currentEntry.mimeType || '').trim() ||
              'text/plain;charset=utf-8'
          }
          const shouldDownload =
            currentEntry.pendingDownload || nextEntry.pendingDownload
          setBrowserFileEntry(path, nextEntry)
          if (shouldDownload) {
            downloadBrowserFile({
              name: nextEntry.name,
              content: nextEntry.content,
              mimeType: nextEntry.mimeType
            })
          }
          return null
        }
        case 'write_binary_file': {
          const path = payload.path
          const currentEntry = getBrowserFileEntry(path) || {
            name: getFileName(path),
            content: Uint8Array.from([]),
            mimeType: 'application/octet-stream'
          }
          const nextEntry = {
            ...currentEntry,
            content: normalizeBinaryContent(payload.content),
            pendingDownload: !!currentEntry.pendingDownload,
            mimeType:
              String(payload.mimeType || currentEntry.mimeType || '').trim() ||
              'application/octet-stream'
          }
          const shouldDownload =
            currentEntry.pendingDownload || nextEntry.pendingDownload
          setBrowserFileEntry(path, nextEntry)
          if (shouldDownload) {
            downloadBrowserFile({
              name: nextEntry.name,
              content: nextEntry.content,
              mimeType: nextEntry.mimeType
            })
          }
          return null
        }
        case 'read_recovery_state': {
          return {
            rootPath: 'memory://recovery',
            origin: 'memory',
            entries: getBrowserRecoveryEntries()
          }
        }
        case 'read_recovery_draft': {
          const sourcePath = String(payload.sourcePath || '').trim()
          return normalizeBrowserRecoveryDraft(
            browserRecoveryDraftStore.get(sourcePath) || null
          )
        }
        case 'write_recovery_draft': {
          const draft = normalizeBrowserRecoveryDraft({
            ...(payload.draft || {}),
            origin: 'memory'
          })
          if (!draft || !draft.sourcePath) {
            throw new Error('恢复草稿缺少来源路径')
          }
          browserRecoveryDraftStore.set(draft.sourcePath, draft)
          return draft
        }
        case 'clear_recovery_draft': {
          const sourcePath = String(payload.sourcePath || '').trim()
          const deletedCount = browserRecoveryDraftStore.delete(sourcePath)
            ? 1
            : 0
          return {
            rootPath: 'memory://recovery',
            origin: 'memory',
            deletedCount,
            failedCount: 0
          }
        }
        case 'clear_all_recovery_drafts': {
          const deletedCount = browserRecoveryDraftStore.size
          browserRecoveryDraftStore.clear()
          return {
            rootPath: 'memory://recovery',
            origin: 'memory',
            deletedCount,
            failedCount: 0
          }
        }
        case 'open_external_url': {
          if (typeof window !== 'undefined' && payload.url) {
            try {
              const parsed = new URL(payload.url, window.location.href)
              if (['http:', 'https:'].includes(parsed.protocol)) {
                window.open(parsed.toString(), '_blank', 'noopener,noreferrer')
              }
            } catch (_error) {
              return null
            }
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
      const extension =
        options?.filters && Array.isArray(options.filters)
          ? options.filters[0]?.extensions?.[0]
          : ''
      const fallbackName = saveTextFileName(
        options?.suggestedName || 'mind-map',
        extension || 'txt'
      )
      const targetPath = String(options?.defaultPath || '').trim() || fallbackName
      const name = getFileName(targetPath) || fallbackName
      const path = createBrowserFilePath(name)
      setBrowserFileEntry(path, {
        name,
        content: '',
        pendingDownload: true,
        mimeType: 'text/plain;charset=utf-8'
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

const rememberPickedPath = async selectedPath => {
  const normalizedPath = String(selectedPath || '').trim()
  if (!normalizedPath) return
  await invokeCommand(
    'remember_user_selected_path',
    {
      path: normalizedPath
    },
    '登记用户选择路径失败'
  )
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

  async readRecoveryState() {
    return invokeCommand('read_recovery_state', {}, '读取恢复文件状态失败')
  },

  async readRecoveryDraft({ sourcePath } = {}) {
    return invokeCommand(
      'read_recovery_draft',
      {
        sourcePath
      },
      '读取恢复文件失败'
    )
  },

  async writeRecoveryDraft(draft) {
    return invokeCommand(
      'write_recovery_draft',
      {
        draft
      },
      '写入恢复文件失败'
    )
  },

  async clearRecoveryDraft({ sourcePath } = {}) {
    return invokeCommand(
      'clear_recovery_draft',
      {
        sourcePath
      },
      '清理恢复文件失败'
    )
  },

  async clearAllRecoveryDrafts() {
    return invokeCommand(
      'clear_all_recovery_drafts',
      {},
      '清理恢复文件失败'
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
    await rememberPickedPath(selectedPath)
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
    await rememberPickedPath(normalizedSelectedPath)
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

  async saveTextFileAs({
    suggestedName,
    content,
    defaultPath,
    extension = 'txt',
    name = '文本文件',
    mimeType = 'text/plain;charset=utf-8'
  }) {
    const normalizedExtension = normalizeFileExtension(extension)
    const normalizedName = saveTextFileName(suggestedName, normalizedExtension)
    const { save } = await loadTauriModules()
    const selectedPath = await save({
      defaultPath: buildGenericSaveDefaultPath({
        defaultPath,
        suggestedName: normalizedName,
        extension: normalizedExtension
      }),
      suggestedName: normalizedName,
      filters: [
        {
          name,
          extensions: [normalizedExtension]
        }
      ]
    })
    if (!selectedPath) return null
    const normalizedSelectedPath = saveTextFileName(
      selectedPath,
      normalizedExtension
    )
    await rememberPickedPath(normalizedSelectedPath)
    await invokeCommand(
      'write_text_file',
      {
        path: normalizedSelectedPath,
        content,
        mimeType
      },
      '保存文本文件失败'
    )
    return {
      mode: 'desktop',
      path: normalizedSelectedPath,
      name: getFileName(normalizedSelectedPath)
    }
  },

  async saveBinaryFileAs({
    suggestedName,
    content,
    defaultPath,
    extension = 'bin',
    name = '二进制文件',
    mimeType = 'application/octet-stream'
  }) {
    const normalizedExtension = normalizeFileExtension(extension)
    const normalizedName = saveTextFileName(suggestedName, normalizedExtension)
    const { save } = await loadTauriModules()
    const selectedPath = await save({
      defaultPath: buildGenericSaveDefaultPath({
        defaultPath,
        suggestedName: normalizedName,
        extension: normalizedExtension
      }),
      suggestedName: normalizedName,
      filters: [
        {
          name,
          extensions: [normalizedExtension]
        }
      ]
    })
    if (!selectedPath) return null
    const normalizedSelectedPath = saveTextFileName(
      selectedPath,
      normalizedExtension
    )
    await rememberPickedPath(normalizedSelectedPath)
    await invokeCommand(
      'write_binary_file',
      {
        path: normalizedSelectedPath,
        content: Array.from(normalizeBinaryContent(content)),
        mimeType
      },
      '保存二进制文件失败'
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
    await rememberPickedPath(selectedPath)
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
          updatedAt: Date.now(),
          documentMode:
            String(fileRef.documentMode || '').trim() === 'flowchart'
              ? 'flowchart'
              : 'mindmap'
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
