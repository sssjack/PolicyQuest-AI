<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '../../api'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.articles({ page: page.value, pageSize: 20 })
    list.value = res.data.list; total.value = res.data.total
  } catch(e) {} finally { loading.value = false }
}
onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <h1 class="section-title">文章管理</h1>
    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" min-width="300" />
      <el-table-column label="来源" width="120">
        <template #default="{ row }">{{ row.ArticleSource?.name || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><el-tag size="small">{{ row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="question_count" label="已出题" width="80" />
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">{{ new Date(row.created_at).toLocaleString() }}</template>
      </el-table-column>
    </el-table>
    <div style="display:flex;justify-content:center;margin-top:20px">
      <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="loadData" />
    </div>
  </div>
</template>
