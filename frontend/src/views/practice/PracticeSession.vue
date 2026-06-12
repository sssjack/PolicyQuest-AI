<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { practiceApi } from '../../api'

const route = useRoute()
const router = useRouter()
const sessionId = Number(route.params.sessionId)
const isWrongbookMode = route.query.mode === 'wrongbook'

const questions = ref<any[]>([])
const currentIndex = ref(0)
const answers = ref<Record<number, string>>({})
const results = ref<Record<number, any>>({})
const timer = ref(0)
const timerInterval = ref<any>(null)
const submitting = ref(false)
const showAnalysis = ref(false)
const pinnedQuestions = ref<Set<number>>(new Set())

const currentQ = computed(() => questions.value[currentIndex.value])
const progress = computed(() => Object.keys(answers.value).length)
const isAnswered = computed(() => currentQ.value && results.value[currentQ.value.id])
const allAnswered = computed(() => progress.value === questions.value.length && questions.value.length > 0)
const progressPercent = computed(() => questions.value.length ? Math.round((progress.value / questions.value.length) * 100) : 0)

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
const diffLabels: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }

onMounted(async () => {
  try {
    const stored = sessionStorage.getItem(`pq_session_${sessionId}`)
    if (stored) {
      questions.value = JSON.parse(stored)
    } else {
      const res: any = await practiceApi.start({ session_type: 'quick', count: 10 })
      questions.value = res.data.questions
      sessionStorage.setItem(`pq_session_${sessionId}`, JSON.stringify(res.data.questions))
    }
    const storedPins = sessionStorage.getItem(`pq_pins_${sessionId}`)
    if (storedPins) pinnedQuestions.value = new Set(JSON.parse(storedPins))
    timerInterval.value = setInterval(() => timer.value++, 1000)
  } catch (e) {
    ElMessage.error('加载练习失败')
  }
})

onUnmounted(() => {
  clearInterval(timerInterval.value)
})

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

function togglePin() {
  if (!currentQ.value) return
  const qid = currentQ.value.id
  const newSet = new Set(pinnedQuestions.value)
  if (newSet.has(qid)) newSet.delete(qid)
  else newSet.add(qid)
  pinnedQuestions.value = newSet
  sessionStorage.setItem(`pq_pins_${sessionId}`, JSON.stringify([...newSet]))
}

async function selectOption(option: string) {
  if (!currentQ.value || results.value[currentQ.value.id]) return
  const qid = currentQ.value.id
  answers.value[qid] = option
  try {
    const res: any = await practiceApi.answer(sessionId, { question_id: qid, user_answer: option, duration: timer.value })
    results.value[qid] = res.data

    if (isWrongbookMode) {
      showAnalysis.value = true
    } else if (currentIndex.value < questions.value.length - 1) {
      setTimeout(() => { currentIndex.value++ }, 300)
    } else if (progress.value === questions.value.length) {
      ElMessageBox.confirm('所有题目已作答完毕，是否交卷查看结果？', '提示', {
        confirmButtonText: '交卷',
        cancelButtonText: '再检查一下',
        type: 'info',
      }).then(() => submitPractice()).catch(() => {})
    }
  } catch (e: any) {
    ElMessage.error(e.message || '提交失败')
  }
}

function nextQuestion() {
  showAnalysis.value = false
  if (currentIndex.value < questions.value.length - 1) currentIndex.value++
}

function prevQuestion() {
  showAnalysis.value = false
  if (currentIndex.value > 0) currentIndex.value--
}

function goToQuestion(i: number) {
  currentIndex.value = i
  if (isWrongbookMode) showAnalysis.value = !!results.value[questions.value[i]?.id]
  else showAnalysis.value = false
}

