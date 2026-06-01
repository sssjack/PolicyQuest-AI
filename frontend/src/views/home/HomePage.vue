<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'

import SvgIcon from '../../components/SvgIcon.vue'

const router = useRouter()
const userStore = useUserStore()
const canvasRef = ref<HTMLCanvasElement>()
let animId = 0

const features = [
  { icon: 'hot', title: '热点驱动出题', desc: '自动采集今年最新政策文件与时政热点，AI 实时生成贴近考试方向的练习题' },
  { icon: 'brain', title: '智能评分体系', desc: '客观题即时判分，面试题多维度 AI 评分，精准定位能力短板' },
  { icon: 'chart', title: '个人能力画像', desc: '正确率趋势、题型弱点分析、热点掌握度，数据驱动高效备考' },
  { icon: 'timer', title: '计时训练模式', desc: '模拟真实考场计时压力，每题耗时统计，培养最优答题节奏' },
]

const stats = [
  { num: '10,000+', label: '精选题目' },
  { num: '98%', label: '评分准确率' },
  { num: '50+', label: '热点专题' },
  { num: '24/7', label: '智能服务' },
]

function goStart() {
  if (userStore.isLoggedIn) router.push('/app/dashboard')
  else router.push('/login')
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  let w = canvas.width = window.innerWidth
  let h = canvas.height = window.innerHeight
  const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; da: number }[] = []
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 0.5, a: Math.random(), da: (Math.random() - 0.5) * 0.01,
    })
  }
  function draw() {
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.a += p.da
      if (p.a > 1) p.da = -Math.abs(p.da)
      if (p.a < 0.1) p.da = Math.abs(p.da)
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(99,102,241,${p.a * 0.6})`; ctx.fill()
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(99,102,241,${(1 - dist / 150) * 0.15})`
          ctx.lineWidth = 0.5; ctx.stroke()
        }
      }
    }
    animId = requestAnimationFrame(draw)
  }
  draw()
  const handleResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => { cancelAnimationFrame(animId) })
</script>

