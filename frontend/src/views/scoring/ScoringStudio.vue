<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowRight,
  Calendar,
  Collection,
  DataAnalysis,
  EditPen,
  MagicStick,
  Reading,
  Search,
  StarFilled,
  Timer,
  TrendCharts,
  UserFilled,
} from '@element-plus/icons-vue'
import AbilityRadar from '../../components/AbilityRadar.vue'
import { practiceApi, realPaperApi, statsApi } from '../../api'
import {
  aggregateDimensions,
  averageScore,
  buildPracticeHistory,
  mapBackendPaper,
  readFavoritePapers,
  readPracticeDrafts,
  readPracticeRecords,
  type FavoritePaper,
  type PracticeDraft,
  type PracticeHistoryItem,
  type PracticeRecord,
  type PracticeType,
  type RealPaper,
} from '../../data/policyQuest'
import { useUserStore } from '../../store/user'

type PaperTypeFilter = 'all' | PracticeType

type BackendOverview = {
  accuracy?: string | number
  total_sessions?: number
  wrong_count?: number
  week_total?: number
  recent_sessions?: Array<{ total_duration?: number }>
  category_stats?: Record<string, { accuracy?: string | number; total?: number; correct?: number }>
}

type BackendPracticeSession = {
  id: number
  session_type?: string
  total_questions?: number
  answered_count?: number
  correct_count?: number
  accuracy?: string | number
  total_duration?: number
  status?: string
  created_at?: string
  createdAt?: string
  submitted_at?: string
  submittedAt?: string
}

type BackendRealPaperAttempt = {
  id: number
  paperId: string | number
  type: PracticeType
  paperTitle: string
  status: 'grading' | 'graded' | 'failed'
  totalQuestions: number
  answeredCount: number
  gradedCount: number
  averageScore: number
  totalDuration: number
  submittedAt?: string
  completedAt?: string
}

type HistoryRow = {
  id: string
  title: string
  meta: string
  date: string
  status: string
  sortTime: number
  action: () => void
}

