import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'

// 获取本地存储的语言设置，如果没有则使用浏览器默认，再降级到中文
const savedLanguage = localStorage.getItem('thny_portal_lang')
const browserLanguage = navigator.language.split('-')[0] // 'en', 'zh', etc.
const defaultLanguage = savedLanguage || (['zh', 'en'].includes(browserLanguage) ? browserLanguage : 'zh')

const i18n = createI18n({
    legacy: false, // 必须设置 false 才能使用 Composition API
    locale: defaultLanguage,
    fallbackLocale: 'en',
    messages: {
        zh,
        en
    }
})

export default i18n
