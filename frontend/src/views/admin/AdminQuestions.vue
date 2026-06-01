<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '../../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const filters = ref({ status: '', question_type: '', difficulty: '' })

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

onMounted(loadData)

const statusMap: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已驳回', archived: '已归档' }
const statusColor: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger', archived: 'info' }
const typeLabels: Record<string, string> = {
  verbal_main_idea: '主旨概括', verbal_intent: '意图判断', verbal_detail: '细节理解',
  verbal_fill: '逻辑填空', verbal_word: '词句理解', verbal_title: '标题填入',
  verbal_order: '语句排序', verbal_connection: '语句衔接',
  politics_single: '单选题', politics_multi: '多选题', politics_judge: '判断题',
  politics_current: '时政热点', politics_policy: '政策理解', politics_document: '文件精神',
  interview_analysis: '综合分析', interview_organize: '组织管理',
  interview_emergency: '应急应变', interview_policy: '政策落实',
  interview_tax: '税务专项', interview_grassroots: '基层治理',
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

    <el-table :data="list" v-loading="loading" stripe style="width:100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="题型" width="100">
        <template #default="{ row }"><span>{{ typeLabels[row.question_type] || row.question_type }}</span></template>
      </el-table-column>
      <el-table-column label="题干" min-width="300">
        <template #default="{ row }"><span>{{ row.stem?.substring(0, 80) }}{{ row.stem?.length > 80 ? '...' : '' }}</span></template>
      </el-table-column>
      <el-table-column label="难度" width="80">
        <template #default="{ row }">
          <el-tag :type="row.difficulty === 'easy' ? 'success' : row.difficulty === 'hard' ? 'danger' : 'warning'" size="small">
            {{ row.difficulty === 'easy' ? '简单' : row.difficulty === 'hard' ? '困难' : '中等' }}
          </el-tag>
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
  </div>
</template>
