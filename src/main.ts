import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueKonva from 'vue-konva'
import './index.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(VueKonva)
app.mount('#app')
