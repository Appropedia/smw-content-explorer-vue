import { h } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: { render: () => h('div', 'Select an exploration topic') },
    },
    {
      path: '/fab-labs-sdg',
      name: 'Fab Labs by Sustainable Development Goals',
      component: () => import('@/views/fab-labs-sdg.vue'),
    },
    {
      path: '/tissues-explorer',
      name: 'Tissues Explorer',
      component: () => import('@/views/tissues-explorer.vue'),
    },
  ],
})

export default router
