<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, CircleCheck, DataAnalysis, EditPen, Reading, Timer } from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'

const router = useRouter()
const userStore = useUserStore()

const primaryTarget = computed(() => (userStore.isLoggedIn ? '/coach' : '/login'))

const productStats = [
  { value: '2', label: '申论 / 面试双主线' },
  { value: '5+', label: 'AI 评阅维度' },
  { value: '80', label: '本地历史记录上限' },
]

const productFlow = [
  { icon: Reading, title: '选择真题', desc: '按申论、面试、国考、省考、地区和年份快速定位。' },
  { icon: Timer, title: '限时作答', desc: '进入题目即开始计时，材料、题目和作答区保持清晰。' },
  { icon: DataAnalysis, title: 'AI 阅卷', desc: '提交后给分数、优点、缺点、建议、解读和参考范文。' },
  { icon: EditPen, title: '复盘提升', desc: '个人报告沉淀雷达图、练习统计和下一步建议。' },
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
        <a href="#flow">产品流程</a>
        <a href="#report">个人报告</a>
        <button class="btn-ghost" type="button" @click="router.push('/login')">登录</button>
        <button class="btn-primary" type="button" @click="router.push(userStore.isLoggedIn ? '/coach' : '/register')">
          {{ userStore.isLoggedIn ? '进入学习中心' : '免费注册' }}
        </button>
      </nav>
    </header>

    <section class="landing-hero">
      <div class="hero-copy">
        <p class="page-kicker">AI Study Command Center</p>
        <h1>申论和面试，从刷题变成可复盘的提分系统</h1>
        <p class="hero-subtitle">
          PolicyQuest 面向公考备考用户，把历年真题、限时作答、AI 阅卷和个人能力报告放在同一条训练链路里。
          你每次作答都会留下记录，系统会告诉你为什么失分，以及下一步该练什么。
        </p>

        <div class="hero-actions">
          <button class="btn-primary hero-btn" type="button" @click="goPrimary">
            {{ userStore.isLoggedIn ? '进入 AI 学习指挥舱' : '登录后开始训练' }}
            <el-icon><ArrowRight /></el-icon>
          </button>
          <button class="btn-ghost hero-btn" type="button" @click="router.push('/register')">创建备考档案</button>
        </div>

        <div class="hero-stats">
          <article v-for="item in productStats" :key="item.label">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </article>
        </div>
      </div>

      <div class="command-preview" aria-label="PolicyQuest 产品预览">
        <div class="preview-top">
          <span>AI 学习建议</span>
          <strong>预测分数 72 / 100</strong>
        </div>
        <div class="preview-path-grid">
          <article class="path-card essay">
            <span>申论</span>
            <h2>2026山东省考申论真题</h2>
            <p>材料分析、提出对策、文章写作</p>
            <button type="button">开始申论真题</button>
          </article>
          <article class="path-card interview">
            <span>面试</span>
            <h2>2025济南历城区面试真题</h2>
            <p>综合分析、应急应变、岗位匹配</p>
            <button type="button">开始面试真题</button>
          </article>
        </div>
        <div class="preview-advice">
          <div>
            <small>今日建议</small>
            <strong>先补“提出对策”，再做 1 套申论限时题</strong>
          </div>
          <ul>
            <li><CircleCheck /> 弱项：贯彻执行 61 分</li>
            <li><CircleCheck /> 下一步：45 分钟限时练习</li>
            <li><CircleCheck /> 复盘：对比参考范文结构</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="flow" class="flow-section">
      <div class="section-head">
        <p class="page-kicker">How It Works</p>
        <h2>一条完整训练链路</h2>
      </div>
      <div class="flow-grid">
        <article v-for="item in productFlow" :key="item.title">
          <el-icon><component :is="item.icon" /></el-icon>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section id="report" class="report-band">
      <div>
        <p class="page-kicker">Growth Report</p>
        <h2>报告不只展示数据，还告诉你为什么和下一步</h2>
        <p>
          个人报告会按综合分析、提出对策、文章写作、贯彻执行、应变处置等维度生成雷达图，
          并结合最近作答记录给出薄弱项、趋势和训练建议。
        </p>
      </div>
      <button class="btn-primary" type="button" @click="goPrimary">进入学习中心</button>
    </section>
  </main>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(0, 184, 217, 0.07) 1px, transparent 1px),
    linear-gradient(180deg, #f7fbff 0%, #ffffff 54%, #eef6ff 100%);
  background-size: 48px 48px, auto;
}

.landing-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76px;
  padding: 0 max(24px, calc((100vw - 1240px) / 2));
  border-bottom: 1px solid rgba(198, 211, 232, 0.72);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.brand,
