<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '../api'
import { useUserStore } from '../store/user'
import SmsCodeField from './SmsCodeField.vue'
const store = useUserStore()
const open = ref(false), loading = ref(false)
const phone = ref(''), password = ref(''), code = ref('')
async function bind() {
  if (loading.value) return
  loading.value = true
  try {
    await authApi.bindPhone({ phone: phone.value.trim(), password: password.value, code: code.value })
    await store.fetchProfile()
    password.value = ''; code.value = ''; open.value = false
    ElMessage.success('手机号绑定成功')
  } catch (error: any) { ElMessage.error(error.message || '绑定失败，请重试') }
  finally { loading.value = false }
}
</script>
<template>
  <section class="phone-security">
    <div class="security-heading"><div><h3>账号安全</h3><p>{{ store.user?.phone ? `已绑定手机 ${store.user.phone.slice(0, 3)}****${store.user.phone.slice(-4)}` : '绑定手机号后，可通过验证码找回密码。' }}</p></div><router-link v-if="store.user?.phone" to="/reset-password">修改密码 →</router-link><button v-else type="button" @click="open = !open">{{ open ? '收起' : '绑定手机号' }}</button></div>
    <form v-if="open && !store.user?.phone" class="bind-form" @submit.prevent="bind">
      <label>手机号<input v-model="phone" type="tel" autocomplete="tel-national" placeholder="请输入手机号" maxlength="11" :disabled="loading" required></label>
      <label>当前账号密码<input v-model="password" type="password" autocomplete="current-password" placeholder="用于确认当前账号身份" :disabled="loading" required></label>
      <div><span class="code-label">短信验证码</span><SmsCodeField v-model="code" :phone="phone" :password="password" purpose="bind" :disabled="loading" /></div>
      <button class="bind-submit" type="submit" :disabled="loading">{{ loading ? '绑定中…' : '验证并绑定' }}</button>
    </form>
  </section>
</template>
<style scoped>
.phone-security{margin-top:26px;padding-top:24px;border-top:1px solid var(--border)}.security-heading{display:flex;align-items:center;justify-content:space-between;gap:15px}.security-heading h3{margin:0 0 8px;font-size:16px}.security-heading p{margin:0;color:var(--text-muted);font-size:13px;line-height:1.7}.security-heading a,.security-heading button{font:inherit;font-size:13px;color:var(--primary);background:none;border:0;white-space:nowrap;cursor:pointer}.bind-form{margin-top:22px;max-width:440px;display:grid;gap:16px}.bind-form label{display:grid;gap:8px;color:var(--text-secondary);font-size:13px}.bind-form input{padding:14px;border:1px solid var(--border);border-radius:10px;font:inherit;background:var(--surface-soft)}.code-label{display:block;margin-bottom:8px;color:var(--text-secondary);font-size:13px}.bind-submit{padding:14px;border:0;border-radius:10px;background:var(--primary-light);color:white;font:inherit;cursor:pointer}.bind-submit:disabled{opacity:.5}
</style>
