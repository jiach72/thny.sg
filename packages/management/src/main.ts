import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router'
import { setupPermissionDirective } from './directives/permission'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 注册全局自定义指令
setupPermissionDirective(app)

import VCalendar from 'v-calendar';
import 'v-calendar/style.css';
app.use(VCalendar, {})

app.mount('#app')
