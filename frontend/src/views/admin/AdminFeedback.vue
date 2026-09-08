<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '../../api'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const status = ref('')
const loading = ref(false)
const drawer = ref(false)
const current = ref<any>(null)
const reply = ref('')
const nextStatus = ref('processing')

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.feedbacks({ page: page.value, pageSize: 20, status: status.value })
    list.value = res.data.list
    total.value = res.data.total
  } catch (error: any) { ElMessage.error(error?.message || '用户反馈加载失败') }
  finally { loading.value = false }
}

function open(row: any) {
  current.value = row
  reply.value = row.admin_reply || ''
  nextStatus.value = row.status === 'pending' ? 'processing' : row.status
  drawer.value = true
}

async function save() {
  try {
    await adminApi.updateFeedback(current.value.id, { status: nextStatus.value, admin_reply: reply.value })
    ElMessage.success('反馈处理结果已保存')
    drawer.value = false
    loadData()
  } catch (error: any) { ElMessage.error(error?.message || '保存失败') }
}

function date(value: string | null) { return value ? new Date(value).toLocaleString('zh-CN') : '—' }
const categoryMap: Record<string, string> = { suggestion: '建议', bug: '问题反馈', content: '内容纠错', other: '其他' }
const statusMap: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
onMounted(loadData)
</script>

<template>
  <div class="page-container admin-page">
    <div class="page-heading"><div><div class="page-kicker">VOICE OF USER</div><h1 class="section-title">反馈与建议</h1><p class="page-subtitle">统一查看用户建议、问题反馈与内容纠错，并回填处理结果。</p></div><span class="count-pill">{{ total }} 条</span></div>
    <section class="glass-card toolbar"><el-select v-model="status" placeholder="全部状态" clearable @change="page = 1; loadData()"><el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" /></el-select><button class="btn-ghost" type="button" @click="loadData">↻ 刷新</button></section>
    <section class="glass-card table-card"><el-table :data="list" v-loading="loading" stripe><el-table-column label="用户" min-width="160"><template #default="{ row }"><b>{{ row.User?.nickname || row.User?.username }}</b><small>{{ row.User?.email }}</small></template></el-table-column><el-table-column label="类型" width="105"><template #default="{ row }">{{ categoryMap[row.category] || row.category }}</template></el-table-column><el-table-column prop="content" label="反馈内容" min-width="350" show-overflow-tooltip /><el-table-column label="提交时间" width="165"><template #default="{ row }">{{ date(row.created_at) }}</template></el-table-column><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'resolved' ? 'success' : row.status === 'pending' ? 'warning' : 'info'" size="small">{{ statusMap[row.status] }}</el-tag></template></el-table-column><el-table-column label="操作" width="85"><template #default="{ row }"><el-button link type="primary" @click="open(row)">处理</el-button></template></el-table-column></el-table><div class="pagination-wrap"><el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="loadData" /></div></section>
    <el-drawer v-model="drawer" title="处理用户反馈" size="520px"><div v-if="current" class="feedback-detail"><span>用户反馈</span><p>{{ current.content }}</p><span>联系方式</span><p>{{ current.contact || current.User?.email || '未提供' }}</p><span>处理状态</span><el-select v-model="nextStatus"><el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" /></el-select><span>回复用户</span><el-input v-model="reply" type="textarea" :rows="6" maxlength="2000" show-word-limit placeholder="填写处理结果或回复" /><el-button type="primary" @click="save">保存处理结果</el-button></div></el-drawer>
  </div>
</template>

<style scoped>
.admin-page{max-width:1500px}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px}.section-title{margin-bottom:0}.count-pill{padding:8px 12px;border-radius:7px;background:var(--surface-muted);color:var(--primary);font-size:12px;font-weight:800}.toolbar{display:flex;align-items:center;justify-content:space-between;padding:14px;margin-bottom:15px}.toolbar :deep(.el-select){width:150px}.table-card{padding:0;overflow:hidden}.table-card b,.table-card small{display:block}.table-card small{margin-top:4px;color:var(--text-muted);font-size:11px}.pagination-wrap{display:flex;justify-content:flex-end;padding:16px 20px}.feedback-detail{display:grid;gap:10px}.feedback-detail>span{margin-top:8px;color:var(--text-muted);font-size:11px}.feedback-detail p{margin:0;padding:13px;border-radius:9px;background:var(--surface-soft);line-height:1.75;white-space:pre-wrap}.feedback-detail .el-button{margin-top:14px}
</style>
