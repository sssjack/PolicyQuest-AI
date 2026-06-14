<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, CircleCheck, DataAnalysis, EditPen, Reading, Timer, TrendCharts } from '@element-plus/icons-vue'
import heroImage from '../../assets/hero.png'
import { useUserStore } from '../../store/user'

const router = useRouter()
const userStore = useUserStore()

const primaryTarget = computed(() => (userStore.isLoggedIn ? '/coach' : '/login'))

const stats = [
  { value: '2', label: '申论 / 面试主线' },
  { value: '5+', label: 'AI 评阅维度' },
  { value: '80', label: '本地历史记录上限' },
]

const steps = [
  { icon: Reading, title: '选真题', desc: '按申论、面试、国考、省考、地区和年份定位训练题。' },
  { icon: Timer, title: '限时作答', desc: '进入题目后开始计时，材料、题目和答题区保持清晰。' },
  { icon: DataAnalysis, title: 'AI 阅卷', desc: '提交后生成分数、优点、缺点、建议、解读和参考答案。' },
  { icon: TrendCharts, title: '复盘提升', desc: '个人报告沉淀能力雷达、练习统计和下一步建议。' },
]

const modules = [
  { title: '学习中心', text: '今日建议、预测分数、薄弱项和推荐真题集中呈现。', to: '/coach' },
  { title: '真题库', text: '统一管理申论与面试真题，支持类型、系统、年份和关键词筛选。', to: '/papers' },
  { title: '我的报告', text: '把每次作答沉淀为可解释的能力图谱和训练建议。', to: '/report' },
]

function goPrimary() {
  router.push(primaryTarget.value)
}
</script>

<template>
  <main class="landing-page">
    <header class="landing-header">
      <router-link to="/" class="brand">
        <span class="brand-mark">PQ</span>
        <span>
          <strong>PolicyQuest</strong>
          <small>AI 公考学习引擎</small>
        </span>
      </router-link>

      <nav class="landing-nav">
        <a href="#flow">产品链路</a>
        <a href="#modules">功能入口</a>
        <button class="btn-ghost" type="button" @click="router.push('/login')">登录</button>
        <button class="btn-primary" type="button" @click="router.push(userStore.isLoggedIn ? '/coach' : '/register')">
          {{ userStore.isLoggedIn ? '进入学习中心' : '免费注册' }}
        </button>
      </nav>
    </header>

    <section class="hero-section" :style="{ '--hero-image': `url(${heroImage})` }">
      <div class="hero-inner">
        <p class="page-kicker">AI Study Command Center</p>
        <h1>PolicyQuest</h1>
        <p class="hero-subtitle">
          把公考申论、面试真题、限时作答、AI 阅卷和个人能力报告放进同一条训练链路。
          先登录或注册，再进入统一学习中心，后续所有功能都从同一套工作台进入。
        </p>
        <div class="hero-actions">
          <button class="btn-primary hero-btn" type="button" @click="goPrimary">
            {{ userStore.isLoggedIn ? '进入学习中心' : '登录后开始训练' }}
            <el-icon><ArrowRight /></el-icon>
          </button>
          <button class="btn-ghost hero-btn" type="button" @click="router.push('/register')">创建备考档案</button>
        </div>
        <div class="hero-stats" aria-label="产品能力概览">
          <article v-for="item in stats" :key="item.label">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </article>
        </div>
      </div>
    </section>

    <section id="flow" class="flow-section">
      <div class="section-head">
        <p class="page-kicker">How It Works</p>
        <h2>一条完整训练链路</h2>
        <p>首页介绍产品，登录注册建立身份，进入学习中心后再分流到真题、训练和报告。</p>
      </div>
      <div class="flow-grid">
        <article v-for="item in steps" :key="item.title">
          <el-icon><component :is="item.icon" /></el-icon>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section id="modules" class="modules-section">
      <article v-for="item in modules" :key="item.title" class="module-card">
        <span><CircleCheck /></span>
        <h3>{{ item.title }}</h3>
        <p>{{ item.text }}</p>
        <button type="button" @click="router.push(userStore.isLoggedIn ? item.to : '/login')">
          {{ userStore.isLoggedIn ? '进入功能' : '登录后进入' }}
          <el-icon><ArrowRight /></el-icon>
        </button>
      </article>
    </section>

    <section class="report-band">
      <div>
        <p class="page-kicker">Growth Report</p>
        <h2>报告不只展示数据，还解释为什么和下一步</h2>
        <p>系统会按综合分析、提出对策、文章写作、贯彻执行、应变处置等维度生成能力图谱，并结合最近作答记录给出训练建议。</p>
      </div>
      <button class="btn-primary" type="button" @click="goPrimary">
        进入学习中心 <el-icon><EditPen /></el-icon>
      </button>
    </section>
  </main>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(0, 184, 217, 0.045) 1px, transparent 1px),
    linear-gradient(180deg, #f7fbff 0%, #ffffff 56%, #f1f8ff 100%);
  background-size: 46px 46px, auto;
}

