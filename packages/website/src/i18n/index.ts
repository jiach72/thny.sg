import { createI18n } from 'vue-i18n'
import zhTW from './zh-TW'
import zhCN from './zh-CN'
import en from './en'

const i18n = createI18n({
    legacy: false,
    locale: ((!import.meta.env.SSR ? localStorage.getItem('locale') : null) || 'zh-TW') as 'zh-TW' | 'zh-CN' | 'en',
    fallbackLocale: 'zh-TW',
    messages: {
        'zh-TW': zhTW,
        'zh-CN': zhCN,
        'en': en
    }
})

export default i18n
