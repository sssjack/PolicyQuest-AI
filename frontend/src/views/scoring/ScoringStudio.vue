<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Collection,
  EditPen,
  MagicStick,
  Search,
  Timer,
} from '@element-plus/icons-vue'
import AbilityRadar from '../../components/AbilityRadar.vue'
import {
  aggregateDimensions,
  averageScore,
  readPracticeRecords,
  realPapers,
  type PracticeRecord,
  type PracticeType,
} from '../../data/policyQuest'
import { useUserStore } from '../../store/user'

const router = useRouter()
const userStore = useUserStore()
const records = ref<PracticeRecord[]>([])
const searchText = ref('')

const currentUserName = computed(() => userStore.user?.nickname || userStore.user?.username || '同学')
const essayPaper = computed(() => realPapers.find(paper => paper.type === 'essay'))
const interviewPaper = computed(() => realPapers.find(paper => paper.type === 'interview'))
const recentPapers = computed(() => realPapers.slice(0, 5))
const average = computed(() => averageScore(records.value) || 71)
const totalPracticeTime = computed(() => records.value.reduce((sum, record) => sum + record.durationSeconds, 0))
const practicedCount = computed(() => records.value.length)
const dimensions = computed(() => aggregateDimensions(records.value).slice(0, 5))
const weakest = computed(() => [...dimensions.value].sort((a, b) => a.score - b.score)[0])

const prediction = computed(() => ({
  essay: Math.max(62, average.value + 1),
  interview: Math.max(60, average.value - 3),
}))

const quickStats = computed(() => [
  { label: '本周训练时长', value: `${Math.max(6.8, Math.round(totalPracticeTime.value / 360) / 10)} 小时`, tone: 'blue' },
  { label: '已提交作答', value: `${practicedCount.value || 3} 次`, tone: 'cyan' },
  { label: '平均得分', value: `${average.value || 71} 分`, tone: 'green' },
])

const weakBars = computed(() => [
  { label: '申论：综合分析', value: 48 },
  { label: '申论：提出对策', value: weakest.value?.score || 52 },
  { label: '面试：应急应变', value: 54 },
])

onMounted(() => {
  records.value = readPracticeRecords()
})

function openLibrary(type?: PracticeType) {
  router.push(type ? `/papers?type=${type}` : '/papers')
}

function startPaper(type: PracticeType) {
  const paper = type === 'essay' ? essayPaper.value : interviewPaper.value
  router.push(paper ? `/practice/${paper.id}` : `/papers?type=${type}`)
}
</script>

