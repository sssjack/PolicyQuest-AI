<script setup lang="ts">
import { useUserStore } from '../../store/user'

const userStore = useUserStore()

const profileRows = [
  { label: '用户名', value: () => userStore.user?.username || '未设置' },
  { label: '昵称', value: () => userStore.user?.nickname || '未设置' },
  { label: '邮箱', value: () => userStore.user?.email || '未设置' },
  { label: '角色', value: () => userStore.user?.role === 'admin' ? '管理员' : '备考学员' },
  { label: '备考方向', value: () => userStore.user?.exam_target || '未设置' },
  { label: '地区', value: () => userStore.user?.province || '未设置' },
]
</script>

<template>
  <div class="profile-page page-container">
    <section class="profile-hero">
      <div>
        <p class="page-kicker">Profile</p>
        <h1 class="page-title">个人中心</h1>
        <p class="page-subtitle">这里记录你的账号、角色和备考方向，后续推荐会围绕这些信息持续优化。</p>
      </div>
      <div class="profile-avatar">{{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || 'U' }}</div>
    </section>

    <section class="profile-grid">
      <article class="profile-card glass-card">
        <div class="profile-name">
          <span class="avatar-small">{{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || 'U' }}</span>
          <div>
            <h2>{{ userStore.user?.nickname || userStore.user?.username || '考生' }}</h2>
            <p>{{ userStore.user?.exam_target || '尚未设置备考方向' }}</p>
          </div>
        </div>
      </article>

      <article class="info-card glass-card">
        <div v-for="row in profileRows" :key="row.label" class="info-row">
          <span>{{ row.label }}</span>
          <strong>{{ row.value() }}</strong>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.profile-page {
  display: grid;
  gap: 20px;
}

.profile-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px solid rgba(194, 198, 216, 0.72);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.profile-avatar,
.avatar-small {
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--gradient-2);
  color: #ffffff;
  font-weight: 900;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  font-size: 40px;
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.45fr) minmax(0, 1fr);
  gap: 16px;
}

.profile-card {
  display: grid;
  align-content: center;
}

.profile-name {
  display: grid;
  justify-items: center;
  gap: 16px;
  text-align: center;
}

.avatar-small {
  width: 76px;
  height: 76px;
  font-size: 28px;
}

.profile-name h2 {
  margin: 0;
  font-size: 24px;
}

.profile-name p {
  margin: 8px 0 0;
  color: var(--text-muted);
}

.info-card {
  display: grid;
  gap: 2px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 15px 0;
  border-bottom: 1px solid var(--border);
}

.info-row:last-child {
  border-bottom: 0;
}

.info-row span {
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 800;
}

.info-row strong {
  color: var(--text-primary);
  text-align: right;
}

@media (max-width: 780px) {
  .profile-hero,
  .profile-grid {
    display: grid;
    grid-template-columns: 1fr;
  }

  .profile-avatar {
    width: 96px;
    height: 96px;
  }
}
</style>
