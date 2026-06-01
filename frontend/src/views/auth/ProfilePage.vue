<script setup lang="ts">
import { useUserStore } from '../../store/user'
const userStore = useUserStore()
</script>

<template>
  <div class="page-container">
    <h2 class="section-title">个人中心</h2>
    <div class="glass-card" style="max-width:600px">
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="info-row"><span class="label">用户名</span><span>{{ userStore.user?.username }}</span></div>
        <div class="info-row"><span class="label">昵称</span><span>{{ userStore.user?.nickname }}</span></div>
        <div class="info-row"><span class="label">邮箱</span><span>{{ userStore.user?.email }}</span></div>
        <div class="info-row"><span class="label">角色</span><span>{{ userStore.user?.role === 'admin' ? '管理员' : '普通用户' }}</span></div>
        <div class="info-row"><span class="label">备考方向</span><span>{{ userStore.user?.exam_target || '未设置' }}</span></div>
        <div class="info-row"><span class="label">地区</span><span>{{ userStore.user?.province || '未设置' }}</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
.label { color: var(--text-muted); }
</style>
