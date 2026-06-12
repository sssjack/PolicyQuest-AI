<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Bell,
  Collection,
  EditPen,
  House,
  MagicStick,
  Reading,
  Search,
  SwitchButton,
  Timer,
  TrendCharts,
  User,
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

const currentUserName = computed(() => userStore.user?.nickname || userStore.user?.username || '张同学')
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

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <main class="coach-app">
    <aside class="sidebar">
      <router-link to="/coach" class="side-brand">
        <span>PQ</span>
        <strong>PolicyQuest</strong>
        <small>AI 公考学习平台</small>
      </router-link>

      <nav class="side-nav">
        <router-link to="/coach" class="active"><el-icon><House /></el-icon> 学习中心</router-link>
        <router-link to="/papers"><el-icon><Reading /></el-icon> 真题库</router-link>
        <router-link to="/report"><el-icon><TrendCharts /></el-icon> 我的报告</router-link>
        <button type="button" @click="openLibrary('essay')"><el-icon><EditPen /></el-icon> 申论训练</button>
        <button type="button" @click="openLibrary('interview')"><el-icon><Collection /></el-icon> 面试训练</button>
      </nav>

      <div class="study-mini">
        <span>学习时长（本周）</span>
        <strong>{{ quickStats[0].value }}</strong>
        <div class="bars">
          <i v-for="height in [28, 42, 64, 36, 52, 70, 44]" :key="height" :style="{ height: `${height}px` }"></i>
        </div>
      </div>
    </aside>

    <section class="coach-shell">
      <header class="topbar">
        <nav class="top-tabs">
          <router-link to="/coach" class="active">首页</router-link>
          <router-link to="/papers">真题库</router-link>
          <router-link to="/report">个人报告</router-link>
        </nav>

        <label class="search-box">
          <el-icon><Search /></el-icon>
          <input v-model="searchText" placeholder="搜索真题、地区、岗位、关键词" />
          <kbd>⌘ K</kbd>
        </label>

        <div class="top-actions">
          <button class="icon-button" type="button" aria-label="通知"><el-icon><Bell /></el-icon></button>
          <button class="profile-button" type="button" @click="logout">
            <el-icon><User /></el-icon>
            <span>{{ currentUserName }}</span>
            <el-icon><SwitchButton /></el-icon>
          </button>
        </div>
      </header>

      <div class="coach-content">
        <section class="hero-row">
          <div class="hero-title">
            <p class="page-kicker">AI 学习指挥舱</p>
            <h1>晚上好，{{ currentUserName }}</h1>
            <p>今天建议先完成一次申论真题限时练习，再复盘“提出对策”和“贯彻执行”两项弱维度。</p>
          </div>
          <div class="date-card">
            <span>今日建议强度</span>
            <strong>45 分钟</strong>
            <button type="button" @click="startPaper('essay')">开始执行</button>
          </div>
        </section>

        <section class="path-grid">
          <article class="track-card essay">
            <div class="track-copy">
              <span>申论</span>
              <h2>材料分析 · 提炼要点 · 规范表达</h2>
              <p>当前学习阶段：提分瓶颈期</p>
            </div>
            <div class="recommended-paper">
              <span>今日推荐真题</span>
              <strong>{{ essayPaper?.title }}</strong>
              <small>材料字数 3,300+ · {{ essayPaper?.questionCount }} 题 · 建议 {{ essayPaper?.suggestedMinutes }} 分钟</small>
            </div>
            <button class="track-cta" type="button" @click="startPaper('essay')">
              开始申论真题 <el-icon><ArrowRight /></el-icon>
            </button>
          </article>

          <article class="track-card interview">
            <div class="track-copy">
              <span>面试</span>
              <h2>逻辑表达 · 结构思维 · 临场应变</h2>
              <p>当前学习阶段：入门准备期</p>
            </div>
            <div class="recommended-paper">
              <span>今日推荐真题</span>
              <strong>{{ interviewPaper?.title }}</strong>
              <small>题量 {{ interviewPaper?.questionCount }} 题 · {{ interviewPaper?.category }} · 建议单题 7 分钟</small>
            </div>
            <button class="track-cta cyan" type="button" @click="startPaper('interview')">
              开始面试真题 <el-icon><ArrowRight /></el-icon>
            </button>
          </article>
        </section>

        <section class="dashboard-grid">
          <div class="main-column">
            <section class="paper-speed">
              <div class="section-heading">
                <h2>真题速递</h2>
                <button type="button" @click="openLibrary()">查看更多 <el-icon><ArrowRight /></el-icon></button>
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

            <section class="progress-strip">
              <article v-for="item in quickStats" :key="item.label" :class="item.tone">
                <el-icon><Timer /></el-icon>
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </article>
              <article class="radar-cell">
                <AbilityRadar :items="dimensions" :height="190" />
              </article>
            </section>
          </div>

          <aside class="ai-panel">
            <div class="panel-head">
              <el-icon><MagicStick /></el-icon>
              <h2>AI 学习建议</h2>
            </div>

            <section class="advice-box">
              <span>今日建议</span>
              <p>优先完成申论大作文专项练习，并复盘面试应急应变类题目。</p>
            </section>

            <section class="predict-box">
              <h3>预测分数</h3>
              <div class="score-rings">
                <div>
                  <strong>{{ prediction.essay }}</strong>
                  <span>申论预测分</span>
                </div>
                <div class="cyan">
                  <strong>{{ prediction.interview }}</strong>
                  <span>面试预测分</span>
                </div>
              </div>
            </section>

            <section class="weak-box">
              <h3>薄弱项</h3>
              <div v-for="item in weakBars" :key="item.label" class="weak-row">
                <div>
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}%</strong>
                </div>
                <i><b :style="{ width: `${item.value}%` }"></b></i>
              </div>
            </section>

            <section class="next-box">
              <h3>下一步</h3>
              <button type="button" @click="startPaper('essay')">申论大作文专项训练</button>
              <button type="button" @click="openLibrary('interview')">面试应急应变题库</button>
              <button type="button" @click="router.push('/report')">查看个人报告</button>
            </section>
          </aside>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