<template>
  <div class="coach-page page-container">
    <section class="command-hero">
      <div class="hero-copy">
        <p class="page-kicker">AI 学习指挥舱</p>
        <h1>晚上好，{{ currentUserName }}</h1>
        <p>今天建议先完成一套申论限时真题，再复盘“提出对策”和“贯彻执行”两项薄弱维度。</p>
        <div class="hero-actions">
          <button class="btn-primary" type="button" @click="startPaper('essay')">
            开始今日训练 <el-icon><ArrowRight /></el-icon>
          </button>
          <button class="btn-ghost" type="button" @click="router.push('/report')">查看我的报告</button>
        </div>
      </div>

      <aside class="hero-panel">
        <span>今日建议强度</span>
        <strong>45 分钟</strong>
        <p>优先补齐申论对策表达，再进入面试应变题回练。</p>
      </aside>
    </section>

    <section class="quick-grid">
      <article v-for="item in quickStats" :key="item.label" :class="item.tone">
        <el-icon><Timer /></el-icon>
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
      <article class="prediction-card">
        <span>预测分数</span>
        <div>
          <strong>{{ prediction.essay }}</strong>
          <small>申论</small>
        </div>
        <div>
          <strong>{{ prediction.interview }}</strong>
          <small>面试</small>
        </div>
      </article>
    </section>

    <section class="track-grid">
      <article class="track-card essay">
        <div class="track-copy">
          <span><el-icon><EditPen /></el-icon> 申论训练</span>
          <h2>材料分析、提炼要点、规范表达</h2>
          <p>适合围绕提出对策、贯彻执行和文章写作持续提分。</p>
        </div>
        <div class="recommended-paper">
          <span>今日推荐真题</span>
          <strong>{{ essayPaper?.title }}</strong>
          <small>{{ essayPaper?.questionCount }} 题 · 建议 {{ essayPaper?.suggestedMinutes }} 分钟 · {{ essayPaper?.systemLabel }}</small>
        </div>
        <button class="track-cta" type="button" @click="startPaper('essay')">
          开始申论真题 <el-icon><ArrowRight /></el-icon>
        </button>
      </article>

      <article class="track-card interview">
        <div class="track-copy">
          <span><el-icon><Collection /></el-icon> 面试训练</span>
          <h2>结构表达、岗位匹配、临场应变</h2>
          <p>适合用结构化真题训练审题、层次和交流感。</p>
        </div>
        <div class="recommended-paper">
          <span>今日推荐真题</span>
          <strong>{{ interviewPaper?.title }}</strong>
          <small>{{ interviewPaper?.questionCount }} 题 · {{ interviewPaper?.category }} · 建议单题 7 分钟</small>
        </div>
        <button class="track-cta cyan" type="button" @click="startPaper('interview')">
          开始面试真题 <el-icon><ArrowRight /></el-icon>
        </button>
      </article>
    </section>

    <section class="dashboard-grid">
      <div class="main-column">
        <section class="paper-speed surface-card">
          <div class="section-heading">
            <div>
              <p class="page-kicker">True Paper</p>
              <h2>真题速选</h2>
            </div>
            <label class="inline-search">
              <el-icon><Search /></el-icon>
              <input v-model="searchText" placeholder="搜索真题、地区、岗位" />
            </label>
          </div>

          <div class="paper-table">
            <button v-for="paper in recentPapers" :key="paper.id" type="button" @click="router.push(`/practice/${paper.id}`)">
              <span class="paper-type" :class="paper.type">{{ paper.type === 'essay' ? '申论' : '面试' }}</span>
              <strong>{{ paper.title }}</strong>
              <small>{{ paper.questionCount }} 题 · {{ paper.suggestedMinutes }} 分钟 · {{ paper.releaseDate }}</small>
              <em>开始练习</em>
            </button>
          </div>
        </section>

        <section class="progress-panel surface-card">
          <div class="section-heading compact">
            <div>
              <p class="page-kicker">Ability Map</p>
              <h2>能力概览</h2>
            </div>
            <button type="button" @click="router.push('/report')">完整报告 <el-icon><ArrowRight /></el-icon></button>
          </div>
          <div class="progress-content">
            <AbilityRadar :items="dimensions" :height="220" />
            <div class="weak-list">
              <div v-for="item in weakBars" :key="item.label" class="weak-row">
                <div>
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}%</strong>
                </div>
                <i><b :style="{ width: `${item.value}%` }"></b></i>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside class="ai-panel surface-card">
        <div class="panel-head">
          <el-icon><MagicStick /></el-icon>
          <h2>AI 学习建议</h2>
        </div>
        <section>
          <span>今日策略</span>
          <p>优先完成申论大作文专项练习，并复盘面试应急应变类题目。</p>
        </section>
        <section>
          <span>为什么这样安排</span>
          <p>最近的薄弱项集中在“对策具体性”和“执行抓手”，需要用一套限时真题建立真实样本。</p>
        </section>
        <div class="next-actions">
          <button type="button" @click="startPaper('essay')">申论专项训练</button>
          <button type="button" @click="openLibrary('interview')">面试题库</button>
          <button type="button" @click="router.push('/report')">查看个人报告</button>
        </div>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.coach-page {
  display: grid;
  gap: 22px;
}

.command-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 22px;
  align-items: stretch;
}

.hero-copy,
.hero-panel,
.quick-grid article,
.track-card,
.paper-speed,
.progress-panel,
.ai-panel {
  border: 1px solid rgba(196, 211, 238, 0.82);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
}

.hero-copy {
  padding: 28px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(239, 247, 255, 0.92)),
    #ffffff;
}

.hero-copy h1 {
  margin: 0;
  color: #07182f;
  font-size: 36px;
  line-height: 1.18;
}

