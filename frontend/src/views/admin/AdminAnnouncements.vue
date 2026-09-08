<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '../../api'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const status = ref('')
const loading = ref(false)
const dialog = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ title: '', content: '', announcement_type: 'notice', status: 'draft', expires_at: '' })

async function loadData() {
  loading.value = true
  try { const res: any = await adminApi.announcements({ page: page.value, pageSize: 20, status: status.value }); list.value = res.data.list; total.value = res.data.total }
  catch (error: any) { ElMessage.error(error?.message || '公告列表加载失败') }
  finally { loading.value = false }
}

function create() {
  editingId.value = null
  form.value = { title: '', content: '', announcement_type: 'notice', status: 'draft', expires_at: '' }
  dialog.value = true
}

function edit(row: any) {
  editingId.value = row.id
  form.value = { title: row.title, content: row.content, announcement_type: row.announcement_type, status: row.status, expires_at: row.expires_at || '' }
  dialog.value = true
}

async function save() {
  if (!form.value.title.trim() || !form.value.content.trim()) return ElMessage.warning('请填写公告标题和内容')
  try {
    if (editingId.value) await adminApi.updateAnnouncement(editingId.value, form.value)
    else await adminApi.createAnnouncement(form.value)
    ElMessage.success(form.value.status === 'published' ? '公告已发布' : '公告已保存')
    dialog.value = false
    loadData()
  } catch (error: any) { ElMessage.error(error?.message || '保存公告失败') }
}

async function archive(row: any) {
  try {
    await ElMessageBox.confirm(`确定归档公告“${row.title}”吗？`, '归档公告', { type: 'warning' })
    await adminApi.deleteAnnouncement(row.id)
    ElMessage.success('公告已归档')
    loadData()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error?.message || '归档失败') }
}

function date(value: string | null) { return value ? new Date(value).toLocaleString('zh-CN') : '—' }
const statusMap: Record<string, string> = { draft: '草稿', published: '已发布', archived: '已归档' }
const typeMap: Record<string, string> = { notice: '通知公告', update: '功能更新', system: '系统消息' }
onMounted(loadData)
</script>

<template>
  <div class="page-container admin-page">
    <div class="page-heading"><div><div class="page-kicker">MESSAGE CENTER</div><h1 class="section-title">公告管理</h1><p class="page-subtitle">编辑并发布全站公告，用户端铃铛会展示未读红点并同步已读状态。</p></div><button class="btn-primary" type="button" @click="create">＋ 发布公告</button></div>
    <section class="glass-card toolbar"><el-select v-model="status" placeholder="全部状态" clearable @change="page = 1; loadData()"><el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" /></el-select><span>共 {{ total }} 条公告</span></section>
    <section class="glass-card table-card"><el-table :data="list" v-loading="loading" stripe><el-table-column prop="title" label="标题" min-width="250" /><el-table-column label="类型" width="115"><template #default="{ row }">{{ typeMap[row.announcement_type] }}</template></el-table-column><el-table-column prop="content" label="内容" min-width="330" show-overflow-tooltip /><el-table-column label="发布时间" width="165"><template #default="{ row }">{{ date(row.published_at) }}</template></el-table-column><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">{{ statusMap[row.status] }}</el-tag></template></el-table-column><el-table-column label="操作" width="145"><template #default="{ row }"><el-button link type="primary" @click="edit(row)">编辑</el-button><el-button v-if="row.status !== 'archived'" link type="danger" @click="archive(row)">归档</el-button></template></el-table-column></el-table><div class="pagination-wrap"><el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="loadData" /></div></section>
    <el-dialog v-model="dialog" :title="editingId ? '编辑公告' : '新建公告'" width="620px"><el-form label-position="top"><el-form-item label="公告标题"><el-input v-model="form.title" maxlength="200" show-word-limit /></el-form-item><div class="form-row"><el-form-item label="公告类型"><el-select v-model="form.announcement_type"><el-option v-for="(label, key) in typeMap" :key="key" :label="label" :value="key" /></el-select></el-form-item><el-form-item label="发布状态"><el-select v-model="form.status"><el-option label="保存草稿" value="draft" /><el-option label="立即发布" value="published" /></el-select></el-form-item></div><el-form-item label="公告内容"><el-input v-model="form.content" type="textarea" :rows="8" maxlength="10000" show-word-limit /></el-form-item><el-form-item label="失效时间（可选）"><el-date-picker v-model="form.expires_at" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="不设置则长期有效" /></el-form-item></el-form><template #footer><el-button @click="dialog = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template></el-dialog>
  </div>
</template>

<style scoped>
.admin-page{max-width:1500px}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px}.section-title{margin-bottom:0}.toolbar{display:flex;align-items:center;justify-content:space-between;padding:14px;margin-bottom:15px;color:var(--text-muted);font-size:12px}.toolbar :deep(.el-select){width:150px}.table-card{padding:0;overflow:hidden}.pagination-wrap{display:flex;justify-content:flex-end;padding:16px 20px}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-row :deep(.el-select),:deep(.el-date-editor){width:100%}@media(max-width:650px){.page-heading{align-items:stretch;flex-direction:column}.form-row{grid-template-columns:1fr}}
</style>
