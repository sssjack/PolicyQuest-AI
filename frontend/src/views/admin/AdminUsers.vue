<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '../../api'
import { ElMessage } from 'element-plus'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const filters = ref({ keyword: '', role: '', status: '' })

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.users({ page: page.value, pageSize: 20, ...filters.value })
    list.value = res.data.list; total.value = res.data.total
  } catch(e) {} finally { loading.value = false }
}

async function toggleStatus(id: number, current: string) {
  const newStatus = current === 'active' ? 'banned' : 'active'
  await adminApi.updateUserStatus(id, newStatus)
  ElMessage.success(newStatus === 'banned' ? '已禁用' : '已启用')
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <h1 class="section-title">用户管理</h1>
    <div style="display:flex;gap:12px;margin-bottom:20px">
      <el-input v-model="filters.keyword" placeholder="搜索用户名/邮箱" clearable style="width:240px" @change="page=1;loadData()" />
      <el-select v-model="filters.role" placeholder="角色" clearable style="width:120px" @change="page=1;loadData()">
        <el-option label="用户" value="user" /><el-option label="管理员" value="admin" />
      </el-select>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="email" label="邮箱" width="200" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">{{ row.role === 'admin' ? '管理员' : '用户' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="total_questions" label="做题数" width="80" />
      <el-table-column label="正确率" width="80">
        <template #default="{ row }">{{ row.total_questions > 0 ? (row.correct_count / row.total_questions * 100).toFixed(0) + '%' : '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">{{ row.status === 'active' ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button :type="row.status === 'active' ? 'danger' : 'success'" size="small" @click="toggleStatus(row.id, row.status)">
            {{ row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="display:flex;justify-content:center;margin-top:20px">
      <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" @current-change="loadData" />
    </div>
  </div>
</template>
