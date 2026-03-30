import { createI18n } from 'vue-i18n'
import messages from './lang'

const i18n = createI18n({
  legacy: true,
  messages,
  locale: 'zh',
  fallbackLocale: 'zh'
})

export default i18n
