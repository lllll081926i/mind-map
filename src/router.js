import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import(`./pages/Home/Index.vue`)
  },
  {
    path: '/edit',
    name: 'Edit',
    component: () => import(`./pages/Edit/Index.vue`)
  },
  {
    path: '/export',
    name: 'Export',
    component: () => import(`./pages/Export/Index.vue`)
  },
  {
    path: '/index',
    redirect: '/home'
  },
  {
    path: '/doc/zh',
    component: () => import(`./pages/Doc.vue`)
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
