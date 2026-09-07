<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { realPaperApi } from '../api'
const data = ref<any>(null)
const error = ref('')
const names: Record<string, string> = { summary: '归纳概括', analysis: '综合分析', solution: '提出对策', implementation: '贯彻执行', article: '大作文' }
async function load() {
  error.value = ''
  try { const res: any = await realPaperApi.essayProfile(); data.value = res.data }
  catch { error.value = '申论档案加载失败，请重试' }
}
onMounted(load)
</script>
<template>
  <section class="essay-profile">
    <header><div><small>从阅卷到诊断，再到训练</small><h2>我的申论能力档案</h2></div><button @click="load">刷新档案</button></header>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-else-if="!data">正在读取批改记录…</p>
    <template v-else>
      <p>{{ data.windowNote }}</p>
      <p v-if="!data.sampleCount">完成一次新版申论批改后，这里会自动记录采点率、遗漏率、常见错误和能力变化。旧报告可在详情页重新批改。</p>
      <template v-else>
        <div class="metrics"><div v-for="[label, value, unit] in [['已评答案', data.sampleCount, '题'], ['踩点率', data.hitRate, '%'], ['遗漏率', data.omissionRate, '%'], ['有效覆盖率', data.correctPointRate, '%'], ['平均字数', data.averageWords, '字'], ['超限字数比例', data.overLimitRate, '%']]" :key="String(label)"><small>{{ label }}</small><strong>{{ value ?? '—' }}<em>{{ unit }}</em></strong></div></div>
        <p class="note">踩点率将部分覆盖按半个要点计算；有效覆盖率包含部分覆盖。作文材料覆盖指标仅用于诊断，不代表作文按点计分。</p>
        <h3>常见失分问题</h3><div class="tags"><span v-for="item in data.commonErrors" :key="item.tag">{{ item.tag }} · {{ item.count }}次</span><span v-if="!data.commonErrors.length">暂无重复失分问题</span></div>
        <h3>题型与维度表现</h3><div class="bars"><label v-for="item in data.byType" :key="item.kind">{{ names[item.kind] }} · {{ item.count }}题 <progress :value="item.scoreRate" max="100" /> {{ item.scoreRate }}%</label><label v-for="item in data.dimensions" :key="item.name">{{ item.name }} <progress :value="item.scoreRate" max="100" /> {{ item.scoreRate }}%</label></div>
        <h3>最近练习趋势</h3><p class="note">不同题目难度不同，得分率变化仅作练习参考。</p>
        <div class="trend"><div v-for="(item, index) in data.trend.slice(-20)" :key="item.answerId" :title="`${names[item.kind]}：${item.scoreRate}%`"><span>{{ item.scoreRate }}%</span><i :style="{ height: `${item.scoreRate}px` }"/><small>{{ Number(index) + 1 }}</small></div></div>
        <h3>针对性训练</h3><ul><li v-for="item in data.recommendations" :key="item.questionId"><router-link :to="{path: `/practice/${item.paperId}`, query: {questionId: item.questionId}}">{{ item.paperTitle }} · {{ item.title }}（{{ item.maxScore }}分）</router-link></li></ul>
        <details><summary>查看错题诊断与训练记录（{{ data.mistakes.length }}条）</summary><article v-for="item in data.mistakes" :key="item.answerId"><router-link :to="{path: `/practice/${item.paperId}`, query: {attemptId: item.attemptId, questionId: item.questionId}}">{{ item.title }} · {{ item.score }}/{{ item.maxScore }}分</router-link><p>{{ item.tags.join('、') }} · 遗漏{{ item.missing }}点</p><p v-for="training in item.training" :key="training.target">{{ training.target }}：{{ training.exercise }}；验收：{{ training.successCriteria }}</p></article></details>
      </template>
    </template>
  </section>
</template>
<style scoped>
.essay-profile{padding:28px;margin:0 0 24px;background:#fff;border:1px solid #dce4ee;border-radius:16px;color:#20344c}.essay-profile header{display:flex;align-items:center;justify-content:space-between;gap:16px}.essay-profile h2{margin:8px 0}.essay-profile h3{margin:28px 0 12px}.essay-profile p{line-height:1.8}.essay-profile button{padding:8px 14px;border:1px solid #b4c8df;background:white;border-radius:8px;color:#2455a2;cursor:pointer}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.metrics div{display:flex;flex-direction:column;gap:8px;padding:18px;background:#f3f7fc;border-radius:10px}.metrics strong{font-size:26px}.metrics em{font-size:13px;font-style:normal;margin-left:6px}.note{color:#64748b;font-size:13px}.tags{display:flex;flex-wrap:wrap;gap:8px}.tags span{background:#fff4e8;color:#854919;border-radius:20px;padding:6px 12px}.bars{display:grid;grid-template-columns:1fr 1fr;gap:14px}.bars label{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.bars progress{max-width:140px;accent-color:#3c76d1}.trend{display:flex;gap:15px;align-items:flex-end;overflow:auto;min-height:150px}.trend div{display:flex;align-items:center;flex-direction:column;gap:6px;font-size:12px}.trend i{width:24px;background:#6193de;border-radius:4px 4px 0 0}.essay-profile a{color:#245bb0}.essay-profile li{margin:12px 0}.essay-profile article{border-top:1px solid #e0e7ef;padding:16px 0}.essay-profile summary{cursor:pointer;margin-top:25px}@media(max-width:650px){.essay-profile{padding:18px}.metrics{grid-template-columns:1fr 1fr}.bars{grid-template-columns:1fr}}
</style>
