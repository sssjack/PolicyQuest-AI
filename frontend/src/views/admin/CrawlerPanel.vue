<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '../../api'
import { ElMessage } from 'element-plus'

const status = ref<any>(null)
const loading = ref(true)
const crawling = ref(false)
const processing = ref(false)

const articles = ref<any[]>([])
const articleTotal = ref(0)
const articlePage = ref(1)
const articleLoading = ref(false)

function fmtDate(d: string | null) {
  if (!d) return '-'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function fmtTime(t: string | null) {
  if (!t) return '尚未执行'
  const d = new Date(t)
  if (isNaN(d.getTime())) return '尚未执行'
  return d.toLocaleString('zh-CN')
}

async function loadStatus() {
  try {
    const res: any = await adminApi.crawlerStatus()
    status.value = res.data
  } catch (e) {}
}

async function loadArticles() {
  articleLoading.value = true
  try {
    const res: any = await adminApi.articles({ page: articlePage.value, pageSize: 15, status: 'pending' })
    articles.value = res.data.list
    articleTotal.value = res.data.total
  } catch (e) {} finally { articleLoading.value = false }
}

async function triggerCrawl() {
  crawling.value = true
  try {
    const res: any = await adminApi.triggerCrawl()
    ElMessage.success(res.message)
    setTimeout(() => { loadStatus(); loadArticles() }, 10000)
  } catch (e: any) { ElMessage.error(e.message || '采集失败') }
  finally { setTimeout(() => { crawling.value = false }, 30000) }
}

async function triggerProcess() {
  processing.value = true
  try {
    const res: any = await adminApi.triggerProcess()
    ElMessage.success(res.message)
    setTimeout(() => { loadStatus(); loadArticles() }, 20000)
  } catch (e: any) { ElMessage.error(e.message || '处理失败') }
  finally { setTimeout(() => { processing.value = false }, 60000) }
}

async function processOne(articleId: number) {
  try {
    ElMessage.info('正在处理文章并生成题目...')
    const res: any = await adminApi.processArticle(articleId)
    ElMessage.success(res.message)
    loadArticles()
    loadStatus()
  } catch (e: any) { ElMessage.error(e.message || '处理失败') }
}

onMounted(() => { loadStatus(); loadArticles(); loading.value = false })
</script>

<template>
  <div class="page-container">
    <h1 class="section-title">内容采集中心</h1>

    <div class="status-grid">
      <div class="glass-card stat-box">
        <div class="stat-label">文章总数</div>
        <div class="stat-value">{{ status?.articles?.total || 0 }}</div>
      </div>
      <div class="glass-card stat-box">
        <div class="stat-label">待处理</div>
        <div class="stat-value" style="color:var(--warning)">{{ status?.articles?.pending || 0 }}</div>
      </div>
      <div class="glass-card stat-box">
        <div class="stat-label">已处理</div>
        <div class="stat-value" style="color:var(--success)">{{ status?.articles?.processed || 0 }}</div>
      </div>
      <div class="glass-card stat-box">
        <div class="stat-label">待审核题目</div>
        <div class="stat-value" style="color:var(--primary-light)">{{ status?.pendingQuestions || 0 }}</div>
      </div>
    </div>

    <div class="action-row">
      <div class="glass-card" style="flex:1;padding:20px">
        <h3 style="margin-bottom:12px">采集控制</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
          自动采集：每4小时一次 | 上次采集：{{ fmtTime(status?.crawl?.lastTime) }}
        </p>
        <div style="display:flex;gap:12px">
          <el-button type="primary" :loading="crawling" @click="triggerCrawl">
            {{ crawling ? '采集中...' : '立即采集' }}
          </el-button>
          <el-button type="success" :loading="processing" @click="triggerProcess">
            {{ processing ? '处理中...' : '处理待分析文章 (AI标签+出题)' }}
          </el-button>
        </div>
        <div v-if="status?.crawl?.lastResult" style="margin-top:12px;font-size:13px;color:var(--text-secondary)">
          上次采集结果：新增 {{ status.crawl.lastResult.success || 0 }} 篇，
          跳过 {{ status.crawl.lastResult.skipped || 0 }} 篇，
          失败 {{ status.crawl.lastResult.failed || 0 }} 篇
        </div>
        <div v-if="status?.process?.lastResult" style="margin-top:8px;font-size:13px;color:var(--text-secondary)">
          上次处理结果：处理 {{ status.process.lastResult.processed || 0 }} 篇，
          生成 {{ status.process.lastResult.questions_generated || 0 }} 道题目
        </div>
      </div>
    </div>

    <div style="margin-top:32px">
      <h2 style="font-size:18px;font-weight:600;margin-bottom:16px">待处理文章</h2>
      <el-table :data="articles" v-loading="articleLoading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="300">
          <template #default="{ row }">
            <a v-if="row.url" :href="row.url" target="_blank" style="color:var(--primary-light)">{{ row.title }}</a>
            <span v-else>{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="120">
          <template #default="{ row }">{{ row.ArticleSource?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="发布日期" width="120">
          <template #default="{ row }">{{ fmtDate(row.publish_time) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'processed' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">
              {{ row.status === 'processed' ? '已处理' : row.status === 'failed' ? '失败' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="processOne(row.id)">AI分析+出题</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="display:flex;justify-content:center;margin-top:16px">
        <el-pagination v-model:current-page="articlePage" :page-size="15" :total="articleTotal" layout="prev, pager, next" @current-change="loadArticles" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-box { text-align: center; padding: 20px; }
.stat-label { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 800; }
.action-row { display: flex; gap: 16px; }
</style>
