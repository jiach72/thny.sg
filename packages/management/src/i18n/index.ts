import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import en from './en'

/**
 * 自动检测用户语言偏好
 * 优先级：localStorage > 浏览器语言 > 默认简体中文
 */
function detectLocale(): 'zh-CN' | 'en' {
  const saved = localStorage.getItem('locale') as 'zh-CN' | 'en' | null
  if (saved && ['zh-CN', 'en'].includes(saved)) return saved

  const browserLang = navigator.language || ''
  if (browserLang.startsWith('en')) return 'en'
  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    en,
  },
})

export default i18n