type EntryCard = {
  title: string
  subtitle: string
  tone: string
  icon: Component
  action: () => void
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const records = ref<PracticeRecord[]>([])
const drafts = ref<PracticeDraft[]>([])
const favorites = ref<FavoritePaper[]>([])
const papers = ref<RealPaper[]>([])
const overview = ref<BackendOverview | null>(null)
const backendHistory = ref<BackendPracticeSession[]>([])
const realPaperHistory = ref<BackendRealPaperAttempt[]>([])
const paperStats = ref<any>(null)
const searchText = ref('')
const activeType = ref<PaperTypeFilter>('all')
const loading = ref(true)

const currentUserName = computed(() => userStore.user?.nickname || userStore.user?.username || '同学')
const currentUserInitial = computed(() => currentUserName.value.slice(0, 1).toUpperCase())

const typeTabs = [
  { key: 'all' as const, label: '全部真题' },
  { key: 'essay' as const, label: '申论' },
  { key: 'interview' as const, label: '面试' },
]

const localAverage = computed(() => averageScore(records.value))
const backendAverage = computed(() => Math.round(Number(overview.value?.accuracy || 0)))
const average = computed(() => localAverage.value || backendAverage.value || 0)
const totalPracticeSeconds = computed(() => {
  const backendSeconds = overview.value?.recent_sessions?.reduce((sum, item) => sum + Number(item.total_duration || 0), 0) || 0
  const localSeconds = records.value.reduce((sum, record) => sum + record.durationSeconds, 0)
  return backendSeconds || localSeconds
})
const practicedCount = computed(() => overview.value?.total_sessions ?? records.value.length)
const wrongCount = computed(() => overview.value?.wrong_count ?? 0)
const draftCount = computed(() => drafts.value.length)
const favoriteCount = computed(() => favorites.value.length)

const dimensions = computed(() => {
  if (records.value.length) return aggregateDimensions(records.value).slice(0, 5)

  const categoryStats = overview.value?.category_stats
  if (categoryStats) {
    const labels: Record<string, string> = { verbal: '规范表达', politics: '政策理解', interview: '面试表达' }
    return Object.entries(categoryStats).map(([key, value]) => ({
      name: labels[key] || key,
      score: Math.round(Number(value.accuracy || 0)),
    })).slice(0, 5)
  }

  return []
})
const weakest = computed(() => [...dimensions.value].sort((a, b) => a.score - b.score)[0])

const essayPaper = computed(() => papers.value.find(paper => paper.type === 'essay'))

const entryCards = computed<EntryCard[]>(() => [
  {
    title: '申论真题',
    subtitle: `${paperCountLabel('essay')} · AI 评分练习`,
    tone: 'blue',
    icon: EditPen,
    action: () => openLibrary('essay'),
  },
  {
    title: '面试真题',
    subtitle: `${paperCountLabel('interview')} · 结构化作答`,
    tone: 'green',
    icon: UserFilled,
    action: () => openLibrary('interview'),
  },
  {
    title: '学习报告',
    subtitle: '能力雷达 · 失分诊断',
    tone: 'yellow',
    icon: DataAnalysis,
    action: () => router.push(routeTarget('/report')),
  },
])

const quickStats = computed(() => [
  { label: '本周训练', value: formatHours(totalPracticeSeconds.value), icon: Timer, tone: 'blue' },
  { label: '已完成', value: `${practicedCount.value || 0} 次`, icon: Reading, tone: 'green' },
  { label: '平均得分', value: average.value ? `${average.value} 分` : '--', icon: TrendCharts, tone: 'cyan' },
  { label: '收藏真题', value: `${favoriteCount.value}`, icon: StarFilled, tone: 'yellow' },
])

const visiblePapers = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return papers.value
    .filter(paper => activeType.value === 'all' || paper.type === activeType.value)
    .filter(paper => {
      if (!keyword) return true
      return [paper.title, paper.region, paper.category, paper.systemLabel, String(paper.year)].some(item =>
        String(item || '').toLowerCase().includes(keyword),
      )
    })
    .slice(0, 5)
})

const localHistoryRows = computed(() => buildPracticeHistory(records.value, drafts.value).slice(0, 4))
const historyRows = computed<HistoryRow[]>(() => [
  ...realPaperHistory.value.map(mapRealPaperHistory),
  ...backendHistory.value.map(mapBackendHistory),
  ...localHistoryRows.value.map(mapLocalHistory),
].sort((a, b) => b.sortTime - a.sortTime).slice(0, 4))

const adviceText = computed(() => {
  if (!records.value.length && !overview.value?.total_sessions) {
    return '先从真题库选择一套申论或面试真题完成作答，系统会沉淀历史记录、能力雷达和下一步建议。'
  }
  const weakName = weakest.value?.name || '提出对策'
  return `最近薄弱项集中在“${weakName}”，建议先做 ${essayPaper.value?.shortTitle || '一套申论真题'}，再到报告里复盘维度得分。`
})

onMounted(async () => {
  records.value = readPracticeRecords()
  drafts.value = readPracticeDrafts()
  favorites.value = readFavoritePapers()
  await loadDashboardData()
})

function withPreview(query: Record<string, string> = {}) {
  return route.query.preview === '1' ? { preview: '1', ...query } : query
}

function routeTarget(path: string, query: Record<string, string> = {}) {
  return { path, query: withPreview(query) }
}

function openLibrary(type?: PracticeType) {
  router.push(routeTarget('/papers', type ? { type } : {}))
}

function openPaper(paper: RealPaper) {
  router.push(routeTarget(`/practice/${paper.id}`, { type: paper.type }))
}

function openHistory() {
  router.push(routeTarget('/history'))
}

