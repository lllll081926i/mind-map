import { configureCompat, createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import {
  ElButton,
  ElCheckbox,
  ElColorPicker,
  ElDialog,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElLoadingDirective,
  ElLoadingService,
  ElMessage,
  ElMessageBox,
  ElNotification,
  ElOption,
  ElPopover,
  ElRadio,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElSlider,
  ElSwitch,
  ElTabPane,
  ElTabs,
  ElTooltip,
  ElTree,
  ElUpload
} from 'element-plus'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-button.css'
import 'element-plus/theme-chalk/el-checkbox.css'
import 'element-plus/theme-chalk/el-color-picker.css'
import 'element-plus/theme-chalk/el-dialog.css'
import 'element-plus/theme-chalk/el-dropdown.css'
import 'element-plus/theme-chalk/el-dropdown-item.css'
import 'element-plus/theme-chalk/el-dropdown-menu.css'
import 'element-plus/theme-chalk/el-form.css'
import 'element-plus/theme-chalk/el-form-item.css'
import 'element-plus/theme-chalk/el-input.css'
import 'element-plus/theme-chalk/el-input-number.css'
import 'element-plus/theme-chalk/el-loading.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-notification.css'
import 'element-plus/theme-chalk/el-option.css'
import 'element-plus/theme-chalk/el-popover.css'
import 'element-plus/theme-chalk/el-radio.css'
import 'element-plus/theme-chalk/el-radio-button.css'
import 'element-plus/theme-chalk/el-radio-group.css'
import 'element-plus/theme-chalk/el-select.css'
import 'element-plus/theme-chalk/el-slider.css'
import 'element-plus/theme-chalk/el-switch.css'
import 'element-plus/theme-chalk/el-tab-pane.css'
import 'element-plus/theme-chalk/el-tabs.css'
import 'element-plus/theme-chalk/el-tooltip.css'
import 'element-plus/theme-chalk/el-tree.css'
import 'element-plus/theme-chalk/el-upload.css'
import '@/assets/icon-font/iconfont.css'
import i18n from './i18n'
import { Buffer } from 'buffer'
import { bootstrapPlatformState } from '@/platform'
import pinia from '@/stores'
import appEvents from '@/services/appEvents'
import legacyBus from '@/services/legacyBus'
// import VConsole from 'vconsole'
// const vConsole = new VConsole()

configureCompat({
  MODE: 2
})

if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer
}

const elementComponents = [
  ElButton,
  ElCheckbox,
  ElColorPicker,
  ElDialog,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElPopover,
  ElRadio,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElSlider,
  ElSwitch,
  ElTabPane,
  ElTabs,
  ElTooltip,
  ElTree,
  ElUpload
]

const initApp = () => {
  const app = createApp(App)
  app.config.globalProperties.$bus = legacyBus
  app.config.globalProperties.$appEvents = appEvents
  app.config.globalProperties.$message = ElMessage
  app.config.globalProperties.$notify = ElNotification
  app.config.globalProperties.$loading = ElLoadingService
  app.config.globalProperties.$confirm = ElMessageBox.confirm
  app.config.globalProperties.$alert = ElMessageBox.alert
  elementComponents.forEach(component => {
    app.component(component.name, component)
  })
  app.directive('loading', ElLoadingDirective)
  app.use(router)
  app.use(store)
  app.use(pinia)
  app.use(i18n)
  app.mount('#app')
}

const bootstrapApp = async () => {
  await bootstrapPlatformState()
  // 是否处于接管应用模式
  if (window.takeOverApp) {
    window.initApp = initApp
    window.$bus = legacyBus
    window.$appEvents = appEvents
  } else {
    initApp()
  }
}

bootstrapApp()
