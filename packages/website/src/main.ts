import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { routes } from './router'
import i18n from './i18n'
import './assets/styles/main.css'
import * as Sentry from '@sentry/vue'

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

        // MON-02: Sentry 初始化 — 仅在生产环境且配置了 DSN 时启用
        if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
            Sentry.init({
                app,
                dsn: import.meta.env.VITE_SENTRY_DSN,
                integrations: [
                    Sentry.browserTracingIntegration(),
                    Sentry.replayIntegration(),
                ],
                tracesSampleRate: 0.1,
                replaysSessionSampleRate: 0.1,
                replaysOnErrorSampleRate: 1.0,
                environment: import.meta.env.MODE,
            })
        }

        // Pinia 状态序列化/恢复（SSG 预渲染 → 客户端激活）
        if (import.meta.env.SSR) {
            initialState.pinia = pinia.state.value
        } else {
            pinia.state.value = initialState.pinia || {}
        }
    },
)
