<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi, articlesApi } from '../../api'
import { ElMessage } from 'element-plus'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailArticle = ref<any>(null)

function fmtDate(d: string | null) {
  if (!d) return '-'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.articles({ page: page.value, pageSize: 20 })
    list.value = res.data.list; total.value = res.data.total
  } catch(e) {} finally { loading.value = false }
}

async function showDetail(row: any) {
  detailVisible.value = true
  detailLoading.value = true
  detailArticle.value = row
  try {
    const res: any = await articlesApi.detail(row.id)
    detailArticle.value = res.data
  } catch (e) {
    ElMessage.error('加载详情失败')
  } finally { detailLoading.value = false }
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <h1 class="section-title">文章管理</h1>
    <el-table :data="list" v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="标题" min-width="300">
        <template #default="{ row }">
          <a class="link-title" @click.prevent="showDetail(row)">{{ row.title }}</a>
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
      <el-table-column prop="question_count" label="已出题" width="80" />
    </el-table>
    <div style="display:flex;justify-content:center;margin-top:20px">
      <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="loadData" />
    </div>

    <el-dialog v-model="detailVisible" title="文章详情" width="700px" destroy-on-close>
      <div v-if="detailLoading" style="text-align:center;padding:40px;color:var(--text-muted)">加载中...</div>
      <div v-else-if="detailArticle" class="article-detail">
        <h2 class="detail-title">{{ detailArticle.title }}</h2>
        <div class="detail-meta">
          <span v-if="detailArticle.ArticleSource?.name">{{ detailArticle.ArticleSource.name }}</span>
          <span>{{ fmtDate(detailArticle.publish_time) }}</span>
          <span v-if="detailArticle.category">{{ detailArticle.category }}</span>
          <span v-if="detailArticle.region">{{ detailArticle.region }}</span>
        </div>
        <div v-if="detailArticle.summary" class="detail-summary">{{ detailArticle.summary }}</div>
        <div v-if="detailArticle.tags?.length" class="detail-tags">
          <el-tag v-for="tag in detailArticle.tags" :key="tag" size="small" style="margin:0 4px 4px 0">{{ tag }}</el-tag>
        </div>
        <div v-if="detailArticle.content" class="detail-content">{{ detailArticle.content }}</div>
        <div class="detail-footer">
          <a v-if="detailArticle.url" :href="detailArticle.url" target="_blank" rel="noopener" class="link-title">查看原文 →</a>
          <span v-if="detailArticle.question_count" style="color:var(--text-muted);font-size:13px">已生成 {{ detailArticle.question_count }} 道题</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.link-title { color: var(--primary-light); cursor: pointer; text-decoration: none; }
.link-title:hover { text-decoration: underline; }
.article-detail { }
.detail-title { font-size: 18px; font-weight: 700; line-height: 1.5; margin-bottom: 12px; }
.detail-meta { display: flex; gap: 12px; font-size: 13px; color: var(--text-muted); margin-bottom: 16px; flex-wrap: wrap; }
.detail-summary { font-size: 14px; line-height: 1.7; color: var(--accent); padding: 12px; border-radius: 8px; background: rgba(6,182,212,0.08); margin-bottom: 16px; }
.detail-tags { margin-bottom: 16px; }
.detail-content { font-size: 14px; line-height: 2; color: var(--text-secondary); max-height: 400px; overflow-y: auto; white-space: pre-wrap; padding: 16px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); }
.detail-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; }
</style>