<template>
  <div class="home">
    <canvas ref="canvasRef" class="particle-canvas" />

    <nav class="nav">
      <div class="nav-inner">
        <div class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 40 40" width="26" height="26" fill="none">
              <path d="M10 8h7c4 0 6 2.5 6 5.5S21 19 17 19h-3v8h-4V8zm4 3.5v4h2.5c1.3 0 2-.8 2-2s-.7-2-2-2H14z" fill="white"/>
              <path d="M34 27c0 .5-.4.9-.9.9H21.9c-.5 0-.9-.4-.9-.9V17.9c0-.5.4-.9.9-.9H24l2-2.5h-4a3.4 3.4 0 00-3.4 3.4V27a3.4 3.4 0 003.4 3.4h11.2A3.4 3.4 0 0037 27v-7l-3 2.5V27z" fill="rgba(255,255,255,.85)"/>
            </svg>
          </div>
          <span class="logo-text">PolicyQuest AI</span>
        </div>
        <div class="nav-links">
          <a href="#features">功能特色</a>
          <a href="#about">关于系统</a>
          <template v-if="userStore.isLoggedIn">
            <button class="btn-ghost" style="padding:8px 20px;font-size:14px" @click="router.push('/app/dashboard')">进入系统</button>
            <button v-if="userStore.isAdmin" class="btn-primary" style="padding:8px 20px;font-size:14px" @click="router.push('/admin')">管理后台</button>
          </template>
          <template v-else>
            <button class="btn-ghost" style="padding:8px 20px;font-size:14px" @click="router.push('/login')">登录</button>
            <button class="btn-primary" style="padding:8px 20px;font-size:14px" @click="router.push('/register')">注册</button>
          </template>
        </div>
      </div>
    </nav>

    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">AI-Powered · Hot Topic Driven · Smart Scoring</div>
        <h1 class="hero-title">
          <span class="hero-line1">PolicyQuest AI</span>
          <span class="hero-line2">新一代公考智能训练系统</span>
        </h1>
        <p class="hero-desc">
          基于最新政策文件与时政热点，AI 自动生成高质量练习题目。<br>
          精准评分、能力画像、个性化训练，让每一次刷题都有方向。
        </p>
        <div class="hero-actions">
          <button class="btn-primary btn-lg" @click="goStart">
            <span>开始训练</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button class="btn-ghost btn-lg" @click="router.push('/register')">免费注册</button>
        </div>
        <div class="hero-stats">
          <div v-for="s in stats" :key="s.label" class="stat-item">
            <div class="stat-num">{{ s.num }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="orbit-ring ring1"><div class="orbit-dot" /></div>
        <div class="orbit-ring ring2"><div class="orbit-dot" /></div>
        <div class="orbit-ring ring3"><div class="orbit-dot" /></div>
        <div class="center-sphere">
          <svg viewBox="0 0 64 64" width="44" height="44" fill="none">
            <path d="M16 14h10c5 0 9 3.6 9 8s-4 8-9 8h-4v12h-6V14zm6 5v6h3.5c1.8 0 3-1.2 3-3s-1.2-3-3-3H22z" fill="white"/>
            <path d="M53 44.5c0 .7-.6 1.3-1.3 1.3H34.3c-.7 0-1.3-.6-1.3-1.3V27.3c0-.7.6-1.3 1.3-1.3H37l3-3.5h-6A4.5 4.5 0 0029.5 27v17.5A4.5 4.5 0 0034 49h17.7a4.5 4.5 0 004.3-4.5V34l-3 3v7.5z" fill="rgba(255,255,255,.85)"/>
            <path d="M53.6 23.3a.8.8 0 00-1.2 0L41 34.6l-2.8-2.8a.8.8 0 00-1.2 1.2l3.4 3.4a.8.8 0 001.2 0l12-12a.8.8 0 000-1.1z" fill="rgba(255,255,255,.85)"/>
          </svg>
        </div>
      </div>
    </section>

    <section id="features" class="features">
      <div class="section-header">
        <h2 class="section-title" style="-webkit-text-fill-color:unset;background:none;color:var(--text-primary)">核心能力</h2>
        <p class="section-subtitle">四大智能模块，重新定义公考备考体验</p>
      </div>
      <div class="feature-grid">
        <div v-for="(f, i) in features" :key="i" class="feature-card glass-card">
          <div class="feature-icon-wrap"><SvgIcon :name="f.icon" :size="28" /></div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
          <div class="feature-glow" />
        </div>
      </div>
    </section>

    <section id="about" class="about">
      <div class="about-content">
        <div class="about-text">
          <h2>智能时代的公考训练</h2>
          <p>PolicyQuest AI 不是传统的题库 App。我们每天自动采集主流媒体文章、政策文件和官方通报，通过 AI 理解文章内容，自动生成贴近真实考试风格的练习题。</p>
          <p>无论你备考国考、省考、事业编还是税务系统，都能获得最新、最精准的训练内容。</p>
          <div class="about-tags">
            <span class="tag">国考</span><span class="tag">省考</span><span class="tag">事业编</span>
            <span class="tag">税务</span><span class="tag">选调生</span><span class="tag">基层治理</span>
          </div>
        </div>
        <div class="about-visual">
          <div class="code-block">
            <div class="code-header"><span class="dot red"/><span class="dot yellow"/><span class="dot green"/></div>
            <pre><code><span class="kw">const</span> question = <span class="kw">await</span> AI.generate({
  source: <span class="str">"今日政策文件"</span>,
  type: <span class="str">"言语理解"</span>,
  difficulty: <span class="str">"中等"</span>,
  style: <span class="str">"国考真题风格"</span>
});</code></pre>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="logo-icon" style="width:32px;height:32px">
            <svg viewBox="0 0 40 40" width="20" height="20" fill="none"><path d="M10 8h7c4 0 6 2.5 6 5.5S21 19 17 19h-3v8h-4V8zm4 3.5v4h2.5c1.3 0 2-.8 2-2s-.7-2-2-2H14z" fill="white"/></svg>
          </div>
          <span>PolicyQuest AI</span>
        </div>
        <p class="footer-copy">面向公考、事业编、税务等考试的热点驱动型智能题库与训练系统</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home { position: relative; overflow-x: hidden; }
.particle-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }

