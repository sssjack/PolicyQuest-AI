<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Calendar, DataAnalysis, Reading, Timer, TrendCharts, Warning } from '@element-plus/icons-vue'
import AbilityRadar from '../../components/AbilityRadar.vue'
import {
  aggregateDimensions,
  averageScore,
  formatSeconds,
  readPracticeRecords,
  type PracticeRecord,
} from '../../data/policyQuest'

const router = useRouter()
const records = ref<PracticeRecord[]>([])

onMounted(() => {
  records.value = readPracticeRecords()
})

const dimensions = computed(() => aggregateDimensions(records.value).slice(0, 5))
const average = computed(() => averageScore(records.value))
const totalSeconds = computed(() => records.value.reduce((sum, record) => sum + record.durationSeconds, 0))
const essayCount = computed(() => records.value.filter(record => record.type === 'essay').length)
const interviewCount = computed(() => records.value.filter(record => record.type === 'interview').length)
const bestRecord = computed(() => [...records.value].sort((a, b) => b.score - a.score)[0])
const weakest = computed(() => [...dimensions.value].sort((a, b) => a.score - b.score)[0])
const latestRecords = computed(() => records.value.slice(0, 8))

const reportStats = computed(() => [
  { label: '累计作答', value: `${records.value.length || 0} 次`, icon: Reading },
  { label: '平均得分', value: `${average.value || 0} 分`, icon: DataAnalysis },
  { label: '总用时', value: formatSeconds(totalSeconds.value), icon: Timer },
  { label: '最佳成绩', value: bestRecord.value ? `${bestRecord.value.score} 分` : '暂无', icon: TrendCharts },
])

const insight = computed(() => {
  if (!records.value.length) {
    return {
      why: '你还没有完成正式作答，系统暂时无法判断真实薄弱项。',
      next: '先完成一套申论或面试真题，报告会自动沉淀维度得分和下一步建议。',
    }
  }
  return {
    why: `最近作答中，${weakest.value?.name || '提出对策'} 得分相对偏低，说明答案可能存在材料转化不足、执行抓手不具体或表达层次不清的问题。`,
    next:
      records.value.length < 3
        ? '继续完成 2 次限时真题，先建立稳定样本，再判断阶段性薄弱项。'
        : `下一步建议围绕“${weakest.value?.name || '提出对策'}”做专项训练，并把每题答案改写成“判断 + 分析 + 对策 + 收束”的结构。`,
  }
})
</script>

