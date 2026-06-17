<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Search, Star, StarFilled } from '@element-plus/icons-vue'
import { realPaperApi } from '../../api'
import {
  mapBackendPaper,
  readFavoritePapers,
  readPracticeRecords,
  toggleFavoritePaper,
  type PracticeRecord,
  type PracticeType,
  type RealPaper,
} from '../../data/policyQuest'
import { useUserStore } from '../../store/user'

type FilterKind = 'recommend' | 'system' | 'region'
type FilterOption = {
  key: string
  label: string
  kind: FilterKind
  value?: string
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const selectedType = ref<PracticeType>(route.query.type === 'interview' ? 'interview' : 'essay')
const activeFilterKey = ref('recommend')
const keyword = ref('')
const records = ref<PracticeRecord[]>([])
const favoriteIds = ref(new Set<string>())
const papers = ref<RealPaper[]>([])
const loading = ref(false)

const currentUserName = computed(() => userStore.user?.nickname || userStore.user?.username || '同学')
const currentUserInitial = computed(() => currentUserName.value.slice(0, 1).toUpperCase())

const typeOptions = [
  { value: 'essay' as PracticeType, label: '申论真题', crumb: '公务员申论', title: '申论' },
  { value: 'interview' as PracticeType, label: '面试真题', crumb: '公务员面试', title: '面试' },
]

const regionOrder = [
  '全国',
  '安徽',
  '北京',
  '福建',
  '甘肃',
  '广东',
  '广西',
  '贵州',
  '海南',
  '河北',
  '河南',
  '黑龙江',
  '湖北',
  '湖南',
  '吉林',
  '江苏',
  '江西',
  '辽宁',
  '内蒙古',
  '宁夏',
  '青海',
  '山东',
  '山西',
  '陕西',
  '上海',
  '四川',
  '天津',
  '西藏',
  '新疆',
  '云南',
  '浙江',
  '重庆',
  '深圳市考',
  '广州市考',
  '选调',
]

const currentTypeMeta = computed(() => typeOptions.find(item => item.value === selectedType.value) || typeOptions[0])
const recordCountMap = computed(() => {
  return records.value.reduce((map, record) => {
    map.set(record.paperId, (map.get(record.paperId) || 0) + 1)
    return map
  }, new Map<string, number>())
})

const filterOptions = computed<FilterOption[]>(() => {
  const systemOptions = Array.from(
    papers.value.reduce((map, paper) => {
      map.set(paper.systemLabel || paper.system, paper.systemLabel || paper.system)
      return map
    }, new Map<string, string>()),
  ).map(([value, label]) => ({
    key: `system:${value}`,
    label,
    kind: 'system' as const,
    value,
  }))

  const regionSet = new Set(papers.value.map(paper => paper.region).filter(Boolean))
  const orderedRegions = [
    ...regionOrder.filter(region => regionSet.has(region)),
    ...Array.from(regionSet).filter(region => !regionOrder.includes(region)).sort((a, b) => a.localeCompare(b, 'zh-CN')),
  ].map(region => ({
    key: `region:${region}`,
    label: region,
    kind: 'region' as const,
    value: region,
  }))

  return [{ key: 'recommend', label: '推荐', kind: 'recommend' as const }, ...systemOptions, ...orderedRegions]
})

const activeFilter = computed(() => filterOptions.value.find(item => item.key === activeFilterKey.value) || filterOptions.value[0])
const filteredPapers = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  const filter = activeFilter.value

  return papers.value.filter(paper => {
    const filterMatch =
      filter.kind === 'recommend' ||
      (filter.kind === 'system' && (paper.systemLabel === filter.value || paper.system === filter.value)) ||
      (filter.kind === 'region' && paper.region === filter.value)
    const queryMatch =
      !query ||
      [paper.title, paper.region, paper.systemLabel, paper.category, paper.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(query)
    return filterMatch && queryMatch
  })
})

onMounted(() => {
  refreshLocalState()
})

watch(
  () => route.query.type,
  value => {
    if (value === 'essay' || value === 'interview') {
      selectedType.value = value
    }
  },
)

