<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

import SvgIcon from '../../components/SvgIcon.vue'

const navItems = [
  { path: '/admin/dashboard', label: '数据概览', icon: 'dashboard' },
  { path: '/admin/questions', label: '题库管理', icon: 'practice' },
  { path: '/admin/ai-generate', label: 'AI出题', icon: 'robot' },
  { path: '/admin/users', label: '用户管理', icon: 'users' },
  { path: '/admin/articles', label: '文章管理', icon: 'article' },
  { path: '/admin/crawler', label: '内容采集', icon: 'hot' },
]

function logout() { userStore.logout(); router.push('/') }
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <router-link to="/" class="sidebar-logo">
          <div class="logo-icon">PQ</div>
          <div><div style="font-size:16px;font-weight:700">PolicyQuest</div><div style="font-size:11px;color:var(--text-muted)">Admin Console</div></div>
        </router-link>
      </div>
      <nav class="sidebar-nav">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path"
          class="nav-item" :class="{ active: route.path === item.path }">
          <span class="nav-icon"><SvgIcon :name="item.icon" :size="16" /></span><span>{{ item.label }}</span>
        </router-link>
        <div style="border-top:1px solid var(--border);margin:8px 0" />
        <router-link to="/app/dashboard" class="nav-item">
          <span class="nav-icon"><SvgIcon name="home" :size="16" /></span><span>返回用户端</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button class="btn-ghost" style="width:100%;padding:8px;font-size:13px" @click="logout">退出登录</button>
      </div>
    </aside>
    <main class="admin-main"><router-view /></main>
  </div>
</template>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; }
.admin-sidebar {
  width: 220px; background: rgba(255,255,255,0.02); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 50;
}
.sidebar-header { padding: 16px; border-bottom: 1px solid var(--border); }
.sidebar-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text-primary); }
.logo-icon { width: 36px; height: 36px; font-size: 16px; border-radius: 8px; background: var(--gradient-1); display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff; }
.sidebar-nav { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px;
  color: var(--text-secondary); font-size: 14px; transition: all 0.2s; text-decoration: none;
}
.nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
.nav-item.active { background: rgba(99,102,241,0.15); color: var(--primary-light); }
.nav-icon { font-size: 16px; }
.sidebar-footer { padding: 12px; border-top: 1px solid var(--border); }
.admin-main { flex: 1; margin-left: 220px; background: var(--bg-dark); }
</style>
