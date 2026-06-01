<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { practiceApi } from '../../api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const sessionId = Number(route.params.sessionId)
const questions = ref<any[]>([])
const currentIndex = ref(0)
const answers = ref<Record<number, string>>({})
const results = ref<Record<number, any>>({})
const timer = ref(0)
const timerInterval = ref<any>(null)
const submitting = ref(false)
const showAnalysis = ref(false)

const currentQ = computed(() => questions.value[currentIndex.value])
const progress = computed(() => Object.keys(answers.value).length)
const isAnswered = computed(() => currentQ.value && results.value[currentQ.value.id])

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
    timerInterval.value = setInterval(() => timer.value++, 1000)
  } catch (e) { ElMessage.error('加载练习失败') }
})

onUnmounted(() => { clearInterval(timerInterval.value) })

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

async function selectOption(option: string) {
  if (!currentQ.value || results.value[currentQ.value.id]) return
  const qid = currentQ.value.id
  answers.value[qid] = option
  try {
    const res: any = await practiceApi.answer(sessionId, { question_id: qid, user_answer: option, duration: timer.value })
    results.value[qid] = res.data
    showAnalysis.value = true
  } catch (e: any) { ElMessage.error(e.message || '提交失败') }
}

function nextQuestion() {
  showAnalysis.value = false
  if (currentIndex.value < questions.value.length - 1) currentIndex.value++
}
function prevQuestion() {
  showAnalysis.value = false
  if (currentIndex.value > 0) currentIndex.value--
}

async function submitPractice() {
  submitting.value = true
  try {
    await practiceApi.submit(sessionId)
    clearInterval(timerInterval.value)
    router.push(`/app/practice/${sessionId}/result`)
  } catch (e: any) { ElMessage.error(e.message || '提交失败') }
  finally { submitting.value = false }
}
</script>

<template>
  <div class="practice-page">
    <div class="practice-header">
      <div class="header-left">
        <span class="q-progress">{{ currentIndex + 1 }} / {{ questions.length }}</span>
        <span class="q-done">已答 {{ progress }} 题</span>
      </div>
      <div class="header-center">
        <span class="timer">⏱ {{ formatTime(timer) }}</span>
      </div>
      <div class="header-right">
        <button class="btn-ghost" style="padding:8px 20px;font-size:13px" @click="submitPractice" :disabled="submitting">
          {{ submitting ? '提交中...' : '交卷' }}
        </button>
      </div>
    </div>

    <div v-if="currentQ" class="practice-body">
      <div class="question-panel">
        <div class="q-meta">
          <span class="q-type">{{ typeLabels[currentQ.question_type] || currentQ.question_type }}</span>
          <span class="q-diff" :class="currentQ.difficulty">{{ diffLabels[currentQ.difficulty] || currentQ.difficulty }}</span>
        </div>
        <div class="q-stem">{{ currentQ.stem }}</div>
        <div v-if="currentQ.options && Object.keys(currentQ.options).length" class="options-list">
          <div v-for="(text, key) in currentQ.options" :key="key"
            class="option-item" :class="{
              selected: answers[currentQ.id] === key,
              correct: isAnswered && results[currentQ.id]?.answer === key,
              wrong: isAnswered && answers[currentQ.id] === key && !results[currentQ.id]?.is_correct
            }" @click="selectOption(key as string)">
            <span class="option-key">{{ key }}</span>
            <span class="option-text">{{ text }}</span>
          </div>
        </div>
        <div v-else class="interview-input">
          <textarea v-model="answers[currentQ.id]" placeholder="请输入你的回答..." rows="8" :disabled="!!results[currentQ.id]" />
          <button v-if="!results[currentQ.id]" class="btn-primary" style="margin-top:12px" @click="selectOption(answers[currentQ.id] || '')">提交回答</button>
        </div>

        <div v-if="isAnswered && showAnalysis" class="analysis-panel glass-card">
          <div class="analysis-header">
            <span :class="results[currentQ.id]?.is_correct ? 'result-correct' : 'result-wrong'">
              {{ results[currentQ.id]?.is_correct ? '✅ 回答正确' : '❌ 回答错误' }}
            </span>
            <span v-if="results[currentQ.id]?.answer" class="correct-answer">正确答案：{{ results[currentQ.id].answer }}</span>
          </div>
          <div v-if="results[currentQ.id]?.analysis" class="analysis-text">
            <h4>解析</h4>
            <pre>{{ results[currentQ.id].analysis }}</pre>
          </div>
          <div v-if="results[currentQ.id]?.knowledge_points?.length" class="knowledge-tags">
            <span v-for="kp in results[currentQ.id].knowledge_points" :key="kp" class="kp-tag">{{ kp }}</span>
          </div>
        </div>
      </div>

      <div class="question-nav-panel">
        <h4>题目导航</h4>
        <div class="nav-grid">
          <div v-for="(q, i) in questions" :key="q.id"
            class="nav-dot" :class="{
              current: i === currentIndex,
              answered: answers[q.id],
              correct: results[q.id]?.is_correct,
              wrong: results[q.id] && !results[q.id].is_correct,
            }" @click="currentIndex = i; showAnalysis = !!results[q.id]">
            {{ i + 1 }}
          </div>
        </div>
      </div>
    </div>

    <div class="practice-footer">
      <button class="btn-ghost" @click="prevQuestion" :disabled="currentIndex === 0">上一题</button>
      <button class="btn-primary" @click="nextQuestion" :disabled="currentIndex === questions.length - 1">下一题</button>
    </div>
  </div>
