<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CircleCheck,
  DataAnalysis,
  Delete,
  EditPen,
  Files,
  FolderChecked,
  Reading,
  StarFilled,
  Timer,
  TrendCharts,
  Warning,
} from '@element-plus/icons-vue'
import AbilityRadar from '../../components/AbilityRadar.vue'
import { realPaperApi, wrongbookApi } from '../../api'
import {
  averageScore,
  buildPracticeHistory,
  essayDimensions,
  interviewDimensions,
  readFavoritePapers,
  readPracticeDrafts,
  readPracticeRecords,
  removeFavoritePaper,
  type EvaluationResult,
  type FavoritePaper,
  type PracticeDraft,
  type PracticeHistoryItem,
  type PracticeRecord,
  type ScoreDimension,
} from '../../data/policyQuest'
import { useUserStore } from '../../store/user'

type ArchiveTab = 'history' | 'report' | 'wrong' | 'notes' | 'favorite'
type HistoryFilter = 'all' | 'completed' | 'draft'

type RemoteAttemptStatus = 'grading' | 'graded' | 'failed'

type RemoteAttemptAnswer = {
  id: number
  questionId: string | number
  questionTitle: string
  answer: string
  duration: number
  status: RemoteAttemptStatus | 'pending'
  score?: number
  level?: string
  dimensions?: ScoreDimension[]
  evaluation?: EvaluationResult | null
  report?: any
  gradedAt?: string
}

type RemoteAttemptItem = {
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
  answers?: RemoteAttemptAnswer[]
}

type RemoteHistoryItem = {
  id: string
  source: 'remote-attempt'
  attemptId: number
  paperId: string
  paperTitle: string
  type: 'essay' | 'interview'
  status: RemoteAttemptStatus
  questionCount: number
  answeredCount: number
  gradedCount: number
  averageScore: number
  durationSeconds: number
  updatedAt: string
}

type ArchiveHistoryItem = PracticeHistoryItem | RemoteHistoryItem

type RemoteWrongItem = {
  id: number
  wrong_count?: number
  last_wrong_at?: string
  notes?: string
  Question?: {
    id: number
    stem?: string
    question_type?: string
    difficulty?: string
    analysis?: string
    Article?: { title?: string; url?: string }
  }
}

type RemoteFavoriteItem = {
  id: number
  created_at?: string
  Question?: {
    id: number
    stem?: string
    question_type?: string
    difficulty?: string
  }
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const records = ref<PracticeRecord[]>([])
const drafts = ref<PracticeDraft[]>([])
const favorites = ref<FavoritePaper[]>([])
const remoteAttempts = ref<RemoteAttemptItem[]>([])
const remoteWrongItems = ref<RemoteWrongItem[]>([])
const remoteQuestionFavorites = ref<RemoteFavoriteItem[]>([])
const remoteWrongTotal = ref(0)
const remoteFavoriteTotal = ref(0)
const remoteLoading = ref(false)
const historyFilter = ref<HistoryFilter>('all')
let attemptPollTimer: number | undefined

const tabOptions: Array<{ key: ArchiveTab; label: string; icon: Component }> = [
  { key: 'history', label: '练习历史', icon: Timer },
  { key: 'report', label: '用户报告', icon: DataAnalysis },
  { key: 'wrong', label: '我的错题', icon: Warning },
  { key: 'notes', label: '我的笔记', icon: EditPen },
  { key: 'favorite', label: '我的收藏', icon: StarFilled },
]

const historyFilters: Array<{ key: HistoryFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'completed', label: '已完成' },
  { key: 'draft', label: '保存进度' },
]

const activeTab = computed<ArchiveTab>(() => normalizeTab(route.query.tab || (route.path === '/report' ? 'report' : 'history')))
const currentUserName = computed(() => userStore.user?.nickname || userStore.user?.username || '同学')
const currentUserInitial = computed(() => currentUserName.value.slice(0, 1).toUpperCase())