function formatDate(value?: string) {
  if (!value) return '刚刚'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function timestamp(value?: string) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function formatHours(seconds: number) {
  if (!seconds) return '0 小时'
  const hours = Math.round((seconds / 3600) * 10) / 10
  return `${hours} 小时`
}

function paperCountLabel(type: PracticeType) {
  const count = Number(paperStats.value?.papers?.[type] ?? papers.value.filter(paper => paper.type === type).length)
  return count > 0 ? `${count} 套真题` : '真题库'
}

function mapBackendHistory(item: BackendPracticeSession) {
  const updatedAt = item.submitted_at || item.submittedAt || item.created_at || item.createdAt
  const accuracy = item.accuracy === undefined || item.accuracy === null ? '--' : `${Math.round(Number(item.accuracy))}%`
  return {
    id: `backend-${item.id}`,
    title: sessionTypeLabel(item.session_type),
    meta: `${item.answered_count || 0}/${item.total_questions || 0} 题 · 正确率 ${accuracy}`,
    date: formatDate(updatedAt),
    status: item.status === 'completed' ? '已完成' : '进行中',
    sortTime: timestamp(updatedAt),
    action: openHistory,
  }
}

function mapRealPaperHistory(item: BackendRealPaperAttempt): HistoryRow {
  const updatedAt = item.completedAt || item.submittedAt
  const isGraded = item.status === 'graded'
  const isFailed = item.status === 'failed'
  const score = isGraded && Number(item.averageScore) > 0 ? ` · ${Math.round(Number(item.averageScore))} 分` : ''
  const progressMeta = item.status === 'grading'
    ? `AI 批改中 ${item.gradedCount || 0}/${item.totalQuestions || 0} 题`
    : `已答 ${item.answeredCount || 0}/${item.totalQuestions || 0} 题${score}`

  return {
    id: `attempt-${item.id}`,
    title: item.paperTitle || (item.type === 'essay' ? '申论真题' : '面试真题'),
    meta: `${item.type === 'essay' ? '申论' : '面试'} · ${progressMeta}`,
    date: formatDate(updatedAt),
    status: isGraded ? 'AI 批改完成' : isFailed ? '批改失败' : 'AI 批改中',
    sortTime: timestamp(updatedAt),
    action: () => router.push(routeTarget(`/practice/${item.paperId}`, {
      from: 'history',
      mode: isGraded ? 'review' : 'grading',
      attemptId: String(item.id),
    })),
  }
}

function mapLocalHistory(item: PracticeHistoryItem) {
  return {
    id: item.id,
    title: item.paperTitle,
    meta: `${item.type === 'essay' ? '申论' : '面试'} · ${item.answeredCount}/${item.questionCount || item.answeredCount} 题 · ${item.averageScore || '--'} 分`,
    date: formatDate(item.updatedAt),
    status: item.status === 'completed' ? '已完成' : '继续',
    sortTime: timestamp(item.updatedAt),
    action: () => router.push(routeTarget(`/practice/${item.paperId}`, item.status === 'draft' ? { resume: '1' } : {})),
  }
}

function sessionTypeLabel(value?: string) {
  const labels: Record<string, string> = {
    quick: '快速练习',
    wrong: '错题巩固',
    real_paper: '真题练习',
  }
  return labels[value || ''] || '练习记录'
}

async function loadDashboardData() {
  loading.value = true
  try {
    const [essayResult, interviewResult, statsResult, overviewResult, historyResult, attemptResult] = await Promise.allSettled([
      realPaperApi.list({ type: 'essay', pageSize: 5 }),
      realPaperApi.list({ type: 'interview', pageSize: 5 }),
      realPaperApi.stats(),
      statsApi.overview(),
      practiceApi.history({ page: 1, pageSize: 4 }),
      realPaperApi.attempts({ page: 1, pageSize: 4 }),
    ])

    const nextPapers: RealPaper[] = []
    if (essayResult.status === 'fulfilled') {
      nextPapers.push(...((essayResult.value as any).data?.list || []).map(mapBackendPaper))
    }
    if (interviewResult.status === 'fulfilled') {
      nextPapers.push(...((interviewResult.value as any).data?.list || []).map(mapBackendPaper))
    }
    papers.value = nextPapers

    if (statsResult.status === 'fulfilled') paperStats.value = (statsResult.value as any).data
    if (overviewResult.status === 'fulfilled') overview.value = (overviewResult.value as any).data
    if (historyResult.status === 'fulfilled') backendHistory.value = ((historyResult.value as any).data?.list || []).slice(0, 4)
    if (attemptResult.status === 'fulfilled') realPaperHistory.value = ((attemptResult.value as any).data?.list || []).slice(0, 4)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fenbi-coach">
    <header class="fenbi-nav">
      <div class="fenbi-nav-inner">
        <router-link :to="routeTarget('/coach')" class="fenbi-brand">
          <span class="brand-badge">PQ</span>
          <strong>PolicyQuest</strong>
        </router-link>

        <button class="avatar-button" type="button" @click="router.push(routeTarget('/profile'))" :aria-label="`${currentUserName}的个人档案`">
          <span>{{ currentUserInitial }}</span>
        </button>
      </div>
    </header>

    <main class="fenbi-main">
      <section class="study-head">
        <div class="title-cluster">
          <div class="title-row">
            <p>AI 学习指挥舱</p>
            <h1>公务员申论面试</h1>
            <span>根据真题作答与评分记录更新训练建议</span>
          </div>

          <div class="type-tabs" role="tablist" aria-label="真题类型筛选">
            <button
              v-for="tab in typeTabs"
              :key="tab.key"
              type="button"
              :class="{ active: activeType === tab.key }"
              @click="activeType = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="head-tools">
          <label class="search-box">
            <span>试题</span>
            <input v-model="searchText" placeholder="输入真题、地区、岗位关键字" />
            <el-icon class="search-icon"><Search /></el-icon>
          </label>
        </div>
      </section>

      <div class="coach-grid">
        <div class="left-rail">
          <section class="practice-hub">
            <div class="entry-grid">
              <button
                v-for="card in entryCards"
                :key="card.title"
                class="entry-tile"
                :class="card.tone"
                type="button"
                @click="card.action()"
              >
                <span>{{ card.title }}</span>
                <small>{{ card.subtitle }}</small>
                <el-icon><component :is="card.icon" /></el-icon>
              </button>
            </div>

            <div class="focus-grid">
              <article class="focus-card primary">
                <span>今日训练建议</span>
                <h2>{{ essayPaper?.shortTitle || '先完成一套申论真题' }}</h2>
                <p>沿用原有真题库与 AI 评分流程，完成后同步到做题历史和学习报告。</p>
                <button type="button" @click="openLibrary('essay')">
                  去申论真题库 <el-icon><ArrowRight /></el-icon>
                </button>
              </article>

              <article class="focus-card">
                <span>最近作答</span>
                <h2>{{ historyRows[0]?.title || '暂无练习记录' }}</h2>
                <p>{{ historyRows[0]?.meta || '完成任意真题后，这里会展示最近进度。' }}</p>
                <button type="button" @click="openHistory">
                  查看做题历史 <el-icon><ArrowRight /></el-icon>
                </button>
              </article>
            </div>
          </section>

          <section class="paper-panel">
            <div class="panel-title">
              <div>
                <span>TRUE PAPER</span>
                <h2>真题速选</h2>
              </div>
              <button type="button" @click="openLibrary(activeType === 'all' ? undefined : activeType)">
                全部真题 <el-icon><ArrowRight /></el-icon>
              </button>
            </div>

            <div v-if="visiblePapers.length" class="paper-list">
              <button
                v-for="paper in visiblePapers"
                :key="paper.id"
                type="button"
                @click="openPaper(paper)"
              >
                <span class="paper-type" :class="paper.type">{{ paper.type === 'essay' ? '申论' : '面试' }}</span>
                <strong>{{ paper.title }}</strong>
                <small>{{ paper.questionCount }} 题 · {{ paper.suggestedMinutes }} 分钟 · {{ paper.systemLabel }}</small>
                <em>开始练习</em>
              </button>
            </div>

            <div v-else class="empty-card">
              <strong>{{ loading ? '正在同步真题库...' : '暂无可展示真题' }}</strong>
              <span>{{ loading ? '请稍候片刻。' : '请前往真题库查看已开放的申论与面试练习。' }}</span>
              <button type="button" @click="openLibrary(activeType === 'all' ? undefined : activeType)">去真题库</button>
            </div>
          </section>

          <section class="ability-panel">
            <div class="panel-title">
              <div>
                <span>ABILITY MAP</span>
                <h2>能力概览</h2>
              </div>
              <button type="button" @click="router.push(routeTarget('/report'))">
                完整报告 <el-icon><ArrowRight /></el-icon>
              </button>
            </div>

            <div v-if="dimensions.length" class="ability-content">
              <AbilityRadar :items="dimensions" :height="220" />
              <div class="weak-list">
                <div v-for="item in dimensions" :key="item.name" class="weak-row">
                  <div>
                    <span>{{ item.name }}</span>
                    <strong>{{ item.score }}%</strong>
                  </div>
                  <i><b :style="{ width: `${item.score}%` }"></b></i>
                </div>
              </div>
            </div>

            <div v-else class="empty-card ability-empty">
              <strong>等待真实作答数据</strong>
              <span>完成申论或面试真题评分后，这里会按真实维度生成能力概览。</span>
              <button type="button" @click="openLibrary()">去真题库</button>
            </div>
          </section>
        </div>

        <aside class="right-rail">
          <section class="history-panel">
            <div class="side-title">
              <h2>练习历史</h2>
              <button type="button" @click="openHistory">全部 <el-icon><ArrowRight /></el-icon></button>
            </div>

            <div v-if="historyRows.length" class="history-list">
              <button
                v-for="item in historyRows"
                :key="item.id"
                type="button"
                @click="item.action()"
              >
                <span>
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.meta }} <b>{{ item.date }}</b></small>
                </span>
                <em>{{ item.status }}</em>
              </button>
            </div>

            <div v-else class="empty-side">
              <strong>暂无记录</strong>
              <span>完成一套真题后自动同步。</span>
            </div>
          </section>

          <section class="score-panel">
            <div v-for="item in quickStats" :key="item.label" class="score-row" :class="item.tone">
              <span class="score-icon"><el-icon><component :is="item.icon" /></el-icon></span>
              <strong>{{ item.label }}</strong>
              <span class="score-value">{{ item.value }}</span>
            </div>
            <div class="score-row orange">
              <span class="score-icon"><el-icon><Collection /></el-icon></span>
              <strong>错题</strong>
              <span class="score-value">{{ wrongCount }}</span>
            </div>
            <div class="score-row purple">
              <span class="score-icon"><el-icon><Calendar /></el-icon></span>
              <strong>保存进度</strong>
              <span class="score-value">{{ draftCount }}</span>
            </div>
          </section>

          <section class="advice-panel">
            <div>
              <el-icon><MagicStick /></el-icon>
              <h2>AI 学习建议</h2>
            </div>
            <p>{{ adviceText }}</p>
            <div class="advice-actions">
              <button type="button" @click="openLibrary('essay')">申论真题库</button>
              <button type="button" @click="openLibrary('interview')">面试真题库</button>
              <button type="button" @click="router.push(routeTarget('/report'))">查看报告</button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fenbi-coach {
  min-height: 100vh;
  background: #f3f6fb;
  color: #2c384a;
}

.fenbi-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 72px;
  border-bottom: 1px solid #edf1f7;
  background: #ffffff;
}

