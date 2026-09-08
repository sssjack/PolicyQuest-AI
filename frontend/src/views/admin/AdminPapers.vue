<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminApi } from '../../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const filters = ref({ keyword: '', practice_type: '', year: '' })
const paperDialog = ref(false)
const paperEditingId = ref<number | null>(null)
const paperForm = ref<any>({})
const drawer = ref(false)
const detail = ref<any>(null)
const materialDialog = ref(false)
const materialEditingId = ref<number | null>(null)
const materialForm = ref<any>({})
const questionDialog = ref(false)
const questionEditingId = ref<number | null>(null)
const questionForm = ref<any>({})

function emptyPaper() {
  return { paper_key: '', practice_type: 'essay', title: '', short_title: '', system: 'provincial', system_label: '省考', region: '全国', year: new Date().getFullYear(), category: '', paper_code: '', source_name: '', source_url: '', release_date: '', difficulty: '中等', suggested_minutes: 30, status: 'approved' }
}

function loadData() {
  loading.value = true
  adminApi.papers({ page: page.value, pageSize: 20, ...filters.value }).then((res: any) => {
    list.value = res.data.list
    total.value = res.data.total
  }).catch((error: any) => ElMessage.error(error?.message || '真题数据加载失败')).finally(() => { loading.value = false })
}

function reset() { filters.value = { keyword: '', practice_type: '', year: '' }; page.value = 1; loadData() }
function fmt(value: string | null) { return value ? new Date(value).toLocaleDateString('zh-CN') : '—' }

function createPaper() { paperEditingId.value = null; paperForm.value = emptyPaper(); paperDialog.value = true }
function editPaper(row: any) { paperEditingId.value = row.id; paperForm.value = { ...emptyPaper(), ...row }; paperDialog.value = true }
async function savePaper() {
  if (!paperForm.value.paper_key?.trim() || !paperForm.value.title?.trim()) return ElMessage.warning('请填写真题编号和标题')
  try {
    if (paperEditingId.value) await adminApi.updatePaper(paperEditingId.value, paperForm.value)
    else await adminApi.createPaper(paperForm.value)
    ElMessage.success(paperEditingId.value ? '真题已更新' : '真题已创建')
    paperDialog.value = false
    loadData()
  } catch (error: any) { ElMessage.error(error?.message || '保存真题失败') }
}
async function archivePaper(row: any) {
  try {
    await ElMessageBox.confirm(`确定归档“${row.title}”吗？历史作答不会被删除。`, '归档真题', { type: 'warning' })
    await adminApi.deletePaper(row.id)
    ElMessage.success('真题已归档')
    loadData()
  } catch (error: any) { if (error !== 'cancel') ElMessage.error(error?.message || '归档失败') }
}
async function openDetail(row: any) {
  drawer.value = true
  detail.value = null
  try { const res: any = await adminApi.paperDetail(row.id); detail.value = res.data }
  catch (error: any) { ElMessage.error(error?.message || '真题详情加载失败') }
}
function addMaterial() { materialEditingId.value = null; materialForm.value = { material_no: (detail.value?.PaperMaterials?.length || 0) + 1, title: '', summary: '', content: '', source_url: '' }; materialDialog.value = true }
function editMaterial(row: any) { materialEditingId.value = row.id; materialForm.value = { ...row }; materialDialog.value = true }
async function saveMaterial() {
  try {
    if (materialEditingId.value) await adminApi.updateMaterial(materialEditingId.value, materialForm.value)
    else await adminApi.createMaterial(detail.value.id, materialForm.value)
    ElMessage.success('材料已保存'); materialDialog.value = false; await openDetail(detail.value); loadData()
  } catch (error: any) { ElMessage.error(error?.message || '保存材料失败') }
}
async function deleteMaterial(row: any) {
  try { await ElMessageBox.confirm(`确定删除材料${row.material_no}吗？`, '删除材料', { type: 'warning' }); await adminApi.deleteMaterial(row.id); ElMessage.success('材料已删除'); await openDetail(detail.value); loadData() }
  catch (error: any) { if (error !== 'cancel') ElMessage.error(error?.message || '删除材料失败') }
}
function addQuestion() { questionEditingId.value = null; questionForm.value = { question_no: (detail.value?.PaperQuestions?.length || 0) + 1, question_type: detail.value?.practice_type === 'interview' ? 'interview_analysis' : 'summary', title: '', prompt: '', score: 20, word_limit: 300, suggested_minutes: 30, sample_answer: '', source_url: '', status: 'approved' }; questionDialog.value = true }
function editQuestion(row: any) { questionEditingId.value = row.id; questionForm.value = { ...row }; questionDialog.value = true }
async function saveQuestion() {
  try {
    if (questionEditingId.value) await adminApi.updatePaperQuestion(questionEditingId.value, questionForm.value)
    else await adminApi.createPaperQuestion(detail.value.id, questionForm.value)
    ElMessage.success('题目已保存'); questionDialog.value = false; await openDetail(detail.value); loadData()
  } catch (error: any) { ElMessage.error(error?.message || '保存题目失败') }
}
async function deleteQuestion(row: any) {
  try { await ElMessageBox.confirm(`确定删除第${row.question_no}题吗？`, '删除题目', { type: 'warning' }); await adminApi.deletePaperQuestion(row.id); ElMessage.success('题目已删除'); await openDetail(detail.value); loadData() }
  catch (error: any) { if (error !== 'cancel') ElMessage.error(error?.message || '删除题目失败') }
}
onMounted(loadData)
</script>

