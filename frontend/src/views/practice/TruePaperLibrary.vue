<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Clock, DataAnalysis, Files, Search, Star, User } from '@element-plus/icons-vue'
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
import { useUserStore } from '../../store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

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

function enterPaper() {
  if (selectedPaper.value) router.push(`/practice/${selectedPaper.value.id}`)
}
</script>

<template>
  <main class="library-page">
    <header class="library-topbar">
      <router-link to="/coach" class="brand">
        <span>PQ</span>
        <strong>PolicyQuest</strong>
        <small>AI 公考学习引擎</small>
      </router-link>

      <label class="global-search">
        <el-icon><Search /></el-icon>
        <input v-model="keyword" placeholder="搜索真题、地区、岗位、关键词" />
      </label>

      <div class="top-actions">
        <router-link to="/report"><el-icon><DataAnalysis /></el-icon> 个人报告</router-link>
        <span class="avatar"><el-icon><User /></el-icon> {{ userStore.user?.nickname || userStore.user?.username || '同学' }}</span>
      </div>
    </header>

    <section class="library-layout">
      <aside class="filter-rail">
        <div class="filter-block">
          <h2>考试类型</h2>
          <button
            v-for="item in typeOptions"
            :key="item.value"
            type="button"
            class="type-option"
            :class="{ active: selectedType === item.value }"
            @click="chooseType(item.value)"
          >
            <span>{{ item.label }}</span>
            <small>{{ item.desc }}</small>
          </button>
        </div>

        <div class="filter-block">
          <h2>考试系统</h2>
          <button
            v-for="item in examSystems"
            :key="item.value"
            type="button"
            class="filter-option"
            :class="{ active: selectedSystem === item.value }"
            @click="selectedSystem = item.value"
          >
            <span>{{ item.label }}</span>
            <small>{{ item.count }}</small>
          </button>
        </div>

        <div class="filter-block">
          <h2>年份</h2>
          <button type="button" class="filter-option" :class="{ active: selectedYear === 'all' }" @click="selectedYear = 'all'">
            <span>全部年份</span>
            <small>All</small>
          </button>
          <button
            v-for="year in years"
            :key="year"
            type="button"
            class="filter-option"
            :class="{ active: selectedYear === year }"
            @click="selectedYear = year"
          >
            <span>{{ year }}</span>
            <small>{{ year === 2026 ? '最新' : '历年' }}</small>
          </button>
        </div>
      </aside>

      <section class="paper-list-panel">
        <div class="list-head">
          <div>
            <p class="page-kicker">True Paper Navigator</p>
            <h1>真题列表</h1>
          </div>
          <span>最新发布</span>
        </div>

        <div v-if="filteredPapers.length" class="timeline-list">
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
              <span class="status-pill">{{ paper.year === 2026 ? '新' : paper.year === 2025 ? '热' : '历年' }}</span>
              <h2>{{ paper.title }}</h2>
              <p>发布时间：{{ paper.releaseDate }}  |  试卷代码：{{ paper.paperCode }}</p>
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
          <p>换一个考试系统、年份或关键词试试。</p>
        </div>
      </section>

      <aside v-if="selectedPaper" class="paper-preview">
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
          <h3>AI 智能诊断</h3>
          <div class="diagnosis-body">
            <AbilityRadar :items="previewRadarItems" :height="160" />
            <div>
              <strong>你的薄弱维度</strong>
              <p v-for="item in selectedPaper.weakDimensions" :key="item">{{ item }}：需要专项强化</p>
            </div>
          </div>
          <button type="button" @click="enterPaper">去练习 <el-icon><ArrowRight /></el-icon></button>
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
  min-height: 100vh;
  background: #f7fbff;
}

.library-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 260px minmax(320px, 520px) minmax(240px, auto);
  align-items: center;
  gap: 28px;
  min-height: 78px;
  padding: 0 32px;
  background: #061c40;
  color: #ffffff;
}

.brand {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  column-gap: 10px;
  align-items: center;
  color: #ffffff;
}

.brand span {
  display: grid;
  grid-row: span 2;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #0b66ff, #00b8d9);
  font-weight: 900;
}

.brand small {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
}

.global-search {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
}

.global-search input {
  border: 0;
  outline: none;
  background: transparent;
  color: #ffffff;
}

.global-search input::placeholder {
  color: rgba(255, 255, 255, 0.58);
}

.top-actions {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 16px;
}

.top-actions a,
.avatar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  color: #ffffff;
  font-weight: 900;
}

.top-actions a {
  border: 1px solid rgba(0, 213, 255, 0.54);
  background: rgba(0, 184, 217, 0.12);
}

.library-layout {
  display: grid;
  grid-template-columns: 312px minmax(0, 1fr) 430px;
  min-height: calc(100vh - 78px);
}

.filter-rail {
  padding: 30px;
  border-right: 1px solid #dce5f4;
  background: #fbfdff;
}

.filter-block + .filter-block {
  margin-top: 28px;
}

.filter-block h2 {
  margin: 0 0 14px;
  color: #07182f;
  font-size: 17px;
}

.type-option,
.filter-option {
  width: 100%;
  border: 1px solid #d9e3f2;
  border-radius: 10px;
  background: #ffffff;
  text-align: left;
}

