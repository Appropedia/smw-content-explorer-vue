import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: {},
    },
    {
      path: '/fablabs-sdg',
      name: 'Fablabs by Sustainable Development Goals',
      component: () => import('../views/fablabs-sdg.vue'),
    },
    {
      path: '/tissues-explorer',
      name: 'Tissues Explorer',
      component: () => import('../views/tissues-explorer.vue'),
    },
  ],
})

export default router
