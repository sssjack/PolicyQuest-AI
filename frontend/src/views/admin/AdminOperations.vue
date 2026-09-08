<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminApi } from '../../api'
import { ElMessage } from 'element-plus'

const data = ref<any>(null)
const loading = ref(true)
onMounted(async () => {
  try { const res: any = await adminApi.dashboard(); data.value = res.data }
  catch (error: any) { ElMessage.error(error?.message || '运营数据加载失败') }
  finally { loading.value = false }
})
</script>

<template>
  <div class="page-container admin-page">
    <div class="page-heading"><div><div class="page-kicker">RETENTION & GROWTH</div><h1 class="section-title">运营与留存</h1><p class="page-subtitle">围绕新人体验、训练提醒、复购与流失建立活动成本和付费贡献的统一口径。</p></div></div>
    <div v-if="loading" class="glass-card loading-panel">正在读取运营数据…</div>
    <template v-else-if="data">
      <div class="signal-grid"><div class="glass-card signal-card"><span>今日新增</span><strong>{{ data.todayUsers }}</strong><small>新注册用户</small></div><div class="glass-card signal-card"><span>首卷完成</span><strong>{{ data.firstPaperUsers }}</strong><small>完成过整卷练习的用户</small></div><div class="glass-card signal-card"><span>近 7 天提交</span><strong>{{ data.trend.reduce((sum: number, item: any) => sum + item.attempts, 0) }}</strong><small>整卷提交次数</small></div><div class="glass-card signal-card"><span>可追踪成本</span><strong>¥{{ Number(data.aiCost || 0).toFixed(2) }}</strong><small>AI 任务成本</small></div></div>
      <div class="operations-grid"><section class="glass-card"><div class="card-heading"><div><h2>运营动作台</h2><p>先沉淀活动数据结构，再接入触达渠道</p></div><span class="deferred-chip">2.0 数据模型</span></div><div class="action-list"><div><span class="action-icon blue">N</span><div><b>新人体验</b><small>注册 → 首次练习 → 首卷完成</small></div><em>待配置</em></div><div><span class="action-icon cyan">R</span><div><b>训练提醒</b><small>按最近练习与错误画像触达</small></div><em>待配置</em></div><div><span class="action-icon green">↗</span><div><b>复购与流失</b><small>会员续费、沉默用户、权益消耗</small></div><em>待支付接入</em></div></div></section><section class="glass-card"><div class="card-heading"><div><h2>活动成本台账</h2><p>每个活动需要能回答“带来多少付费，产生多少成本”</p></div></div><div class="empty-box"><div class="empty-mark">◎</div><b>暂无活动台账</b><p>订单、优惠券、渠道费用和归因模型将在 2.0 版本接入。</p></div></section></div>
    </template>
  </div>
</template>

<style scoped>
.admin-page{max-width:1500px}.page-heading{margin-bottom:24px}.section-title{margin-bottom:0}.loading-panel{padding:54px;text-align:center;color:var(--text-muted)}.signal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:15px}.signal-card{padding:18px}.signal-card span,.signal-card small{display:block;color:var(--text-muted);font-size:12px}.signal-card strong{display:block;margin:15px 0 6px;color:var(--text-primary);font-size:28px}.operations-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:15px}.glass-card{padding:22px}.card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.card-heading h2{margin:0;font-size:16px}.card-heading p{margin:6px 0 0;color:var(--text-muted);font-size:12px}.deferred-chip{padding:5px 8px;border-radius:5px;background:var(--warning-soft);color:var(--warning);font-size:10px;font-weight:800;white-space:nowrap}.action-list{margin-top:16px}.action-list>div{display:flex;align-items:center;gap:11px;padding:14px 0;border-bottom:1px solid var(--border)}.action-list>div:last-child{border-bottom:0}.action-icon{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;font-weight:800}.action-icon.blue{background:var(--surface-muted);color:var(--primary)}.action-icon.cyan{background:var(--ai-soft);color:var(--ai-strong)}.action-icon.green{background:var(--success-soft);color:var(--success)}.action-list b,.action-list small{display:block}.action-list b{font-size:13px}.action-list small{margin-top:3px;color:var(--text-muted);font-size:11px}.action-list em{margin-left:auto;color:var(--warning);font-style:normal;font-size:11px}.empty-box{display:flex;align-items:center;flex-direction:column;justify-content:center;min-height:220px;color:var(--text-primary);text-align:center}.empty-mark{width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin-bottom:11px;border-radius:50%;background:var(--surface-muted);color:var(--primary);font-size:23px}.empty-box p{max-width:260px;margin:8px 0 0;color:var(--text-muted);font-size:12px;line-height:1.6}@media(max-width:900px){.signal-grid{grid-template-columns:repeat(2,1fr)}.operations-grid{grid-template-columns:1fr}}@media(max-width:550px){.signal-grid{grid-template-columns:1fr}}
</style>
