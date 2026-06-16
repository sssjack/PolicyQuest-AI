<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '../components/SvgIcon.vue'
import { useUserStore } from '../store/user'

type NavItem = {
  key: string
  to: string | { path: string; query?: Record<string, string> }
  label: string
  caption: string
  icon: string
  match: string[]
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userName = computed(() => userStore.user?.nickname || userStore.user?.username || '考生')
const userInitial = computed(() => userName.value.slice(0, 1).toUpperCase())

const navItems: NavItem[] = [
  { key: 'coach', to: '/coach', label: '学习中心', caption: '今日计划', icon: 'dashboard', match: ['/coach'] },
  { key: 'papers', to: '/papers', label: '真题库', caption: '筛选与练习', icon: 'practice', match: ['/papers', '/practice'] },
  { key: 'report', to: '/report', label: '我的报告', caption: '能力复盘', icon: 'report', match: ['/report'] },
]

const utilityItems: NavItem[] = [
  { key: 'articles', to: '/articles', label: '素材库', caption: '政策素材', icon: 'article', match: ['/articles'] },
  { key: 'wrongbook', to: '/wrongbook', label: '错题本', caption: '薄弱回练', icon: 'wrong', match: ['/wrongbook'] },
  { key: 'profile', to: '/profile', label: '个人档案', caption: '账号与目标', icon: 'user', match: ['/profile'] },
]

const allNavItems = computed(() => [...navItems, ...utilityItems])
const currentItem = computed(() => {
  if (route.path.startsWith('/practice')) return navItems[1]
  return allNavItems.value.find(item => item.match.some(path => route.path === path || route.path.startsWith(`${path}/`))) || navItems[0]
})

function isActive(item: NavItem) {
  if (item.key === 'papers') return route.path.startsWith('/practice') || route.path.startsWith('/papers')
  return item.match.some(path => route.path === path || route.path.startsWith(`${path}/`))
}

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <aside class="app-sidebar" aria-label="主导航">
      <router-link to="/coach" class="brand">
        <span class="brand-mark">PQ</span>
        <span class="brand-copy">
          <strong>PolicyQuest</strong>
          <small>AI 公考学习引擎</small>
        </span>
      </router-link>

      <nav class="side-section">
        <router-link
          v-for="item in navItems"
          :key="item.key"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item) }"
        >
          <span class="nav-icon"><SvgIcon :name="item.icon" :size="20" /></span>
          <span class="nav-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ item.caption }}</small>
          </span>
        </router-link>
      </nav>

      <nav class="side-section compact">
        <router-link
          v-for="item in utilityItems"
          :key="item.key"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item) }"
        >
          <span class="nav-icon"><SvgIcon :name="item.icon" :size="18" /></span>
          <span class="nav-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ item.caption }}</small>
          </span>
        </router-link>
      </nav>

      <router-link v-if="userStore.isAdmin" to="/admin" class="admin-link">
        <SvgIcon name="admin" :size="18" />
        <span>管理后台</span>
      </router-link>

      <section class="daily-card">
        <span class="card-kicker">Today Focus</span>
        <strong>先完成 1 次限时真题</strong>
        <p>系统会把本次作答同步到报告，继续更新薄弱项和下一步建议。</p>
        <div class="mini-progress"><i></i></div>
      </section>

      <footer class="sidebar-footer">
        <button class="user-pill" type="button" @click="router.push('/profile')">
          <span class="avatar">{{ userInitial }}</span>
          <span>
            <strong>{{ userName }}</strong>
            <small>{{ userStore.user?.exam_target || '备考学员' }}</small>
          </span>
        </button>
        <button class="logout-btn" type="button" @click="logout">
          <SvgIcon name="logout" :size="17" />
          <span>退出登录</span>
        </button>
      </footer>
    </aside>

    <header class="mobile-topbar">
      <router-link to="/coach" class="mobile-brand"><span class="brand-mark">PQ</span></router-link>
      <div>
        <strong>{{ currentItem.label }}</strong>
        <small>{{ currentItem.caption }}</small>
      </div>
      <button class="mobile-avatar" type="button" @click="router.push('/profile')">{{ userInitial }}</button>
    </header>

    <main class="app-main">
      <div class="app-topline">
        <div>
          <span>{{ currentItem.caption }}</span>
          <strong>{{ currentItem.label }}</strong>
        </div>
        <div class="topline-actions">
          <router-link to="/">产品主页</router-link>
          <button type="button" @click="router.push('/papers')">
            <SvgIcon name="practice" :size="18" />
            选择真题
          </button>
        </div>
      </div>
      <router-view />
    </main>

    <nav class="mobile-nav" aria-label="移动端主导航">
      <router-link
        v-for="item in navItems"
        :key="item.key"
        :to="item.to"
        class="mobile-nav-item"
        :class="{ active: isActive(item) }"
      >
        <SvgIcon :name="item.icon" :size="20" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background:
    linear-gradient(90deg, rgba(0, 184, 217, 0.045) 1px, transparent 1px),
    linear-gradient(180deg, #f7fbff 0%, #ffffff 48%, #f5f9ff 100%);
  background-size: 44px 44px, auto;
}

.app-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  width: 268px;
  padding: 22px 16px;
  border-right: 1px solid rgba(198, 211, 232, 0.78);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 18px 0 46px rgba(19, 42, 74, 0.05);
  backdrop-filter: blur(18px);
}

.brand,
.user-pill,
.logout-btn,
.admin-link,
.topline-actions,
.topline-actions button {
  display: inline-flex;
  align-items: center;
}

