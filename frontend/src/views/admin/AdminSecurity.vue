<script setup lang="ts">
import { ref } from 'vue'

const roles = ref([
  { name: '超级管理员', scope: '全量模块与敏感操作审批', members: 1, tone: 'danger' },
  { name: '客服', scope: '用户状态、申诉、练习记录', members: 0, tone: 'blue' },
  { name: '教研', scope: '题库、真题、批改质检', members: 0, tone: 'green' },
  { name: '财务', scope: '套餐、订单、积分账本', members: 0, tone: 'purple' },
])
</script>

<template>
  <div class="page-container admin-page"><div class="page-heading"><div><div class="page-kicker">GOVERNANCE & AUDIT</div><h1 class="section-title">权限与审计</h1><p class="page-subtitle">客服、教研、财务分权；所有敏感变更都需要留下操作人、原因和审批链。</p></div></div><div class="security-banner glass-card"><span class="security-icon">✓</span><div><b>当前后台访问受管理员角色保护</b><p>已有登录鉴权；积分修改、补单、退款和权限变更将在 2.0 审计模型接入审批。</p></div></div><section class="glass-card role-card"><div class="card-heading"><div><h2>角色矩阵</h2><p>先定义职责边界，再绑定管理员账号</p></div><span class="deferred-chip">审批流 2.0</span></div><div class="role-list"><div v-for="role in roles" :key="role.name" class="role-row"><span class="role-dot" :class="role.tone"></span><div><b>{{ role.name }}</b><small>{{ role.scope }}</small></div><span class="member-count">{{ role.members }} 人</span><button class="btn-ghost small-btn" disabled>管理成员</button></div></div></section><section class="glass-card audit-card"><div class="card-heading"><div><h2>敏感操作审计</h2><p>操作记录、变更前后版本、审批人与原因</p></div></div><div class="audit-empty"><div>◌</div><b>尚无可展示的审计事件</b><p>当前系统已保留管理员身份校验，审计事件表将在 2.0 随积分、支付和人工改分能力一起接入。</p></div></section></div>
</template>

<style scoped>
.admin-page{max-width:1200px}.page-heading{margin-bottom:24px}.section-title{margin-bottom:0}.security-banner{display:flex;align-items:center;gap:12px;padding:18px 20px;margin-bottom:15px;background:linear-gradient(100deg,#eff8ff,#f8fffc)}.security-icon{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--success-soft);color:var(--success);font-weight:900}.security-banner b{font-size:14px}.security-banner p{margin:4px 0 0;color:var(--text-muted);font-size:12px}.glass-card{padding:22px}.card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.card-heading h2{margin:0;font-size:16px}.card-heading p{margin:6px 0 0;color:var(--text-muted);font-size:12px}.deferred-chip{padding:5px 8px;border-radius:5px;background:var(--warning-soft);color:var(--warning);font-size:10px;font-weight:800;white-space:nowrap}.role-list{margin-top:16px}.role-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)}.role-row:last-child{border-bottom:0}.role-dot{width:10px;height:10px;border-radius:50%}.role-dot.danger{background:var(--danger)}.role-dot.blue{background:var(--primary)}.role-dot.green{background:var(--success)}.role-dot.purple{background:#744bc7}.role-row b,.role-row small{display:block}.role-row b{font-size:13px}.role-row small{margin-top:3px;color:var(--text-muted);font-size:11px}.member-count{margin-left:auto;color:var(--text-secondary);font-size:12px}.small-btn{min-height:32px;padding:0 10px;font-size:11px}.audit-card{margin-top:15px}.audit-empty{display:flex;align-items:center;flex-direction:column;justify-content:center;min-height:180px;color:var(--text-primary);text-align:center}.audit-empty>div{margin-bottom:10px;color:var(--primary);font-size:32px}.audit-empty p{max-width:420px;margin:7px 0 0;color:var(--text-muted);font-size:12px;line-height:1.6}@media(max-width:650px){.role-row{align-items:flex-start;flex-wrap:wrap}.member-count{margin-left:0}.small-btn{margin-left:auto}}
</style>
