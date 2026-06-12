<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../store/user'

const router = useRouter()
const userStore = useUserStore()
const form = ref({ username: '', password: '' })
const loading = ref(false)

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    await userStore.login(form.value.username, form.value.password)
    ElMessage.success('登录成功')
    router.push(userStore.isAdmin ? '/admin' : '/app/dashboard')
  } catch (e: any) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-shell">
      <aside class="auth-story">
        <router-link to="/" class="brand">
          <span class="brand-mark">PQ</span>
          <span>
            <strong>PolicyQuest</strong>
            <small>AI Exam Coach</small>
          </span>
        </router-link>

        <div class="story-copy">
          <p class="page-kicker">Welcome Back</p>
          <h1>继续你的公考训练节奏</h1>
          <p>回到工作台，查看今日任务、继续未完成练习，并让 AI 把每一次作答沉淀为下一步提分路径。</p>
        </div>

        <div class="story-metrics">
          <div><strong>20</strong><span>今日推荐题量</span></div>
          <div><strong>5</strong><span>评分维度</span></div>
          <div><strong>AI</strong><span>实时评阅</span></div>
        </div>
      </aside>

      <section class="auth-card glass-card">
        <div class="auth-header">
          <p class="page-kicker">Sign In</p>
          <h2>登录 PolicyQuest</h2>
          <p>输入账号信息，进入你的专属备考工作台。</p>
        </div>

        <form class="auth-form" @submit.prevent="handleLogin">
          <label class="form-group">
            <span>用户名</span>
            <input v-model="form.username" class="form-control" type="text" placeholder="请输入用户名" autocomplete="username" />
          </label>
          <label class="form-group">
            <span>密码</span>
            <input v-model="form.password" class="form-control" type="password" placeholder="请输入密码" autocomplete="current-password" />
          </label>

          <button class="btn-primary submit-btn" type="submit" :disabled="loading">
            {{ loading ? '登录中...' : '登录并进入工作台' }}
          </button>
        </form>

        <div class="auth-footer">
          <span>还没有账号？</span>
          <router-link to="/register">立即注册</router-link>
          <span class="divider">|</span>
          <router-link to="/">返回首页</router-link>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 32px;
  background:
    radial-gradient(circle at 12% 16%, rgba(0, 102, 255, 0.14), transparent 32%),
    radial-gradient(circle at 88% 84%, rgba(13, 148, 136, 0.12), transparent 30%),
    linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
}

.auth-shell {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(380px, 480px);
  gap: 24px;
  width: min(1080px, 100%);
}

.auth-story,
.auth-card {
  min-height: 620px;
}

.auth-story {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 34px;
  border: 1px solid rgba(194, 198, 216, 0.72);
  border-radius: 24px;
  background:
    linear-gradient(145deg, rgba(0, 80, 203, 0.94), rgba(0, 106, 97, 0.88)),
    var(--primary);
  color: #ffffff;
  box-shadow: var(--shadow-md);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-weight: 900;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.brand strong,
.brand small {
  display: block;
}

.brand small {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
}

.story-copy {
  max-width: 520px;
}

.story-copy .page-kicker {
  color: #bff8ef;
}

.story-copy h1 {
  margin: 0;
  font-size: 42px;
  line-height: 1.16;
}

.story-copy p:last-child {
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 16px;
  line-height: 1.75;
}

.story-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.story-metrics div {
  display: grid;
  gap: 5px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.13);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.story-metrics strong {
  font-size: 26px;
}

.story-metrics span {
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
}

.auth-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 44px;
  border-radius: 24px;
}

.auth-header {
  margin-bottom: 28px;
}

.auth-header h2 {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
}

.auth-header p:last-child {
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.auth-form {
  display: grid;
  gap: 18px;
}

.form-group {
  display: grid;
  gap: 8px;
}

.form-group span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
}

.submit-btn {
  width: 100%;
  min-height: 50px;
  margin-top: 6px;
}

.auth-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
  color: var(--text-muted);
  font-size: 14px;
}

.auth-footer a {
  font-weight: 800;
}

.divider {
  color: var(--border-strong);
}

@media (max-width: 900px) {
  .auth-page {
    padding: 20px;
  }

  .auth-shell {
    grid-template-columns: 1fr;
  }

  .auth-story {
    min-height: 360px;
  }

  .auth-card {
    min-height: auto;
  }
}

@media (max-width: 560px) {
  .auth-page {
    padding: 0;
  }

  .auth-shell {
    gap: 0;
  }

  .auth-story {
    min-height: 310px;
    border-radius: 0 0 24px 24px;
    padding: 24px 20px;
  }

  .story-copy h1 {
    font-size: 32px;
  }

  .story-metrics {
    grid-template-columns: 1fr;
  }

  .auth-card {
    border: 0;
    border-radius: 0;
    box-shadow: none;
    padding: 30px 20px 40px;
  }
}
</style>