<template>
  <div class="page-container admin-page">
    <div class="page-heading"><div><div class="page-kicker">CONTENT ASSET CONTROL</div><h1 class="section-title">真题与材料</h1><p class="page-subtitle">省份、年份、卷别、材料和单题统一维护，支持完整增删改查。</p></div><div class="heading-actions"><span class="count-pill">{{ total }} 套题组</span><el-button type="primary" @click="createPaper">＋ 新建真题</el-button></div></div>
    <section class="glass-card filter-card"><el-input v-model="filters.keyword" placeholder="搜索卷名、地区或编号" clearable @change="page = 1; loadData()" /><el-select v-model="filters.practice_type" placeholder="训练类型" clearable @change="page = 1; loadData()"><el-option label="申论" value="essay" /><el-option label="面试" value="interview" /></el-select><el-input v-model="filters.year" placeholder="年份" clearable style="width:120px" @change="page = 1; loadData()" /><button class="btn-ghost" @click="reset">重置</button></section>
    <section class="glass-card table-card"><el-table :data="list" v-loading="loading" stripe>
      <el-table-column label="题组" min-width="270"><template #default="{ row }"><div class="paper-title"><b>{{ row.title }}</b><small>{{ row.paper_key }}</small></div></template></el-table-column>
      <el-table-column label="地区 / 年份" width="135"><template #default="{ row }"><b>{{ row.region || '全国' }}</b><small class="muted-block">{{ row.year }} · {{ row.system_label || row.system }}</small></template></el-table-column>
      <el-table-column label="卷别" width="120"><template #default="{ row }"><span class="chip">{{ row.category || (row.practice_type === 'essay' ? '申论' : '面试') }}</span></template></el-table-column>
      <el-table-column label="材料" width="100"><template #default="{ row }"><strong>{{ row.material_count }}</strong><small class="muted-block">篇</small></template></el-table-column>
      <el-table-column label="单题" width="100"><template #default="{ row }"><strong>{{ row.question_count }}</strong><small class="muted-block">道</small></template></el-table-column>
      <el-table-column label="来源" min-width="150"><template #default="{ row }"><a v-if="row.source_url" :href="row.source_url" target="_blank" rel="noopener" class="source-link">{{ row.source_name || '查看来源' }} ↗</a><span v-else>—</span></template></el-table-column>
      <el-table-column label="导入时间" width="115"><template #default="{ row }">{{ fmt(row.imported_at) }}</template></el-table-column>
      <el-table-column label="状态" width="85"><template #default="{ row }"><el-tag :type="row.status === 'approved' ? 'success' : 'info'" size="small">{{ row.status === 'approved' ? '已发布' : '已归档' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="180" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openDetail(row)">内容</el-button><el-button link type="primary" @click="editPaper(row)">编辑</el-button><el-button v-if="row.status !== 'archived'" link type="danger" @click="archivePaper(row)">归档</el-button></template></el-table-column>
    </el-table><div class="pagination-wrap"><el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="loadData" /></div></section>
    <el-drawer v-model="drawer" title="真题内容管理" size="78%">
      <div v-if="!detail" class="drawer-loading">正在加载…</div>
      <template v-else>
        <div class="detail-head"><div><h2>{{ detail.title }}</h2><p>{{ detail.region }} · {{ detail.year }} · {{ detail.paper_key }}</p></div><el-button type="primary" plain @click="editPaper(detail)">编辑真题信息</el-button></div>
        <el-tabs>
          <el-tab-pane :label="`材料（${detail.PaperMaterials?.length || 0}）`"><div class="tab-toolbar"><el-button type="primary" @click="addMaterial">＋ 新增材料</el-button></div><el-table :data="detail.PaperMaterials || []" border><el-table-column prop="material_no" label="序号" width="70" /><el-table-column prop="title" label="标题" min-width="170" /><el-table-column prop="summary" label="摘要" min-width="260" show-overflow-tooltip /><el-table-column prop="word_count" label="字数" width="80" /><el-table-column label="操作" width="120"><template #default="{ row }"><el-button link type="primary" @click="editMaterial(row)">编辑</el-button><el-button link type="danger" @click="deleteMaterial(row)">删除</el-button></template></el-table-column></el-table></el-tab-pane>
          <el-tab-pane :label="`题目（${detail.PaperQuestions?.length || 0}）`"><div class="tab-toolbar"><el-button type="primary" @click="addQuestion">＋ 新增题目</el-button></div><el-table :data="detail.PaperQuestions || []" border><el-table-column prop="question_no" label="题号" width="70" /><el-table-column prop="title" label="题目" min-width="260" show-overflow-tooltip /><el-table-column prop="question_type" label="题型" width="125" /><el-table-column prop="score" label="分值" width="75" /><el-table-column prop="word_limit" label="字数" width="75" /><el-table-column label="操作" width="120"><template #default="{ row }"><el-button link type="primary" @click="editQuestion(row)">编辑</el-button><el-button link type="danger" @click="deleteQuestion(row)">删除</el-button></template></el-table-column></el-table></el-tab-pane>
        </el-tabs>
      </template>
    </el-drawer>
    <el-dialog v-model="paperDialog" :title="paperEditingId ? '编辑真题' : '新建真题'" width="760px"><el-form label-position="top"><div class="form-grid"><el-form-item label="真题编号"><el-input v-model="paperForm.paper_key" /></el-form-item><el-form-item label="训练类型"><el-select v-model="paperForm.practice_type"><el-option label="申论" value="essay" /><el-option label="面试" value="interview" /></el-select></el-form-item><el-form-item label="完整标题" class="span-2"><el-input v-model="paperForm.title" /></el-form-item><el-form-item label="地区"><el-input v-model="paperForm.region" /></el-form-item><el-form-item label="年份"><el-input-number v-model="paperForm.year" :min="2000" :max="2100" /></el-form-item><el-form-item label="系统"><el-input v-model="paperForm.system_label" /></el-form-item><el-form-item label="卷别"><el-input v-model="paperForm.category" /></el-form-item><el-form-item label="来源名称"><el-input v-model="paperForm.source_name" /></el-form-item><el-form-item label="来源 URL"><el-input v-model="paperForm.source_url" /></el-form-item><el-form-item label="建议用时（分钟）"><el-input-number v-model="paperForm.suggested_minutes" :min="1" /></el-form-item><el-form-item label="状态"><el-select v-model="paperForm.status"><el-option label="已发布" value="approved" /><el-option label="已归档" value="archived" /></el-select></el-form-item></div></el-form><template #footer><el-button @click="paperDialog = false">取消</el-button><el-button type="primary" @click="savePaper">保存</el-button></template></el-dialog>
    <el-dialog v-model="materialDialog" :title="materialEditingId ? '编辑材料' : '新增材料'" width="720px"><el-form label-position="top"><div class="form-grid"><el-form-item label="材料序号"><el-input-number v-model="materialForm.material_no" :min="1" /></el-form-item><el-form-item label="标题"><el-input v-model="materialForm.title" /></el-form-item><el-form-item label="摘要" class="span-2"><el-input v-model="materialForm.summary" /></el-form-item><el-form-item label="正文" class="span-2"><el-input v-model="materialForm.content" type="textarea" :rows="12" /></el-form-item><el-form-item label="来源 URL" class="span-2"><el-input v-model="materialForm.source_url" /></el-form-item></div></el-form><template #footer><el-button @click="materialDialog = false">取消</el-button><el-button type="primary" @click="saveMaterial">保存</el-button></template></el-dialog>
    <el-dialog v-model="questionDialog" :title="questionEditingId ? '编辑题目' : '新增题目'" width="760px"><el-form label-position="top"><div class="form-grid"><el-form-item label="题号"><el-input-number v-model="questionForm.question_no" :min="1" /></el-form-item><el-form-item label="题型"><el-input v-model="questionForm.question_type" /></el-form-item><el-form-item label="题目标题" class="span-2"><el-input v-model="questionForm.title" /></el-form-item><el-form-item label="题干" class="span-2"><el-input v-model="questionForm.prompt" type="textarea" :rows="6" /></el-form-item><el-form-item label="分值"><el-input-number v-model="questionForm.score" :min="1" /></el-form-item><el-form-item label="字数上限"><el-input-number v-model="questionForm.word_limit" :min="0" /></el-form-item><el-form-item label="建议用时"><el-input-number v-model="questionForm.suggested_minutes" :min="1" /></el-form-item><el-form-item label="状态"><el-select v-model="questionForm.status"><el-option label="已发布" value="approved" /><el-option label="已归档" value="archived" /></el-select></el-form-item><el-form-item label="参考答案" class="span-2"><el-input v-model="questionForm.sample_answer" type="textarea" :rows="7" /></el-form-item></div></el-form><template #footer><el-button @click="questionDialog = false">取消</el-button><el-button type="primary" @click="saveQuestion">保存</el-button></template></el-dialog>
  </div>
