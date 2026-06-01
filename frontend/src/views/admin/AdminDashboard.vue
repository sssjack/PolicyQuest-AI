<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '../../api'

const data = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res: any = await adminApi.dashboard()
    data.value = res.data
  } catch(e) {} finally { loading.value = false }
})
</script>

<template>
  <div class="page-container">
    <h1 class="section-title">数据概览</h1>
    <div v-if="loading" style="text-align:center;padding:60px;color:var(--text-muted)">加载中...</div>
    <template v-else-if="data">
      <div class="dash-grid">
        <div class="dash-card glass-card">
          <div class="dc-icon" style="background:rgba(99,102,241,0.15)">👥</div>
          <div class="dc-info"><div class="dc-val">{{ data.totalUsers }}</div><div class="dc-label">总用户数</div></div>
          <div class="dc-sub">今日新增 {{ data.todayUsers }}</div>
        </div>
        <div class="dash-card glass-card">
          <div class="dc-icon" style="background:rgba(16,185,129,0.15)">📝</div>
          <div class="dc-info"><div class="dc-val">{{ data.totalQuestions }}</div><div class="dc-label">题目总数</div></div>
          <div class="dc-sub">已审核 {{ data.approvedQuestions }}</div>
        </div>
        <div class="dash-card glass-card">
          <div class="dc-icon" style="background:rgba(245,158,11,0.15)">⏳</div>
          <div class="dc-info"><div class="dc-val">{{ data.pendingQuestions }}</div><div class="dc-label">待审核题目</div></div>
        </div>
        <div class="dash-card glass-card">
          <div class="dc-icon" style="background:rgba(6,182,212,0.15)">📰</div>
          <div class="dc-info"><div class="dc-val">{{ data.totalArticles }}</div><div class="dc-label">文章总数</div></div>
        </div>
        <div class="dash-card glass-card">
          <div class="dc-icon" style="background:rgba(168,85,247,0.15)">📋</div>
          <div class="dc-info"><div class="dc-val">{{ data.totalSessions }}</div><div class="dc-label">练习次数</div></div>
        </div>
        <div class="dash-card glass-card">
          <div class="dc-icon" style="background:rgba(239,68,68,0.15)">✏️</div>
          <div class="dc-info"><div class="dc-val">{{ data.totalAnswers }}</div><div class="dc-label">答题总数</div></div>
          <div class="dc-sub">今日 {{ data.todayAnswers }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dash-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.dash-card { display: flex; flex-direction: column; gap: 12px; padding: 24px; }
.dc-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.dc-val { font-size: 28px; font-weight: 800; }
.dc-label { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.dc-sub { font-size: 12px; color: var(--text-muted); }
</style>
