<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../store/user'

import SvgIcon from '../components/SvgIcon.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const navItems = [
  { path: '/app/dashboard', label: '学习中心', icon: 'dashboard' },
  { path: '/app/practice', label: '开始练习', icon: 'practice' },
  { path: '/app/wrongbook', label: '错题本', icon: 'wrong' },
  { path: '/app/report', label: '学习报告', icon: 'report' },
  { path: '/app/profile', label: '个人中心', icon: 'user' },
]

function logout() {
  userStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <router-link to="/" class="sidebar-logo">
          <div class="logo-icon">PQ</div>
          <span>PolicyQuest</span>
        </router-link>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems" :key="item.path" :to="item.path"
          class="nav-item" :class="{ active: route.path === item.path }"
        >
          <span class="nav-icon"><SvgIcon :name="item.icon" :size="18" /></span>
          <span>{{ item.label }}</span>
        </router-link>
        <router-link v-if="userStore.isAdmin" to="/admin" class="nav-item">
          <span class="nav-icon"><SvgIcon name="admin" :size="18" /></span><span>管理后台</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="avatar">{{ userStore.user?.nickname?.[0] || 'U' }}</div>
          <div class="user-detail">
            <div class="user-name">{{ userStore.user?.nickname || userStore.user?.username }}</div>
            <div class="user-role">{{ userStore.user?.role === 'admin' ? '管理员' : '考生' }}</div>
          </div>
        </div>
        <button class="btn-ghost" style="width:100%;padding:8px;font-size:13px;margin-top:12px" @click="logout">退出登录</button>
      </div>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-layout { display: flex; min-height: 100vh; }
.sidebar {
  width: 240px; background: rgba(255,255,255,0.02); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 50;
}
.sidebar-header { padding: 20px; border-bottom: 1px solid var(--border); }
.sidebar-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
.sidebar-logo .logo-icon { width: 36px; height: 36px; font-size: 16px; border-radius: 8px; background: var(--gradient-1); display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff; }
.sidebar-logo span { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.sidebar-nav { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px;
  color: var(--text-secondary); font-size: 14px; transition: all 0.2s; text-decoration: none;
}
.nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
.nav-item.active { background: rgba(99,102,241,0.15); color: var(--primary-light); }
.nav-icon { font-size: 18px; }
.sidebar-footer { padding: 16px; border-top: 1px solid var(--border); }
.user-info { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 36px; height: 36px; border-radius: 50%; background: var(--gradient-1);
  display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff;
}
.user-detail { flex: 1; min-width: 0; }
.user-name { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-role { font-size: 12px; color: var(--text-muted); }
.main-content { flex: 1; margin-left: 240px; min-height: 100vh; background: var(--bg-dark); }
</style>