.coach-app {
  min-height: 100vh;
  background:
    linear-gradient(90deg, rgba(0, 184, 217, 0.05) 1px, transparent 1px),
    linear-gradient(180deg, #eff6ff 0%, #f8fbff 48%, #ffffff 100%);
  background-size: 42px 42px, auto;
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: 218px;
  padding: 22px 14px;
  background: linear-gradient(180deg, #061c40 0%, #003b88 52%, #0050cb 100%);
  color: #ffffff;
}

.side-brand {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  column-gap: 10px;
  align-items: center;
  color: #ffffff;
}

.side-brand span {
  display: grid;
  grid-row: span 2;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #0b66ff, #00b8d9);
  font-weight: 900;
}

.side-brand small {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
}

.side-nav {
  display: grid;
  align-content: start;
  gap: 8px;
  margin-top: 36px;
}

.side-nav a,
.side-nav button {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.76);
  font-weight: 900;
  text-align: left;
}

.side-nav a.active,
.side-nav a.router-link-active,
.side-nav button:hover {
  background: rgba(11, 102, 255, 0.42);
  color: #ffffff;
  box-shadow: inset 3px 0 0 #00d5ff;
}

.study-mini {
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
}

.study-mini span {
  color: rgba(255, 255, 255, 0.74);
  font-size: 12px;
  font-weight: 800;
}

.study-mini strong {
  font-size: 28px;
}

.bars {
  display: flex;
  align-items: end;
  gap: 8px;
  min-height: 72px;
}

.bars i {
  width: 9px;
  border-radius: 999px 999px 0 0;
  background: linear-gradient(180deg, #9eefff, rgba(255, 255, 255, 0.24));
}

.coach-shell {
  margin-left: 218px;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 24;
  display: grid;
  grid-template-columns: auto minmax(280px, 520px) auto;
  align-items: center;
  gap: 24px;
  min-height: 76px;
  padding: 0 30px;
  background: rgba(4, 23, 52, 0.96);
  color: #ffffff;
  backdrop-filter: blur(18px);
}

.top-tabs {
  display: flex;
  gap: 16px;
}

.top-tabs a {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 900;
}

.top-tabs a.active,
.top-tabs a.router-link-active {
  background: #0b66ff;
  color: #ffffff;
}

.search-box {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
}

.search-box input {
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #ffffff;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.54);
}

.search-box kbd {
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.top-actions {
  display: flex;
  justify-content: end;
  gap: 12px;
}

.icon-button,
.profile-button {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.icon-button {
  width: 42px;
  justify-content: center;
}

.profile-button {
  gap: 8px;
  padding: 0 12px;
  font-weight: 900;
}

.coach-content {
  width: min(1240px, calc(100vw - 266px));
  margin: 0 auto;
  padding: 30px 0 64px;
}

.hero-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.hero-title h1 {
  margin: 0;
  color: #07182f;
  font-size: 32px;
}

.hero-title p:last-child {
  margin: 10px 0 0;
  color: var(--text-secondary);
}

.date-card {
  display: grid;
  grid-template-columns: auto auto;
  gap: 6px 16px;
  min-width: 250px;
  padding: 18px;
  border: 1px solid #d9e6f7;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
}

.date-card span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 900;
}

.date-card strong {
  font-size: 28px;
}

.date-card button {
  grid-row: span 2;
  align-self: center;
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  background: #e5fbff;
  color: #006a75;
  font-weight: 900;
}

.path-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.track-card {
  display: grid;
  gap: 18px;
  min-height: 340px;
  padding: 26px;
  border: 1px solid rgba(0, 102, 255, 0.24);
  border-radius: 18px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(232, 243, 255, 0.94)),
    #ffffff;
  box-shadow: 0 20px 52px rgba(19, 42, 74, 0.08);
}

.track-card.interview {
  border-color: rgba(0, 184, 217, 0.3);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(225, 251, 255, 0.94)),
    #ffffff;
}

.track-copy span,
.recommended-paper span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #e6efff;
  color: #0758d8;
  font-size: 12px;
  font-weight: 900;
}

