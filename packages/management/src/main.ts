import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
// @ts-expect-error — element-plus en locale lacks type declarations
import en from 'element-plus/dist/locale/en.mjs'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { setupPermissionDirective } from './directives/permission'
import * as Sentry from '@sentry/vue'

const app = createApp(App)
const pinia = createPinia()

// Sentry 初始化 — 仅在生产环境且配置了 DSN 时启用
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        app,
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
            Sentry.browserTracingIntegration({ router }),
            Sentry.replayIntegration(),
        ],
        // 性能监控采样率
        tracesSampleRate: 0.1,
        // Session Replay 采样率
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        // 忽略本地开发错误
        environment: import.meta.env.MODE,
    })
}

app.use(pinia)
app.use(router)
app.use(i18n)

// Element Plus 语言跟随 i18n locale
const epLocale = i18n.global.locale.value === 'en' ? en : zhCn
app.use(ElementPlus, { locale: epLocale })

// 注册全局自定义指令
setupPermissionDirective(app)

import VCalendar from 'v-calendar';
import 'v-calendar/style.css';
app.use(VCalendar, {})

app.mount('#app')