async function submitPractice() {
  submitting.value = true
  try {
    await practiceApi.submit(sessionId)
    clearInterval(timerInterval.value)
    sessionStorage.setItem(`pq_pins_${sessionId}`, JSON.stringify([...pinnedQuestions.value]))
    sessionStorage.setItem(`pq_answers_${sessionId}`, JSON.stringify(answers.value))
    router.push(`/app/practice/${sessionId}/result`)
  } catch (e: any) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="practice-page">
    <header class="focus-bar">
      <div class="focus-left">
        <button class="back-btn" type="button" @click="router.push('/app/practice')">返回</button>
        <div>
          <strong>Focus Mode</strong>
          <span>第 {{ currentIndex + 1 }} / {{ questions.length || 0 }} 题</span>
        </div>
      </div>
      <div class="timer-pill">{{ formatTime(timer) }}</div>
      <button class="btn-primary submit-small" type="button" :disabled="submitting" @click="submitPractice">
        {{ submitting ? '提交中...' : '交卷' }}
      </button>
    </header>

    <div class="progress-line"><i :style="{ width: `${progressPercent}%` }"></i></div>

    <main v-if="currentQ" class="practice-shell">
      <section class="question-panel">
        <div class="q-meta">
          <span v-if="subtypeLabels[currentQ.question_type]" class="chip success">{{ subtypeLabels[currentQ.question_type] }}</span>
          <span class="chip">{{ typeLabels[currentQ.question_type] || currentQ.question_type }}</span>
          <span class="chip warning">{{ diffLabels[currentQ.difficulty] || currentQ.difficulty }}</span>
          <button class="pin-btn" :class="{ pinned: pinnedQuestions.has(currentQ.id) }" type="button" @click="togglePin">
            {{ pinnedQuestions.has(currentQ.id) ? '已标记' : '标记' }}
          </button>
        </div>

        <div v-if="currentQ.source_article" class="q-source">
          <span>来源：</span>
          <a v-if="currentQ.source_article.url" :href="currentQ.source_article.url" target="_blank" rel="noopener">{{ currentQ.source_article.title }}</a>
          <span v-else>{{ currentQ.source_article.title }}</span>
        </div>

        <article class="stem-card">
          <p>{{ currentQ.stem }}</p>
        </article>

        <div v-if="currentQ.options && Object.keys(currentQ.options).length" class="options-list">
          <button
            v-for="(text, key) in currentQ.options"
            :key="key"
            type="button"
            class="option-item"
            :class="{
              selected: answers[currentQ.id] === key && (!isAnswered || !isWrongbookMode),
              correct: isWrongbookMode && isAnswered && results[currentQ.id]?.answer === key,
              wrong: isWrongbookMode && isAnswered && answers[currentQ.id] === key && !results[currentQ.id]?.is_correct
            }"
            @click="selectOption(key as string)"
          >
            <span class="option-key">{{ key }}</span>
            <span class="option-text">{{ text }}</span>
          </button>
        </div>

        <div v-else class="interview-input">
          <textarea v-model="answers[currentQ.id]" placeholder="请输入你的回答..." rows="8" :disabled="!!results[currentQ.id]" />
          <button v-if="!results[currentQ.id]" class="btn-primary" type="button" @click="selectOption(answers[currentQ.id] || '')">提交回答</button>
        </div>

        <div v-if="isWrongbookMode && isAnswered && showAnalysis" class="analysis-panel glass-card">
          <div class="analysis-header">
            <span :class="results[currentQ.id]?.is_correct ? 'result-correct' : 'result-wrong'">
              {{ results[currentQ.id]?.is_correct ? '回答正确' : '回答错误' }}
            </span>
            <span v-if="results[currentQ.id]?.answer" class="correct-answer">正确答案：{{ results[currentQ.id].answer }}</span>
          </div>
          <div v-if="results[currentQ.id]?.analysis" class="analysis-text">
            <h4>解析</h4>
            <pre>{{ results[currentQ.id].analysis }}</pre>
          </div>
          <div v-if="results[currentQ.id]?.knowledge_points?.length" class="knowledge-tags">
            <span v-for="kp in results[currentQ.id].knowledge_points" :key="kp" class="chip">{{ kp }}</span>
          </div>
        </div>

        <footer class="practice-footer">
          <button class="btn-ghost" type="button" :disabled="currentIndex === 0" @click="prevQuestion">上一题</button>
          <button class="btn-primary" type="button" :disabled="currentIndex === questions.length - 1" @click="nextQuestion">下一题</button>
        </footer>
      </section>

      <aside class="question-nav-panel glass-card">
        <div class="nav-head">
          <strong>题目导航</strong>
          <span>已答 {{ progress }} 题</span>
        </div>
        <div class="nav-grid">
          <button
            v-for="(q, i) in questions"
            :key="q.id"
            type="button"
            class="nav-dot"
            :class="{
              current: i === currentIndex,
              answered: answers[q.id] && !isWrongbookMode,
              correct: isWrongbookMode && results[q.id]?.is_correct,
              wrong: isWrongbookMode && results[q.id] && !results[q.id].is_correct,
            }"
            @click="goToQuestion(i)"
          >
            <span>{{ i + 1 }}</span>
            <i v-if="pinnedQuestions.has(q.id)"></i>
          </button>
        </div>
        <p v-if="!isWrongbookMode && allAnswered" class="nav-hint">所有题目已答完，可以交卷了</p>
      </aside>
    </main>

    <div v-else class="empty-state glass-card">
      <h2>正在加载练习题</h2>
      <p>如果长时间无响应，请返回练习配置重新开始。</p>
      <button class="btn-primary" type="button" @click="router.push('/app/practice')">返回练习配置</button>
    </div>
  </div>
</template>

<style scoped>
.practice-page {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(248, 249, 255, 0.96), #ffffff 48%, #f8f9ff 100%);
}