const localHistoryItems = computed(() => buildPracticeHistory(records.value, drafts.value))
const remoteHistoryItems = computed<RemoteHistoryItem[]>(() => remoteAttempts.value.map(attempt => ({
  id: `attempt-${attempt.id}`,
  source: 'remote-attempt',
  attemptId: attempt.id,
  paperId: String(attempt.paperId),
  paperTitle: attempt.paperTitle,
  type: attempt.type,
  status: attempt.status,
  questionCount: Number(attempt.totalQuestions) || 0,
  answeredCount: Number(attempt.answeredCount) || 0,
  gradedCount: Number(attempt.gradedCount) || 0,
  averageScore: Number(attempt.averageScore) || 0,
  durationSeconds: Number(attempt.totalDuration) || 0,
  updatedAt: attempt.completedAt || attempt.submittedAt,
})))
const historyItems = computed<ArchiveHistoryItem[]>(() => [...remoteHistoryItems.value, ...localHistoryItems.value].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)))
const visibleHistoryItems = computed(() => {
  if (historyFilter.value === 'all') return historyItems.value
  if (historyFilter.value === 'completed') {
    return historyItems.value.filter(item => isRemoteHistoryItem(item) ? item.status === 'graded' : item.status === 'completed')
  }
  return historyItems.value.filter(item => !isRemoteHistoryItem(item) && item.status === 'draft')
})
const favoriteCount = computed(() => favorites.value.length + remoteFavoriteTotal.value)
const remotePracticeRecords = computed<PracticeRecord[]>(() => remoteAttempts.value.flatMap(attempt => (attempt.answers || [])
  .filter(answer => answer.status === 'graded' && (answer.evaluation || answer.report))
  .map(answer => {
    const evaluation = normalizeAttemptEvaluation(answer)
    return {
      id: `attempt-${attempt.id}-${answer.id}`,
      paperId: String(attempt.paperId),
      paperTitle: attempt.paperTitle,
      type: attempt.type,
      questionId: String(answer.questionId),
      questionTitle: answer.questionTitle,
      answer: answer.answer,
      score: evaluation.score,
      durationSeconds: Number(answer.duration) || 0,
      submittedAt: answer.gradedAt || attempt.completedAt || attempt.submittedAt,
      dimensions: evaluation.dimensions,
      evaluation,
    }
  }))
)
const allPracticeRecords = computed(() => [...records.value, ...remotePracticeRecords.value])
const essayRecords = computed(() => allPracticeRecords.value.filter(record => record.type === 'essay'))
const interviewRecords = computed(() => allPracticeRecords.value.filter(record => record.type === 'interview'))
const essayRadarItems = computed(() => aggregateReportDimensions(essayRecords.value, essayDimensions))
const interviewRadarItems = computed(() => aggregateReportDimensions(interviewRecords.value, interviewDimensions))
const dimensionRows = computed(() => [
  ...buildDimensionRows('申论', essayRadarItems.value, essayRecords.value.length),
  ...buildDimensionRows('面试', interviewRadarItems.value, interviewRecords.value.length),
])
const average = computed(() => averageScore(allPracticeRecords.value))
const essayAverage = computed(() => averageScore(essayRecords.value))
const interviewAverage = computed(() => averageScore(interviewRecords.value))
const weakest = computed(() => [...dimensionRows.value].sort((a, b) => a.score - b.score)[0])
const scoreAngle = computed(() => `${Math.max(0, Math.min(100, average.value || 0)) * 3.6}deg`)
const reportInsight = computed(() => {
  if (!allPracticeRecords.value.length) {
    return {
      title: '等待作答样本',
      text: '完成任意申论或面试真题后，系统会把得分、用时、维度表现同步到这里。',
    }
  }
  const weakName = weakest.value ? `${weakest.value.typeLabel}·${weakest.value.name}` : '核心维度'
  return {
    title: `${weakName} 是当前提分点`,
    text: `最近作答中“${weakName}”相对偏弱，建议先复盘低分题，再用同类型真题做一次限时训练。`,
  }
})

const archiveStats = computed(() => [
  { label: '练习记录', value: historyItems.value.length, icon: FolderChecked, tone: 'blue' },
  { label: '平均得分', value: average.value || '--', icon: TrendCharts, tone: 'green' },
  { label: '错题', value: remoteWrongTotal.value, icon: Warning, tone: 'orange' },
  { label: '收藏', value: favoriteCount.value, icon: StarFilled, tone: 'yellow' },
])

const reportStats = computed(() => [
  { label: '预测分', value: average.value ? average.value.toFixed(1) : '0.0', suffix: '/100' },
  { label: '申论均分', value: essayAverage.value ? essayAverage.value.toFixed(1) : '--', suffix: essayRecords.value.length ? ` / ${essayRecords.value.length}道` : '' },
  { label: '面试均分', value: interviewAverage.value ? interviewAverage.value.toFixed(1) : '--', suffix: interviewRecords.value.length ? ` / ${interviewRecords.value.length}道` : '' },
])

const noteItems = computed(() => {
  const wrongNotes = remoteWrongItems.value
    .filter(item => item.notes?.trim())
    .map(item => ({
      id: `wrong-note-${item.id}`,
      title: item.Question?.stem || '错题笔记',
      source: '错题笔记',
      excerpt: item.notes || '',
      date: item.last_wrong_at,
      tags: [item.Question?.question_type || '错题', item.Question?.difficulty || '待复盘'].filter(Boolean),
      paperId: '',
    }))

  const aiNotes = allPracticeRecords.value.slice(0, 12).map(record => ({
    id: `record-note-${record.id}`,
    title: record.questionTitle,
    source: record.paperTitle,
    excerpt: record.evaluation.summary,
    date: record.submittedAt,
    tags: record.evaluation.suggestions.slice(0, 2),
    paperId: record.paperId,
  }))

  return [...wrongNotes, ...aiNotes]
})

onMounted(() => {
  refreshLocalState()
  loadRemoteArchive()
})

onBeforeUnmount(() => {
  stopAttemptPolling()
})

watch(() => route.fullPath, () => {
  refreshLocalState()
})

function normalizeTab(value: unknown): ArchiveTab {
  const raw = Array.isArray(value) ? value[0] : value
  return ['history', 'report', 'wrong', 'notes', 'favorite'].includes(String(raw)) ? String(raw) as ArchiveTab : 'history'
}

