<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Clock, DataAnalysis, Files, Search, Star } from '@element-plus/icons-vue'
import AbilityRadar from '../../components/AbilityRadar.vue'
import {
  essayDimensions,
  examSystems,
  interviewDimensions,
  readPracticeRecords,
  realPapers,
  years,
  type PracticeType,
} from '../../data/policyQuest'

const route = useRoute()
const router = useRouter()

const selectedType = ref<PracticeType>(route.query.type === 'interview' ? 'interview' : 'essay')
const selectedSystem = ref('all')
const selectedYear = ref<number | 'all'>('all')
const keyword = ref('')
const selectedPaperId = ref('')
const records = ref(readPracticeRecords())

const typeOptions = [
  { value: 'essay' as PracticeType, label: '申论', desc: '材料分析与写作' },
  { value: 'interview' as PracticeType, label: '面试', desc: '结构化 / 半结构化' },
]

const filteredPapers = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return realPapers.filter(paper => {
    const typeMatch = paper.type === selectedType.value
    const systemMatch = selectedSystem.value === 'all' || paper.system === selectedSystem.value
    const yearMatch = selectedYear.value === 'all' || paper.year === selectedYear.value
    const queryMatch =
      !query ||
      [paper.title, paper.region, paper.systemLabel, paper.category, paper.tags.join(' ')].join(' ').toLowerCase().includes(query)
    return typeMatch && systemMatch && yearMatch && queryMatch
  })
})

const selectedPaper = computed(() => filteredPapers.value.find(paper => paper.id === selectedPaperId.value) || filteredPapers.value[0])
const selectedRecords = computed(() => records.value.filter(record => record.paperId === selectedPaper.value?.id))
const selectedAverage = computed(() => {
  if (!selectedRecords.value.length) return 72.5
  return Math.round(selectedRecords.value.reduce((sum, record) => sum + record.score, 0) / selectedRecords.value.length)
})
const previewRadarItems = computed(() => {
  const paper = selectedPaper.value
  const names = paper?.type === 'interview' ? interviewDimensions : essayDimensions
  return names.map((name, index) => ({
    name,
    score: paper?.weakDimensions.includes(name) ? 56 + index * 2 : 70 + index * 2,
  }))
})

watch(
  () => route.query.type,
  value => {
    if (value === 'essay' || value === 'interview') chooseType(value)
  },
)

watch(
  filteredPapers,
  papers => {
    if (!papers.length) {
      selectedPaperId.value = ''
      return
    }
    if (!papers.some(paper => paper.id === selectedPaperId.value)) selectedPaperId.value = papers[0].id
  },
  { immediate: true },
)

function chooseType(type: PracticeType) {
  selectedType.value = type
  selectedSystem.value = 'all'
  selectedYear.value = 'all'
}

function chooseTypeAndSync(type: PracticeType) {
  chooseType(type)
  router.replace({ path: '/papers', query: { type } })
}

function enterPaper() {
  if (selectedPaper.value) router.push(`/practice/${selectedPaper.value.id}`)
}
</script>

