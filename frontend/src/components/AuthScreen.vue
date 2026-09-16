<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, Hide, ArrowRight } from '@element-plus/icons-vue'
import { useUserStore } from '../store/user'
import { authApi } from '../api'
import SmsCodeField from './SmsCodeField.vue'
const props = defineProps<{ mode: 'login' | 'register' | 'reset' }>()
const router = useRouter(), userStore = useUserStore()
const account = ref(''), phone = ref(''), code = ref(''), password = ref(''), confirmPassword = ref('')
const loading = ref(false), showPassword = ref(false), errorMessage = ref('')
const title = computed(() => props.mode === 'login' ? '欢迎回来' : props.mode === 'register' ? '开启新的进步' : '设置新密码')
const subtitle = computed(() => props.mode === 'login' ? '继续你的下一次突破。' : props.mode === 'register' ? '手机号注册，即得 100 积分。' : '验证你的手机号，安全找回账号。')
async function submit() {
  if (loading.value) return
  errorMessage.value = ''
  if (props.mode !== 'login') {
    if (!/^1[3-9]\d{9}$/.test(phone.value.trim())) { errorMessage.value = '请输入有效的中国大陆手机号'; return }
    if (!/^\d{6}$/.test(code.value)) { errorMessage.value = '请输入6位短信验证码'; return }
    if (password.value.length < 8 || password.value.length > 64 || new TextEncoder().encode(password.value).length > 72) { errorMessage.value = '密码需8–64位，中文等多字节字符合计不超过72字节'; return }
    if (props.mode === 'reset' && confirmPassword.value !== password.value) { errorMessage.value = '两次输入的密码不一致'; return }
  }
  loading.value = true
  try {
    if (props.mode === 'login') {
      await userStore.login(account.value.trim(), password.value)
      await router.replace('/coach')
    } else if (props.mode === 'register') {
      await userStore.register({ phone: phone.value.trim(), code: code.value, password: password.value })
      await router.replace('/coach')
    } else {
      await authApi.resetPassword({ phone: phone.value.trim(), code: code.value, password: password.value })
      userStore.logout()
      ElMessage.success('密码已重置，请重新登录')
      await router.replace('/login')
    }
  } catch (error: any) { errorMessage.value = error.message || '操作失败，请稍后重试' }
  finally { loading.value = false }
}
</script>

