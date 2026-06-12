<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { wrongbookApi, practiceApi } from '../../api'

const router = useRouter()
const wrongList = ref<any[]>([])
const loading = ref(true)
const practiceLoading = ref(false)
const page = ref(1)
const total = ref(0)
const order = ref('wrong_count')

async function loadWrong() {
  loading.value = true
  try {
    const res: any = await wrongbookApi.list({ page: page.value, pageSize: 20, order: order.value })
    wrongList.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    // Empty state is shown below.
  } finally {
    loading.value = false
  }
}

async function markMastered(id: number) {
  try {
    await wrongbookApi.master(id)
    ElMessage.success('已标记掌握')
    loadWrong()
  } catch (e) {}
}

async function removeWrong(id: number) {
  try {
    await wrongbookApi.remove(id)
    ElMessage.success('已移除')
    loadWrong()
  } catch (e) {}
}

async function startWrongPractice(practiceOrder: string) {
  practiceLoading.value = true
  try {
    const count = Math.min(total.value, 20)
    if (count === 0) {
      ElMessage.warning('暂无错题可练习')
      return
    }
    const res: any = await practiceApi.start({ session_type: 'wrong', count, order: practiceOrder })
    router.push(`/app/practice/${res.data.session_id}?mode=wrongbook`)
  } catch (e: any) {
    ElMessage.error(e.message || '开始错题练习失败')
  } finally {
    practiceLoading.value = false
  }
}

function changeOrder(newOrder: string) {
  order.value = newOrder
  page.value = 1
  loadWrong()
}

onMounted(loadWrong)

const typeLabels: Record<string, string> = {
  verbal_main_idea: '主旨概括', verbal_intent: '意图判断', verbal_detail: '细节理解',
  verbal_title: '标题填入', verbal_order: '语句排序', verbal_connection: '语句衔接',
  verbal_fill: '逻辑填空', verbal_word: '词句理解',
  politics_single: '单选题', politics_multi: '多选题', politics_judge: '判断题',
  politics_fill: '填空题', politics_short: '简答题', politics_policy: '政策理解',
  politics_current: '时政热点', politics_document: '文件精神',
  interview_analysis: '综合分析', interview_organize: '组织管理', interview_emergency: '应急应变',
  interview_interpersonal: '人际沟通', interview_simulate: '现场模拟', interview_position: '岗位认知',
  interview_policy: '政策落实', interview_tax: '税务专项', interview_grassroots: '基层治理', interview_youth: '青年成长',
}

const subtypeLabels: Record<string, string> = {
  verbal_fill: '逻辑填空', verbal_word: '逻辑填空',
  verbal_main_idea: '片段阅读', verbal_intent: '片段阅读', verbal_detail: '片段阅读',
  verbal_title: '语句表达', verbal_order: '语句表达', verbal_connection: '语句表达',
}
</script>