.fenbi-nav-inner {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 64px;
  align-items: center;
  width: min(1420px, calc(100vw - 48px));
  height: 100%;
  margin: 0 auto;
}

.fenbi-brand,
.avatar-button,
.title-row p,
.head-tools,
.panel-title,
.side-title,
.score-row,
.advice-panel div,
.advice-actions,
.focus-card button,
.paper-panel button,
.ability-panel button {
  display: flex;
  align-items: center;
}

.fenbi-brand {
  gap: 10px;
  color: #1d3555;
}

.brand-badge {
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

.fenbi-brand strong {
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

.fenbi-main {
  width: min(1420px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 34px 0 56px;
}

.study-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 430px);
  gap: 24px;
  margin-bottom: 20px;
}

.title-cluster {
  display: grid;
  gap: 18px;
}

.title-row {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.title-row p {
  gap: 6px;
  margin: 0;
  color: #397bf6;
  font-size: 13px;
  font-weight: 900;
}

.title-row h1 {
  margin: 0;
  color: #2d3a4d;
  font-size: 30px;
  font-weight: 900;
  line-height: 1.16;
}

.title-row span {
  color: #7c8798;
  font-weight: 700;
}

.type-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.type-tabs button {
  min-width: 106px;
  min-height: 38px;
  padding: 0 18px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #8a94a6;
  font-size: 17px;
  font-weight: 800;
}

.type-tabs button.active {
  background: #397bf6;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(57, 123, 246, 0.18);
}

.head-tools {
  align-self: start;
  justify-content: flex-end;
}

.search-box {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr) 32px;
  align-items: center;
  width: min(100%, 360px);
  min-height: 42px;
  padding: 0 8px 0 14px;
  border: 1px solid #d9e0ec;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(44, 56, 74, 0.04);
}

.search-box span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  border-radius: 999px;
  background: #f2f5fa;
  color: #4c596c;
  font-weight: 800;
}

