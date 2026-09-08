<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminApi } from '../../api'
import { ElMessage } from 'element-plus'

const dashboard = ref<any>(null)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const filterStatus = ref('')

async function loadData() {
  loading.value = true
  try {
    const [summary, tasks]: any[] = await Promise.all([
      adminApi.dashboard(),
      adminApi.aiTasks({ page: page.value, pageSize: 20, status: filterStatus.value }),
    ])
    dashboard.value = summary.data
    list.value = tasks.data.list
    total.value = tasks.data.total
  } catch (error: any) { ElMessage.error(error?.message || 'AI 任务加载失败') }
  finally { loading.value = false }
}

function fmt(value: string | null) { return value ? new Date(value).toLocaleString('zh-CN') : '—' }
function cost(value: number) { return `¥${Number(value || 0).toFixed(4)}` }
function taskLabel(value: string) { return ({ generate_question: 'AI 出题', score_interview: '面试批改', generate_report: '整卷报告', process_article: '文章处理' } as any)[value] || value }
onMounted(loadData)
</script>

<template>
  <div class="page-container admin-page">
    <div class="page-heading"><div><div class="page-kicker">MODEL OBSERVABILITY</div><h1 class="section-title">AI 任务与成本</h1><p class="page-subtitle">从模型请求、Token、费用和失败状态追到具体业务任务。</p></div><button class="btn-ghost refresh-btn" @click="loadData">↻ 刷新</button></div>
    <div v-if="dashboard" class="cost-summary"><div class="glass-card cost-card"><span>累计 AI 费用</span><strong>¥{{ Number(dashboard.aiCost || 0).toFixed(2) }}</strong><small>按已记录 cost 汇总</small></div><div class="glass-card cost-card"><span>累计 Token</span><strong>{{ dashboard.aiTokens || 0 }}</strong><small>{{ dashboard.aiTaskCount }} 次模型任务</small></div><div class="glass-card cost-card"><span>失败任务</span><strong class="danger-text">{{ dashboard.failedAiTasks }}</strong><small>进入失败重试与成本核对</small></div><div class="glass-card cost-card"><span>成本口径</span><strong class="text-small">模型调用</strong><small>不含人工服务成本</small></div></div>
    <section class="glass-card table-card"><div class="table-toolbar"><span>任务明细</span><el-select v-model="filterStatus" placeholder="任务状态" clearable size="small" @change="page = 1; loadData()"><el-option label="处理中" value="processing" /><el-option label="已完成" value="completed" /><el-option label="失败" value="failed" /></el-select></div><el-table :data="list" v-loading="loading" stripe><el-table-column prop="id" label="任务" width="75"><template #default="{ row }"><span class="task-id">#{{ row.id }}</span></template></el-table-column><el-table-column label="阶段" width="120"><template #default="{ row }"><span class="stage-dot" :class="row.status"></span>{{ taskLabel(row.task_type) }}</template></el-table-column><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'completed' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">{{ row.status === 'completed' ? '完成' : row.status === 'failed' ? '失败' : row.status === 'processing' ? '处理中' : '待处理' }}</el-tag></template></el-table-column><el-table-column label="Token" width="110"><template #default="{ row }">{{ row.token_usage || 0 }}</template></el-table-column><el-table-column label="费用" width="110"><template #default="{ row }"><b>{{ cost(row.cost) }}</b></template></el-table-column><el-table-column label="开始时间" width="170"><template #default="{ row }">{{ fmt(row.started_at) }}</template></el-table-column><el-table-column label="结束时间" width="170"><template #default="{ row }">{{ fmt(row.completed_at) }}</template></el-table-column><el-table-column label="失败/结果" min-width="240"><template #default="{ row }"><span v-if="row.error_message" class="danger-text">{{ row.error_message }}</span><span v-else class="muted-text">{{ row.result?.count ? `生成 ${row.result.count} 道题` : row.result ? '已写入结果' : '—' }}</span></template></el-table-column></el-table><div class="pagination-wrap"><el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="loadData" /></div></section>
  </div>
</template>

<style scoped>
.admin-page{max-width:1500px}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px}.section-title{margin-bottom:0}.refresh-btn{min-height:40px;padding:0 14px}.cost-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:15px}.cost-card{min-height:125px;padding:18px}.cost-card span,.cost-card small{display:block;color:var(--text-muted);font-size:12px}.cost-card strong{display:block;margin:14px 0 6px;color:var(--text-primary);font-size:26px}.cost-card .text-small{font-size:19px}.danger-text{color:var(--danger)!important}.table-card{padding:0;overflow:hidden}.table-toolbar{display:flex;align-items:center;justify-content:space-between;padding:17px 20px;border-bottom:1px solid var(--border);color:var(--text-primary);font-size:14px;font-weight:800}.table-toolbar :deep(.el-select){width:125px}.task-id{color:var(--primary);font-family:monospace;font-size:12px}.stage-dot{display:inline-block;width:7px;height:7px;margin-right:7px;border-radius:50%;background:var(--text-muted)}.stage-dot.completed{background:var(--success)}.stage-dot.failed{background:var(--danger)}.stage-dot.processing{background:var(--warning)}.muted-text{color:var(--text-muted);font-size:12px}.pagination-wrap{display:flex;justify-content:flex-end;padding:16px 20px}@media(max-width:1000px){.cost-summary{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.page-heading{align-items:flex-start;flex-direction:column}.cost-summary{grid-template-columns:1fr}}
</style>
