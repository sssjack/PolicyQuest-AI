<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Back,
  Close,
  CircleCheck,
  DocumentChecked,
  EditPen,
  Finished,
  FolderChecked,
  MagicStick,
  Promotion,
  Reading,
  RefreshLeft,
  Star,
  Timer,
  Warning,
} from '@element-plus/icons-vue'
import { notesApi, realPaperApi, scoringApi } from '../../api'
import AbilityRadar from '../../components/AbilityRadar.vue'
import {
  fallbackEvaluation,
  formatSeconds,
  mapBackendPaper,
  normalizeScoreDimensionName,
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

type RemoteAttemptStatus = 'grading' | 'graded' | 'failed'

type RemoteAttemptAnswerStatus = RemoteAttemptStatus | 'pending'

type RemoteAttemptAnswer = {
  id: number
  questionId: string | number
  questionNo: number
  questionTitle: string
  questionPrompt: string
  answer: string
  duration: number
  status: RemoteAttemptAnswerStatus
  score?: number
  level?: string
  dimensions?: Array<{ name: string; score: number; comment?: string }>
  evaluation?: EvaluationResult | null
  report?: any
  errorMessage?: string
  gradedAt?: string
}

type RemoteAttempt = {
  id: number
  paperId: string | number
  type: 'essay' | 'interview'
  paperTitle: string
  status: RemoteAttemptStatus
  totalQuestions: number
  answeredCount: number
  gradedCount: number
  averageScore: number
  totalDuration: number
  submittedAt: string
  completedAt?: string
  errorMessage?: string
  answers?: RemoteAttemptAnswer[]
}

const paper = ref<RealPaper>(emptyPaper)
const currentIndex = ref(0)
const activeMaterialId = ref('')
const answers = ref<Record<string, string>>({})
const evaluations = ref<Record<string, EvaluationResult>>({})
const remoteAttempt = ref<RemoteAttempt | null>(null)
const questionTimers = ref<Record<string, number>>({})
const totalSeconds = ref(0)
const submitting = ref(false)
const loading = ref(false)
const favoriteVersion = ref(0)
const answerTextarea = ref<HTMLTextAreaElement | null>(null)
const questionCollapsed = ref(false)
const noteCaptureMode = ref(false)
const noteSelections = ref<string[]>([])
const savingNote = ref(false)
const ANSWER_GRID_COLUMNS = 25
let timerId: number | undefined
let allowLeave = false

const reviewMode = computed(() => Boolean(route.query.attemptId) || route.query.mode === 'review')
const currentQuestion = computed(() => paper.value.questions[currentIndex.value] || paper.value.questions[0] || emptyQuestion)
const activeMaterial = computed(() => paper.value.materials.find(material => material.id === activeMaterialId.value) || paper.value.materials[0] || emptyMaterial)
const currentAnswer = computed({
  get: () => normalizeEssayAnswer(answers.value[currentQuestion.value.id] || ''),
  set: value => {
    if (reviewMode.value) return
    answers.value = { ...answers.value, [currentQuestion.value.id]: normalizeEssayAnswer(value) }
  },
})
const answerGridRows = computed(() => buildAnswerGridRows(currentAnswer.value))
const currentEvaluation = computed(() => evaluations.value[currentQuestion.value.id])
const currentAttemptAnswer = computed(() => {
  const questionId = String(currentQuestion.value.id)
  return remoteAttempt.value?.answers?.find(item => String(item.questionId) === questionId) || null
})
const currentInterviewReport = computed(() => currentAttemptAnswer.value?.report || null)
const hasReviewReport = computed(() => reviewMode.value && Boolean(currentInterviewReport.value || currentEvaluation.value))
const currentReportScore = computed(() => Number(currentInterviewReport.value?.score ?? currentEvaluation.value?.score ?? 0))
const currentReportScoreAngle = computed(() => `${Math.max(0, Math.min(100, currentReportScore.value)) * 3.6}deg`)
const wordCount = computed(() => currentAnswer.value.trim().replace(/\s/g, '').length)
const progressPercent = computed(() => (paper.value.questions.length ? Math.round(((currentIndex.value + 1) / paper.value.questions.length) * 100) : 0))
const submittedCount = computed(() => Object.keys(evaluations.value).length)
const answeredCount = computed(() => Object.values(answers.value).filter(answer => answer.trim().length > 0).length)
const currentQuestionTime = computed(() => questionTimers.value[currentQuestion.value.id] || 0)
const allSubmitted = computed(() => paper.value.questions.length > 0 && submittedCount.value === paper.value.questions.length)
const allAnswered = computed(() => paper.value.questions.length > 0 && paper.value.questions.every(question => (answers.value[question.id] || '').trim().length > 0))
const canFinishPaper = computed(() => paper.value.type === 'interview' ? allAnswered.value : allSubmitted.value)
const hasWork = computed(() => answeredCount.value > 0 || submittedCount.value > 0 || totalSeconds.value > 20)
const shouldPromptOnLeave = computed(() => Boolean(paper.value.id && hasWork.value && !reviewMode.value && !allSubmitted.value))
const activeMaterialIndex = computed(() => Math.max(0, paper.value.materials.findIndex(material => material.id === activeMaterialId.value)))
const activeMaterialLabel = computed(() => `材料${activeMaterialIndex.value + 1}`)
const currentQuestionLabel = computed(() => `题${currentIndex.value + 1}`)
const wordLimitText = computed(() => (currentQuestion.value.wordLimit > 0 ? `${currentQuestion.value.wordLimit} 字以内` : '口述不限字'))
const wordLimitBase = computed(() => (currentQuestion.value.wordLimit > 0 ? currentQuestion.value.wordLimit : 500))
const wordProgress = computed(() => Math.min(100, Math.round((wordCount.value / wordLimitBase.value) * 100)))
const readerMaterialHtml = computed(() => buildReaderHtml(activeMaterial.value.content || activeMaterial.value.summary || ''))
const questionPositionText = computed(() => `${currentIndex.value + 1} / ${paper.value.questions.length || 0}`)
const noteCombinedText = computed(() => noteSelections.value.join('\n\n'))
const noteSelectionTotal = computed(() => noteSelections.value.reduce((sum, item) => sum + item.length, 0))
const noteSelectionText = computed(() => (noteSelections.value.length ? `已选择 ${noteSelections.value.length} 段 / ${noteSelectionTotal.value} 字` : '拖拽选择文字'))
const submitPaperTip = computed(() => {
  if (reviewMode.value) return '查看报告'
  if (paper.value.type === 'interview') return allAnswered.value ? '提交本卷' : '请先填写全部题目'
  return allSubmitted.value ? '提交本卷' : '请先提交本卷所有题目'
})
const reviewEmptyTitle = computed(() => {
  if (reviewMode.value && remoteAttempt.value?.status !== 'graded') return 'AI 正在批改中'
  if (paper.value.type === 'interview') return '填写全卷后提交，AI 将逐题批改'
  return '提交本题后查看 AI 评阅'
})
const reviewEmptyText = computed(() => {
  if (reviewMode.value && remoteAttempt.value?.status === 'failed') return remoteAttempt.value.errorMessage || '本次批改失败，请稍后重新进入报告查看。'
  if (reviewMode.value && currentAttemptAnswer.value?.status !== 'graded') return `本题状态：${currentAttemptAnswer.value?.status === 'failed' ? '批改失败' : 'AI 正在批改中'}，完成后会在这里显示完整报告。`
  if (paper.value.type === 'interview') return '面试题不再逐题提交；每道题都有内容后点击提交本卷，系统会后台异步批改并保存报告。'
  return '评阅结果会安静地出现在作答区下方，不打断阅读和写作节奏。'
})
const paperFavorite = computed(() => {
  favoriteVersion.value
  return Boolean(paper.value.id && isFavoritePaper(paper.value.id))
})

watch(
  paper,
  nextPaper => {
    currentIndex.value = 0
    activeMaterialId.value = nextPaper.materials[0]?.id || ''
    questionCollapsed.value = false
    queueAnswerResize()
  },
  { immediate: true },
)

watch(currentIndex, () => {
  questionCollapsed.value = false
  queueAnswerResize()
})

watch(currentAnswer, queueAnswerResize, { flush: 'post' })
watch(questionCollapsed, queueAnswerResize, { flush: 'post' })
watch(() => paper.value.type, queueAnswerResize, { flush: 'post' })

watch(
  () => [route.params.paperId, route.query.attemptId, route.query.mode],
  async ([paperId]) => {
    loading.value = true
    try {
      const response: any = await realPaperApi.detail(String(paperId))
      const nextPaper = mapBackendPaper(response.data)
      paper.value = nextPaper
      resetWorkspace()
      if (reviewMode.value && route.query.attemptId) {
        await loadAttemptDetail(String(route.query.attemptId))
      } else {
        remoteAttempt.value = null
        await restoreDraftIfNeeded(nextPaper)
      }
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
    if (!paper.value.id || loading.value || reviewMode.value) return
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
  queueAnswerResize()
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
  remoteAttempt.value = null
  questionTimers.value = {}
  totalSeconds.value = 0
}

async function loadAttemptDetail(attemptId: string) {
  const response: any = await realPaperApi.attemptDetail(attemptId)
  const attempt = response.data as RemoteAttempt
  remoteAttempt.value = attempt

  const nextAnswers: Record<string, string> = {}
  const nextEvaluations: Record<string, EvaluationResult> = {}
  const nextTimers: Record<string, number> = {}

  ;(attempt.answers || []).forEach(answer => {
    const questionId = String(answer.questionId)
    const question = paper.value.questions.find(item => String(item.id) === questionId) || {
      ...emptyQuestion,
      id: questionId,
      title: answer.questionTitle,
      prompt: answer.questionPrompt,
    }
    nextAnswers[questionId] = answer.answer || ''
    nextTimers[questionId] = Number(answer.duration) || 0
    if (answer.evaluation || answer.report) {
      nextEvaluations[questionId] = normalizeEvaluation(
        answer.evaluation || reportToEvaluation(answer.report, answer.answer, question),
        answer.answer,
        question,
      )
    }
  })

  answers.value = nextAnswers
  evaluations.value = nextEvaluations
  questionTimers.value = nextTimers
  totalSeconds.value = Number(attempt.totalDuration) || Object.values(nextTimers).reduce((sum, value) => sum + value, 0)
  allowLeave = true
  queueAnswerResize()
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
  queueAnswerResize()
}

function queueAnswerResize() {
  if (typeof window === 'undefined') return
  window.requestAnimationFrame(resizeAnswerArea)
}

function handleAnswerInput(event: Event) {
  if (reviewMode.value) return
  const target = event.target as HTMLTextAreaElement
  const rawValue = target.value
  const rawCaret = target.selectionStart ?? rawValue.length
  const normalizedValue = normalizeEssayAnswer(rawValue)

  if (normalizedValue !== rawValue) {
    const normalizedCaret = normalizeEssayAnswer(rawValue.slice(0, rawCaret)).length
    target.value = normalizedValue
    target.setSelectionRange(normalizedCaret, normalizedCaret)
  }

  currentAnswer.value = normalizedValue
  queueAnswerResize()
}

function normalizeEssayAnswer(value: string) {
  if (paper.value.type !== 'essay') return value
  const fullWidthSpace = '\u3000'
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, fullWidthSpace.repeat(2))
    .replace(/[\u0020\u00a0]/g, fullWidthSpace)
    .replace(/[!-~]/g, character => String.fromCharCode(character.charCodeAt(0) + 0xfee0))
}

function buildAnswerGridRows(value: string) {
  if (!value) return []

  return value.split('\n').flatMap(line => {
    const characters = Array.from(line)
    if (!characters.length) return [[]]

    const rows: string[][] = []
    for (let index = 0; index < characters.length; index += ANSWER_GRID_COLUMNS) {
      rows.push(characters.slice(index, index + ANSWER_GRID_COLUMNS))
    }
    return rows
  })
}

function displayAnswerCharacter(character: string) {
  return character === '\u3000' ? '' : character
}

function resizeAnswerArea() {
  const textarea = answerTextarea.value
  if (!textarea) return

  if (paper.value.type !== 'essay') {
    textarea.style.height = ''
    return
  }

  const shell = textarea.parentElement
  const availableWidth = shell?.clientWidth || textarea.clientWidth || textarea.offsetWidth
  const cellSize = Math.min(26, Math.max(10, (availableWidth - 42) / ANSWER_GRID_COLUMNS))
  const rowGap = Math.min(10, Math.max(6, cellSize * 0.36))
  const rowHeight = cellSize + rowGap
  shell?.style.setProperty('--answer-cell', `${cellSize}px`)
  shell?.style.setProperty('--answer-row-gap', `${rowGap}px`)

  const minimumHeight = Math.max(620, window.innerHeight - (questionCollapsed.value ? 238 : 338))
  const contentRows = Math.max(answerGridRows.value.length + 1, 1)
  const contentHeight = Math.ceil(contentRows * rowHeight + 38)
  const nextHeight = Math.max(contentHeight, minimumHeight)
  textarea.style.height = `${nextHeight}px`
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
  if (!paper.value.id || reviewMode.value) return
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

function normalizeScoreDimensions(dimensions: EvaluationResult['dimensions']) {
  return dimensions.map(item => ({
    ...item,
    name: normalizeScoreDimensionName(item.name),
  }))
}

function reportToEvaluation(report: any, answer: string, question: PaperQuestion): EvaluationResult | null {
  if (!report || typeof report !== 'object') return null
  const local = fallbackEvaluation(answer || '', question, paper.value)
  return {
    score: Number(report.score) || local.score,
    level: String(report.level || local.level),
    summary: String(report.summary || local.summary),
    dimensions: normalizeScoreDimensions(Array.isArray(report.dimensions) ? report.dimensions : local.dimensions),
    advantages: Array.isArray(report.advantages)
      ? report.advantages.map((item: any) => typeof item === 'string' ? item : `${item.title || '优点'}：${item.detail || ''}`)
      : local.advantages,
    disadvantages: Array.isArray(report.deductions)
      ? report.deductions.map((item: any) => typeof item === 'string' ? item : `${item.title || '扣分点'}：${item.originalProblem || item.whyWrong || ''}`)
      : local.disadvantages,
    suggestions: Array.isArray(report.highScoreThinking) ? report.highScoreThinking.map(String) : local.suggestions,
    qualityMaterials: Array.isArray(report.goldenSentences)
      ? report.goldenSentences.map((content: string, index: number) => ({ title: `金句${index + 1}`, content, usage: '适合面试表达升级。' }))
      : local.qualityMaterials,
    governmentReportLinks: Array.isArray(report.localPolicyInsight?.cases)
      ? report.localPolicyInsight.cases
      : local.governmentReportLinks,
    sampleEssay: String(report.sampleAnswer || local.sampleEssay),
  }
}

function normalizeEvaluation(value: any, answer = currentAnswer.value, question = currentQuestion.value): EvaluationResult {
  const local = fallbackEvaluation(answer, question, paper.value)
  if (!value || isGarbled(value.summary) || !Array.isArray(value.dimensions)) return local

  return {
    score: Number(value.score) || local.score,
    level: String(value.level || local.level),
    summary: String(value.summary || local.summary),
    dimensions: value.dimensions.length
      ? normalizeScoreDimensions(value.dimensions.map((item: any) => ({
          name: String(item.name || ''),
          score: Number(item.score) || 0,
          comment: String(item.comment || ''),
        })))
      : normalizeScoreDimensions(local.dimensions),
    advantages: Array.isArray(value.advantages) ? value.advantages.map(String) : local.advantages,
    disadvantages: Array.isArray(value.disadvantages) ? value.disadvantages.map(String) : local.disadvantages,
    suggestions: Array.isArray(value.suggestions) ? value.suggestions.map(String) : local.suggestions,
    qualityMaterials: Array.isArray(value.qualityMaterials) ? value.qualityMaterials : local.qualityMaterials,
    governmentReportLinks: Array.isArray(value.governmentReportLinks) ? value.governmentReportLinks : local.governmentReportLinks,
    sampleEssay: String(value.sampleEssay || local.sampleEssay),
  }
}

async function submitQuestion() {
  if (reviewMode.value) {
    ElMessage.info('历史报告为只读查看模式')
    return
  }
  if (paper.value.type === 'interview') {
    ElMessage.info('面试题请填写完本卷所有题目后，点击“提交本卷”统一批改')
    return
  }

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

async function finishPaper() {
  if (reviewMode.value) {
    ElMessage.info('当前正在查看历史报告')
    return
  }

  if (paper.value.type === 'interview') {
    await submitInterviewPaper()
    return
  }

  if (!allSubmitted.value) {
    ElMessage.warning('请先提交本卷所有题目；暂时离开可点击保存进度')
    return
  }
  removePracticeDraft(paper.value.id)
  allowLeave = true
  ElMessage.success('本卷已完成，已同步到做题历史')
  router.push(routeTarget('/history'))
}

async function submitInterviewPaper() {
  if (!allAnswered.value) {
    ElMessage.warning('请先填写本卷所有题目后再提交')
    return
  }

  submitting.value = true
  try {
    await realPaperApi.submitAttempt({
      paperId: paper.value.id,
      totalDuration: totalSeconds.value,
      answers: paper.value.questions.map(question => ({
        questionId: question.id,
        answer: answers.value[question.id],
        duration: questionTimers.value[question.id] || 0,
      })),
    })
    removePracticeDraft(paper.value.id)
    allowLeave = true
    ElMessage.success('本卷已提交，AI 正在后台逐题批改')
    router.push(routeTarget('/history'))
  } finally {
    submitting.value = false
  }
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

function routeTarget(path: string, query: Record<string, string> = {}) {
  return {
    path,
    query: route.query.preview === '1' ? { preview: '1', ...query } : query,
  }
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
  return paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function reportTitle(item: any, fallback = '要点') {
  if (typeof item === 'string') return item
  return String(item?.title || fallback)
}

function reportText(item: any, keys: string[] = ['detail', 'content', 'usage', 'reason']) {
  if (typeof item === 'string') return item
  return keys.map(key => item?.[key]).filter(Boolean).map(String).join(' ')
}

function reportList(value: any) {
  return Array.isArray(value) ? value : []
}

function normalizeSelectedText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function captureSelectedNoteText(event?: Event) {
  if (!noteCaptureMode.value) return
  window.setTimeout(() => {
    let text = ''
    const target = event?.target as HTMLTextAreaElement | HTMLInputElement | null
    if (target && ['TEXTAREA', 'INPUT'].includes(target.tagName)) {
      const start = target.selectionStart ?? 0
      const end = target.selectionEnd ?? 0
      text = start === end ? '' : target.value.slice(start, end)
    } else {
      text = window.getSelection()?.toString() || ''
    }

    const selected = normalizeSelectedText(text)
    if (!selected || selected === noteSelections.value[noteSelections.value.length - 1]) return
    noteSelections.value = [...noteSelections.value, selected]
    window.getSelection()?.removeAllRanges()
  }, 0)
}

function toggleNoteCapture() {
  noteCaptureMode.value = !noteCaptureMode.value
  noteSelections.value = []
  if (noteCaptureMode.value) {
    ElMessage.info('已进入划词记笔记模式，可多次拖拽收集片段后保存')
  } else {
    window.getSelection()?.removeAllRanges()
  }
}

function cancelNoteCapture() {
  noteCaptureMode.value = false
  noteSelections.value = []
  window.getSelection()?.removeAllRanges()
}

function undoNoteSelection() {
  noteSelections.value = noteSelections.value.slice(0, -1)
  window.getSelection()?.removeAllRanges()
}

function numericId(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

async function saveSelectedNote() {
  if (!noteSelections.value.length) {
    ElMessage.warning('请先拖拽选择要保存的文字')
    return
  }
  savingNote.value = true
  try {
    const text = noteCombinedText.value
    const title = noteSelections.value[0]?.slice(0, 28) || '划词笔记'
    const content = noteSelections.value
      .map(item => `<p>${escapeHtml(item).replace(/\n/g, '<br>')}</p>`)
      .join('')
    await notesApi.create({
      title,
      content,
      plainText: text,
      sourceType: reviewMode.value ? 'history' : 'practice',
      sourceTitle: `${paper.value.shortTitle || paper.value.title} · ${currentQuestion.value.title}`,
      sourcePath: route.fullPath,
      paperId: numericId(paper.value.id),
      questionId: numericId(currentQuestion.value.id),
      attemptId: numericId(remoteAttempt.value?.id),
      attemptAnswerId: numericId(currentAttemptAnswer.value?.id),
      tags: [paper.value.type === 'essay' ? '申论' : '面试', currentQuestionLabel.value],
    })
    ElMessage.success('笔记已保存')
    noteSelections.value = []
    window.getSelection()?.removeAllRanges()
  } finally {
    savingNote.value = false
  }
}

</script>

<template>
  <main
    class="focus-practice"
    :class="[paper.type, { 'note-capture-mode': noteCaptureMode }]"
    @mouseup="captureSelectedNoteText"
    @keyup="captureSelectedNoteText"
  >
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
        <div v-if="noteCaptureMode" class="note-capture-toolbar" aria-label="划词笔记操作">
          <span>{{ noteSelectionText }}</span>
          <button
            type="button"
            class="icon-button"
            aria-label="撤销本次选择"
            data-tooltip="撤销上一段"
            :disabled="!noteSelections.length"
            @click="undoNoteSelection"
          >
            <el-icon><RefreshLeft /></el-icon>
          </button>
          <button
            type="button"
            class="icon-button primary"
            aria-label="保存为笔记"
            data-tooltip="保存笔记"
            :disabled="savingNote || !noteSelections.length"
            @click="saveSelectedNote"
          >
            <el-icon><CircleCheck /></el-icon>
          </button>
          <button type="button" class="icon-button" aria-label="取消划词" data-tooltip="取消" @click="cancelNoteCapture">
            <el-icon><Close /></el-icon>
          </button>
        </div>
        <button
          v-else
          type="button"
          class="icon-button note-button"
          :disabled="loading || !paper.questions.length"
          aria-label="记笔记"
          data-tooltip="记笔记"
          @click="toggleNoteCapture"
        >
          <el-icon><EditPen /></el-icon>
        </button>
        <button
          type="button"
          class="icon-button"
          :disabled="loading || reviewMode || !paper.questions.length"
          aria-label="保存进度"
          :data-tooltip="reviewMode ? '只读报告' : '保存'"
          @click="saveDraft()"
        >
          <el-icon><FolderChecked /></el-icon>
        </button>
        <button
          v-if="paper.type === 'essay'"
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
          :class="{ ready: canFinishPaper }"
          :disabled="loading || submitting || reviewMode || !paper.questions.length"
          aria-label="提交本卷"
          :data-tooltip="submitPaperTip"
          @click="finishPaper"
        >
          <el-icon><Finished /></el-icon>
        </button>
      </section>
    </header>

    <section class="focus-stage" :class="{ 'interview-stage': paper.type === 'interview', 'review-stage': hasReviewReport }">
      <aside v-if="paper.type === 'essay' && !hasReviewReport" class="material-rail" aria-label="材料导航">
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

      <article v-if="paper.type === 'essay' && !hasReviewReport" class="paper-reader">
        <header class="reader-title">
          <div>
            <span>{{ paper.shortTitle || paper.title }}</span>
            <h1>{{ activeMaterial.title }}</h1>
          </div>
          <em>约 {{ activeMaterial.wordCount }} 字</em>
        </header>
        <section class="reader-sheet" v-html="readerMaterialHtml"></section>
      </article>

      <section class="answer-sheet">
        <article v-if="hasReviewReport" class="review-source-card">
          <header class="review-source-head">
            <span>{{ paper.type === 'essay' ? '申论' : '面试' }} · {{ currentQuestionLabel }}</span>
            <h1>{{ currentQuestion.title }}</h1>
          </header>

          <section class="review-source-section">
            <h2>原题</h2>
            <p>{{ currentQuestion.prompt }}</p>
          </section>

          <section v-if="currentQuestion.requirements.length" class="review-source-tags">
            <span>作答要求</span>
            <strong v-for="item in currentQuestion.requirements" :key="item">{{ item }}</strong>
          </section>

          <section class="review-source-section answer">
            <h2>用户回答</h2>
            <p>{{ currentAnswer || '本题未填写作答内容' }}</p>
          </section>

          <footer class="review-source-meta">
            <span>字数 {{ wordCount }}</span>
            <span>用时 {{ formatSeconds(currentQuestionTime) }}</span>
          </footer>
        </article>

        <article v-else class="question-compose" :class="{ collapsed: questionCollapsed, 'essay-paper-mode': paper.type === 'essay' }">
          <header class="question-head">
            <button
              type="button"
              class="question-collapse-button"
              :aria-label="questionCollapsed ? '展开题目' : '收起题目'"
              :data-tooltip="questionCollapsed ? '展开题目' : '收起题目'"
              @click="questionCollapsed = !questionCollapsed"
            >
              <el-icon>
                <ArrowDown v-if="questionCollapsed" />
                <ArrowUp v-else />
              </el-icon>
            </button>
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

          <p v-show="!questionCollapsed" class="question-prompt">{{ currentQuestion.prompt }}</p>
          <div v-if="currentQuestion.requirements.length" v-show="!questionCollapsed" class="requirement-line">
            <span>要求：</span>
            <strong v-for="item in currentQuestion.requirements" :key="item">{{ item }}</strong>
          </div>

          <div class="answer-input-shell" :class="{ 'essay-grid-shell': paper.type === 'essay' }">
          <textarea
            ref="answerTextarea"
            :value="currentAnswer"
            :readonly="reviewMode"
            :placeholder="paper.type === 'essay' ? '请在这里作答。先提炼材料要点，再展开成完整答案...' : '请按结构化面试口径组织表达，注意身份感、交流感和层次...'"
            @input="handleAnswerInput"
          ></textarea>
            <div v-if="paper.type === 'essay' && answerGridRows.length" class="answer-grid-text" aria-hidden="true">
              <div v-for="(row, rowIndex) in answerGridRows" :key="rowIndex" class="answer-grid-row">
                <span v-for="(character, columnIndex) in row" :key="`${rowIndex}-${columnIndex}`" class="answer-grid-cell">
                  {{ displayAnswerCharacter(character) }}
                </span>
              </div>
            </div>
          </div>

          <footer class="compose-footer">
            <span>字数：{{ wordCount }} / {{ currentQuestion.wordLimit > 0 ? currentQuestion.wordLimit : '不限' }}</span>
            <span>建议用时：{{ currentQuestion.suggestedMinutes }} 分钟</span>
            <span>{{ wordLimitText }}</span>
            <i><b :style="{ width: `${wordProgress}%` }"></b></i>
          </footer>
        </article>

        <article v-if="currentInterviewReport" class="review-card interview-report-card">
          <section class="report-section conclusion">
            <div class="score-summary">
              <div class="score-ring" :style="{ '--score-angle': currentReportScoreAngle }">
                <strong>{{ currentInterviewReport.score }}</strong>
                <span>/100</span>
              </div>
              <div>
                <p>一、结论评分</p>
                <h2>{{ currentInterviewReport.level }}</h2>
                <span>{{ currentInterviewReport.summary }}</span>
              </div>
            </div>
          </section>

          <section class="report-section">
            <h3>二、优点</h3>
            <article v-for="item in reportList(currentInterviewReport.advantages)" :key="reportTitle(item)">
              <strong>{{ reportTitle(item, '优点') }}</strong>
              <p>{{ reportText(item, ['detail', 'content']) }}</p>
            </article>
          </section>

          <section class="report-section deductions">
            <h3>三、主要扣分原因</h3>
            <article v-for="item in reportList(currentInterviewReport.deductions)" :key="reportTitle(item)">
              <strong>{{ reportTitle(item, '扣分点') }}</strong>
              <p v-if="item.originalProblem"><b>原答案问题：</b>{{ item.originalProblem }}</p>
              <p v-if="item.whyWrong"><b>为什么丢分：</b>{{ item.whyWrong }}</p>
              <p v-if="item.policyBasis"><b>评分依据：</b>{{ item.policyBasis }}</p>
              <p v-if="item.rewrite"><b>可以这样改：</b>{{ item.rewrite }}</p>
              <p v-if="typeof item === 'string'">{{ item }}</p>
            </article>
          </section>

          <section class="report-section">
            <h3>四、高分答题思路</h3>
            <ol>
              <li v-for="item in reportList(currentInterviewReport.highScoreThinking)" :key="item">{{ item }}</li>
            </ol>
          </section>

          <section class="report-section quote-list">
            <h3>五、金句积累</h3>
            <p v-for="item in reportList(currentInterviewReport.goldenSentences)" :key="item">{{ item }}</p>
          </section>

          <section class="report-section sample-answer">
            <h3>六、高分范文</h3>
            <p>{{ currentInterviewReport.sampleAnswer }}</p>
          </section>

          <section class="report-section local-policy">
            <h3>七、{{ currentInterviewReport.localPolicyInsight?.title || '当地案例和政策解读' }}</h3>
            <article v-for="item in reportList(currentInterviewReport.localPolicyInsight?.cases)" :key="reportTitle(item)">
              <strong>{{ reportTitle(item, '案例政策') }}</strong>
              <p>{{ reportText(item, ['content']) }}</p>
              <small>{{ reportText(item, ['usage']) }}</small>
            </article>
            <p v-if="currentInterviewReport.localPolicyInsight?.usage">{{ currentInterviewReport.localPolicyInsight.usage }}</p>
          </section>

          <section class="report-section upgraded">
            <h3>八、你原答案可以直接升级的表达</h3>
            <article v-for="item in reportList(currentInterviewReport.upgradedExpressions)" :key="reportText(item, ['improved'])">
              <p v-if="item.original"><b>原表达：</b>{{ item.original }}</p>
              <p v-if="item.improved"><b>升级后：</b>{{ item.improved }}</p>
              <small v-if="item.reason">{{ item.reason }}</small>
              <p v-if="typeof item === 'string'">{{ item }}</p>
            </article>
          </section>

          <section class="report-section missing">
            <h3>九、这道题你下次要补的关键内容</h3>
            <ul>
              <li v-for="item in reportList(currentInterviewReport.missingKeyContent)" :key="item">{{ item }}</li>
            </ul>
          </section>
        </article>

        <article v-else-if="currentEvaluation" class="review-card">
          <section class="score-summary">
            <div class="score-ring" :style="{ '--score-angle': currentReportScoreAngle }">
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
          <strong>{{ reviewEmptyTitle }}</strong>
          <span>{{ reviewEmptyText }}</span>
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
.favorite-button,
.question-collapse-button {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(35, 50, 78, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.74);
  color: #4d5d75;
  outline: none;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.icon-button::after,
.favorite-button::after,
.question-collapse-button::after {
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
.favorite-button:hover::after,
.question-collapse-button:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.icon-button:hover,
.favorite-button:hover,
.question-collapse-button:hover {
  border-color: rgba(64, 107, 180, 0.24);
  background: #ffffff;
  color: #2f63b7;
  transform: translateY(-1px);
}

.icon-button:focus-visible,
.favorite-button:focus-visible,
.question-collapse-button:focus-visible {
  box-shadow: 0 0 0 4px rgba(47, 99, 183, 0.14);
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
.favorite-button .el-icon,
.question-collapse-button .el-icon {
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

.note-capture-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 8px 0 14px;
  border: 1px solid rgba(47, 99, 183, 0.14);
  border-radius: 999px;
  background: #f7fbff;
  box-shadow: 0 10px 26px rgba(47, 99, 183, 0.08);
}

.note-capture-toolbar > span {
  color: #2f63b7;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

.note-button {
  border-color: rgba(47, 99, 183, 0.18);
  color: #2f63b7;
}

.note-capture-mode {
  cursor: text;
}

.note-capture-mode :where(.paper-reader, .question-compose, .review-source-card, .review-card) {
  cursor: text;
}

.note-capture-mode ::selection {
  background: rgba(255, 196, 61, 0.38);
  color: #172033;
}

.focus-stage {
  display: grid;
  grid-template-columns: 118px minmax(420px, 0.92fr) minmax(480px, 1.08fr);
  gap: 22px;
  width: min(1680px, calc(100vw - 48px));
  margin: 28px auto 0;
}

.focus-stage.interview-stage {
  grid-template-columns: minmax(0, 1fr);
}

.focus-stage.review-stage {
  grid-template-columns: minmax(0, 1fr);
  width: min(1740px, calc(100vw - 48px));
  align-items: start;
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

.answer-sheet {
  display: grid;
  align-content: start;
  gap: 16px;
}

.review-stage .answer-sheet {
  grid-template-columns: minmax(420px, 0.92fr) minmax(560px, 1.08fr);
  gap: 22px;
  align-items: start;
}

.interview-stage .answer-sheet {
  grid-column: 1;
}

.review-stage .review-card,
.review-stage .review-empty {
  width: 100%;
  justify-self: stretch;
}

.question-compose,
.review-source-card,
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

.essay-paper-mode {
  gap: 14px;
  padding: 26px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 253, 248, 0.92)),
    #fffaf1;
}

.interview-stage .question-compose {
  grid-template-columns: minmax(360px, 0.86fr) minmax(480px, 1.14fr);
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  grid-template-areas:
    "head answer"
    "prompt answer"
    "requirements answer"
    ". footer";
  gap: 18px 30px;
  min-height: calc(100vh - 112px);
}

.interview-stage .question-compose.collapsed {
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-areas:
    "head answer"
    ". answer"
    ". footer";
}

.question-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
}

.question-collapse-button {
  width: 34px;
  height: 34px;
  border-radius: 999px;
}

.question-collapse-button .el-icon {
  font-size: 17px;
}

.interview-stage .question-head {
  grid-area: head;
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

.question-compose.collapsed {
  gap: 14px;
}

.question-compose.collapsed .question-head {
  align-items: center;
}

.question-compose.collapsed .question-head h1 {
  max-width: none;
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 20px;
  line-height: 1.35;
}

.question-prompt {
  max-width: 780px;
  margin: 0;
  color: #4a5568;
  font-size: 15px;
  line-height: 1.75;
}

.interview-stage .question-prompt {
  grid-area: prompt;
  max-width: none;
  font-size: 16px;
  line-height: 1.9;
}

.requirement-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: #596579;
  font-size: 14px;
}

.interview-stage .requirement-line {
  grid-area: requirements;
  align-self: start;
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

.answer-input-shell {
  width: 100%;
  min-width: 0;
}

.essay-grid-shell {
  --answer-cell: 22px;
  --answer-row-gap: 8px;
  --answer-row: calc(var(--answer-cell) + var(--answer-row-gap));
  --answer-grid-line: rgba(195, 68, 64, 0.25);
  --answer-gap-fill: rgba(255, 253, 246, 0.98);
  position: relative;
  display: grid;
  justify-items: center;
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

.essay-paper-mode textarea {
  box-sizing: border-box;
  justify-self: center;
  position: relative;
  z-index: 2;
  width: calc(var(--answer-cell) * 25 + 42px);
  max-width: 100%;
  min-height: 620px;
  overflow: hidden;
  resize: none;
  padding: 18px 20px;
  border-color: rgba(176, 80, 74, 0.26);
  border-radius: 8px;
  background-color: #fffdf6;
  background-image:
    repeating-linear-gradient(
      to bottom,
      var(--answer-grid-line) 0 1px,
      transparent 1px calc(var(--answer-cell) - 1px),
      var(--answer-grid-line) calc(var(--answer-cell) - 1px) var(--answer-cell),
      transparent var(--answer-cell) var(--answer-row)
    ),
    repeating-linear-gradient(
      to bottom,
      transparent 0 var(--answer-cell),
      var(--answer-gap-fill) var(--answer-cell) var(--answer-row)
    ),
    repeating-linear-gradient(to right, var(--answer-grid-line) 0 1px, transparent 1px var(--answer-cell)),
    linear-gradient(to right, rgba(255, 255, 255, 0.72), rgba(255, 251, 241, 0.72));
  background-origin: content-box;
  background-clip: padding-box;
  background-position: 0 0, 0 0, 0 0, 0 0;
  background-size: 100% var(--answer-row), 100% var(--answer-row), var(--answer-cell) var(--answer-row), 100% 100%;
  color: #1f2634;
  font-family: "KaiTi", "STKaiti", "FangSong", "STFangsong", "Noto Serif SC", serif;
  font-size: var(--answer-cell);
  line-height: var(--answer-row);
  font-variant-east-asian: full-width;
  font-feature-settings: "fwid" 1;
  letter-spacing: 0;
  word-break: break-all;
  overflow-wrap: anywhere;
  caret-color: #1f2634;
  -webkit-text-fill-color: transparent;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.62),
    0 14px 30px rgba(78, 48, 29, 0.06);
}

.essay-paper-mode textarea::placeholder {
  color: rgba(67, 76, 93, 0.36);
  font-family: "FangSong", "STFangsong", "Noto Serif SC", serif;
  font-size: 18px;
  line-height: 1.7;
  -webkit-text-fill-color: rgba(67, 76, 93, 0.36);
}

.answer-grid-text {
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 3;
  width: calc(var(--answer-cell) * 25 + 42px);
  max-width: 100%;
  padding: 18px 20px;
  border: 1px solid transparent;
  color: #1f2634;
  font-family: "KaiTi", "STKaiti", "FangSong", "STFangsong", "Noto Serif SC", serif;
  font-size: var(--answer-cell);
  line-height: var(--answer-cell);
  pointer-events: none;
  transform: translateX(-50%);
}

.answer-grid-row {
  display: grid;
  grid-template-columns: repeat(25, var(--answer-cell));
  height: var(--answer-row);
}

.answer-grid-cell {
  display: block;
  width: var(--answer-cell);
  height: var(--answer-cell);
  overflow: hidden;
  line-height: var(--answer-cell);
  text-align: center;
  white-space: pre;
}

.essay-paper-mode .compose-footer {
  justify-self: stretch;
  width: 100%;
  padding: 0 2px;
}

.interview-stage .question-compose textarea {
  grid-area: answer;
  min-height: calc(100vh - 210px);
  height: 100%;
  resize: none;
}

.interview-stage .answer-input-shell {
  grid-area: answer;
  min-height: calc(100vh - 210px);
  height: 100%;
}

.question-compose textarea:focus {
  border-color: rgba(47, 99, 183, 0.45);
  box-shadow: 0 0 0 4px rgba(47, 99, 183, 0.08);
}

.question-compose textarea[readonly] {
  cursor: default;
  background: #f8fafc;
  color: #243047;
}

.essay-paper-mode textarea:focus {
  border-color: rgba(184, 68, 63, 0.44);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.64),
    0 0 0 4px rgba(184, 68, 63, 0.08),
    0 16px 34px rgba(78, 48, 29, 0.08);
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

.interview-stage .compose-footer {
  grid-area: footer;
}

.interview-stage .review-card,
.interview-stage .review-empty {
  width: min(880px, 100%);
  justify-self: end;
}

.review-stage.interview-stage .review-card,
.review-stage.interview-stage .review-empty {
  width: 100%;
  justify-self: stretch;
}

.review-source-card {
  position: sticky;
  top: 92px;
  display: grid;
  gap: 18px;
  max-height: calc(100vh - 116px);
  overflow: auto;
  overscroll-behavior: contain;
  padding: 26px;
  scrollbar-width: none;
}

.review-source-card::-webkit-scrollbar {
  display: none;
}

.review-source-head {
  display: grid;
  gap: 10px;
}

.review-source-head span {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #2f63b7;
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
}

.review-source-head h1 {
  margin: 0;
  color: #172033;
  font-size: 24px;
  line-height: 1.45;
}

.review-source-section {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid rgba(41, 52, 71, 0.08);
  border-radius: 14px;
  background: #f8fafc;
}

.review-source-section.answer {
  border-color: rgba(184, 68, 63, 0.14);
  background: #fffdf7;
}

.review-source-section h2 {
  margin: 0;
  color: #172033;
  font-size: 17px;
  font-weight: 900;
}

.review-source-section p {
  margin: 0;
  color: #4a5568;
  line-height: 1.86;
  white-space: pre-wrap;
}

.review-source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.review-source-tags span {
  color: #596579;
  font-size: 14px;
  font-weight: 900;
}

.review-source-tags strong {
  padding: 5px 10px;
  border-radius: 999px;
  background: #edf2f8;
  color: #52627a;
  font-size: 13px;
  font-weight: 800;
}

.review-source-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 4px;
  color: #7a8494;
  font-size: 13px;
  font-weight: 900;
}

.review-card {
  display: grid;
  gap: 14px;
  padding: 20px;
}

.interview-report-card {
  gap: 18px;
  padding: 26px 30px;
}

.report-section {
  display: grid;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(41, 52, 71, 0.08);
}

.report-section:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.report-section h3 {
  margin: 0;
  color: #172033;
  font-size: 20px;
  font-weight: 900;
}

.report-section article {
  padding: 14px 16px;
  border-radius: 10px;
  background: #f8fafc;
}

.report-section strong {
  display: block;
  color: #26344a;
  font-size: 16px;
  font-weight: 900;
}

.report-section p,
.report-section li,
.report-section small {
  margin: 8px 0 0;
  color: #4a5568;
  font-size: 15px;
  line-height: 1.82;
}

.report-section b {
  color: #1f65d6;
}

.report-section ol,
.report-section ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 20px;
}

.report-section.quote-list p {
  padding: 12px 14px;
  border-left: 3px solid #397bf6;
  border-radius: 8px;
  background: #f3f7ff;
  color: #26344a;
  font-weight: 800;
}

.report-section.sample-answer p {
  padding: 16px 18px;
  border-radius: 12px;
  background: #fbfcff;
  color: #243047;
  white-space: pre-wrap;
}

.report-section.local-policy article {
  border: 1px solid rgba(57, 123, 246, 0.12);
  background: #f4f8ff;
}

.report-section.upgraded article {
  background: #fbfcf8;
}

.score-summary {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  padding: 18px 0 20px;
  border-bottom: 1px solid rgba(41, 52, 71, 0.08);
}

.interview-report-card .score-summary {
  padding: 20px;
  border: 1px solid rgba(47, 99, 183, 0.1);
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fbff, #ffffff);
}

.score-ring {
  display: grid;
  grid-template-rows: auto auto;
  align-content: center;
  justify-items: center;
  gap: 4px;
  width: 104px;
  height: 104px;
  border-radius: 999px;
  background:
    radial-gradient(circle at center, #ffffff 60%, transparent 61%),
    conic-gradient(#2f63b7 var(--score-angle, 0deg), #e6ebf3 0);
  box-shadow:
    inset 0 0 0 1px rgba(47, 99, 183, 0.08),
    0 12px 26px rgba(47, 99, 183, 0.12);
}

.score-ring strong {
  color: #245bb1;
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
}

.score-ring span {
  color: #7a8494;
  font-size: 14px;
  font-weight: 900;
  line-height: 1;
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

  .focus-stage.interview-stage {
    grid-template-columns: 1fr;
  }

  .answer-sheet {
    grid-column: 2;
  }

  .review-stage .answer-sheet {
    grid-column: 1;
  }

  .interview-stage .answer-sheet {
    grid-column: 1;
  }

  .paper-reader,
  .question-compose {
    min-height: auto;
  }
}

@media (max-width: 980px) {
  .interview-stage .question-compose {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    grid-template-areas:
      "head"
      "prompt"
      "requirements"
      "answer"
      "footer";
    min-height: auto;
  }

  .interview-stage .question-compose textarea {
    min-height: 360px;
    height: auto;
    resize: vertical;
  }

  .interview-stage .review-card,
  .interview-stage .review-empty {
    width: 100%;
    justify-self: stretch;
  }

  .review-stage .answer-sheet {
    grid-template-columns: 1fr;
  }

  .review-source-card {
    position: static;
    max-height: none;
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
  .favorite-button::after,
  .question-collapse-button::after {
    display: none;
  }
}
</style>
