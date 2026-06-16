<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Back,
  CircleCheck,
  DocumentChecked,
  EditPen,
  Finished,
  FolderChecked,
  MagicStick,
  Promotion,
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
  isFavoritePaper,
  toggleFavoritePaper,
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
const favoriteVersion = ref(0)
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
const activeMaterialIndex = computed(() => Math.max(0, paper.value.materials.findIndex(material => material.id === activeMaterialId.value)))
const activeMaterialLabel = computed(() => `材料${activeMaterialIndex.value + 1}`)
const currentQuestionLabel = computed(() => `题${currentIndex.value + 1}`)
const wordLimitText = computed(() => (currentQuestion.value.wordLimit > 0 ? `${currentQuestion.value.wordLimit} 字以内` : '口述不限字'))
const wordLimitBase = computed(() => (currentQuestion.value.wordLimit > 0 ? currentQuestion.value.wordLimit : 500))
const wordProgress = computed(() => Math.min(100, Math.round((wordCount.value / wordLimitBase.value) * 100)))
const highlightedMaterialHtml = computed(() => buildReaderHtml(activeMaterial.value.content || activeMaterial.value.summary || ''))
const questionPositionText = computed(() => `${currentIndex.value + 1} / ${paper.value.questions.length || 0}`)
const paperFavorite = computed(() => {
  favoriteVersion.value
  return Boolean(paper.value.id && isFavoritePaper(paper.value.id))
})

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
  if (showMessage) ElMessage.success('进度已保存，可在做题历史继续')
}

function goPreviousQuestion() {
  if (currentIndex.value <= 0) return
  currentIndex.value -= 1
}

function goNextQuestion() {
  if (currentIndex.value >= paper.value.questions.length - 1) return
  currentIndex.value += 1
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
  router.push('/history')
}

async function exitPractice() {
  if (shouldPromptOnLeave.value) {
    try {
      await ElMessageBox.confirm('当前真题还没有完成，是否保存进度后退出？', '保存进度', {
        confirmButtonText: '保存并退出',
        cancelButtonText: '直接退出',
        distinguishCancelAndClose: true,
        type: 'warning',
      })
      saveDraft(false)
    } catch (action) {
      if (action !== 'cancel') return
    }
  }

  allowLeave = true
  router.push(exitTarget())
}

function exitTarget() {
  const fromHistory = route.query.from === 'history'
  const query: Record<string, string> = {}
  if (route.query.preview === '1') query.preview = '1'
  if (!fromHistory) query.type = paper.value.type
  return {
    path: fromHistory ? '/history' : '/papers',
    query,
  }
}

function toggleFavorite() {
  if (!paper.value.id) return
  const isFavorited = toggleFavoritePaper(paper.value)
  favoriteVersion.value += 1
  ElMessage.success(isFavorited ? '已收藏到做题历史' : '已取消收藏')
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!shouldPromptOnLeave.value) return
  event.preventDefault()
  event.returnValue = ''
}