.brand {
  gap: 12px;
  padding: 4px 8px 22px;
  color: var(--text-primary);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--gradient-1);
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(0, 80, 203, 0.2);
}

.brand-copy strong,
.brand-copy small,
.user-pill strong,
.user-pill small {
  display: block;
}

.brand-copy strong {
  color: #07182f;
  font-size: 17px;
}

.brand-copy small,
.user-pill small {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
}

.side-section {
  display: grid;
  gap: 7px;
}

.side-section.compact {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(198, 211, 232, 0.58);
}

.nav-item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 14px;
  color: var(--text-secondary);
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.nav-item:hover {
  transform: translateX(2px);
  background: #f1f7ff;
  color: var(--primary);
}

.nav-item.active {
  border-color: rgba(0, 80, 203, 0.22);
  background: linear-gradient(135deg, #eef5ff, #f8fbff);
  color: var(--primary);
  box-shadow: inset 3px 0 0 var(--primary);
}

.nav-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #ffffff;
  color: currentColor;
  box-shadow: inset 0 0 0 1px rgba(198, 211, 232, 0.8);
}

.nav-item.active .nav-icon {
  background: var(--primary);
  color: #ffffff;
  box-shadow: none;
}

.nav-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.nav-copy strong {
  overflow: hidden;
  color: currentColor;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-copy small {
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-link {
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  margin: 16px 4px 0;
  border-radius: 12px;
  background: var(--secondary-soft);
  color: var(--secondary);
  font-size: 13px;
  font-weight: 900;
}

.daily-card {
  display: grid;
  gap: 9px;
  margin: auto 4px 16px;
  padding: 16px;
  border: 1px solid rgba(0, 184, 217, 0.18);
  border-radius: 14px;
  background: linear-gradient(145deg, #ffffff, #effcff);
}

.card-kicker {
  color: var(--primary);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.daily-card strong {
  color: #07182f;
  font-size: 15px;
}

.daily-card p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.55;
}

.mini-progress {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #dce9ff;
}

.mini-progress i {
  display: block;
  width: 68%;
  height: 100%;
  border-radius: inherit;
  background: var(--gradient-2);
}

.sidebar-footer {
  display: grid;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid rgba(198, 211, 232, 0.62);
}

.user-pill {
  gap: 10px;
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 14px;
  background: #f8fbff;
  color: var(--text-primary);
  text-align: left;
}

.avatar,
.mobile-avatar {
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: var(--secondary);
  color: #ffffff;
  font-weight: 900;
}

.avatar {
  width: 38px;
  height: 38px;
}

.logout-btn {
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 900;
}

.logout-btn:hover {
  border-color: rgba(186, 26, 26, 0.24);
  background: var(--danger-soft);
  color: var(--danger);
}

.app-main {
  min-height: 100vh;
  margin-left: 268px;
  padding-bottom: 42px;
}

.app-main :deep(.page-container) {
  width: min(var(--container), calc(100vw - 268px - 56px));
}

.app-main :deep(.practice-page) {
  width: min(1440px, calc(100vw - 268px - 56px));
}

.app-topline {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 70px;
  padding: 0 max(28px, calc((100vw - 268px - 1240px) / 2));
  border-bottom: 1px solid rgba(198, 211, 232, 0.68);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
}

.app-topline span,
.app-topline strong {
  display: block;
}

.app-topline span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 900;
}

.app-topline strong {
  margin-top: 2px;
  color: #07182f;
  font-size: 18px;
}

.topline-actions {
  gap: 10px;
}

.topline-actions a,
.topline-actions button {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 900;
}

.topline-actions a {
  border: 1px solid var(--border);
  background: #ffffff;
  color: var(--text-secondary);
}

.topline-actions button {
  gap: 7px;
  border: 0;
  background: var(--gradient-1);
  color: #ffffff;
}

.mobile-topbar,
.mobile-nav {
  display: none;
}

@media (max-width: 1040px) {
  .app-sidebar,
  .app-topline {
    display: none;
  }

  .app-main {
    margin-left: 0;
    padding-top: 72px;
    padding-bottom: 96px;
  }

  .app-main :deep(.page-container),
  .app-main :deep(.practice-page) {
    width: min(var(--container), calc(100vw - 32px));
  }

  .mobile-topbar {
    position: fixed;
    inset: 0 0 auto;
    z-index: 50;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 40px;
    align-items: center;
    gap: 12px;
    height: 72px;
    padding: 0 16px;
    border-bottom: 1px solid rgba(198, 211, 232, 0.72);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(18px);
  }

  .mobile-topbar strong,
  .mobile-topbar small {
    display: block;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-topbar strong {
    color: #07182f;
    font-size: 16px;
  }

  .mobile-topbar small {
    margin-top: 2px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 800;
  }

  .mobile-avatar {
    width: 38px;
    height: 38px;
  }

  .mobile-nav {
    position: fixed;
    inset: auto 10px 10px;
    z-index: 50;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4px;
    padding: 8px;
    border: 1px solid rgba(198, 211, 232, 0.78);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 18px 42px rgba(19, 42, 74, 0.14);
    backdrop-filter: blur(18px);
  }

  .mobile-nav-item {
    display: grid;
    justify-items: center;
    gap: 4px;
    min-width: 0;
    padding: 8px 2px;
    border-radius: 14px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 900;
  }

  .mobile-nav-item span {
    overflow: hidden;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-nav-item.active {
    background: #eef5ff;
    color: var(--primary);
  }
}

@media (max-width: 560px) {
  .mobile-nav {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    inset: auto 8px 8px;
  }
}
</style>
