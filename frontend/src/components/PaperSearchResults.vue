<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { realPaperApi } from '../api'
import type { PracticeType } from '../data/policyQuest'

type SearchItem = {
  questionId: string; paperId: string; questionNo: number; title: string
  paperTitle: string; year: number; region: string; type: PracticeType
  excerpt: string; excerptSource: string
}
type SearchGroup = { type: PracticeType; total: number; page: number; pageSize: number; list: SearchItem[] }
type SearchResult = { total: number; groups: Record<PracticeType, SearchGroup> }
const props = defineProps<{ keyword: string; activeType: 'all' | PracticeType }>()
defineEmits<{ clear: [] }>()
const route = useRoute()
const result = ref<SearchResult | null>(null)
const loading = ref(false)
const error = ref('')
const pages = ref({ essayPage: 1, interviewPage: 1 })
let controller: AbortController | undefined
const groups = computed(() => (['essay', 'interview'] as const)
  .filter(type => props.activeType === 'all' || props.activeType === type)
  .map(type => result.value?.groups[type]).filter((group): group is SearchGroup => Boolean(group)))

async function search() {
  controller?.abort()
  const request = new AbortController()
  controller = request
  loading.value = true
  error.value = ''
  try {
    const response = await realPaperApi.search({ keyword: props.keyword, ...pages.value }, request.signal)
    if (request.signal.aborted) return
    result.value = response.data
  } catch (cause: any) {
    if (!request.signal.aborted) error.value = cause?.message || '搜索暂时失败，请重试'
  } finally {
    if (!request.signal.aborted) loading.value = false
  }
}

function changePage(type: PracticeType, page: number) {
  pages.value[type === 'essay' ? 'essayPage' : 'interviewPage'] = page
  void search()
}

function highlight(text: string) {
  const parts: Array<{ text: string; match: boolean }> = []
  const lower = text.toLowerCase()
  const keyword = props.keyword.toLowerCase()
  if (!keyword) return [{ text, match: false }]
  let start = 0
  let index = lower.indexOf(keyword)
  while (index >= 0) {
    parts.push({ text: text.slice(start, index), match: false }, { text: text.slice(index, index + keyword.length), match: true })
    start = index + keyword.length
    index = lower.indexOf(keyword, start)
  }
  parts.push({ text: text.slice(start), match: false })
  return parts
}

function practiceTarget(item: SearchItem) {
  return {
    path: `/practice/${item.paperId}`,
    query: { type: item.type, questionId: item.questionId, ...(route.query.preview === '1' ? { preview: '1' } : {}) },
  }
}