<template>
  <main class="library-page page-container">
    <section class="library-hero">
      <div>
        <p class="page-kicker">True Paper Navigator</p>
        <h1 class="page-title">真题库</h1>
        <p class="page-subtitle">申论和面试共用同一套题库导航，筛选后直接进入统一练习工作台。</p>
      </div>
      <label class="hero-search">
        <el-icon><Search /></el-icon>
        <input v-model="keyword" placeholder="搜索真题、地区、岗位、关键词" />
      </label>
    </section>

    <section class="filter-bar surface-card">
      <div class="filter-group type-group">
        <span>考试类型</span>
        <button
          v-for="item in typeOptions"
          :key="item.value"
          type="button"
          :class="{ active: selectedType === item.value }"
          @click="chooseTypeAndSync(item.value)"
        >
          <strong>{{ item.label }}</strong>
          <small>{{ item.desc }}</small>
        </button>
      </div>

      <div class="filter-group chip-group">
        <span>考试系统</span>
        <button
          v-for="item in examSystems"
          :key="item.value"
          type="button"
          :class="{ active: selectedSystem === item.value }"
          @click="selectedSystem = item.value"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="filter-group chip-group">
        <span>年份</span>
        <button type="button" :class="{ active: selectedYear === 'all' }" @click="selectedYear = 'all'">全部年份</button>
        <button
          v-for="year in years"
          :key="year"
          type="button"
          :class="{ active: selectedYear === year }"
          @click="selectedYear = year"
        >
          {{ year }}
        </button>
      </div>
    </section>

    <section class="library-layout">
      <section class="paper-list-panel surface-card">
        <div class="list-head">
          <div>
            <p class="page-kicker">{{ selectedType === 'essay' ? 'Essay Practice' : 'Interview Practice' }}</p>
            <h2>{{ selectedType === 'essay' ? '申论真题' : '面试真题' }}</h2>
          </div>
          <span>{{ filteredPapers.length }} 套</span>
        </div>

        <div v-if="filteredPapers.length" class="paper-list">
          <button
            v-for="paper in filteredPapers"
            :key="paper.id"
            type="button"
            class="paper-row"
            :class="{ active: selectedPaperId === paper.id }"
            @click="selectedPaperId = paper.id"
          >
            <i :class="paper.type"></i>
            <div>
              <span class="status-pill">{{ paper.year === 2026 ? '最新' : paper.year === 2025 ? '热门' : '历年' }}</span>
              <h2>{{ paper.title }}</h2>
              <p>发布时间：{{ paper.releaseDate }} · 试卷代码：{{ paper.paperCode }}</p>
              <div class="tag-row">
                <span>{{ paper.type === 'essay' ? '申论' : '面试' }}</span>
                <span>{{ paper.systemLabel }}</span>
                <span>{{ paper.category }}</span>
              </div>
            </div>
            <aside>
              <span><el-icon><Clock /></el-icon> {{ paper.suggestedMinutes }} 分钟</span>
              <span><el-icon><Files /></el-icon> {{ paper.questionCount }} 题</span>
            </aside>
          </button>
        </div>

        <div v-else class="empty-state">
          <h2>没有找到匹配真题</h2>
          <p>换一个考试系统、年份或关键词再试试。</p>
        </div>
      </section>

      <aside v-if="selectedPaper" class="paper-preview surface-card">
        <div class="preview-head">
          <span>当前选中</span>
          <button type="button" aria-label="收藏"><el-icon><Star /></el-icon></button>
        </div>

        <h2>{{ selectedPaper.title }}</h2>
        <div class="preview-tags">
          <span>{{ selectedPaper.type === 'essay' ? '申论' : '面试' }}</span>
          <span>{{ selectedPaper.systemLabel }}</span>
          <span>{{ selectedPaper.category }}</span>
        </div>

        <div class="preview-metrics">
          <div><strong>{{ selectedPaper.suggestedMinutes }}</strong><span>建议用时</span></div>
          <div><strong>{{ selectedPaper.questionCount }}</strong><span>题目数量</span></div>
          <div><strong>{{ selectedPaper.difficulty }}</strong><span>难度</span></div>
          <div><strong>{{ selectedPaper.releaseDate }}</strong><span>发布时间</span></div>
        </div>

        <section class="material-preview">
          <div class="subhead">
            <h3>{{ selectedPaper.type === 'essay' ? '材料概览' : '题目背景' }}</h3>
            <button type="button" @click="enterPaper">查看全文</button>
          </div>
          <article v-for="material in selectedPaper.materials" :key="material.id">
            <strong>{{ material.title }}</strong>
            <span>{{ material.summary }}</span>
            <small>约 {{ material.wordCount }} 字</small>
          </article>
        </section>

        <section class="ai-diagnosis">
          <h3><el-icon><DataAnalysis /></el-icon> AI 练前诊断</h3>
          <div class="diagnosis-body">
            <AbilityRadar :items="previewRadarItems" :height="180" />
            <div>
              <strong>建议关注维度</strong>
              <p v-for="item in selectedPaper.weakDimensions" :key="item">{{ item }}：需要专项强化</p>
            </div>
          </div>
        </section>

        <div class="record-summary">
          <div><strong>{{ selectedRecords.length || 2 }}</strong><span>已练次数</span></div>
          <div><strong>{{ selectedAverage }}</strong><span>平均分</span></div>
          <div><strong>{{ selectedRecords[0] ? Math.round(selectedRecords[0].durationSeconds / 60) : 163 }}</strong><span>最近用时</span></div>
        </div>

        <button class="enter-button" type="button" @click="enterPaper">
          进入真题 <el-icon><ArrowRight /></el-icon>
        </button>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.library-page {
  display: grid;
  gap: 18px;
}

.library-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 420px);
  gap: 20px;
  align-items: end;
  padding: 26px;
  border: 1px solid rgba(196, 211, 238, 0.82);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
}

.hero-search {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fbfcff;
  color: var(--text-muted);
}

.hero-search input {
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
}

.filter-bar {
  display: grid;
  gap: 16px;
  padding: 18px;
  border-radius: 16px;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.filter-group > span {
  min-width: 68px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 900;
}

.type-group button,
.chip-group button {
  border: 1px solid var(--border);
  background: #ffffff;
  color: var(--text-secondary);
  font-weight: 900;
}

.type-group button {
  display: grid;
  gap: 2px;
  min-width: 136px;
  min-height: 58px;
  padding: 10px 14px;
  border-radius: 12px;
  text-align: left;
}

.type-group small {
  color: var(--text-muted);
  font-size: 12px;
}

.chip-group button {
  min-height: 36px;
  padding: 0 13px;
  border-radius: 999px;
  font-size: 12px;
}

.type-group button.active,
.chip-group button.active {
  border-color: rgba(0, 80, 203, 0.28);
  background: #eaf3ff;
  color: var(--primary);
}

.library-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 18px;
  align-items: start;
}