function withPreview(query: Record<string, string> = {}) {
  return route.query.preview === '1' ? { preview: '1', ...query } : query
}

function routeTarget(path: string, query: Record<string, string> = {}) {
  return { path, query: withPreview(query) }
}

function tabTarget(tab: ArchiveTab) {
  if (tab === 'report') return routeTarget('/report')
  if (tab === 'history') return routeTarget('/history')
  return routeTarget('/history', { tab })
}

function selectTab(tab: ArchiveTab) {
  router.push(tabTarget(tab))
}

function aggregateReportDimensions(source: PracticeRecord[], names: string[]) {
  if (!source.length) return []

  return names
    .map(name => {
      const scores = source.flatMap(record => record.dimensions.filter(item => item.name === name).map(item => item.score))
      if (!scores.length) return null
      return {
        name,
        score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      }
    })
    .filter((item): item is ScoreDimension => Boolean(item))
}

function buildDimensionRows(typeLabel: string, dimensions: ScoreDimension[], sampleCount: number) {
  return dimensions.map((item, index) => ({
    ...item,
    typeLabel,
    target: Math.min(88, 70 + index * 3),
    answered: sampleCount,
    total: Math.max(sampleCount, 1),
  }))
}

function normalizeAttemptEvaluation(answer: RemoteAttemptAnswer): EvaluationResult {
  if (answer.evaluation) {
    return {
      score: Number(answer.evaluation.score || answer.score || 0),
      level: String(answer.evaluation.level || answer.level || ''),
      summary: String(answer.evaluation.summary || ''),
      dimensions: Array.isArray(answer.evaluation.dimensions) ? answer.evaluation.dimensions : (answer.dimensions || []),
      advantages: Array.isArray(answer.evaluation.advantages) ? answer.evaluation.advantages : [],
      disadvantages: Array.isArray(answer.evaluation.disadvantages) ? answer.evaluation.disadvantages : [],
      suggestions: Array.isArray(answer.evaluation.suggestions) ? answer.evaluation.suggestions : [],
      qualityMaterials: Array.isArray(answer.evaluation.qualityMaterials) ? answer.evaluation.qualityMaterials : [],
      governmentReportLinks: Array.isArray(answer.evaluation.governmentReportLinks) ? answer.evaluation.governmentReportLinks : [],
      sampleEssay: String(answer.evaluation.sampleEssay || answer.report?.sampleAnswer || ''),
    }
  }

  const report = answer.report || {}
  return {
    score: Number(report.score || answer.score || 0),
    level: String(report.level || answer.level || ''),
    summary: String(report.summary || ''),
    dimensions: Array.isArray(report.dimensions) ? report.dimensions : (answer.dimensions || []),
    advantages: Array.isArray(report.advantages)
      ? report.advantages.map((item: any) => typeof item === 'string' ? item : `${item.title || '优点'}：${item.detail || ''}`)
      : [],
    disadvantages: Array.isArray(report.deductions)
      ? report.deductions.map((item: any) => typeof item === 'string' ? item : `${item.title || '扣分点'}：${item.originalProblem || item.whyWrong || ''}`)
      : [],
    suggestions: Array.isArray(report.highScoreThinking) ? report.highScoreThinking.map(String) : [],
    qualityMaterials: Array.isArray(report.goldenSentences)
      ? report.goldenSentences.map((content: string, index: number) => ({ title: `金句${index + 1}`, content, usage: '适合面试表达升级。' }))
      : [],
    governmentReportLinks: Array.isArray(report.localPolicyInsight?.cases) ? report.localPolicyInsight.cases : [],
    sampleEssay: String(report.sampleAnswer || ''),
  }
}

function isRemoteHistoryItem(item: ArchiveHistoryItem): item is RemoteHistoryItem {
  return 'source' in item && item.source === 'remote-attempt'
}

function refreshLocalState() {
  records.value = readPracticeRecords()
  drafts.value = readPracticeDrafts()
  favorites.value = readFavoritePapers()
}

async function loadRemoteArchive() {
  if (!localStorage.getItem('pq_token')) return
  remoteLoading.value = true
  try {
    const [wrongResult, favoriteResult, attemptResult] = await Promise.allSettled([
      wrongbookApi.wrong({ page: 1, pageSize: 20 }),
      wrongbookApi.favorites({ page: 1, pageSize: 20 }),
      realPaperApi.attempts({ page: 1, pageSize: 50, type: 'interview', includeAnswers: '1' }),
    ])

    if (wrongResult.status === 'fulfilled') {
      remoteWrongItems.value = ((wrongResult.value as any).data?.list || []) as RemoteWrongItem[]
      remoteWrongTotal.value = Number((wrongResult.value as any).data?.total || remoteWrongItems.value.length)
    }
    if (favoriteResult.status === 'fulfilled') {
      remoteQuestionFavorites.value = ((favoriteResult.value as any).data?.list || []) as RemoteFavoriteItem[]
      remoteFavoriteTotal.value = Number((favoriteResult.value as any).data?.total || remoteQuestionFavorites.value.length)
    }
    if (attemptResult.status === 'fulfilled') {
      remoteAttempts.value = ((attemptResult.value as any).data?.list || []) as RemoteAttemptItem[]
      syncAttemptPolling()
    }
  } finally {
    remoteLoading.value = false
  }
}

