<script setup lang="ts">
import { computed } from 'vue'
import type { AccountNotice } from '../data/notifications'

const props = defineProps<{ notice: AccountNotice | null }>()
const emit = defineEmits<{ close: [] }>()
const visible = computed({
  get: () => Boolean(props.notice),
  set: value => { if (!value) emit('close') },
})
</script>

<template>
  <el-dialog v-model="visible" title="消息详情" width="min(680px, calc(100vw - 32px))" append-to-body destroy-on-close>
    <article v-if="notice" class="notification-detail">
      <h2>{{ notice.title }}</h2>
      <p class="notification-date">{{ notice.publishedAt ? new Date(notice.publishedAt).toLocaleString('zh-CN') : '功能预告' }}</p>
      <div class="notification-body">{{ notice.content }}</div>
    </article>
    <template #footer><el-button type="primary" @click="emit('close')">关闭</el-button></template>
  </el-dialog>
</template>

<style scoped>
.notification-detail { color: #263447; }
.notification-detail h2 { margin: 0 0 10px; font-size: 21px; line-height: 1.5; overflow-wrap: anywhere; }
.notification-date { margin: 0 0 20px; color: #7b899b; font-size: 12px; }
.notification-body { max-height: 55vh; overflow-y: auto; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 15px; line-height: 1.9; }
</style>
