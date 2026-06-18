<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  CircleCheck,
  DataAnalysis,
  EditPen,
  Reading,
  Timer,
  TrendCharts,
} from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'

const router = useRouter()
const userStore = useUserStore()
const activeType = ref<'all' | 'essay' | 'interview'>('all')

const primaryTarget = computed(() => (userStore.isLoggedIn ? '/coach' : '/login'))

const navItems = [
  { label: '首页', href: '#hero' },
  { label: '申论真题', to: '/papers?type=essay' },
  { label: '面试真题', to: '/papers?type=interview' },
  { label: '学习报告', to: '/report' },
  { label: '练习历史', to: '/history' },
]

const paperTabs = [
  { key: 'all', label: '全部真题' },
  { key: 'essay', label: '申论' },
  { key: 'interview', label: '面试' },
] as const

const papers = [
  {
    type: '申论',
    tag: '国考',
    title: '2026国考申论真题及答案解析（行政执法卷）',
    meta: '5题 · 150分钟 · AI逐题批改',
    color: 'blue',
  },
  {
    type: '申论',
    tag: '省考',
    title: '2025浙江省考申论真题及答案解析（A类）',
    meta: '3题 · 150分钟 · 政策素材解读',
    color: 'teal',
  },
  {
    type: '面试',
    tag: '结构化',
    title: '2025浙江省考面试真题及答案解析（2月22日B类）',
    meta: '3题 · 21分钟 · 表达逐题诊断',
    color: 'amber',
  },
]

const filteredPapers = computed(() => {
  if (activeType.value === 'all') return papers
  return papers.filter(item => activeType.value === 'essay' ? item.type === '申论' : item.type === '面试')
})

const reportItems = [
  { title: '结论评分', value: '87', note: '良好 · 主要提升空间在材料转化' },
  { title: '主要扣分原因', value: '3项', note: '要点遗漏、对策偏宏观、政策结合不足' },
  { title: '高分参考表达', value: '1000字', note: '按题干字数与文体要求生成' },
]

const modules = [
  {
    icon: Reading,
    title: '申论真题',
    desc: '按地区、年份、题型进入整卷练习，提交后生成逐题批改报告。',
    action: '去练申论',
    to: '/papers?type=essay',
  },
  {
    icon: Timer,
    title: '面试真题',
    desc: '结构化面试按题作答，重点训练审题、逻辑、岗位匹配和应变。',
    action: '去练面试',
    to: '/papers?type=interview',
  },
  {
    icon: DataAnalysis,
    title: '学习报告',
    desc: '把练习历史、错题、笔记、收藏和能力雷达沉淀到同一页面。',
    action: '看报告',
    to: '/report',
  },
]

const workflow = [
  { title: '选真题', desc: '从申论或面试题库开始。' },
  { title: '限时作答', desc: '材料、题干和答题区同屏。' },
  { title: 'AI批改', desc: '按真实评分维度逐题诊断。' },
  { title: '复盘提分', desc: '形成报告、笔记和下一步建议。' },
]

const reportFeatures = [
  '总分与维度分统一展示',
  '引用原答案指出扣分原因',
  '高分范文严格贴合作答要求',
  '政策案例说明如何融入本题',
]

function routeTo(target: string) {
  if (!userStore.isLoggedIn && target !== '/login' && target !== '/register') {
    router.push('/login')
    return
  }
  router.push(target)
}

function goPrimary() {
  router.push(primaryTarget.value)
}
</script>