<template>
  <div class="wrongbook page-container">
    <section class="wrong-hero">
      <div>
        <p class="page-kicker">Review Center</p>
        <h1 class="page-title">错题本</h1>
        <p class="page-subtitle">把错题按照错误次数、时间和随机顺序组织起来，优先解决最影响得分的薄弱点。</p>
      </div>
      <div class="wrong-total">
        <strong>{{ total }}</strong>
        <span>待复习</span>
      </div>
    </section>

    <section class="actions-bar glass-card">
      <div class="order-group">
        <span>排序</span>
        <button type="button" class="order-btn" :class="{ active: order === 'wrong_count' }" @click="changeOrder('wrong_count')">错误次数</button>
        <button type="button" class="order-btn" :class="{ active: order === 'chronological' }" @click="changeOrder('chronological')">时间倒序</button>
        <button type="button" class="order-btn" :class="{ active: order === 'random' }" @click="changeOrder('random')">随机顺序</button>
      </div>
      <div class="practice-actions">
        <button class="btn-primary" type="button" :disabled="practiceLoading || total === 0" @click="startWrongPractice('random')">
          {{ practiceLoading ? '组卷中...' : '随机回练' }}
        </button>
        <button class="btn-ghost" type="button" :disabled="practiceLoading || total === 0" @click="startWrongPractice('chronological')">
          按时间练习
        </button>
      </div>
    </section>

    <div v-if="loading" class="loading-card glass-card">正在加载错题...</div>

    <section v-else-if="wrongList.length === 0" class="empty-card glass-card">
      <h2>暂无错题</h2>
      <p>继续保持！完成练习后需要复盘的题目会出现在这里。</p>
      <button class="btn-primary" type="button" @click="router.push('/app/practice')">去练一组</button>
    </section>

    <section v-else class="wrong-list">
      <article v-for="item in wrongList" :key="item.id" class="wrong-card glass-card">
        <header class="wrong-header">
          <div class="wrong-meta">
            <span v-if="subtypeLabels[item.Question?.question_type]" class="chip success">{{ subtypeLabels[item.Question?.question_type] }}</span>
            <span class="chip">{{ typeLabels[item.Question?.question_type] || item.Question?.question_type }}</span>
            <span class="chip danger">错 {{ item.wrong_count }} 次</span>
          </div>
          <div class="wrong-actions">
            <button class="mini-btn success" type="button" @click="markMastered(item.id)">已掌握</button>
            <button class="mini-btn danger" type="button" @click="removeWrong(item.id)">移除</button>
          </div>
        </header>

        <div v-if="item.Question?.Article" class="wrong-source">
          来源：<a v-if="item.Question.Article.url" :href="item.Question.Article.url" target="_blank" rel="noopener">{{ item.Question.Article.title }}</a>
          <span v-else>{{ item.Question.Article.title }}</span>
        </div>

        <p class="wrong-stem">{{ item.Question?.stem?.substring(0, 300) }}{{ item.Question?.stem?.length > 300 ? '...' : '' }}</p>
        <div v-if="item.Question?.answer" class="wrong-answer">
          <span>正确答案</span>
          <strong>{{ item.Question.answer }}</strong>
        </div>
      </article>
    </section>

    <div v-if="total > 20" class="pagination-row">
      <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next" @current-change="loadWrong" />
    </div>
  </div>
</template>

<style scoped>
.wrongbook {
  display: grid;
  gap: 20px;
}

.wrong-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px solid rgba(194, 198, 216, 0.72);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.wrong-total {
  display: grid;
  place-items: center;
  width: 132px;
  height: 132px;
  border-radius: 26px;
  background: var(--danger-soft);
  color: var(--danger);
}

.wrong-total strong {
  font-size: 42px;
  line-height: 1;
}

.wrong-total span {
  font-size: 13px;
  font-weight: 900;
}

.actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.order-group,
.practice-actions,
.wrong-meta,
.wrong-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.order-group > span {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 900;
}

.order-btn,
.mini-btn {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 900;
}

.order-btn.active {
  border-color: var(--primary);
  background: var(--primary);
  color: #ffffff;
}

.mini-btn.success {
  border-color: rgba(0, 106, 97, 0.22);
  color: var(--success);
}

.mini-btn.danger {
  border-color: rgba(186, 26, 26, 0.22);
  color: var(--danger);
}

.loading-card,
.empty-card {
  display: grid;
  place-items: center;
  gap: 12px;
  min-height: 240px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-card h2,
.empty-card p {
  margin: 0;
}

.wrong-list {
  display: grid;
  gap: 14px;
}

.wrong-card {
  display: grid;
  gap: 13px;
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.wrong-card:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 80, 203, 0.32);
}

.wrong-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.wrong-source {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 13px;
}

.wrong-stem {
  margin: 0;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.82;
}

.wrong-answer {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--success-soft);
  color: var(--success);
  font-size: 13px;
  font-weight: 900;
}

.pagination-row {
  display: flex;
  justify-content: center;
}

@media (max-width: 760px) {
  .wrong-hero,
  .actions-bar,
  .wrong-header {
    display: grid;
  }

  .wrong-total {
    width: 100%;
    height: 110px;
  }

  .practice-actions button {
    flex: 1;
  }
}
</style>