<template>
  <main class="report-page">
    <header class="report-topbar">
      <router-link to="/coach" class="brand">
        <span>PQ</span>
        <strong>PolicyQuest</strong>
      </router-link>
      <nav>
        <router-link to="/coach">首页</router-link>
        <router-link to="/papers">真题库</router-link>
        <router-link to="/report" class="active">个人报告</router-link>
      </nav>
      <button class="btn-primary" type="button" @click="router.push('/papers')">
        开始新练习 <el-icon><ArrowRight /></el-icon>
      </button>
    </header>

    <section class="report-hero">
      <div>
        <p class="page-kicker">Growth Report</p>
        <h1>你的备考能力画像</h1>
        <p>不只展示数据，还解释为什么失分，以及下一步该练什么。</p>
      </div>
      <div class="hero-score">
        <strong>{{ average || 0 }}</strong>
        <span>平均分</span>
      </div>
    </section>

    <section class="stat-grid">
      <article v-for="item in reportStats" :key="item.label">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <section class="report-layout">
      <article class="radar-card">
        <div class="card-head">
          <div>
            <p class="page-kicker">Ability Radar</p>
            <h2>维度雷达图</h2>
          </div>
          <span>{{ records.length ? '基于真实作答' : '等待样本' }}</span>
        </div>
        <AbilityRadar :items="dimensions" :height="360" />
        <div class="dimension-list">
          <div v-for="item in dimensions" :key="item.name">
            <span>{{ item.name }}</span>
            <strong>{{ item.score }}</strong>
            <i><b :style="{ width: `${item.score}%` }"></b></i>
          </div>
        </div>
      </article>

      <aside class="diagnosis-card">
        <div class="card-head compact">
          <div>
            <p class="page-kicker">AI Diagnosis</p>
            <h2>为什么 & 下一步</h2>
          </div>
        </div>

        <section>
          <h3><el-icon><Warning /></el-icon> 为什么</h3>
          <p>{{ insight.why }}</p>
        </section>

        <section>
          <h3><el-icon><ArrowRight /></el-icon> 下一步做什么</h3>
          <p>{{ insight.next }}</p>
          <button type="button" @click="router.push('/papers')">去做专项练习</button>
        </section>

        <div class="split-stats">
          <div><strong>{{ essayCount }}</strong><span>申论作答</span></div>
          <div><strong>{{ interviewCount }}</strong><span>面试作答</span></div>
        </div>
      </aside>
    </section>

    <section class="history-card">
      <div class="card-head">
        <div>
          <p class="page-kicker">Practice Records</p>
          <h2>最近答题记录</h2>
        </div>
        <button type="button" @click="router.push('/papers')">继续训练</button>
      </div>

      <div v-if="latestRecords.length" class="record-table">
        <article v-for="record in latestRecords" :key="record.id">
          <span class="record-type" :class="record.type">{{ record.type === 'essay' ? '申论' : '面试' }}</span>
          <div>
            <strong>{{ record.questionTitle }}</strong>
            <small>{{ record.paperTitle }}</small>
          </div>
          <span><el-icon><Timer /></el-icon> {{ formatSeconds(record.durationSeconds) }}</span>
          <span><el-icon><Calendar /></el-icon> {{ new Date(record.submittedAt).toLocaleDateString() }}</span>
          <em>{{ record.score }} 分</em>
        </article>
      </div>

      <div v-else class="empty-report">
        <h2>暂无真实作答记录</h2>
        <p>完成一题后，这里会展示分数、用时、维度和 AI 评阅摘要。</p>
        <button class="btn-primary" type="button" @click="router.push('/papers')">去选择真题</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.report-page {
  min-height: 100vh;
  padding-bottom: 64px;
  background:
    linear-gradient(90deg, rgba(0, 184, 217, 0.05) 1px, transparent 1px),
    linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
  background-size: 42px 42px, auto;
}

.report-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  min-height: 76px;
  padding: 0 max(24px, calc((100vw - 1240px) / 2));
  border-bottom: 1px solid rgba(198, 211, 232, 0.72);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #07182f;
}

.brand span {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #0b66ff, #00b8d9);
  color: #ffffff;
  font-weight: 900;
}

.report-topbar nav {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.report-topbar nav a {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 10px;
  color: var(--text-secondary);
  font-weight: 900;
}

.report-topbar nav a.active,
.report-topbar nav a.router-link-active {
  background: #eaf3ff;
  color: #0758d8;
}

.report-hero,
.stat-grid,
.report-layout,
.history-card {
  width: min(1240px, calc(100vw - 48px));
  margin: 0 auto;
}

.report-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding: 34px 0 24px;
}

.report-hero h1 {
  margin: 0;
  color: #07182f;
  font-size: 38px;
}

.report-hero p:last-child {
  margin: 10px 0 0;
  color: var(--text-secondary);
}

.hero-score {
  display: grid;
  place-items: center;
  width: 144px;
  height: 144px;
  border-radius: 999px;
  background:
    radial-gradient(circle at center, #ffffff 58%, transparent 59%),
    conic-gradient(#0b66ff 72%, #dbeafe 0);
  box-shadow: inset 0 0 0 1px #d9e3f2;
}

.hero-score strong {
  color: #0b66ff;
  font-size: 42px;
  line-height: 1;
}

.hero-score span {
  color: var(--text-muted);
  font-weight: 900;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-grid article,
.radar-card,
.diagnosis-card,
.history-card {
  border: 1px solid rgba(196, 211, 238, 0.86);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 42px rgba(19, 42, 74, 0.06);
}

.stat-grid article {
  display: grid;
  gap: 8px;
  min-height: 142px;
  padding: 20px;
}

.stat-grid .el-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 10px;
  background: #eaf3ff;
  color: #0758d8;
  font-size: 22px;
}

.stat-grid span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
}

.stat-grid strong {
  color: #07182f;
  font-size: 28px;
}

.report-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  margin-top: 18px;
}

