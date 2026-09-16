<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { accountApi } from '../../api'
import UserAccountMenu from '../../components/UserAccountMenu.vue'
import NotificationDetail from '../../components/NotificationDetail.vue'
import ProfilePage from '../auth/ProfilePage.vue'
import { orderNotice, type AccountNotice } from '../../data/notifications'

const route = useRoute()
const router = useRouter()
const section = computed(() => String(route.params.section || 'guide'))
const feedbacks = ref<any[]>([])
const notices = ref<any[]>([])
const unread = ref(0)
const loading = ref(false)
const sending = ref(false)
const selectedNotice = ref<AccountNotice | null>(null)
const form = ref({ category: 'suggestion', content: '', contact: '' })
const titles: Record<string, { title: string; subtitle: string }> = {
  orders: { title: '订单管理', subtitle: '查看套餐、订单状态与支付记录' },
  profile: { title: '个人信息', subtitle: '管理头像、账号资料与备考目标' },
  feedback: { title: '反馈和建议', subtitle: '把问题和想法告诉我们' },
  guide: { title: '使用步骤', subtitle: '从选题到复盘的完整训练路径' },
  notifications: { title: '消息通知', subtitle: '通知公告与状态提醒' },
}
const current = computed(() => titles[section.value] || titles.guide)
const statusMap: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
const categoryMap: Record<string, string> = { suggestion: '产品建议', bug: '问题反馈', content: '内容纠错', other: '其他' }

async function loadSection() {
  loading.value = true
  try {
    if (section.value === 'feedback') {
      const res: any = await accountApi.feedbacks()
      feedbacks.value = res.data
    }
    if (section.value === 'notifications') {
      const res: any = await accountApi.notifications({ pageSize: 50 })
      notices.value = res.data.list
      unread.value = res.data.unread
    }
  } catch (error: any) { ElMessage.error(error?.message || '页面数据加载失败') }
  finally { loading.value = false }
}

async function submitFeedback() {
  if (form.value.content.trim().length < 5) return ElMessage.warning('请至少填写5个字的反馈内容')
  sending.value = true
  try {
    await accountApi.createFeedback(form.value)
    ElMessage.success('反馈已提交，感谢你的建议')
    form.value = { category: 'suggestion', content: '', contact: '' }
    loadSection()
  } catch (error: any) { ElMessage.error(error?.message || '提交失败') }
  finally { sending.value = false }
}

async function read(item: AccountNotice) {
  selectedNotice.value = item
  if (!item.id || item.read) return
  try { await accountApi.readNotification(item.id); item.read = true; unread.value = Math.max(unread.value - 1, 0) }
  catch (error: any) { ElMessage.error(error?.message || '更新已读状态失败') }
}
async function readAll() {
  try { await accountApi.readAllNotifications(); notices.value.forEach(item => { item.read = true }); unread.value = 0 }
  catch (error: any) { ElMessage.error(error?.message || '更新已读状态失败') }
}
function target(path: string) {
  return { path, query: route.query.preview === '1' ? { preview: '1' } : {} }
}
function date(value: string | null) { return value ? new Date(value).toLocaleString('zh-CN') : '—' }
watch(section, loadSection)
onMounted(loadSection)
</script>

