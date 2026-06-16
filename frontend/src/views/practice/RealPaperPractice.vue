<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
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
import { realPaperApi, scoringApi } from '../../api'
import AbilityRadar from '../../components/AbilityRadar.vue'
import {
  fallbackEvaluation,
  formatSeconds,
  mapBackendPaper,
  readPracticeDrafts,
  removePracticeDraft,
  savePracticeDraft,
  savePracticeRecord,
  type EvaluationResult,
  type MaterialBlock,
  type PaperQuestion,
  type PracticeDraft,
  type PracticeRecord,
  type RealPaper,
} from '../../data/policyQuest'

const route = useRoute()
const router = useRouter()

const emptyQuestion: PaperQuestion = {
  id: 'empty',
  title: '',
  prompt: '',
  score: 100,
  wordLimit: 500,
  suggestedMinutes: 7,
  requirements: [],
  dimensions: [],
  sampleAnswer: '',
}
const emptyMaterial: MaterialBlock = {
  id: 'empty',
  title: '材料',
  summary: '',
  content: '',
  wordCount: 0,
}
const emptyPaper: RealPaper = {
  id: '',
  type: 'essay',
  title: '真题加载中',
  shortTitle: '真题加载中',
  system: 'provincial',
  systemLabel: '省考',
  region: '全国',
  year: new Date().getFullYear(),
  category: '',
  paperCode: '',
  releaseDate: '',
  difficulty: '中等',
  suggestedMinutes: 150,
  questionCount: 0,
  tags: [],
  weakDimensions: [],
  materials: [],
  questions: [],
}

const paper = ref<RealPaper>(emptyPaper)
const currentIndex = ref(0)
const activeMaterialId = ref('')
const answers = ref<Record<string, string>>({})
const evaluations = ref<Record<string, EvaluationResult>>({})
const questionTimers = ref<Record<string, number>>({})
const totalSeconds = ref(0)
const submitting = ref(false)
const loading = ref(false)
let timerId: number | undefined
let allowLeave = false

const currentQuestion = computed(() => paper.value.questions[currentIndex.value] || paper.value.questions[0] || emptyQuestion)
const activeMaterial = computed(() => paper.value.materials.find(material => material.id === activeMaterialId.value) || paper.value.materials[0] || emptyMaterial)
const currentAnswer = computed({
  get: () => answers.value[currentQuestion.value.id] || '',
  set: value => {
    answers.value = { ...answers.value, [currentQuestion.value.id]: value }
  },
})
const currentEvaluation = computed(() => evaluations.value[currentQuestion.value.id])
const wordCount = computed(() => currentAnswer.value.trim().replace(/\s/g, '').length)
const progressPercent = computed(() => (paper.value.questions.length ? Math.round(((currentIndex.value + 1) / paper.value.questions.length) * 100) : 0))
const submittedCount = computed(() => Object.keys(evaluations.value).length)
const answeredCount = computed(() => Object.values(answers.value).filter(answer => answer.trim().length > 0).length)
const currentQuestionTime = computed(() => questionTimers.value[currentQuestion.value.id] || 0)
const allSubmitted = computed(() => paper.value.questions.length > 0 && submittedCount.value === paper.value.questions.length)
const hasWork = computed(() => answeredCount.value > 0 || submittedCount.value > 0 || totalSeconds.value > 20)
const shouldPromptOnLeave = computed(() => Boolean(paper.value.id && hasWork.value && !allSubmitted.value))

watch(
  paper,
  nextPaper => {
    currentIndex.value = 0
    activeMaterialId.value = nextPaper.materials[0]?.id || ''
  },
  { immediate: true },
)

