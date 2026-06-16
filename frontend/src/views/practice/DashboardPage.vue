<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { statsApi, questionApi } from '../../api'
import { readPracticeDrafts, readPracticeRecords } from '../../data/policyQuest'

const router = useRouter()
const stats = ref<any>(null)
const qStats = ref<any>(null)
const loading = ref(true)

const categoryLabels: Record<string, string> = { verbal: '言语理解', politics: '政治理论', interview: '面试' }

const categoryEntries = computed(() => Object.entries(stats.value?.category_stats || {}))
const questionEntries = computed(() => Object.entries(qStats.value?.byCategory || {}))
const todayTotal = computed(() => stats.value?.today?.total || 0)
const todayAccuracy = computed(() => stats.value?.today?.accuracy || 0)
const historyTotal = computed(() => readPracticeRecords().length + readPracticeDrafts().length)

onMounted(async () => {
  try {
    const [s, q] = await Promise.all([statsApi.overview(), questionApi.stats()])
    stats.value = (s as any).data
    qStats.value = (q as any).data
  } catch (e) {
    // Empty dashboard states are rendered below when the backend is unavailable.
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dashboard page-container">
    <section class="dashboard-hero">
      <div>
        <p class="page-kicker">Study Dashboard</p>
        <h1 class="page-title">今天从一组高质量训练开始</h1>
        <p class="page-subtitle">根据你的历史表现，优先完成限时真题；每一次作答都会沉淀到做题历史和成长报告里。</p>
      </div>
      <div class="hero-actions">
        <button class="btn-primary" type="button" @click="router.push('/app/practice')">开始练习</button>
        <button class="btn-ghost" type="button" @click="router.push('/app/report')">查看报告</button>
      </div>
    </section>

    <div v-if="loading" class="loading-card glass-card">正在整理你的学习数据...</div>

    <template v-else>
      <section class="metric-grid">
        <article class="metric-card primary">
          <span>累计做题</span>
          <strong>{{ stats?.total_questions || 0 }}</strong>
          <small>训练规模越稳定，画像越准确</small>
        </article>
        <article class="metric-card success">
          <span>总正确率</span>
          <strong>{{ stats?.accuracy || 0 }}%</strong>
          <small>目标区间：75% 以上</small>
        </article>
        <article class="metric-card">
          <span>今日做题</span>
          <strong>{{ todayTotal }}</strong>
          <small>今日正确率 {{ todayAccuracy }}%</small>
        </article>
        <article class="metric-card danger">
          <span>历史记录</span>
          <strong>{{ historyTotal }}</strong>
          <small>保存进度和完成记录集中查看</small>
        </article>
      </section>

      <section class="content-grid">
        <article class="today-card glass-card">
          <div class="panel-head">
            <div>
              <p class="page-kicker">Today Plan</p>
              <h2>今日训练建议</h2>
            </div>
            <span class="chip success">智能推荐</span>
          </div>

          <div class="task-list">
            <button type="button" @click="router.push('/app/practice')" class="task-item">
              <span class="task-index">01</span>
              <span>
                <strong>快速练习 10 题</strong>
                <small>覆盖言语、政治理论与面试判断</small>
              </span>
            </button>
            <button type="button" @click="router.push('/history')" class="task-item">
              <span class="task-index">02</span>
              <span>
                <strong>继续做题历史</strong>
                <small>恢复未完成真题，查看已收藏题卷</small>
              </span>
            </button>
            <button type="button" @click="router.push('/app/articles')" class="task-item">
              <span class="task-index">03</span>
              <span>
                <strong>时政素材阅读</strong>
                <small>补充申论与面试表达素材</small>
              </span>
            </button>
          </div>
        </article>

        <article class="ability-card glass-card">
          <div class="panel-head">
            <div>
              <p class="page-kicker">Ability Map</p>
              <h2>分类正确率</h2>
            </div>
          </div>

          <div v-if="categoryEntries.length" class="ability-list">
            <div v-for="[cat, data] in categoryEntries" :key="cat" class="ability-row">
              <div class="ability-top">
                <strong>{{ categoryLabels[cat] || cat }}</strong>
                <span>{{ (data as any).accuracy }}%</span>
              </div>
              <div class="progress-bar">
                <i :style="{ width: `${(data as any).accuracy || 0}%` }"></i>
              </div>
              <small>{{ (data as any).correct }} / {{ (data as any).total }} 题</small>
            </div>
          </div>
          <div v-else class="empty-note">完成第一组练习后，这里会生成分类能力画像。</div>
        </article>
      </section>

      <section class="bank-card glass-card">
        <div class="panel-head">
          <div>
            <p class="page-kicker">Question Bank</p>
            <h2>题库概览</h2>
          </div>
          <strong class="bank-total">{{ qStats?.total || 0 }} 题</strong>
        </div>

        <div class="bank-grid">
          <div v-for="[cat, count] in questionEntries" :key="cat" class="bank-item">
            <span>{{ categoryLabels[cat] || cat }}</span>
            <strong>{{ count }}</strong>
          </div>
          <div v-if="!questionEntries.length" class="bank-item empty">
            <span>暂无题库统计</span>
            <strong>--</strong>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 22px;
}

.dashboard-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 26px;
  border: 1px solid rgba(194, 198, 216, 0.7);
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(239, 244, 255, 0.88)),
    #ffffff;
  box-shadow: var(--shadow-sm);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.loading-card {
  color: var(--text-muted);
  text-align: center;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  display: grid;
  gap: 8px;
  min-height: 150px;
  padding: 22px;
  border: 1px solid rgba(194, 198, 216, 0.72);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.metric-card span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
}

.metric-card strong {
  color: var(--text-primary);
  font-size: 38px;
  font-weight: 900;
  line-height: 1;
}

.metric-card small {
  align-self: end;
  color: var(--text-muted);
  line-height: 1.5;
}

.metric-card.primary strong {
  color: var(--primary);
}

.metric-card.success strong {
  color: var(--success);
}

.metric-card.danger strong {
  color: var(--danger);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(360px, 1fr);
  gap: 16px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-head h2 {
  margin: 0;
  font-size: 22px;
}

.task-list {
  display: grid;
  gap: 12px;
}

.task-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #ffffff;
  color: var(--text-primary);
  text-align: left;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.task-item:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 80, 203, 0.35);
  background: var(--surface-muted);
}

.task-index {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--primary);
  color: #ffffff;
  font-weight: 900;
}

.task-item strong,
.task-item small {
  display: block;
}

.task-item strong {
  font-size: 16px;
}

.task-item small {
  margin-top: 4px;
  color: var(--text-muted);
}

.ability-list {
  display: grid;
  gap: 16px;
}

.ability-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;
  font-weight: 800;
}

.ability-top span {
  color: var(--primary);
}

.progress-bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-muted);
}

.progress-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--secondary), var(--primary));
}

.ability-row small {
  display: block;
  margin-top: 7px;
  color: var(--text-muted);
}

.empty-note {
  display: grid;
  place-items: center;
  min-height: 172px;
  color: var(--text-muted);
  text-align: center;
}

.bank-total {
  color: var(--primary);
  font-size: 24px;
}

.bank-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.bank-item {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 16px;
  background: var(--surface-muted);
}

.bank-item span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
}

.bank-item strong {
  color: var(--secondary);
  font-size: 28px;
}

@media (max-width: 1080px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .dashboard-hero {
    display: grid;
    padding: 22px;
  }

  .hero-actions,
  .hero-actions button {
    width: 100%;
  }

  .metric-grid,
  .bank-grid {
    grid-template-columns: 1fr;
  }
}
</style>
