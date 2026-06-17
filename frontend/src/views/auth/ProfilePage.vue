<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Camera, Check, Link, Message, User, UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const avatarFileInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)

const form = ref({
  nickname: '',
  email: '',
  avatar: '',
  exam_target: '',
  province: '',
})

const userInitial = computed(() => (form.value.nickname || userStore.user?.username || 'U').slice(0, 1).toUpperCase())
const roleLabel = computed(() => userStore.user?.role === 'admin' || userStore.user?.role === 'super_admin' ? '管理员' : '备考学员')
const coachTarget = computed(() => ({
  path: '/coach',
  query: route.query.preview === '1' ? { preview: '1' } : {},
}))

const infoRows = computed(() => [
  { label: '用户名', value: userStore.user?.username || '未设置' },
  { label: '账号角色', value: roleLabel.value },
  { label: '绑定邮箱', value: form.value.email || '未绑定' },
  { label: '备考方向', value: form.value.exam_target || '未设置' },
  { label: '地区', value: form.value.province || '未设置' },
])

watch(
  () => userStore.user,
  user => {
    form.value = {
      nickname: user?.nickname || user?.username || '',
      email: user?.email || '',
      avatar: user?.avatar || '',
      exam_target: user?.exam_target || '',
      province: user?.province || '',
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (localStorage.getItem('pq_token')) {
    userStore.fetchProfile().catch(() => undefined)
  }
})

function triggerAvatarPick() {
  avatarFileInput.value?.click()
}

function handleAvatarFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    input.value = ''
    return
  }
  if (file.size > 900 * 1024) {
    ElMessage.warning('头像图片请控制在 900KB 以内')
    input.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    form.value.avatar = String(reader.result || '')
    input.value = ''
  }
  reader.readAsDataURL(file)
}

function clearAvatar() {
  form.value.avatar = ''
}