.radar-card,
.diagnosis-card,
.history-card {
  padding: 22px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
  margin-bottom: 16px;
}

.card-head h2 {
  margin: 0;
  color: #07182f;
  font-size: 22px;
}

.card-head > span {
  padding: 7px 10px;
  border-radius: 999px;
  background: #e5fbff;
  color: #007a8c;
  font-size: 12px;
  font-weight: 900;
}

.dimension-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.dimension-list div {
  display: grid;
  gap: 7px;
  padding: 12px;
  border-radius: 10px;
  background: #f7fbff;
}

.dimension-list span {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 800;
}

.dimension-list strong {
  color: #0758d8;
  font-size: 22px;
}

.dimension-list i {
  display: block;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #dbeafe;
}

.dimension-list b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0b66ff, #00b8d9);
}

.diagnosis-card {
  display: grid;
  gap: 14px;
  align-content: start;
}

.diagnosis-card section {
  padding: 16px;
  border: 1px solid #d9e6f7;
  border-radius: 12px;
  background: #fbfdff;
}

.diagnosis-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  color: #07182f;
}

.diagnosis-card p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.72;
}

.diagnosis-card section button,
.history-card .card-head button {
  margin-top: 14px;
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  background: #eaf3ff;
  color: #0758d8;
  font-weight: 900;
}

.split-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.split-stats div {
  display: grid;
  gap: 5px;
  padding: 16px;
  border-radius: 12px;
  background: #f0fbff;
}

.split-stats strong {
  color: #007a8c;
  font-size: 28px;
}

.split-stats span {
  color: var(--text-muted);
  font-weight: 800;
}

.history-card {
  margin-top: 18px;
}

.record-table {
  display: grid;
}

.record-table article {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) 100px 120px 72px;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  border-top: 1px solid #edf1f8;
}

.record-table article:first-child {
  border-top: 0;
}

.record-type {
  justify-self: start;
  padding: 6px 10px;
  border-radius: 8px;
  background: #eaf3ff;
  color: #0758d8;
  font-size: 12px;
  font-weight: 900;
}

.record-type.interview {
  background: #dffbff;
  color: #007a8c;
}

.record-table strong,
.record-table small {
  display: block;
}

.record-table small,
.record-table span {
  color: var(--text-muted);
  font-size: 13px;
}

.record-table span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
}

.record-table em {
  color: #0758d8;
  font-style: normal;
  font-weight: 900;
}

.empty-report {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 260px;
  text-align: center;
}

.empty-report h2,
.empty-report p {
  margin: 0;
}

.empty-report p {
  color: var(--text-secondary);
}

@media (max-width: 980px) {
  .report-topbar {
    grid-template-columns: 1fr auto;
    padding: 0 16px;
  }

  .report-topbar nav {
    display: none;
  }

  .report-hero {
    display: grid;
  }

  .stat-grid,
  .report-layout,
  .dimension-list {
    grid-template-columns: 1fr;
  }

  .record-table article {
    grid-template-columns: 62px minmax(0, 1fr) 72px;
    padding: 12px 0;
  }

  .record-table article > span:not(.record-type) {
    grid-column: 2;
  }
}

@media (max-width: 620px) {
  .report-topbar .btn-primary {
    display: none;
  }

  .report-hero,
  .stat-grid,
  .report-layout,
  .history-card {
    width: calc(100vw - 32px);
  }

  .report-hero h1 {
    font-size: 30px;
  }
}
</style>
