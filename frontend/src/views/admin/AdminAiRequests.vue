<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '../../api'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const status = ref('')
const detail = ref<any>(null)
const drawer = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.aiRequestLogs({ page: page.value, pageSize: 20, status: status.value })
    list.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error?.message || 'AI 请求日志加载失败')
  } finally {
    loading.value = false
  }
}

async function openDetail(row: any) {
  drawer.value = true
  detail.value = null
  try {
    const res: any = await adminApi.aiRequestLogDetail(row.id)
    detail.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || 'AI 请求详情加载失败')
  }
}

function formatJson(value: string | null) {
  if (!value) return '—'
  try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value }
}

function date(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '—'
}

onMounted(loadData)
</script>

<template>
  <div class="page-container admin-page">
    <div class="page-heading">
      <div><div class="page-kicker">AI REQUEST AUDIT</div><h1 class="section-title">AI 请求日志</h1><p class="page-subtitle">逐次查看请求地址、参数、原始返回、状态和耗时，快速还原批改故障现场。</p></div>
      <button class="btn-ghost" type="button" @click="loadData">↻ 刷新</button>
    </div>
    <section class="glass-card filter-card">
      <el-select v-model="status" placeholder="全部状态" clearable @change="page = 1; loadData()"><el-option label="成功" value="success" /><el-option label="失败" value="failed" /><el-option label="请求中" value="pending" /></el-select>
      <span>共 {{ total }} 次请求</span>
    </section>
    <section class="glass-card table-card">
      <el-table :data="list" v-loading="loading" stripe @row-click="openDetail">
        <el-table-column label="时间" width="165"><template #default="{ row }">{{ date(row.created_at) }}</template></el-table-column>
        <el-table-column prop="purpose" label="业务用途" min-width="165" />
        <el-table-column label="模型 / URL" min-width="270"><template #default="{ row }"><b>{{ row.model || '—' }}</b><small>{{ row.url }}</small></template></el-table-column>
        <el-table-column label="关联作答" width="135"><template #default="{ row }"><span v-if="row.attempt_id">整卷 #{{ row.attempt_id }}</span><small v-if="row.attempt_answer_id">单题 #{{ row.attempt_answer_id }}</small><span v-if="!row.attempt_id">—</span></template></el-table-column>
        <el-table-column label="耗时" width="90"><template #default="{ row }">{{ row.duration_ms }} ms</template></el-table-column>
        <el-table-column label="状态" width="95"><template #default="{ row }"><el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">{{ row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : '请求中' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="80"><template #default="{ row }"><el-button link type="primary" @click.stop="openDetail(row)">详情</el-button></template></el-table-column>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="loadData" /></div>
    </section>
    <el-drawer v-model="drawer" title="AI 请求详情" size="72%">
      <div v-if="!detail" class="loading-detail">正在加载…</div>
      <div v-else class="request-detail">
        <el-descriptions :column="2" border><el-descriptions-item label="业务用途">{{ detail.purpose }}</el-descriptions-item><el-descriptions-item label="模型">{{ detail.model }}</el-descriptions-item><el-descriptions-item label="请求地址" :span="2">{{ detail.url }}</el-descriptions-item><el-descriptions-item label="HTTP 状态">{{ detail.http_status || '—' }}</el-descriptions-item><el-descriptions-item label="耗时">{{ detail.duration_ms }} ms</el-descriptions-item><el-descriptions-item label="错误信息" :span="2">{{ detail.error_message || '—' }}</el-descriptions-item></el-descriptions>
        <h3>请求参数</h3><pre>{{ formatJson(detail.request_body) }}</pre>
        <h3>原始返回</h3><pre>{{ formatJson(detail.response_body) }}</pre>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.admin-page{max-width:1500px}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px}.section-title{margin-bottom:0}.filter-card{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;margin-bottom:15px;color:var(--text-muted);font-size:12px}.filter-card :deep(.el-select){width:150px}.table-card{padding:0;overflow:hidden}.table-card b,.table-card small{display:block}.table-card small{max-width:440px;margin-top:4px;overflow:hidden;color:var(--text-muted);font-size:10px;text-overflow:ellipsis;white-space:nowrap}.pagination-wrap{display:flex;justify-content:flex-end;padding:16px 20px}.request-detail h3{margin:24px 0 9px;font-size:14px}.request-detail pre{max-height:45vh;padding:16px;overflow:auto;border:1px solid var(--border);border-radius:10px;background:#0f1d2e;color:#d9e6f5;font:12px/1.65 Consolas,monospace;white-space:pre-wrap;word-break:break-all}.loading-detail{padding:40px;color:var(--text-muted);text-align:center}
</style>