function buildReaderHtml(value: string) {
  const raw = String(value || '').trim()
  if (!raw) return '<p>暂无材料内容</p>'
  const normalized = raw
    .replace(/\r\n/g, '\n')
    .replace(/([。！？])\s*((?:19|20)\d{2}年|首先|其次|再次|最后|同时|后来|转折|此后|此前)/g, '$1\n$2')
  const paragraphs = normalized.split(/\n+/).map(item => item.trim()).filter(Boolean)
  return paragraphs.map(paragraph => `<p>${highlightReaderText(escapeHtml(paragraph))}</p>`).join('')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function highlightReaderText(value: string) {
  return [
    /((?:19|20)\d{2}年(?:[春夏秋冬]?(?:前|后|初|末|的一天)?)?)/g,
    /(鲁师傅|广合烧饼|广合县|市场监督管理部门|监管部门|县工商局|工作人员)/g,
    /(四个阶段|新阶段|第一阶段|第二阶段|第三阶段|第四阶段|转折|此前|此后|后来)/g,
  ].reduce((text, pattern) => text.replace(pattern, '<mark class="reader-highlight">$1</mark>'), value)
}
</script>

<template>
  <main class="focus-practice" :class="paper.type">
    <header class="focus-topbar">
      <button type="button" class="icon-button" aria-label="返回真题库" data-tooltip="返回" @click="exitPractice">
        <el-icon><Back /></el-icon>
      </button>

      <section class="focus-position" aria-label="当前作答位置">
        <strong>{{ activeMaterialLabel }}</strong>
        <span>/</span>
        <strong>{{ currentQuestionLabel }}</strong>
      </section>

      <section class="focus-clock" aria-label="总用时">
        <el-icon><Timer /></el-icon>
        <strong>{{ formatSeconds(totalSeconds) }}</strong>
      </section>

      <section class="focus-progress" aria-label="题目进度">
        <span>{{ progressPercent }}%</span>
        <i><b :style="{ width: `${progressPercent}%` }"></b></i>
        <div class="question-switcher">
          <button
            type="button"
            aria-label="上一题"
            :disabled="currentIndex === 0"
            @click="goPreviousQuestion"
          >
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <strong>题 {{ questionPositionText }}</strong>
          <button
            type="button"
            aria-label="下一题"
            :disabled="currentIndex >= paper.questions.length - 1"
            @click="goNextQuestion"
          >
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>
      </section>

      <section class="focus-actions" aria-label="作答操作">
        <button
          type="button"
          class="icon-button"
          :disabled="loading || !paper.questions.length"
          aria-label="保存进度"
          data-tooltip="保存"
          @click="saveDraft()"
        >
          <el-icon><FolderChecked /></el-icon>
        </button>
        <button
          type="button"
          class="icon-button primary"
          :disabled="loading || submitting || !paper.questions.length"
          :aria-label="currentEvaluation ? '重新提交本题' : '提交本题'"
          :data-tooltip="currentEvaluation ? '重交本题' : '提交本题'"
          @click="submitQuestion"
        >
          <el-icon><Promotion /></el-icon>
        </button>
        <button
          type="button"
          class="icon-button"
          :class="{ ready: allSubmitted }"
          aria-label="提交本卷"
          data-tooltip="提交本卷"
          @click="finishPaper"
        >
          <el-icon><Finished /></el-icon>
        </button>
      </section>
    </header>

    <section class="focus-stage">
      <aside class="material-rail" aria-label="材料导航">
        <span>材料</span>
        <button
          v-for="(material, index) in paper.materials"
          :key="material.id"
          type="button"
          :class="{ active: activeMaterialId === material.id }"
          :aria-label="`切换到材料 ${index + 1}`"
          @click="chooseMaterial(material.id)"
        >
          <strong>{{ index + 1 }}</strong>
          <small>{{ material.title }}</small>
        </button>
      </aside>

      <article class="paper-reader">
        <header class="reader-title">
          <div>
            <span>{{ paper.shortTitle || paper.title }}</span>
            <h1>{{ activeMaterial.title }}</h1>
          </div>
          <em>约 {{ activeMaterial.wordCount }} 字</em>
        </header>
        <section class="reader-sheet" v-html="highlightedMaterialHtml"></section>
      </article>

      <section class="answer-sheet">
        <article class="question-compose">
          <header class="question-head">
            <div>
              <span>{{ paper.type === 'essay' ? '申论' : '面试' }} · {{ currentQuestionLabel }}</span>
              <h1>{{ currentQuestion.title }}</h1>
            </div>
            <button
              type="button"
              class="favorite-button"
              :class="{ active: paperFavorite }"
              :aria-label="paperFavorite ? '取消收藏本卷' : '收藏本卷'"
              :data-tooltip="paperFavorite ? '取消收藏' : '收藏本卷'"
              @click="toggleFavorite"
            >
              <el-icon><Star /></el-icon>
            </button>
          </header>

          <p class="question-prompt">{{ currentQuestion.prompt }}</p>
          <div v-if="currentQuestion.requirements.length" class="requirement-line">
            <span>要求：</span>
            <strong v-for="item in currentQuestion.requirements" :key="item">{{ item }}</strong>
          </div>

          <textarea
            v-model="currentAnswer"
            :placeholder="paper.type === 'essay' ? '请在这里作答。先提炼材料要点，再展开成完整答案...' : '请按结构化面试口径组织表达，注意身份感、交流感和层次...'"
          ></textarea>

          <footer class="compose-footer">
            <span>字数：{{ wordCount }} / {{ currentQuestion.wordLimit > 0 ? currentQuestion.wordLimit : '不限' }}</span>
            <span>建议用时：{{ currentQuestion.suggestedMinutes }} 分钟</span>
            <span>{{ wordLimitText }}</span>
            <i><b :style="{ width: `${wordProgress}%` }"></b></i>
          </footer>
        </article>

        <article v-if="currentEvaluation" class="review-card">
          <section class="score-summary">
            <div class="score-ring">
              <strong>{{ currentEvaluation.score }}</strong>
              <span>/100</span>
            </div>
            <div>
              <p>AI 评阅</p>
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
            <AbilityRadar :items="currentEvaluation.dimensions" :height="220" />
          </section>

          <section class="sample-card">
            <h3><el-icon><DocumentChecked /></el-icon> 参考表达</h3>
            <p>{{ currentEvaluation.sampleEssay }}</p>
          </section>
        </article>

        <article v-else class="review-empty">
          <el-icon><EditPen /></el-icon>
          <strong>提交本题后查看 AI 评阅</strong>
          <span>评阅结果会安静地出现在作答区下方，不打断阅读和写作节奏。</span>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.focus-practice {
  min-height: 100vh;
  padding: 0 24px 28px;
  background: linear-gradient(180deg, rgba(248, 249, 247, 0.98) 0%, #f2f3ef 100%);
  color: #172033;
}

.focus-topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: 44px minmax(150px, 1fr) minmax(180px, auto) minmax(250px, 0.8fr) auto;
  gap: 16px;
  align-items: center;
  min-height: 64px;
  border-bottom: 1px solid rgba(31, 42, 64, 0.08);
  background: rgba(248, 249, 247, 0.86);
  backdrop-filter: blur(18px);
}

.icon-button,
.favorite-button {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(35, 50, 78, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.74);
  color: #4d5d75;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.icon-button::after,
.favorite-button::after {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  z-index: 50;
  padding: 5px 8px;
  border-radius: 8px;
  background: #172033;
  color: #ffffff;
  content: attr(data-tooltip);
  font-size: 12px;
  font-weight: 700;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(-4px);
  transition: opacity 0.16s ease, transform 0.16s ease;
  white-space: nowrap;
}

.icon-button:hover::after,
.favorite-button:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.icon-button:hover,
.favorite-button:hover {
  border-color: rgba(64, 107, 180, 0.24);
  background: #ffffff;
  color: #2f63b7;
  transform: translateY(-1px);
}

.icon-button.primary {
  border-color: #2f63b7;
  background: #2f63b7;
  color: #ffffff;
}

.icon-button.ready {
  border-color: rgba(26, 113, 94, 0.18);
  background: #e8f5ee;
  color: #1a715e;
}

.favorite-button.active {
  border-color: rgba(47, 99, 183, 0.28);
  background: #edf3fb;
  color: #2f63b7;
}

.favorite-button.active .el-icon {
  fill: currentColor;
}

.icon-button .el-icon,
.favorite-button .el-icon {
  font-size: 20px;
}

.focus-position {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #172033;
  font-size: 16px;
}

.focus-position strong {
  font-weight: 900;
}

.focus-position span {
  color: #98a1ae;
}

.focus-clock {
  justify-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 174px;
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid rgba(35, 50, 78, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: #172033;
  font-variant-numeric: tabular-nums;
}

.focus-clock .el-icon {
  color: #2f63b7;
  font-size: 20px;
}

.focus-clock strong {
  font-size: 20px;
  font-weight: 900;
}

.focus-progress {
  display: grid;
  grid-template-columns: auto minmax(90px, 1fr) auto;
  gap: 10px;
  align-items: center;
  color: #5d6878;
  font-size: 13px;
  font-weight: 900;
}

.focus-progress > i,
.compose-footer i {
  display: block;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #d8ddd8;
}

.focus-progress b,
.compose-footer b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2f63b7;
}

.question-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-switcher button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid rgba(35, 50, 78, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: #4d5d75;
}

.question-switcher button:not(:disabled):hover {
  border-color: rgba(47, 99, 183, 0.28);
  background: #2f63b7;
  color: #ffffff;
}

.question-switcher strong {
  min-width: 58px;
  color: #172033;
  text-align: center;
  font-size: 13px;
  font-weight: 900;
}

.focus-actions {
  display: flex;
  justify-content: end;
  gap: 8px;
}

.focus-stage {
  display: grid;
  grid-template-columns: 118px minmax(420px, 0.92fr) minmax(480px, 1.08fr);
  gap: 22px;
  width: min(1680px, calc(100vw - 48px));
  margin: 28px auto 0;
}

.material-rail {
  position: sticky;
  top: 88px;
  display: grid;
  align-content: start;
  gap: 10px;
  height: calc(100vh - 112px);
  padding-top: 12px;
}

.material-rail > span {
  color: #677384;
  font-size: 13px;
  font-weight: 800;
}

.material-rail button {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-height: 46px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #758193;
  text-align: left;
}

.material-rail strong {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #e3e7e4;
  color: #687385;
  font-size: 13px;
}

.material-rail small {
  overflow: hidden;
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-rail button.active {
  padding-right: 14px;
  background: #2f63b7;
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(47, 99, 183, 0.18);
}

.material-rail button.active strong {
  background: #ffffff;
  color: #2f63b7;
}

.paper-reader,
.answer-sheet {
  min-height: calc(100vh - 112px);
}

.paper-reader {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(41, 52, 71, 0.08);
  border-radius: 18px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.86)), #fbfaf5;
  box-shadow: 0 24px 50px rgba(31, 42, 64, 0.08);
}

.paper-reader::after {
  position: absolute;
  right: -34px;
  bottom: -44px;
  width: 150px;
  height: 150px;
  border: 1px solid rgba(190, 170, 120, 0.14);
  background: linear-gradient(135deg, transparent 48%, rgba(229, 216, 179, 0.32) 49%);
  content: "";
  transform: rotate(8deg);
}

.reader-title {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 30px 42px 10px;
}

.reader-title span {
  display: block;
  margin-bottom: 8px;
  color: #778091;
  font-size: 13px;
  font-weight: 800;
}

.reader-title h1 {
  margin: 0;
  color: #172033;
  font-size: 28px;
  line-height: 1.25;
}

.reader-title em {
  color: #8a93a1;
  font-size: 13px;
  font-style: normal;
  font-weight: 800;
  white-space: nowrap;
}

.reader-sheet {
  max-width: 760px;
  margin: 0 auto;
  padding: 18px 42px 34px;
  color: #243047;
  font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
  font-size: 17px;
  line-height: 1.95;
}

.reader-sheet :deep(p) {
  margin: 0 0 22px;
}

.reader-sheet :deep(.reader-highlight) {
  padding: 1px 4px;
  border-radius: 5px;
  background: rgba(211, 180, 89, 0.2);
  color: #1f2b42;
}

.answer-sheet {
  display: grid;
  align-content: start;
  gap: 16px;
}

.question-compose,
.review-card,
.review-empty {
  border: 1px solid rgba(41, 52, 71, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 50px rgba(31, 42, 64, 0.08);
}

.question-compose {
  display: grid;
  gap: 16px;
  min-height: calc(100vh - 112px);
  padding: 30px;
}

.question-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
}

.question-head span {
  display: inline-flex;
  width: fit-content;
  min-height: 34px;
  align-items: center;
  padding: 0 16px;
  border-radius: 999px;
  background: #2f63b7;
  color: #ffffff;
  font-size: 14px;
  font-weight: 900;
}

.question-head h1 {
  max-width: 780px;
  margin: 18px 0 0;
  color: #172033;
  font-size: 25px;
  line-height: 1.48;
}

.question-prompt {
  max-width: 780px;
  margin: 0;
  color: #4a5568;
  font-size: 15px;
  line-height: 1.75;
}

.requirement-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: #596579;
  font-size: 14px;
}

