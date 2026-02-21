import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { routes } from './router'
import i18n from './i18n'
import './assets/styles/main.css'

export const createApp = ViteSSG(
    App,
    {
        routes,
        scrollBehavior() {
            return { top: 0 }
        },
    },
    ({ app, initialState }) => {
        const pinia = createPinia()
        app.use(pinia)
        app.use(ElementPlus)
        app.use(i18n)

        // Pinia 状态序列化/恢复（SSG 预渲染 → 客户端激活）
        if (import.meta.env.SSR) {
            initialState.pinia = pinia.state.value
        } else {
            pinia.state.value = initialState.pinia || {}
        }
    },
)