<template>
  <main class="access-page">
    <header class="access-nav"><router-link to="/" class="access-brand"><span class="access-logo">PQ</span><strong>PolicyQuest</strong></router-link><router-link to="/" class="access-home">返回首页 <el-icon><ArrowRight /></el-icon></router-link></header>
    <div class="access-content">
      <section class="access-hero" aria-label="AI 公考学习">
        <span class="access-eyebrow"><i></i>AI 公考学习</span>
        <h1>让每次练习，<br>都有<span>进步。</span></h1>
        <p>与 AI 一起，把每一次练习变成进步。</p>
        <svg class="access-progress" viewBox="0 0 420 180" fill="none" aria-hidden="true">
          <path class="progress-grid" d="M20 35H400M20 85H400M20 135H400M75 15V165M165 15V165M255 15V165M345 15V165" />
          <path class="progress-area" d="M25 146C82 146 99 116 143 116S208 83 251 83S310 40 387 27V165H25Z" />
          <path class="progress-line" d="M25 146C82 146 99 116 143 116S208 83 251 83S310 40 387 27" />
          <g class="progress-node"><circle cx="143" cy="116" r="5"/><circle cx="251" cy="83" r="5"/><circle cx="387" cy="27" r="6"/></g>
          <circle class="progress-halo" cx="387" cy="27" r="15" />
        </svg>
        <span class="access-signature">申论 · 面试 · AI 评练</span>
      </section>
      <section class="access-card" :aria-label="title">
        <div v-if="mode !== 'reset'" class="access-tabs"><router-link to="/login" :class="{ selected: mode === 'login' }">登录</router-link><router-link to="/register" :class="{ selected: mode === 'register' }">注册</router-link></div>
        <router-link v-else to="/login" class="access-back">← 返回登录</router-link>
        <div class="access-heading"><h2>{{ title }}</h2><p>{{ subtitle }}</p></div>
        <form class="access-form" @submit.prevent="submit">
          <label v-if="mode === 'login'" class="access-field"><span>手机号 / 原有账号</span><input v-model="account" autocomplete="username" placeholder="手机号、用户名或邮箱" :disabled="loading" required maxlength="100"></label>
          <label v-else class="access-field"><span>手机号</span><div class="phone-input"><b>+86</b><input v-model="phone" type="tel" autocomplete="tel-national" inputmode="tel" placeholder="请输入手机号" maxlength="11" :disabled="loading" required></div></label>
          <div v-if="mode !== 'login'" class="access-field"><span>短信验证码</span><SmsCodeField v-model="code" :phone="phone" :purpose="mode === 'register' ? 'register' : 'reset'" :disabled="loading" /></div>
          <label class="access-field"><span>{{ mode === 'reset' ? '新密码' : '密码' }}</span><div class="password-input"><input v-model="password" :type="showPassword ? 'text' : 'password'" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" :placeholder="mode === 'login' ? '请输入密码' : '设置8–64位密码'" :disabled="loading" :minlength="mode === 'login' ? 1 : 8" :maxlength="mode === 'login' ? 255 : 64" required><button type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword"><el-icon><Hide v-if="showPassword" /><View v-else /></el-icon></button></div></label>
          <label v-if="mode === 'reset'" class="access-field"><span>确认新密码</span><input v-model="confirmPassword" type="password" autocomplete="new-password" placeholder="再次输入新密码" :disabled="loading" required maxlength="64"></label>
          <router-link v-if="mode === 'login'" to="/reset-password" class="access-forgot">忘记密码？</router-link>
          <p v-if="errorMessage" class="access-error" role="alert">{{ errorMessage }}</p>
          <button type="submit" class="access-submit" :disabled="loading">{{ loading ? '请稍候…' : mode === 'login' ? '登录' : mode === 'register' ? '创建账号' : '验证并重置密码' }}<el-icon><ArrowRight /></el-icon></button>
        </form>
        <p class="access-bottom">{{ mode === 'login' ? '专注练习，让实力被看见。' : mode === 'register' ? '已有账号？' : '验证码仅用于确认你的身份。' }} <router-link v-if="mode === 'register'" to="/login">去登录</router-link></p>
      </section>
    </div>
    <footer class="access-footer"><span>POLICYQUEST © {{ new Date().getFullYear() }}</span><span>AI 公考学习空间</span></footer>
  </main>
</template>