.requirement-line span {
  font-weight: 900;
}

.requirement-line strong {
  padding: 5px 10px;
  border-radius: 999px;
  background: #edf2f8;
  color: #52627a;
  font-size: 13px;
}

.question-compose textarea {
  width: 100%;
  min-height: 430px;
  flex: 1;
  padding: 20px 22px;
  border: 1px solid rgba(41, 52, 71, 0.1);
  border-radius: 14px;
  outline: none;
  resize: vertical;
  background: #fbfcfb;
  color: #172033;
  font-size: 16px;
  line-height: 1.9;
}

.question-compose textarea:focus {
  border-color: rgba(47, 99, 183, 0.45);
  box-shadow: 0 0 0 4px rgba(47, 99, 183, 0.08);
}

.compose-footer {
  display: grid;
  grid-template-columns: auto auto auto minmax(130px, 1fr);
  gap: 14px;
  align-items: center;
  color: #6d7889;
  font-size: 13px;
  font-weight: 800;
}

.review-card {
  display: grid;
  gap: 14px;
  padding: 20px;
}

.score-summary {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(41, 52, 71, 0.08);
}

.score-ring {
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  border-radius: 999px;
  background: radial-gradient(circle at center, #ffffff 58%, transparent 59%), conic-gradient(#2f63b7 76%, #d8ddd8 0);
}

.score-ring strong {
  color: #2f63b7;
  font-size: 31px;
  line-height: 1;
}

.score-ring span {
  color: #7a8494;
  font-weight: 900;
}

.score-summary p {
  margin: 0 0 5px;
  color: #2f63b7;
  font-size: 13px;
  font-weight: 900;
}

.score-summary h2 {
  margin: 0 0 8px;
  color: #172033;
  font-size: 22px;
}

.score-summary span {
  color: #4a5568;
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
  border: 1px solid rgba(41, 52, 71, 0.08);
  border-radius: 14px;
  background: #ffffff;
}

.review-block.success {
  background: #f3faf6;
}

.review-block.danger {
  background: #fff8f8;
}

.review-block h3,
.radar-card h3,
.sample-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  color: #172033;
}

