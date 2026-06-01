<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const form = ref({ username: '', password: '' })
const loading = ref(false)

async function handleLogin() {
  if (!form.value.username || !form.value.password) return ElMessage.warning('请输入用户名和密码')
  loading.value = true
  try {
    await userStore.login(form.value.username, form.value.password)
    ElMessage.success('登录成功')
    if (userStore.isAdmin) router.push('/admin')
    else router.push('/app/dashboard')
  } catch (e: any) {
    ElMessage.error(e.message || '登录失败')
  } finally { loading.value = false }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg" />
    <div class="auth-container">
      <div class="auth-card glass-card">
        <div class="auth-header">
          <div class="logo-icon">
            <svg viewBox="0 0 40 40" width="24" height="24" fill="none">
              <path d="M10 8h7c4 0 6 2.5 6 5.5S21 19 17 19h-3v8h-4V8zm4 3.5v4h2.5c1.3 0 2-.8 2-2s-.7-2-2-2H14z" fill="white"/>
              <path d="M34 27c0 .5-.4.9-.9.9H21.9c-.5 0-.9-.4-.9-.9V17.9c0-.5.4-.9.9-.9H24l2-2.5h-4a3.4 3.4 0 00-3.4 3.4V27a3.4 3.4 0 003.4 3.4h11.2A3.4 3.4 0 0037 27v-7l-3 2.5V27z" fill="rgba(255,255,255,.85)"/>
            </svg>
          </div>
          <h1>Welcome Back</h1>
          <p>登录 PolicyQuest AI，继续你的备考之旅</p>
        </div>
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="form.username" type="text" placeholder="请输入用户名" autocomplete="username" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="form.password" type="password" placeholder="请输入密码" autocomplete="current-password" />
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-top:8px" :disabled="loading">
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>
        <div class="auth-footer">
          还没有账号？<router-link to="/register">立即注册</router-link>
          <span style="margin:0 12px;color:var(--text-muted)">|</span>
          <router-link to="/">返回首页</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; }
.auth-bg {
  position: fixed; inset: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.1) 0%, transparent 50%),
              var(--bg-dark);
}
.auth-container { position: relative; z-index: 1; width: 100%; max-width: 440px; padding: 24px; }
.auth-card { padding: 40px; }
.auth-header { text-align: center; margin-bottom: 32px; }
.auth-header .logo-icon { margin: 0 auto 16px; width: 56px; height: 56px; font-size: 24px; border-radius: 14px; background: var(--gradient-1); display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff; }
.auth-header h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
.auth-header p { font-size: 14px; color: var(--text-muted); }
.auth-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 14px; color: var(--text-secondary); font-weight: 500; }
.form-group input {
  padding: 12px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05); color: var(--text-primary); font-size: 15px;
  outline: none; transition: all 0.3s;
}
.form-group input:focus { border-color: var(--primary); background: rgba(99,102,241,0.05); }
.form-group input::placeholder { color: var(--text-muted); }
.auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: var(--text-muted); }
.auth-footer a { color: var(--primary-light); }
</style>
