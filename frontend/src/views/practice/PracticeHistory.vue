<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, CircleCheck, Clock, Delete, Files, FolderChecked, StarFilled } from '@element-plus/icons-vue'
import {
  buildPracticeHistory,
  formatSeconds,
  readFavoritePapers,
  readPracticeDrafts,
  readPracticeRecords,
  removeFavoritePaper,
  type FavoritePaper,
  type PracticeHistoryItem,
} from '../../data/policyQuest'

type HistoryTab = 'all' | 'draft' | 'completed' | 'favorite'

const route = useRoute()
const router = useRouter()
const activeTab = ref<HistoryTab>('all')
const records = ref(readPracticeRecords())
const drafts = ref(readPracticeDrafts())
const favorites = ref(readFavoritePapers())

const historyItems = computed(() => buildPracticeHistory(records.value, drafts.value))
const visibleHistoryItems = computed(() => {
  if (activeTab.value === 'favorite') return []
  if (activeTab.value === 'all') return historyItems.value
  return historyItems.value.filter(item => item.status === activeTab.value)
})
const visibleFavorites = computed(() => (activeTab.value === 'all' || activeTab.value === 'favorite' ? favorites.value : []))
const draftCount = computed(() => drafts.value.length)
const completedCount = computed(() => new Set(records.value.map(record => record.paperId)).size)
const favoriteCount = computed(() => favorites.value.length)
const averageScore = computed(() => {
  if (!records.value.length) return 0
  return Math.round(records.value.reduce((sum, record) => sum + record.score, 0) / records.value.length)
})

const tabs = computed(() => [
  { key: 'all' as const, label: '全部', count: historyItems.value.length + favorites.value.length },
  { key: 'draft' as const, label: '保存进度', count: draftCount.value },
  { key: 'completed' as const, label: '已完成', count: completedCount.value },
  { key: 'favorite' as const, label: '已收藏', count: favoriteCount.value },
])

onMounted(refreshLocalState)

function refreshLocalState() {
  records.value = readPracticeRecords()
  drafts.value = readPracticeDrafts()
  favorites.value = readFavoritePapers()
}

function openHistoryItem(item: PracticeHistoryItem) {
  router.push({
    path: `/practice/${item.paperId}`,
    query: historyQuery(item.status === 'draft' ? { resume: '1' } : {}),
  })
}

function openFavorite(item: FavoritePaper) {
  router.push({
    path: `/practice/${item.paperId}`,
    query: historyQuery({ type: item.type }),
  })
}

function unfavorite(item: FavoritePaper) {
  removeFavoritePaper(item.paperId)
  refreshLocalState()
  ElMessage.success('已取消收藏')
}

function historyQuery(query: Record<string, string> = {}) {
  return route.query.preview === '1' ? { preview: '1', from: 'history', ...query } : { from: 'history', ...query }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '刚刚'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <main class="history-page page-container">
    <section class="history-hero">
      <div>
        <p class="page-kicker">Practice Archive</p>
        <h1 class="page-title">做题历史</h1>
        <p class="page-subtitle">保存进度、已完成真题和星标收藏都集中在这里，回来时可以直接接着做。</p>
      </div>
      <button class="btn-primary" type="button" @click="router.push('/papers')">去真题库选题</button>
    </section>

    <section class="history-metrics">
      <article>
        <el-icon><FolderChecked /></el-icon>
        <span>保存进度</span>
        <strong>{{ draftCount }}</strong>
      </article>
      <article>
        <el-icon><CircleCheck /></el-icon>
        <span>已完成真题</span>
        <strong>{{ completedCount }}</strong>
      </article>
      <article>
        <el-icon><StarFilled /></el-icon>
        <span>收藏真题</span>
        <strong>{{ favoriteCount }}</strong>
      </article>
      <article>
        <el-icon><Clock /></el-icon>
        <span>平均得分</span>
        <strong>{{ averageScore || '--' }}</strong>
      </article>
    </section>

    <section class="history-tabs surface-card">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }} <span>{{ tab.count }}</span>
      </button>
    </section>

    <section v-if="visibleHistoryItems.length" class="history-section">
      <div class="section-head">
        <div>
          <p class="page-kicker">Progress</p>
          <h2>作答记录</h2>
        </div>
      </div>

      <div class="record-list">
        <button
          v-for="item in visibleHistoryItems"
          :key="item.id"
          type="button"
          class="record-item"
          :class="item.status"
          @click="openHistoryItem(item)"
        >
          <span class="record-status">{{ item.status === 'draft' ? '继续做' : '已完成' }}</span>
          <strong>{{ item.paperTitle }}</strong>
          <small>
            {{ item.type === 'essay' ? '申论' : '面试' }} ·
            {{ item.answeredCount }} 题已作答 ·
            用时 {{ formatSeconds(item.durationSeconds) }} ·
            {{ formatDate(item.updatedAt) }}
          </small>
          <em>{{ item.status === 'draft' ? '恢复进度' : `${item.averageScore || '--'} 分` }}</em>
          <el-icon><ArrowRight /></el-icon>
        </button>
      </div>
    </section>

    <section v-if="visibleFavorites.length" class="history-section">
      <div class="section-head">
        <div>
          <p class="page-kicker">Starred Papers</p>
          <h2>已收藏真题</h2>
        </div>
      </div>

      <div class="favorite-grid">
        <article v-for="item in visibleFavorites" :key="item.paperId" class="favorite-card">
          <header>
            <span>{{ item.type === 'essay' ? '申论' : '面试' }}</span>
            <button type="button" aria-label="取消收藏" @click="unfavorite(item)">
              <el-icon><Delete /></el-icon>
            </button>
          </header>
          <h3>{{ item.paperTitle }}</h3>
          <div class="favorite-meta">
            <span>{{ item.systemLabel }}</span>
            <span>{{ item.category || item.year }}</span>
          </div>
          <footer>
            <small><el-icon><Clock /></el-icon>{{ item.suggestedMinutes }} 分钟</small>
            <small><el-icon><Files /></el-icon>{{ item.questionCount }} 题</small>
          </footer>
          <button class="enter-favorite" type="button" @click="openFavorite(item)">
            进入真题 <el-icon><ArrowRight /></el-icon>
          </button>
        </article>
      </div>
    </section>

    <section v-if="!visibleHistoryItems.length && !visibleFavorites.length" class="empty-history surface-card">
      <strong>{{ activeTab === 'favorite' ? '还没有收藏真题' : '还没有做题记录' }}</strong>
      <span>{{ activeTab === 'favorite' ? '在真题库或作答页点击星星后，会出现在这里。' : '进入任意真题作答后，保存进度和完成记录会出现在这里。' }}</span>
      <button class="btn-primary" type="button" @click="router.push('/papers')">去真题库</button>
    </section>
  </main>
