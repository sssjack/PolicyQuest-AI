<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminApi } from '../../api'
import { ElMessage } from 'element-plus'

const data = ref<any>(null)
const attempts = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const status = ref('')
const keyword = ref('')

async function loadData() {
  loading.value = true
  try {
    const [quality, attemptData]: any[] = await Promise.all([
      adminApi.quality(),
      adminApi.attempts({ page: page.value, pageSize: 15, status: status.value, keyword: keyword.value }),
    ])
    data.value = quality.data
    attempts.value = attemptData.data.list
    total.value = attemptData.data.total
  } catch (error: any) { ElMessage.error(error?.message || '质检数据加载失败') }
  finally { loading.value = false }
}

function fmt(value: string | null) { return value ? new Date(value).toLocaleString('zh-CN') : '—' }
onMounted(loadData)
</script>

<template>
  <div class="page-container admin-page">
    <div class="page-heading"><div><div class="page-kicker">GRADING QUALITY CONTROL</div><h1 class="section-title">批改质检</h1><p class="page-subtitle">将用户申诉、异常分数和证据问题聚合到同一条人工抽检链路。</p></div><button class="btn-ghost" @click="loadData">↻ 刷新</button></div>
    <div v-if="data" class="quality-grid"><div v-for="card in data.cards" :key="card.key" class="glass-card quality-card"><div class="quality-card-top"><span>{{ card.label }}</span><span class="quality-status" :class="card.status">{{ card.status === 'ready' ? '可处理' : card.status === 'needs_rule' ? '待规则' : '2.0' }}</span></div><strong>{{ card.value }}</strong><small>{{ card.description }}</small></div></div>
    <section class="glass-card table-card"><div class="table-toolbar"><div><b>整卷批改记录</b><small>失败 {{ data?.failedAttempts || 0 }} · 待处理单题 {{ data?.pendingAnswers || 0 }}</small></div><div class="filters"><el-input v-model="keyword" size="small" placeholder="搜索用户" clearable @change="page = 1; loadData()" /><el-select v-model="status" size="small" placeholder="状态" clearable @change="page = 1; loadData()"><el-option label="批改中" value="grading" /><el-option label="已完成" value="graded" /><el-option label="失败" value="failed" /></el-select></div></div><el-table :data="attempts" v-loading="loading" stripe><el-table-column label="用户" min-width="160"><template #default="{ row }"><b>{{ row.User?.nickname || row.User?.username || `用户 ${row.user_id}` }}</b><small class="muted-block">{{ row.User?.email || '—' }}</small></template></el-table-column><el-table-column label="题组" min-width="230"><template #default="{ row }">{{ row.RealPaper?.title || row.paper_title }}</template></el-table-column><el-table-column label="提交时间" width="155"><template #default="{ row }">{{ fmt(row.submitted_at) }}</template></el-table-column><el-table-column label="分数" width="100"><template #default="{ row }"><strong :class="{ 'danger-text': row.average_score < 60 && row.status === 'graded' }">{{ row.status === 'graded' ? `${row.average_score || 0} / ${row.max_score || 100}` : '—' }}</strong></template></el-table-column><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'graded' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">{{ row.status === 'graded' ? '已完成' : row.status === 'failed' ? '失败' : '批改中' }}</el-tag></template></el-table-column><el-table-column label="抽检建议" min-width="150"><template #default="{ row }"><span v-if="row.status === 'failed'" class="danger-text">优先重试 / 复核</span><span v-else-if="row.status === 'graded' && row.average_score < 60" class="warning-text">异常低分抽检</span><span v-else class="muted-text">常规抽检</span></template></el-table-column></el-table><div class="pagination-wrap"><el-pagination v-model:current-page="page" :page-size="15" :total="total" layout="prev, pager, next, total" @current-change="loadData" /></div></section>
    <div class="quality-note">当前已有：失败批改、低分线索与人工抽检入口。用户申诉、重复扣分规则、范文字数与证据版本留痕会在 2.0 工单模型接入。</div>
  </div>
</template>

<style scoped>
.admin-page{max-width:1500px}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px}.section-title{margin-bottom:0}.quality-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:15px}.quality-card{min-height:130px;padding:18px}.quality-card-top{display:flex;align-items:center;justify-content:space-between;color:var(--text-secondary);font-size:13px;font-weight:700}.quality-card strong{display:block;margin-top:17px;color:var(--text-primary);font-size:30px}.quality-card small{display:block;margin-top:7px;color:var(--text-muted);font-size:11px}.quality-status{padding:4px 6px;border-radius:4px;background:var(--warning-soft);color:var(--warning);font-size:9px}.quality-status.ready{background:var(--success-soft);color:var(--success)}.quality-status.needs_rule{background:var(--surface-muted);color:var(--primary)}.table-card{padding:0;overflow:hidden}.table-toolbar{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:16px 20px;border-bottom:1px solid var(--border)}.table-toolbar b,.table-toolbar small{display:block}.table-toolbar b{color:var(--text-primary);font-size:14px}.table-toolbar small{margin-top:4px;color:var(--text-muted);font-size:11px}.filters{display:flex;gap:8px}.filters :deep(.el-input){width:150px}.filters :deep(.el-select){width:110px}.muted-block,.muted-text{display:block;color:var(--text-muted);font-size:11px}.danger-text{color:var(--danger)!important}.warning-text{color:var(--warning)}.pagination-wrap{display:flex;justify-content:flex-end;padding:16px 20px}.quality-note{margin-top:15px;padding:13px 15px;border-radius:9px;background:var(--surface-muted);color:var(--text-secondary);font-size:12px;line-height:1.6}@media(max-width:1000px){.quality-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.page-heading,.table-toolbar{align-items:flex-start;flex-direction:column}.quality-grid{grid-template-columns:1fr}.filters{width:100%}.filters :deep(.el-input),.filters :deep(.el-select){width:100%}}
</style>
