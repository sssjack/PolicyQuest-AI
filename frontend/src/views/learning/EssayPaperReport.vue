<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Refresh, CircleCheck, Aim } from '@element-plus/icons-vue'
import { realPaperApi } from '../../api'
import PaperAbilityRadar from '../../components/PaperAbilityRadar.vue'

const route = useRoute(), router = useRouter()
const view = ref<any>(null), error = ref(''), busy = ref(false), target = ref(0), saving = ref(false)
const data = computed(() => view.value?.report?.structured)
const narrative = computed(() => view.value?.report?.narrative)
const history = computed(() => view.value?.history)
const goal = computed(() => view.value?.goal)
let timer: ReturnType<typeof setTimeout> | undefined, stopped = false, requested = false, epoch = 0
const metricNames: Record<string, string> = { smallRate: '小题得分率', articleRate: '作文得分率', hitRate: '小题踩点率', omissionRate: '小题遗漏率', wordsPerMinute: '作答速度（字/分）' }
const arrow = (trend: string) => ({ 上升: '↑', 下降: '↓', 持平: '→' }[trend] || '—')
function review(questionNo?: number) {
  const question = data.value?.questions.find((q: any) => q.questionNo === questionNo)
  router.push({ path: `/practice/${view.value.paperId}`, query: { attemptId: String(view.value.attemptId), mode: 'review', questionId: question ? String(question.questionId) : undefined } })
}
async function fetchReport() {
  const generation = epoch, id = String(route.params.attemptId)
  try {
    const response: any = await realPaperApi.paperReport(id)
    if (stopped || generation !== epoch) return
    view.value = response.data; error.value = ''
    if (goal.value && !saving.value) target.value = goal.value.target
    if (view.value.attemptStatus === 'graded' && view.value.status === 'pending' && !requested) {
      requested = true
      try { await realPaperApi.generatePaperReport(id) } catch (e: any) { error.value = e.response?.data?.message || '生成请求失败，请重试'; return }
    }
    if (view.value.attemptStatus === 'grading' || ['pending', 'generating'].includes(view.value.status) && view.value.attemptStatus === 'graded') {
      clearTimeout(timer); timer = setTimeout(fetchReport, 5000)
    }
  } catch (e: any) { if (generation === epoch) error.value = e.response?.data?.message || '报告加载失败，请重试' }
}
async function retry() {
  busy.value = true
  try { await realPaperApi.generatePaperReport(String(route.params.attemptId)); requested = true; error.value = ''; await fetchReport() }
  catch (e: any) { error.value = e.response?.data?.message || '生成失败，请稍后再试' }
  finally { busy.value = false }
}
async function saveTarget() {
  if (!Number.isFinite(target.value) || target.value < 0 || target.value > data.value.maxScore) { ElMessage.warning('目标分需在本卷满分范围内'); return }
  saving.value = true
  try { const result: any = await realPaperApi.paperTarget(view.value.attemptId, target.value); view.value.goal = result.data; ElMessage.success('目标分已保存') }
  finally { saving.value = false }
}
watch(() => route.params.attemptId, () => { epoch++; clearTimeout(timer); view.value = null; requested = false; void fetchReport() }, { immediate: true })
onBeforeUnmount(() => { stopped = true; epoch++; clearTimeout(timer) })
</script>

