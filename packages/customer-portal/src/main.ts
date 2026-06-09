import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/tailwind.css' // Tailwind must come after Element Plus
import i18n from './locales'
import App from './App.vue'
import router from './router'
import * as Sentry from '@sentry/vue'

const app = createApp(App)
const pinia = createPinia()

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        app,
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: 0.2,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: import.meta.env.MODE,
    })
}

app.use(pinia)
app.use(router)
app.use(i18n)
// ElementPlus 的 locale 配置后续将放置在 App.vue 根组件通过 ConfigProvider 动态提供
app.use(ElementPlus)

app.mount('#app')