async function loadRemoteAttempts() {
  if (!localStorage.getItem('pq_token')) return
  const response: any = await realPaperApi.attempts({ page: 1, pageSize: 50, type: 'interview', includeAnswers: '1' })
  remoteAttempts.value = (response.data?.list || []) as RemoteAttemptItem[]
  syncAttemptPolling()
}

function syncAttemptPolling() {
  const hasGrading = remoteAttempts.value.some(item => item.status === 'grading')
  if (hasGrading && !attemptPollTimer) {
    attemptPollTimer = window.setInterval(() => {
      loadRemoteAttempts().catch(() => undefined)
    }, 5000)
  }
  if (!hasGrading) {
    stopAttemptPolling()
  }
}

function stopAttemptPolling() {
  if (!attemptPollTimer) return
  window.clearInterval(attemptPollTimer)
  attemptPollTimer = undefined
}

function openHistoryItem(item: ArchiveHistoryItem) {
  if (isRemoteHistoryItem(item)) {
    router.push(routeTarget(`/practice/${item.paperId}`, {
      from: 'history',
      mode: 'review',
      attemptId: String(item.attemptId),
    }))
    return
  }
  router.push(routeTarget(`/practice/${item.paperId}`, item.status === 'draft' ? { from: 'history', resume: '1' } : { from: 'history' }))
}

function historyTypeLabel(item: ArchiveHistoryItem) {
  return item.type === 'essay' ? '申论' : '面试'
}

function historyStatusLabel(item: ArchiveHistoryItem) {
  if (isRemoteHistoryItem(item)) {
    if (item.status === 'graded') return 'AI 批改完成'
    if (item.status === 'failed') return '批改失败'
    return 'AI 正在批改中'
  }
  return item.status === 'draft' ? '保存进度' : '已完成'
}

function historyCountPrefix(item: ArchiveHistoryItem) {
  if (isRemoteHistoryItem(item)) return `共${item.questionCount}题，已批改`
  return `共${item.questionCount || item.answeredCount}题，已答`
}

function historyCountValue(item: ArchiveHistoryItem) {
  if (isRemoteHistoryItem(item)) return item.gradedCount
  return item.answeredCount
}

function historyCountSuffix(item: ArchiveHistoryItem) {
  if (isRemoteHistoryItem(item)) return item.status === 'graded' ? '题' : `/${item.questionCount}题`
  return '题'
}

function openFavorite(item: FavoritePaper) {
  router.push(routeTarget(`/practice/${item.paperId}`, { from: 'history', type: item.type }))
}

function openNote(item: { paperId: string }) {
  if (!item.paperId) return
  router.push(routeTarget(`/practice/${item.paperId}`, { from: 'history' }))
}

function removeLocalFavorite(item: FavoritePaper) {
  removeFavoritePaper(item.paperId)
  refreshLocalState()
  ElMessage.success('已取消收藏')
}

async function markWrongMastered(item: RemoteWrongItem) {
  await wrongbookApi.markMastered(item.id)
  remoteWrongItems.value = remoteWrongItems.value.filter(row => row.id !== item.id)
  remoteWrongTotal.value = Math.max(0, remoteWrongTotal.value - 1)
  ElMessage.success('已标记掌握')
}

async function deleteWrong(item: RemoteWrongItem) {
  await wrongbookApi.deleteWrong(item.id)
  remoteWrongItems.value = remoteWrongItems.value.filter(row => row.id !== item.id)
  remoteWrongTotal.value = Math.max(0, remoteWrongTotal.value - 1)
  ElMessage.success('已删除错题')
}

async function removeRemoteFavorite(item: RemoteFavoriteItem) {
  if (!item.Question?.id) return
  await wrongbookApi.toggleFavorite(item.Question.id)
  remoteQuestionFavorites.value = remoteQuestionFavorites.value.filter(row => row.id !== item.id)
  remoteFavoriteTotal.value = Math.max(0, remoteFavoriteTotal.value - 1)
  ElMessage.success('已取消收藏')
}

function formatDate(value?: string) {
  if (!value) return '刚刚'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '刚刚'
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replaceAll('/', '.')
}

function formatShortDate(value?: string) {
  if (!value) return '刚刚'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '刚刚'
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replaceAll('/', '.')
}
</script>