watch(
  () => route.params.paperId,
  async paperId => {
    loading.value = true
    try {
      const response: any = await realPaperApi.detail(String(paperId))
      const nextPaper = mapBackendPaper(response.data)
      paper.value = nextPaper
      resetWorkspace()
      await restoreDraftIfNeeded(nextPaper)
    } catch {
      ElMessage.error('真题加载失败，请返回题库重试')
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

onMounted(() => {
  timerId = window.setInterval(() => {
    if (!paper.value.id || loading.value) return
    totalSeconds.value += 1
    const questionId = currentQuestion.value?.id
    if (questionId) {
      questionTimers.value = {
        ...questionTimers.value,
        [questionId]: (questionTimers.value[questionId] || 0) + 1,
      }
    }
  }, 1000)
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  if (timerId) window.clearInterval(timerId)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave(async () => {
  if (allowLeave || !shouldPromptOnLeave.value) return true

  try {
    await ElMessageBox.confirm('当前真题还没有完成，是否保存进度后退出？', '保存进度', {
      confirmButtonText: '保存并退出',
      cancelButtonText: '直接退出',
      distinguishCancelAndClose: true,
      type: 'warning',
    })
    saveDraft(false)
    allowLeave = true
    return true
  } catch (action) {
    if (action === 'cancel') {
      allowLeave = true
      return true
    }
    return false
  }
})

function resetWorkspace() {
  answers.value = {}
  evaluations.value = {}
  questionTimers.value = {}
  totalSeconds.value = 0
}

async function restoreDraftIfNeeded(nextPaper: RealPaper) {
  const draft = readPracticeDrafts().find(item => item.paperId === nextPaper.id)
  if (!draft) return

  if (route.query.resume === '1') {
    restoreDraft(draft)
    ElMessage.success('已恢复上次保存的进度')
    return
  }

  try {
    await ElMessageBox.confirm('检测到这套真题有未完成进度，是否恢复？', '继续做题', {
      confirmButtonText: '恢复进度',
      cancelButtonText: '重新开始',
      type: 'info',
    })
    restoreDraft(draft)
  } catch {
    // Keep the old draft in the history panel; this run starts clean.
  }
}

function restoreDraft(draft: PracticeDraft) {
  const maxIndex = Math.max(0, paper.value.questions.length - 1)
  currentIndex.value = Math.min(Math.max(draft.currentIndex, 0), maxIndex)
  activeMaterialId.value = paper.value.materials.some(material => material.id === draft.activeMaterialId)
    ? draft.activeMaterialId
    : paper.value.materials[0]?.id || ''
  answers.value = { ...draft.answers }
  evaluations.value = { ...draft.evaluations }
  questionTimers.value = { ...draft.questionTimers }
  totalSeconds.value = draft.totalSeconds || 0
}

function buildDraft(): PracticeDraft {
  return {
    id: `draft-${paper.value.id}`,
    paperId: paper.value.id,
    paperTitle: paper.value.title,
    type: paper.value.type,
    currentIndex: currentIndex.value,
    activeMaterialId: activeMaterialId.value,
    answers: { ...answers.value },
    evaluations: { ...evaluations.value },
    questionTimers: { ...questionTimers.value },
    totalSeconds: totalSeconds.value,
    updatedAt: new Date().toISOString(),
  }
}

function saveDraft(showMessage = true) {
  if (!paper.value.id) return
  savePracticeDraft(buildDraft())
  if (showMessage) ElMessage.success('进度已保存，可在真题库的做题历史继续')
}

function chooseQuestion(index: number) {
  currentIndex.value = index
}

function chooseMaterial(id: string) {
  activeMaterialId.value = id
}

function isGarbled(text: unknown) {
  return /�|锟|閿|乱码/.test(String(text || ''))
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
    saveDraft(false)
    ElMessage.success('本题已提交，AI 评阅结果已生成')
  } finally {
    submitting.value = false
  }
}

function finishPaper() {
  if (!allSubmitted.value) {
    ElMessage.warning('请先提交本卷所有题目；暂时离开可点击保存进度')
    return
  }
  removePracticeDraft(paper.value.id)
  allowLeave = true
  ElMessage.success('本卷已完成，已同步到做题历史')
  router.push('/report')
}

function exitPractice() {
  router.push({
    path: '/papers',
    query: route.query.preview === '1' ? { preview: '1', type: paper.value.type } : { type: paper.value.type },
  })
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!shouldPromptOnLeave.value) return
  event.preventDefault()
  event.returnValue = ''
}
</script>

<template>
  <main class="immersive-practice" :class="paper.type">
    <header class="immersive-topbar">
      <button type="button" class="ghost-button" @click="exitPractice">
        <el-icon><ArrowLeft /></el-icon>
        返回真题库
      </button>

      <section class="paper-heading">
        <p>{{ paper.type === 'essay' ? '申论沉浸作答' : '面试沉浸作答' }}</p>
        <h1>{{ paper.title }}</h1>
        <span>题目 {{ currentIndex + 1 }} / {{ paper.questions.length }} · {{ paper.systemLabel }} · {{ paper.category }}</span>
      </section>

      <section class="top-actions">
        <div class="progress-box">
          <strong>{{ progressPercent }}%</strong>
          <i><b :style="{ width: `${progressPercent}%` }"></b></i>
        </div>
        <div class="timer-pill">
          <el-icon><Timer /></el-icon>
          <strong>{{ formatSeconds(totalSeconds) }}</strong>
          <span>总用时</span>
        </div>
        <button class="save-button" type="button" :disabled="loading || !paper.questions.length" @click="saveDraft()">
          保存进度
        </button>
        <button class="submit-button" type="button" :disabled="loading || submitting || !paper.questions.length" @click="submitQuestion">
          {{ loading ? '加载中' : submitting ? '评阅中' : currentEvaluation ? '重新提交' : '提交本题' }}
        </button>
        <button class="finish-button" type="button" :class="{ ready: allSubmitted }" @click="finishPaper">提交本卷</button>
      </section>
    </header>

    <section class="immersive-shell">
      <section class="material-pane">
        <nav class="side-tabs material-tabs" aria-label="材料导航">
          <button
            v-for="(material, index) in paper.materials"
            :key="material.id"
            type="button"
            :class="{ active: activeMaterialId === material.id }"
            @click="chooseMaterial(material.id)"
          >
            <span>材料</span>
            <strong>{{ index + 1 }}</strong>
          </button>
        </nav>

        <article class="reader-card">
          <div class="pane-head">
            <div>
              <p>Material Reader</p>
              <h2>{{ activeMaterial.title }}</h2>
            </div>
            <span>约 {{ activeMaterial.wordCount }} 字</span>
          </div>
          <div class="reader-body">{{ activeMaterial.content || activeMaterial.summary || '暂无材料内容' }}</div>
        </article>
      </section>

      <section class="answer-pane">
        <nav class="side-tabs question-tabs" aria-label="题目导航">
          <button
            v-for="(question, index) in paper.questions"
            :key="question.id"
            type="button"
            :class="{ active: currentIndex === index, done: evaluations[question.id] }"
            @click="chooseQuestion(index)"
          >
            <span>题</span>
            <strong>{{ index + 1 }}</strong>
          </button>
        </nav>

        <section class="answer-workbench">
          <article class="prompt-card">
            <div class="meta-row">
              <span>{{ paper.type === 'essay' ? '申论' : '面试' }}</span>
              <span>{{ currentQuestion.score }} 分</span>
              <span>{{ currentQuestion.suggestedMinutes }} 分钟建议</span>
              <span>{{ currentQuestion.wordLimit }} 字以内</span>
            </div>
            <h2>{{ currentQuestion.title }}</h2>
            <p>{{ currentQuestion.prompt }}</p>
            <ul v-if="currentQuestion.requirements.length">
              <li v-for="item in currentQuestion.requirements" :key="item">{{ item }}</li>
            </ul>
          </article>

          <article class="answer-card">
            <div class="answer-head">
              <strong>作答区</strong>
              <span>已输入 {{ wordCount }} 字 · 本题用时 {{ formatSeconds(currentQuestionTime) }}</span>
            </div>
            <textarea
              v-model="currentAnswer"
              :placeholder="paper.type === 'essay' ? '请根据左侧材料作答，先提炼要点，再展开成完整答案...' : '请按结构化面试口径组织表达，注意身份感、交流感和层次...'"
            ></textarea>
            <div class="answer-footer">
              <i><b :style="{ width: `${Math.min(100, Math.round((wordCount / currentQuestion.wordLimit) * 100))}%` }"></b></i>
              <span>{{ submittedCount }} / {{ paper.questions.length }} 题已提交</span>
            </div>
          </article>

          <article v-if="currentEvaluation" class="review-card">
            <section class="score-summary">
              <div class="score-ring">
                <strong>{{ currentEvaluation.score }}</strong>
                <span>/100</span>
              </div>
              <div>
                <p>AI Review</p>
                <h2>{{ currentEvaluation.level }}</h2>
                <span>{{ currentEvaluation.summary }}</span>
              </div>
            </section>

            <section class="review-grid">
              <div class="review-block">
                <h3><el-icon><MagicStick /></el-icon> 修改建议</h3>
                <p v-for="item in currentEvaluation.suggestions.slice(0, 3)" :key="item">{{ item }}</p>
              </div>
              <div class="review-block success">
                <h3><el-icon><CircleCheck /></el-icon> 优点</h3>
                <p v-for="item in currentEvaluation.advantages.slice(0, 2)" :key="item">{{ item }}</p>
              </div>
              <div class="review-block danger">
                <h3><el-icon><Warning /></el-icon> 缺点</h3>
                <p v-for="item in currentEvaluation.disadvantages.slice(0, 2)" :key="item">{{ item }}</p>
              </div>
            </section>

            <section class="radar-card">
              <div>
                <h3><el-icon><Reading /></el-icon> 维度雷达</h3>
                <router-link to="/report">查看完整报告</router-link>
              </div>
              <AbilityRadar :items="currentEvaluation.dimensions" :height="230" />
            </section>

            <section class="sample-card">
              <h3><el-icon><DocumentChecked /></el-icon> 参考表达</h3>
              <p>{{ currentEvaluation.sampleEssay }}</p>
            </section>
          </article>

          <article v-else class="review-empty">
            <el-icon><EditPen /></el-icon>
            <h2>提交本题后查看 AI 评阅</h2>
            <p>评阅结果会出现在答题区下方，不会打断左侧材料阅读。</p>
          </article>
        </section>
      </section>
    </section>

    <button class="floating-star" type="button">
      <el-icon><Star /></el-icon>
      标记本题
    </button>
  </main>
</template>

<style scoped>
.immersive-practice {
  min-height: 100vh;
  padding: 18px;
  background:
    linear-gradient(90deg, rgba(0, 80, 203, 0.055) 1px, transparent 1px),
    linear-gradient(180deg, #f5f9ff 0%, #ffffff 46%, #f4fbff 100%);
  background-size: 42px 42px, auto;
}

.immersive-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  min-height: 86px;
  padding: 14px 18px;
  border: 1px solid rgba(196, 211, 238, 0.86);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 40px rgba(19, 42, 74, 0.08);
  backdrop-filter: blur(18px);
}

.ghost-button,
.save-button,
.submit-button,
.finish-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border-radius: 12px;
  font-weight: 900;
}

.ghost-button,
.save-button,
.finish-button {
  border: 1px solid var(--border);
  background: #ffffff;
  color: var(--text-secondary);
}

.ghost-button {
  padding: 0 14px;
}

.save-button,
.submit-button,
.finish-button {
  padding: 0 16px;
}

.submit-button {
  border: 0;
  background: var(--gradient-1);
  color: #ffffff;
}

.finish-button.ready {
  border-color: rgba(8, 118, 108, 0.22);
  background: var(--success-soft);
  color: var(--success);
}

.paper-heading {
  min-width: 0;
}

.paper-heading p,
.pane-head p,
.score-summary p {
  margin: 0 0 4px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.paper-heading h1 {
  overflow: hidden;
  margin: 0;
  color: #07182f;
  font-size: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paper-heading span {
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-box {
  display: grid;
  gap: 7px;
  width: 150px;
  color: var(--text-primary);
}

.progress-box strong {
  font-size: 15px;
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

.immersive-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(430px, 0.95fr);
  gap: 16px;
  width: min(1680px, calc(100vw - 36px));
  margin: 16px auto 0;
}

.material-pane,
.answer-pane {
  display: grid;
  gap: 12px;
  min-height: calc(100vh - 128px);
}

.material-pane {
  grid-template-columns: 66px minmax(0, 1fr);
}

.answer-pane {
  grid-template-columns: 66px minmax(0, 1fr);
}

.side-tabs {
  position: sticky;
  top: 118px;
  display: grid;
  align-content: start;
  gap: 10px;
  height: calc(100vh - 138px);
  padding: 10px;
  border: 1px solid rgba(196, 211, 238, 0.86);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 12px 30px rgba(19, 42, 74, 0.06);
  backdrop-filter: blur(18px);
}

.side-tabs button {
  display: grid;
  place-items: center;
  gap: 2px;
  min-height: 56px;
  border: 1px solid #dbe6f5;
  border-radius: 14px;
  background: #ffffff;
  color: #536178;
  font-weight: 900;
}

.side-tabs button span {
  font-size: 11px;
}

.side-tabs button strong {
  font-size: 18px;
}

.side-tabs button.active {
  border-color: rgba(0, 80, 203, 0.26);
  background: var(--primary);
  color: #ffffff;
}

.side-tabs button.done:not(.active) {
  border-color: rgba(8, 118, 108, 0.25);
  background: var(--success-soft);
  color: var(--success);
}

.reader-card,
.answer-workbench {
  border: 1px solid rgba(196, 211, 238, 0.86);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(19, 42, 74, 0.08);
}

.reader-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: calc(100vh - 128px);
  overflow: hidden;
}

.pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid #e6edf7;
}

.pane-head h2 {
  margin: 0;
  color: #07182f;
  font-size: 22px;
}

.pane-head > span {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 900;
}

.reader-body {
  overflow: auto;
  padding: 24px;
  color: #1c2c46;
  font-size: 17px;
  line-height: 2.05;
  white-space: pre-wrap;
}

.answer-workbench {
  display: grid;
  gap: 14px;
  min-height: calc(100vh - 128px);
  padding: 16px;
  overflow: auto;
}

.prompt-card,
.answer-card,
.review-card,
.review-empty {
  border: 1px solid #dfe8f5;
  border-radius: 16px;
  background: #ffffff;
}

.prompt-card {
  padding: 18px;
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

.prompt-card h2 {
  margin: 16px 0 10px;
  color: #07182f;
  font-size: 24px;
  line-height: 1.35;
}

.prompt-card p,
.prompt-card li {
  color: var(--text-secondary);
  line-height: 1.72;
}

.prompt-card ul {
  margin: 12px 0 0;
  padding-left: 20px;
}

.answer-card {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.answer-head,
.answer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.answer-head strong {
  color: #07182f;
  font-size: 18px;
}

.answer-head span,
.answer-footer span {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 800;
}

.answer-card textarea {
  width: 100%;
  min-height: 420px;
  padding: 18px;
  border: 1px solid #cad6e8;
  border-radius: 14px;
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
}

.review-card {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.score-summary {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5ebf5;
}

.score-ring {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border-radius: 999px;
  background:
    radial-gradient(circle at center, #ffffff 58%, transparent 59%),
    conic-gradient(var(--primary) 76%, #dbeafe 0);
}

.score-ring strong {
  color: var(--primary);
  font-size: 34px;
  line-height: 1;
}

.score-ring span {
  color: var(--text-muted);
  font-weight: 900;
}

.score-summary h2 {
  margin: 0 0 8px;
  color: #07182f;
  font-size: 24px;
}

.score-summary span {
  color: var(--text-secondary);
  line-height: 1.65;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.review-block,
.radar-card,
.sample-card {
  padding: 16px;
  border: 1px solid #d9e6f7;
  border-radius: 14px;
  background: #ffffff;
}

.review-block.success {
  border-color: rgba(8, 118, 108, 0.24);
  background: #f1fffc;
}

.review-block.danger {
  border-color: rgba(216, 41, 76, 0.24);
  background: #fff8fa;
}

.review-block h3,
.radar-card h3,
.sample-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  color: #07182f;
}

.review-block p,
.sample-card p,
.review-empty p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.72;
}

.radar-card > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.radar-card a {
  color: var(--primary);
  font-weight: 900;
}

.sample-card p {
  max-height: 220px;
  overflow: auto;
}

.review-empty {
  display: grid;
  place-items: center;
  gap: 12px;
  min-height: 240px;
  padding: 20px;
  text-align: center;
}

.review-empty .el-icon {
  color: var(--primary);
  font-size: 42px;
}

.review-empty h2,
.review-empty p {
  margin: 0;
}

.floating-star {
  position: fixed;
  right: 24px;
  bottom: 22px;
  z-index: 35;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid rgba(196, 211, 238, 0.86);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: var(--text-secondary);
  font-weight: 900;
  box-shadow: 0 12px 30px rgba(19, 42, 74, 0.1);
  backdrop-filter: blur(18px);
}

@media (max-width: 1280px) {
  .immersive-topbar {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .top-actions {
    grid-column: 1 / -1;
    flex-wrap: wrap;
  }

  .immersive-shell {
    grid-template-columns: 1fr;
  }

  .material-pane,
  .answer-pane,
  .reader-card,
  .answer-workbench {
    min-height: auto;
  }

  .reader-card,
  .answer-workbench {
    max-height: none;
  }

  .side-tabs {
    top: 150px;
    height: auto;
    max-height: calc(100vh - 172px);
  }
}

@media (max-width: 760px) {
  .immersive-practice {
    padding: 10px;
  }

  .immersive-topbar {
    position: static;
    grid-template-columns: 1fr;
  }

  .paper-heading h1 {
    white-space: normal;
  }

  .top-actions {
    gap: 8px;
  }

  .progress-box {
    width: 100%;
  }

  .save-button,
  .submit-button,
  .finish-button,
  .ghost-button {
    flex: 1;
    min-width: 132px;
  }

  .immersive-shell {
    width: 100%;
  }

  .material-pane,
  .answer-pane {
    grid-template-columns: 1fr;
  }

  .side-tabs {
    position: static;
    display: flex;
    overflow-x: auto;
    padding: 8px;
  }

  .side-tabs button {
    min-width: 62px;
  }

  .reader-body {
    padding: 18px;
    font-size: 16px;
  }

  .answer-card textarea {
    min-height: 360px;
  }

  .review-grid,
  .score-summary {
    grid-template-columns: 1fr;
  }

  .floating-star {
    display: none;
  }
}
</style>
