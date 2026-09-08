<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const title = computed(() => String(route.meta.deferredTitle || '2.0 模块'))
const code = computed(() => String(route.meta.deferredCode || 'V2'))
</script>

<template>
  <div class="page-container deferred-page"><div class="deferred-hero glass-card"><div class="deferred-orb">2.0</div><div class="page-kicker">{{ code }}</div><h1 class="section-title">{{ title }}</h1><p>该模块已经纳入后台信息架构，但按本次需求暂不接入支付、订单与会员真实数据。积分余额和变动账本已在“用户与权益”中接入。数据模型、审计口径和验收边界已写入根目录的 2.0 迭代文档。</p><button class="btn-primary" @click="router.push('/admin/dashboard')">返回经营概览</button></div><div class="scope-grid"><div class="glass-card"><b>不做数据伪造</b><span>未接入的财务指标统一显示待接入，不以注册量或充值额替代。</span></div><div class="glass-card"><b>版本化权益</b><span>套餐和权益需带版本，价格修改不能影响历史订单。</span></div><div class="glass-card"><b>可追溯账本</b><span>积分变化、支付回调和补单都要带业务编号和审计记录。</span></div></div></div>
</template>

<style scoped>
.deferred-page{max-width:1100px}.deferred-hero{display:flex;align-items:flex-start;flex-direction:column;padding:48px;overflow:hidden}.deferred-orb{width:64px;height:64px;display:flex;align-items:center;justify-content:center;margin-bottom:28px;border-radius:18px;background:var(--gradient-1);color:#fff;font-size:16px;font-weight:900;box-shadow:var(--shadow-glow)}.section-title{margin-bottom:10px}.deferred-hero p{max-width:670px;margin:0 0 26px;color:var(--text-secondary);font-size:14px;line-height:1.8}.scope-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:15px}.scope-grid .glass-card{display:flex;flex-direction:column;gap:9px;padding:20px}.scope-grid b{font-size:14px}.scope-grid span{color:var(--text-muted);font-size:12px;line-height:1.6}@media(max-width:700px){.deferred-hero{padding:30px}.scope-grid{grid-template-columns:1fr}}
</style>