<template>
  <main id="hero" class="landing-page">
    <header class="landing-header">
      <router-link to="/" class="brand" aria-label="PolicyQuest 首页">
        <span class="brand-mark">PQ</span>
        <span class="brand-text">
          <strong>PolicyQuest</strong>
          <small>AI 公考训练引擎</small>
        </span>
      </router-link>

      <nav class="landing-nav" aria-label="首页导航">
        <button
          v-for="item in navItems"
          :key="item.label"
          type="button"
          class="nav-link"
          @click="item.to ? routeTo(item.to) : undefined"
        >
          <a v-if="item.href" :href="item.href">{{ item.label }}</a>
          <span v-else>{{ item.label }}</span>
        </button>
      </nav>

      <div class="header-actions">
        <button class="btn-ghost" type="button" @click="router.push('/login')">登录</button>
        <button class="btn-primary" type="button" @click="goPrimary">
          {{ userStore.isLoggedIn ? '进入学习中心' : '开始练习' }}
        </button>
      </div>
    </header>

    <section class="hero-section">
      <div class="hero-copy">
        <p class="page-kicker">AI EXAM COACH</p>
        <h1>真题练习到批改报告，一页完成</h1>
        <p class="hero-subtitle">
          申论、面试真题练习和 AI 批改报告连成一条训练链路。每次作答都能看到分数、扣分原因、高分范文、政策素材和下一步提分建议。
        </p>
        <div class="hero-actions">
          <button class="btn-primary hero-btn" type="button" @click="goPrimary">
            开始一次 AI 批改
            <el-icon><ArrowRight /></el-icon>
          </button>
          <button class="btn-ghost hero-btn" type="button" @click="routeTo('/report')">查看示例报告</button>
        </div>
        <div class="trust-row" aria-label="产品能力">
          <span>真实题库</span>
          <span>逐题批改</span>
          <span>能力雷达</span>
          <span>笔记沉淀</span>
        </div>
      </div>

      <div class="hero-product" aria-label="产品预览">
        <section class="paper-board">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">TRUE PAPER</p>
              <h2>真题速选</h2>
            </div>
            <button type="button" @click="routeTo('/papers')">全部真题 <el-icon><ArrowRight /></el-icon></button>
          </div>
          <div class="paper-tabs" role="tablist" aria-label="真题类型">
            <button
              v-for="tab in paperTabs"
              :key="tab.key"
              type="button"
              :class="{ active: activeType === tab.key }"
              @click="activeType = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="paper-list">
            <article v-for="paper in filteredPapers" :key="paper.title" class="paper-row">
              <span class="type-chip" :class="paper.color">{{ paper.type }}</span>
              <div>
                <h3>{{ paper.title }}</h3>
                <p>{{ paper.tag }} · {{ paper.meta }}</p>
              </div>
              <button type="button" @click="routeTo('/papers')">开始</button>
            </article>
          </div>
        </section>

        <section class="report-preview">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">AI REPORT</p>
              <h2>批改报告预览</h2>
            </div>
            <span class="live-pill">批改完成</span>
          </div>

          <div class="score-summary">
            <div class="score-ring">
              <strong>87</strong>
              <span>/100</span>
            </div>
            <div>
              <h3>良好</h3>
              <p>材料转化、政策结合和对策落地还有提分空间。</p>
            </div>
          </div>

          <div class="report-list">
            <article v-for="item in reportItems" :key="item.title">
              <span>{{ item.title }}</span>
              <strong>{{ item.value }}</strong>
              <p>{{ item.note }}</p>
            </article>
          </div>
        </section>
      </div>
    </section>

    <section class="module-section" aria-label="核心入口">
      <article v-for="item in modules" :key="item.title" class="module-item">
        <el-icon><component :is="item.icon" /></el-icon>
        <h2>{{ item.title }}</h2>
        <p>{{ item.desc }}</p>
        <button type="button" @click="routeTo(item.to)">
          {{ item.action }}
          <el-icon><ArrowRight /></el-icon>
        </button>
      </article>
    </section>

    <section class="workflow-section">
      <div class="section-head">
        <p class="page-kicker">LEARNING LOOP</p>
        <h2>从做题到提分，形成闭环</h2>
        <p>首页不是让用户看热闹，而是把最重要的训练路径放到眼前：选题、作答、批改、复盘。</p>
      </div>
      <div class="workflow-strip">
        <article v-for="(item, index) in workflow" :key="item.title">
          <span>{{ index + 1 }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section class="report-band">
      <div class="report-band-copy">
        <p class="page-kicker">WHY IT WORKS</p>
        <h2>AI 批改不是打个分，而是告诉你怎么改</h2>
        <p>
          批改报告会把原答案、评分依据、高分表达和政策素材放在一起，帮助你知道为什么丢分、下一次应该怎么写。
        </p>
        <div class="feature-checks">
          <span v-for="item in reportFeatures" :key="item">
            <el-icon><CircleCheck /></el-icon>
            {{ item }}
          </span>
        </div>
      </div>
      <div class="answer-upgrade">
        <div class="upgrade-head">
          <el-icon><EditPen /></el-icon>
          <strong>表达升级示例</strong>
        </div>
        <p class="before">原表达：加强管理，提高服务意识。</p>
        <p class="after">升级后：建立问题台账、责任清单和整改闭环，明确办理时限并跟踪问效。</p>
        <button class="btn-primary" type="button" @click="goPrimary">
          进入学习中心
          <el-icon><TrendCharts /></el-icon>
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(47, 99, 246, 0.045) 1px, transparent 1px),
    linear-gradient(180deg, #f6f9ff 0%, #ffffff 50%, #f3f8ff 100%);
  background-size: 48px 48px, auto;
}

.landing-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 28px;
  height: 76px;
  padding: 0 max(24px, calc((100vw - 1180px) / 2));
  border-bottom: 1px solid rgba(198, 211, 232, 0.72);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.brand,
