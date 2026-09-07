<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ report: any; previousRate?: number | null }>()
const emit = defineEmits<{ material: [id: string] }>()
const root = ref<HTMLElement | null>(null)
const answerKind = ref('safe')
const pointFilter = ref('all')
const problemOnly = ref(false)
const labels: Record<string, string> = { covered: '已踩中', partial: '部分踩中', missing: '遗漏', incorrect: '表述错误', mixed: '部分有效', effective: '有效信息', redundant: '重复表达', background: '背景描述', irrelevant: '无效扩写', error: '表述错误' }
const kindLabels: Record<string, string> = { summary: '归纳概括', analysis: '综合分析', solution: '提出对策', implementation: '贯彻执行', article: '大作文' }
const points = computed(() => props.report.pointAnalysis.filter((p: any) => pointFilter.value === 'all' || p.status === pointFilter.value))
const sentences = computed(() => props.report.sentenceReviews.filter((s: any) => !problemOnly.value || s.classification !== 'effective'))
const selectedAnswer = computed(() => props.report.referenceAnswers.find((a: any) => a.kind === answerKind.value) || props.report.referenceAnswers[0])
const navigation = [ ['score', '总分与维度'], ['points', '采点与溯源'], ['sentences', '逐句批注'], ['diagnosis', '失分原因'], ['structure', '结构与逻辑'], ['reference', '答案与拆解'], ['training', '下一步训练'] ]
function jump(id: string) { root.value?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
const display = (value: unknown) => typeof value === 'string' ? value : Array.isArray(value) ? value.join('；') : ''
</script>

<template>
  <article ref="root" class="essay-report" aria-label="申论深度批改报告">
    <nav class="report-nav" aria-label="批改报告目录">
      <button v-for="[id, label] in navigation" :key="id" type="button" @click="jump(id!)">{{ label }}</button>
    </nav>

    <section data-section="score" class="report-section">
      <div class="eyebrow">{{ kindLabels[report.kind] }} · 按原题满分评阅</div>
      <div class="score-heading">
        <div class="score-number"><strong>{{ report.score }}</strong><span>/ {{ report.maxScore }} 分</span></div>
        <div><span class="level">{{ report.level }}</span><p>参考估分 {{ report.scoreInterval.low }}—{{ report.scoreInterval.high }} / {{ report.maxScore }}</p></div>
      </div>
      <p class="summary">{{ report.summary }}</p>
      <p class="muted">{{ report.scoreInterval.note }} {{ report.ranking.note }}</p>
      <h3>分项评分</h3>
      <div class="table-scroll"><table>
        <thead><tr><th>评分维度</th><th>得分 / 满分</th><th>评分依据</th></tr></thead>
        <tbody><tr v-for="d in report.dimensions" :key="d.name"><th>{{ d.name }}</th><td class="numeric">{{ d.score }} / {{ d.maxScore }}</td><td>{{ d.reason }}</td></tr></tbody>
        <tfoot><tr><th>合计</th><td>{{ report.score }} / {{ report.maxScore }}</td><td>各维度得分相加，与本题总分一致</td></tr></tfoot>
      </table></div>
      <p class="muted">{{ report.rubricNote }}</p>
    </section>

    <section data-section="points" class="report-section">
      <h2>{{ report.kind === 'article' ? '材料与立意覆盖诊断' : '参考要点 · 你的踩点情况' }}</h2>
      <p>{{ report.reference.taskAnalysis }}</p>
      <p class="muted">{{ report.reference.sourceLabel }}<template v-if="report.kind === 'article'">；本模块不用于作文逐点计分。</template></p>
      <div class="point-filters" aria-label="筛选采点状态">
        <button v-for="key in ['all', 'covered', 'partial', 'missing', 'incorrect']" :key="key" type="button" :aria-pressed="pointFilter === key" :class="{ active: pointFilter === key }" @click="pointFilter = key">
          {{ key === 'all' ? '全部要点' : labels[key] }} <b>{{ key === 'all' ? report.coverage.total : report.coverage[key] }}</b>
        </button>
      </div>
      <details v-for="point in points" :key="point.id" class="point-card" :class="point.status" :open="point.status !== 'covered'">
        <summary><span class="status">{{ labels[point.status] }}</span><strong>{{ point.point }}</strong><b v-if="report.kind !== 'article'">{{ point.score }} / {{ point.maxScore }}</b></summary>
        <div class="detail-body">
          <h4>材料依据 · {{ point.evidence.materialTitle }}</h4>
          <blockquote>{{ point.evidence.quote }}</blockquote>
          <button type="button" class="text-button" @click="emit('material', point.evidence.materialId)">定位原材料</button>
          <p><b>从材料到概括：</b>{{ point.explanation }}</p>
          <p><b>你的表述：</b>{{ point.userQuote || '没有相关表达' }}</p>
          <p><b>为什么这样判定：</b>{{ point.reason }}</p>
          <div class="rewrite"><b>可以直接这样写</b><p>{{ point.rewrite }}</p></div>
        </div>
      </details>
      <p v-if="!points.length" class="muted">本题没有这一状态的要点。</p>
    </section>

    <section data-section="sentences" class="report-section">
      <div class="section-heading"><h2>逐句批注 · 修改前后对照</h2><label><input v-model="problemOnly" type="checkbox" />只看需改进的句子</label></div>
      <article v-for="s in sentences" :key="s.id" class="sentence-card">
        <header><b>{{ s.id }}</b><span class="status" :class="s.classification">{{ labels[s.classification] }}</span><span class="muted">{{ s.relatedPointIds.join(' · ') }}</span></header>
        <blockquote>{{ s.text }}</blockquote>
        <p><b>诊断：</b>{{ s.issue }}</p>
        <div class="rewrite"><b>替换表达</b><p>{{ s.rewrite }}</p></div>
        <p><b>改写原因：</b>{{ s.reason }}</p>
      </article>
      <p v-if="!sentences.length" class="muted">没有符合当前筛选条件的句子。</p>
    </section>

    <section data-section="diagnosis" class="report-section">
      <h2>主要失分原因</h2>
      <article v-for="(d, index) in report.diagnoses" :key="index" class="diagnosis-card">
        <h3>{{ d.tag }} · {{ d.problem }}</h3><blockquote>{{ d.original }}</blockquote>
        <p><b>为什么不好：</b>{{ d.reason }}</p>
        <div class="rewrite"><b>本题具体改法</b><p>{{ d.rewrite }}</p></div>
        <p><b>为什么这样改：</b>{{ d.explanation }}</p>
      </article>
      <p v-if="!report.diagnoses.length">本次未识别到需要单列的问题；可结合逐句批注和材料采点进一步复盘。</p>
      <h3>字数与信息密度</h3>
      <p v-if="report.wordAnalysis.minWords">最低参考字数 {{ report.wordAnalysis.minWords }}；当前不足 {{ report.wordAnalysis.underMinimum || 0 }} 字。具体以题干原始要求为准。</p>
      <div class="metrics">
        <div><span>作答字数 / 上限</span><strong>{{ report.wordAnalysis.wordCount }} / {{ report.wordAnalysis.wordLimit || '未标明' }}</strong></div>
        <div><span>超出字数</span><strong>{{ report.wordAnalysis.overLimit }}</strong></div>
        <div><span>有效信息占比（估算）</span><strong>{{ report.wordAnalysis.effectiveRatio }}%</strong></div>
        <div><span>重复信息占比（估算）</span><strong>{{ report.wordAnalysis.redundantRatio }}%</strong></div>
        <div><span>每100字覆盖参考点</span><strong>{{ report.wordAnalysis.pointsPer100Words }}</strong></div>
        <div><span>重复 / 背景 / 无效字符</span><strong>{{ report.wordAnalysis.redundantWords }} / {{ report.wordAnalysis.backgroundWords }} / {{ report.wordAnalysis.irrelevantWords }}</strong></div>
      </div>
      <p class="muted">{{ report.wordAnalysis.method }}</p>
    </section>

    <section data-section="structure" class="report-section">
      <h2>结构分析与逻辑关系检查</h2>
      <p><b>原答案：</b>{{ report.structure.detected }}</p><p><b>建议结构：</b>{{ report.structure.recommended }}</p><p>{{ report.structure.analysis }}</p>
      <div class="structure-tree"><div v-for="(part, index) in report.structure.outline" :key="index"><b>{{ Number(index) + 1 }} · {{ part.title }}</b><p>{{ part.detail }}</p></div></div>
      <article v-for="(r, index) in report.structure.relations" :key="index" class="sentence-card">
        <h4>{{ r.from }} → {{ r.to }} <span class="muted">{{ r.relation }}</span></h4><p>{{ r.issue }}</p><p class="rewrite">{{ r.fix }}</p>
      </article>
      <template v-if="report.kind === 'solution'">
        <h3>问题—原因—对策匹配</h3>
        <div class="table-scroll"><table><thead><tr><th>问题 / 原因</th><th>你的对策</th><th>对应情况与具体改写</th></tr></thead><tbody>
          <tr v-for="(s, index) in report.solutionAnalysis" :key="index"><td>{{ s.problem }}<p>{{ s.cause }}</p></td><td>{{ s.userSolution }}</td><td><b>{{ s.matched ? '有对应' : '需补充或调整' }}</b><p>{{ s.diagnosis }}</p><p>{{ s.rewrite }}</p></td></tr>
        </tbody></table></div>
      </template>
      <template v-if="report.kind === 'implementation' && report.implementationAnalysis">
        <h3>贯彻执行专项</h3><dl class="implementation">
          <template v-for="(label, key) in { identity: '身份', audience: '对象', purpose: '目的', genre: '文种', format: '格式', tone: '语气', diagnosis: '诊断与修改' }" :key="key"><dt>{{ label }}</dt><dd>{{ display(report.implementationAnalysis[key]) }}</dd></template>
        </dl>
      </template>
      <template v-if="report.kind === 'article' && report.articleAnalysis">
        <h3>大作文专项：立意、扣题和论证</h3>
        <p><b>你的中心论点：</b>{{ report.articleAnalysis.thesis }}</p><p><b>题意对应立意：</b>{{ report.articleAnalysis.expectedThesis }}</p><p>{{ report.articleAnalysis.keywordRelations }}</p>
        <article v-for="(c, index) in report.articleAnalysis.checks" :key="index" class="sentence-card"><h4>{{ c.passed ? '符合' : '需改进' }} · {{ c.name }}</h4><p>{{ c.evidence }}</p><p class="rewrite">{{ c.improvement }}</p></article>
        <details v-for="(p, index) in report.articleAnalysis.paragraphs" :key="index" class="point-card"><summary><strong>第 {{ p.paragraphNo }} 段 · {{ p.role }}</strong></summary><div class="detail-body">
          <p><b>分论点：</b>{{ p.thesis }}</p><p><b>论据：</b>{{ p.evidence }}</p><p><b>论证：</b>{{ p.reasoning }}</p><p><b>问题：</b>{{ p.problem }}</p>
          <p class="chain">{{ Array.isArray(p.chain) ? p.chain.join(' → ') : p.chain }}</p><div class="rewrite"><b>示范重写</b><p>{{ p.rewrite }}</p></div>
        </div></details>
      </template>
    </section>

    <section data-section="reference" class="report-section">
      <h2>参考答案与答题拆解</h2><p class="muted">AI生成教学示例。先看组织思路，再对照具体句段，理解材料如何变成答案。</p>
      <div class="point-filters" aria-label="参考答案版本"><button v-for="a in report.referenceAnswers" :key="a.kind" type="button" :aria-pressed="answerKind === a.kind" :class="{ active: answerKind === a.kind }" @click="answerKind = a.kind">{{ a.label }}</button></div>
      <div v-if="selectedAnswer" class="reference-answer">
        <div class="section-heading"><h3>{{ selectedAnswer.label }}</h3><span>{{ selectedAnswer.wordCount }} 字</span></div>
        <p class="full-answer">{{ selectedAnswer.content }}</p>
        <p><b>组织思路：</b>{{ selectedAnswer.thinking }}</p><p><b>取舍原因：</b>{{ selectedAnswer.tradeoff }}</p>
        <h4>这份答案是怎样拆分的</h4>
        <article v-for="(part, index) in selectedAnswer.breakdown" :key="index" class="sentence-card"><blockquote>{{ part.text }}</blockquote><p>{{ part.reason }}</p><small>对应参考点：{{ part.pointIds.join('、') || '结构或论证作用' }}</small></article>
      </div>
    </section>

    <section data-section="training" class="report-section">
      <h2>本题技巧与下一步训练</h2>
      <article v-for="(t, index) in report.training" :key="index" class="training-card"><span class="eyebrow">训练 {{ Number(index) + 1 }}</span><h3>{{ t.target }}</h3><p>连续练 {{ t.count }} 道{{ kindLabels[t.questionType] }}题</p><p>{{ t.exercise }}</p><p><b>验收标准：</b>{{ t.successCriteria }}</p><router-link :to="{ path: '/papers', query: { type: 'essay', questionType: t.questionType } }">查找对应题型 →</router-link></article>
      <p v-if="previousRate != null">本题得分率 {{ report.percentScore }}%，上次同题得分率 {{ previousRate }}%；变化 {{ report.percentScore - previousRate > 0 ? '+' : '' }}{{ (report.percentScore - previousRate).toFixed(1) }} 个百分点。</p>
      <router-link :to="{ path: '/report', query: { tab: 'report' } }">查看长期错误画像与能力趋势 →</router-link>
      <p v-for="note in report.limitations" :key="note" class="muted">{{ note }}</p>
    </section>
  </article>
</template>

<style scoped>
.essay-report{background:#fff;border:1px solid #e3e9f2;border-radius:18px;color:#20304a;min-width:0;line-height:1.85;overflow-wrap:anywhere}
.report-nav{display:flex;gap:8px;flex-wrap:wrap;padding:18px 24px;background:#f5f8fe;border-radius:18px 18px 0 0;border-bottom:1px solid #e3e9f2}
button{cursor:pointer;font:inherit}.report-nav button,.point-filters button{padding:6px 12px;border:1px solid #d5dfed;background:#fff;border-radius:8px;color:#334862;font-size:13px}
button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #2863d9;outline-offset:3px}.report-section{padding:28px;border-bottom:1px solid #e7ecf3;scroll-margin-top:90px}.report-section:last-child{border-bottom:0}
h2{font-size:21px;margin:0 0 16px}h3{font-size:17px;margin:18px 0 10px}h4{margin:10px 0;font-size:15px}p{margin:10px 0}.muted{font-size:12px;color:#63738a}.eyebrow{font-size:12px;color:#4263a1;letter-spacing:.04em}
.score-heading,.section-heading{display:flex;align-items:center;justify-content:space-between;gap:18px}.score-number strong{font-size:56px;line-height:1.2;color:#225cca}.score-number span{margin-left:10px;color:#67758b}.level{background:#e7f1ff;color:#2156a8;border-radius:6px;padding:5px 12px;font-weight:700}.summary{font-size:16px}.numeric{white-space:nowrap;font-weight:700}
.table-scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px;text-align:left}th,td{padding:12px 10px;border-bottom:1px solid #e4eaf2;vertical-align:top}thead,tfoot{background:#f3f6fb}tbody th{min-width:90px}
.point-filters{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.point-filters .active{background:#235dc8;color:white;border-color:#235dc8}.point-card{border:1px solid #dfe7f2;border-radius:10px;margin:12px 0;overflow:hidden}.point-card summary{padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;background:#f8faff}.point-card summary strong{flex:1}.point-card summary:before{content:'▸';color:#63738a}.point-card[open] summary:before{content:'▾'}.detail-body{padding:4px 18px 16px}.status{font-size:12px;padding:2px 7px;border-radius:4px;background:#eef2f8;white-space:nowrap}.covered .status,.effective{background:#e6f6ed;color:#17603c}.missing .status,.incorrect .status,.error{background:#fff0ee;color:#a3392f}.partial .status,.redundant{background:#fff3d9;color:#805914}
blockquote{border-left:3px solid #9eb5d8;background:#f5f7fa;margin:10px 0;padding:10px 14px;white-space:pre-wrap;font-size:14px}.rewrite{background:#eef5ff;border-left:3px solid #3f79d9;padding:10px 14px;border-radius:0 8px 8px 0}.rewrite b{font-size:12px;color:#2b5d9c}.rewrite p{margin:5px 0;white-space:pre-wrap}.text-button{border:0;background:none;color:#235dc8;padding:0;font-size:13px}
.sentence-card,.diagnosis-card{padding:16px;border:1px solid #e2e9f2;border-radius:10px;margin:12px 0}.sentence-card header{display:flex;gap:10px;align-items:center}.section-heading label{font-size:12px;white-space:nowrap}.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.metrics div{background:#f5f8fc;padding:14px;border-radius:9px}.metrics span{display:block;font-size:12px;color:#63738a}.metrics strong{font-size:20px}
.structure-tree{display:flex;flex-direction:column;gap:10px;border-left:2px solid #a9bfe1;margin:18px 0 18px 8px;padding-left:18px}.structure-tree>div{position:relative;background:#f5f8fd;padding:12px;border-radius:8px}.structure-tree>div:before{content:'';position:absolute;width:18px;height:2px;background:#a9bfe1;left:-20px;top:26px}.structure-tree p{font-size:14px}.chain{color:#235dc8}.implementation{display:grid;grid-template-columns:72px 1fr;gap:10px;font-size:14px}.implementation dt{font-weight:700}.implementation dd{margin:0}.full-answer{white-space:pre-wrap;background:#f8fafc;border:1px solid #e3e9f2;padding:22px;font-size:16px;line-height:2.1;border-radius:10px}.training-card{background:#f5f8fe;border-radius:10px;padding:18px;margin:12px 0}a{color:#235dc8}
@media(max-width:700px){.report-section{padding:18px 14px}.report-nav{padding:14px}.score-heading{align-items:flex-start;flex-direction:column;gap:10px}.score-number strong{font-size:46px}.point-card summary{flex-wrap:wrap}.point-card summary strong{flex-basis:65%}.section-heading{align-items:flex-start;flex-direction:column;gap:4px}.metrics strong{font-size:17px}.full-answer{padding:14px}.sentence-card,.diagnosis-card{padding:12px}}
@media print{.report-nav,button{display:none}.report-section{break-inside:avoid}}
</style>