<template>
  <main class="paper-diagnosis">
    <header class="report-nav"><router-link to="/history"><el-icon><ArrowLeft /></el-icon>练习历史</router-link><strong>PolicyQuest <span>/ 整卷诊断</span></strong><button v-if="view" @click="review()">逐题批改<el-icon><ArrowRight /></el-icon></button></header>
    <div class="report-body">
      <div v-if="error" class="notice error" role="alert"><p>{{ error }}</p><button @click="fetchReport">重新加载</button><button v-if="view?.attemptStatus === 'graded'" :disabled="busy" @click="retry">重试生成总结</button><button v-if="view" @click="review()">查看单题批改</button></div>
      <div v-if="!view && !error" class="pending" role="status">正在读取本套练习…</div>
      <section v-if="view && (view.status !== 'ready' || view.attemptStatus !== 'graded')" class="pending" role="status">
        <span class="eyebrow">ESSAY · LEARNING DIAGNOSIS</span><h1>申论整卷能力诊断报告</h1><p>{{ view.title }}</p>
        <template v-if="view.attemptStatus === 'grading'"><h2>正在逐题批改 · {{ view.gradedCount }} / {{ view.totalQuestions }}</h2><p>全部题目批改结束后，将自动汇总能力画像、共性短板和训练计划。离开页面后仍会继续。</p></template>
        <template v-else-if="view.attemptStatus === 'failed'"><h2>还有单题尚未批改成功</h2><p>请先在逐题批改页重试未完成的题目，再生成完整的能力诊断。</p><button @click="review()">查看并重试单题批改</button></template>
        <template v-else-if="view.status === 'failed'"><h2>整卷总结暂未完成</h2><p>{{ view.error }}</p><button :disabled="busy" @click="retry"><el-icon><Refresh /></el-icon>仅重试整卷总结</button></template>
        <template v-else><h2>{{ error ? '整卷报告尚未生成' : '正在汇总整卷诊断' }}</h2><p>{{ error ? '请按上方提示处理，或查看单题批改。' : '已完成的分数会先显示在下方，AI 正在对照单题证据分析共性问题。' }}</p></template>
      </section>

      <template v-if="data">
        <section class="overview">
          <div class="overview-title"><span class="eyebrow">YOUR NEXT LEVEL</span><h1>申论整卷能力诊断报告</h1><p>{{ data.title }}</p></div>
          <div class="score-heading"><div class="total"><b>{{ data.totalScore }}</b><span>/ {{ data.maxScore }} 分</span><small>本套得分 · {{ data.questions.length }} 道题</small></div><div class="grade"><b>{{ data.grade }}</b><span>{{ data.label }}</span><p>{{ narrative?.levelJudgment || '依据本套实际得分率作教学水平判断' }}</p></div><div class="weaknesses"><span>优先关注</span><strong v-for="a in data.weaknesses" :key="a.id">{{ a.name }}</strong></div></div>
          <p v-if="narrative" class="ai-summary"><span>AI 总评</span>{{ narrative.summary }}</p>
          <p class="muted">教学评阅结果 · 无真实同条件样本，不生成考生排名</p>
        </section>

        <section class="section"><div class="section-heading"><span>01</span><h2>整卷成绩总览</h2><small>先看表现，再找原因</small></div>
          <div class="table-scroll"><table><thead><tr><th>题目 / 题型</th><th>满分</th><th>得分</th><th>得分率</th><th>评价</th><th></th></tr></thead><tbody><tr v-for="q in data.questions" :key="q.questionNo"><td><b>第{{ q.questionNo }}题</b><small>{{ q.type }}</small></td><td>{{ q.maxScore }}</td><td class="blue">{{ q.score }}</td><td>{{ q.scoreRate }}%</td><td>{{ q.level }}</td><td><button @click="review(q.questionNo)">查看批改 →</button></td></tr><tr class="total-row"><td>总计</td><td>{{ data.maxScore }}</td><td>{{ data.totalScore }}</td><td>{{ data.scoreRate }}%</td><td>{{ data.label }}</td><td></td></tr></tbody></table></div>
          <div class="insights"><p><span>本套得分率最高题型</span><b>{{ data.bestType?.type }}</b><small>单套表现，不等于长期稳定能力</small></p><p><span>最大绝对失分来源</span><b>第{{ data.largestLoss.questionNo }}题 · {{ data.largestLoss.type }}</b><small>失分 {{ data.largestLoss.loss }} / {{ data.largestLoss.maxScore }}</small></p><p><span>优先提升</span><b>{{ narrative?.priorities?.[0]?.title || data.weaknesses[0]?.name }}</b></p></div>
        </section>

        <section class="section"><div class="section-heading"><span>02</span><h2>申论能力画像</h2><small>10项能力，跨题观察</small></div>
          <div class="ability-layout"><div><PaperAbilityRadar :items="data.abilities"/><div class="persona"><span>本套能力类型</span><h3>{{ data.persona }}</h3><p>{{ narrative?.personaExplanation || '根据已考查维度的相对表现生成，仅描述本套练习。' }}</p></div></div>
            <div class="ability-list"><article v-for="a in data.abilities" :key="a.id"><div><strong>{{ a.name }}</strong><b>{{ a.score === null ? '未考查' : `${a.score} / 10` }}</b><span>{{ a.grade }}</span></div><progress v-if="a.score !== null" :value="a.score" max="10" :aria-label="a.name"/><p>{{ narrative?.abilities?.find((n: any) => n.id === a.id)?.diagnosis || a.method }}</p><details v-if="a.evidence.length"><summary>查看评分依据</summary><p>{{ a.method }}</p><p v-for="(e, i) in a.evidence" :key="i">第{{ e.questionNo }}题 · {{ e.dimension }} {{ e.score }}/{{ e.maxScore }}：{{ e.reason }}</p></details></article></div>
          </div><p class="muted">雷达图仅包含有依据的能力，不将未考查项画成零分；能力分按相关单题评分加权折算，并非独立官方评分。</p>
        </section>

        <section class="section"><div class="section-heading"><span>03</span><h2>全卷共性失分</h2><small>只归纳在多题中重复出现的问题</small></div>
          <p v-if="!data.commonErrors.length" class="notice">本套尚未发现同一错误标签在多题重复出现。单题问题请查看下方核心复盘。</p>
          <article v-for="(e, i) in data.commonErrors" :key="e.tag" class="common-error"><div class="error-title"><span>TOP {{ Number(i) + 1 }}</span><h3>{{ e.tag }}</h3><small>第{{ e.questions.join('、') }}题 · {{ e.count }}条诊断</small></div><p>{{ narrative?.commonErrors?.find((r: any) => r.tag === e.tag)?.diagnosis }}</p><p v-if="narrative"><b>为什么影响得分：</b>{{ narrative.commonErrors.find((r: any) => r.tag === e.tag)?.impact }}</p><p v-if="narrative" class="method"><b>下一次这样练：</b>{{ narrative.commonErrors.find((r: any) => r.tag === e.tag)?.method }}</p>
            <details><summary>查看跨题原文与具体改写（{{ e.evidence.length }}条）</summary><div v-for="d in e.evidence" :key="d.id" class="evidence"><button @click="review(d.questionNo)">第{{ d.questionNo }}题 · {{ d.id }} →</button><blockquote>{{ d.original }}</blockquote><p><b>问题：</b>{{ d.problem }}</p><p><b>改写：</b>{{ d.rewrite }}</p><small>{{ d.explanation }}</small></div></details>
          </article>
        </section>

        <section class="section"><div class="section-heading"><span>04</span><h2>本套值得保留的习惯</h2></div><div class="strength-grid"><article v-for="a in data.strengths" :key="a.id"><el-icon><CircleCheck /></el-icon><h3>{{ a.name }}</h3><p>{{ narrative?.strengths?.find((s: any) => s.abilityId === a.id)?.detail || a.evidence[0]?.reason }}</p></article></div><p v-if="!data.strengths.length" class="muted">当前暂无达到优势阈值的能力，先建立稳定的基础作答习惯。具体有效句仍可在单题批注中查看。</p></section>

        <section class="section"><div class="section-heading"><span>05</span><h2>每题一句话复盘</h2></div><article v-for="q in data.questions" :key="q.questionNo" class="question-review"><button @click="review(q.questionNo)"><b>第{{ q.questionNo }}题 · {{ q.type }}</b><span>{{ q.score }} / {{ q.maxScore }} →</span></button><p>{{ narrative?.reviews?.find((r: any) => r.questionNo === q.questionNo)?.verdict || q.summary }}</p><p class="muted"><b>关键改进：</b>{{ narrative?.reviews?.find((r: any) => r.questionNo === q.questionNo)?.mainLoss || q.diagnoses[0]?.problem || '保留有效方法' }}</p></article></section>

        <section class="section"><div class="section-heading"><span>06</span><h2>错误标签与变化</h2></div><div class="tags"><span v-for="e in data.errors" :key="e.tag">#{{ e.tag }} <b>× {{ e.count }}</b></span><span v-if="!data.errors.length">本套无已标记错误</span></div><p class="muted">次数为去重后的具体诊断条目；同题重复标签可有不同证据，不等于扣分次数。</p>
          <div v-if="history?.errorTrends.length" class="table-scroll"><table><thead><tr><th>最近{{ history.count }}套高频问题</th><th>累计次数</th><th>前半组 / 后半组（每套）</th><th>变化</th></tr></thead><tbody><tr v-for="e in history.errorTrends" :key="e.tag"><td>{{ e.tag }}</td><td>{{ e.count }}</td><td>{{ e.before ?? '—' }} / {{ e.after ?? '—' }}</td><td>{{ arrow(e.trend) }} {{ e.trend }}</td></tr></tbody></table></div>
        </section>

        <section v-if="narrative" class="section"><div class="section-heading"><span>07</span><h2>提分优先级</h2><small>每轮最多聚焦三件事</small></div><article v-for="p in narrative.priorities" :key="p.priority" class="priority"><div><span>{{ p.priority }}</span><h3>{{ p.title }}</h3><small>关联第{{ p.questions.join('、') }}题</small></div><p>{{ p.reason }}</p><p><b>训练重点：</b>{{ p.exercise }}</p><p><b>验收标准：</b>{{ p.successCriteria }}</p><small>关联题目的下一轮练习增分预算：{{ p.practiceBudget }}分；不同优先项可能涉及同一题，不可相加。</small></article></section>

        <section v-if="goal" class="section goal-section"><div class="section-heading"><span>08</span><h2>距离目标，还有几步</h2></div><div class="goal-heading"><div><span>{{ goal.reached ? '已达到当前目标' : '距离目标分' }}</span><strong>{{ goal.gap }}<small>分</small></strong></div><form @submit.prevent="saveTarget"><label for="paper-target">我的目标（满分{{ data.maxScore }}）</label><div><input id="paper-target" v-model.number="target" type="number" min="0" :max="data.maxScore" step="0.1" required/><button :disabled="saving" type="submit">保存目标</button></div></form><div><span>下一轮潜在练习空间</span><strong>{{ goal.potential }}<small>分</small></strong></div></div>
          <div class="table-scroll"><table><thead><tr><th>提分来源</th><th>当前</th><th>下轮练习目标</th><th>增分预算</th></tr></thead><tbody><tr v-for="q in goal.rows" :key="q.questionNo"><td>第{{ q.questionNo }}题</td><td>{{ q.current }}</td><td>{{ q.target }} / {{ q.maxScore }}</td><td>+{{ q.gain }}</td></tr></tbody></table></div><p>{{ narrative?.goalAdvice }}</p><p class="muted">{{ goal.method }} {{ goal.potential < goal.gap ? '当前预算不足以覆盖目标差距，需要多轮训练。' : '' }}</p>
        </section>

        <section v-if="narrative" class="section"><div class="section-heading"><span>09</span><h2>下一阶段 · 7天训练计划</h2></div><div class="plan-grid"><article v-for="p in narrative.trainingPlan" :key="p.day"><span>DAY {{ p.day }}</span><h3>{{ p.title }}</h3><p>{{ p.task }}</p><small><b>完成标准：</b>{{ p.successCriteria }}</small><router-link :to="{ path: '/papers', query: { type: 'essay', questionType: p.kind === 'full' ? 'all' : p.kind } }">去题库选题 <el-icon><ArrowRight /></el-icon></router-link></article></div></section>

        <section class="section"><div class="section-heading"><span>10</span><h2>个人申论档案</h2><small>截至本次提交的真实记录</small></div><div class="profile-summary"><p><span>本套综合水平</span><b>{{ data.grade }}</b></p><p><span>相对擅长</span><b>{{ data.strengths.map((a: any) => a.name).join('、') || '基础习惯建立中' }}</b></p><p><span>当前薄弱</span><b>{{ data.weaknesses.map((a: any) => a.name).join('、') }}</b></p></div>
          <h3>最近5套得分</h3><div class="score-trend"><router-link v-for="r in history?.recent?.slice(-5)" :key="r.attemptId" :to="`/paper-report/${r.attemptId}`"><b>{{ r.totalScore }}<small>/{{ r.maxScore }}</small></b><progress :value="r.scoreRate" max="100" :aria-label="`${r.title}得分率`"/><span>得分率 {{ r.scoreRate }}%</span></router-link></div>
          <div class="metric-trends"><article v-for="m in history?.metricTrends" :key="m.key"><span>{{ metricNames[m.key] }}</span><b>{{ arrow(m.trend) }} {{ m.trend }}</b><small>{{ m.before ?? '—' }} → {{ m.after ?? '—' }}</small></article></div><p class="muted">{{ history?.note || '暂无足够历史样本。' }} 作答速度由系统记录的字数和用时估算。</p>
        </section>
        <footer class="limitations"><p v-for="note in data.notes" :key="note">{{ note }}</p><router-link to="/papers?type=essay">开始下一套训练<el-icon><Aim /></el-icon></router-link></footer>
      </template>
    </div>
  </main>
