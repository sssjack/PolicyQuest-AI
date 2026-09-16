<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Bell, ChatDotRound, Document, Guide, SwitchButton, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { accountApi } from '../api'
import { useUserStore } from '../store/user'
import NotificationDetail from './NotificationDetail.vue'
import { orderNotice, type AccountNotice } from '../data/notifications'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const notices = ref<any[]>([])
const unread = ref(0)
const loading = ref(false)
const selectedNotice = ref<AccountNotice | null>(null)
const noticePanelOpen = ref(false)

const userName = computed(() => userStore.user?.nickname || userStore.user?.username || '考生')
const initial = computed(() => userName.value.slice(0, 1).toUpperCase())

function target(path: string) {
  return import.meta.env.DEV && route.query.preview === '1' ? { path, query: { preview: '1' } } : path
}

async function loadNotifications() {
  if (!userStore.isLoggedIn) return
  loading.value = true
  try {
    const res: any = await accountApi.notifications({ pageSize: 6 })
    notices.value = res.data.list
    unread.value = res.data.unread
  } catch {
    notices.value = []
  } finally { loading.value = false }
}

async function readNotice(item: AccountNotice) {
  selectedNotice.value = item
  noticePanelOpen.value = false
  if (item.id && !item.read) {
    try { await accountApi.readNotification(item.id); item.read = true; unread.value = Math.max(unread.value - 1, 0) }
    catch (error: any) { ElMessage.error(error?.message || '更新已读状态失败') }
  }
}

async function readAll() {
  try {
    await accountApi.readAllNotifications()
    notices.value.forEach(item => { item.read = true })
    unread.value = 0
  } catch (error: any) { ElMessage.error(error?.message || '全部已读操作失败') }
}

function handleCommand(command: string) {
  if (command === 'logout') {
    userStore.logout()
    router.push('/')
    return
  }
  const paths: Record<string, string> = {
    orders: '/account/orders',
    profile: '/account/profile',
    feedback: '/account/feedback',
    guide: '/account/guide',
  }
  if (paths[command]) router.push(target(paths[command]))
}

function refreshCredits() { if (userStore.isLoggedIn) void userStore.fetchProfile().catch(() => undefined) }
watch(() => route.fullPath, refreshCredits)
onMounted(() => { loadNotifications(); refreshCredits(); window.addEventListener('focus', refreshCredits) })
onBeforeUnmount(() => window.removeEventListener('focus', refreshCredits))
</script>

<template>
  <div v-if="userStore.isLoggedIn" class="account-actions">
    <el-tooltip :content="`每套真题 ${userStore.user?.paperCost ?? 10} 积分；当前可提交 ${userStore.user?.remainingPapers ?? '—'} 套。后台可调整积分。`" placement="bottom-end">
      <div class="credit-balance" aria-live="polite"><span>剩余积分</span><b>{{ userStore.user?.credits ?? '—' }}</b></div>
    </el-tooltip>
    <el-popover v-model:visible="noticePanelOpen" placement="bottom-end" :width="370" trigger="click" popper-class="pq-notice-popover" @show="loadNotifications">
      <template #reference><button class="notice-button" type="button" aria-label="消息通知"><el-icon><Bell /></el-icon><i v-if="unread > 0" class="unread-dot">{{ unread > 99 ? '99+' : unread }}</i></button></template>
      <div class="notice-panel"><header><div><b>消息通知</b><small>{{ unread ? `${unread} 条未读` : '暂无未读消息' }}</small></div><button v-if="unread" type="button" @click="readAll">全部已读</button></header><div v-if="loading" class="notice-empty">正在加载…</div><div v-else-if="!notices.length" class="notice-empty">暂无通知公告</div><button v-for="item in notices" v-else :key="item.id" class="notice-item" :class="{ unread: !item.read }" type="button" @click="readNotice(item)"><i></i><span><b>{{ item.title }}</b><small>{{ item.content }}</small></span></button><button class="notice-item deferred" type="button" @click="readNotice(orderNotice)"><i></i><span><b>订单状态 <em>2.0</em></b><small>订单进度与支付状态将在 2.0 版本接入。</small></span></button><footer><button type="button" @click="router.push(target('/account/notifications'))">查看全部通知</button></footer></div>
    </el-popover>
    <NotificationDetail :notice="selectedNotice" @close="selectedNotice = null" />
    <el-dropdown trigger="click" placement="bottom-end" @command="handleCommand">
      <button class="avatar-trigger" type="button" :aria-label="`${userName}的账户菜单`"><img v-if="userStore.user?.avatar" :src="userStore.user.avatar" alt=""><span v-else>{{ initial }}</span><el-icon><ArrowDown /></el-icon></button>
      <template #dropdown><el-dropdown-menu><div class="dropdown-user"><b>{{ userName }}</b><small>{{ userStore.user?.email || '备考学员' }}</small></div><el-dropdown-item command="orders"><el-icon><Document /></el-icon>订单管理 <em>2.0</em></el-dropdown-item><el-dropdown-item command="profile"><el-icon><User /></el-icon>个人信息</el-dropdown-item><el-dropdown-item command="feedback"><el-icon><ChatDotRound /></el-icon>反馈和建议</el-dropdown-item><el-dropdown-item command="guide"><el-icon><Guide /></el-icon>使用步骤</el-dropdown-item><el-dropdown-item divided command="logout"><el-icon><SwitchButton /></el-icon>退出登录</el-dropdown-item></el-dropdown-menu></template>
    </el-dropdown>
  </div>
  <button v-else class="login-button" type="button" @click="router.push(target('/login'))">登录账户</button>
