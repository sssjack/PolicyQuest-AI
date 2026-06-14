<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  CircleCheck,
  DocumentChecked,
  EditPen,
  MagicStick,
  Reading,
  Star,
  Timer,
  Warning,
} from '@element-plus/icons-vue'
import { scoringApi } from '../../api'
import AbilityRadar from '../../components/AbilityRadar.vue'
import {
  fallbackEvaluation,
  findPaper,
  formatSeconds,
  realPapers,
  savePracticeRecord,
  type EvaluationResult,
  type PracticeRecord,
} from '../../data/policyQuest'

type MobileTab = 'question' | 'materials' | 'answer'

const route = useRoute()
const router = useRouter()
const paper = computed(() => findPaper(String(route.params.paperId)) || realPapers[0])
const currentIndex = ref(0)
const activeMaterialId = ref('')
const activeMobileTab = ref<MobileTab>('materials')
const answers = ref<Record<string, string>>({})
const evaluations = ref<Record<string, EvaluationResult>>({})
const questionTimers = ref<Record<string, number>>({})
const totalSeconds = ref(0)
const submitting = ref(false)
let timerId: number | undefined

const currentQuestion = computed(() => paper.value.questions[currentIndex.value] || paper.value.questions[0])
const activeMaterial = computed(() => paper.value.materials.find(material => material.id === activeMaterialId.value) || paper.value.materials[0])
const currentAnswer = computed({
  get: () => answers.value[currentQuestion.value.id] || '',
  set: value => {
    answers.value = { ...answers.value, [currentQuestion.value.id]: value }
  },
})
const currentEvaluation = computed(() => evaluations.value[currentQuestion.value.id])
const wordCount = computed(() => currentAnswer.value.trim().replace(/\s/g, '').length)
const progressPercent = computed(() => Math.round(((currentIndex.value + 1) / paper.value.questions.length) * 100))
const answeredCount = computed(() => Object.keys(evaluations.value).length)
const currentQuestionTime = computed(() => questionTimers.value[currentQuestion.value.id] || 0)
const allSubmitted = computed(() => answeredCount.value === paper.value.questions.length)

watch(
  paper,
  nextPaper => {
    currentIndex.value = 0
    activeMaterialId.value = nextPaper.materials[0]?.id || ''
  },
  { immediate: true },
)

