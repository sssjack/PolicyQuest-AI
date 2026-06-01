<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const form = ref({ username: '', email: '', password: '', confirmPw: '', nickname: '', exam_target: '', province: '' })
const loading = ref(false)

const examOptions = ['国考', '省考', '事业编', '税务', '选调生', '基层治理']
const provinceOptions = ['全国', '北京', '上海', '广东', '浙江', '山东', '江苏', '四川', '湖北', '河南']

async function handleRegister() {
  if (!form.value.username || !form.value.email || !form.value.password) return ElMessage.warning('请填写必填项')
  if (form.value.password !== form.value.confirmPw) return ElMessage.warning('两次密码不一致')
  if (form.value.password.length < 6) return ElMessage.warning('密码至少6位')
  loading.value = true
  try {
    await userStore.register(form.value)
    ElMessage.success('注册成功')
    router.push('/app/dashboard')
  } catch (e: any) { ElMessage.error(e.message || '注册失败') }
  finally { loading.value = false }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg" />
    <div class="auth-container" style="max-width:480px">
      <div class="auth-card glass-card">
        <div class="auth-header">
          <div class="logo-icon">
            <svg viewBox="0 0 40 40" width="24" height="24" fill="none">
              <path d="M10 8h7c4 0 6 2.5 6 5.5S21 19 17 19h-3v8h-4V8zm4 3.5v4h2.5c1.3 0 2-.8 2-2s-.7-2-2-2H14z" fill="white"/>
              <path d="M34 27c0 .5-.4.9-.9.9H21.9c-.5 0-.9-.4-.9-.9V17.9c0-.5.4-.9.9-.9H24l2-2.5h-4a3.4 3.4 0 00-3.4 3.4V27a3.4 3.4 0 003.4 3.4h11.2A3.4 3.4 0 0037 27v-7l-3 2.5V27z" fill="rgba(255,255,255,.85)"/>
            </svg>
          </div>
          <h1>Create Account</h1>
          <p>加入 PolicyQuest AI，开启智能备考</p>
        </div>
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-row">
            <div class="form-group"><label>用户名 *</label><input v-model="form.username" placeholder="请输入用户名" /></div>
            <div class="form-group"><label>昵称</label><input v-model="form.nickname" placeholder="显示名称" /></div>
          </div>
          <div class="form-group"><label>邮箱 *</label><input v-model="form.email" type="email" placeholder="请输入邮箱" /></div>
          <div class="form-row">
            <div class="form-group"><label>密码 *</label><input v-model="form.password" type="password" placeholder="至少6位" /></div>
            <div class="form-group"><label>确认密码 *</label><input v-model="form.confirmPw" type="password" placeholder="再次输入" /></div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>备考方向</label>
              <select v-model="form.exam_target"><option value="">请选择</option><option v-for="e in examOptions" :key="e" :value="e">{{ e }}</option></select>
            </div>
            <div class="form-group">
              <label>所在地区</label>
              <select v-model="form.province"><option value="">请选择</option><option v-for="p in provinceOptions" :key="p" :value="p">{{ p }}</option></select>
            </div>
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-top:8px" :disabled="loading">
            {{ loading ? '注册中...' : '立即注册' }}
          </button>
        </form>
        <div class="auth-footer">
          已有账号？<router-link to="/login">去登录</router-link>
          <span style="margin:0 12px;color:var(--text-muted)">|</span>
          <router-link to="/">返回首页</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; }
.auth-bg { position: fixed; inset: 0; background: radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.1) 0%, transparent 50%), var(--bg-dark); }
.auth-container { position: relative; z-index: 1; width: 100%; padding: 24px; }
.auth-card { padding: 40px; }
.auth-header { text-align: center; margin-bottom: 32px; }
.auth-header .logo-icon { margin: 0 auto 16px; width: 56px; height: 56px; font-size: 24px; border-radius: 14px; background: var(--gradient-1); display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff; }
.auth-header h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
.auth-header p { font-size: 14px; color: var(--text-muted); }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.form-group input, .form-group select {
  padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05); color: var(--text-primary); font-size: 14px;
  outline: none; transition: all 0.3s;
}
.form-group input:focus, .form-group select:focus { border-color: var(--primary); }
.form-group input::placeholder { color: var(--text-muted); }
.form-group select { appearance: none; cursor: pointer; }
.form-group select option { background: #1a1a2e; color: var(--text-primary); }
.auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: var(--text-muted); }
.auth-footer a { color: var(--primary-light); }
</style>