.landing-nav,
.header-actions,
.hero-actions,
.trust-row,
.panel-head,
.paper-row,
.score-summary,
.feature-checks span,
.upgrade-head {
  display: flex;
  align-items: center;
}

.brand {
  gap: 12px;
  color: var(--text-primary);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #2f63f6;
  color: #ffffff;
  font-size: 14px;
  font-weight: 900;
  box-shadow: 0 10px 24px rgba(47, 99, 246, 0.22);
}

.brand-text strong,
.brand-text small {
  display: block;
}

.brand-text strong {
  color: #0b1c30;
  font-size: 19px;
  letter-spacing: 0;
}

.brand-text small {
  margin-top: 2px;
  color: #758195;
  font-size: 12px;
  font-weight: 800;
}

.landing-nav {
  justify-content: center;
  gap: 6px;
}

.nav-link {
  border: 0;
  padding: 10px 12px;
  background: transparent;
  color: #536078;
  font-size: 14px;
  font-weight: 900;
}

.nav-link a,
.nav-link span {
  color: inherit;
}

.nav-link:hover {
  color: #2f63f6;
}

.header-actions {
  gap: 10px;
}

.hero-section,
.module-section,
.workflow-section,
.report-band {
  width: min(1180px, calc(100vw - 48px));
  margin: 0 auto;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(460px, 0.95fr) minmax(560px, 1.05fr);
  gap: 36px;
  align-items: center;
  padding: 72px 0 64px;
}

.hero-copy h1 {
  max-width: 620px;
  margin: 0;
  color: #07182f;
  font-size: clamp(46px, 4.6vw, 64px);
  font-weight: 900;
  line-height: 1.06;
}

.hero-subtitle {
  max-width: 620px;
  margin: 22px 0 0;
  color: #415066;
  font-size: 17px;
  line-height: 1.9;
}

.hero-actions {
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.hero-btn {
  min-height: 52px;
  padding-inline: 24px;
}

.trust-row {
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.trust-row span {
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid rgba(47, 99, 246, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: #536078;
  font-size: 12px;
  font-weight: 900;
}

.hero-product {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(280px, 0.88fr);
  gap: 18px;
  align-items: stretch;
}

.paper-board,
.report-preview,
.module-item,
.workflow-strip,
.report-band,
.answer-upgrade {
  border: 1px solid rgba(196, 211, 238, 0.78);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 46px rgba(19, 42, 74, 0.09);
  backdrop-filter: blur(18px);
}

.paper-board,
.report-preview {
  min-height: 456px;
  padding: 22px;
  border-radius: 18px;
}

.panel-head {
  justify-content: space-between;
  gap: 16px;
}

.panel-head h2 {
  margin: 2px 0 0;
  color: #07182f;
  font-size: 24px;
  font-weight: 900;
}

.panel-kicker {
  margin: 0;
  color: #2f63f6;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.panel-head button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: #7a8494;
  font-size: 13px;
  font-weight: 900;
}

.paper-tabs {
  display: inline-flex;
  gap: 6px;
  margin: 22px 0 8px;
  padding: 5px;
  border-radius: 12px;
  background: #edf3ff;
}

.paper-tabs button {
  min-width: 76px;
  min-height: 34px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #758195;
  font-size: 13px;
  font-weight: 900;
}

.paper-tabs button.active {
  background: #2f63f6;
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(47, 99, 246, 0.18);
}

.paper-list {
  display: grid;
}

.paper-row {
  gap: 14px;
  min-height: 96px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(33, 48, 74, 0.08);
}

.paper-row:last-child {
  border-bottom: 0;
}

.paper-row h3 {
  margin: 0;
  color: #111d32;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.45;
}

.paper-row p {
  margin: 7px 0 0;
  color: #8190a5;
  font-size: 13px;
  font-weight: 800;
}

.paper-row button {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: #2f63f6;
  font-size: 14px;
  font-weight: 900;
}

.type-chip,
.live-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 11px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.type-chip.blue {
  background: #e8f0ff;
  color: #2f63f6;
}

.type-chip.teal {
  background: #e7faf5;
  color: #00796b;
}

.type-chip.amber {
  background: #fff6dc;
  color: #b86c00;
}

.live-pill {
  background: #e7faf5;
  color: #00796b;
}

.score-summary {
  gap: 18px;
  margin-top: 24px;
  padding: 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f6f9ff, #ffffff);
}

.score-ring {
  display: grid;
  grid-template-rows: auto auto;
  width: 96px;
  height: 96px;
  align-content: center;
  justify-items: center;
  gap: 3px;
  border-radius: 999px;
  background:
    radial-gradient(circle at center, #ffffff 58%, transparent 60%),
    conic-gradient(#2f63f6 313deg, #e6ecf6 0);
}

.score-ring strong,
.score-ring span {
  display: block;
  color: #245bb1;
  font-weight: 900;
  line-height: 1;
}

.score-ring strong {
  font-size: 34px;
}

.score-ring span {
  font-size: 13px;
}

.score-summary h3 {
  margin: 0 0 6px;
  color: #07182f;
  font-size: 24px;
}

.score-summary p,
.report-list p {
  margin: 0;
  color: #59687d;
  font-size: 13px;
  line-height: 1.7;
}

.report-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.report-list article {
  padding: 14px 0;
  border-bottom: 1px solid rgba(33, 48, 74, 0.08);
}

.report-list article:last-child {
  border-bottom: 0;
}

.report-list span {
  color: #8190a5;
  font-size: 12px;
  font-weight: 900;
}

.report-list strong {
  display: block;
  margin: 2px 0 4px;
  color: #111d32;
  font-size: 22px;
  font-weight: 900;
}

.module-section {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 28px 0 44px;
}

.module-item {
  display: grid;
  gap: 12px;
  padding: 24px;
  border-radius: 18px;
}

.module-item > .el-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 12px;
  background: #edf3ff;
  color: #2f63f6;
  font-size: 22px;
}

.module-item h2,
.section-head h2,
.report-band h2 {
  margin: 0;
  color: #07182f;
  font-size: 30px;
  font-weight: 900;
}

.module-item h2 {
  font-size: 22px;
}

.module-item p,
.section-head p:last-child,
.report-band-copy p {
  margin: 0;
  color: #536078;
  line-height: 1.75;
}

.module-item button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  border: 0;
  padding: 0;
  background: transparent;
  color: #2f63f6;
  font-size: 14px;
  font-weight: 900;
}

.workflow-section {
  padding: 24px 0 54px;
}

.section-head {
  display: grid;
  gap: 10px;
  max-width: 760px;
}

.workflow-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin-top: 22px;
  border-radius: 18px;
  overflow: hidden;
}

.workflow-strip article {
  min-height: 154px;
  padding: 24px;
  border-right: 1px solid rgba(33, 48, 74, 0.08);
}

.workflow-strip article:last-child {
  border-right: 0;
}

.workflow-strip span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 8px;
  background: #2f63f6;
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
}

.workflow-strip h3 {
  margin: 14px 0 6px;
  color: #07182f;
  font-size: 18px;
  font-weight: 900;
}

.workflow-strip p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.report-band {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.9fr);
  gap: 32px;
  align-items: center;
  margin-bottom: 72px;
  padding: 32px;
  border-radius: 18px;
}