onMounted(() => {
  timerId = window.setInterval(() => {
    totalSeconds.value += 1
    const questionId = currentQuestion.value?.id
    if (questionId) {
      questionTimers.value = {
        ...questionTimers.value,
        [questionId]: (questionTimers.value[questionId] || 0) + 1,
      }
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (timerId) window.clearInterval(timerId)
})

function chooseQuestion(index: number) {
  currentIndex.value = index
  activeMobileTab.value = paper.value.type === 'essay' ? 'materials' : 'question'
}

function isGarbled(text: unknown) {
  return /锛|鈥|鐨|浣|鍥|绛|瑙|鎻|€|�/.test(String(text || ''))
}

function normalizeEvaluation(value: any): EvaluationResult {
  const local = fallbackEvaluation(currentAnswer.value, currentQuestion.value, paper.value)
  if (!value || isGarbled(value.summary) || !Array.isArray(value.dimensions)) return local

  return {
    score: Number(value.score) || local.score,
    level: String(value.level || local.level),
    summary: String(value.summary || local.summary),
    dimensions: value.dimensions.length
      ? value.dimensions.map((item: any) => ({
          name: String(item.name || ''),
          score: Number(item.score) || 0,
          comment: String(item.comment || ''),
        }))
      : local.dimensions,
    advantages: Array.isArray(value.advantages) ? value.advantages.map(String) : local.advantages,
    disadvantages: Array.isArray(value.disadvantages) ? value.disadvantages.map(String) : local.disadvantages,
    suggestions: Array.isArray(value.suggestions) ? value.suggestions.map(String) : local.suggestions,
    qualityMaterials: Array.isArray(value.qualityMaterials) ? value.qualityMaterials : local.qualityMaterials,
    governmentReportLinks: Array.isArray(value.governmentReportLinks) ? value.governmentReportLinks : local.governmentReportLinks,
    sampleEssay: String(value.sampleEssay || local.sampleEssay),
  }
}

async function submitQuestion() {
  const answer = currentAnswer.value.trim()
  if (answer.length < 20) {
    ElMessage.warning('请至少输入 20 个字后再提交')
    return
  }

  submitting.value = true
  try {
    let evaluation: EvaluationResult
    try {
      const response: any = await scoringApi.evaluate({
        answer,
        type: paper.value.type,
        question: {
          title: currentQuestion.value.title,
          source: paper.value.title,
          exam: paper.value.system,
          prompt: currentQuestion.value.prompt,
          requirements: currentQuestion.value.requirements,
          tags: paper.value.tags,
        },
      })
      evaluation = normalizeEvaluation(response.data)
    } catch {
      evaluation = fallbackEvaluation(answer, currentQuestion.value, paper.value)
    }

    evaluations.value = { ...evaluations.value, [currentQuestion.value.id]: evaluation }
    const record: PracticeRecord = {
      id: `${Date.now()}-${currentQuestion.value.id}`,
      paperId: paper.value.id,
      paperTitle: paper.value.title,
      type: paper.value.type,
      questionId: currentQuestion.value.id,
      questionTitle: currentQuestion.value.title,
      answer,
      score: evaluation.score,
      durationSeconds: currentQuestionTime.value,
      submittedAt: new Date().toISOString(),
      dimensions: evaluation.dimensions,
      evaluation,
    }
    savePracticeRecord(record)
    ElMessage.success('本题已提交，AI 评阅结果已生成')
    activeMobileTab.value = 'answer'
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  } finally {
    submitting.value = false
  }
}

function goReport() {
  router.push('/report')
}
</script>

<template>
  <main class="practice-page page-container">
    <section class="practice-head">
      <button type="button" class="back-button" @click="router.push('/papers')">
        <el-icon><ArrowLeft /></el-icon>
        返回真题库
      </button>

      <div class="paper-title">
        <p class="page-kicker">{{ paper.type === 'essay' ? 'Essay Workbench' : 'Interview Workbench' }}</p>
        <h1>{{ paper.title }}</h1>
        <span>题目 {{ currentIndex + 1 }} / {{ paper.questions.length }}</span>
      </div>

      <div class="practice-actions">
        <div class="progress-box">
          <span>{{ progressPercent }}%</span>
          <i><b :style="{ width: `${progressPercent}%` }"></b></i>
        </div>
        <div class="timer-pill">
          <el-icon><Timer /></el-icon>
          <strong>{{ formatSeconds(totalSeconds) }}</strong>
          <span>总用时</span>
        </div>
        <button class="submit-button" type="button" :disabled="submitting" @click="submitQuestion">
          {{ submitting ? '评阅中...' : currentEvaluation ? '重新提交' : '提交本题' }}
        </button>
        <button class="report-button" type="button" :disabled="!allSubmitted" @click="goReport">交卷</button>
      </div>
    </section>

    <div class="mobile-tabs">
      <button type="button" :class="{ active: activeMobileTab === 'question' }" @click="activeMobileTab = 'question'">题目</button>
      <button type="button" :class="{ active: activeMobileTab === 'materials' }" @click="activeMobileTab = 'materials'">材料</button>
      <button type="button" :class="{ active: activeMobileTab === 'answer' }" @click="activeMobileTab = 'answer'">作答</button>
    </div>

    <section class="work-layout">
      <article class="workspace">
        <section class="question-card" :class="{ 'mobile-hidden': activeMobileTab !== 'question' }">
          <div class="meta-row">
            <span>{{ paper.type === 'essay' ? '申论' : '面试' }}</span>
            <span>{{ paper.systemLabel }}</span>
            <span>{{ paper.category }}</span>
            <span>{{ currentQuestion.score }} 分</span>
          </div>
          <h2>{{ currentQuestion.title }}</h2>
          <p>{{ currentQuestion.prompt }}</p>
          <ul>
            <li v-for="item in currentQuestion.requirements" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section class="materials-card" :class="{ 'mobile-hidden': activeMobileTab !== 'materials' }">
          <div class="material-tabs">
            <button
              v-for="material in paper.materials"
              :key="material.id"
              type="button"
              :class="{ active: activeMaterialId === material.id }"
              @click="activeMaterialId = material.id"
            >
              {{ material.title }}
            </button>
          </div>
          <article v-if="activeMaterial" class="material-body">
            <div>
              <h2>{{ activeMaterial.title }}</h2>
              <span>约 {{ activeMaterial.wordCount }} 字</span>
            </div>
            <p>{{ activeMaterial.content }}</p>
          </article>
        </section>

        <section class="answer-card" :class="{ 'mobile-hidden': activeMobileTab !== 'answer' }">
          <div class="answer-head">
            <strong>作答区</strong>
            <span>已输入 {{ wordCount }} 字 · 本题用时 {{ formatSeconds(currentQuestionTime) }}</span>
          </div>
          <textarea
            v-model="currentAnswer"
            :placeholder="paper.type === 'essay' ? '请根据材料作答，建议先列提纲再展开...' : '请按面试口径组织回答，注意身份感和表达层次...'"
          ></textarea>
          <div class="answer-footer">
            <i><b :style="{ width: `${Math.min(100, Math.round((wordCount / currentQuestion.wordLimit) * 100))}%` }"></b></i>
            <span>建议字数 {{ currentQuestion.wordLimit }} 字以内</span>
          </div>
        </section>
      </article>

      <aside class="evaluation-panel" :class="{ 'mobile-hidden': activeMobileTab !== 'answer' }">
        <template v-if="currentEvaluation">
          <section class="score-summary">
            <div class="score-ring">
              <strong>{{ currentEvaluation.score }}</strong>
              <span>/100</span>
            </div>
            <div>
              <h2>AI 阅卷结果</h2>
              <p>得分评价 <strong>{{ currentEvaluation.level }}</strong></p>
              <small>{{ currentEvaluation.summary }}</small>
            </div>
          </section>

          <section class="panel-block">
            <h3><el-icon><MagicStick /></el-icon> AI 建议</h3>
            <p v-for="item in currentEvaluation.suggestions.slice(0, 3)" :key="item">{{ item }}</p>
          </section>

          <section class="two-col">
            <div class="panel-block success">
              <h3><el-icon><CircleCheck /></el-icon> 优点</h3>
              <p v-for="item in currentEvaluation.advantages.slice(0, 3)" :key="item">{{ item }}</p>
            </div>
            <div class="panel-block danger">
              <h3><el-icon><Warning /></el-icon> 缺点</h3>
              <p v-for="item in currentEvaluation.disadvantages.slice(0, 3)" :key="item">{{ item }}</p>
            </div>
          </section>

          <section class="panel-block">
            <h3><el-icon><Reading /></el-icon> 题目解读</h3>
            <p>本题要求抓住“{{ currentQuestion.title }}”中的核心矛盾，先判断问题本质，再结合材料提炼执行抓手，避免只堆概念。</p>
          </section>

          <section class="radar-panel">
            <div class="panel-title">
              <h3>个人能力图谱</h3>
              <router-link to="/report">更多报告</router-link>
            </div>
            <AbilityRadar :items="currentEvaluation.dimensions" :height="250" />
          </section>

          <section class="panel-block sample">
            <h3><el-icon><DocumentChecked /></el-icon> 参考范文</h3>
            <p>{{ currentEvaluation.sampleEssay }}</p>
          </section>
        </template>

        <section v-else class="empty-review">
          <el-icon><EditPen /></el-icon>
          <h2>提交后查看 AI 评阅</h2>
          <p>系统会生成分数、建议、优点、缺点、题目解读、参考范文和维度雷达图。</p>
        </section>
      </aside>
    </section>

    <footer class="question-dock">
      <span>题目导航</span>
      <button
        v-for="(question, index) in paper.questions"
        :key="question.id"
        type="button"
        :class="{ active: currentIndex === index, done: evaluations[question.id] }"
        @click="chooseQuestion(index)"
      >
        {{ index + 1 }}
      </button>
      <button class="star-button" type="button"><el-icon><Star /></el-icon> 标记本题</button>
    </footer>
  </main>
</template>

<style scoped>
.practice-page {
  display: grid;
  gap: 16px;
  width: min(1440px, calc(100vw - 48px));
}

.practice-head {
  position: sticky;
  top: 70px;
  z-index: 22;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  min-height: 86px;
  padding: 16px 18px;
  border: 1px solid rgba(196, 211, 238, 0.86);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(18px);
}

.back-button,
.submit-button,
.report-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border-radius: 10px;
  font-weight: 900;
}

.back-button {
  border: 1px solid var(--border);
  padding: 0 14px;
  background: #ffffff;
  color: var(--text-secondary);
}

.paper-title {
  min-width: 0;
}

.paper-title h1 {
  overflow: hidden;
  margin: 0;
  color: #07182f;
  font-size: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paper-title > span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 900;
}

.practice-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-box {
  display: grid;
  gap: 7px;
  width: 150px;
  color: var(--text-primary);
  font-weight: 900;
}

.progress-box i,
.answer-footer i {
  display: block;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #dce9ff;
}

.progress-box b,
.answer-footer b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--gradient-1);
}

