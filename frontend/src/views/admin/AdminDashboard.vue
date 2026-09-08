<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { adminApi } from '../../api'
import { ElMessage } from 'element-plus'

const data = ref<any>(null)
const loading = ref(true)

const completionRate = computed(() => {
  if (!data.value?.totalAttempts) return '—'
  return `${((data.value.completedAttempts / data.value.totalAttempts) * 100).toFixed(1)}%`
})

const firstPaperRate = computed(() => {
  if (!data.value?.totalUsers) return '—'
  return `${((data.value.firstPaperUsers / data.value.totalUsers) * 100).toFixed(1)}%`
})

const maxTrend = computed(() => Math.max(...(data.value?.trend || []).map((item: any) => item.users + item.attempts), 1))

function money(value: number | null) {
  return value === null || value === undefined ? '—' : `¥${Number(value).toFixed(2)}`
}

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.dashboard()
    data.value = res.data
  } catch (error: any) {
    ElMessage.error(error?.message || '经营数据加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page-container admin-page">
    <div class="page-heading">
      <div>
        <div class="page-kicker">BUSINESS PULSE · TODAY</div>
        <h1 class="section-title">经营概览</h1>
        <p class="page-subtitle">把用户增长、学习完成、AI 成本与可兑现权益放在同一个经营视图里。</p>
      </div>
      <button class="btn-ghost refresh-btn" :disabled="loading" @click="loadData">↻ 刷新数据</button>
    </div>

    <div v-if="loading" class="loading-panel glass-card">正在读取经营数据…</div>
    <template v-else-if="data">
      <div class="metric-grid">
        <div class="metric-card glass-card accent-blue">
          <div class="metric-top"><span>注册用户</span><span class="metric-icon">↗</span></div>
          <strong>{{ data.totalUsers }}</strong>
          <small>今日新增 {{ data.todayUsers }} 人</small>
        </div>
        <div class="metric-card glass-card accent-cyan">
          <div class="metric-top"><span>首卷完成</span><span class="metric-icon">✓</span></div>
          <strong>{{ data.firstPaperUsers }}</strong>
          <small>注册到首卷完成 {{ firstPaperRate }}</small>
        </div>
        <div class="metric-card glass-card accent-green">
          <div class="metric-top"><span>练习完成率</span><span class="metric-icon">◎</span></div>
          <strong>{{ completionRate }}</strong>
          <small>{{ data.completedAttempts }} / {{ data.totalAttempts }} 套整卷</small>
        </div>
        <div class="metric-card glass-card accent-purple">
          <div class="metric-top"><span>AI 成本</span><span class="metric-icon">✦</span></div>
          <strong>{{ money(data.aiCost) }}</strong>
          <small>{{ data.aiTokens || 0 }} tokens · {{ data.aiTaskCount }} 次调用</small>
        </div>
      </div>

      <div class="dashboard-grid">
        <section class="glass-card trend-card">
          <div class="card-heading">
            <div><h2>近 7 天增长与使用</h2><p>注册用户与整卷提交趋势</p></div>
            <div class="legend"><span><i class="legend-dot blue"></i>注册</span><span><i class="legend-dot cyan"></i>提交</span></div>
          </div>
          <div class="trend-chart">
            <div v-for="item in data.trend" :key="item.day" class="trend-column">
              <div class="bar-stack">
                <span class="bar blue" :style="{ height: `${Math.max(item.users / maxTrend * 100, item.users ? 8 : 2)}%` }"></span>
                <span class="bar cyan" :style="{ height: `${Math.max(item.attempts / maxTrend * 100, item.attempts ? 8 : 2)}%` }"></span>
              </div>
              <span class="trend-label">{{ item.day }}</span>
            </div>
          </div>
        </section>

        <section class="glass-card finance-card">
          <div class="card-heading"><div><h2>经营金额口径</h2><p>现金、积分、待兑现权益分开统计</p></div><span class="deferred-chip">2.0 待接入</span></div>
          <div class="finance-list">
            <div><span>现金收入</span><strong>{{ money(data.finance.cashRevenue) }}</strong></div>
            <div><span>积分消费</span><strong>{{ money(data.finance.creditConsumption) }}</strong></div>
            <div><span>待兑现权益</span><strong>{{ money(data.finance.pendingEntitlements) }}</strong></div>
            <div><span>退款</span><strong>{{ money(data.finance.refunds) }}</strong></div>
            <div class="profit-row"><span>服务利润</span><strong>{{ money(data.finance.serviceProfit) }}</strong></div>
          </div>
          <p class="hint-text">当前未接入订单、支付与积分账本，以上指标不会用注册数据或充值额代替。</p>
        </section>
      </div>

      <div class="dashboard-grid lower-grid">
        <section class="glass-card data-health-card">
          <div class="card-heading"><div><h2>产品数据资产</h2><p>题库、真题和学习行为的可用规模</p></div></div>
          <div class="asset-grid">
            <div><strong>{{ data.totalPapers }}</strong><span>真题卷</span></div>
            <div><strong>{{ data.totalMaterials }}</strong><span>材料</span></div>
            <div><strong>{{ data.totalPaperQuestions }}</strong><span>申论小题</span></div>
            <div><strong>{{ data.totalQuestions }}</strong><span>客观题</span></div>
            <div><strong>{{ data.totalSessions }}</strong><span>练习会话</span></div>
            <div><strong>{{ data.totalAnswers }}</strong><span>作答记录</span></div>
          </div>
        </section>
        <section class="glass-card alert-card">
          <div class="card-heading"><div><h2>今日需要关注</h2><p>从异常状态开始排查</p></div></div>
          <div class="alert-list">
            <router-link to="/admin/quality" class="alert-item"><span class="alert-number danger">{{ data.failedAttempts }}</span><span><b>套卷批改失败</b><small>进入批改质检处理</small></span><em>→</em></router-link>
            <router-link to="/admin/ai-cost" class="alert-item"><span class="alert-number warning">{{ data.failedAiTasks }}</span><span><b>AI 任务失败</b><small>查看调用与重试原因</small></span><em>→</em></router-link>
            <router-link to="/admin/questions" class="alert-item"><span class="alert-number info">{{ data.pendingQuestions }}</span><span><b>题目待审核</b><small>教研审核后再发布</small></span><em>→</em></router-link>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-page { max-width: 1500px; }
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 26px; }
.section-title { margin-bottom: 0; }
.page-subtitle { max-width: 700px; }
.refresh-btn { min-height: 40px; padding: 0 14px; white-space: nowrap; }
.loading-panel { padding: 56px; color: var(--text-muted); text-align: center; }
.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 15px; }
.metric-card { position: relative; min-height: 142px; overflow: hidden; padding: 20px; }
.metric-card::after { position: absolute; right: -18px; bottom: -30px; width: 90px; height: 90px; border-radius: 50%; background: currentColor; content: ''; opacity: 0.06; }
.accent-blue { color: var(--primary); }.accent-cyan { color: #008faf; }.accent-green { color: #006a61; }.accent-purple { color: #744bc7; }
.metric-top { display: flex; align-items: center; justify-content: space-between; color: var(--text-secondary); font-size: 13px; font-weight: 700; }
.metric-icon { display: inline-flex; align-items: center; justify-content: center; width: 27px; height: 27px; border-radius: 8px; background: currentColor; color: #fff; font-size: 14px; }
.metric-card strong { display: block; margin-top: 17px; color: var(--text-primary); font-size: 31px; line-height: 1; }
.metric-card small { display: block; margin-top: 10px; color: var(--text-muted); font-size: 12px; }
.dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(330px, 0.8fr); gap: 15px; margin-bottom: 15px; }
.glass-card { padding: 22px; }
.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.card-heading h2 { margin: 0; color: var(--text-primary); font-size: 16px; }
.card-heading p { margin: 6px 0 0; color: var(--text-muted); font-size: 12px; }
.legend { display: flex; gap: 12px; color: var(--text-muted); font-size: 11px; white-space: nowrap; }
.legend span { display: inline-flex; align-items: center; gap: 5px; }.legend-dot { width: 7px; height: 7px; border-radius: 50%; }.legend-dot.blue { background: var(--primary); }.legend-dot.cyan { background: var(--ai); }
.trend-chart { display: flex; align-items: flex-end; justify-content: space-around; height: 190px; gap: 8px; padding: 22px 4px 0; }
.trend-column { height: 100%; display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: flex-end; gap: 9px; }
.bar-stack { width: 42px; height: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 4px; padding-top: 8px; border-bottom: 1px solid var(--border); }
.bar { width: 14px; min-height: 2px; border-radius: 5px 5px 0 0; transition: height 0.3s ease; }.bar.blue { background: var(--primary); }.bar.cyan { background: var(--ai); }
.trend-label { color: var(--text-muted); font-size: 11px; }
.deferred-chip { padding: 5px 8px; border-radius: 5px; background: var(--warning-soft); color: var(--warning); font-size: 10px; font-weight: 800; white-space: nowrap; }
.finance-list { margin-top: 18px; }.finance-list > div { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(215,221,240,0.72); color: var(--text-secondary); font-size: 13px; }.finance-list strong { color: var(--text-primary); font-size: 14px; }.finance-list .profit-row { padding-top: 14px; border-bottom: 0; color: var(--primary); font-weight: 800; }.finance-list .profit-row strong { color: var(--primary); font-size: 18px; }.hint-text { margin: 12px 0 0; color: var(--text-muted); font-size: 11px; line-height: 1.6; }
.lower-grid { grid-template-columns: minmax(0, 1fr) minmax(330px, 0.75fr); }.asset-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 18px; }.asset-grid div { padding: 14px; border-radius: 10px; background: var(--surface-soft); }.asset-grid strong { display: block; color: var(--text-primary); font-size: 22px; }.asset-grid span { display: block; margin-top: 4px; color: var(--text-muted); font-size: 11px; }
.alert-list { margin-top: 14px; }.alert-item { display: flex; align-items: center; gap: 11px; padding: 12px 0; border-bottom: 1px solid rgba(215,221,240,0.72); color: var(--text-primary); text-decoration: none; }.alert-item:last-child { border-bottom: 0; }.alert-number { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 9px; font-weight: 800; }.alert-number.danger { background: var(--danger-soft); color: var(--danger); }.alert-number.warning { background: var(--warning-soft); color: var(--warning); }.alert-number.info { background: var(--surface-muted); color: var(--primary); }.alert-item b, .alert-item small { display: block; }.alert-item b { font-size: 13px; }.alert-item small { margin-top: 3px; color: var(--text-muted); font-size: 11px; }.alert-item em { margin-left: auto; color: var(--primary); font-style: normal; font-size: 18px; }
@media (max-width: 1050px) { .metric-grid { grid-template-columns: repeat(2, 1fr); }.dashboard-grid, .lower-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .page-heading { align-items: flex-start; flex-direction: column; }.metric-grid { grid-template-columns: 1fr; }.glass-card { padding: 18px; }.asset-grid { grid-template-columns: repeat(2, 1fr); }.bar-stack { width: 32px; }.bar { width: 10px; } }
</style>