.report-band-copy {
  display: grid;
  gap: 12px;
}

.feature-checks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  margin-top: 8px;
}

.feature-checks span {
  gap: 8px;
  color: #30415d;
  font-size: 14px;
  font-weight: 900;
}

.feature-checks .el-icon {
  color: #00796b;
}

.answer-upgrade {
  display: grid;
  gap: 14px;
  padding: 22px;
  border-radius: 16px;
  background: #ffffff;
}

.upgrade-head {
  gap: 8px;
  color: #2f63f6;
  font-weight: 900;
}

.answer-upgrade p {
  margin: 0;
  padding: 14px;
  border-radius: 10px;
  color: #35445b;
  line-height: 1.75;
}

.answer-upgrade .before {
  background: #f6f8fc;
}

.answer-upgrade .after {
  border-left: 4px solid #2f63f6;
  background: #eef5ff;
  font-weight: 800;
}

.answer-upgrade .btn-primary {
  width: fit-content;
  margin-top: 4px;
}

@media (max-width: 1120px) {
  .landing-header {
    grid-template-columns: auto auto;
  }

  .landing-nav {
    display: none;
  }

  .hero-section,
  .hero-product,
  .report-band {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .landing-header {
    height: auto;
    padding: 14px 16px;
  }

  .brand-text small,
  .header-actions .btn-ghost {
    display: none;
  }

  .hero-section,
  .module-section,
  .workflow-section,
  .report-band {
    width: calc(100vw - 32px);
  }

  .hero-section {
    min-height: auto;
    padding: 46px 0 34px;
  }

  .hero-copy h1 {
    font-size: 40px;
  }

  .hero-subtitle {
    font-size: 15px;
  }

  .hero-product,
  .module-section,
  .workflow-strip,
  .feature-checks {
    grid-template-columns: 1fr;
  }

  .paper-board,
  .report-preview {
    min-height: auto;
  }

  .paper-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .paper-row button {
    margin-left: 0;
  }

  .workflow-strip article {
    border-right: 0;
    border-bottom: 1px solid rgba(33, 48, 74, 0.08);
  }

  .workflow-strip article:last-child {
    border-bottom: 0;
  }

  .report-band {
    padding: 22px;
  }
}
</style>