</template>

<style scoped>
.ability-layout>div:first-child{position:sticky;top:22px}
@media(max-width:800px){.ability-layout>div:first-child{position:static}}
.paper-diagnosis{background:#f3f6fb;min-height:100vh;color:#17253d;font-size:14px;line-height:1.8}.paper-diagnosis *{box-sizing:border-box}.paper-diagnosis button,.paper-diagnosis a{cursor:pointer;color:#3265ed;text-decoration:none;font:inherit}.paper-diagnosis button{border:0;background:transparent;padding:6px 0}.paper-diagnosis button:disabled{opacity:.5;cursor:wait}.paper-diagnosis :focus-visible{outline:3px solid #7194ff;outline-offset:4px}.report-nav{height:72px;padding:0 max(24px,calc((100vw - 1200px)/2));display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e3e9f2;gap:16px}.report-nav a,.report-nav button{display:flex;gap:8px;align-items:center}.report-nav strong span{color:#8390a4;font-size:12px;font-weight:400}.report-body{max-width:1200px;margin:auto;padding:32px 24px 64px}.overview,.section,.pending{background:white;border:1px solid #e5eaf3;border-radius:20px;margin-bottom:24px;padding:30px 34px}.overview{background:linear-gradient(120deg,#132542,#213f72);color:white;border:0}.eyebrow{font-size:10px;letter-spacing:2px;color:#8ba4ce;font-weight:700}h1{font-size:27px;line-height:1.4;margin:10px 0}h2{font-size:21px;margin:0}h3{font-size:17px;margin:8px 0}p{margin:10px 0}.overview-title p{color:#c1d0e6}.score-heading{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:30px;margin:32px 0}.total b{font-size:64px;letter-spacing:-3px;line-height:1.2}.total>span{color:#c1d0e6;padding-left:8px}.total small{display:block;color:#a5b8d4;margin-top:9px}.grade>b{font-size:36px;line-height:1.4;color:#d4f299}.grade>span{margin-left:12px}.grade p{color:#cbd6e7;font-size:13px}.weaknesses{padding-left:28px;border-left:1px solid #ffffff22}.weaknesses>span{display:block;color:#a7bad5;font-size:12px}.weaknesses strong{display:inline-block;background:#ffffff12;border:1px solid #ffffff22;border-radius:8px;font-size:12px;font-weight:500;margin:8px 8px 0 0;padding:4px 10px}.ai-summary{border-top:1px solid #ffffff25;padding-top:22px;font-size:15px;line-height:2}.ai-summary span{display:block;font-size:11px;color:#bfd895;letter-spacing:1px}.muted{color:#75839a;font-size:12px}.overview>.muted{color:#9bafd0}.section-heading{display:flex;align-items:center;gap:12px;margin-bottom:25px;flex-wrap:wrap}.section-heading>span{font-size:12px;font-weight:700;color:#8e9fb9}.section-heading>small{margin-left:auto;color:#7a889d;font-size:12px}.table-scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px;text-align:left;white-space:nowrap}th{background:#f5f7fb;color:#7a879a;font-size:12px;font-weight:500}td,th{padding:14px 15px;border-bottom:1px solid #edf0f6}td small{display:block;color:#7c8ca3;font-size:11px}.blue{color:#3265f5;font-weight:750}.total-row{font-weight:700;background:#f7faff}.insights{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:22px}.insights span,.insights small{display:block;font-size:12px;color:#8390a4}.insights b{display:block;margin:4px 0}.ability-layout{display:grid;grid-template-columns:42% 1fr;gap:35px;align-items:start;min-width:0}.ability-layout>div{min-width:0}.persona{background:#f4f8ff;padding:20px;border-radius:14px}.persona>span{font-size:12px;color:#7a8ba6}.persona h3{color:#3265ed;font-size:23px}.persona p{font-size:13px;color:#64768d}.ability-list article{border-bottom:1px solid #edf0f6;padding:12px 0}.ability-list article>div{display:flex;gap:16px;align-items:center}.ability-list b{margin-left:auto;font-size:13px}.ability-list article>div>span{width:24px;font-size:12px;color:#8491a8}.ability-list p{font-size:12px;color:#708198;margin:5px 0}progress{height:5px;border:0;border-radius:5px;width:100%;accent-color:#3265f5;background:#edf2fa}progress::-webkit-progress-bar{background:#edf2fa;border-radius:5px}progress::-webkit-progress-value{background:#3265f5;border-radius:5px}details{margin-top:12px;font-size:12px}summary{cursor:pointer;color:#4c70ab}.common-error{border-top:1px solid #e9eef5;padding:22px 0}.error-title{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.error-title>span{color:#ba6947;font-size:10px;letter-spacing:1px;font-weight:700}.error-title small{margin-left:auto;color:#8b95a4}.method{padding:14px;background:#f4f7fd;border-radius:10px}.evidence{background:#f8faff;border-left:2px solid #9db7ee;padding:16px;margin:12px 0}.evidence blockquote{margin:8px 0;color:#8390a4;white-space:pre-wrap}.strength-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.strength-grid article{padding:20px;border-radius:14px;background:#f3f9f6}.strength-grid .el-icon{color:#398c6d;font-size:23px}.strength-grid p{color:#567565;font-size:13px}.question-review{padding:20px 0;border-top:1px solid #edf0f6}.question-review>button{display:flex;justify-content:space-between;gap:20px;width:100%;text-align:left}.question-review p{font-size:13px}.tags{display:flex;flex-wrap:wrap;gap:10px}.tags>span{background:#f0f4fc;border-radius:8px;padding:6px 13px;font-size:12px;color:#61799d}.tags b{margin-left:8px;color:#3265ed}.priority{border:1px solid #e5ebf5;border-radius:14px;padding:20px;margin-bottom:16px}.priority>div{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.priority>div>span{background:#3265f5;color:white;font-size:12px;font-weight:750;border-radius:6px;padding:3px 9px}.priority small{color:#8593a8;font-size:12px}.priority p{font-size:13px}.goal-heading{display:flex;justify-content:space-between;gap:25px;flex-wrap:wrap;margin:20px 0}.goal-heading>div>span{display:block;color:#7c8ca3;font-size:12px}.goal-heading strong{font-size:40px;color:#3265ed;display:block}.goal-heading strong small{font-size:14px;margin-left:8px}.goal-heading label{display:block;color:#7c8ca3;font-size:12px}.goal-heading input{width:105px;border:1px solid #cfd9e9;border-radius:8px;padding:9px;font:inherit;margin:10px 12px 0 0}.goal-heading form button{background:#3265ed;color:white;border-radius:8px;padding:8px 13px}.plan-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.plan-grid article{padding:22px;border:1px solid #e3eaf5;border-radius:14px;display:flex;flex-direction:column}.plan-grid article>span{font-size:10px;font-weight:800;letter-spacing:2px;color:#3265ed}.plan-grid p{font-size:13px;color:#63748c}.plan-grid small{color:#7d8ca3;font-size:12px}.plan-grid a{margin-top:auto;padding-top:18px;font-size:12px;display:flex;align-items:center;gap:10px}.profile-summary{display:flex;gap:30px;flex-wrap:wrap}.profile-summary span{display:block;color:#8794a8;font-size:12px}.profile-summary b{font-size:16px}.score-trend{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:20px 0}.score-trend a{padding:15px;background:#f4f7fc;border-radius:10px}.score-trend b{font-size:23px;display:block}.score-trend small{font-size:12px;color:#8a99ae;font-weight:400}.score-trend span{font-size:10px;color:#7d8da5}.metric-trends{display:flex;gap:20px;flex-wrap:wrap;margin-top:28px}.metric-trends article{flex:1;min-width:130px}.metric-trends span,.metric-trends small{display:block;color:#8593a8;font-size:12px}.metric-trends b{font-size:15px}.limitations{color:#8a97aa;font-size:12px;text-align:center}.limitations a{display:inline-flex;align-items:center;gap:18px;background:#3265ed;color:white;padding:12px 23px;border-radius:10px;margin-top:18px;font-size:14px}.pending{padding:40px}.pending p{color:#7e8da4}.pending button,.notice button{padding:8px 16px;background:#ecf2ff;border-radius:8px;margin:5px}.notice{padding:20px;border-radius:12px;background:#f6f8fc;color:#71829b}.error{background:#fff1ec;color:#aa4b37;margin-bottom:20px}.paper-diagnosis .el-icon{vertical-align:middle}
@media(max-width:800px){.report-nav strong{display:none}.report-body{padding:18px 14px 40px}.overview,.section,.pending{padding:24px 20px;border-radius:15px}.score-heading{grid-template-columns:1fr 1fr;gap:20px}.weaknesses{grid-column:1/-1;padding:0;border:0}.total b{font-size:48px}.ability-layout{grid-template-columns:1fr;gap:10px}.insights,.strength-grid{grid-template-columns:1fr}.plan-grid{grid-template-columns:1fr 1fr}.section-heading>small{margin-left:0;width:100%}.score-trend{grid-template-columns:repeat(3,1fr)}h1{font-size:23px}h2{font-size:19px}.error-title small{margin-left:0}.goal-heading{gap:20px}}
@media(max-width:480px){.plan-grid{grid-template-columns:1fr}.score-trend{grid-template-columns:1fr 1fr}.report-nav{padding:0 18px;height:60px;font-size:12px}.total b{font-size:43px}.score-heading{gap:15px}.grade>b{font-size:30px}.question-review>button{flex-direction:column;gap:3px}.persona h3{font-size:21px}.profile-summary{gap:14px}.priority{padding:15px}.section-heading{gap:8px}.report-body p{overflow-wrap:anywhere}}
</style>