<template>
  <div class="archive-shell">
    <header class="archive-nav">
      <div class="archive-nav-inner">
        <router-link :to="routeTarget('/coach')" class="archive-brand">
          <span class="brand-mark">PQ</span>
          <strong>PolicyQuest</strong>
        </router-link>

        <button class="avatar-button" type="button" @click="router.push(routeTarget('/profile'))" :aria-label="`${currentUserName}的个人档案`">
          {{ currentUserInitial }}
        </button>
      </div>
    </header>

    <main class="archive-main">
      <div class="crumb-row">
        <button type="button" @click="router.push(routeTarget('/coach'))" aria-label="返回学习中心">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <span>学习中心</span>
        <strong>个人学习档案</strong>
      </div>

      <section class="archive-tabs" aria-label="个人学习档案切换">
        <button
          v-for="item in tabOptions"
          :key="item.key"
          type="button"
          :class="{ active: activeTab === item.key }"
          @click="selectTab(item.key)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          {{ item.label }}
        </button>
      </section>

      <section class="summary-strip">
        <article v-for="item in archiveStats" :key="item.label" :class="item.tone">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </article>
      </section>

      <section v-if="activeTab === 'history'" class="archive-panel history-view">
        <div class="panel-toolbar">
          <div class="sub-tabs">
            <button
              v-for="item in historyFilters"
              :key="item.key"
              type="button"
              :class="{ active: historyFilter === item.key }"
              @click="historyFilter = item.key"
            >
              {{ item.label }}
            </button>
          </div>
          <button class="ghost-action" type="button" @click="router.push(routeTarget('/papers'))">
            去真题库 <el-icon><ArrowRight /></el-icon>
          </button>
        </div>

        <div v-if="visibleHistoryItems.length" class="fenbi-list">
          <button
            v-for="item in visibleHistoryItems"
            :key="item.id"
            type="button"
            class="history-row"
            @click="openHistoryItem(item)"
          >
            <div>
              <strong>{{ item.paperTitle }}</strong>
              <small>
                {{ historyTypeLabel(item) }} ·
                {{ historyStatusLabel(item) }} ·
                {{ formatDate(item.updatedAt) }}
              </small>
            </div>
            <span>{{ historyCountPrefix(item) }}<em>{{ historyCountValue(item) }}</em>{{ historyCountSuffix(item) }}</span>
          </button>
        </div>

        <div v-else class="empty-state">
          <strong>还没有练习记录</strong>
          <span>进入真题库完成一次作答后，会在这里形成练习历史。</span>
          <button type="button" @click="router.push(routeTarget('/papers'))">去真题库</button>
        </div>
      </section>

      <section v-else-if="activeTab === 'report'" class="report-view">
        <div class="report-grid">
          <article class="score-card">
            <h2>预测分</h2>
            <div class="score-ring" :style="{ '--score-angle': scoreAngle }">
              <strong>{{ average ? average.toFixed(1) : '0.0' }}</strong>
              <span>满分100</span>
            </div>
            <div class="score-lines">
              <div v-for="item in reportStats" :key="item.label">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}<small>{{ item.suffix }}</small></strong>
              </div>
            </div>
          </article>

          <article class="radar-card">
            <h2>申论能力雷达</h2>
            <AbilityRadar v-if="essayRadarItems.length" :items="essayRadarItems" :height="318" />
            <div v-else class="mini-empty">
              <strong>暂无申论评分样本</strong>
              <span>完成申论真题并提交 AI 评分后生成。</span>
            </div>
            <div class="legend-row">
              <span><i></i> 我的</span>
              <span><i></i> 目标</span>
            </div>
          </article>

          <article class="radar-card">
            <h2>面试能力雷达</h2>
            <AbilityRadar v-if="interviewRadarItems.length" :items="interviewRadarItems" :height="318" />
            <div v-else class="mini-empty">
              <strong>暂无面试评分样本</strong>
              <span>完成面试真题并提交 AI 评分后生成。</span>
            </div>
            <div class="legend-row">
              <span><i></i> 我的</span>
              <span><i></i> 目标</span>
            </div>
          </article>

          <article class="accuracy-card">
            <div class="accuracy-head">
              <h2>能力概览</h2>
              <span><i></i> 我的</span>
              <span><i></i> 目标</span>
            </div>
            <div v-if="dimensionRows.length" class="accuracy-list">
              <div v-for="item in dimensionRows" :key="item.name" class="accuracy-row">
                <el-icon><CircleCheck /></el-icon>
                <div>
                  <strong>{{ item.typeLabel }} · {{ item.name }}</strong>
                  <small>{{ item.answered }} 次真实评分样本</small>
                </div>
                <i class="bar"><b :style="{ width: `${item.score}%` }"></b><em :style="{ left: `${item.target}%` }"></em></i>
                <span>{{ item.score }}%</span>
              </div>
            </div>
            <div v-else class="mini-empty">
              <strong>暂无能力维度</strong>
              <span>系统只会使用真实作答评分记录生成能力概览。</span>
            </div>
          </article>
        </div>

        <div class="trend-panel">
          <div>
            <h2>学习建议</h2>
            <strong>{{ reportInsight.title }}</strong>
            <p>{{ reportInsight.text }}</p>
          </div>
          <button type="button" @click="router.push(routeTarget('/papers'))">继续训练</button>
        </div>
      </section>

      <section v-else-if="activeTab === 'wrong'" class="archive-panel">
        <div class="panel-toolbar">
          <h2>我的错题</h2>
          <span>{{ remoteLoading ? '同步中' : `共 ${remoteWrongTotal} 题` }}</span>
        </div>

        <div v-if="remoteWrongItems.length" class="question-list">
          <article v-for="item in remoteWrongItems" :key="item.id" class="question-row">
            <div>
              <strong>{{ item.Question?.stem || '错题记录' }}</strong>
              <small>
                {{ item.Question?.question_type || '练习题' }} ·
                难度 {{ item.Question?.difficulty || '--' }} ·
                错 {{ item.wrong_count || 1 }} 次 ·
                {{ formatShortDate(item.last_wrong_at) }}
              </small>
              <p v-if="item.Question?.analysis">{{ item.Question.analysis }}</p>
            </div>
            <div class="row-actions">
              <button type="button" @click="markWrongMastered(item)">标记掌握</button>
              <button type="button" @click="deleteWrong(item)">删除</button>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <strong>暂无错题</strong>
          <span>客观题练习答错后，会进入错题本；申论和面试的薄弱项会沉淀到用户报告。</span>
          <button type="button" @click="router.push(routeTarget('/papers'))">去练习</button>
        </div>
      </section>

      <section v-else-if="activeTab === 'notes'" class="archive-panel">
        <div class="panel-toolbar">
          <h2>我的笔记</h2>
          <span>共 {{ noteItems.length }} 条</span>
        </div>

        <div v-if="noteItems.length" class="note-grid">
          <article v-for="item in noteItems" :key="item.id" class="note-card">
            <span>{{ item.source }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.excerpt }}</p>
            <div>
              <small v-for="tag in item.tags" :key="tag">{{ tag }}</small>
            </div>
            <button v-if="item.paperId" type="button" @click="openNote(item)">
              查看来源 <el-icon><ArrowRight /></el-icon>
            </button>
          </article>
        </div>

        <div v-else class="empty-state">
          <strong>还没有笔记</strong>
          <span>完成作答后的 AI 复盘摘要、错题备注会汇总到这里。</span>
          <button type="button" @click="router.push(routeTarget('/papers'))">去完成一题</button>
        </div>
      </section>

      <section v-else class="archive-panel">
        <div class="panel-toolbar">
          <h2>我的收藏</h2>
          <span>真题 {{ favorites.length }} · 题目 {{ remoteFavoriteTotal }}</span>
        </div>

        <div v-if="favorites.length || remoteQuestionFavorites.length" class="favorite-grid">
          <article v-for="item in favorites" :key="item.paperId" class="favorite-card">
            <header>
              <span>{{ item.type === 'essay' ? '申论真题' : '面试真题' }}</span>
              <button type="button" aria-label="取消收藏" @click="removeLocalFavorite(item)">
                <el-icon><Delete /></el-icon>
              </button>
            </header>
            <h3>{{ item.paperTitle }}</h3>
            <div class="meta-row">
              <small><el-icon><Calendar /></el-icon>{{ item.year }}</small>
              <small><el-icon><Files /></el-icon>{{ item.questionCount }} 题</small>
              <small><el-icon><Timer /></el-icon>{{ item.suggestedMinutes }} 分钟</small>
            </div>
            <button class="primary-action" type="button" @click="openFavorite(item)">
              进入真题 <el-icon><ArrowRight /></el-icon>
            </button>
          </article>

          <article v-for="item in remoteQuestionFavorites" :key="`question-${item.id}`" class="favorite-card question">
            <header>
              <span>收藏题目</span>
              <button type="button" aria-label="取消收藏" @click="removeRemoteFavorite(item)">
                <el-icon><Delete /></el-icon>
              </button>
            </header>
            <h3>{{ item.Question?.stem || '收藏题目' }}</h3>
            <div class="meta-row">
              <small><el-icon><Reading /></el-icon>{{ item.Question?.question_type || '练习题' }}</small>
              <small><el-icon><TrendCharts /></el-icon>难度 {{ item.Question?.difficulty || '--' }}</small>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <strong>还没有收藏</strong>
          <span>在真题库或作答页收藏的真题，会集中展示在这里。</span>
          <button type="button" @click="router.push(routeTarget('/papers'))">去真题库</button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.archive-shell {
  min-height: 100vh;
  background: #f3f6fb;
  color: #273449;
}