.timer-pill {
  display: grid;
  grid-template-columns: auto auto;
  gap: 2px 8px;
  align-items: center;
  color: var(--text-primary);
}

.timer-pill .el-icon {
  grid-row: span 2;
  color: var(--primary);
  font-size: 24px;
}

.timer-pill strong {
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}

.timer-pill span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.submit-button {
  border: 0;
  padding: 0 18px;
  background: var(--gradient-1);
  color: #ffffff;
}

.report-button {
  border: 1px solid var(--border);
  padding: 0 14px;
  background: #ffffff;
  color: var(--text-secondary);
}

.report-button:disabled {
  opacity: 0.48;
}

.mobile-tabs {
  display: none;
}

.work-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 430px;
  gap: 16px;
  align-items: start;
}

.workspace {
  display: grid;
  gap: 14px;
}

.question-card,
.materials-card,
.answer-card,
.evaluation-panel {
  border: 1px solid rgba(196, 211, 238, 0.86);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-sm);
}

.question-card {
  padding: 20px;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-row span {
  padding: 7px 10px;
  border-radius: 999px;
  background: #e6efff;
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.question-card h2 {
  margin: 18px 0 12px;
  color: #07182f;
  font-size: 24px;
}

.question-card p,
.question-card li {
  color: var(--text-secondary);
  line-height: 1.72;
}

.question-card ul {
  margin: 12px 0 0;
  padding-left: 20px;
}

.materials-card {
  padding: 14px;
}

.material-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.material-tabs button {
  min-height: 38px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  background: #edf3fb;
  color: #3c4a62;
  font-weight: 900;
}

.material-tabs button.active {
  background: var(--primary);
  color: #ffffff;
}

.material-body {
  max-height: 330px;
  overflow: auto;
  padding: 18px;
  border: 1px solid #e6edf7;
  border-radius: 10px;
  background: #fbfdff;
}

.material-body div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.material-body h2 {
  margin: 0;
  color: #07182f;
  font-size: 20px;
}

.material-body span {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 800;
}

.material-body p {
  margin: 16px 0 0;
  color: #24324a;
  font-size: 16px;
  line-height: 1.95;
  white-space: pre-wrap;
}

.answer-card {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.answer-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #07182f;
  font-weight: 900;
}

.answer-head span {
  color: var(--text-muted);
  font-size: 13px;
}

.answer-card textarea {
  width: 100%;
  min-height: 360px;
  padding: 18px;
  border: 1px solid #cad6e8;
  border-radius: 12px;
  outline: none;
  resize: vertical;
  color: #07182f;
  background: #fbfdff;
  font-size: 16px;
  line-height: 1.9;
}

.answer-card textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 80, 203, 0.1);
}

