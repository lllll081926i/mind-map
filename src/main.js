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
import { bootstrapPlatformState } from '@/platform'
import pinia from '@/stores'
import { syncRuntimeFromBootstrapState } from '@/stores/runtime'
import appEvents from '@/services/appEvents'
import { emitBootstrapStateReady } from '@/services/appEvents'
import legacyBus from '@/services/legacyBus'
// import VConsole from 'vconsole'
// const vConsole = new VConsole()

if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer
}

const ignoredVueWarnings = [
  'Runtime directive used on component with non-element root node.'
]

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
    app.config.globalProperties.$bus = legacyBus
    app.config.globalProperties.$appEvents = appEvents
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
      root.innerHTML = `
        <div style="padding:24px;font-size:14px;line-height:1.6;color:#c0392b;background:#fff4f2;">
          ${bootFailedMessage}
        </div>
      `
    }
  }
}

const bootstrapApp = () => {
  initApp()
  void bootstrapPlatformState()
    .then(state => {
      syncRuntimeFromBootstrapState(state)
      emitBootstrapStateReady(state)
      legacyBus.$emit('bootstrap_state_ready', state)
    })
    .catch(error => {
      console.error('bootstrapApp failed to restore platform state', error)
    })
}

bootstrapApp()