</template>

<style scoped>
.practice-page { padding: 0; display: flex; flex-direction: column; min-height: 100vh; }
.practice-header {
  display: flex; align-items: center; justify-content: space-between; padding: 16px 24px;
  border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02);
}
.q-progress { font-size: 16px; font-weight: 700; }
.q-done { font-size: 13px; color: var(--text-muted); margin-left: 12px; }
.timer { font-size: 18px; font-weight: 600; color: var(--accent); font-variant-numeric: tabular-nums; }

.practice-body { flex: 1; display: flex; padding: 24px; gap: 24px; }
.question-panel { flex: 1; }
.q-meta { display: flex; gap: 8px; margin-bottom: 16px; }
.q-type { padding: 4px 12px; border-radius: 6px; font-size: 12px; background: rgba(99,102,241,0.15); color: var(--primary-light); }
.q-diff { padding: 4px 12px; border-radius: 6px; font-size: 12px; }
.q-diff.easy { background: rgba(16,185,129,0.15); color: var(--success); }
.q-diff.medium { background: rgba(245,158,11,0.15); color: var(--warning); }
.q-diff.hard { background: rgba(239,68,68,0.15); color: var(--danger); }

.q-stem { font-size: 16px; line-height: 1.8; margin-bottom: 24px; white-space: pre-wrap; }

.options-list { display: flex; flex-direction: column; gap: 12px; }
.option-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 16px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08); cursor: pointer; transition: all 0.2s;
  background: rgba(255,255,255,0.02);
}
.option-item:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); }
.option-item.selected { border-color: var(--primary); background: rgba(99,102,241,0.1); }
.option-item.correct { border-color: var(--success); background: rgba(16,185,129,0.1); }
.option-item.wrong { border-color: var(--danger); background: rgba(239,68,68,0.1); }
.option-key {
  width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600;
  flex-shrink: 0;
}
.option-text { font-size: 15px; line-height: 1.6; padding-top: 2px; }

.interview-input textarea {
  width: 100%; padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.03); color: var(--text-primary); font-size: 15px; line-height: 1.7;
  resize: vertical; outline: none;
}
.interview-input textarea:focus { border-color: var(--primary); }

.analysis-panel { margin-top: 24px; padding: 20px; }
.analysis-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.result-correct { font-size: 16px; font-weight: 600; color: var(--success); }
.result-wrong { font-size: 16px; font-weight: 600; color: var(--danger); }
.correct-answer { font-size: 14px; color: var(--text-secondary); }
.analysis-text h4 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary); }
.analysis-text pre { font-size: 14px; line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap; font-family: inherit; }
.knowledge-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.kp-tag { padding: 4px 10px; border-radius: 6px; font-size: 12px; background: rgba(6,182,212,0.15); color: var(--accent); }

.question-nav-panel {
  width: 200px; flex-shrink: 0; position: sticky; top: 80px; align-self: flex-start;
}
.question-nav-panel h4 { font-size: 14px; color: var(--text-muted); margin-bottom: 12px; }
.nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.nav-dot {
  width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-size: 12px; cursor: pointer; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03); transition: all 0.2s;
}
.nav-dot.current { border-color: var(--primary); background: rgba(99,102,241,0.2); }
.nav-dot.correct { background: rgba(16,185,129,0.2); border-color: var(--success); }
.nav-dot.wrong { background: rgba(239,68,68,0.2); border-color: var(--danger); }
.nav-dot.answered { background: rgba(99,102,241,0.1); }

.practice-footer {
  display: flex; justify-content: center; gap: 16px; padding: 16px 24px;
  border-top: 1px solid var(--border);
}
.practice-footer button { padding: 10px 32px; font-size: 14px; }
</style>