<template>
  <div class="account-page">
    <header class="account-nav"><router-link :to="target('/coach')" class="brand"><span>PQ</span><strong>PolicyQuest</strong></router-link><UserAccountMenu /></header>
    <main>
      <div class="breadcrumbs"><button type="button" @click="router.push(target('/coach'))">学习中心</button><span>/</span><b>{{ current.title }}</b></div>
      <section class="account-hero"><div><small>ACCOUNT CENTER</small><h1>{{ current.title }}</h1><p>{{ current.subtitle }}</p></div></section>
      <div class="account-grid">
        <aside><router-link :to="target('/account/orders')" :class="{ active: section === 'orders' }">订单管理 <em>2.0</em></router-link><router-link :to="target('/account/profile')" :class="{ active: section === 'profile' }">个人信息</router-link><router-link :to="target('/account/feedback')" :class="{ active: section === 'feedback' }">反馈和建议</router-link><router-link :to="target('/account/guide')" :class="{ active: section === 'guide' }">使用步骤</router-link><router-link :to="target('/account/notifications')" :class="{ active: section === 'notifications' }">消息通知 <i v-if="unread">{{ unread }}</i></router-link></aside>
        <section class="content-card">
          <div v-if="loading" class="empty">正在加载…</div>
          <ProfilePage v-else-if="section === 'profile'" embedded />
          <template v-else-if="section === 'orders'"><div class="v2-card"><span>2.0</span><h2>订单管理即将开放</h2><p>套餐购买、订单状态、支付记录与退款进度将在 2.0 版本统一接入。</p></div></template>
          <template v-else-if="section === 'feedback'"><div class="feedback-form"><h2>提交反馈</h2><el-form label-position="top"><el-form-item label="反馈类型"><el-select v-model="form.category"><el-option v-for="(label, key) in categoryMap" :key="key" :label="label" :value="key" /></el-select></el-form-item><el-form-item label="反馈内容"><el-input v-model="form.content" type="textarea" :rows="7" maxlength="2000" show-word-limit placeholder="请描述问题、建议或希望改进的地方" /></el-form-item><el-form-item label="联系方式（可选）"><el-input v-model="form.contact" maxlength="120" placeholder="手机号、邮箱或其他联系方式" /></el-form-item><el-button type="primary" :loading="sending" @click="submitFeedback">提交反馈</el-button></el-form></div><div class="history"><h2>我的反馈</h2><div v-if="!feedbacks.length" class="empty">还没有提交过反馈</div><article v-for="item in feedbacks" :key="item.id"><header><b>{{ categoryMap[item.category] }}</b><span>{{ statusMap[item.status] }}</span></header><p>{{ item.content }}</p><small>{{ date(item.created_at) }}</small><div v-if="item.admin_reply" class="reply"><b>平台回复</b><p>{{ item.admin_reply }}</p></div></article></div></template>
          <template v-else-if="section === 'notifications'"><div class="content-title"><div><h2>消息通知</h2><p>{{ unread ? `${unread} 条未读消息` : '全部消息均已读' }}</p></div><el-button v-if="unread" link type="primary" @click="readAll">全部已读</el-button></div><article class="notice-row order-notice" @click="read(orderNotice)" role="button" tabindex="0" @keydown.enter="read(orderNotice)" @keydown.space.prevent="read(orderNotice)"><i></i><div><header><b>订单状态 <em>2.0</em></b><small>功能预告</small></header><p>订单进度、支付状态与退款通知将在 2.0 版本接入。</p></div></article><div v-if="!notices.length" class="empty">暂无通知公告</div><article v-for="item in notices" :key="item.id" class="notice-row" :class="{ unread: !item.read }" @click="read(item)" role="button" tabindex="0" @keydown.enter="read(item)" @keydown.space.prevent="read(item)"><i></i><div><header><b>{{ item.title }}</b><small>{{ date(item.publishedAt) }}</small></header><p>{{ item.content }}</p></div></article></template>
          <template v-else><div class="guide"><article><span>01</span><div><h2>选择一套真题</h2><p>进入真题库，按申论或面试、地区、年份筛选题目，先看题干和作答要求。</p></div></article><article><span>02</span><div><h2>限时完成作答</h2><p>按考试节奏阅读材料并作答。系统会自动记录每题和整卷用时。</p></div></article><article><span>03</span><div><h2>等待 AI 批改</h2><p>AI 会按原题分值分析要点覆盖、结构、表达与可执行性；失败记录可以重新批改。</p></div></article><article><span>04</span><div><h2>逐题复盘</h2><p>查看逐句批注、材料依据、改写建议和多版本参考答案，理解具体失分原因。</p></div></article><article><span>05</span><div><h2>回到学习报告</h2><p>通过做题历史和整卷报告查看能力变化，把薄弱项转化为下一次训练任务。</p></div></article></div></template>
        </section>
      </div>
    </main>
    <NotificationDetail :notice="selectedNotice" @close="selectedNotice = null" />
  </div>
</template>

