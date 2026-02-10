import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setLogoutHandler } from '@/api/axiosInstance'
import { APP_NAME } from '@/config/app'

document.title = APP_NAME

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Axios 401 handler calls this so auth store state is cleared on logout
import { useAuthStore } from '@/stores/auth'
setLogoutHandler(() => useAuthStore().logout())

app.mount('#app')
