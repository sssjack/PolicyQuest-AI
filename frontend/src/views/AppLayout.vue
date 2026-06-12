<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../store/user'
import SvgIcon from '../components/SvgIcon.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const navItems = [
  { path: '/app/dashboard', label: '工作台', caption: '今日任务', icon: 'dashboard' },
  { path: '/app/practice', label: '练习中心', caption: '专项/模考', icon: 'practice' },
  { path: '/app/articles', label: '时政素材', caption: '政策热点', icon: 'article' },
  { path: '/app/wrongbook', label: '错题本', caption: '弱项复盘', icon: 'wrong' },
  { path: '/app/report', label: '成长报告', caption: '能力画像', icon: 'report' },
  { path: '/app/profile', label: '个人中心', caption: '档案设置', icon: 'user' },
]

const currentTitle = computed(() => {
  const matched = navItems.find(item => route.path.startsWith(item.path))
  return matched?.label || 'PolicyQuest'
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar" aria-label="主导航">
      <router-link to="/app/dashboard" class="brand">
        <span class="brand-mark">PQ</span>
        <span>
          <strong>PolicyQuest</strong>
          <small>AI Exam Coach</small>
        </span>
      </router-link>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-icon"><SvgIcon :name="item.icon" :size="20" /></span>
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

      <section class="sidebar-card">
        <span class="card-kicker">Daily Goal</span>
        <strong>完成 20 道训练题</strong>
        <div class="mini-progress"><i></i></div>
        <small>今日建议保持 35 分钟专注练习</small>
      </section>

      <footer class="sidebar-footer">
        <div class="user-info">
          <div class="avatar">{{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || 'U' }}</div>
          <div class="user-detail">
            <strong>{{ userStore.user?.nickname || userStore.user?.username || '考生' }}</strong>
            <span>{{ userStore.user?.role === 'admin' ? '管理员' : '备考学员' }}</span>
          </div>
        </div>
        <button class="logout-btn" type="button" @click="logout">
          <SvgIcon name="logout" :size="17" />
          <span>退出</span>
        </button>
      </footer>
    </aside>

    <div class="mobile-topbar">
      <router-link to="/app/dashboard" class="mobile-brand">
        <span class="brand-mark">PQ</span>
      </router-link>
      <strong>{{ currentTitle }}</strong>
      <button class="mobile-avatar" type="button" @click="router.push('/app/profile')">
        {{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || 'U' }}
      </button>
    </div>

    <main class="main-content">
      <router-view />
    </main>

    <nav class="mobile-nav" aria-label="移动端主导航">
      <router-link
        v-for="item in navItems.slice(0, 5)"
        :key="item.path"
        :to="item.path"
        class="mobile-nav-item"
        :class="{ active: isActive(item.path) }"
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
    radial-gradient(circle at 24% -10%, rgba(0, 102, 255, 0.08), transparent 30%),
    linear-gradient(180deg, #f8f9ff 0%, #ffffff 54%, #f8f9ff 100%);
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  width: 276px;
  padding: 22px 16px;
  border-right: 1px solid rgba(194, 198, 216, 0.62);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 18px 0 48px rgba(19, 42, 74, 0.05);
  backdrop-filter: blur(18px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px 20px;
  color: var(--text-primary);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--gradient-1);
  color: #ffffff;
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 14px 28px rgba(0, 80, 203, 0.2);
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font-size: 17px;
}

.brand small {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
}

.sidebar-nav {
  display: grid;
  gap: 7px;
}

.nav-item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 16px;
  color: var(--text-secondary);
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.nav-item:hover {
  transform: translateX(2px);
  background: var(--surface-muted);
  color: var(--primary);
}

.nav-item.active {
  border-color: rgba(0, 80, 203, 0.24);
  background: #eff4ff;
  color: var(--primary);
}

.nav-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: #ffffff;
  color: currentColor;
  box-shadow: inset 0 0 0 1px rgba(194, 198, 216, 0.5);
}

.nav-item.active .nav-icon {
  background: var(--primary);
  color: #ffffff;
  box-shadow: none;
}

.nav-copy {
  display: grid;
  gap: 2px;
}

.nav-copy strong {
  font-size: 14px;
}

.nav-copy small {
  color: var(--text-muted);
  font-size: 11px;
}

.admin-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  gap: 8px;
  margin: 16px 4px 0;
  border-radius: 14px;
  background: var(--secondary-soft);
  color: var(--secondary);
  font-size: 13px;
  font-weight: 800;
}

.sidebar-card {
  display: grid;
  gap: 9px;
  margin: auto 4px 16px;
  padding: 16px;
  border: 1px solid rgba(194, 198, 216, 0.6);
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff, #eff4ff);
}

.card-kicker {
  color: var(--primary);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.sidebar-card strong {
  color: var(--text-primary);
  font-size: 15px;
}

.sidebar-card small {
  color: var(--text-muted);
  line-height: 1.5;
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
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(194, 198, 216, 0.58);
}

.user-info {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
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
  width: 42px;
  height: 42px;
}

.user-detail {
  min-width: 0;
}

.user-detail strong,
.user-detail span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-detail strong {
  color: var(--text-primary);
  font-size: 14px;
}

.user-detail span {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
}

.logout-btn:hover {
  border-color: rgba(186, 26, 26, 0.28);
  background: var(--danger-soft);
  color: var(--danger);
}

.main-content {
  min-height: 100vh;
  margin-left: 276px;
}

.mobile-topbar,
.mobile-nav {
  display: none;
}

@media (max-width: 980px) {
  .sidebar {
    display: none;
  }

  .main-content {
    margin-left: 0;
    padding-top: 72px;
    padding-bottom: 80px;
  }

  .mobile-topbar {
    position: fixed;
    inset: 0 0 auto;
    z-index: 40;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 42px;
    align-items: center;
    gap: 12px;
    height: 72px;
    padding: 0 16px;
    border-bottom: 1px solid rgba(194, 198, 216, 0.62);
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(18px);
  }

  .mobile-topbar strong {
    text-align: center;
    font-size: 16px;
  }

  .mobile-avatar {
    width: 38px;
    height: 38px;
  }

  .mobile-nav {
    position: fixed;
    inset: auto 10px 10px;
    z-index: 40;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    padding: 8px;
    border: 1px solid rgba(194, 198, 216, 0.72);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 18px 46px rgba(19, 42, 74, 0.12);
    backdrop-filter: blur(18px);
  }

  .mobile-nav-item {
    display: grid;
    justify-items: center;
    gap: 4px;
    min-width: 0;
    padding: 8px 4px;
    border-radius: 16px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 800;
  }

  .mobile-nav-item span {
    overflow: hidden;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-nav-item.active {
    background: var(--surface-muted);
    color: var(--primary);
  }
}
</style>
