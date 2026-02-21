import { defineStore } from 'pinia'
import { ref } from 'vue'

type Locale = 'zh-TW' | 'zh-CN' | 'en'

export const useLanguageStore = defineStore('language', () => {
    const currentLocale = ref<Locale>(
        (!import.meta.env.SSR
            ? (localStorage.getItem('locale') as Locale)
            : null) || 'zh-TW'
    )

    function setLocale(locale: Locale): void {
        currentLocale.value = locale
        if (!import.meta.env.SSR) {
            localStorage.setItem('locale', locale)
        }
    }

    return {
        currentLocale,
        setLocale
    }
})