watch(
  selectedType,
  async type => {
    activeFilterKey.value = 'recommend'
    loading.value = true
    try {
      const res: any = await realPaperApi.list({ type, pageSize: 300 })
      papers.value = (res.data?.list || []).map(mapBackendPaper)
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

watch(
  filterOptions,
  options => {
    if (!options.some(item => item.key === activeFilterKey.value)) activeFilterKey.value = 'recommend'
  },
)

function withPreview(query: Record<string, string> = {}) {
  return route.query.preview === '1' ? { preview: '1', ...query } : query
}

function routeTarget(path: string, query: Record<string, string> = {}) {
  return { path, query: withPreview(query) }
}

function chooseType(type: PracticeType) {
  if (selectedType.value === type) return
  selectedType.value = type
  router.replace(routeTarget('/papers', { type }))
}

function enterPaper(paper: RealPaper) {
  router.push(routeTarget(`/practice/${paper.id}`, { type: paper.type }))
}

function refreshLocalState() {
  records.value = readPracticeRecords()
  favoriteIds.value = new Set(readFavoritePapers().map(item => item.paperId))
}

function toggleFavorite(paper: RealPaper) {
  const favorited = toggleFavoritePaper(paper)
  refreshLocalState()
  ElMessage.success(favorited ? '已收藏到我的收藏' : '已取消收藏')
}

function paperMeta(paper: RealPaper) {
  return [
    `难度${paper.difficulty}`,
    `${paper.questionCount}题`,
    `${paper.suggestedMinutes}分钟`,
    paper.systemLabel,
    paper.region,
  ]
    .filter(Boolean)
    .join(' · ')
}
</script>

<template>
  <div class="paper-shell">
    <header class="paper-nav">
      <div class="paper-nav-inner">
        <router-link :to="routeTarget('/coach')" class="paper-brand">
          <span class="brand-mark">PQ</span>
          <strong>PolicyQuest</strong>
        </router-link>

        <button class="avatar-button" type="button" @click="router.push(routeTarget('/profile'))" :aria-label="`${currentUserName}的个人档案`">
          {{ currentUserInitial }}
        </button>
      </div>
    </header>

    <main class="paper-main">
      <div class="crumb-row">
        <button type="button" @click="router.push(routeTarget('/coach'))" aria-label="返回学习中心">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <span>{{ currentTypeMeta.crumb }}</span>
        <strong>{{ currentTypeMeta.title }}</strong>
      </div>

      <section class="filter-panel">
        <div class="type-row" aria-label="真题类型">
          <button
            v-for="item in typeOptions"
            :key="item.value"
            type="button"
            :class="{ active: selectedType === item.value }"
            @click="chooseType(item.value)"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="filter-row" aria-label="真题筛选">
          <button
            v-for="item in filterOptions"
            :key="item.key"
            type="button"
            :class="{ active: activeFilterKey === item.key }"
            @click="activeFilterKey = item.key"
          >
            {{ item.label }}
          </button>
        </div>

        <label class="paper-search">
          <el-icon><Search /></el-icon>
          <input v-model="keyword" placeholder="搜索真题、地区、系统或关键词" />
        </label>
      </section>

      <section class="paper-list-panel">
        <div class="count-row">
          <span>{{ loading ? '加载中' : `共${filteredPapers.length}套` }}</span>
        </div>

        <div v-if="filteredPapers.length" class="paper-list">
          <article
            v-for="paper in filteredPapers"
            :key="paper.id"
            class="paper-row"
            role="button"
            tabindex="0"
            @click="enterPaper(paper)"
            @keydown.enter.prevent="enterPaper(paper)"
          >
            <span class="paper-icon" aria-hidden="true"><el-icon><ArrowRight /></el-icon></span>
            <div class="paper-copy">
              <strong>{{ paper.title }}</strong>
              <small>{{ paperMeta(paper) }}</small>
            </div>
            <div class="row-side">
              <button
                type="button"
                class="favorite-button"
                :class="{ active: favoriteIds.has(paper.id) }"
                :aria-label="favoriteIds.has(paper.id) ? '取消收藏' : '收藏真题'"
                @click.stop="toggleFavorite(paper)"
              >
                <el-icon>
                  <StarFilled v-if="favoriteIds.has(paper.id)" />
                  <Star v-else />
                </el-icon>
              </button>
              <span v-if="recordCountMap.get(paper.id)" class="done-pill">完成{{ recordCountMap.get(paper.id) }}次</span>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <strong>{{ loading ? '正在读取真题库' : '没有匹配的真题' }}</strong>
          <span>{{ loading ? '数据正在从后端真题接口同步。' : '换一个地区、系统或关键词再试。' }}</span>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.paper-shell {
  min-height: 100vh;
  background: #f3f6fb;
  color: #273449;
}

.paper-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 72px;
  border-bottom: 1px solid #eef2f7;
  background: #ffffff;
}

.paper-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(1480px, calc(100vw - 48px));
  height: 100%;
  margin: 0 auto;
}

.paper-brand,
.crumb-row,
.type-row,
.filter-row,
.paper-search,
.paper-row,
.row-side {
  display: flex;
  align-items: center;
}

.paper-brand {
  gap: 10px;
  color: #1f3047;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2d7dff, #0066ff);
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
}

.paper-brand strong {
  font-size: 19px;
  font-weight: 900;
}

.avatar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: #f4b66e;
  color: #ffffff;
  font-weight: 900;
}

