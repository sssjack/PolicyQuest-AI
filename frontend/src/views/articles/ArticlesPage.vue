<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { articlesApi } from '../../api'

const articles = ref<any[]>([])
const loading = ref(true)
const page = ref(1)
const total = ref(0)
const keyword = ref('')
const category = ref('')
const expandedId = ref<number | null>(null)
const expandedContent = ref('')
const loadingDetail = ref(false)

const categories = [
  { value: '', label: '全部分类' },
  { value: '政策文件', label: '政策文件' },
  { value: '评论文章', label: '评论文章' },
  { value: '新闻报道', label: '新闻报道' },
  { value: '案例报道', label: '案例报道' },
  { value: '领导讲话', label: '领导讲话' },
  { value: '政策解读', label: '政策解读' },
]

async function loadArticles() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: 15 }
    if (keyword.value) params.keyword = keyword.value
    if (category.value) params.category = category.value
    const res: any = await articlesApi.list(params)
    articles.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    ElMessage.error('加载文章失败')
  } finally {
    loading.value = false
  }
}

async function toggleExpand(article: any) {
  if (expandedId.value === article.id) {
    expandedId.value = null
    return
  }
  expandedId.value = article.id
  if (article.content) {
    expandedContent.value = article.content
    return
  }
  loadingDetail.value = true
  try {
    const res: any = await articlesApi.detail(article.id)
    expandedContent.value = res.data.content || res.data.summary || '暂无详细内容'
  } catch (e) {
    expandedContent.value = article.summary || '暂无内容'
  } finally {
    loadingDetail.value = false
  }
}

function search() {
  page.value = 1
  loadArticles()
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(loadArticles)
</script>

<template>
  <div class="articles-page page-container">
    <section class="articles-hero">
      <div>
        <p class="page-kicker">Policy Library</p>
        <h1 class="page-title">时政素材库</h1>
        <p class="page-subtitle">沉淀政策文件、评论文章、新闻案例和政策解读，给申论与面试表达补充新鲜素材。</p>
      </div>
      <div class="article-total">
        <strong>{{ total }}</strong>
        <span>篇素材</span>
      </div>
    </section>

    <section class="filter-bar glass-card">
      <div class="search-box">
        <input v-model="keyword" class="form-control" placeholder="搜索文章标题、关键词..." @keyup.enter="search" />
        <button class="btn-primary" type="button" @click="search">搜索</button>
      </div>
      <div class="category-filter">
        <button v-for="item in categories" :key="item.value" type="button" class="cat-btn" :class="{ active: category === item.value }" @click="category = item.value; search()">
          {{ item.label }}
        </button>
      </div>
    </section>

    <div v-if="loading" class="loading-card glass-card">正在加载素材...</div>

    <section v-else-if="articles.length === 0" class="empty-card glass-card">
      <h2>暂无符合条件的文章</h2>
      <p>换一个关键词或分类再试试。</p>
    </section>

    <section v-else class="article-list">
      <article v-for="item in articles" :key="item.id" class="article-card glass-card">
        <button class="article-header" type="button" @click="toggleExpand(item)">
          <span v-if="item.category" class="chip">{{ item.category }}</span>
          <h2>{{ item.title }}</h2>
          <span class="expand-text">{{ expandedId === item.id ? '收起' : '展开' }}</span>
        </button>

        <div class="article-meta">
          <span>{{ item.ArticleSource?.name || '未知来源' }}</span>
          <span v-if="item.publish_time">{{ formatDate(item.publish_time) }}</span>
          <span v-if="item.region">{{ item.region }}</span>
          <span v-if="item.question_count">已生成 {{ item.question_count }} 题</span>
        </div>

        <p v-if="item.summary" class="article-summary">{{ item.summary }}</p>

        <div v-if="item.tags?.length" class="article-tags">
          <span v-for="tag in item.tags" :key="tag" class="chip success">{{ tag }}</span>
        </div>

        <div v-if="expandedId === item.id" class="article-body">
          <div v-if="loadingDetail" class="detail-loading">加载全文中...</div>
          <div v-else class="article-content">{{ expandedContent }}</div>
          <div class="article-footer">
            <a v-if="item.url" :href="item.url" target="_blank" rel="noopener">查看原文</a>
          </div>
        </div>
      </article>
    </section>

    <div v-if="total > 15" class="pagination-row">
      <el-pagination v-model:current-page="page" :page-size="15" :total="total" layout="prev, pager, next" @current-change="loadArticles" />
    </div>
  </div>
</template>

<style scoped>
.articles-page {
  display: grid;
  gap: 20px;
}

.articles-hero {
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

.article-total {
  display: grid;
  place-items: center;
  width: 132px;
  height: 132px;
  border-radius: 26px;
  background: var(--surface-muted);
  color: var(--primary);
}

.article-total strong {
  font-size: 42px;
  line-height: 1;
}

.article-total span {
  font-size: 13px;
  font-weight: 900;
}

.filter-bar {
  display: grid;
  gap: 16px;
}

.search-box {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.category-filter,
.article-meta,
.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cat-btn {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 900;
}

.cat-btn.active {
  border-color: var(--primary);
  background: var(--primary);
  color: #ffffff;
}

.loading-card,
.empty-card {
  display: grid;
  place-items: center;
  gap: 12px;
  min-height: 240px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-card h2,
.empty-card p {
  margin: 0;
}

.article-list {
  display: grid;
  gap: 14px;
}

.article-card {
  display: grid;
  gap: 12px;
  padding: 0;
  overflow: hidden;
}

.article-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 22px 22px 0;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  text-align: left;
}

.article-header h2 {
  margin: 0;
  font-size: 19px;
  line-height: 1.45;
}

.expand-text {
  color: var(--primary);
  font-size: 13px;
  font-weight: 900;
}

.article-meta {
  padding: 0 22px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.article-meta span {
  min-height: 24px;
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--surface-muted);
}

.article-summary {
  margin: 0;
  padding: 0 22px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.8;
}

.article-tags {
  padding: 0 22px 20px;
}

.article-body {
  border-top: 1px solid var(--border);
  background: #fbfcff;
}

.detail-loading {
  padding: 24px;
  color: var(--text-muted);
  text-align: center;
}

.article-content {
  max-height: 520px;
  overflow: auto;
  padding: 22px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 2;
  white-space: pre-wrap;
}

.article-footer {
  display: flex;
  justify-content: flex-end;
  padding: 14px 22px;
  border-top: 1px solid var(--border);
}

.article-footer a {
  font-weight: 900;
}

.pagination-row {
  display: flex;
  justify-content: center;
}

@media (max-width: 720px) {
  .articles-hero,
  .search-box {
    display: grid;
  }

  .article-total {
    width: 100%;
    height: 104px;
  }

  .article-header {
    grid-template-columns: 1fr auto;
  }

  .article-header .chip {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .search-box button {
    width: 100%;
  }
}
</style>