.interview .track-copy span {
  background: #dffbff;
  color: #007a8c;
}

.track-copy h2 {
  max-width: 420px;
  margin: 16px 0 8px;
  color: #07182f;
  font-size: 28px;
  line-height: 1.25;
}

.track-copy p,
.recommended-paper small {
  color: var(--text-secondary);
  line-height: 1.6;
}

.recommended-paper {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
}

.recommended-paper strong {
  color: #07182f;
  font-size: 21px;
}

.track-cta {
  align-self: end;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 50px;
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
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 22px;
  margin-top: 24px;
}

.main-column {
  display: grid;
  gap: 18px;
}

.paper-speed,
.progress-strip,
.ai-panel {
  border: 1px solid rgba(196, 211, 238, 0.82);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 16px 42px rgba(19, 42, 74, 0.06);
}

.paper-speed {
  padding: 20px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.section-heading h2 {
  margin: 0;
  color: #07182f;
  font-size: 22px;
}

.section-heading button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: #0758d8;
  font-weight: 900;
}

.paper-table {
  display: grid;
  margin-top: 14px;
}

.paper-table button {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) minmax(220px, auto) 88px;
  align-items: center;
  gap: 12px;
  min-height: 58px;
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
  color: #0758d8;
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
  color: #0758d8;
  font-style: normal;
  font-weight: 900;
}

.progress-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) 240px;
  gap: 12px;
  padding: 18px;
}

.progress-strip article {
  display: grid;
  gap: 8px;
  align-content: center;
  min-height: 158px;
  padding: 16px;
  border-radius: 12px;
  background: #f7fbff;
}

.progress-strip article span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
}

.progress-strip article strong {
  color: #0758d8;
  font-size: 28px;
}

.progress-strip .cyan strong {
  color: #007a8c;
}

.progress-strip .green strong {
  color: #08766c;
}

.radar-cell {
  padding: 0 !important;
  background: #ffffff !important;
}

.ai-panel {
  display: grid;
  gap: 14px;
  align-content: start;
  padding: 20px;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-head .el-icon {
  color: #0758d8;
  font-size: 22px;
}

.panel-head h2,
.predict-box h3,
.weak-box h3,
.next-box h3 {
  margin: 0;
  color: #07182f;
}

.advice-box,
.predict-box,
.weak-box,
.next-box {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e4ebf6;
  border-radius: 12px;
  background: #fbfdff;
}

.advice-box span {
  color: #0758d8;
  font-size: 13px;
  font-weight: 900;
}

.advice-box p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.score-rings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.score-rings div {
  display: grid;
  place-items: center;
  min-height: 116px;
  border-radius: 999px;
  background:
    radial-gradient(circle at center, #ffffff 58%, transparent 59%),
    conic-gradient(#0b66ff 72%, #dbeafe 0);
}

.score-rings div.cyan {
  background:
    radial-gradient(circle at center, #ffffff 58%, transparent 59%),
    conic-gradient(#00a4c7 68%, #ddf8ff 0);
}

.score-rings strong {
  color: #0b66ff;
  font-size: 34px;
  line-height: 1;
}

.score-rings span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
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
  font-weight: 800;
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
  background: linear-gradient(90deg, #ff6b4a, #00b8d9);
}

.next-box button {
  min-height: 40px;
  border: 1px solid #d9e6f7;
  border-radius: 10px;
  background: #ffffff;
  color: #0758d8;
  font-weight: 900;
}

@media (max-width: 1180px) {
  .sidebar {
    display: none;
  }

  .coach-shell {
    margin-left: 0;
  }

  .coach-content {
    width: min(100vw - 32px, 960px);
  }

  .topbar {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .top-tabs {
    display: none;
  }
}

@media (max-width: 900px) {
  .topbar {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px 16px;
  }

  .top-actions {
    display: none;
  }

  .hero-row,
  .path-grid,
  .dashboard-grid,
  .progress-strip {
    grid-template-columns: 1fr;
  }

  .hero-row {
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
  .track-card {
    min-height: 0;
    padding: 20px;
  }

  .track-copy h2 {
    font-size: 23px;
  }

  .score-rings {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