.paper-list-panel,
.paper-preview {
  padding: 22px;
  border-radius: 16px;
}

.list-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  margin-bottom: 14px;
}

.list-head h2 {
  margin: 0;
  color: #07182f;
  font-size: 24px;
}

.list-head > span {
  color: var(--primary);
  font-weight: 900;
}

.paper-list {
  display: grid;
}

.paper-row {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 126px;
  gap: 16px;
  min-height: 142px;
  padding: 18px 0;
  border: 0;
  border-bottom: 1px solid #e5ebf5;
  background: transparent;
  text-align: left;
}

.paper-row.active {
  margin: 6px 0;
  padding: 18px;
  border: 1px solid rgba(0, 80, 203, 0.28);
  border-radius: 14px;
  background: #f1f7ff;
}

.paper-row > i {
  width: 12px;
  height: 12px;
  margin-top: 38px;
  border: 3px solid var(--primary);
  border-radius: 999px;
}

.paper-row > i.interview {
  border-color: #00a4c7;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--success-soft);
  color: var(--success);
  font-size: 12px;
  font-weight: 900;
}

.paper-row h2 {
  margin: 10px 0 8px;
  color: #07182f;
  font-size: 21px;
}

.paper-row p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.5;
}

.tag-row,
.preview-tags,
.preview-metrics,
.record-summary {
  display: grid;
  gap: 10px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
}

.tag-row span,
.preview-tags span {
  padding: 6px 10px;
  border-radius: 8px;
  background: #edf3fb;
  color: #405069;
  font-size: 12px;
  font-weight: 900;
}

.paper-row aside {
  display: grid;
  gap: 10px;
  align-content: center;
  color: var(--text-secondary);
  font-weight: 800;
}

.paper-row aside span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.paper-preview {
  position: sticky;
  top: 88px;
  display: grid;
  gap: 18px;
}

.preview-head,
.subhead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.preview-head span {
  padding: 7px 10px;
  border-radius: 999px;
  background: #dff0ff;
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.preview-head button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: #f1f7ff;
  color: #65758d;
  font-size: 19px;
}

.paper-preview h2 {
  margin: 0;
  color: #07182f;
  font-size: 25px;
  line-height: 1.3;
}

.preview-tags {
  grid-template-columns: repeat(3, minmax(0, auto));
  justify-content: start;
}

.preview-metrics {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 16px 0;
  border-top: 1px solid #e5ebf5;
  border-bottom: 1px solid #e5ebf5;
}

.preview-metrics div,
.record-summary div {
  display: grid;
  gap: 5px;
}

.preview-metrics strong,
.record-summary strong {
  color: #07182f;
  font-size: 20px;
}

.preview-metrics span,
.record-summary span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.material-preview,
.ai-diagnosis {
  padding: 16px;
  border: 1px solid #d9e6f7;
  border-radius: 12px;
  background: #ffffff;
}

.subhead h3,
.ai-diagnosis h3 {
  margin: 0;
  color: #07182f;
}

.subhead button {
  border: 0;
  background: transparent;
  color: var(--primary);
  font-weight: 900;
}

.material-preview article {
  display: grid;
  grid-template-columns: 66px minmax(0, 1fr) 72px;
  gap: 10px;
  min-height: 42px;
  align-items: center;
  border-top: 1px solid #edf1f8;
}

.material-preview article:first-of-type {
  border-top: 0;
}

.material-preview strong {
  color: var(--primary);
}

.material-preview span,
.material-preview small,
.diagnosis-body p {
  color: var(--text-secondary);
  font-size: 13px;
}

.ai-diagnosis {
  display: grid;
  gap: 14px;
  background: linear-gradient(145deg, #ffffff, #f0fbff);
}

.ai-diagnosis h3 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diagnosis-body {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
}

.diagnosis-body p {
  margin: 6px 0 0;
}

.record-summary {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.record-summary div {
  min-height: 74px;
  padding: 14px;
  border: 1px solid #e2eaf6;
  border-radius: 10px;
  background: #ffffff;
}

.enter-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 50px;
  border: 0;
  border-radius: 12px;
  background: var(--gradient-1);
  color: #ffffff;
  font-weight: 900;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 300px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-state h2,
.empty-state p {
  margin: 0;
}

@media (max-width: 1180px) {
  .library-layout {
    grid-template-columns: 1fr;
  }

  .paper-preview {
    position: static;
  }
}

@media (max-width: 760px) {
  .library-hero,
  .paper-row,
  .paper-row.active {
    grid-template-columns: 1fr;
  }

  .paper-row > i {
    display: none;
  }

  .paper-row aside {
    display: flex;
    flex-wrap: wrap;
  }

  .preview-metrics,
  .record-summary,
  .diagnosis-body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .library-hero,
  .paper-list-panel,
  .paper-preview {
    padding: 18px;
  }

  .material-preview article,
  .diagnosis-body {
    grid-template-columns: 1fr;
    padding: 10px 0;
  }
}
</style>
