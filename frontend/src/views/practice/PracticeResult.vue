<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { practiceApi } from '../../api'

const route = useRoute()
const router = useRouter()
const sessionId = Number(route.params.sessionId)

const loading = ref(true)
const session = ref<any>(null)
const answerList = ref<any[]>([])
const pinnedIds = ref<Set<number>>(new Set())
const filter = ref<'all' | 'wrong' | 'pinned'>('all')
const activeDetailId = ref<number | null>(null)

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

const filteredAnswers = computed(() => {
  if (filter.value === 'wrong') return answerList.value.filter(a => !a.is_correct)
  if (filter.value === 'pinned') return answerList.value.filter(a => pinnedIds.value.has(a.question_id))
  return answerList.value
})

const wrongCount = computed(() => answerList.value.filter(a => !a.is_correct).length)
const pinnedCount = computed(() => answerList.value.filter(a => pinnedIds.value.has(a.question_id)).length)

function formatTime(s: number) {
  if (!s) return '0:00'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function scrollToDetail(questionId: number) {
  activeDetailId.value = questionId
  filter.value = 'all'
  setTimeout(() => {
    document.getElementById(`detail-${questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 100)
}

onMounted(async () => {
  try {
    const storedPins = sessionStorage.getItem(`pq_pins_${sessionId}`)
    if (storedPins) pinnedIds.value = new Set(JSON.parse(storedPins))

    const res: any = await practiceApi.submit(sessionId)
    session.value = res.data.session
    answerList.value = res.data.answers || []
  } catch (e: any) {
    if (e.message?.includes('已结束')) {
      try {
        await practiceApi.history({ page: 1, pageSize: 1 })
        ElMessage.info('练习已完成')
      } catch (_) {}
    } else {
      ElMessage.error('加载结果失败')
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="result-page page-container">
    <div v-if="loading" class="loading-card glass-card">正在生成练习结果...</div>

    <template v-else-if="session">
      <section class="result-hero">
        <div>
          <p class="page-kicker">Practice Report</p>
          <h1 class="page-title">练习结果</h1>
          <p class="page-subtitle">这份报告会同步到你的成长数据中，错题可继续进入错题本回练。</p>
        </div>
        <div class="score-badge" :style="{ '--score': session.accuracy }">
          <strong>{{ session.accuracy }}%</strong>
          <span>正确率</span>
        </div>
      </section>

      <section class="summary-grid">
        <article class="summary-item"><span>总题数</span><strong>{{ session.total_questions }}</strong></article>
        <article class="summary-item success"><span>正确</span><strong>{{ session.correct_count }}</strong></article>
        <article class="summary-item danger"><span>错误</span><strong>{{ session.total_questions - session.correct_count }}</strong></article>
        <article class="summary-item"><span>用时</span><strong>{{ formatTime(session.total_duration) }}</strong></article>
      </section>

      <section class="chart-card glass-card">
        <div class="panel-head">
          <div>
            <p class="page-kicker">Answer Matrix</p>
            <h2>答题总览</h2>
          </div>
          <div class="chart-legend">
            <span><i class="legend-dot correct"></i>正确</span>
            <span><i class="legend-dot wrong"></i>错误</span>
          </div>
        </div>

        <div class="chart-grid">
          <button
            v-for="(a, i) in answerList"
            :key="a.id"
            type="button"
            class="chart-block"
            :class="{ correct: a.is_correct, wrong: !a.is_correct, active: activeDetailId === a.question_id }"
            @click="scrollToDetail(a.question_id)"
          >
            <span>{{ i + 1 }}</span>
            <i v-if="pinnedIds.has(a.question_id)"></i>
          </button>
        </div>
      </section>

      <div class="result-filter">
        <button class="filter-btn" :class="{ active: filter === 'all' }" type="button" @click="filter = 'all'">全部 {{ answerList.length }}</button>
        <button class="filter-btn" :class="{ active: filter === 'wrong' }" type="button" @click="filter = 'wrong'">错题 {{ wrongCount }}</button>
        <button v-if="pinnedCount > 0" class="filter-btn" :class="{ active: filter === 'pinned' }" type="button" @click="filter = 'pinned'">已标记 {{ pinnedCount }}</button>
      </div>

      <section class="detail-list">
        <article v-for="a in filteredAnswers" :key="a.id" :id="`detail-${a.question_id}`" class="detail-card glass-card" :class="{ highlight: activeDetailId === a.question_id }">
          <header class="detail-header">
            <span class="detail-index">{{ answerList.indexOf(a) + 1 }}</span>
            <span class="chip" :class="a.is_correct ? 'success' : 'danger'">{{ a.is_correct ? '正确' : '错误' }}</span>
            <span class="chip">{{ typeLabels[a.Question?.question_type] || a.Question?.question_type }}</span>
            <span v-if="pinnedIds.has(a.question_id)" class="chip warning">已标记</span>
          </header>

          <div v-if="a.Question?.Article" class="detail-source">
            来源：<a v-if="a.Question.Article.url" :href="a.Question.Article.url" target="_blank" rel="noopener">{{ a.Question.Article.title }}</a>
            <span v-else>{{ a.Question.Article.title }}</span>
          </div>

          <p class="detail-stem">{{ a.Question?.stem }}</p>

          <div v-if="a.Question?.options && Object.keys(a.Question.options).length" class="detail-options">
            <div
              v-for="(text, key) in a.Question.options"
              :key="key"
              class="detail-option"
              :class="{
                'user-selected': a.user_answer === key,
                'is-correct': String(a.Question.answer).trim().toUpperCase() === String(key).trim().toUpperCase(),
                'is-wrong': a.user_answer === key && !a.is_correct,
              }"
            >
              <span class="opt-key">{{ key }}</span>
              <span class="opt-text">{{ text }}</span>
              <span v-if="String(a.Question.answer).trim().toUpperCase() === String(key).trim().toUpperCase()" class="opt-badge correct-badge">正确答案</span>
              <span v-if="a.user_answer === key && !a.is_correct" class="opt-badge wrong-badge">你的选择</span>
              <span v-if="a.user_answer === key && a.is_correct" class="opt-badge correct-badge">你的选择</span>
            </div>
          </div>

          <div v-if="a.Question?.analysis" class="detail-analysis">
            <h4>解析</h4>
            <pre>{{ a.Question.analysis }}</pre>
          </div>

          <div v-if="a.Question?.knowledge_points?.length" class="detail-kps">
            <span v-for="kp in a.Question.knowledge_points" :key="kp" class="chip">{{ kp }}</span>
          </div>
        </article>
      </section>

      <footer class="result-actions">
        <button class="btn-primary" type="button" @click="router.push('/app/practice')">再练一组</button>
        <button class="btn-ghost" type="button" @click="router.push('/app/wrongbook')">错题本</button>
        <button class="btn-ghost" type="button" @click="router.push('/app/dashboard')">返回工作台</button>
      </footer>
    </template>

    <section v-else class="empty-card glass-card">
      <h2>暂无结果数据</h2>
      <p>可以重新开始一组练习，完成后再查看报告。</p>
      <button class="btn-primary" type="button" @click="router.push('/app/practice')">开始练习</button>
    </section>
  </div>
</template>

<style scoped>
.result-page {
  display: grid;
  gap: 20px;
  max-width: 980px;
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

.result-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 22px;
  padding: 28px;
  border: 1px solid rgba(194, 198, 216, 0.72);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.score-badge {
  display: grid;
  place-items: center;
  width: 148px;
  height: 148px;
  border-radius: 999px;
  background:
    radial-gradient(circle at center, #ffffff 52%, transparent 54%),
    conic-gradient(var(--secondary) calc(var(--score, 76) * 1%), #dce9ff 0);
  box-shadow: inset 0 0 0 1px rgba(194, 198, 216, 0.76);
}

.score-badge strong {
  color: var(--primary);
  font-size: 34px;
  font-weight: 900;
}

.score-badge span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-item {
  display: grid;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.summary-item span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
}

.summary-item strong {
  color: var(--primary);
  font-size: 31px;
}

.summary-item.success strong {
  color: var(--success);
}

.summary-item.danger strong {
  color: var(--danger);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  font-size: 22px;
}

.chart-legend {
  display: flex;
  gap: 14px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.legend-dot.correct {
  background: var(--success);
}

.legend-dot.wrong {
  background: var(--danger);
}

.chart-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chart-block {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 900;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.chart-block:hover,
.chart-block.active {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(19, 42, 74, 0.1);
}

.chart-block.correct {
  border-color: var(--success);
  background: var(--success-soft);
  color: var(--success);
}

.chart-block.wrong {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}

.chart-block i {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--warning);
}

.result-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-btn {
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 900;
}

.filter-btn.active {
  border-color: var(--primary);
  background: var(--primary);
  color: #ffffff;
}

.detail-list {
  display: grid;
  gap: 16px;
}

.detail-card {
  display: grid;
  gap: 14px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.detail-card.highlight {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 80, 203, 0.08), var(--shadow-md);
}

.detail-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.detail-index {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: var(--primary);
  color: #ffffff;
  font-weight: 900;
}

.detail-source {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 13px;
}

.detail-stem {
  margin: 0;
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.85;
  white-space: pre-wrap;
}

.detail-options {
  display: grid;
  gap: 10px;
}

.detail-option {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  align-items: start;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #ffffff;
}

.detail-option.is-correct {
  border-color: var(--success);
  background: var(--success-soft);
}

.detail-option.is-wrong {
  border-color: var(--danger);
  background: var(--danger-soft);
}

.opt-key {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--primary);
  font-weight: 900;
}

.opt-text {
  color: var(--text-secondary);
  line-height: 1.65;
}

.opt-badge {
  align-self: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.correct-badge {
  background: #ffffff;
  color: var(--success);
}

.wrong-badge {
  background: #ffffff;
  color: var(--danger);
}

.detail-analysis {
  padding: 16px;
  border-radius: 16px;
  background: #fbfcff;
}

.detail-analysis h4 {
  margin: 0 0 8px;
}

.detail-analysis pre {
  margin: 0;
  color: var(--text-secondary);
  font-family: inherit;
  line-height: 1.8;
  white-space: pre-wrap;
}

.detail-kps,
.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.result-actions {
  justify-content: center;
  padding: 8px 0 18px;
}

@media (max-width: 760px) {
  .result-hero {
    display: grid;
  }

  .score-badge {
    width: 132px;
    height: 132px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .panel-head {
    display: grid;
  }
}

@media (max-width: 560px) {
  .summary-grid,
  .detail-option {
    grid-template-columns: 1fr;
  }

  .opt-key {
    width: 34px;
    height: 34px;
  }

  .result-actions button {
    width: 100%;
  }
}
</style>
