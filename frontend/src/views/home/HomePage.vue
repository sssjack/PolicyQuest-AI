<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import heroImage from '../../assets/hero.png'

const router = useRouter()
const userStore = useUserStore()

const primaryTarget = computed(() => (userStore.isLoggedIn ? '/coach' : '/login'))

const highlights = [
  { value: '5 维', label: '申论与面试评分维度' },
  { value: '120s', label: '生成诊断与改写方向' },
  { value: '30 天', label: '追踪薄弱项变化' },
]

const modules = [
  { title: 'AI 学习指挥舱', desc: '把今日建议、预测分数、薄弱项和下一步训练放在第一屏。' },
  { title: '真题与热点训练', desc: '覆盖国考、省考、事业编申论与结构化面试场景。' },
  { title: '深度评阅报告', desc: '给出分项诊断、扣分原因、可执行建议和示范改写。' },
]

const flow = ['选择题目', '完成作答', 'AI 评阅', '按建议重练']

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
          <small>AI Exam Coach</small>
        </span>
      </router-link>
      <nav class="landing-nav">
        <a href="#modules">功能</a>
        <a href="#flow">流程</a>
        <button class="btn-ghost" type="button" @click="router.push('/login')">登录</button>
        <button class="btn-primary" type="button" @click="router.push(userStore.isLoggedIn ? '/coach' : '/register')">
          {{ userStore.isLoggedIn ? '进入工作台' : '注册体验' }}
        </button>
      </nav>
    </header>

    <section class="landing-hero">
      <div class="hero-copy">
        <p class="page-kicker">PolicyQuest AI Study Lab</p>
        <h1>把申论与面试训练，变成每天可执行的 AI 提分计划</h1>
        <p class="hero-subtitle">
          面向公考、事业编和结构化面试备考人群，PolicyQuest 会根据你的作答生成评分、薄弱项诊断、素材建议和示范改写，让每次练习都知道下一步怎么提分。
        </p>
        <div class="hero-actions">
          <button class="btn-primary hero-btn" type="button" @click="goPrimary">
            {{ userStore.isLoggedIn ? '进入 AI 学习指挥舱' : '登录后开始训练' }}
          </button>
          <button class="btn-ghost hero-btn" type="button" @click="router.push('/register')">创建备考档案</button>
        </div>
        <div class="hero-highlights">
          <article v-for="item in highlights" :key="item.label">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </article>
        </div>
      </div>

      <div class="hero-visual" aria-label="PolicyQuest 产品预览">
        <div class="visual-header">
          <span>AI Coach Online</span>
          <strong>预测分数 +4.2</strong>
        </div>
        <img :src="heroImage" alt="PolicyQuest 工作台预览" />
        <aside class="ai-card">
          <span>今日建议</span>
          <strong>先补政策逻辑，再做 1 套申论模拟</strong>
          <small>原因：最近三次训练中，论据充分性下降 12%。</small>
        </aside>
      </div>
    </section>

    <section id="modules" class="modules-section">
      <div class="section-head">
        <p class="page-kicker">Core Modules</p>
        <h2>不是简单刷题，而是围绕薄弱项推进</h2>
      </div>
      <div class="module-grid">
        <article v-for="item in modules" :key="item.title" class="module-card">
          <span></span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section id="flow" class="flow-section">
      <div>
        <p class="page-kicker">Training Flow</p>
        <h2>一次练习形成一条可复盘的提分路径</h2>
      </div>
      <div class="flow-list">
        <span v-for="(item, index) in flow" :key="item">{{ index + 1 }}. {{ item }}</span>
      </div>
      <button class="btn-primary" type="button" @click="goPrimary">进入训练</button>
    </section>
  </main>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(0, 221, 255, 0.07) 1px, transparent 1px),
    linear-gradient(180deg, #f8fbff 0%, #ffffff 52%, #eef6ff 100%);
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
  border-bottom: 1px solid rgba(181, 198, 226, 0.58);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
}

