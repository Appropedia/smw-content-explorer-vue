import '@/assets/css/main.css'

import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import { createPinia }  from 'pinia'
import { PiniaColada } from '@pinia/colada'
import ui from '@nuxt/ui/vue-plugin'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(pinia)
app.use(PiniaColada, {
  queryOptions: {
    staleTime: 1 * 60 * 1000,   //Persist data for 1 minute by default
  },
})
app.use(ui)

app.mount('#app')
