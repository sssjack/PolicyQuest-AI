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
import UserAccountMenu from '../../components/UserAccountMenu.vue'
import PaperSearchResults from '../../components/PaperSearchResults.vue'

type FilterKind = 'recommend' | 'system' | 'region'
type FilterOption = {
  key: string
  label: string
  kind: FilterKind
  value?: string
}

const route = useRoute()
const router = useRouter()

const selectedType = ref<PracticeType>(route.query.type === 'interview' ? 'interview' : 'essay')
const activeFilterKey = ref('recommend')
const keyword = ref('')
const searchKeyword = computed(() => typeof route.query.keyword === 'string' ? route.query.keyword.trim() : '')
watch(searchKeyword, value => { keyword.value = value }, { immediate: true })

function submitSearch() {
  router.replace({ query: { ...route.query, keyword: keyword.value.trim() || undefined } })
}

function clearSearch() {
  keyword.value = ''
  submitSearch()
}
const records = ref<PracticeRecord[]>([])
const favoriteIds = ref(new Set<string>())
const papers = ref<RealPaper[]>([])
const loading = ref(false)
const selectedYear = ref('all')
const selectedCategory = ref('all')
const selectedQuestionType = ref(String(route.query.questionType || 'all'))
const coverage = ref<any>(null)
let loadVersion = 0
const categories = computed(() => [...new Set(papers.value.map(p => p.category))].sort())


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
  const filter = activeFilter.value

  return papers.value.filter(paper => {
    const filterMatch =
      filter.kind === 'recommend' ||
      (filter.kind === 'system' && (paper.systemLabel === filter.value || paper.system === filter.value)) ||
      (filter.kind === 'region' && paper.region === filter.value)
    return filterMatch && (selectedYear.value === 'all' || String(paper.year) === selectedYear.value) && (selectedCategory.value === 'all' || paper.category === selectedCategory.value)
  })
})