.landing-nav,
.hero-actions,
.hero-stats {
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
  background: linear-gradient(135deg, #0050cb, #00b8d9);
  color: #ffffff;
  font-weight: 900;
}

.brand strong,
.brand small {
  display: block;
}

.brand small {
  color: var(--text-muted);
  font-size: 12px;
}

.landing-nav {
  gap: 12px;
}

.landing-nav a {
  padding: 10px 12px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 800;
}

.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(480px, 1fr);
  align-items: center;
  gap: 48px;
  width: min(1240px, calc(100vw - 48px));
  min-height: calc(100vh - 76px);
  margin: 0 auto;
  padding: 52px 0 42px;
}

.hero-copy h1 {
  max-width: 760px;
  margin: 0;
  color: #07182f;
  font-size: 62px;
  font-weight: 900;
  line-height: 1.08;
}

.hero-subtitle {
  max-width: 720px;
  margin: 24px 0 0;
  color: var(--text-secondary);
  font-size: 18px;
  line-height: 1.8;
}

.hero-actions {
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.hero-btn {
  min-height: 52px;
  padding: 0 24px;
}

.hero-stats {
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.hero-stats article,
.command-preview,
.flow-grid article,
.report-band {
  border: 1px solid rgba(196, 211, 238, 0.8);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 46px rgba(19, 42, 74, 0.08);
  backdrop-filter: blur(18px);
}

.hero-stats article {
  min-width: 160px;
  padding: 16px;
  border-radius: 14px;
}

.hero-stats strong,
.hero-stats span {
  display: block;
}

.hero-stats strong {
  color: #0050cb;
  font-size: 28px;
}

.hero-stats span {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.command-preview {
  min-height: 560px;
  padding: 28px;
  border-radius: 24px;
}

.preview-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
  color: #0758d8;
  font-weight: 900;
}

.preview-top span {
  padding: 8px 12px;
  border-radius: 999px;
  background: #e5fbff;
  color: #006a75;
  font-size: 12px;
}

.preview-path-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.path-card {
  display: grid;
  gap: 12px;
  min-height: 248px;
  padding: 22px;
  border: 1px solid rgba(0, 102, 255, 0.2);
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff, #eef6ff);
}

.path-card.interview {
  border-color: rgba(0, 184, 217, 0.26);
  background: linear-gradient(145deg, #ffffff, #eafbff);
}

.path-card span {
  justify-self: start;
  padding: 7px 12px;
  border-radius: 999px;
  background: #e6efff;
  color: #0758d8;
  font-size: 12px;
  font-weight: 900;
}

.path-card.interview span {
  background: #dffbff;
  color: #007a8c;
}

.path-card h2 {
  margin: 0;
  color: #07182f;
  font-size: 24px;
  line-height: 1.32;
}

.path-card p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.path-card button {
  align-self: end;
  min-height: 44px;
  border: 0;
  border-radius: 10px;
  background: var(--gradient-1);
  color: #ffffff;
  font-weight: 900;
}

.path-card.interview button {
  background: linear-gradient(135deg, #008faf, #00b8d9);
}

.preview-advice {
  display: grid;
  gap: 16px;
  margin-top: 18px;
  padding: 20px;
  border-radius: 16px;
  background: #f7fbff;
}

.preview-advice small {
  color: #007a8c;
  font-weight: 900;
}

.preview-advice strong {
  display: block;
  margin-top: 6px;
  font-size: 20px;
}

.preview-advice ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  color: var(--text-secondary);
  list-style: none;
}

.preview-advice li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-advice .el-icon {
  color: #08766c;
}

.flow-section,
.report-band {
  width: min(1240px, calc(100vw - 48px));
  margin: 0 auto;
}

.flow-section {
  padding: 44px 0 74px;
}

.section-head h2,
.report-band h2 {
  margin: 0;
  color: #07182f;
  font-size: 34px;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.flow-grid article {
  display: grid;
  gap: 12px;
  min-height: 204px;
  padding: 22px;
  border-radius: 14px;
}

.flow-grid .el-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: #e6efff;
  color: #0758d8;
  font-size: 22px;
}

.flow-grid h3 {
  margin: 0;
  font-size: 19px;
}

.flow-grid p,
.report-band p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.report-band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 74px;
  padding: 30px;
  border-radius: 18px;
}

.report-band p {
  max-width: 760px;
  margin-top: 12px;
}

@media (max-width: 1080px) {
  .landing-hero {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .flow-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .landing-header {
    height: 68px;
    padding: 0 16px;
  }

  .landing-nav a,
  .landing-nav .btn-ghost,
  .brand small {
    display: none;
  }

  .landing-hero,
  .flow-section,
  .report-band {
    width: calc(100vw - 32px);
  }

  .landing-hero {
    padding-top: 34px;
  }

  .hero-copy h1 {
    font-size: 38px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .command-preview {
    min-height: 0;
    padding: 18px;
    border-radius: 18px;
  }

  .preview-path-grid,
  .flow-grid,
  .report-band {
    grid-template-columns: 1fr;
  }

  .report-band {
    display: grid;
  }
}
</style>