watch(() => props.keyword, () => {
  pages.value = { essayPage: 1, interviewPage: 1 }
  result.value = null
  void search()
}, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <section class="search-results" aria-label="试题搜索结果" :aria-busy="loading">
    <header class="results-heading">
      <div>
        <h2>“{{ keyword }}”的搜索结果</h2>
        <p aria-live="polite">{{ loading ? '正在搜索题库…' : error ? '搜索未完成' : `共找到 ${result?.total || 0} 道题` }} · 按年份从新到旧排序</p>
      </div>
      <button type="button" class="clear-search" @click="$emit('clear')">清除搜索</button>
    </header>
    <div v-if="error" class="search-state" role="alert">
      <p>{{ error }}</p><button type="button" class="clear-search" @click="search">重新搜索</button>
    </div>
    <div v-else-if="loading" class="search-state" role="status">正在查找匹配的题目和正文…</div>
    <div v-else class="result-groups">
      <section v-for="group in groups" :key="group.type" class="result-group" :aria-label="group.type === 'essay' ? '申论搜索结果' : '面试搜索结果'">
        <h3 :class="group.type">{{ group.type === 'essay' ? '申论' : '面试' }} <span>{{ group.total }} 道题</span></h3>
        <p v-if="!group.total" class="search-state">没有找到相关{{ group.type === 'essay' ? '申论' : '面试' }}题目，请尝试其他关键词。</p>
        <ol v-else class="result-list">
          <li v-for="item in group.list" :key="item.questionId">
            <router-link :to="practiceTarget(item)" class="result-link">
              <div class="result-meta"><span>{{ item.year }} 年</span><span>{{ item.region }}</span><span>第 {{ item.questionNo }} 题</span></div>
              <h4><template v-for="(part, index) in highlight(item.title)" :key="index"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></h4>
              <p class="paper-name"><template v-for="(part, index) in highlight(item.paperTitle)" :key="index"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></p>
              <p class="excerpt"><b>{{ item.excerptSource }}：</b><template v-for="(part, index) in highlight(item.excerpt)" :key="index"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></p>
              <span class="start-practice">去做这道题 →</span>
            </router-link>
          </li>
        </ol>
        <nav v-if="group.total > group.pageSize" class="result-pagination" :aria-label="`${group.type === 'essay' ? '申论' : '面试'}结果翻页`">
          <button type="button" :disabled="group.page <= 1" @click="changePage(group.type, group.page - 1)">上一页</button>
          <span>{{ group.page }} / {{ Math.ceil(group.total / group.pageSize) }}</span>
          <button type="button" :disabled="group.page * group.pageSize >= group.total" @click="changePage(group.type, group.page + 1)">下一页</button>
        </nav>
      </section>
    </div>
  </section>
</template>

<style scoped>
.search-results { color: #263447; }
.results-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.results-heading h2 { margin: 0; font-size: 22px; overflow-wrap: anywhere; }
.results-heading p { margin: 8px 0 0; color: #69788e; font-size: 14px; }
.clear-search, .result-pagination button { border: 1px solid #d8e3f7; border-radius: 8px; padding: 9px 14px; background: white; color: #316fe8; cursor: pointer; white-space: nowrap; }
.result-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; align-items: start; }
.result-group { min-width: 0; border: 1px solid #e3e9f3; border-radius: 12px; background: white; overflow: hidden; }
.result-group h3 { display: flex; align-items: center; gap: 12px; margin: 0; padding: 20px 24px; background: #edf4ff; color: #316fe8; }
.result-group h3.interview { background: #e9faf4; color: #087d60; }
.result-group h3 span { font-size: 13px; font-weight: 500; }
.result-list { list-style: none; padding: 0; margin: 0; }
.result-list li + li { border-top: 1px solid #edf0f5; }
.result-link { display: block; padding: 22px 24px; color: inherit; text-decoration: none; overflow-wrap: anywhere; }
.result-link:hover { background: #f7faff; }
.result-link:focus-visible, button:focus-visible { outline: 2px solid #316fe8; outline-offset: -2px; }
.result-meta { display: flex; flex-wrap: wrap; gap: 12px; color: #69788e; font-size: 13px; }
.result-meta span:first-child { color: #316fe8; font-weight: 700; }
.result-link h4 { margin: 10px 0 8px; font-size: 17px; line-height: 1.6; }
.paper-name { color: #69788e; font-size: 13px; line-height: 1.6; margin: 0; }
.excerpt { margin: 12px 0; color: #4d5d73; font-size: 14px; line-height: 1.8; }
.excerpt b { font-weight: 500; }
mark { background: #fff0b8; color: inherit; border-radius: 2px; }
.start-practice { font-size: 14px; font-weight: 700; color: #316fe8; }
.search-state { padding: 32px 24px; text-align: center; color: #69788e; line-height: 1.8; }
.result-pagination { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 18px; border-top: 1px solid #edf0f5; font-size: 14px; }
.result-pagination button:disabled { cursor: default; color: #8d98a8; background: #f4f6fa; }
@media (max-width: 760px) { .result-groups { grid-template-columns: 1fr; } .results-heading { align-items: flex-start; } .results-heading h2 { font-size: 18px; } .result-link { padding: 18px; } }
</style>