onMounted(() => {
  refreshLocalState()
  realPaperApi.coverage().then((res: any) => { coverage.value = res.data }).catch(() => {})
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
  [selectedType, selectedQuestionType],
  async ([type, questionType], previous) => {
    const version = ++loadVersion
    if (type !== previous?.[0]) { selectedYear.value = 'all'; selectedCategory.value = 'all' }
    activeFilterKey.value = 'recommend'
    loading.value = true
    try {
      const all: any[] = []
      let page = 1
      let total = 1
      while (all.length < total) {
        const res: any = await realPaperApi.list({ type, questionType: type === 'essay' ? questionType : 'all', page, pageSize: 300 })
        const batch = res.data?.list || []
        total = Number(res.data?.total) || 0
        all.push(...batch)
        if (!batch.length) break
        page += 1
      }
      if (version === loadVersion) papers.value = all.map(mapBackendPaper)
    } catch { ElMessage.error('题库加载失败，请重试')
    } finally {
      if (version === loadVersion) loading.value = false
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

        <UserAccountMenu />
      </div>
    </header>

    <main class="paper-main">
      <div class="crumb-row">
        <button type="button" @click="router.push(routeTarget('/coach'))" aria-label="返回学习中心">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <span>{{ searchKeyword ? '全部真题' : currentTypeMeta.crumb }}</span>
        <strong>{{ searchKeyword ? '试题搜索' : currentTypeMeta.title }}</strong>
      </div>

      <section class="filter-panel">
        <div v-if="!searchKeyword" class="type-row" aria-label="真题类型">
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

        <div v-if="!searchKeyword" class="filter-row" aria-label="真题筛选">
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

        <form class="paper-search" role="search" @submit.prevent="submitSearch">
          <input v-model="keyword" aria-label="搜索题目或正文" placeholder="搜索题目或正文" type="search" maxlength="100" @input="!keyword.trim() && clearSearch()" />
          <button class="search-submit" type="submit" aria-label="搜索"><el-icon><Search /></el-icon></button>
        </form>
      </section>

      <PaperSearchResults v-if="searchKeyword" class="library-search-results" :keyword="searchKeyword" active-type="all" @clear="clearSearch" />
      <section v-else class="paper-list-panel">
        <div class="extra-filters">
          <label>年份 <select v-model="selectedYear"><option value="all">全部年份</option><option v-for="year in [...new Set(papers.map(p => p.year))].sort((a,b) => b-a)" :key="year" :value="String(year)">{{ year }}年</option></select></label>
          <label>卷别 <select v-model="selectedCategory"><option value="all">全部卷别</option><option v-for="category in categories" :key="category">{{ category }}</option></select></label>
          <label v-if="selectedType === 'essay'">题型 <select v-model="selectedQuestionType"><option value="all">全部题型</option><option value="summary">归纳概括</option><option value="analysis">综合分析</option><option value="solution">提出对策</option><option value="implementation">贯彻执行</option><option value="article">大作文</option></select></label>
        </div>
        <details v-if="coverage && selectedType === 'essay'" class="coverage"><summary>近五年收录覆盖情况（2022—2026）</summary><p>{{ coverage.note }}</p><div class="coverage-scroll"><table><thead><tr><th>地区</th><th v-for="year in coverage.years" :key="year">{{ year }}</th></tr></thead><tbody><tr v-for="row in coverage.rows" :key="row.region"><th>{{ row.region }}</th><td v-for="cell in row.years" :key="cell.year" :title="cell.papers.map((p: any) => p.category).join('、')">{{ cell.papers.length ? `${cell.papers.length}套` : '待补充' }}</td></tr></tbody></table></div></details>
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
          <span>{{ loading ? '数据正在从后端真题接口同步。' : '请调整地区、系统、年份或卷别筛选，或搜索题目和正文。' }}</span>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.extra-filters{display:flex;gap:16px;flex-wrap:wrap;padding:18px 0}.extra-filters label{display:flex;gap:8px;align-items:center}.extra-filters select{padding:8px;border:1px solid #cbd5e1;border-radius:6px;max-width:180px;background:white}.coverage{padding:16px;background:#f6f8fc;border-radius:10px;margin-bottom:18px}.coverage summary{cursor:pointer}.coverage p{font-size:13px;line-height:1.8}.coverage-scroll{overflow:auto;max-height:400px}.coverage table{width:100%;border-collapse:collapse;white-space:nowrap}.coverage th,.coverage td{padding:9px;border-bottom:1px solid #dde4ed;text-align:left}
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

.search-submit { display: grid; place-items: center; flex: none; width: 32px; min-height: 36px; padding: 0; border: 0; background: transparent; color: #397bf6; cursor: pointer; font-size: 20px; }
.paper-search:focus-within { border-color: #397bf6; box-shadow: 0 0 0 3px #397bf61a; }
.library-search-results { margin-top: 24px; }

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
    height: 60px;
  }

  .paper-nav-inner,
  .paper-main {
    width: min(100vw - 20px, 520px);
  }

  .paper-brand strong {
    font-size: 17px;
  }

  .avatar-button {
    width: 34px;
    height: 34px;
  }

  .filter-panel,
  .paper-list {
    padding-left: 14px;
    padding-right: 14px;
  }

  .type-row,
  .filter-row {
    gap: 8px;
  }

  .type-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .type-row button {
    width: 100%;
  }

  .filter-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .filter-row::-webkit-scrollbar {
    display: none;
  }

  .filter-row button {
    flex: 0 0 auto;
    min-height: 34px;
    padding: 0 12px;
    font-size: 14px;
  }

  .paper-search {
    justify-self: stretch;
    width: 100%;
  }

  .paper-row {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 104px;
    padding: 14px 0;
  }

  .paper-copy strong {
    font-size: 16px;
    white-space: normal;
  }

  .paper-copy small {
    line-height: 1.5;
  }

  .row-side {
    min-width: 42px;
    flex-direction: column;
    gap: 6px;
  }

  .done-pill {
    min-width: 0;
    min-height: 30px;
    padding: 0 8px;
    font-size: 12px;
  }
}
</style>
