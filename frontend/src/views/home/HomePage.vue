<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import SvgIcon from '../../components/SvgIcon.vue'
import heroImage from '../../assets/hero.png'

const router = useRouter()
const userStore = useUserStore()

const features = [
  { icon: 'hot', title: '热点驱动出题', desc: '围绕政策文件、时政评论和基层案例生成训练内容，题目保持新鲜度。' },
  { icon: 'brain', title: 'AI 智能评阅', desc: '申论、面试、客观题统一沉淀为可复盘的评分报告和能力标签。' },
  { icon: 'chart', title: '个人能力画像', desc: '跟踪正确率、题型短板、练习节奏，给出下一步学习建议。' },
  { icon: 'timer', title: '沉浸式训练', desc: '计时答题、题目导航、错题回练，让日常训练更接近真实考场。' },
]

const stats = [
  { value: '6', label: '备考方向' },
  { value: '5', label: '评分维度' },
  { value: '24h', label: '热点更新' },
  { value: 'AI', label: '专属教练' },
]

function goStart() {
  router.push(userStore.isLoggedIn ? '/app/dashboard' : '/login')
}
</script>

<template>
  <main class="home-page">
    <header class="site-header">
      <router-link to="/" class="brand">
        <span class="brand-mark">PQ</span>
        <span>
          <strong>PolicyQuest</strong>
          <small>AI Exam Coach</small>
        </span>
      </router-link>
      <nav class="site-nav">
        <a href="#features">功能</a>
        <a href="#workflow">流程</a>
        <button v-if="userStore.isLoggedIn" class="btn-ghost" type="button" @click="router.push('/app/dashboard')">进入工作台</button>
        <button v-if="!userStore.isLoggedIn" class="btn-ghost" type="button" @click="router.push('/login')">登录</button>
        <button v-if="!userStore.isLoggedIn" class="btn-primary" type="button" @click="router.push('/register')">注册</button>
      </nav>
    </header>

    <section class="hero">
      <div class="hero-copy">
        <p class="page-kicker">Hot Topic Driven AI Training</p>
        <h1>PolicyQuest</h1>
        <p class="hero-subtitle">面向公考、事业编、税务与基层治理方向的智能训练工作台，把热点题库、限时练习、AI 评阅和成长报告合在一个清晰的学习流里。</p>
        <div class="hero-actions">
          <button class="btn-primary hero-btn" type="button" @click="goStart">
            <span>开始今日训练</span>
            <SvgIcon name="arrow-right" :size="18" />
          </button>
          <button class="btn-ghost hero-btn" type="button" @click="router.push('/app/report')">查看能力报告</button>
        </div>
        <div class="hero-stats">
          <div v-for="item in stats" :key="item.label" class="stat-pill">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>

      <div class="hero-visual" aria-label="PolicyQuest 工作台预览">
        <img :src="heroImage" alt="PolicyQuest 产品预览" />
        <div class="floating-panel">
          <span class="chip success">今日已完成 68%</span>
          <strong>申论评阅：82 分</strong>
          <small>建议补强“执行主体 + 闭环机制”表达。</small>
        </div>
      </div>
    </section>

    <section id="features" class="features">
      <div class="section-head">
        <p class="page-kicker">Core Modules</p>
        <h2 class="page-title">从刷题到复盘，保持同一条学习路径</h2>
      </div>
      <div class="feature-grid">
        <article v-for="item in features" :key="item.title" class="feature-card glass-card">
          <span class="feature-icon"><SvgIcon :name="item.icon" :size="24" /></span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section id="workflow" class="workflow glass-card">
      <div>
        <p class="page-kicker">Study Flow</p>
        <h2>选择方向、限时作答、查看报告、回练错题</h2>
      </div>
      <div class="workflow-steps">
        <span>1. 选题</span>
        <span>2. 作答</span>
        <span>3. 评阅</span>
        <span>4. 复盘</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 6%, rgba(13, 148, 136, 0.12), transparent 26%),
    linear-gradient(180deg, #f8f9ff 0%, #ffffff 54%, #eff4ff 100%);
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76px;
  padding: 0 max(24px, calc((100vw - 1280px) / 2));
  border-bottom: 1px solid rgba(194, 198, 216, 0.58);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(18px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--gradient-1);
  color: #ffffff;
  font-weight: 900;
  box-shadow: 0 14px 28px rgba(0, 80, 203, 0.2);
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

.site-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.site-nav a {
  padding: 10px 12px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 700;
}

.site-nav .btn-primary,
.site-nav .btn-ghost {
  min-height: 38px;
  padding: 0 16px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(460px, 1fr);
  align-items: center;
  gap: 48px;
  width: min(1280px, calc(100vw - 48px));
  min-height: calc(100vh - 76px);
  margin: 0 auto;
  padding: 46px 0 34px;
}

.hero-copy h1 {
  margin: 0;
  color: var(--text-primary);
  font-family: "Plus Jakarta Sans", Inter, "Noto Sans SC", system-ui, sans-serif;
  font-size: 68px;
  font-weight: 900;
  line-height: 0.98;
}

.hero-subtitle {
  max-width: 620px;
  margin: 22px 0 0;
  color: var(--text-secondary);
  font-size: 18px;
  line-height: 1.78;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.hero-btn {
  min-height: 52px;
  padding: 0 24px;
  font-size: 15px;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  max-width: 560px;
  margin-top: 34px;
}

.stat-pill {
  display: grid;
  gap: 4px;
  padding: 16px;
  border: 1px solid rgba(194, 198, 216, 0.68);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.76);
}

.stat-pill strong {
  color: var(--primary);
  font-size: 26px;
  font-weight: 900;
}

.stat-pill span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
}

