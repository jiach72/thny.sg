import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/tailwind.css' // Tailwind must come after Element Plus
import i18n from './locales'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
// ElementPlus 的 locale 配置后续将放置在 App.vue 根组件通过 ConfigProvider 动态提供
app.use(ElementPlus)

app.mount('#app')