.archive-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 72px;
  border-bottom: 1px solid #eef2f7;
  background: #ffffff;
}

.archive-nav-inner {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 64px;
  align-items: center;
  width: min(1480px, calc(100vw - 48px));
  height: 100%;
  margin: 0 auto;
}

.archive-brand,
.avatar-button,
.crumb-row,
.archive-tabs,
.summary-strip article,
.panel-toolbar,
.sub-tabs,
.ghost-action,
.history-row,
.accuracy-head,
.accuracy-row,
.row-actions,
.note-card button,
.favorite-card header,
.meta-row,
.primary-action {
  display: flex;
  align-items: center;
}

.archive-brand {
  gap: 10px;
  color: #1f3047;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2d7dff, #0066ff);
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
}

.archive-brand strong {
  font-size: 19px;
  font-weight: 900;
}

.avatar-button {
  justify-self: end;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: #f4b66e;
  color: #ffffff;
  font-weight: 900;
}

.archive-main {
  width: min(1360px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 28px 0 60px;
}

.crumb-row {
  gap: 10px;
  min-height: 48px;
  color: #8b96a7;
  font-weight: 800;
}

.crumb-row button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #748092;
  font-size: 20px;
}

.crumb-row strong {
  color: #1f3047;
}

.archive-tabs {
  gap: 54px;
  min-height: 76px;
  padding: 0 34px;
  background: #ffffff;
  box-shadow: 0 1px 0 rgba(209, 217, 230, 0.55);
}