</template>

<style scoped>
.history-page {
  display: grid;
  gap: 18px;
}

.history-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 26px;
  border: 1px solid rgba(196, 211, 238, 0.82);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-sm);
}

.history-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.history-metrics article {
  display: grid;
  gap: 8px;
  min-height: 132px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.history-metrics .el-icon {
  color: var(--primary);
  font-size: 24px;
}

.history-metrics span {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 900;
}

.history-metrics strong {
  align-self: end;
  color: var(--text-primary);
  font-size: 34px;
  font-weight: 900;
}

.history-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
}

.history-tabs button {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 900;
}

.history-tabs button.active {
  border-color: rgba(0, 80, 203, 0.22);
  background: #eaf3ff;
  color: var(--primary);
}

.history-tabs span {
  margin-left: 6px;
  color: inherit;
  opacity: 0.76;
}

.history-section {
  display: grid;
  gap: 12px;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.section-head h2 {
  margin: 0;
  color: #07182f;
  font-size: 23px;
}

.record-list {
  display: grid;
  gap: 12px;
}

.record-item {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px 14px;
  align-items: center;
  min-height: 112px;
  padding: 18px;
  border: 1px solid #dbe7f7;
  border-radius: 16px;
  background: #ffffff;
  color: #07182f;
  text-align: left;
  box-shadow: var(--shadow-sm);
}

.record-item:hover {
  border-color: rgba(0, 80, 203, 0.32);
  background: #f6faff;
}

.record-status {
  grid-row: span 2;
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--success-soft);
  color: var(--success);
  font-size: 12px;
  font-weight: 900;
}

.record-item.completed .record-status {
  background: #eaf3ff;
  color: var(--primary);
}

.record-item strong {
  overflow: hidden;
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-item small {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.record-item em {
  grid-row: span 2;
  color: var(--primary);
  font-style: normal;
  font-weight: 900;
}

.record-item > .el-icon {
  color: var(--text-muted);
}

.favorite-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.favorite-card {
  display: grid;
  gap: 14px;
  min-height: 238px;
  padding: 18px;
  border: 1px solid #dbe7f7;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.favorite-card header,
.favorite-card footer,
.favorite-meta,
.enter-favorite {
  display: flex;
  align-items: center;
}

.favorite-card header {
  justify-content: space-between;
  gap: 12px;
}

.favorite-card header span,
.favorite-meta span {
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eaf3ff;
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.favorite-card header button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  background: #fff4f4;
  color: var(--danger);
}

.favorite-card h3 {
  display: -webkit-box;
  overflow: hidden;
  min-height: 58px;
  margin: 0;
  color: #07182f;
  font-size: 18px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.favorite-meta {
  flex-wrap: wrap;
  gap: 8px;
}

.favorite-meta span {
  background: #edf3fb;
  color: #405069;
}

.favorite-card footer {
  gap: 14px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.favorite-card small {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.enter-favorite {
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border: 0;
  border-radius: 12px;
  background: var(--gradient-1);
  color: #ffffff;
  font-weight: 900;
}

.empty-history {
  display: grid;
  justify-items: center;
  gap: 10px;
  min-height: 240px;
  padding: 28px;
  color: var(--text-muted);
  text-align: center;
}

.empty-history strong {
  color: #07182f;
  font-size: 22px;
}

@media (max-width: 980px) {
  .history-hero {
    display: grid;
  }

  .history-metrics,
  .favorite-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .favorite-grid,
  .record-item {
    grid-template-columns: 1fr;
  }

  .history-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .history-metrics article {
    min-height: 86px;
    padding: 14px;
  }

  .history-metrics .el-icon {
    font-size: 20px;
  }

  .history-metrics strong {
    font-size: 26px;
  }

  .history-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 8px;
    padding: 10px;
    scrollbar-width: none;
  }

  .history-tabs::-webkit-scrollbar {
    display: none;
  }

  .history-tabs button {
    flex: 0 0 auto;
    min-height: 36px;
    padding: 0 12px;
    white-space: nowrap;
  }

  .record-status,
  .record-item em {
    grid-row: auto;
  }

  .record-item {
    min-height: 0;
    padding: 16px;
  }

  .record-item strong {
    white-space: normal;
  }
}
</style>