.answer-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 800;
}

.evaluation-panel {
  position: sticky;
  top: 172px;
  display: grid;
  align-content: start;
  gap: 14px;
  max-height: calc(100vh - 190px);
  overflow: auto;
  padding: 18px;
}

.score-summary {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5ebf5;
}

.score-ring {
  display: grid;
  place-items: center;
  width: 106px;
  height: 106px;
  border-radius: 999px;
  background:
    radial-gradient(circle at center, #ffffff 58%, transparent 59%),
    conic-gradient(var(--primary) 76%, #dbeafe 0);
}

.score-ring strong {
  color: var(--primary);
  font-size: 36px;
  line-height: 1;
}

.score-ring span {
  color: var(--text-muted);
  font-weight: 900;
}

.score-summary h2 {
  margin: 0 0 6px;
  color: #07182f;
}

.score-summary p,
.score-summary small {
  color: var(--text-secondary);
  line-height: 1.62;
}

.panel-block,
.radar-panel {
  padding: 16px;
  border: 1px solid #d9e6f7;
  border-radius: 12px;
  background: #ffffff;
}

.panel-block h3,
.panel-title h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: #07182f;
}

.panel-block p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.panel-block.success {
  border-color: rgba(8, 118, 108, 0.24);
  background: #f1fffc;
}

.panel-block.danger {
  border-color: rgba(216, 41, 76, 0.24);
  background: #fff8fa;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.panel-title a {
  color: var(--primary);
  font-weight: 900;
}

.sample p {
  max-height: 220px;
  overflow: auto;
}

.empty-review {
  display: grid;
  place-items: center;
  gap: 12px;
  min-height: 420px;
  text-align: center;
}

.empty-review .el-icon {
  color: var(--primary);
  font-size: 42px;
}

.empty-review h2,
.empty-review p {
  margin: 0;
}

.empty-review p {
  max-width: 300px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.question-dock {
  position: sticky;
  bottom: 14px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 62px;
  padding: 10px 14px;
  border: 1px solid rgba(196, 211, 238, 0.86);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(18px);
}

.question-dock span {
  margin-right: 8px;
  color: #07182f;
  font-weight: 900;
}

.question-dock button {
  min-width: 40px;
  min-height: 40px;
  border: 1px solid #d9e3f2;
  border-radius: 10px;
  background: #ffffff;
  color: #4b5870;
  font-weight: 900;
}

.question-dock button.active {
  border-color: var(--primary);
  background: #eaf3ff;
  color: var(--primary);
}

.question-dock button.done {
  border-color: var(--primary);
  background: var(--primary);
  color: #ffffff;
}

.question-dock .star-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-left: auto;
  padding: 0 14px;
}

@media (max-width: 1180px) {
  .practice-head {
    top: 72px;
    grid-template-columns: minmax(0, 1fr);
  }

  .practice-actions {
    flex-wrap: wrap;
  }

  .work-layout {
    grid-template-columns: 1fr;
  }

  .evaluation-panel {
    position: static;
    max-height: none;
  }
}

@media (max-width: 740px) {
  .practice-page {
    width: min(100vw - 32px, 680px);
  }

  .practice-head {
    position: static;
  }

  .paper-title h1 {
    white-space: normal;
  }

  .progress-box,
  .report-button {
    display: none;
  }

  .practice-actions,
  .submit-button {
    width: 100%;
  }

  .timer-pill {
    margin-right: auto;
  }

  .mobile-tabs {
    position: sticky;
    top: 72px;
    z-index: 21;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding: 8px;
    border: 1px solid rgba(196, 211, 238, 0.86);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(18px);
  }

  .mobile-tabs button {
    min-height: 40px;
    border: 0;
    border-radius: 10px;
    background: #edf3fb;
    color: #445168;
    font-weight: 900;
  }

  .mobile-tabs button.active {
    background: var(--primary);
    color: #ffffff;
  }

  .mobile-hidden {
    display: none;
  }

  .material-body {
    max-height: none;
  }

  .answer-card textarea {
    min-height: 380px;
  }

  .two-col,
  .score-summary {
    grid-template-columns: 1fr;
  }

  .question-dock {
    bottom: 88px;
    display: grid;
    grid-template-columns: auto repeat(4, 40px);
    padding: 10px;
  }

  .question-dock .star-button {
    display: none;
  }
}
</style>
