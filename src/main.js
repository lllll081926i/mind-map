import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import '@/assets/icon-font/iconfont.css'
import i18n from './i18n'
import { Buffer } from 'buffer'
import { bootstrapPlatformState } from '@/platform'
import pinia from '@/stores'
// import VConsole from 'vconsole'
// const vConsole = new VConsole()

Vue.config.productionTip = false
if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer
}
const bus = new Vue()
Vue.prototype.$bus = bus
Vue.use(ElementUI)

const initApp = () => {
  new Vue({
    render: h => h(App),
    router,
    store,
    pinia,
    i18n
  }).$mount('#app')
}

const bootstrapApp = async () => {
  await bootstrapPlatformState()
  // 是否处于接管应用模式
  if (window.takeOverApp) {
    window.initApp = initApp
    window.$bus = bus
  } else {
    initApp()
  }
}

bootstrapApp()