.review-block p,
.sample-card p,
.review-empty span {
  margin: 8px 0 0;
  color: #4a5568;
  line-height: 1.72;
}

.radar-card > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.radar-card a {
  color: #2f63b7;
  font-weight: 900;
}

.sample-card p {
  max-height: 220px;
  overflow: auto;
}

.review-empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  min-height: 132px;
  padding: 22px;
  color: #6d7889;
  text-align: center;
}

.review-empty .el-icon {
  color: #2f63b7;
  font-size: 32px;
}

.review-empty strong {
  color: #172033;
}

@media (max-width: 1260px) {
  .focus-topbar {
    grid-template-columns: 44px minmax(120px, 1fr) auto auto;
  }

  .focus-progress {
    grid-column: 2 / -1;
  }

  .focus-stage {
    grid-template-columns: 96px 1fr;
  }

  .answer-sheet {
    grid-column: 2;
  }

  .paper-reader,
  .question-compose {
    min-height: auto;
  }
}

@media (max-width: 820px) {
  .focus-practice {
    padding: 0 12px 18px;
  }

  .focus-topbar {
    position: static;
    grid-template-columns: 40px 1fr auto;
    min-height: auto;
    padding: 10px 0;
  }

  .focus-clock {
    min-width: 132px;
    padding: 0 12px;
  }

  .focus-progress,
  .focus-actions {
    grid-column: 1 / -1;
  }

  .focus-stage {
    grid-template-columns: 1fr;
    width: 100%;
    margin-top: 16px;
  }

  .material-rail {
    position: static;
    display: flex;
    height: auto;
    overflow-x: auto;
    padding: 0;
  }

  .material-rail > span {
    display: none;
  }

  .material-rail button {
    min-width: 96px;
  }

  .answer-sheet {
    grid-column: auto;
  }

  .reader-title,
  .reader-sheet {
    padding-right: 22px;
    padding-left: 22px;
  }

  .reader-sheet {
    font-size: 16px;
  }

  .question-compose {
    padding: 22px;
  }

  .question-head h1 {
    font-size: 21px;
  }

  .question-compose textarea {
    min-height: 360px;
  }

  .compose-footer,
  .review-grid,
  .score-summary {
    grid-template-columns: 1fr;
  }

  .icon-button::after,
  .favorite-button::after {
    display: none;
  }
}
</style>
