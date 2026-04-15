import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import {
  ElLoadingDirective,
  ElLoadingService,
  ElMessage,
  ElMessageBox,
  ElNotification
} from 'element-plus'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-loading.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-notification.css'
import '@/assets/icon-font/iconfont.css'
import i18n from './i18n'
import { Buffer } from 'buffer'
import platform, {
  bootstrapPlatformState,
  getBootstrapState,
  isDesktopApp
} from '@/platform'
import pinia from '@/stores'
import { syncRuntimeFromBootstrapState } from '@/stores/runtime'
import appEvents from '@/services/appEvents'
import { emitBootstrapStateReady } from '@/services/appEvents'
import { hydrateBootstrapStateFromRecovery } from '@/services/recoveryStorage'

let workspaceActionsPromise = null

const loadWorkspaceActions = async () => {
  if (!workspaceActionsPromise) {
    workspaceActionsPromise = import('@/services/workspaceActions')
      .catch(error => {
        workspaceActionsPromise = null
        throw error
      })
  }
  return workspaceActionsPromise
}

if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer
}

const ignoredVueWarnings = [
  'Runtime directive used on component with non-element root node.'
]

const getAssociatedFileName = filePath => {
  return String(filePath || '')
    .split(/[\\/]/)
    .pop()
}

const normalizeAssociatedFilePayload = payload => {
  if (Array.isArray(payload)) {
    return payload.filter(Boolean)
  }
  if (Array.isArray(payload?.paths)) {
    return payload.paths.filter(Boolean)
  }
  return []
}

const setupDesktopAssociatedFileHandling = () => {
  if (!isDesktopApp()) {
    return Promise.resolve(() => {})
  }

  let openQueue = Promise.resolve()

  const enqueueOpen = filePath => {
    if (!filePath) return openQueue
    openQueue = openQueue
      .then(async () => {
        await router.isReady()
        const { openWorkspaceFileRef } = await loadWorkspaceActions()
        await openWorkspaceFileRef(
          {
            mode: 'desktop',
            path: filePath,
            name: getAssociatedFileName(filePath)
          },
          router
        )
      })
      .catch(error => {
        console.error('open associated file failed', error)
      })
    return openQueue
  }

  const openPaths = async payload => {
    const paths = normalizeAssociatedFilePayload(payload)
    for (const filePath of paths) {
      await enqueueOpen(filePath)
    }
  }

  return platform
    .listenAssociatedFileOpen(payload => {
      void openPaths(payload)
    })
    .catch(error => {
      console.error('listenAssociatedFileOpen failed', error)
      return () => {}
    })
    .then(async unlisten => {
      try {
        const pendingPaths = await platform.takePendingAssociatedFiles()
        await openPaths(pendingPaths)
      } catch (error) {
        console.error('takePendingAssociatedFiles failed', error)
      }
      return unlisten
    })
}

const initApp = () => {
  try {
    const app = createApp(App)
    app.config.warnHandler = (msg, instance, trace) => {
      if (ignoredVueWarnings.some(item => msg.includes(item))) {
        return
      }
      console.warn(`[Vue warn]: ${msg}${trace || ''}`)
    }
    app.config.errorHandler = (error, instance, info) => {
      console.error('Vue runtime error', {
        error,
        info,
        component: instance?.type?.name || 'anonymous'
      })
    }
    app.config.globalProperties.$appEvents = appEvents
    app.config.globalProperties.$bus = appEvents
    app.config.globalProperties.$message = ElMessage
    app.config.globalProperties.$notify = ElNotification
    app.config.globalProperties.$loading = ElLoadingService
    app.config.globalProperties.$confirm = ElMessageBox.confirm
    app.config.globalProperties.$alert = ElMessageBox.alert
    app.directive('loading', ElLoadingDirective)
    app.use(router)
    app.use(pinia)
    app.use(i18n)
    app.mount('#app')
  } catch (error) {
    console.error('initApp failed', error)
    const root = document.querySelector('#app')
    if (root) {
      const bootFailedMessage = i18n.global.t('app.initFailed')
      const messageNode = document.createElement('div')
      messageNode.style.padding = '24px'
      messageNode.style.fontSize = '14px'
      messageNode.style.lineHeight = '1.6'
      messageNode.style.color = '#c0392b'
      messageNode.style.background = '#fff4f2'
      messageNode.textContent = bootFailedMessage
      root.replaceChildren(messageNode)
    }
  }
}

const bootstrapApp = async () => {
  let bootstrapState = null
  try {
    bootstrapState = await bootstrapPlatformState()
    await hydrateBootstrapStateFromRecovery(bootstrapState)
    bootstrapState = getBootstrapState()
    syncRuntimeFromBootstrapState(bootstrapState)
  } catch (error) {
    console.error('bootstrapApp failed to restore platform state', error)
  }

  initApp()

  if (bootstrapState) {
    emitBootstrapStateReady(bootstrapState)
  }

  void setupDesktopAssociatedFileHandling()
}

void bootstrapApp()