.hero-copy p:last-of-type {
  max-width: 760px;
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.72;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.hero-panel {
  display: grid;
  align-content: center;
  gap: 10px;
  padding: 24px;
  border-radius: 18px;
  background: linear-gradient(145deg, #003b88, #0050cb 58%, #008faf);
  color: #ffffff;
}

.hero-panel span,
.hero-panel p {
  color: rgba(255, 255, 255, 0.78);
  font-size: 13px;
  font-weight: 900;
}

.hero-panel strong {
  font-size: 40px;
  line-height: 1;
}

.hero-panel p {
  margin: 0;
  line-height: 1.6;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.quick-grid article {
  display: grid;
  gap: 8px;
  min-height: 134px;
  padding: 20px;
  border-radius: 16px;
}

.quick-grid .el-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 10px;
  background: #eaf3ff;
  color: var(--primary);
  font-size: 20px;
}

.quick-grid span,
.prediction-card small {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 900;
}

.quick-grid strong {
  color: #07182f;
  font-size: 28px;
}

.quick-grid .cyan strong,
.prediction-card div:last-child strong {
  color: #008faf;
}

.quick-grid .green strong {
  color: var(--success);
}

.prediction-card {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.prediction-card > span {
  grid-column: 1 / -1;
}

.prediction-card div {
  display: grid;
  gap: 2px;
}

.track-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.track-card {
  display: grid;
  gap: 18px;
  min-height: 330px;
  padding: 24px;
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(235, 244, 255, 0.94));
}

.track-card.interview {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(229, 251, 255, 0.94));
}

.track-copy span,
.recommended-paper span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 11px;
  border-radius: 999px;
  background: #e6efff;
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.interview .track-copy span {
  background: #dffbff;
  color: #007a8c;
}

.track-copy h2 {
  max-width: 430px;
  margin: 16px 0 8px;
  color: #07182f;
  font-size: 27px;
  line-height: 1.25;
}

.track-copy p,
.recommended-paper small {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.recommended-paper {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
}

.recommended-paper strong {
  color: #07182f;
  font-size: 20px;
}

.track-cta {
  align-self: end;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  border: 0;
  border-radius: 12px;
  background: var(--gradient-1);
  color: #ffffff;
  font-weight: 900;
}

.track-cta.cyan {
  background: linear-gradient(135deg, #008faf, #00b8d9);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
}

.main-column {
  display: grid;
  gap: 18px;
}

.paper-speed,
.progress-panel,
.ai-panel {
  padding: 20px;
  border-radius: 16px;
}

.section-heading,
.section-heading button,
.panel-head {
  display: flex;
  align-items: center;
}

.section-heading {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.section-heading h2,
.panel-head h2 {
  margin: 0;
  color: #07182f;
  font-size: 22px;
}

.section-heading.compact button {
  gap: 5px;
  border: 0;
  background: transparent;
  color: var(--primary);
  font-weight: 900;
}

.inline-search {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  width: min(320px, 42vw);
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fbfcff;
  color: var(--text-muted);
}

.inline-search input {
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
}

.paper-table {
  display: grid;
}

.paper-table button {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) minmax(190px, auto) 86px;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  border: 0;
  border-top: 1px solid #edf1f8;
  background: transparent;
  color: #17233b;
  text-align: left;
}

.paper-table button:first-child {
  border-top: 0;
}

.paper-type {
  justify-self: start;
  padding: 6px 10px;
  border-radius: 8px;
  background: #e6efff;
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.paper-type.interview {
  background: #dffbff;
  color: #007a8c;
}

.paper-table small {
  color: var(--text-muted);
}

.paper-table em {
  color: var(--primary);
  font-style: normal;
  font-weight: 900;
}

.progress-content {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(260px, 1fr);
  gap: 20px;
  align-items: center;
}

.weak-list {
  display: grid;
  gap: 16px;
}

.weak-row {
  display: grid;
  gap: 8px;
}

.weak-row div {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 900;
}

.weak-row i {
  display: block;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #e6efff;
}

.weak-row b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #d8294c, #00b8d9);
}

.ai-panel {
  display: grid;
  align-content: start;
  gap: 14px;
}

.panel-head {
  gap: 10px;
}

.panel-head .el-icon {
  color: var(--primary);
  font-size: 22px;
}

.ai-panel section,
.next-actions {
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid #e4ebf6;
  border-radius: 12px;
  background: #fbfdff;
}

.ai-panel section span {
  color: var(--primary);
  font-size: 13px;
  font-weight: 900;
}

.ai-panel p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.next-actions button {
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #ffffff;
  color: var(--primary);
  font-weight: 900;
}

@media (max-width: 1180px) {
  .quick-grid,
  .dashboard-grid,
  .progress-content {
    grid-template-columns: 1fr 1fr;
  }

  .ai-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 820px) {
  .command-hero,
  .quick-grid,
  .track-grid,
  .dashboard-grid,
  .progress-content {
    grid-template-columns: 1fr;
  }

  .inline-search {
    width: 100%;
  }

  .section-heading {
    display: grid;
  }

  .paper-table button {
    grid-template-columns: 58px minmax(0, 1fr);
    padding: 12px 0;
  }

  .paper-table small,
  .paper-table em {
    grid-column: 2;
  }
}

@media (max-width: 560px) {
  .hero-copy,
  .track-card {
    padding: 20px;
  }

  .hero-copy h1 {
    font-size: 29px;
  }

  .track-copy h2 {
    font-size: 23px;
  }
}
</style>