.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(10,10,26,0.8); backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 64px; }
.logo { display: flex; align-items: center; gap: 12px; }
.logo-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--gradient-1); display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.logo-text { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.nav-links { display: flex; align-items: center; gap: 24px; }
.nav-links a { color: var(--text-secondary); font-size: 14px; transition: color 0.3s; }
.nav-links a:hover { color: var(--text-primary); }

.hero {
  position: relative; z-index: 1; min-height: 100vh; display: flex; align-items: center;
  max-width: 1200px; margin: 0 auto; padding: 100px 24px 60px; gap: 60px;
}
.hero-content { flex: 1; }
.hero-badge {
  display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px;
  background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
  color: var(--primary-light); margin-bottom: 24px; letter-spacing: 1px;
}
.hero-title { margin-bottom: 24px; }
.hero-line1 {
  display: block; font-size: 60px; font-weight: 900; line-height: 1.1;
  background: linear-gradient(135deg, #fff 0%, #818cf8 50%, #06b6d4 100%);
  background-size: 200% 200%; animation: gradientShift 6s ease infinite;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.hero-line2 { display: block; font-size: 22px; font-weight: 400; color: var(--text-secondary); margin-top: 12px; }
.hero-desc { font-size: 16px; line-height: 1.8; color: var(--text-muted); margin-bottom: 36px; max-width: 500px; }
.hero-actions { display: flex; gap: 16px; margin-bottom: 48px; }
.btn-lg { padding: 16px 40px !important; font-size: 16px !important; border-radius: 14px !important; }

.hero-stats { display: flex; gap: 32px; }
.stat-item { text-align: center; }
.stat-num { font-size: 28px; font-weight: 800; background: var(--gradient-2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

.hero-visual {
  flex: 0 0 400px; height: 400px; position: relative; display: flex; align-items: center; justify-content: center;
}
.orbit-ring {
  position: absolute; border-radius: 50%; border: 1px solid rgba(99,102,241,0.15);
}
.ring1 { width: 200px; height: 200px; animation: spin 20s linear infinite; }
.ring2 { width: 300px; height: 300px; animation: spin 30s linear infinite reverse; }
.ring3 { width: 380px; height: 380px; animation: spin 40s linear infinite; }
.orbit-dot {
  position: absolute; top: -4px; left: 50%; transform: translateX(-50%);
  width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
  box-shadow: 0 0 15px var(--accent);
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.center-sphere {
  width: 80px; height: 80px; border-radius: 50%;
  background: var(--gradient-1); display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 900; color: #fff; z-index: 2;
  box-shadow: 0 0 60px rgba(99,102,241,0.4); animation: breathe 4s ease-in-out infinite;
}

.features { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 80px 24px; }
.section-header { text-align: center; margin-bottom: 48px; }
.section-subtitle { color: var(--text-muted); font-size: 16px; margin-top: 8px; }
.feature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.feature-card {
  text-align: center; padding: 32px 20px; position: relative; overflow: hidden;
}
.feature-icon-wrap {
  width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 16px;
  background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.15) 100%);
  border: 1px solid rgba(99,102,241,0.2);
  display: flex; align-items: center; justify-content: center;
  color: var(--primary-light); transition: all 0.3s ease;
}
.feature-card:hover .feature-icon-wrap {
  background: linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(6,182,212,0.25) 100%);
  transform: scale(1.1);
}
.feature-card h3 { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: var(--text-primary); }
.feature-card p { font-size: 14px; line-height: 1.7; color: var(--text-muted); }
.feature-glow {
  position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%);
  width: 120px; height: 120px; border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
  pointer-events: none;
}

.about { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 80px 24px; }
.about-content { display: flex; gap: 60px; align-items: center; }
.about-text { flex: 1; }
.about-text h2 { font-size: 32px; font-weight: 700; margin-bottom: 20px; }
.about-text p { font-size: 15px; line-height: 1.8; color: var(--text-secondary); margin-bottom: 16px; }
.about-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.tag {
  padding: 6px 16px; border-radius: 20px; font-size: 13px;
  background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
  color: var(--primary-light);
}
.about-visual { flex: 0 0 440px; }
.code-block {
  background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; overflow: hidden;
}
.code-header { padding: 12px 16px; display: flex; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.dot { width: 12px; height: 12px; border-radius: 50%; }
.dot.red { background: #ff5f57; }
.dot.yellow { background: #febc2e; }
.dot.green { background: #28c840; }
.code-block pre { padding: 20px; font-size: 14px; line-height: 1.8; font-family: 'JetBrains Mono', monospace; }
.code-block code { color: var(--text-secondary); }
.code-block .kw { color: #c792ea; }
.code-block .str { color: #c3e88d; }

.footer {
  position: relative; z-index: 1; border-top: 1px solid var(--border);
  padding: 40px 24px; text-align: center;
}
.footer-inner { max-width: 1200px; margin: 0 auto; }
.footer-brand { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 12px; }
.footer-brand span { font-size: 16px; font-weight: 600; }
.footer-copy { font-size: 13px; color: var(--text-muted); }

@media (max-width: 900px) {
  .hero { flex-direction: column; padding-top: 80px; min-height: auto; }
  .hero-visual { flex: none; width: 280px; height: 280px; }
  .hero-line1 { font-size: 40px; }
  .feature-grid { grid-template-columns: repeat(2, 1fr); }
  .about-content { flex-direction: column; }
  .about-visual { flex: none; width: 100%; }
  .hero-stats { flex-wrap: wrap; gap: 20px; }
}
@media (max-width: 600px) {
  .feature-grid { grid-template-columns: 1fr; }
  .nav-links a { display: none; }
}
</style>