async function saveProfile() {
  const nickname = form.value.nickname.trim()
  const email = form.value.email.trim().toLowerCase()

  if (!nickname) {
    ElMessage.warning('请填写昵称')
    return
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning('请输入有效邮箱')
    return
  }

  saving.value = true
  try {
    await userStore.updateProfile({
      nickname,
      email,
      avatar: form.value.avatar.trim(),
      exam_target: form.value.exam_target.trim(),
      province: form.value.province.trim(),
    })
    ElMessage.success('个人信息已更新')
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="profile-shell-page">
    <header class="profile-nav">
      <router-link class="brand-link" :to="coachTarget" aria-label="返回学习中心">
        <span class="brand-mark">PQ</span>
        <span>
          <strong>PolicyQuest</strong>
          <small>个人中心</small>
        </span>
      </router-link>

      <button class="return-button" type="button" @click="router.push(coachTarget)">
        <el-icon><ArrowLeft /></el-icon>
        返回学习中心
      </button>
    </header>

    <section class="profile-hero">
      <div>
        <p>PROFILE</p>
        <h1>管理个人信息</h1>
        <span>维护头像、昵称、邮箱和备考目标，让学习中心按你的真实资料继续优化。</span>
      </div>

      <div class="hero-avatar">
        <img v-if="form.avatar" :src="form.avatar" alt="当前头像" />
        <strong v-else>{{ userInitial }}</strong>
      </div>
    </section>

    <section class="profile-content">
      <article class="avatar-panel">
        <div class="avatar-preview">
          <img v-if="form.avatar" :src="form.avatar" alt="头像预览" />
          <strong v-else>{{ userInitial }}</strong>
        </div>

        <h2>{{ form.nickname || userStore.user?.username || '考生' }}</h2>
        <p>{{ form.exam_target || '尚未设置备考方向' }}</p>

        <div class="avatar-actions">
          <button class="primary-action" type="button" @click="triggerAvatarPick">
            <el-icon><Camera /></el-icon>
            更换头像
          </button>
          <button class="plain-action" type="button" @click="clearAvatar">移除头像</button>
        </div>

        <label class="avatar-url">
          <span>头像链接</span>
          <input v-model="form.avatar" type="url" placeholder="也可以粘贴图片 URL" />
        </label>

        <input ref="avatarFileInput" class="file-input" type="file" accept="image/*" @change="handleAvatarFile" />
      </article>

      <article class="profile-form">
        <header>
          <div>
            <p>ACCOUNT</p>
            <h2>账号资料</h2>
          </div>
          <button class="save-button" type="button" :disabled="saving" @click="saveProfile">
            <el-icon><Check /></el-icon>
            {{ saving ? '保存中' : '保存修改' }}
          </button>
        </header>

        <div class="form-grid">
          <label>
            <span><el-icon><User /></el-icon>昵称</span>
            <input v-model="form.nickname" type="text" maxlength="30" placeholder="请输入昵称" />
          </label>

          <label>
            <span><el-icon><Message /></el-icon>绑定邮箱</span>
            <input v-model="form.email" type="email" placeholder="name@example.com" />
          </label>

          <label>
            <span><el-icon><UserFilled /></el-icon>备考方向</span>
            <input v-model="form.exam_target" type="text" maxlength="40" placeholder="例如：国考申论、事业编面试" />
          </label>

          <label>
            <span><el-icon><Link /></el-icon>地区</span>
            <input v-model="form.province" type="text" maxlength="30" placeholder="例如：山东、浙江、广州" />
          </label>
        </div>

        <section class="info-list" aria-label="账号信息概览">
          <div v-for="row in infoRows" :key="row.label">
            <span>{{ row.label }}</span>
            <strong>{{ row.value }}</strong>
          </div>
        </section>
      </article>
    </section>
  </main>
</template>

<style scoped>
.profile-shell-page {
  min-height: 100vh;
  padding: 0 24px 56px;
  background:
    linear-gradient(90deg, rgba(57, 123, 246, 0.055) 1px, transparent 1px),
    linear-gradient(180deg, #f7fbff 0%, #ffffff 46%, #f4f8ff 100%);
  background-size: 46px 46px, auto;
  color: #182439;
}

.profile-nav,
.profile-hero,
.profile-content {
  width: min(1180px, calc(100vw - 48px));
  margin: 0 auto;
}

.profile-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
  gap: 18px;
}

.brand-link,
.return-button,
.primary-action,
.plain-action,
.save-button,
.form-grid label span {
  display: inline-flex;
  align-items: center;
}

.brand-link {
  gap: 12px;
  color: #12213a;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2d7dff, #0066ff);
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(0, 80, 203, 0.18);
}

.brand-link strong,
.brand-link small {
  display: block;
}

.brand-link strong {
  font-size: 18px;
  font-weight: 900;
}

.brand-link small {
  margin-top: 2px;
  color: #738198;
  font-size: 12px;
  font-weight: 800;
}

.return-button,
.save-button,
.primary-action,
.plain-action {
  min-height: 42px;
  gap: 8px;
  border-radius: 10px;
  font-weight: 900;
}

.return-button,
.plain-action {
  border: 1px solid #d8e2f2;
  background: #ffffff;
  color: #334155;
}

.save-button,
.primary-action {
  border: 0;
  background: linear-gradient(135deg, #0d63ff, #08acd2);
  color: #ffffff;
  box-shadow: 0 14px 32px rgba(13, 99, 255, 0.18);
}

.return-button {
  padding: 0 16px;
}

.save-button {
  padding: 0 18px;
}

.primary-action,
.plain-action {
  justify-content: center;
  padding: 0 16px;
}

.profile-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 28px;
  align-items: center;
  min-height: 206px;
  margin-top: 18px;
  padding: 34px 40px;
  border: 1px solid rgba(207, 217, 232, 0.86);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 20px 54px rgba(17, 36, 68, 0.08);
}

.profile-hero p,
.profile-form header p {
  margin: 0 0 10px;
  color: #0d63ff;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.profile-hero h1,
.profile-form h2,
.avatar-panel h2 {
  margin: 0;
  color: #102033;
  font-weight: 900;
}

.profile-hero h1 {
  font-size: 36px;
  line-height: 1.2;
}

.profile-hero span {
  display: block;
  max-width: 720px;
  margin-top: 14px;
  color: #536176;
  line-height: 1.75;
}

.hero-avatar,
.avatar-preview {
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(135deg, #006a61, #0d9488);
  color: #ffffff;
  font-weight: 900;
}

.hero-avatar {
  width: 128px;
  height: 128px;
  font-size: 42px;
}

.avatar-preview {
  width: 116px;
  height: 116px;
  font-size: 40px;
}

.hero-avatar img,
.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-content {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 18px;
  margin-top: 18px;
}

.avatar-panel,
.profile-form {
  border: 1px solid rgba(207, 217, 232, 0.86);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 44px rgba(17, 36, 68, 0.06);
}

.avatar-panel {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 14px;
  padding: 34px 28px;
  text-align: center;
}

.avatar-panel h2 {
  font-size: 25px;
}

.avatar-panel p {
  margin: 0;
  color: #7a8798;
  font-weight: 800;
}

.avatar-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
  margin-top: 10px;
}

.avatar-url {
  display: grid;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
  text-align: left;
}

.avatar-url span,
.form-grid label > span {
  color: #64748b;
  font-size: 13px;
  font-weight: 900;
}

.avatar-url input,
.form-grid input {
  width: 100%;
  min-height: 46px;
  border: 1px solid #d8e2f2;
  border-radius: 10px;
  outline: none;
  background: #fbfdff;
  color: #182439;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.avatar-url input {
  padding: 0 12px;
}

.form-grid input {
  padding: 0 14px;
}

.avatar-url input:focus,
.form-grid input:focus {
  border-color: rgba(13, 99, 255, 0.48);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(13, 99, 255, 0.08);
}

.file-input {
  display: none;
}

.profile-form {
  padding: 28px;
}

.profile-form header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 22px;
  border-bottom: 1px solid #e8eef7;
}

.profile-form h2 {
  font-size: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.form-grid label {
  display: grid;
  gap: 9px;
}

.form-grid label span {
  gap: 7px;
}

.info-list {
  display: grid;
  margin-top: 28px;
  border-top: 1px solid #e8eef7;
}

.info-list div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 56px;
  border-bottom: 1px solid #e8eef7;
}

.info-list span {
  color: #64748b;
  font-weight: 800;
}

.info-list strong {
  color: #182439;
  text-align: right;
}

@media (max-width: 900px) {
  .profile-content,
  .profile-hero {
    grid-template-columns: 1fr;
  }

  .hero-avatar {
    justify-self: start;
  }
}

@media (max-width: 680px) {
  .profile-shell-page {
    padding: 0 14px 34px;
  }

  .profile-nav,
  .profile-hero,
  .profile-content {
    width: 100%;
  }

  .profile-nav {
    align-items: stretch;
    flex-direction: column;
    padding: 16px 0;
  }

  .return-button {
    justify-content: center;
  }

  .profile-hero,
  .avatar-panel,
  .profile-form {
    padding: 24px;
  }

  .profile-hero h1 {
    font-size: 30px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .avatar-actions {
    grid-template-columns: 1fr;
  }
}
</style>
