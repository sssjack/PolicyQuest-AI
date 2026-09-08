<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../store/user'
import SvgIcon from '../../components/SvgIcon.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const navGroups = [
  {
    label: '经营与用户',
    items: [
      { path: '/admin/dashboard', label: '经营概览', icon: 'dashboard' },
      { path: '/admin/users', label: '用户与权益', icon: 'users' },
      { path: '/admin/practice-records', label: '用户做题记录', icon: 'practice' },
      { path: '/admin/feedback', label: '反馈与建议', icon: 'user' },
      { path: '/admin/operations', label: '运营与留存', icon: 'chart' },
    ],
  },
  {
    label: '内容与模型',
    items: [
      { path: '/admin/papers', label: '真题与材料', icon: 'article' },
      { path: '/admin/ai-cost', label: 'AI 任务与成本', icon: 'robot' },
      { path: '/admin/ai-requests', label: 'AI 请求日志', icon: 'report' },
      { path: '/admin/quality', label: '批改质检', icon: 'report' },
      { path: '/admin/announcements', label: '公告管理', icon: 'hot' },
    ],
  },
  {
    label: '财务与治理',
    items: [
      { path: '/admin/packages', label: '套餐管理', icon: 'star', deferred: true },
      { path: '/admin/orders', label: '订单与支付', icon: 'timer', deferred: true },
      { path: '/admin/ledger', label: '积分账本', icon: 'wrong' },
      { path: '/admin/security', label: '权限与审计', icon: 'admin' },
    ],
  },
]

const currentLabel = computed(() => {
  for (const group of navGroups) {
    const item = group.items.find(entry => route.path === entry.path || route.path.startsWith(`${entry.path}/`))
    if (item) return item.label
  }
  return '管理后台'
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function logout() {
  userStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <router-link to="/" class="sidebar-logo">
          <div class="logo-icon">PQ</div>
          <div>
            <div class="logo-title">PolicyQuest</div>
            <div class="logo-subtitle">Operations Console</div>
          </div>
        </router-link>
      </div>

      <nav class="sidebar-nav">
        <div v-for="group in navGroups" :key="group.label" class="nav-group">
          <div class="nav-group-label">{{ group.label }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path), deferred: item.deferred }"
          >
            <span class="nav-icon"><SvgIcon :name="item.icon" :size="16" /></span>
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="item.deferred" class="nav-badge">2.0</span>
          </router-link>
        </div>
        <div class="nav-divider"></div>
        <router-link to="/" class="nav-item">
          <span class="nav-icon"><SvgIcon name="home" :size="16" /></span>
          <span class="nav-label">返回用户端</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="operator-card">
          <div class="operator-avatar">{{ (userStore.user?.nickname || userStore.user?.username || '管').slice(0, 1) }}</div>
          <div class="operator-info">
            <strong>{{ userStore.user?.nickname || userStore.user?.username || '管理员' }}</strong>
            <span>{{ userStore.user?.role === 'super_admin' ? '超级管理员' : '运营管理员' }}</span>
          </div>
        </div>
        <button class="logout-btn" @click="logout">
          <SvgIcon name="logout" :size="15" />退出登录
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-topbar">
        <div>
          <div class="topbar-kicker">POLICYQUEST / ADMIN</div>
          <div class="topbar-title">{{ currentLabel }}</div>
        </div>
        <div class="topbar-status"><span class="status-dot"></span>系统运行正常</div>
      </header>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background: var(--bg); }
.admin-sidebar { width: 252px; background: #10233f; display: flex; flex-direction: column; position: fixed; inset: 0 auto 0 0; z-index: 50; color: #dbe7fb; }
.sidebar-header { padding: 24px 20px 22px; border-bottom: 1px solid rgba(219,231,251,0.12); }
.sidebar-logo { display: flex; align-items: center; gap: 11px; color: #fff; text-decoration: none; }
.logo-icon { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; background: var(--gradient-1); color: #fff; font-size: 15px; font-weight: 900; box-shadow: 0 8px 18px rgba(0, 102, 255, 0.3); }
.logo-title { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; }
.logo-subtitle { margin-top: 2px; color: #91a7ca; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
.sidebar-nav { flex: 1; padding: 18px 12px; overflow: auto; }
.nav-group { margin-bottom: 18px; }
.nav-group-label { padding: 0 12px 7px; color: #7187aa; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
.nav-item { display: flex; align-items: center; gap: 10px; min-height: 40px; margin: 2px 0; padding: 0 12px; border-radius: 9px; color: #aebed8; font-size: 13px; text-decoration: none; transition: all 0.18s ease; }
.nav-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
.nav-item.active { background: linear-gradient(90deg, rgba(0,102,255,0.48), rgba(0,184,217,0.18)); color: #fff; box-shadow: inset 3px 0 0 #47b5ff; }
.nav-item.deferred { color: #8296b6; }
.nav-icon { width: 18px; display: inline-flex; justify-content: center; color: currentColor; }
.nav-label { flex: 1; }
.nav-badge { padding: 2px 5px; border: 1px solid rgba(145,167,202,0.35); border-radius: 4px; color: #91a7ca; font-size: 9px; line-height: 1; }
.nav-divider { height: 1px; margin: 6px 8px 12px; background: rgba(219,231,251,0.12); }
.sidebar-footer { padding: 14px; border-top: 1px solid rgba(219,231,251,0.12); }
.operator-card { display: flex; align-items: center; gap: 9px; padding: 9px; border-radius: 10px; background: rgba(255,255,255,0.06); }
.operator-avatar { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #dbe7fb; color: #10233f; font-size: 13px; font-weight: 800; }
.operator-info { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.operator-info strong { overflow: hidden; color: #fff; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.operator-info span { color: #91a7ca; font-size: 10px; }
.logout-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px; margin-top: 10px; padding: 8px; border: 0; border-radius: 8px; background: transparent; color: #9eb0cc; font-size: 12px; }
.logout-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
.admin-main { flex: 1; min-width: 0; margin-left: 252px; }
.admin-topbar { height: 74px; display: flex; align-items: center; justify-content: space-between; padding: 0 34px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.82); backdrop-filter: blur(14px); }
.topbar-kicker { color: var(--primary); font-size: 9px; font-weight: 900; letter-spacing: 0.14em; }
.topbar-title { margin-top: 4px; color: var(--text-primary); font-size: 17px; font-weight: 800; }
.topbar-status { display: flex; align-items: center; gap: 7px; color: var(--text-muted); font-size: 12px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #16a085; box-shadow: 0 0 0 4px rgba(22,160,133,0.12); }
@media (max-width: 900px) {
  .admin-sidebar { width: 70px; }
  .sidebar-header { padding: 16px 12px; }
  .sidebar-logo > div:not(.logo-icon), .nav-group-label, .nav-label, .nav-badge, .operator-info, .logout-btn { display: none; }
  .sidebar-nav { padding: 14px 9px; }
  .nav-item { justify-content: center; padding: 0; }
  .nav-icon { width: auto; }
  .operator-card { justify-content: center; padding: 7px; }
  .admin-main { margin-left: 70px; }
  .admin-topbar { padding: 0 20px; }
}
</style>