.focus-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(120px, auto);
  align-items: center;
  gap: 16px;
  min-height: 76px;
  padding: 12px 28px;
  border-bottom: 1px solid rgba(194, 198, 216, 0.72);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.focus-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.back-btn {
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--text-secondary);
  font-weight: 800;
}

.focus-left strong,
.focus-left span {
  display: block;
}

.focus-left span {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
}

.timer-pill {
  display: grid;
  min-width: 108px;
  min-height: 44px;
  place-items: center;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 20px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.submit-small {
  min-height: 42px;
}

.progress-line {
  height: 4px;
  background: #dce9ff;
}

.progress-line i {
  display: block;
  height: 100%;
  background: var(--gradient-2);
  transition: width 0.24s ease;
}

.practice-shell {
  display: grid;
  grid-template-columns: minmax(0, 820px) 260px;
  gap: 22px;
  align-items: start;
  width: min(1160px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 28px 0 56px;
}

.question-panel {
  display: grid;
  gap: 18px;
}

.q-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.pin-btn {
  margin-left: auto;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 900;
}

.pin-btn.pinned {
  border-color: rgba(216, 138, 0, 0.35);
  background: var(--warning-soft);
  color: var(--warning);
}

.q-source {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.stem-card {
  padding: 28px;
  border: 1px solid rgba(194, 198, 216, 0.72);
  border-radius: 22px;
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.stem-card p {
  margin: 0;
  color: var(--text-primary);
  font-size: 17px;
  line-height: 1.9;
  white-space: pre-wrap;
}

.options-list {
  display: grid;
  gap: 12px;
}

.option-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: start;
  gap: 14px;
  width: 100%;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #ffffff;
  color: var(--text-primary);
  text-align: left;
  box-shadow: var(--shadow-sm);
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.option-item:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 80, 203, 0.36);
}

.option-item.selected {
  border-color: var(--primary);
  background: #eff4ff;
}

.option-item.correct {
  border-color: var(--success);
  background: var(--success-soft);
}

.option-item.wrong {
  border-color: var(--danger);
  background: var(--danger-soft);
}

.option-key {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--primary);
  font-weight: 900;
}

.option-text {
  padding-top: 5px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.75;
}

.interview-input {
  display: grid;
  gap: 12px;
}

.interview-input textarea {
  width: 100%;
  min-height: 260px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 18px;
  outline: none;
  resize: vertical;
  background: #ffffff;
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.8;
}

.interview-input textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 80, 203, 0.1);
}

.analysis-panel {
  display: grid;
  gap: 14px;
}

.analysis-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.result-correct,
.result-wrong {
  font-size: 17px;
  font-weight: 900;
}

.result-correct {
  color: var(--success);
}

.result-wrong {
  color: var(--danger);
}

.correct-answer {
  color: var(--text-secondary);
  font-weight: 800;
}

.analysis-text h4 {
  margin: 0 0 8px;
  color: var(--text-primary);
}

.analysis-text pre {
  margin: 0;
  color: var(--text-secondary);
  font-family: inherit;
  line-height: 1.8;
  white-space: pre-wrap;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.practice-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 6px;
}

.practice-footer button {
  min-width: 132px;
}

.question-nav-panel {
  position: sticky;
  top: 104px;
  padding: 18px;
}

.nav-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.nav-head span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.nav-dot {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 900;
}

.nav-dot.current {
  border-color: var(--primary);
  background: var(--primary);
  color: #ffffff;
}

.nav-dot.answered {
  border-color: rgba(0, 80, 203, 0.32);
  background: var(--surface-muted);
  color: var(--primary);
}

.nav-dot.correct {
  border-color: var(--success);
  background: var(--success-soft);
  color: var(--success);
}

.nav-dot.wrong {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}

.nav-dot i {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--warning);
}

.nav-hint {
  margin: 14px 0 0;
  color: var(--success);
  font-size: 13px;
  font-weight: 800;
  text-align: center;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 12px;
  width: min(620px, calc(100vw - 48px));
  margin: 64px auto;
  text-align: center;
}

.empty-state h2,
.empty-state p {
  margin: 0;
}

.empty-state p {
  color: var(--text-secondary);
}

@media (max-width: 980px) {
  .focus-bar {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .submit-small {
    grid-column: 1 / -1;
    width: 100%;
  }

  .practice-shell {
    grid-template-columns: 1fr;
    width: min(760px, calc(100vw - 32px));
  }

  .question-nav-panel {
    position: static;
    order: -1;
  }
}

@media (max-width: 620px) {
  .focus-bar {
    padding: 10px 16px;
  }

  .timer-pill {
    min-width: 92px;
    font-size: 17px;
  }

  .stem-card {
    padding: 20px;
  }

  .option-item {
    grid-template-columns: 34px minmax(0, 1fr);
    padding: 15px;
  }

  .option-key {
    width: 34px;
    height: 34px;
  }

  .practice-footer {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .practice-footer button {
    min-width: 0;
  }
}
</style>