</template>

<style scoped>
.admin-page { max-width: 1500px; }.page-heading,.heading-actions,.detail-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}.page-heading{margin-bottom:24px}.heading-actions{align-items:center}.section-title{margin-bottom:0}.count-pill{padding:8px 12px;border-radius:7px;background:var(--surface-muted);color:var(--primary);font-size:12px;font-weight:800;white-space:nowrap}.filter-card{display:flex;gap:10px;padding:14px;margin-bottom:15px}.filter-card :deep(.el-input:first-child){max-width:330px}.filter-card :deep(.el-select){width:130px}.filter-card .btn-ghost{min-height:38px;padding:0 14px}.table-card{padding:0;overflow:hidden}.paper-title b,.paper-title small{display:block}.paper-title b{color:var(--text-primary);font-size:13px}.paper-title small{margin-top:4px;color:var(--text-muted);font-size:11px}.muted-block{display:block;color:var(--text-muted);font-size:11px}.chip{display:inline-flex;padding:4px 8px;border-radius:5px;background:var(--surface-muted);color:var(--primary);font-size:11px;font-weight:800}.source-link{color:var(--primary);font-size:12px}.pagination-wrap{display:flex;justify-content:flex-end;padding:16px 20px}.drawer-loading{padding:40px;color:var(--text-muted);text-align:center}.detail-head{align-items:center;margin-bottom:18px}.detail-head h2{margin:0;font-size:18px}.detail-head p{margin:5px 0 0;color:var(--text-muted);font-size:12px}.tab-toolbar{display:flex;justify-content:flex-end;margin-bottom:12px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}.span-2{grid-column:1/-1}.form-grid :deep(.el-select),.form-grid :deep(.el-input-number){width:100%}@media(max-width:700px){.page-heading,.filter-card{align-items:stretch;flex-direction:column}.heading-actions{align-items:stretch}.filter-card :deep(.el-input),.filter-card :deep(.el-select){width:100%;max-width:none!important}.form-grid{grid-template-columns:1fr}.span-2{grid-column:auto}}
</style>
