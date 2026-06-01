<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { statsApi, questionApi } from '../../api'

const router = useRouter()
const stats = ref<any>(null)
const qStats = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const [s, q] = await Promise.all([statsApi.overview(), questionApi.stats()])
    stats.value = (s as any).data
    qStats.value = (q as any).data
  } catch(e) {} finally { loading.value = false }
})

const categoryLabels: Record<string, string> = { verbal: '言语理解', politics: '政治理论', interview: '面试' }
</script>

<template>
  <div class="page-container">
    <div class="welcome">
      <h1>学习中心</h1>
      <p>今天也要加油哦！持续练习，稳步提升</p>
    </div>

    <div v-if="!loading && stats" class="stats-grid">
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:var(--primary-light)">📝</div>
        <div class="stat-info"><div class="stat-value">{{ stats.total_questions }}</div><div class="stat-label">总做题数</div></div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:var(--success)">✅</div>
        <div class="stat-info"><div class="stat-value">{{ stats.accuracy }}%</div><div class="stat-label">总正确率</div></div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--warning)">📅</div>
        <div class="stat-info"><div class="stat-value">{{ stats.today?.total || 0 }}</div><div class="stat-label">今日做题</div></div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.15);color:var(--danger)">📕</div>
        <div class="stat-info"><div class="stat-value">{{ stats.wrong_count }}</div><div class="stat-label">待复习错题</div></div>
      </div>
    </div>

    <div class="actions-row">
      <button class="btn-primary" @click="router.push('/app/practice')">快速开始练习</button>
      <button class="btn-ghost" @click="router.push('/app/wrongbook')">复习错题</button>
      <button class="btn-ghost" @click="router.push('/app/report')">查看报告</button>
    </div>

    <div v-if="!loading && stats" class="section">
      <h2 class="section-title">分类正确率</h2>
      <div class="category-grid">
        <div v-for="(data, cat) in stats.category_stats" :key="cat" class="cat-card glass-card">
          <div class="cat-name">{{ categoryLabels[cat as string] || cat }}</div>
          <div class="cat-accuracy">{{ data.accuracy }}%</div>
          <div class="progress-bar"><div class="progress-fill" :style="{ width: data.accuracy + '%' }" /></div>
          <div class="cat-detail">{{ data.correct }} / {{ data.total }} 题</div>
        </div>
      </div>
    </div>

    <div v-if="!loading && qStats" class="section">
      <h2 class="section-title">题库概览</h2>
      <div class="qstats-grid">
        <div class="glass-card" style="text-align:center;padding:20px">
          <div style="font-size:28px;font-weight:800;color:var(--primary-light)">{{ qStats.total }}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">题目总数</div>
        </div>
        <div v-for="(c, cat) in qStats.byCategory" :key="cat" class="glass-card" style="text-align:center;padding:20px">
          <div style="font-size:28px;font-weight:800;color:var(--accent)">{{ c }}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">{{ categoryLabels[cat as string] || cat }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome { margin-bottom: 32px; }
.welcome h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
.welcome p { color: var(--text-muted); }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
.stat-card { display: flex; align-items: center; gap: 16px; padding: 20px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.stat-value { font-size: 24px; font-weight: 800; }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 2px; }

.actions-row { display: flex; gap: 12px; margin-bottom: 40px; }
.section { margin-bottom: 40px; }

.category-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.cat-card { padding: 20px; }
.cat-name { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.cat-accuracy { font-size: 28px; font-weight: 800; background: var(--gradient-1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 12px; }
.progress-bar { height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
.progress-fill { height: 100%; background: var(--gradient-1); border-radius: 2px; transition: width 0.5s ease; }
.cat-detail { font-size: 12px; color: var(--text-muted); }

.qstats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .category-grid { grid-template-columns: 1fr; }
  .qstats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