.type-option {
  display: grid;
  gap: 4px;
  min-height: 70px;
  padding: 14px;
}

.type-option + .type-option,
.filter-option + .filter-option {
  margin-top: 10px;
}

.type-option span,
.filter-option span {
  color: #16233a;
  font-weight: 900;
}

.type-option small,
.filter-option small {
  color: var(--text-muted);
  font-weight: 800;
}

.type-option.active,
.filter-option.active {
  border-color: #0b66ff;
  background: #eaf3ff;
}

.filter-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 12px;
}

.paper-list-panel {
  padding: 34px 32px;
  background: #ffffff;
}

.list-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
}

.list-head h1 {
  margin: 0;
  color: #07182f;
  font-size: 24px;
}

.list-head > span {
  color: var(--text-secondary);
  font-weight: 900;
}

.timeline-list {
  display: grid;
  margin-top: 24px;
}

.paper-row {
  position: relative;
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 126px;
  gap: 18px;
  min-height: 148px;
  padding: 20px 0;
  border: 0;
  border-bottom: 1px solid #e5ebf5;
  background: transparent;
  text-align: left;
}

.paper-row.active {
  padding: 20px;
  border: 1px solid #0b66ff;
  border-radius: 10px;
  background: #f1f7ff;
}

.paper-row > i {
  position: relative;
  width: 12px;
  height: 12px;
  margin-top: 38px;
  border: 3px solid #0b66ff;
  border-radius: 999px;
}

.paper-row > i.interview {
  border-color: #00a4c7;
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

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  background: #e4f9ef;
  color: #08766c;
  font-size: 12px;
  font-weight: 900;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tag-row span {
  padding: 6px 10px;
  border-radius: 8px;
  background: #edf3fb;
  color: #445168;
  font-size: 12px;
  font-weight: 800;
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
  display: grid;
  align-content: start;
  gap: 18px;
  padding: 32px;
  border-left: 1px solid #dce5f4;
  background: #fbfdff;
}

.preview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-head span {
  padding: 7px 10px;
  border-radius: 8px;
  background: #dff0ff;
  color: #0758d8;
  font-size: 12px;
  font-weight: 900;
}

.preview-head button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #65758d;
  font-size: 21px;
}

.paper-preview h2 {
  margin: 0;
  color: #07182f;
  font-size: 26px;
  line-height: 1.3;
}

.preview-tags,
.preview-metrics,
.record-summary {
  display: grid;
  gap: 10px;
}

.preview-tags {
  grid-template-columns: repeat(3, minmax(0, auto));
  justify-content: start;
}

.preview-tags span {
  padding: 7px 10px;
  border-radius: 8px;
  background: #edf3fb;
  color: #405069;
  font-size: 12px;
  font-weight: 900;
}

.preview-metrics {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 18px 0;
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

.subhead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.subhead h3,
.ai-diagnosis h3 {
  margin: 0;
  color: #07182f;
}

.subhead button {
  border: 0;
  background: transparent;
  color: #0758d8;
  font-weight: 900;
}

.material-preview,
.ai-diagnosis {
  padding: 18px;
  border: 1px solid #d9e6f7;
  border-radius: 12px;
  background: #ffffff;
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
  color: #0758d8;
}

.material-preview span,
.material-preview small {
  color: var(--text-secondary);
  font-size: 13px;
}

.ai-diagnosis {
  display: grid;
  gap: 14px;
  background: linear-gradient(145deg, #ffffff, #f0fbff);
}

.diagnosis-body {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
}

.diagnosis-body p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.ai-diagnosis button,
.enter-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  border: 0;
  border-radius: 10px;
  font-weight: 900;
}

.ai-diagnosis button {
  justify-self: start;
  padding: 0 16px;
  background: #e6efff;
  color: #0758d8;
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
  width: 100%;
  min-height: 52px;
  background: var(--gradient-1);
  color: #ffffff;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 320px;
  color: var(--text-secondary);
}

.empty-state h2,
.empty-state p {
  margin: 0;
}

@media (max-width: 1180px) {
  .library-topbar {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .top-actions {
    display: none;
  }

  .library-layout {
    grid-template-columns: 260px minmax(0, 1fr);
  }

  .paper-preview {
    grid-column: 1 / -1;
    border-top: 1px solid #dce5f4;
    border-left: 0;
  }
}

@media (max-width: 820px) {
  .library-topbar,
  .library-layout {
    grid-template-columns: 1fr;
  }

  .library-topbar {
    gap: 14px;
    padding: 16px;
  }

  .filter-rail {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px;
  }

  .paper-list-panel,
  .paper-preview {
    padding: 22px 16px;
  }

  .paper-row,
  .paper-row.active {
    grid-template-columns: 18px minmax(0, 1fr);
    padding: 18px 0;
    border-right: 0;
    border-left: 0;
  }

  .paper-row aside {
    grid-column: 2;
  }

  .preview-metrics,
  .record-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .material-preview article {
    grid-template-columns: 1fr;
    padding: 10px 0;
  }

  .diagnosis-body {
    grid-template-columns: 1fr;
  }
}
</style>
