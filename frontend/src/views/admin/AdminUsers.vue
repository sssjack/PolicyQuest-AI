<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminApi, requestId } from '../../api'
import { ElMessage } from 'element-plus'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const filters = ref({ keyword: '', role: '', status: '' })
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<any>(null)

const creditsVisible = ref(false)
const creditsSaving = ref(false)
const creditUser = ref<any>(null)
const creditDelta = ref(100)
const creditReason = ref('')
let adjustmentId = ''
let adjustmentPayload = ''

function editCredits(row: any) {
  creditUser.value = row; creditDelta.value = 100; creditReason.value = ''
  adjustmentId = requestId(); adjustmentPayload = ''; creditsVisible.value = true
}
async function saveCredits() {
  if (creditsSaving.value) return
  if (!Number.isInteger(creditDelta.value) || !creditDelta.value || !creditReason.value.trim()) {
    ElMessage.warning('请填写非零整数积分和调整原因'); return
  }
  const payload = JSON.stringify([creditDelta.value, creditReason.value.trim()])
  if (adjustmentPayload && adjustmentPayload !== payload) adjustmentId = requestId()
  adjustmentPayload = payload
  creditsSaving.value = true
  try {
    await adminApi.adjustCredits(creditUser.value.id, { delta: creditDelta.value, reason: creditReason.value.trim(), requestId: adjustmentId })
    creditsVisible.value = false; ElMessage.success('积分已调整')
    await loadData()
    if (detailVisible.value && detail.value?.user.id === creditUser.value.id) await showDetail(creditUser.value)
  } catch (error: any) { ElMessage.error(error?.message || '积分调整失败') }
  finally { creditsSaving.value = false }
}

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.users({ page: page.value, pageSize: 20, ...filters.value })
    list.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error?.message || '用户列表加载失败')
  } finally { loading.value = false }
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 'active' ? 'banned' : 'active'
  try {
    await adminApi.updateUserStatus(row.id, newStatus)
    ElMessage.success(newStatus === 'banned' ? '用户已禁用' : '用户已启用')
    loadData()
  } catch (error: any) { ElMessage.error(error?.message || '状态更新失败') }
}

async function showDetail(row: any) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res: any = await adminApi.userSummary(row.id)
    detail.value = res.data
  } catch (error: any) { ElMessage.error(error?.message || '用户详情加载失败') }
  finally { detailLoading.value = false }
}

function percent(row: any) {
  return row.total_questions ? `${((row.correct_count / row.total_questions) * 100).toFixed(1)}%` : '—'
}