.search-box input {
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #263447;
  font-size: 15px;
}

.search-box input::placeholder {
  color: #a2acbd;
}

.search-icon {
  justify-self: center;
  color: #95a0b3;
  font-size: 20px;
}

.coach-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 470px;
  gap: 20px;
  align-items: start;
}

.left-rail,
.right-rail {
  display: grid;
  gap: 20px;
}

.practice-hub,
.paper-panel,
.ability-panel,
.history-panel,
.score-panel,
.advice-panel {
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 1px 0 rgba(209, 217, 230, 0.55);
}

.practice-hub {
  display: grid;
  gap: 18px;
  padding: 20px;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.entry-tile {
  position: relative;
  display: grid;
  align-content: start;
  min-height: 138px;
  overflow: hidden;
  padding: 26px 22px;
  border: 0;
  border-radius: 8px;
  color: #ffffff;
  text-align: left;
}

.entry-tile.blue {
  background: linear-gradient(135deg, #72a0ff, #477cff);
}

.entry-tile.green {
  background: linear-gradient(135deg, #19dba5, #00c78f);
}

.entry-tile.yellow {
  background: linear-gradient(135deg, #ffc933, #ffad04);
}

.entry-tile span {
  position: relative;
  z-index: 1;
  font-size: 21px;
  font-weight: 900;
}

.entry-tile small {
  position: relative;
  z-index: 1;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 13px;
  font-weight: 800;
}

.entry-tile .el-icon {
  position: absolute;
  right: 20px;
  bottom: 12px;
  color: rgba(255, 255, 255, 0.36);
  font-size: 74px;
}

.focus-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.focus-card {
  display: grid;
  gap: 12px;
  min-height: 168px;
  padding: 22px;
  border-radius: 7px;
  background: #f2f6ff;
}

.focus-card.primary {
  background: linear-gradient(145deg, #f0f6ff, #eef7ff);
}

.focus-card span {
  color: #397bf6;
  font-size: 13px;
  font-weight: 900;
}

.focus-card h2 {
  overflow: hidden;
  margin: 0;
  color: #263447;
  font-size: 22px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-card p {
  margin: 0;
  color: #5f6b7c;
  line-height: 1.62;
}

.focus-card button {
  align-self: end;
  justify-content: center;
  gap: 6px;
  width: fit-content;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid #a8c9ff;
  border-radius: 999px;
  background: #ffffff;
  color: #4380f7;
  font-weight: 900;
}

.paper-panel,
.ability-panel {
  padding: 24px;
}

.panel-title,
.side-title {
  justify-content: space-between;
  gap: 16px;
}

.panel-title {
  margin-bottom: 12px;
}

.panel-title span {
  color: #1f68e8;
  font-size: 13px;
  font-weight: 900;
}

.panel-title h2,
.side-title h2,
.advice-panel h2 {
  margin: 4px 0 0;
  color: #28364a;
  font-size: 24px;
  font-weight: 900;
}

.panel-title button,
.side-title button {
  gap: 4px;
  border: 0;
  background: transparent;
  color: #96a1b3;
  font-weight: 900;
}

.paper-list {
  display: grid;
}

.paper-list button {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) minmax(190px, auto) 78px;
  align-items: center;
  gap: 14px;
  min-height: 64px;
  border: 0;
  border-top: 1px solid #eef2f7;
  background: #ffffff;
  text-align: left;
}

.paper-list button:first-child {
  border-top: 0;
}

.paper-type {
  justify-self: start;
  padding: 6px 10px;
  border-radius: 5px;
  background: #e8f1ff;
  color: #397bf6;
  font-size: 12px;
  font-weight: 900;
}

.paper-type.interview {
  background: #ddfbfb;
  color: #0c99a6;
}

.paper-list strong {
  overflow: hidden;
  color: #263447;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paper-list small {
  color: #95a0b2;
  white-space: nowrap;
}

.paper-list em {
  color: #397bf6;
  font-style: normal;
  font-weight: 900;
}

.empty-card,
.empty-side {
  display: grid;
  justify-items: center;
  gap: 8px;
  min-height: 156px;
  padding: 24px;
  border-radius: 8px;
  background: #f8fbff;
  color: #8a95a8;
  text-align: center;
}

.empty-card strong,
.empty-side strong {
  color: #28364a;
  font-size: 18px;
}

.empty-card button {
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: #397bf6;
  color: #ffffff;
  font-weight: 900;
}

.ability-content {
  display: grid;
  grid-template-columns: minmax(240px, 0.82fr) minmax(260px, 1fr);
  gap: 20px;
  align-items: center;
}

.weak-list {
  display: grid;
  gap: 14px;
}

.weak-row {
  display: grid;
  gap: 8px;
}

.weak-row div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #526071;
  font-size: 13px;
  font-weight: 900;
}

.weak-row i {
  display: block;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #e8eef6;
}

.weak-row b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #3f7cf6, #22cbb0);
}

.history-panel {
  padding: 24px 18px 10px;
}

.side-title {
  padding: 0 0 18px;
  border-bottom: 1px solid #edf1f6;
}

.history-list {
  display: grid;
}

.history-list button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px;
  align-items: center;
  gap: 12px;
  min-height: 96px;
  border: 0;
  border-bottom: 1px solid #f0f3f8;
  background: #ffffff;
  color: #263447;
  text-align: left;
}

.history-list strong,
.history-list small {
  display: block;
}

.history-list strong {
  overflow: hidden;
  font-size: 18px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-list small {
  margin-top: 10px;
  color: #8d98aa;
  font-size: 13px;
}

.history-list b {
  margin-left: 6px;
  color: #9aa5b6;
  font-weight: 500;
}

.history-list em {
  justify-self: end;
  display: grid;
  place-items: center;
  min-width: 78px;
  min-height: 38px;
  border-radius: 999px;
  background: #f5f7fb;
  color: #9aa5b6;
  font-style: normal;
  font-weight: 800;
}

.score-panel {
  padding: 16px 22px;
}

.score-row {
  min-height: 50px;
  gap: 12px;
  border-bottom: 1px solid #f0f3f8;
}

.score-row:last-child {
  border-bottom: 0;
}

.score-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  color: #ffffff;
}

.score-row.blue .score-icon {
  background: #58a0ff;
}

.score-row.green .score-icon {
  background: #18c89a;
}

.score-row.cyan .score-icon {
  background: #0aa8c5;
}

.score-row.yellow .score-icon {
  background: #ffc12e;
}

.score-row.orange .score-icon {
  background: #ff7449;
}

.score-row.purple .score-icon {
  background: #7873f5;
}

.score-row strong {
  flex: 1;
  color: #4b5668;
  font-weight: 800;
}

.score-value {
  color: #637092;
  font-size: 21px;
  font-weight: 900;
}

.advice-panel {
  display: grid;
  gap: 16px;
  padding: 22px;
  background: linear-gradient(145deg, #ffffff, #f1fcff);
}

.advice-panel div {
  gap: 10px;
}

.advice-panel div > .el-icon {
  color: #397bf6;
  font-size: 24px;
}

.advice-panel p {
  margin: 0;
  color: #657185;
  line-height: 1.7;
}

.advice-actions {
  flex-wrap: wrap;
  gap: 8px;
}

.advice-actions button {
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid #d7e4f4;
  border-radius: 999px;
  background: #ffffff;
  color: #397bf6;
  font-weight: 900;
}

@media (max-width: 1240px) {
  .fenbi-nav-inner,
  .fenbi-main {
    width: min(100vw - 32px, 980px);
  }

  .fenbi-nav-inner {
    grid-template-columns: 190px minmax(0, 1fr) 52px;
  }

  .coach-grid,
  .study-head {
    grid-template-columns: 1fr;
  }

  .right-rail {
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
  }

  .advice-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 820px) {
  .fenbi-nav {
    height: 60px;
  }

  .fenbi-nav-inner {
    grid-template-columns: 1fr 42px;
    gap: 10px;
    min-height: 60px;
  }

  .fenbi-brand strong {
    font-size: 17px;
  }

  .fenbi-main {
    padding-top: 18px;
  }

  .study-head,
  .head-tools,
  .entry-grid,
  .focus-grid,
  .right-rail,
  .ability-content {
    grid-template-columns: 1fr;
  }

  .head-tools {
    justify-content: stretch;
  }

  .search-box {
    width: 100%;
    min-height: 40px;
  }

  .paper-list button {
    grid-template-columns: 58px minmax(0, 1fr);
    padding: 12px 0;
  }

  .paper-list small,
  .paper-list em {
    grid-column: 2;
  }
}

@media (max-width: 560px) {
  .fenbi-nav-inner,
  .fenbi-main {
    width: min(100vw - 20px, 520px);
  }

  .title-row h1 {
    font-size: 24px;
  }

  .type-tabs button {
    flex: 1;
    min-width: 0;
    font-size: 15px;
    min-height: 36px;
    padding: 0 10px;
  }

  .study-head {
    gap: 14px;
    margin-bottom: 14px;
  }

  .title-cluster {
    gap: 14px;
  }

  .entry-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .entry-tile {
    min-height: 84px;
    padding: 14px 10px;
    border-radius: 8px;
  }

  .entry-tile span {
    font-size: 16px;
  }

  .entry-tile small {
    overflow: hidden;
    margin-top: 4px;
    font-size: 11px;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entry-tile .el-icon {
    right: 8px;
    bottom: 8px;
    font-size: 30px;
    opacity: 0.48;
  }

  .focus-card {
    min-height: 0;
    padding: 16px;
  }

  .focus-card h2 {
    font-size: 19px;
    white-space: normal;
  }

  .panel-title h2,
  .side-title h2,
  .advice-panel h2 {
    font-size: 21px;
  }

  .panel-title,
  .side-title {
    align-items: center;
  }

  .practice-hub,
  .paper-panel,
  .ability-panel,
  .history-panel,
  .score-panel,
  .advice-panel {
    border-radius: 8px;
  }

  .practice-hub,
  .paper-panel,
  .ability-panel {
    padding: 14px;
  }

  .history-list button {
    grid-template-columns: minmax(0, 1fr);
    padding: 14px 0;
  }

  .history-list em {
    justify-self: start;
  }

  .score-panel {
    padding: 14px 18px;
  }

  .score-row {
    min-height: 44px;
  }

  .paper-list button {
    gap: 8px 10px;
  }

  .paper-list strong {
    font-size: 15px;
    white-space: normal;
  }

  .paper-type {
    padding: 5px 8px;
  }
}
</style>
