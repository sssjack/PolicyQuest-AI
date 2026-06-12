<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { statsApi } from '../../api'

const stats = ref<any>(null)
const loading = ref(true)

const catLabels: Record<string, string> = { verbal: '言语理解', politics: '政治理论', interview: '面试' }
const categoryEntries = computed(() => Object.entries(stats.value?.category_stats || {}))

onMounted(async () => {
  try {
    const res: any = await statsApi.overview()
    stats.value = res.data
  } catch (e) {
    // The empty state handles unavailable data.
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="report-page page-container">
    <section class="report-hero">
      <div>
        <p class="page-kicker">Growth Report</p>
        <h1 class="page-title">你的备考能力画像</h1>
        <p class="page-subtitle">把练习表现转化为可执行的复盘路径，优先补齐正确率低、错题积压高的模块。</p>
      </div>
      <div class="hero-score" :style="{ '--score': stats?.accuracy || 0 }">
        <strong>{{ stats?.accuracy || 0 }}%</strong>
        <span>总正确率</span>
      </div>
    </section>

    <div v-if="loading" class="loading-card glass-card">正在生成学习报告...</div>

    <template v-else-if="stats">
      <section class="overview-grid">
        <article class="overview-card"><span>累计做题</span><strong>{{ stats.total_questions }}</strong></article>
        <article class="overview-card success"><span>正确数量</span><strong>{{ stats.correct_count }}</strong></article>
        <article class="overview-card primary"><span>完成练习</span><strong>{{ stats.total_sessions }}</strong></article>
        <article class="overview-card danger"><span>错题待复习</span><strong>{{ stats.wrong_count }}</strong></article>
      </section>

      <section class="report-grid">
        <article class="today-card glass-card">
          <div class="panel-head">
            <p class="page-kicker">Today</p>
            <h2>今日表现</h2>
          </div>
          <div class="today-grid">
            <div><span>今日做题</span><strong>{{ stats.today?.total || 0 }}</strong></div>
            <div><span>今日正确</span><strong>{{ stats.today?.correct || 0 }}</strong></div>
            <div><span>今日正确率</span><strong>{{ stats.today?.accuracy || 0 }}%</strong></div>
            <div><span>本周做题</span><strong>{{ stats.week_total || 0 }}</strong></div>
          </div>
        </article>

        <article class="suggestion-card glass-card">
          <div class="panel-head">
            <p class="page-kicker">AI Advice</p>
            <h2>学习建议</h2>
          </div>
          <div class="suggestion-list">
            <div v-if="stats.wrong_count > 0" class="suggestion">
              <span class="suggestion-dot danger"></span>
              <p>你有 <strong>{{ stats.wrong_count }}</strong> 道错题待复习，建议每天回练 5-10 道。</p>
            </div>
            <template v-for="[cat, data] in categoryEntries" :key="cat">
              <div v-if="Number((data as any).accuracy) < 70 && (data as any).total > 0" class="suggestion">
                <span class="suggestion-dot warning"></span>
                <p><strong>{{ catLabels[cat] }}</strong> 正确率偏低（{{ (data as any).accuracy }}%），建议安排专项练习。</p>
              </div>
            </template>
            <div class="suggestion">
              <span class="suggestion-dot success"></span>
              <p>保持固定训练节奏，优先复盘“做错原因”和“下次识别信号”。</p>
            </div>
          </div>
        </article>
      </section>

      <section class="ability-card glass-card">
        <div class="panel-head wide">
          <div>
            <p class="page-kicker">Ability Analysis</p>
            <h2>分类能力分析</h2>
          </div>
          <span class="chip">动态更新</span>
        </div>

        <div v-if="categoryEntries.length" class="ability-grid">
          <article v-for="[cat, data] in categoryEntries" :key="cat" class="ability-item">
            <div class="ability-top">
              <strong>{{ catLabels[cat] || cat }}</strong>
              <span>{{ (data as any).accuracy }}%</span>
            </div>
            <div class="ability-bar"><i :style="{ width: `${(data as any).accuracy || 0}%` }"></i></div>
            <p>做题 {{ (data as any).total }} 题，正确 {{ (data as any).correct }} 题</p>
          </article>
        </div>
        <div v-else class="empty-note">暂无分类数据，完成练习后会自动生成。</div>
      </section>
    </template>

    <section v-else class="empty-card glass-card">
      <h2>暂无报告数据</h2>
      <p>完成一组练习后，这里会展示你的能力画像。</p>
    </section>
  </div>
</template>

<style scoped>
.report-page {
  display: grid;
  gap: 20px;
}

.report-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px solid rgba(194, 198, 216, 0.72);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.hero-score {
  display: grid;
  place-items: center;
  width: 144px;
  height: 144px;
  border-radius: 999px;
  background:
    radial-gradient(circle at center, #ffffff 54%, transparent 55%),
    conic-gradient(var(--primary) calc(var(--score, 0) * 1%), #dce9ff 0);
  box-shadow: inset 0 0 0 1px rgba(194, 198, 216, 0.72);
}

.hero-score strong {
  color: var(--primary);
  font-size: 34px;
  line-height: 1;
}

.hero-score span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.loading-card,
.empty-card {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 220px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-card h2,
.empty-card p {
  margin: 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.overview-card {
  display: grid;
  gap: 10px;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.overview-card span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
}

.overview-card strong {
  color: var(--text-primary);
  font-size: 34px;
}

.overview-card.primary strong {
  color: var(--primary);
}

.overview-card.success strong {
  color: var(--success);
}

.overview-card.danger strong {
  color: var(--danger);
}

.report-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1fr);
  gap: 16px;
}

.panel-head {
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  font-size: 22px;
}

.panel-head.wide {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.today-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.today-grid div {
  display: grid;
  gap: 6px;
  padding: 18px;
  border-radius: 16px;
  background: var(--surface-muted);
}

.today-grid span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
}

.today-grid strong {
  color: var(--primary);
  font-size: 27px;
}

.suggestion-list {
  display: grid;
  gap: 12px;
}

.suggestion {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  background: #fbfcff;
}

.suggestion p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.suggestion-dot {
  width: 10px;
  height: 10px;
  margin-top: 8px;
  border-radius: 999px;
  background: var(--primary);
}

.suggestion-dot.success {
  background: var(--success);
}

.suggestion-dot.warning {
  background: var(--warning);
}

.suggestion-dot.danger {
  background: var(--danger);
}

.ability-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.ability-item {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #ffffff;
}

.ability-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  font-weight: 900;
}

.ability-top span {
  color: var(--primary);
}

.ability-bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-muted);
}

.ability-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--secondary), var(--primary));
}

.ability-item p {
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.empty-note {
  display: grid;
  place-items: center;
  min-height: 160px;
  color: var(--text-muted);
}

@media (max-width: 980px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-grid,
  .ability-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .report-hero {
    display: grid;
  }

  .hero-score {
    width: 128px;
    height: 128px;
  }

  .overview-grid,
  .today-grid {
    grid-template-columns: 1fr;
  }
}
</style>