function date(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(loadData)
</script>

<template>
  <div class="page-container admin-page">
    <div class="page-heading"><div><div class="page-kicker">CUSTOMER 360</div><h1 class="section-title">用户与权益</h1><p class="page-subtitle">管理账号状态、学习记录与积分；每套真题消耗10积分，所有调整保留账本。</p></div><span class="count-pill">{{ total }} 个用户</span></div>
    <section class="glass-card filter-card">
      <el-input v-model="filters.keyword" placeholder="搜索手机号、用户名、昵称或邮箱" clearable class="search-input" @change="page = 1; loadData()" />
      <el-select v-model="filters.role" placeholder="角色" clearable @change="page = 1; loadData()"><el-option label="普通用户" value="user" /><el-option label="管理员" value="admin" /><el-option label="超级管理员" value="super_admin" /></el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable @change="page = 1; loadData()"><el-option label="正常" value="active" /><el-option label="禁用" value="banned" /><el-option label="未激活" value="inactive" /></el-select>
      <button class="btn-ghost" @click="filters = { keyword: '', role: '', status: '' }; page = 1; loadData()">重置</button>
    </section>

    <section class="glass-card table-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="用户" min-width="190">
          <template #default="{ row }"><a class="user-link" @click="showDetail(row)"><b>{{ row.nickname || row.username }}</b><small>{{ row.phone || row.username }}<template v-if="row.email"> · {{ row.email }}</template></small></a></template>
        </el-table-column>
        <el-table-column label="角色" width="100"><template #default="{ row }"><el-tag :type="row.role === 'user' ? 'info' : 'warning'" size="small">{{ row.role === 'user' ? '用户' : row.role === 'admin' ? '管理员' : '超管' }}</el-tag></template></el-table-column>
        <el-table-column label="剩余积分" width="120"><template #default="{ row }"><b>{{ row.credits }}</b><small class="muted-block">可答 {{ Math.floor(row.credits / 10) }} 套</small></template></el-table-column>
        <el-table-column label="练习行为" min-width="150"><template #default="{ row }"><span>{{ row.total_questions || 0 }} 题</span><small class="muted-block">正确率 {{ percent(row) }}</small></template></el-table-column>
        <el-table-column label="目标地区" width="120"><template #default="{ row }">{{ row.province || '未设置' }}</template></el-table-column>
        <el-table-column label="状态" width="90"><template #default="{ row }"><span class="status-pill" :class="row.status">{{ row.status === 'active' ? '正常' : row.status === 'banned' ? '禁用' : '未激活' }}</span></template></el-table-column>
        <el-table-column label="最近登录" width="145"><template #default="{ row }">{{ date(row.last_login_at) }}</template></el-table-column>
        <el-table-column label="操作" width="255" fixed="right"><template #default="{ row }"><el-button size="small" @click="showDetail(row)">用户档案</el-button><el-button size="small" type="primary" plain @click="editCredits(row)">调整积分</el-button><el-button size="small" :type="row.status === 'active' ? 'danger' : 'success'" @click="toggleStatus(row)">{{ row.status === 'active' ? '禁用' : '启用' }}</el-button></template></el-table-column>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="loadData" /></div>
    </section>

    <el-dialog v-model="creditsVisible" title="调整用户积分" width="440px" style="max-width:calc(100vw - 24px)" :close-on-click-modal="false" :before-close="(done: () => void) => { if (!creditsSaving) done() }">
      <p>{{ creditUser?.nickname || creditUser?.username }} · 当前 {{ creditUser?.credits }} 积分</p>
      <el-form label-position="top"><el-form-item label="积分变动（正数增加，负数扣减）"><el-input-number v-model="creditDelta" :min="-1000000" :max="1000000" :precision="0" :step="10" :disabled="creditsSaving" /></el-form-item><el-form-item label="调整原因"><el-input v-model="creditReason" type="textarea" maxlength="200" show-word-limit :rows="3" :disabled="creditsSaving" placeholder="例如：体验额度补充" /></el-form-item></el-form>
      <p>预计余额：{{ (creditUser?.credits || 0) + (creditDelta || 0) }} 积分</p>
      <template #footer><el-button :disabled="creditsSaving" @click="creditsVisible = false">取消</el-button><el-button type="primary" :loading="creditsSaving" @click="saveCredits">保存调整</el-button></template>
    </el-dialog>
    <el-drawer v-model="detailVisible" title="用户 360 档案" size="560px" destroy-on-close>
      <div v-if="detailLoading" class="drawer-loading">正在读取用户档案…</div>
      <template v-else-if="detail">
        <div class="profile-head"><div class="profile-avatar">{{ (detail.user.nickname || detail.user.username || '用').slice(0, 1) }}</div><div><h2>{{ detail.user.nickname || detail.user.username }}</h2><p>{{ detail.user.phone || detail.user.email || detail.user.username }} · 注册于 {{ date(detail.user.created_at) }}</p></div></div>
        <div class="rights-banner"><div><span>会员权益</span><b>{{ detail.rights.membership === null ? '2.0 待接入' : detail.rights.membership }}</b></div><div><span>体验额度</span><b>{{ detail.rights.trialQuota === null ? '待接入' : detail.rights.trialQuota }}</b></div><div><span>积分余额</span><b>{{ detail.rights.points === null ? '待接入' : detail.rights.points }}</b></div></div>
        <div class="drawer-section"><div class="drawer-section-title">学习摘要</div><div class="mini-stats"><div><b>{{ detail.stats.answers }}</b><span>作答</span></div><div><b>{{ detail.stats.sessions }}</b><span>会话</span></div><div><b>{{ detail.stats.attempts }}</b><span>整卷</span></div></div></div>
        <div class="drawer-section"><div class="drawer-section-title">最近整卷练习</div><div v-if="!detail.attempts.length" class="empty-line">暂无整卷练习记录</div><div v-for="item in detail.attempts" :key="item.id" class="record-line"><div><b>{{ item.paper_title }}</b><small>{{ date(item.submitted_at) }}</small></div><span class="status-pill" :class="item.status">{{ item.status === 'graded' ? `${item.average_score || 0} 分` : item.status === 'failed' ? '批改失败' : '批改中' }}</span></div></div>
        <div class="drawer-section"><div class="drawer-section-title">最近练习会话</div><div v-if="!detail.sessions.length" class="empty-line">暂无练习会话记录</div><div v-for="item in detail.sessions" :key="item.id" class="record-line"><div><b>{{ item.session_type || '日常练习' }}</b><small>{{ date(item.started_at) }} · {{ item.answered_count || 0 }} 题</small></div><span>{{ item.accuracy ? `${Number(item.accuracy).toFixed(0)}%` : '—' }}</span></div></div>
        <div class="drawer-section"><div class="drawer-section-title">积分账本 · 最近50笔 <el-button size="small" @click="editCredits(detail.user)">调整积分</el-button></div><div v-if="!detail.creditLedger?.length" class="empty-line">暂无积分变动</div><div v-for="entry in detail.creditLedger" :key="entry.id" class="record-line"><div><b>{{ entry.reason }}</b><small>{{ date(entry.created_at) }} · {{ entry.actor_id ? `管理员 #${entry.actor_id}` : '系统' }}</small></div><span>{{ entry.delta > 0 ? '+' : '' }}{{ entry.delta }} · 余额 {{ entry.balance }}</span></div></div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.admin-page { max-width: 1500px; }.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 24px; }.section-title { margin-bottom: 0; }.count-pill { padding: 8px 12px; border-radius: 7px; background: var(--surface-muted); color: var(--primary); font-size: 12px; font-weight: 800; white-space: nowrap; }.filter-card { display: flex; gap: 10px; padding: 14px; margin-bottom: 15px; }.search-input { max-width: 320px; }.filter-card :deep(.el-select) { width: 130px; }.filter-card .btn-ghost { min-height: 38px; padding: 0 14px; }.table-card { padding: 0; overflow: hidden; }.table-card :deep(.el-table) { --el-table-bg-color: transparent !important; }.user-link { display: flex; flex-direction: column; gap: 4px; cursor: pointer; }.user-link b { color: var(--primary); font-size: 13px; }.user-link small, .muted-block { display: block; color: var(--text-muted); font-size: 11px; }.status-pill { display: inline-flex; align-items: center; min-height: 24px; padding: 0 8px; border-radius: 999px; background: var(--surface-muted); color: var(--primary); font-size: 11px; font-weight: 800; }.status-pill.active, .status-pill.graded { background: var(--success-soft); color: var(--success); }.status-pill.banned, .status-pill.failed { background: var(--danger-soft); color: var(--danger); }.status-pill.inactive, .status-pill.grading { background: var(--warning-soft); color: var(--warning); }.pagination-wrap { display: flex; justify-content: flex-end; padding: 16px 20px; }.drawer-loading, .empty-line { padding: 32px 0; color: var(--text-muted); text-align: center; }.profile-head { display: flex; align-items: center; gap: 12px; }.profile-avatar { width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; border-radius: 14px; background: var(--gradient-1); color: #fff; font-size: 20px; font-weight: 800; }.profile-head h2 { margin: 0; font-size: 18px; }.profile-head p { margin: 5px 0 0; color: var(--text-muted); font-size: 12px; }.rights-banner { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 22px; padding: 13px; border-radius: 12px; background: var(--surface-soft); }.rights-banner div { display: flex; flex-direction: column; gap: 5px; }.rights-banner span { color: var(--text-muted); font-size: 11px; }.rights-banner b { color: var(--text-primary); font-size: 13px; }.drawer-section { margin-top: 25px; }.drawer-section-title { margin-bottom: 10px; color: var(--text-primary); font-size: 13px; font-weight: 800; }.mini-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }.mini-stats div { padding: 13px; border: 1px solid var(--border); border-radius: 10px; }.mini-stats b, .mini-stats span { display: block; }.mini-stats b { color: var(--primary); font-size: 20px; }.mini-stats span { margin-top: 4px; color: var(--text-muted); font-size: 11px; }.record-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }.record-line b, .record-line small { display: block; }.record-line b { color: var(--text-primary); font-size: 12px; }.record-line small { margin-top: 3px; color: var(--text-muted); font-size: 11px; }.record-line > span:not(.status-pill) { color: var(--primary); font-size: 12px; font-weight: 800; }.drawer-note { margin-top: 25px; padding: 12px; border-radius: 9px; background: var(--warning-soft); color: var(--warning); font-size: 11px; line-height: 1.6; }
@media (max-width: 700px) { .page-heading, .filter-card { align-items: stretch; flex-direction: column; }.search-input { max-width: none; }.filter-card :deep(.el-select) { width: 100%; } }
</style>
