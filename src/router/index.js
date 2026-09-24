import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: {},
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