<style scoped>
.account-page{min-height:100vh;background:#f4f7fa;color:#172337}.account-nav{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 max(28px,calc((100vw - 1200px)/2));border-bottom:1px solid #e1e6ed;background:#fff}.brand{display:flex;align-items:center;gap:10px;color:#172337;text-decoration:none}.brand span{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:#20334f;color:#fff;font-size:12px;font-weight:900}.account-page main{width:min(1200px,calc(100% - 48px));margin:auto}.breadcrumbs{display:flex;gap:9px;padding:23px 0;color:#8b97a7;font-size:11px}.breadcrumbs button{border:0;background:none;color:#738197;cursor:pointer}.breadcrumbs b{color:#35455c}.account-hero{padding:32px 37px;border-radius:17px;background:linear-gradient(120deg,#14243c,#25466f);color:#fff}.account-hero small{color:#a9bdd8;font-size:9px;letter-spacing:1.8px}.account-hero h1{margin:10px 0 5px;font-size:28px}.account-hero p{margin:0;color:#b9c9dd;font-size:13px}.account-grid{display:grid;grid-template-columns:220px minmax(0,1fr);gap:18px;padding:18px 0 55px}.account-grid aside,.content-card{border:1px solid #e2e7ed;border-radius:13px;background:#fff}.account-grid aside{height:fit-content;padding:10px}.account-grid aside a{display:flex;align-items:center;min-height:43px;padding:0 12px;border-radius:8px;color:#607086;font-size:12px;text-decoration:none}.account-grid aside a.active{background:#edf3ff;color:#285bf5;font-weight:700}.account-grid aside em{margin-left:auto;color:#94a0b0;font-size:9px;font-style:normal}.account-grid aside i{margin-left:auto;min-width:18px;height:18px;border-radius:9px;background:#f0445c;color:#fff;font:700 9px/18px Inter;text-align:center}.content-card{min-width:0;min-height:470px;padding:27px}.empty{padding:45px;color:#96a1b1;text-align:center}.v2-card{display:flex;align-items:center;flex-direction:column;justify-content:center;min-height:410px;text-align:center}.v2-card>span{display:grid;place-items:center;width:64px;height:64px;border-radius:18px;background:#edf3ff;color:#285bf5;font-weight:900}.v2-card h2{margin:18px 0 8px}.v2-card p{max-width:420px;color:#7b899b;line-height:1.7}.feedback-form{padding-bottom:28px;border-bottom:1px solid #e8ecf1}.feedback-form h2,.history h2,.content-title h2{margin:0 0 18px;font-size:17px}.feedback-form :deep(.el-select){width:220px}.history{padding-top:28px}.history article{padding:16px 0;border-bottom:1px solid #edf0f4}.history header,.content-title,.notice-row header{display:flex;align-items:center;justify-content:space-between}.history header span{padding:3px 7px;border-radius:5px;background:#edf3ff;color:#285bf5;font-size:10px}.history article>p,.reply p{line-height:1.7;white-space:pre-wrap}.history article>small,.notice-row small{color:#96a1b1;font-size:10px}.reply{margin-top:13px;padding:12px;border-radius:8px;background:#f4f7fa}.reply b{font-size:11px}.reply p{margin:6px 0 0}.content-title p{margin:-12px 0 0;color:#8b97a7;font-size:11px}.notice-row{display:flex;gap:13px;padding:17px 3px;border-bottom:1px solid #edf0f4;cursor:pointer}.notice-row>i{flex:none;width:8px;height:8px;margin-top:5px;border-radius:50%;background:#cbd3dd}.notice-row.unread>i{background:#f0445c}.notice-row>div{flex:1;min-width:0}.notice-row:focus-visible{outline:2px solid #285bf5;outline-offset:2px}.notice-row p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}.notice-row header{flex-wrap:wrap;gap:8px}.notice-row header b{overflow-wrap:anywhere}.notice-row header b{font-size:13px}.notice-row header em{margin-left:5px;padding:2px 5px;border-radius:4px;background:#edf2f7;color:#7f8c9d;font-size:8px;font-style:normal}.notice-row p{margin:8px 0 0;color:#68778b;line-height:1.75;white-space:pre-wrap}.order-notice{margin:10px 0;border-radius:9px;background:#f8fafc}.guide{display:grid;gap:6px}.guide article{display:grid;grid-template-columns:58px 1fr;gap:18px;padding:19px;border-radius:11px}.guide article:hover{background:#f5f8fb}.guide article>span{color:#285bf5;font:800 20px Inter}.guide h2{margin:0;font-size:15px}.guide p{margin:7px 0 0;color:#718095;font-size:12px;line-height:1.75}@media(max-width:760px){.account-page main{width:calc(100% - 28px)}.account-nav{padding-inline:15px}.account-grid{grid-template-columns:1fr}.account-grid aside{display:grid;grid-template-columns:1fr 1fr}.account-hero{padding:25px}.content-card{padding:18px}}
</style>
