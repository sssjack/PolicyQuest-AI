<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../store/user'

const router = useRouter()
const userStore = useUserStore()
const form = ref({ username: '', email: '', password: '', confirmPw: '', nickname: '', exam_target: '', province: '' })
const loading = ref(false)

const examOptions = ['历年国考', '地方省考', '事业编', '申论', '面试']
const provinceOptions = ['全国', '北京', '上海', '广东', '浙江', '山东', '江苏', '四川', '湖北', '河南']

async function handleRegister() {
  if (!form.value.username || !form.value.email || !form.value.password) {
    ElMessage.warning('请填写用户名、邮箱和密码')
    return
  }
  if (form.value.password !== form.value.confirmPw) {
    ElMessage.warning('两次密码不一致')
    return
  }
  if (form.value.password.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }

  loading.value = true
  try {
    await userStore.register(form.value)
    ElMessage.success('注册成功')
    router.push('/')
  } catch (e: any) {
    ElMessage.error(e.message || '注册失败')
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
          <p class="page-kicker">Create Study Profile</p>
          <h1>建立你的公考能力档案</h1>
          <p>填写备考方向后，系统会围绕国考、省考、事业编的申论与面试训练沉淀你的评阅记录。</p>
        </div>

        <div class="story-flow">
          <span>方向定位</span>
          <span>真题选择</span>
          <span>AI 评阅</span>
          <span>示范改写</span>
        </div>
      </aside>

      <section class="auth-card glass-card">
        <div class="auth-header">
          <p class="page-kicker">Register</p>
          <h2>注册 PolicyQuest</h2>
          <p>创建账号后即可进入 AI Exam Coach，开始第一次申论或面试评阅。</p>
        </div>

        <form class="auth-form" @submit.prevent="handleRegister">
          <div class="form-row">
            <label class="form-group">
              <span>用户名 *</span>
              <input v-model="form.username" class="form-control" placeholder="请输入用户名" autocomplete="username" />
            </label>
            <label class="form-group">
              <span>昵称</span>
              <input v-model="form.nickname" class="form-control" placeholder="显示名称" />
            </label>
          </div>

          <label class="form-group">
            <span>邮箱 *</span>
            <input v-model="form.email" class="form-control" type="email" placeholder="请输入邮箱" autocomplete="email" />
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
                <option value="">请选择</option>
                <option v-for="item in examOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <label class="form-group">
              <span>所在地区</span>
              <select v-model="form.province" class="form-control">
                <option value="">请选择</option>
                <option v-for="item in provinceOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
          </div>

          <button class="btn-primary submit-btn" type="submit" :disabled="loading">
            {{ loading ? '注册中...' : '创建账号并进入 AI Coach' }}
          </button>
        </form>

        <div class="auth-footer">
          <span>已有账号？</span>
          <router-link to="/login">去登录</router-link>
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
    radial-gradient(circle at 16% 14%, rgba(0, 102, 255, 0.14), transparent 30%),
    radial-gradient(circle at 84% 78%, rgba(216, 41, 76, 0.09), transparent 30%),
    linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
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

.story-copy .page-kicker {
  color: #bff8ef;
}

.story-copy h1 {
  margin: 0;
  font-size: 42px;
  line-height: 1.16;
}

.story-copy p:last-child {
  max-width: 520px;
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 16px;
  line-height: 1.75;
}

.story-flow {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.story-flow span {
  display: grid;
  min-height: 56px;
  place-items: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.13);
  color: #ffffff;
  font-size: 14px;
  font-weight: 900;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
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
    min-height: 310px;
    border-radius: 0 0 24px 24px;
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
