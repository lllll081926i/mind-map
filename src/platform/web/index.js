const readFileAsText = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => resolve(String(event.target.result || ''))
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export const webPlatform = {
  async readBootstrapState() {
    return null
  },

  async writeBootstrapState() {},

  async openMindMapFile() {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: '',
          accept: {
            'application/json': ['.smm']
          }
        }
      ],
      excludeAcceptAllOption: false,
      multiple: false
    })
    const file = await handle.getFile()
    return {
      mode: 'web',
      handle,
      name: file.name,
      path: '',
      content: await readFileAsText(file)
    }
  },

  async saveMindMapFileAs({ suggestedName, content }) {
    const handle = await window.showSaveFilePicker({
      types: [
        {
          description: '',
          accept: { 'application/json': ['.smm'] }
        }
      ],
      suggestedName
    })
    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
    return {
      mode: 'web',
      handle,
      name: suggestedName,
      path: ''
    }
  },

  async readMindMapFile(fileRef) {
    const file = await fileRef.handle.getFile()
    return {
      ...fileRef,
      name: file.name,
      content: await readFileAsText(file)
    }
  },

  async writeMindMapFile(fileRef, content) {
    const writable = await fileRef.handle.createWritable()
    await writable.write(content)
    await writable.close()
    return fileRef
  },

  async pickDirectory() {
    const handle = await window.showDirectoryPicker()
    return {
      mode: 'web',
      handle,
      path: '',
      name: handle.name
    }
  },

  async listDirectoryEntries(directoryRef) {
    const dirList = []
    const fileList = []
    for await (const [key, value] of directoryRef.handle.entries()) {
      const isFile = value.kind === 'file'
      if (isFile && !/\.(smm|xmind|md|json)$/.test(value.name)) {
        continue
      }
      const enableEdit = isFile && /\.smm$/.test(value.name)
      const data = {
        id: key,
        name: value.name,
        type: value.kind,
        mode: 'web',
        handle: value,
        path: '',
        leaf: isFile,
        enableEdit
      }
      if (isFile) {
        fileList.push(data)
      } else {
        dirList.push(data)
      }
    }
    return [...dirList, ...fileList]
  },

  async recordRecentFile() {},

  async startAiProxyRequest() {
    throw new Error('Web 平台不使用 Tauri AI 命令')
  },

  async stopAiProxyRequest() {},

  async listen() {
    return () => {}
  }
}
