<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '../api'
const props = defineProps<{ modelValue: string; phone: string; purpose: 'register' | 'reset' | 'bind'; password?: string; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const sending = ref(false)
const remaining = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
async function send() {
  if (sending.value || remaining.value) return
  const phone = props.phone.trim()
  if (!/^1[3-9]\d{9}$/.test(phone)) return ElMessage.warning('请输入有效的中国大陆手机号')
  if (props.purpose === 'bind' && !props.password) return ElMessage.warning('请先输入当前账号密码')
  sending.value = true
  try {
    const res: any = props.purpose === 'bind'
      ? await authApi.bindPhoneCode({ phone, password: props.password || '' })
      : await authApi.sendCode({ phone, purpose: props.purpose })
    const deadline = Date.now() + (res.data.cooldownSeconds || 60) * 1000
    remaining.value = Math.ceil((deadline - Date.now()) / 1000)
    clearInterval(timer)
    timer = setInterval(() => { remaining.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); if (!remaining.value) clearInterval(timer) }, 1000)
    ElMessage.success(res.message || '验证码已发送')
  } catch (error: any) { ElMessage.error(error.message || '发送失败，请稍后重试') }
  finally { sending.value = false }
}
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="sms-field">
    <input :value="modelValue" aria-label="短信验证码" :disabled="disabled" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="6位短信验证码" required @input="emit('update:modelValue', ($event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6))">
    <button type="button" :disabled="sending || remaining > 0 || disabled" @click="send">{{ sending ? '发送中…' : remaining ? `${remaining}s 后重发` : '获取验证码' }}</button>
  </div>
</template>
<style scoped>
.sms-field{display:flex;align-items:center;border:1px solid var(--border);border-radius:12px;background:var(--surface-soft);min-height:54px;transition:border-color .2s}.sms-field:focus-within{border-color:var(--primary-light);box-shadow:0 0 0 3px rgba(0,102,255,.08)}.sms-field input{border:0!important;background:transparent!important;box-shadow:none!important;outline:none!important;min-width:0;flex:1;width:100%;padding:15px 16px;font:inherit;color:var(--text-primary)}.sms-field button{flex-shrink:0;border:0;border-left:1px solid var(--border);background:none;padding:0 15px;font:inherit;font-size:13px;font-weight:600;color:var(--primary);cursor:pointer;white-space:nowrap}.sms-field button:disabled{color:var(--text-muted);cursor:default}.sms-field button:focus-visible{outline:2px solid var(--primary-light);outline-offset:3px}
</style>
