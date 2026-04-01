const getFileName = filePath => {
  return String(filePath || '')
    .split(/[\\/]/)
    .pop()
}

let tauriModulesPromise = null

const loadTauriModules = async () => {
  if (!tauriModulesPromise) {
    tauriModulesPromise = Promise.all([
      import('@tauri-apps/api/core'),
      import('@tauri-apps/api/event'),
      import('@tauri-apps/plugin-dialog')
    ]).then(([core, event, dialog]) => {
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
