import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'PolicyQuestCoach', component: () => import('../views/scoring/ScoringStudio.vue') },
  { path: '/scoring', redirect: '/' },
  { path: '/legacy-home', redirect: '/' },
  { path: '/login', name: 'Login', component: () => import('../views/auth/LoginPage.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/auth/RegisterPage.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/auth/ProfilePage.vue'), meta: { requiresAuth: true } },
  { path: '/app/profile', redirect: '/profile' },
  { path: '/app/:pathMatch(.*)*', redirect: '/' },
  {
    path: '/admin', component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('../views/admin/AdminDashboard.vue') },
      { path: 'questions', name: 'AdminQuestions', component: () => import('../views/admin/AdminQuestions.vue') },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/AdminUsers.vue') },
      { path: ':pathMatch(.*)*', redirect: '/admin/dashboard' },
    ]
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('pq_token')
  const user = JSON.parse(localStorage.getItem('pq_user') || 'null')
  if (to.meta.requiresAuth && !token) return next('/login')
  if (to.meta.requiresAdmin && (!user || !['admin', 'super_admin'].includes(user.role))) return next('/')
  next()
})

export default router
