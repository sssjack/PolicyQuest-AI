<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { statsApi } from '../../api'

const stats = ref<any>(null)
const loading = ref(true)

const catLabels: Record<string, string> = { verbal: '言语理解', politics: '政治理论', interview: '面试' }

onMounted(async () => {
  try {
    const res: any = await statsApi.overview()
    stats.value = res.data
  } catch(e) {} finally { loading.value = false }
})
</script>

<template>
  <div class="page-container">
    <h1 class="section-title">学习报告</h1>

    <div v-if="loading" style="text-align:center;padding:60px;color:var(--text-muted)">加载中...</div>

    <template v-else-if="stats">
      <div class="report-overview">
        <div class="overview-card glass-card">
          <div class="ov-label">累计做题</div>
          <div class="ov-value">{{ stats.total_questions }}</div>
        </div>
        <div class="overview-card glass-card">
          <div class="ov-label">正确数量</div>
          <div class="ov-value" style="color:var(--success)">{{ stats.correct_count }}</div>
        </div>
        <div class="overview-card glass-card">
          <div class="ov-label">总正确率</div>
          <div class="ov-value" style="color:var(--primary-light)">{{ stats.accuracy }}%</div>
        </div>
        <div class="overview-card glass-card">
          <div class="ov-label">完成练习</div>
          <div class="ov-value" style="color:var(--accent)">{{ stats.total_sessions }}</div>
        </div>
      </div>

      <div class="report-section">
        <h2>今日表现</h2>
        <div class="today-stats glass-card">
          <div class="ts-item">
            <span class="ts-label">今日做题</span>
            <span class="ts-value">{{ stats.today?.total || 0 }} 题</span>
          </div>
          <div class="ts-item">
            <span class="ts-label">今日正确</span>
            <span class="ts-value" style="color:var(--success)">{{ stats.today?.correct || 0 }} 题</span>
          </div>
          <div class="ts-item">
            <span class="ts-label">今日正确率</span>
            <span class="ts-value" style="color:var(--primary-light)">{{ stats.today?.accuracy || 0 }}%</span>
          </div>
          <div class="ts-item">
            <span class="ts-label">本周做题</span>
            <span class="ts-value">{{ stats.week_total || 0 }} 题</span>
          </div>
        </div>
      </div>

      <div class="report-section">
        <h2>分类能力分析</h2>
        <div class="ability-grid">
          <div v-for="(data, cat) in stats.category_stats" :key="cat" class="ability-card glass-card">
            <div class="ab-header">
              <span class="ab-name">{{ catLabels[cat as string] || cat }}</span>
              <span class="ab-acc">{{ data.accuracy }}%</span>
            </div>
            <div class="ab-bar"><div class="ab-fill" :style="{ width: data.accuracy + '%' }" /></div>
            <div class="ab-detail">做题 {{ data.total }} 题，正确 {{ data.correct }} 题</div>
          </div>
        </div>
      </div>

      <div class="report-section">
        <h2>学习建议</h2>
        <div class="glass-card" style="padding:24px">
          <div class="suggestion-list">
            <div class="suggestion" v-if="stats.wrong_count > 0">
              <span class="sug-icon">📕</span>
              <span>你有 <strong>{{ stats.wrong_count }}</strong> 道错题待复习，建议每天复习 5-10 道错题</span>
            </div>
            <div class="suggestion" v-for="(data, cat) in stats.category_stats" :key="cat">
              <template v-if="Number(data.accuracy) < 70 && data.total > 0">
                <span class="sug-icon">⚠️</span>
                <span><strong>{{ catLabels[cat as string] }}</strong> 正确率偏低（{{ data.accuracy }}%），建议加强专项练习</span>
              </template>
            </div>
            <div class="suggestion">
              <span class="sug-icon">💡</span>
              <span>保持每日刷题习惯，量变引起质变，坚持就是胜利！</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.report-overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 40px; }
.overview-card { text-align: center; padding: 24px; }
.ov-label { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
.ov-value { font-size: 32px; font-weight: 800; }

.report-section { margin-bottom: 40px; }
.report-section h2 { font-size: 20px; font-weight: 700; margin-bottom: 16px; }

.today-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 24px; }
.ts-item { text-align: center; }
.ts-label { display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
.ts-value { font-size: 20px; font-weight: 700; }

.ability-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.ability-card { padding: 20px; }
.ab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.ab-name { font-size: 16px; font-weight: 600; }
.ab-acc { font-size: 20px; font-weight: 800; background: var(--gradient-1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.ab-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
.ab-fill { height: 100%; background: var(--gradient-1); border-radius: 3px; transition: width 0.5s; }
.ab-detail { font-size: 12px; color: var(--text-muted); }

.suggestion-list { display: flex; flex-direction: column; gap: 12px; }
.suggestion { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-secondary); }
.sug-icon { font-size: 18px; }

@media (max-width: 900px) {
  .report-overview, .today-stats { grid-template-columns: repeat(2, 1fr); }
  .ability-grid { grid-template-columns: 1fr; }
}
</style>