.paper-main {
  width: min(1380px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 26px 0 56px;
}

.crumb-row {
  gap: 10px;
  min-height: 50px;
  color: #8b96a7;
  font-weight: 800;
}

.crumb-row button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #748092;
  font-size: 20px;
}

.crumb-row strong {
  color: #1f3047;
}

.filter-panel,
.paper-list-panel {
  background: #ffffff;
  box-shadow: 0 1px 0 rgba(209, 217, 230, 0.55);
}

.filter-panel {
  display: grid;
  gap: 14px;
  padding: 18px 26px 20px;
}

.type-row,
.filter-row {
  flex-wrap: wrap;
  gap: 12px 28px;
}

.type-row button,
.filter-row button {
  min-height: 36px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #8a94a6;
  font-size: 16px;
  font-weight: 800;
}

.type-row button {
  padding: 0 18px;
}

.filter-row button {
  padding: 0 10px;
}

.type-row button.active,
.filter-row button.active {
  background: #397bf6;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(57, 123, 246, 0.18);
}

.paper-search {
  justify-self: end;
  gap: 8px;
  width: min(100%, 360px);
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid #d9e0ec;
  border-radius: 999px;
  color: #95a0b3;
}

.paper-search input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #263447;
  font-size: 15px;
}

.paper-list-panel {
  margin-top: 0;
}

.count-row {
  min-height: 46px;
  padding: 0 26px;
  border-top: 1px solid #f4f6fa;
  border-bottom: 1px solid #eef2f6;
  background: #fbfcff;
  color: #a0aabd;
  font-weight: 800;
  line-height: 46px;
}

.paper-list {
  display: grid;
  padding: 0 26px;
}

.paper-row {
  gap: 12px;
  min-height: 96px;
  border-bottom: 1px solid #eef2f6;
  background: #ffffff;
  cursor: pointer;
}

.paper-row:hover {
  background: #fbfdff;
}

.paper-icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 18px;
  border: 2px solid #b7c2d4;
  border-radius: 4px;
  color: #8290a5;
  font-size: 12px;
}

.paper-copy {
  display: grid;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.paper-copy strong {
  overflow: hidden;
  color: #26344a;
  font-size: 18px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paper-copy small {
  color: #8d98aa;
  font-size: 14px;
}

.row-side {
  justify-content: flex-end;
  gap: 12px;
  min-width: 160px;
}

.favorite-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: #f5f7fb;
  color: #a0aabd;
}

.favorite-button.active {
  background: #fff5db;
  color: #f8b92a;
}

.done-pill {
  display: grid;
  place-items: center;
  min-width: 88px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: #f5f7fb;
  color: #a0aabd;
  font-weight: 800;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 420px;
  color: #8d98aa;
  text-align: center;
}

.empty-state strong {
  color: #26344a;
  font-size: 22px;
  font-weight: 900;
}

@media (max-width: 760px) {
  .paper-nav {
    height: 68px;
  }

  .paper-nav-inner,
  .paper-main {
    width: min(100vw - 24px, 520px);
  }

  .filter-panel,
  .paper-list {
    padding-left: 16px;
    padding-right: 16px;
  }

  .type-row,
  .filter-row {
    gap: 8px;
  }

  .paper-search {
    justify-self: stretch;
    width: 100%;
  }

  .paper-row {
    align-items: flex-start;
    gap: 10px;
    min-height: 126px;
    padding: 18px 0;
  }

  .paper-copy strong {
    white-space: normal;
  }

  .row-side {
    min-width: 42px;
    flex-direction: column;
  }

  .done-pill {
    min-width: 0;
    min-height: 30px;
    padding: 0 8px;
    font-size: 12px;
  }
}
</style>