</template>

<style scoped>
.account-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-left:auto;flex-shrink:0}.credit-balance{display:flex;align-items:center;gap:8px;padding:9px 13px;border:1px solid #dbe7ff;border-radius:24px;background:#f0f5ff;color:#4771ac;white-space:nowrap;font-size:12px}.credit-balance b{font-size:18px;color:#2868ed;font-variant-numeric:tabular-nums}@media(max-width:560px){.account-actions{gap:6px}.credit-balance{padding:5px 8px;gap:4px;flex-direction:column;font-size:10px;line-height:1.1}.credit-balance b{font-size:15px}}.notice-button,.avatar-trigger,.login-button{display:inline-flex;align-items:center;justify-content:center;border:1px solid #dce3eb;background:#fff;color:#172337;cursor:pointer}.notice-button{position:relative;width:39px;height:39px;border-radius:50%;font-size:18px}.notice-button:hover,.avatar-trigger:hover{border-color:#9db2cc}.unread-dot{position:absolute;right:-6px;top:-7px;min-width:18px;height:18px;padding:0 4px;border:2px solid #fff;border-radius:10px;background:#f0445c;color:#fff;font:700 9px/14px Inter,sans-serif}.avatar-trigger{gap:7px;padding:4px 8px 4px 4px;border-radius:24px}.avatar-trigger>span,.avatar-trigger>img{width:31px;height:31px;border-radius:50%}.avatar-trigger>span{display:grid;place-items:center;background:#1c3150;color:#fff;font-size:12px;font-weight:800}.avatar-trigger>img{object-fit:cover}.avatar-trigger>.el-icon{font-size:12px;color:#8290a3}.login-button{padding:10px 16px;border-radius:20px;font-size:12px}.dropdown-user{min-width:210px;padding:12px 16px 10px}.dropdown-user b,.dropdown-user small{display:block}.dropdown-user b{font-size:13px}.dropdown-user small{margin-top:4px;color:#8a96a8;font-size:10px}.el-dropdown-menu em{margin-left:auto;padding:2px 5px;border-radius:4px;background:#eef2f7;color:#8290a3;font-size:9px;font-style:normal}
</style>

<style>
.pq-notice-popover{padding:0!important;border-radius:14px!important;overflow:hidden}.notice-panel header{display:flex;align-items:center;justify-content:space-between;padding:15px 16px;border-bottom:1px solid #edf0f4}.notice-panel header b,.notice-panel header small{display:block}.notice-panel header b{color:#172337;font-size:14px}.notice-panel header small{margin-top:3px;color:#8491a3;font-size:10px}.notice-panel header button,.notice-panel footer button{border:0;background:none;color:#285bf5;font-size:11px;cursor:pointer}.notice-item{position:relative;width:100%;display:flex;gap:10px;padding:13px 16px;border:0;border-bottom:1px solid #f0f2f5;background:#fff;text-align:left;cursor:pointer}.notice-item:hover{background:#f7f9fc}.notice-item>i{flex:none;width:7px;height:7px;margin-top:5px;border-radius:50%;background:#c8d0db}.notice-item.unread>i{background:#f0445c}.notice-item span{min-width:0}.notice-item b,.notice-item small{display:block}.notice-item b{color:#213047;font-size:12px}.notice-item b em{margin-left:5px;padding:2px 5px;border-radius:4px;background:#eef2f7;color:#8290a3;font-size:8px;font-style:normal}.notice-item small{display:-webkit-box;margin-top:5px;overflow:hidden;color:#7c899b;font-size:10px;line-height:1.55;-webkit-box-orient:vertical;-webkit-line-clamp:2}.notice-item.deferred{background:#fafbfd}.notice-empty{padding:34px 15px;color:#93a0b1;text-align:center;font-size:12px}.notice-panel footer{padding:10px;text-align:center}
</style>