<style scoped>
.access-page {
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text-primary);
}
.access-nav {
  height: 72px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 max(24px, calc((100vw - 1280px) / 2));
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.access-brand { display: flex; align-items: center; gap: 10px; color: #1d3555; }
.access-logo { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #2d7dff, var(--primary-light)); color: white; font-size: 13px; font-weight: 900; }
.access-brand strong { font-size: 19px; font-weight: 900; }
.access-home { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-muted); }
.access-content { display: grid; grid-template-columns: minmax(0, 1fr) 430px; align-items: center; gap: 100px; width: min(1080px, calc(100% - 48px)); margin: auto; padding: 64px 0; }
.access-hero { min-width: 0; }
.access-eyebrow { display: flex; align-items: center; gap: 9px; font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 24px; }
.access-eyebrow i { width: 7px; height: 7px; border-radius: 50%; background: var(--primary-light); box-shadow: 0 0 0 5px rgba(0, 102, 255, .06); }
.access-hero h1 { margin: 0; font-size: clamp(42px, 4.1vw, 56px); line-height: 1.4; letter-spacing: -1.5px; font-weight: 800; }
.access-hero h1 span { color: var(--primary-light); }
.access-hero > p { margin: 22px 0 0; color: var(--text-muted); font-size: 15px; line-height: 1.8; }
.access-progress { display: block; width: min(420px, 100%); height: auto; margin-top: 48px; overflow: visible; }
.progress-grid { stroke: var(--border); stroke-width: .7; stroke-dasharray: 3 7; opacity: .7; }
.progress-area { fill: var(--primary-light); opacity: .035; }
.progress-line { stroke: var(--primary-light); stroke-width: 2.5; stroke-linecap: round; }
.progress-node { fill: var(--surface); stroke: var(--primary-light); stroke-width: 2; }
.progress-halo { stroke: var(--primary-light); opacity: .12; stroke-width: 8; }
.access-signature { display: block; margin-top: 22px; color: var(--text-muted); font-size: 12px; letter-spacing: 2px; }
.access-card { padding: 34px 38px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); }
.access-tabs { display: flex; gap: 4px; padding: 4px; margin-bottom: 32px; background: var(--surface-muted); border-radius: var(--radius-md); }
.access-tabs a { flex: 1; padding: 10px; border-radius: var(--radius-sm); text-align: center; font-size: 14px; font-weight: 700; color: var(--text-muted); }
.access-tabs a.selected { color: var(--primary); background: var(--surface); box-shadow: 0 2px 6px rgba(19, 42, 74, .06); }
.access-heading { margin-bottom: 28px; }
.access-heading h2 { margin: 0 0 9px; font-size: 27px; font-weight: 800; letter-spacing: -.5px; }
.access-heading p { margin: 0; font-size: 13px; line-height: 1.8; color: var(--text-muted); }
.access-form { display: flex; flex-direction: column; gap: 19px; }
.access-field { display: flex; flex-direction: column; gap: 9px; }
.access-field > span { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.access-field input { min-width: 0; width: 100%; padding: 15px 16px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-soft); color: var(--text-primary); font-size: 14px; line-height: 22px; outline: none; transition: border-color .2s; }
.access-field input::placeholder { color: #929db0; }
.access-field input:focus { border-color: var(--primary-light); box-shadow: 0 0 0 3px rgba(0, 102, 255, .08); }
.phone-input, .password-input { display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-soft); }
.phone-input:focus-within, .password-input:focus-within { border-color: var(--primary-light); box-shadow: 0 0 0 3px rgba(0, 102, 255, .08); }
.phone-input input, .password-input input { border: 0; background: transparent; box-shadow: none !important; }
.phone-input b { padding: 0 13px 0 16px; font-size: 13px; font-weight: 500; color: var(--text-muted); border-right: 1px solid var(--border); }
.password-input button { display: flex; padding: 4px; margin-right: 15px; border: 0; background: none; color: var(--text-muted); }
.access-forgot { align-self: flex-end; margin-top: -7px; color: var(--primary); font-size: 12px; }
.access-submit { display: flex; align-items: center; justify-content: center; gap: 14px; min-height: 53px; margin-top: 5px; padding: 14px 20px; border: 0; border-radius: var(--radius-md); background: var(--primary-light); color: white; font-size: 14px; font-weight: 700; box-shadow: 0 8px 20px rgba(0, 102, 255, .12); transition: background .2s; }
.access-submit:hover { background: var(--primary); }
.access-submit:disabled { opacity: .6; cursor: wait; }
.access-page :is(button, a):focus-visible { outline: 2px solid var(--primary-light); outline-offset: 4px; }
.access-bottom { margin: 25px 0 0; color: var(--text-muted); text-align: center; font-size: 12px; line-height: 1.8; }
.access-bottom a { margin-left: 5px; color: var(--primary); }
.access-error { margin: 0; padding: 10px 12px; border-radius: var(--radius-sm); color: var(--danger); background: var(--accent-soft); font-size: 12px; line-height: 1.7; }
.access-back { display: inline-block; margin-bottom: 28px; color: var(--primary); font-size: 12px; }
.access-footer { display: flex; justify-content: space-between; gap: 15px; width: min(1280px, calc(100% - 48px)); margin: 0 auto; padding: 24px 0; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 10px; letter-spacing: .8px; }
@media (max-width: 1000px) {
  .access-content { grid-template-columns: minmax(0, 1fr) 390px; gap: 45px; }
  .access-card { padding: 30px; }
  .access-hero h1 { font-size: 40px; }
}
@media (max-width: 760px) {
  .access-content { display: block; width: min(420px, calc(100% - 40px)); padding: 40px 0; }
  .access-hero { display: none; }
  .access-card { padding: 28px 24px; }
  .access-nav { padding: 0 20px; height: 68px; }
  .access-brand strong { font-size: 19px; }
  .access-logo { width: 36px; height: 36px; }
  .access-home { font-size: 12px; gap: 5px; }
  .access-heading h2 { font-size: 26px; }
  .access-footer { width: calc(100% - 40px); font-size: 9px; letter-spacing: .3px; }
}
@media (prefers-reduced-motion: reduce) { .access-page * { transition: none !important; } }
</style>