.archive-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 112px;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #334155;
  font-size: 16px;
  font-weight: 800;
}

.archive-tabs button.active {
  background: #397bf6;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(57, 123, 246, 0.18);
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 18px 0;
}

.summary-strip article {
  min-height: 92px;
  gap: 12px;
  padding: 18px 20px;
  background: #ffffff;
  box-shadow: 0 1px 0 rgba(209, 217, 230, 0.55);
}

.summary-strip .el-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 18px;
}

.summary-strip .blue .el-icon,
.summary-strip .green .el-icon {
  background: #397bf6;
}

.summary-strip .orange .el-icon {
  background: #ff7449;
}

.summary-strip .yellow .el-icon {
  background: #ffc12e;
}

.summary-strip span {
  flex: 1;
  color: #596579;
  font-weight: 800;
}

.summary-strip strong {
  color: #26344a;
  font-size: 28px;
  font-weight: 900;
}

.archive-panel,
.score-card,
.radar-card,
.accuracy-card,
.trend-panel {
  background: #ffffff;
  box-shadow: 0 1px 0 rgba(209, 217, 230, 0.55);
}

.archive-panel {
  min-height: 620px;
  padding: 26px 34px 34px;
}

.panel-toolbar {
  justify-content: space-between;
  gap: 18px;
  min-height: 56px;
  border-bottom: 1px solid #eef2f6;
}

.panel-toolbar h2 {
  margin: 0;
  color: #26344a;
  font-size: 24px;
  font-weight: 900;
}

.panel-toolbar > span {
  color: #8d98aa;
  font-weight: 800;
}

.sub-tabs {
  gap: 36px;
}

.sub-tabs button,
.ghost-action {
  border: 0;
  background: transparent;
  color: #8995a8;
  font-size: 16px;
  font-weight: 800;
}

.sub-tabs button.active {
  color: #397bf6;
}

.ghost-action {
  gap: 4px;
}

.fenbi-list {
  display: grid;
}

.history-row {
  justify-content: space-between;
  gap: 28px;
  min-height: 112px;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #eef2f6;
  background: #ffffff;
  color: #26344a;
  text-align: left;
}

.history-row strong,
.question-row strong {
  display: block;
  color: #26344a;
  font-size: 19px;
  font-weight: 800;
}

.history-row small,
.question-row small {
  display: block;
  margin-top: 14px;
  color: #8c98ab;
  font-size: 14px;
}

.history-row > span {
  min-width: 180px;
  color: #3f7cf6;
  font-size: 15px;
  text-align: right;
  white-space: nowrap;
}

.history-row em {
  font-size: 28px;
  font-style: normal;
  font-weight: 900;
}

.report-view {
  display: grid;
  gap: 18px;
}

.report-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.82fr) repeat(2, minmax(320px, 1fr));
  gap: 18px;
}

.score-card,
.radar-card,
.accuracy-card {
  min-height: 470px;
  padding: 28px 30px;
}

.accuracy-card {
  grid-column: 1 / -1;
  min-height: 360px;
}

.score-card h2,
.radar-card h2,
.accuracy-card h2,
.trend-panel h2 {
  margin: 0;
  color: #26344a;
  font-size: 22px;
  font-weight: 900;
}

.score-ring {
  display: grid;
  grid-template-rows: auto auto;
  align-content: center;
  justify-items: center;
  gap: 12px;
  width: 190px;
  height: 190px;
  margin: 34px auto 38px;
  border-radius: 999px;
  background:
    radial-gradient(circle at center, #ffffff 59%, transparent 60%),
    conic-gradient(#4b7cff var(--score-angle), #eef3fb 0);
  box-shadow:
    inset 0 0 0 1px rgba(75, 124, 255, 0.08),
    0 16px 34px rgba(75, 124, 255, 0.13);
}

.score-ring strong {
  color: #24314b;
  font-size: 46px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 0.9;
}

.score-ring span {
  color: #8c98aa;
  font-weight: 800;
  line-height: 1;
}

.score-lines {
  display: grid;
}

.score-lines div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  border-top: 1px solid #eef2f6;
}

.score-lines span {
  color: #667386;
  font-weight: 800;
}

.score-lines strong {
  color: #26344a;
  font-size: 24px;
  font-weight: 900;
}

.score-lines small {
  margin-left: 4px;
  color: #a2adbd;
  font-size: 14px;
}

.radar-card {
  display: grid;
  align-content: start;
}

.mini-empty {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 318px;
  color: #8d98aa;
  text-align: center;
}

.mini-empty strong {
  color: #26344a;
  font-size: 18px;
  font-weight: 900;
}

.mini-empty span {
  line-height: 1.65;
}

.legend-row {
  display: flex;
  justify-content: center;
  gap: 18px;
  color: #8c98aa;
  font-weight: 800;
}

.legend-row i,
.accuracy-head i {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 6px;
  border-radius: 2px;
  background: #3f7cf6;
}

.legend-row span:last-child i,
.accuracy-head span:last-child i {
  background: #ff8173;
}

.accuracy-head {
  gap: 22px;
  min-height: 44px;
}

.accuracy-head h2 {
  flex: 1;
}

.accuracy-head span {
  color: #7f8da0;
  font-weight: 800;
}

.accuracy-list {
  display: grid;
}

.accuracy-row {
  gap: 14px;
  min-height: 86px;
  border-top: 1px solid #eef2f6;
}

.accuracy-row > .el-icon {
  color: #3f7cf6;
  font-size: 22px;
}

.accuracy-row div {
  min-width: 120px;
}

.accuracy-row strong,
.accuracy-row small {
  display: block;
}

.accuracy-row strong {
  color: #26344a;
  font-size: 17px;
  font-weight: 900;
}

.accuracy-row small {
  margin-top: 4px;
  color: #8d98aa;
}

.accuracy-row .bar {
  position: relative;
  flex: 1;
  height: 10px;
  border-radius: 999px;
  background: #f1f4f8;
}

.accuracy-row .bar b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #3f7cf6;
}

