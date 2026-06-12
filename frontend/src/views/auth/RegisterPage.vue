<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPw: '',
  nickname: '',
  exam_target: '申论',
  province: '山东',
})
const loading = ref(false)

const redirectTarget = computed(() => String(route.query.redirect || '/coach'))
const examOptions = ['申论', '面试', '申论 + 面试', '国考申论', '山东省考面试']
const provinceOptions = ['全国', '北京', '上海', '广东', '浙江', '山东', '江苏', '四川', '湖北', '河南']

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function handleRegister() {
  const username = form.value.username.trim()
  const email = form.value.email.trim()

  if (!username || !email || !form.value.password) {
    ElMessage.warning('请填写用户名、邮箱和密码')
    return
  }
  if (username.length < 3 || username.length > 24) {
    ElMessage.warning('用户名需为 3-24 个字符')
    return
  }
  if (!isValidEmail(email)) {
    ElMessage.warning('请输入有效邮箱')
    return
  }
  if (form.value.password.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  if (form.value.password !== form.value.confirmPw) {
    ElMessage.warning('两次密码不一致')
    return
  }

  loading.value = true
  try {
    await userStore.register({ ...form.value, username, email })
    ElMessage.success('备考档案已创建')
    router.push(redirectTarget.value)
  } catch (error: any) {
    ElMessage.error(error.message || '注册失败，请稍后重试')
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
            <small>AI 公考学习引擎</small>
          </span>
        </router-link>

        <div class="story-copy">
          <p class="page-kicker">Create Study Profile</p>
          <h1>先建立备考档案，再进入 AI 学习指挥舱</h1>
          <p>选择备考方向和地区后，系统会围绕你的训练记录沉淀评分、薄弱项和下一步建议。</p>
        </div>

        <div class="story-flow">
          <span><CircleCheck /> 方向定位</span>
          <span><CircleCheck /> 真题训练</span>
          <span><CircleCheck /> AI 阅卷</span>
          <span><CircleCheck /> 行动建议</span>
        </div>
      </aside>

      <section class="auth-card glass-card">
        <div class="auth-header">
          <p class="page-kicker">Register</p>
          <h2>注册 PolicyQuest</h2>
          <p>创建账号后自动进入工作台，后续训练记录会保存在你的备考档案中。</p>
        </div>

        <form class="auth-form" @submit.prevent="handleRegister">
          <div class="form-row">
            <label class="form-group">
              <span>用户名 *</span>
              <input v-model="form.username" class="form-control" placeholder="3-24 个字符" autocomplete="username" />
            </label>
            <label class="form-group">
              <span>昵称</span>
              <input v-model="form.nickname" class="form-control" placeholder="例如：张同学" />
            </label>
          </div>

          <label class="form-group">
            <span>邮箱 *</span>
            <input v-model="form.email" class="form-control" type="email" placeholder="用于登录账号" autocomplete="email" />
          </label>

          <div class="form-row">
            <label class="form-group">
              <span>密码 *</span>
              <input v-model="form.password" class="form-control" type="password" placeholder="至少 6 位" autocomplete="new-password" />
            </label>
            <label class="form-group">
              <span>确认密码 *</span>
              <input v-model="form.confirmPw" class="form-control" type="password" placeholder="再次输入" autocomplete="new-password" />
            </label>
          </div>

          <div class="form-row">
            <label class="form-group">
              <span>备考方向</span>
              <select v-model="form.exam_target" class="form-control">
                <option v-for="item in examOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <label class="form-group">
              <span>所在地区</span>
              <select v-model="form.province" class="form-control">
                <option v-for="item in provinceOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
          </div>

          <button class="btn-primary submit-btn" type="submit" :disabled="loading">
            {{ loading ? '创建中...' : '创建账号并进入学习中心' }}
          </button>
        </form>

        <div class="auth-footer">
          <span>已有账号？</span>
          <router-link to="/login">去登录</router-link>
          <span class="divider">|</span>
          <router-link to="/">返回产品主页</router-link>
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
    linear-gradient(90deg, rgba(0, 184, 217, 0.06) 1px, transparent 1px),
    linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
  background-size: 46px 46px, auto;
}

.auth-shell {
  display: grid;
  grid-template-columns: minmax(360px, 0.86fr) minmax(440px, 560px);
  gap: 24px;
  width: min(1160px, 100%);
}

.auth-story,
.auth-card {
  min-height: 680px;
}

.auth-story {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 34px;
  border: 1px solid rgba(123, 189, 255, 0.38);
  border-radius: 24px;
  background: linear-gradient(145deg, #003b88, #0050cb 48%, #008faf);
  color: #ffffff;
  box-shadow: 0 28px 70px rgba(0, 80, 203, 0.2);
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
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  font-weight: 900;
}

.brand strong,
.brand small {
  display: block;
}

.brand small {
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
}

.story-copy .page-kicker {
  color: #bdf6ff;
}

.story-copy h1 {
  margin: 0;
  font-size: 42px;
  line-height: 1.16;
}

.story-copy p:last-child {
  max-width: 520px;
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 16px;
  line-height: 1.75;
}

.story-flow {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.story-flow span {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: 0 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.13);
  font-weight: 900;
}

.auth-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 44px;
  border-radius: 24px;
}

.auth-header {
  margin-bottom: 24px;
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
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
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

.form-control {
  appearance: none;
}

.submit-btn {
  width: 100%;
  min-height: 50px;
  margin-top: 4px;
}

.auth-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 22px;
  color: var(--text-muted);
  font-size: 14px;
}

.auth-footer a {
  font-weight: 800;
}

.divider {
  color: var(--border-strong);
}

@media (max-width: 960px) {
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

@media (max-width: 620px) {
  .auth-page {
    padding: 0;
  }

  .auth-shell {
    gap: 0;
  }

  .auth-story {
    min-height: 320px;
    border-radius: 0 0 22px 22px;
    padding: 24px 20px;
  }

  .story-copy h1 {
    font-size: 32px;
  }

  .story-flow,
  .form-row {
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
