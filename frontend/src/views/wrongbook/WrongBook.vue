<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { wrongbookApi } from '../../api'
import { ElMessage } from 'element-plus'

const wrongList = ref<any[]>([])
const loading = ref(true)
const page = ref(1)
const total = ref(0)

async function loadWrong() {
  loading.value = true
  try {
    const res: any = await wrongbookApi.list({ page: page.value, pageSize: 20 })
    wrongList.value = res.data.list
    total.value = res.data.total
  } catch(e) {} finally { loading.value = false }
}

async function markMastered(id: number) {
  try {
    await wrongbookApi.master(id)
    ElMessage.success('已标记掌握')
    loadWrong()
  } catch(e) {}
}

async function removeWrong(id: number) {
  try {
    await wrongbookApi.remove(id)
    ElMessage.success('已移除')
    loadWrong()
  } catch(e) {}
}

onMounted(loadWrong)

const typeLabels: Record<string, string> = {
  verbal_main_idea: '主旨概括', verbal_intent: '意图判断', verbal_detail: '细节理解',
  verbal_fill: '逻辑填空', politics_single: '单选题', politics_judge: '判断题',
  politics_current: '时政热点', politics_policy: '政策理解',
  interview_analysis: '综合分析', interview_policy: '政策落实',
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="section-title">错题本</h1>
      <span style="color:var(--text-muted);font-size:14px">共 {{ total }} 道错题待复习</span>
    </div>

    <div v-if="loading" style="text-align:center;padding:60px;color:var(--text-muted)">加载中...</div>

    <div v-else-if="wrongList.length === 0" style="text-align:center;padding:80px">
      <div style="font-size:48px;margin-bottom:16px">🎉</div>
      <p style="color:var(--text-muted)">暂无错题，继续保持！</p>
    </div>

    <div v-else class="wrong-list">
      <div v-for="item in wrongList" :key="item.id" class="wrong-card glass-card">
        <div class="wrong-header">
          <div class="wrong-meta">
            <span class="wrong-type">{{ typeLabels[item.Question?.question_type] || item.Question?.question_type }}</span>
            <span class="wrong-count">错 {{ item.wrong_count }} 次</span>
          </div>
          <div class="wrong-actions">
            <button class="btn-ghost" style="padding:4px 12px;font-size:12px" @click="markMastered(item.id)">已掌握</button>
            <button class="btn-ghost" style="padding:4px 12px;font-size:12px;color:var(--danger);border-color:rgba(239,68,68,0.3)" @click="removeWrong(item.id)">移除</button>
          </div>
        </div>
        <div class="wrong-stem">{{ item.Question?.stem?.substring(0, 200) }}{{ item.Question?.stem?.length > 200 ? '...' : '' }}</div>
        <div v-if="item.Question?.answer" class="wrong-answer">
          <span>正确答案：</span><strong>{{ item.Question.answer }}</strong>
        </div>
      </div>
    </div>

    <div v-if="total > 20" style="display:flex;justify-content:center;margin-top:24px">
      <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next" @current-change="loadWrong" />
    </div>
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.wrong-list { display: flex; flex-direction: column; gap: 16px; }
.wrong-card { padding: 20px; }
.wrong-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.wrong-meta { display: flex; gap: 8px; align-items: center; }
.wrong-type { padding: 4px 10px; border-radius: 6px; font-size: 12px; background: rgba(99,102,241,0.15); color: var(--primary-light); }
.wrong-count { font-size: 12px; color: var(--danger); }
.wrong-actions { display: flex; gap: 8px; }
.wrong-stem { font-size: 14px; line-height: 1.7; color: var(--text-secondary); margin-bottom: 8px; }
.wrong-answer { font-size: 13px; color: var(--success); }
.wrong-answer strong { margin-left: 4px; }
</style>