.accuracy-row .bar em {
  position: absolute;
  top: -7px;
  width: 2px;
  height: 24px;
  background: #ff8173;
}

.accuracy-row > span {
  min-width: 54px;
  color: #3f7cf6;
  font-weight: 900;
  text-align: right;
}

.trend-panel {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 30px;
}

.trend-panel strong {
  display: block;
  margin-top: 12px;
  color: #26344a;
  font-size: 20px;
  font-weight: 900;
}

.trend-panel p {
  max-width: 760px;
  margin: 10px 0 0;
  color: #667386;
  line-height: 1.7;
}

.trend-panel button,
.empty-state button {
  align-self: center;
  min-height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 6px;
  background: #397bf6;
  color: #ffffff;
  font-weight: 900;
}

.question-list {
  display: grid;
}

.question-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  gap: 24px;
  padding: 24px 0;
  border-bottom: 1px solid #eef2f6;
}

.question-row p {
  margin: 12px 0 0;
  color: #667386;
  line-height: 1.65;
}

.row-actions {
  justify-content: flex-end;
  gap: 8px;
}

.row-actions button {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #d9e4f1;
  border-radius: 999px;
  background: #ffffff;
  color: #397bf6;
  font-weight: 900;
}

.row-actions button:last-child {
  color: #ff7449;
}

.note-grid,
.favorite-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  padding-top: 22px;
}

.note-card,
.favorite-card {
  display: grid;
  gap: 14px;
  min-height: 238px;
  padding: 20px;
  border: 1px solid #edf1f6;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(39, 52, 73, 0.04);
}

.note-card > span,
.favorite-card header span {
  width: fit-content;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #e8f1ff;
  color: #397bf6;
  font-size: 12px;
  font-weight: 900;
}

.note-card h3,
.favorite-card h3 {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: #26344a;
  font-size: 18px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.note-card p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: #667386;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.note-card div,
.meta-row {
  flex-wrap: wrap;
  gap: 8px;
}

.note-card small,
.meta-row small {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #8d98aa;
  font-size: 12px;
  font-weight: 800;
}

.note-card button,
.primary-action {
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  border: 0;
  border-radius: 6px;
  background: #eff5ff;
  color: #397bf6;
  font-weight: 900;
}

.favorite-card header {
  justify-content: space-between;
  gap: 12px;
}

.favorite-card header button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  background: #fff3f1;
  color: #ff7449;
}

.primary-action {
  background: linear-gradient(135deg, #126af7, #10b6d8);
  color: #ffffff;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 420px;
  color: #8d98aa;
  text-align: center;
}

.empty-state strong {
  color: #26344a;
  font-size: 22px;
  font-weight: 900;
}

.empty-state span {
  max-width: 520px;
  line-height: 1.7;
}

@media (max-width: 1180px) {
  .archive-nav-inner,
  .archive-main {
    width: min(100vw - 32px, 980px);
  }

  .archive-nav-inner {
    grid-template-columns: 190px minmax(0, 1fr) 52px;
  }

  .archive-tabs {
    gap: 14px;
    overflow-x: auto;
  }

  .report-grid,
  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .accuracy-card {
    grid-column: 1 / -1;
  }

  .note-grid,
  .favorite-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .archive-nav {
    height: auto;
  }

  .archive-nav-inner {
    grid-template-columns: 1fr 42px;
    gap: 12px;
    min-height: 68px;
  }

  .archive-main {
    width: min(100vw - 24px, 520px);
    padding-top: 18px;
  }

  .archive-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 12px;
    overflow-x: visible;
  }

  .archive-tabs button {
    justify-content: center;
    width: 100%;
    min-width: 0;
    padding: 0 8px;
  }

  .summary-strip,
  .report-grid,
  .note-grid,
  .favorite-grid,
  .question-row {
    grid-template-columns: 1fr;
  }

  .archive-panel,
  .score-card,
  .radar-card,
  .accuracy-card,
  .trend-panel {
    padding: 20px;
  }

  .panel-toolbar,
  .trend-panel,
  .history-row {
    display: grid;
  }

  .history-row > span {
    min-width: 0;
    text-align: left;
  }

  .accuracy-row {
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 10px;
    padding: 14px 0;
  }

  .accuracy-row .bar,
  .accuracy-row > span {
    grid-column: 2;
    width: 100%;
    text-align: left;
  }
}
</style>
