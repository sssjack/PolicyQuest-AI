<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '../../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const filters = ref({ status: '', question_type: '', difficulty: '' })

const detailVisible = ref(false)
const detailQuestion = ref<any>(null)

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.questions({ page: page.value, pageSize: 20, ...filters.value })
    list.value = res.data.list; total.value = res.data.total
  } catch(e) {} finally { loading.value = false }
}

async function approve(id: number) {
  await adminApi.approveQuestion(id); ElMessage.success('已审核通过'); loadData()
}
async function reject(id: number) {
  await adminApi.rejectQuestion(id); ElMessage.success('已驳回'); loadData()
}
async function deleteQ(id: number) {
  await ElMessageBox.confirm('确定删除这道题目？', '确认')
  await adminApi.deleteQuestion(id); ElMessage.success('已删除'); loadData()
}
async function batchApprove() {
  const pending = list.value.filter(q => q.status === 'pending').map(q => q.id)
  if (!pending.length) return ElMessage.warning('没有待审核题目')
  await adminApi.batchApprove(pending); ElMessage.success(`已批量审核 ${pending.length} 道题目`); loadData()
}

function showDetail(row: any) {
  detailQuestion.value = row
  detailVisible.value = true
}

onMounted(loadData)

const statusMap: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已驳回', archived: '已归档' }
const statusColor: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger', archived: 'info' }
const diffMap: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
const diffColor: Record<string, string> = { easy: 'success', medium: 'warning', hard: 'danger' }
const typeLabels: Record<string, string> = {
  verbal_main_idea: '主旨概括', verbal_intent: '意图判断', verbal_detail: '细节理解',
  verbal_fill: '逻辑填空', verbal_word: '词句理解', verbal_title: '标题填入',
  verbal_order: '语句排序', verbal_connection: '语句衔接',
  politics_single: '单选题', politics_multi: '多选题', politics_judge: '判断题',
  politics_current: '时政热点', politics_policy: '政策理解', politics_document: '文件精神',
  interview_analysis: '综合分析', interview_organize: '组织管理',
  interview_emergency: '应急应变', interview_interpersonal: '人际沟通',
  interview_policy: '政策落实', interview_tax: '税务专项', interview_grassroots: '基层治理',
}
</script>

<template>
  <div class="page-container">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <h1 class="section-title" style="margin:0">题库管理</h1>
      <el-button type="primary" @click="batchApprove">批量审核</el-button>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:20px">
      <el-select v-model="filters.status" placeholder="审核状态" clearable style="width:140px" @change="page=1;loadData()">
        <el-option label="待审核" value="pending" /><el-option label="已通过" value="approved" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      <el-select v-model="filters.difficulty" placeholder="难度" clearable style="width:120px" @change="page=1;loadData()">
        <el-option label="简单" value="easy" /><el-option label="中等" value="medium" /><el-option label="困难" value="hard" />
      </el-select>
    </div>

    <el-table :data="list" v-loading="loading" style="width:100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="题型" width="100">
        <template #default="{ row }"><span>{{ typeLabels[row.question_type] || row.question_type }}</span></template>
      </el-table-column>
      <el-table-column label="题干" min-width="300">
        <template #default="{ row }">
          <a class="link-title" @click.prevent="showDetail(row)">{{ row.stem?.substring(0, 80) }}{{ row.stem?.length > 80 ? '...' : '' }}</a>
        </template>
      </el-table-column>
      <el-table-column label="难度" width="80">
        <template #default="{ row }">
          <el-tag :type="(diffColor[row.difficulty] || 'info') as any" size="small">{{ diffMap[row.difficulty] || row.difficulty }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><el-tag :type="statusColor[row.status] as any" size="small">{{ statusMap[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status==='pending'" type="success" size="small" @click="approve(row.id)">通过</el-button>
          <el-button v-if="row.status==='pending'" type="warning" size="small" @click="reject(row.id)">驳回</el-button>
          <el-button type="danger" size="small" @click="deleteQ(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="display:flex;justify-content:center;margin-top:20px">
      <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="loadData" />
    </div>

    <el-dialog v-model="detailVisible" title="题目详情" width="700px" destroy-on-close>
      <div v-if="detailQuestion" class="q-detail">
        <div class="q-detail-meta">
          <el-tag size="small">{{ typeLabels[detailQuestion.question_type] || detailQuestion.question_type }}</el-tag>
          <el-tag :type="(diffColor[detailQuestion.difficulty] || 'info') as any" size="small">{{ diffMap[detailQuestion.difficulty] || detailQuestion.difficulty }}</el-tag>
          <el-tag :type="statusColor[detailQuestion.status] as any" size="small">{{ statusMap[detailQuestion.status] }}</el-tag>
        </div>
        <div class="q-detail-stem">{{ detailQuestion.stem }}</div>
        <div v-if="detailQuestion.options && Object.keys(detailQuestion.options).length" class="q-detail-options">
          <div v-for="(text, key) in detailQuestion.options" :key="key" class="q-opt"
            :class="{ correct: String(detailQuestion.answer).trim().toUpperCase() === String(key).trim().toUpperCase() }">
            <span class="q-opt-key">{{ key }}</span>
            <span>{{ text }}</span>
            <span v-if="String(detailQuestion.answer).trim().toUpperCase() === String(key).trim().toUpperCase()" class="q-opt-badge">正确答案</span>
          </div>
        </div>
        <div v-else class="q-detail-answer">
          <h4>参考答案</h4>
          <pre>{{ detailQuestion.answer }}</pre>
        </div>
        <div v-if="detailQuestion.analysis" class="q-detail-analysis">
          <h4>解析</h4>
          <pre>{{ detailQuestion.analysis }}</pre>
        </div>
        <div v-if="detailQuestion.knowledge_points?.length" class="q-detail-kps">
          <el-tag v-for="kp in detailQuestion.knowledge_points" :key="kp" size="small" type="info" style="margin:0 4px 4px 0">{{ kp }}</el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.link-title { color: var(--primary-light); cursor: pointer; text-decoration: none; }
.link-title:hover { text-decoration: underline; }
.q-detail-meta { display: flex; gap: 8px; margin-bottom: 16px; }
.q-detail-stem { font-size: 15px; line-height: 1.8; white-space: pre-wrap; margin-bottom: 20px; padding: 16px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); }
.q-detail-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.q-opt { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
.q-opt.correct { border-color: var(--success); background: rgba(16,185,129,0.08); }
.q-opt-key { width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
.q-opt-badge { margin-left: auto; font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(16,185,129,0.15); color: var(--success); }
.q-detail-answer h4, .q-detail-analysis h4 { font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; }
.q-detail-answer pre, .q-detail-analysis pre { font-size: 14px; line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap; font-family: inherit; }
.q-detail-analysis { padding: 16px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); margin-bottom: 16px; }
.q-detail-kps { margin-top: 12px; }
</style>
