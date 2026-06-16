import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/home/HomePage.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/auth/LoginPage.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/auth/RegisterPage.vue') },
  { path: '/legacy-home', redirect: '/' },
  { path: '/coach', component: () => import('../views/AppLayout.vue'), meta: { requiresAuth: true }, children: [{ path: '', name: 'PolicyQuestCoach', component: () => import('../views/scoring/ScoringStudio.vue') }] },
  { path: '/papers', component: () => import('../views/AppLayout.vue'), meta: { requiresAuth: true }, children: [{ path: '', name: 'TruePaperLibrary', component: () => import('../views/practice/TruePaperLibrary.vue') }] },
  { path: '/practice/:paperId', name: 'RealPaperPractice', component: () => import('../views/practice/RealPaperPractice.vue'), meta: { requiresAuth: true } },
  { path: '/report', component: () => import('../views/AppLayout.vue'), meta: { requiresAuth: true }, children: [{ path: '', name: 'GrowthReport', component: () => import('../views/report/ReportPage.vue') }] },
  { path: '/profile', component: () => import('../views/AppLayout.vue'), meta: { requiresAuth: true }, children: [{ path: '', name: 'Profile', component: () => import('../views/auth/ProfilePage.vue') }] },
  { path: '/wrongbook', component: () => import('../views/AppLayout.vue'), meta: { requiresAuth: true }, children: [{ path: '', name: 'WrongBook', component: () => import('../views/wrongbook/WrongBook.vue') }] },
  { path: '/articles', component: () => import('../views/AppLayout.vue'), meta: { requiresAuth: true }, children: [{ path: '', name: 'Articles', component: () => import('../views/articles/ArticlesPage.vue') }] },
  { path: '/scoring', redirect: '/coach' },
  { path: '/app/profile', redirect: '/profile' },
  { path: '/app/report', redirect: '/report' },
  { path: '/app/practice', redirect: '/papers' },
  { path: '/app/wrongbook', redirect: '/wrongbook' },
  { path: '/app/articles', redirect: '/articles' },
  { path: '/app/:pathMatch(.*)*', redirect: '/coach' },
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
  const previewBypass = import.meta.env.DEV && to.query.preview === '1'
  if (to.meta.requiresAuth && !token && !previewBypass) return next({ path: '/login', query: { redirect: to.fullPath } })
  if (token && (to.path === '/login' || to.path === '/register')) return next('/coach')
  if (to.meta.requiresAdmin && !previewBypass && (!user || !['admin', 'super_admin'].includes(user.role))) return next('/coach')
  next()
})

export default router
