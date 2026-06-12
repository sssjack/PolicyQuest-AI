import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'ScoringStudio', component: () => import('../views/scoring/ScoringStudio.vue') },
  { path: '/legacy-home', name: 'Home', component: () => import('../views/home/HomePage.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/auth/LoginPage.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/auth/RegisterPage.vue') },
  {
    path: '/app', component: () => import('../views/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/app/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/practice/DashboardPage.vue') },
      { path: 'practice', name: 'PracticeConfig', component: () => import('../views/practice/PracticeConfig.vue') },
      { path: 'practice/:sessionId', name: 'PracticeSession', component: () => import('../views/practice/PracticeSession.vue') },
      { path: 'practice/:sessionId/result', name: 'PracticeResult', component: () => import('../views/practice/PracticeResult.vue') },
      { path: 'articles', name: 'Articles', component: () => import('../views/articles/ArticlesPage.vue') },
      { path: 'wrongbook', name: 'WrongBook', component: () => import('../views/wrongbook/WrongBook.vue') },
      { path: 'report', name: 'Report', component: () => import('../views/report/ReportPage.vue') },
      { path: 'profile', name: 'Profile', component: () => import('../views/auth/ProfilePage.vue') },
    ]
  },
  {
    path: '/admin', component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('../views/admin/AdminDashboard.vue') },
      { path: 'questions', name: 'AdminQuestions', component: () => import('../views/admin/AdminQuestions.vue') },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/AdminUsers.vue') },
      { path: 'ai-generate', name: 'AiGenerate', component: () => import('../views/admin/AiGenerate.vue') },
      { path: 'articles', name: 'AdminArticles', component: () => import('../views/admin/AdminArticles.vue') },
      { path: 'crawler', name: 'CrawlerPanel', component: () => import('../views/admin/CrawlerPanel.vue') },
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
  if (to.meta.requiresAdmin && (!user || !['admin', 'super_admin'].includes(user.role))) return next('/app/dashboard')
  next()
})

export default router