.brand,
.landing-nav,
.hero-actions,
.hero-highlights,
.flow-list {
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
  border-radius: 14px;
  background: linear-gradient(135deg, #0050cb, #00d5ff);
  color: #ffffff;
  font-weight: 900;
  box-shadow: 0 16px 34px rgba(0, 102, 255, 0.22);
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
  grid-template-columns: minmax(0, 0.9fr) minmax(460px, 1fr);
  align-items: center;
  gap: 48px;
  width: min(1240px, calc(100vw - 48px));
  min-height: calc(100vh - 76px);
  margin: 0 auto;
  padding: 48px 0 36px;
}

.hero-copy h1 {
  max-width: 720px;
  margin: 0;
  color: #07182f;
  font-size: 62px;
  font-weight: 900;
  line-height: 1.05;
}

.hero-subtitle {
  max-width: 680px;
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

.hero-highlights {
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.hero-highlights article,
.module-card,
.flow-section {
  border: 1px solid rgba(196, 211, 238, 0.8);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 46px rgba(19, 42, 74, 0.08);
  backdrop-filter: blur(18px);
}

.hero-highlights article {
  min-width: 150px;
  padding: 16px;
  border-radius: 16px;
}

.hero-highlights strong,
.hero-highlights span {
  display: block;
}

.hero-highlights strong {
  color: #0050cb;
  font-size: 26px;
}

.hero-highlights span {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
}

.hero-visual {
  position: relative;
  min-height: 560px;
  padding: 28px;
  border: 1px solid rgba(160, 191, 244, 0.72);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(0, 80, 203, 0.14), rgba(0, 213, 255, 0.16)),
    #ffffff;
  box-shadow: 0 30px 80px rgba(19, 42, 74, 0.16);
}

.visual-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  color: #0758d8;
  font-weight: 900;
}

.visual-header span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(0, 213, 255, 0.14);
  color: #006a75;
  font-size: 12px;
}

.hero-visual img {
  width: 100%;
  height: 420px;
  object-fit: cover;
  border: 1px solid rgba(196, 211, 238, 0.88);
  border-radius: 22px;
  background: #ffffff;
}

.ai-card {
  position: absolute;
  right: 34px;
  bottom: 34px;
  display: grid;
  gap: 8px;
  width: min(340px, calc(100% - 68px));
  padding: 18px;
  border: 1px solid rgba(0, 213, 255, 0.34);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 20px 44px rgba(0, 80, 203, 0.16);
}

.ai-card span {
  color: #007d8c;
  font-size: 12px;
  font-weight: 900;
}

.ai-card strong {
  font-size: 20px;
}

.ai-card small {
  color: var(--text-secondary);
  line-height: 1.5;
}

.modules-section,
.flow-section {
  width: min(1240px, calc(100vw - 48px));
  margin: 0 auto;
}

.modules-section {
  padding: 42px 0 72px;
}

.section-head h2,
.flow-section h2 {
  margin: 0;
  color: #07182f;
  font-size: 34px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.module-card {
  display: grid;
  gap: 14px;
  min-height: 210px;
  padding: 24px;
  border-radius: 16px;
}

.module-card span {
  width: 44px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, #0050cb, #00d5ff);
}

.module-card h3 {
  margin: 0;
  font-size: 20px;
}

.module-card p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.flow-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 24px;
  margin-bottom: 72px;
  padding: 28px;
  border-radius: 20px;
}

.flow-list {
  flex-wrap: wrap;
  gap: 10px;
}

.flow-list span {
  min-height: 38px;
  padding: 10px 14px;
  border-radius: 999px;
  background: #eff6ff;
  color: #0758d8;
  font-size: 13px;
  font-weight: 900;
}

@media (max-width: 960px) {
  .landing-nav a {
    display: none;
  }

  .landing-hero {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .hero-copy h1 {
    font-size: 44px;
  }

  .module-grid,
  .flow-section {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: auto;
  }
}

@media (max-width: 620px) {
  .landing-header {
    height: 68px;
    padding: 0 16px;
  }

  .brand small,
  .landing-nav .btn-ghost {
    display: none;
  }

  .landing-hero,
  .modules-section,
  .flow-section {
    width: calc(100vw - 32px);
  }

  .landing-hero {
    padding-top: 34px;
    gap: 28px;
  }

  .hero-copy h1 {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .hero-visual {
    padding: 16px;
    border-radius: 22px;
  }

  .hero-visual img {
    height: 280px;
    border-radius: 18px;
  }

  .ai-card {
    position: static;
    width: 100%;
    margin-top: 14px;
  }
}
</style>