.landing-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  padding: 0 max(24px, calc((100vw - 1180px) / 2));
  border-bottom: 1px solid rgba(198, 211, 232, 0.72);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.brand,
.landing-nav,
.hero-actions,
.hero-stats,
.module-card button {
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
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--gradient-1);
  color: #ffffff;
  font-weight: 900;
}

.brand strong,
.brand small {
  display: block;
}

.brand small {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
}

.landing-nav {
  gap: 10px;
}

.landing-nav a {
  padding: 10px 12px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 900;
}

.hero-section {
  position: relative;
  min-height: calc(100vh - 72px);
  padding: 84px 0 72px;
  background:
    linear-gradient(90deg, rgba(247, 251, 255, 0.94) 0%, rgba(247, 251, 255, 0.8) 48%, rgba(247, 251, 255, 0.18) 100%),
    var(--hero-image) right 11% center / min(34vw, 430px) auto no-repeat;
}

.hero-section::after {
  position: absolute;
  right: max(20px, calc((100vw - 1180px) / 2));
  bottom: 34px;
  left: max(20px, calc((100vw - 1180px) / 2));
  height: 1px;
  content: "";
  background: linear-gradient(90deg, transparent, rgba(0, 80, 203, 0.22), transparent);
}

.hero-inner {
  width: min(1180px, calc(100vw - 48px));
  margin: 0 auto;
}

.hero-inner h1 {
  max-width: 700px;
  margin: 0;
  color: #07182f;
  font-size: 80px;
  font-weight: 900;
  line-height: 0.98;
}

.hero-subtitle {
  max-width: 690px;
  margin: 24px 0 0;
  color: var(--text-secondary);
  font-size: 18px;
  line-height: 1.85;
}

.hero-actions {
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.hero-btn {
  min-height: 52px;
  padding: 0 24px;
}

.hero-stats {
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 38px;
}

.hero-stats article,
.flow-grid article,
.module-card,
.report-band {
  border: 1px solid rgba(196, 211, 238, 0.82);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(18px);
}

.hero-stats article {
  min-width: 168px;
  padding: 16px;
  border-radius: 14px;
}

.hero-stats strong,
.hero-stats span {
  display: block;
}

.hero-stats strong {
  color: var(--primary);
  font-size: 30px;
}

.hero-stats span {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 900;
}

.flow-section,
.modules-section,
.report-band {
  width: min(1180px, calc(100vw - 48px));
  margin: 0 auto;
}

.flow-section {
  padding: 64px 0 28px;
}

.section-head h2,
.report-band h2 {
  margin: 0;
  color: #07182f;
  font-size: 34px;
}

.section-head p:last-child,
.report-band p {
  max-width: 760px;
  margin: 12px 0 0;
  color: var(--text-secondary);
  line-height: 1.72;
}

.flow-grid,
.modules-section {
  display: grid;
  gap: 16px;
}

.flow-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 24px;
}

.flow-grid article,
.module-card {
  display: grid;
  gap: 12px;
  min-height: 190px;
  padding: 22px;
  border-radius: 14px;
}

.flow-grid .el-icon,
.module-card > span {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: #eaf3ff;
  color: var(--primary);
  font-size: 22px;
}

.flow-grid h3,
.module-card h3 {
  margin: 0;
  color: #07182f;
  font-size: 20px;
}

.flow-grid p,
.module-card p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.modules-section {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 34px 0;
}

.module-card button {
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  border: 0;
  border-radius: 10px;
  background: var(--surface-muted);
  color: var(--primary);
  font-weight: 900;
}

.report-band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 74px;
  padding: 30px;
  border-radius: 16px;
}

@media (max-width: 980px) {
  .hero-section {
    min-height: auto;
    background:
      linear-gradient(180deg, rgba(247, 251, 255, 0.96) 0%, rgba(247, 251, 255, 0.84) 100%),
      var(--hero-image) right 28px top 70px / 220px auto no-repeat;
  }

  .hero-inner h1 {
    font-size: 58px;
  }

  .flow-grid,
  .modules-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .landing-header {
    height: 68px;
    padding: 0 16px;
  }

  .landing-nav a,
  .landing-nav .btn-ghost,
  .brand small {
    display: none;
  }

  .hero-section {
    padding: 52px 0 46px;
    background:
      linear-gradient(180deg, rgba(247, 251, 255, 0.98) 0%, rgba(247, 251, 255, 0.92) 100%),
      var(--hero-image) right -34px top 36px / 180px auto no-repeat;
  }

  .hero-inner,
  .flow-section,
  .modules-section,
  .report-band {
    width: calc(100vw - 32px);
  }

  .hero-inner h1 {
    font-size: 44px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .flow-grid,
  .modules-section,
  .report-band {
    grid-template-columns: 1fr;
  }

  .report-band {
    display: grid;
  }
}
</style>
