<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '../../api'

const recordType = ref<'paper' | 'session'>('paper')
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const keyword = ref('')
const status = ref('')
const drawer = ref(false)
const detail = ref<any>(null)

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.practiceRecords({ recordType: recordType.value, page: page.value, pageSize: 20, keyword: keyword.value, status: status.value })
    list.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error?.message || '做题记录加载失败')
  } finally { loading.value = false }
}

function changeType(value: 'paper' | 'session') {
  recordType.value = value
  status.value = ''
  page.value = 1
  loadData()
}

async function openDetail(row: any) {
  drawer.value = true
  detail.value = null
  try {
    const res: any = await adminApi.practiceRecordDetail(recordType.value, row.id)
    detail.value = res.data
  } catch (error: any) { ElMessage.error(error?.message || '做题详情加载失败') }
}

function date(value: string | null) { return value ? new Date(value).toLocaleString('zh-CN') : '—' }
function duration(value: number) { const seconds = Number(value || 0); return `${Math.floor(seconds / 60)}分${seconds % 60}秒` }
function pretty(value: any) { return value ? JSON.stringify(value, null, 2) : '—' }
onMounted(loadData)
</script>

<template>
  <div class="page-container admin-page">
    <div class="page-heading"><div><div class="page-kicker">USER PRACTICE RECORDS</div><h1 class="section-title">用户做题记录</h1><p class="page-subtitle">查看用户答了什么、每题用时、标准答案与 AI 批改内容。</p></div><span class="count-pill">{{ total }} 条</span></div>
    <section class="glass-card toolbar">
      <el-segmented :model-value="recordType" :options="[{ label: '真题整卷', value: 'paper' }, { label: '题库练习', value: 'session' }]" @change="changeType" />
      <el-input v-model="keyword" placeholder="搜索用户、昵称或邮箱" clearable @change="page = 1; loadData()" />
      <el-select v-model="status" placeholder="状态" clearable @change="page = 1; loadData()"><template v-if="recordType === 'paper'"><el-option label="批改中" value="grading" /><el-option label="已完成" value="graded" /><el-option label="失败" value="failed" /></template><template v-else><el-option label="进行中" value="in_progress" /><el-option label="已完成" value="completed" /><el-option label="已放弃" value="abandoned" /></template></el-select>
    </section>
    <section class="glass-card table-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="用户" min-width="160"><template #default="{ row }"><b>{{ row.User?.nickname || row.User?.username || `用户${row.user_id}` }}</b><small>{{ row.User?.email || '—' }}</small></template></el-table-column>
        <el-table-column label="练习内容" min-width="260"><template #default="{ row }">{{ recordType === 'paper' ? row.paper_title : `题库练习 · ${row.session_type}` }}</template></el-table-column>
        <el-table-column label="进度" width="130"><template #default="{ row }">{{ row.answered_count || 0 }} / {{ row.total_questions || 0 }} 题</template></el-table-column>
        <el-table-column label="得分" width="110"><template #default="{ row }">{{ recordType === 'paper' ? (row.status === 'graded' ? `${row.total_score} / ${row.max_score}` : '—') : `${row.correct_count || 0} 题正确` }}</template></el-table-column>
        <el-table-column label="总用时" width="110"><template #default="{ row }">{{ duration(row.total_duration) }}</template></el-table-column>
        <el-table-column label="开始 / 提交" width="170"><template #default="{ row }">{{ date(row.submitted_at || row.started_at) }}</template></el-table-column>
        <el-table-column label="状态" width="95"><template #default="{ row }"><el-tag size="small" :type="['graded','completed'].includes(row.status) ? 'success' : row.status === 'failed' ? 'danger' : 'warning'">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="90"><template #default="{ row }"><el-button link type="primary" @click="openDetail(row)">查看详情</el-button></template></el-table-column>
      </el-table><div class="pagination-wrap"><el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="loadData" /></div>
    </section>
    <el-drawer v-model="drawer" title="用户做题详情" size="76%">
      <div v-if="!detail" class="empty">正在加载…</div>
      <template v-else-if="detail.recordType === 'paper'">
        <el-descriptions :column="3" border><el-descriptions-item label="用户">{{ detail.record.User?.nickname || detail.record.User?.username }}</el-descriptions-item><el-descriptions-item label="试卷">{{ detail.record.paper_title }}</el-descriptions-item><el-descriptions-item label="总用时">{{ duration(detail.record.total_duration) }}</el-descriptions-item></el-descriptions>
        <article v-for="answer in detail.record.RealPaperAttemptAnswers" :key="answer.id" class="answer-card">
          <header><div><b>第 {{ answer.question_no }} 题 · {{ answer.question_title }}</b><small>用时 {{ duration(answer.duration) }} · {{ answer.status }} · {{ answer.score ?? '—' }} / {{ answer.max_score }}</small></div></header>
          <h4>题干</h4><p>{{ answer.question_prompt }}</p><h4>用户作答</h4><p class="user-answer">{{ answer.user_answer }}</p><h4>AI 批改总评</h4><p>{{ answer.report?.summary || answer.error_message || '暂无批改内容' }}</p>
          <el-collapse v-if="answer.report"><el-collapse-item title="查看完整 AI 批改 JSON"><pre>{{ pretty(answer.report) }}</pre></el-collapse-item></el-collapse>
        </article>
      </template>
      <template v-else>
        <el-descriptions :column="3" border><el-descriptions-item label="用户">{{ detail.record.User?.nickname || detail.record.User?.username }}</el-descriptions-item><el-descriptions-item label="练习类型">{{ detail.record.session_type }}</el-descriptions-item><el-descriptions-item label="总用时">{{ duration(detail.record.total_duration) }}</el-descriptions-item></el-descriptions>
        <article v-for="answer in detail.record.UserAnswers" :key="answer.id" class="answer-card"><header><b>{{ answer.Question?.stem }}</b><small>用时 {{ duration(answer.duration) }} · {{ answer.is_correct ? '正确' : '错误' }}</small></header><h4>用户作答</h4><p class="user-answer">{{ answer.user_answer || '未作答' }}</p><h4>标准答案 / 解析</h4><p>{{ answer.Question?.answer }} · {{ answer.Question?.analysis || '暂无解析' }}</p><h4 v-if="answer.ai_feedback">AI 批改</h4><p v-if="answer.ai_feedback">{{ answer.ai_feedback }}</p></article>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.admin-page{max-width:1500px}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px}.section-title{margin-bottom:0}.count-pill{padding:8px 12px;border-radius:7px;background:var(--surface-muted);color:var(--primary);font-size:12px;font-weight:800}.toolbar{display:flex;align-items:center;gap:10px;padding:14px;margin-bottom:15px}.toolbar :deep(.el-input){width:260px}.toolbar :deep(.el-select){width:130px}.table-card{padding:0;overflow:hidden}.table-card b,.table-card small{display:block}.table-card small,.answer-card small{margin-top:4px;color:var(--text-muted);font-size:11px}.pagination-wrap{display:flex;justify-content:flex-end;padding:16px 20px}.answer-card{margin-top:18px;padding:20px;border:1px solid var(--border);border-radius:12px;background:var(--surface-soft)}.answer-card header{display:flex;justify-content:space-between;gap:12px}.answer-card h4{margin:18px 0 7px;color:var(--text-muted);font-size:11px}.answer-card p{margin:0;line-height:1.75;white-space:pre-wrap}.user-answer{padding:12px;border-left:3px solid var(--primary);background:#fff}.answer-card pre{max-height:420px;overflow:auto;white-space:pre-wrap;word-break:break-all}.empty{padding:40px;color:var(--text-muted);text-align:center}@media(max-width:700px){.toolbar{align-items:stretch;flex-direction:column}.toolbar :deep(.el-input),.toolbar :deep(.el-select){width:100%}}
</style>
