import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './styles/global.css'

// The production site uses hash routing. Preserve the public homepage at
// /PolicyQuest/#/ while making the clean /PolicyQuest/admin entry open the
// admin route instead of falling back to the homepage hash.
const cleanPath = window.location.pathname.replace(/\/+$/, '')
const isAdminEntry = cleanPath === '/PolicyQuest/admin'
const hash = window.location.hash
if (isAdminEntry && (!hash || hash === '#' || hash === '#/')) {
  window.location.hash = '#/admin'
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