.hero-visual {
  position: relative;
  min-height: 520px;
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(0, 80, 203, 0.12), rgba(13, 148, 136, 0.1)),
    #ffffff;
  box-shadow: 0 24px 70px rgba(19, 42, 74, 0.14);
}

.hero-visual img {
  position: absolute;
  inset: 28px;
  width: calc(100% - 56px);
  height: calc(100% - 56px);
  object-fit: cover;
  border: 1px solid rgba(194, 198, 216, 0.8);
  border-radius: 22px;
  background: #ffffff;
}

.floating-panel {
  position: absolute;
  right: 28px;
  bottom: 28px;
  display: grid;
  gap: 8px;
  width: min(320px, calc(100% - 56px));
  padding: 18px;
  border: 1px solid rgba(194, 198, 216, 0.72);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(18px);
}

.floating-panel strong {
  font-size: 20px;
}

.floating-panel small {
  color: var(--text-secondary);
  line-height: 1.5;
}

.features {
  width: min(1280px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 42px 0 76px;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.feature-card {
  min-height: 220px;
}

.feature-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--surface-muted);
  color: var(--primary);
}

.feature-card h3 {
  margin: 18px 0 10px;
  font-size: 18px;
}

.feature-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.workflow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  width: min(1280px, calc(100vw - 48px));
  margin: 0 auto 72px;
}

.workflow h2 {
  max-width: 620px;
  margin: 0;
  font-size: 26px;
  line-height: 1.35;
}

.workflow-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(88px, 1fr));
  gap: 10px;
}

.workflow-steps span {
  display: grid;
  place-items: center;
  min-height: 54px;
  padding: 0 12px;
  border-radius: 16px;
  background: var(--surface-muted);
  color: var(--primary);
  font-weight: 900;
}

@media (max-width: 1020px) {
  .hero {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .hero-visual {
    min-height: 420px;
  }

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workflow {
    display: grid;
  }
}

@media (max-width: 680px) {
  .site-header {
    height: 68px;
    padding: 0 16px;
  }

  .site-nav a {
    display: none;
  }

  .site-nav .btn-ghost {
    display: none;
  }

  .hero,
  .features,
  .workflow {
    width: calc(100vw - 32px);
  }

  .hero {
    padding-top: 34px;
    gap: 28px;
  }

  .hero-copy h1 {
    font-size: 46px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .hero-stats,
  .feature-grid,
  .workflow-steps {
    grid-template-columns: 1fr 1fr;
  }

  .hero-visual {
    min-height: 330px;
    border-radius: 22px;
  }

  .hero-visual img {
    inset: 16px;
    width: calc(100% - 32px);
    height: calc(100% - 32px);
    border-radius: 18px;
  }

  .floating-panel {
    right: 16px;
    bottom: 16px;
  }
}
</style>
