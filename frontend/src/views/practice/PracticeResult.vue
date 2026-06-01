<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="page-container" style="text-align:center;padding-top:80px">
    <div style="font-size:60px;margin-bottom:20px">🎉</div>
    <h1 style="font-size:28px;margin-bottom:12px">练习完成！</h1>
    <p style="color:var(--text-muted);margin-bottom:40px">你的练习结果已保存，前往学习中心查看详细统计</p>
    <div style="display:flex;gap:16px;justify-content:center">
      <button class="btn-primary" @click="router.push('/app/dashboard')">返回学习中心</button>
      <button class="btn-ghost" @click="router.push('/app/practice')">再练一组</button>
      <button class="btn-ghost" @click="router.push('/app/wrongbook')">查看错题</button>
    </div>
  </div>
</template>
