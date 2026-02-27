import { createI18n } from 'vue-i18n'
import zhTW from './zh-TW'
import zhCN from './zh-CN'
import en from './en'

/**
 * 自动检测用户语言偏好
 * 优先级：localStorage > 浏览器语言 > 默认简体中文
 */
function detectLocale(): 'zh-TW' | 'zh-CN' | 'en' {
    if (import.meta.env.SSR) return 'zh-CN'

    const saved = localStorage.getItem('locale') as 'zh-TW' | 'zh-CN' | 'en' | null
    if (saved && ['zh-TW', 'zh-CN', 'en'].includes(saved)) return saved

    // 浏览器语言自动匹配
    const browserLang = navigator.language || ''
    if (browserLang.startsWith('en')) return 'en'
    if (browserLang === 'zh-TW' || browserLang === 'zh-HK') return 'zh-TW'
    return 'zh-CN' // 默认简体中文（主要客户群体为中国大陆）
}

const i18n = createI18n({
    legacy: false,
    locale: detectLocale(),
    fallbackLocale: 'zh-CN',
    messages: {
        'zh-TW': zhTW,
        'zh-CN': zhCN,
        'en': en
    }
})

export default i18n

