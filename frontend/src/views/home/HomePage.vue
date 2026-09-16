<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, TopRight, Reading, ChatLineRound, TrendCharts, Aim, EditPen, DocumentChecked, CircleCheck, Position } from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'
import UserAccountMenu from '../../components/UserAccountMenu.vue'

const router = useRouter()
const userStore = useUserStore()
const demoType = ref<'essay' | 'article'>('essay')
const activeStep = ref(0)
const demo = computed(() => demoType.value === 'essay'
  ? { title: '归纳概括', score: 16, max: 20, label: '要点覆盖', value: '5 / 6', note: '漏掉的那一点，也能找到出处。' }
  : { title: '大作文', score: 32, max: 40, label: '评分维度', value: '7 项', note: '从中心立意，到每一段的论证。' })
const paths = [
  { no: '01', title: '申论，写得有据。', label: '申论真题', subtitle: '读材料 · 练归纳 · 学表达', icon: Reading, to: '/papers?type=essay', accent: 'blue' },
  { no: '02', title: '面试，答得有序。', label: '面试真题', subtitle: '理思路 · 拆问题 · 练应变', icon: ChatLineRound, to: '/papers?type=interview', accent: 'green' },
  { no: '03', title: '进步，看得见。', label: '学习报告', subtitle: '查错题 · 看趋势 · 定方向', icon: TrendCharts, to: '/report', accent: 'violet' },
]
const steps = [
  { title: '找到得分点', subtitle: '让每个判断，都有材料依据。', icon: Aim, tag: '01 / 材料溯源', beforeLabel: '给定材料 · 教学示例', before: '不同部门的业务系统相互独立，同样的信息需要反复录入，跨部门办理业务时还要重复提交材料。', afterLabel: '提炼后的要点', after: '系统壁垒突出，数据共享不畅，重复填报增加基层和群众负担。', reason: '将“系统独立、重复录入”归为数据共享问题，再补充其影响，形成“问题＋表现＋影响”的完整信息链。' },
  { title: '看懂怎么改', subtitle: '具体到这一句，而非一句“继续努力”。', icon: EditPen, tag: '02 / 逐句改写', beforeLabel: '原作答 · 教学示例', before: '很多系统要来回切换，工作人员办事很麻烦，应该加强管理。', afterLabel: '更准确的表达', after: '政务系统多头并存、互联互通不足，增加业务办理负担；应统一数据标准，推进跨部门共享。', reason: '“很麻烦”没有说清问题，“加强管理”缺少具体动作。改写先概括问题，再给出与问题对应的措施，不堆砌空泛词汇。' },
  { title: '带走答题思路', subtitle: '学会拆解，下一题才会真的进步。', icon: DocumentChecked, tag: '03 / 答案拆解', beforeLabel: '答题任务 · 教学示例', before: '围绕材料中的政务服务问题，简要概括问题并提出建议。', afterLabel: '参考表达与结构', after: '一是数据共享不畅。统一数据标准，推动系统互联。二是重复填报负担重。实行一次采集、多方复用，精简重复材料。', reason: '按“问题—对策”逐项对应，每条先点明问题再提出动作。实际批改会提供稳妥版、优化版和压缩练习版，并解释每版取舍。' },
]
const currentStep = computed(() => steps[activeStep.value]!)
function openPath(to: string) {
  if (userStore.isLoggedIn) router.push(to)
  else router.push({ path: '/login', query: { redirect: to } })
}
function showDemo() {
  document.getElementById('coaching-demo')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <main class="quest-home">
    <section class="hero home-width" aria-labelledby="hero-title">
      <div class="hero-brand"><span class="brand-symbol">PQ<span></span></span><strong>PolicyQuest<span>AI 公考训练</span></strong></div>
      <div class="account-link"><UserAccountMenu /></div>

      <div class="hero-copy">
        <p class="eyebrow"><span class="status-dot"></span> YOUR NEXT CHAPTER, POWERED BY AI</p>
        <h1 id="hero-title">每一次落笔，<br>都<span class="blue-word">更进一步<span class="word-dot">.</span></span></h1>
        <p class="hero-description">让真题成为起点，让 AI 成为教练。<br>从材料里的得分点，到你笔下的好答案。</p>
        <div class="hero-actions">
          <button class="action-primary" type="button" @click="openPath('/coach')">开启今天的练习<el-icon><ArrowRight /></el-icon></button>
          <button class="action-text" type="button" @click="showDemo">先看看如何批改<span class="play-icon"><el-icon><Position /></el-icon></span></button>
        </div>
        <div class="hero-proof"><span><el-icon><CircleCheck /></el-icon>按原题分值批改</span><span><el-icon><CircleCheck /></el-icon>每一处修改都有解释</span></div>
      </div>

      <div class="hero-visual" aria-label="AI 批改功能示例">
        <img class="orbit-art" :src="'/PolicyQuest/images/learning-orbit.webp'" alt="" width="1024" height="1024" fetchpriority="high">
        <div class="visual-label"><span>THINK. WRITE. EVOLVE.</span><small>把潜力，写成实力。</small></div>
        <div class="floating-note"><el-icon><Aim /></el-icon><span>材料 → 要点 → 答案</span></div>
        <article class="preview-card">
          <div class="preview-top"><span><i></i> AI COACH</span><small>交互示例</small></div>
          <div class="preview-tabs" aria-label="切换评分示例">
            <button type="button" :aria-pressed="demoType === 'essay'" :class="{ selected: demoType === 'essay' }" @click="demoType = 'essay'">申论小题</button>
            <button type="button" :aria-pressed="demoType === 'article'" :class="{ selected: demoType === 'article' }" @click="demoType = 'article'">大作文</button>
          </div>
          <div class="preview-score" aria-live="polite"><div><small>{{ demo.title }}</small><p><strong>{{ demo.score }}</strong><span>/ {{ demo.max }} 分</span></p></div><div class="preview-stat"><small>{{ demo.label }}</small><strong>{{ demo.value }}</strong><span>看见提升空间<el-icon><TopRight /></el-icon></span></div></div>
          <div class="preview-progress"><span></span></div>
          <p class="preview-note">{{ demo.note }}</p>
          <small class="demo-disclaimer">教学展示，非真实作答评分</small>
        </article>
        <span class="visual-caption">专注思考，剩下的交给你的 AI 教练。</span>
      </div>
      <div class="hero-bottom"><span>为认真备考的你而造</span><a href="#training-paths">探索你的训练方式 <span>↓</span></a><span>LEARN WITH PURPOSE / 01</span></div>
    </section>

    <section id="training-paths" class="training-paths home-width" aria-label="选择训练入口">
      <button v-for="path in paths" :key="path.no" class="path-item" :class="path.accent" type="button" :aria-label="path.label" @click="openPath(path.to)">
        <span class="path-top"><small>{{ path.no }} / {{ path.label }}</small><el-icon><component :is="path.icon" /></el-icon></span>
        <span class="path-title">{{ path.title }}</span>
        <span class="path-bottom"><span>{{ path.subtitle }}</span><span class="path-arrow"><el-icon><TopRight /></el-icon></span></span>
      </button>
    </section>

    <section id="coaching-demo" class="coaching-section">
      <div class="home-width coaching-layout">
        <div class="coaching-copy"><p class="eyebrow">MORE THAN A SCORE</p><h2>写过一题，<br>就真正<span>掌握一题。</span></h2><p class="section-description">分数是反馈的开始。<br>知道为什么丢分，才知道下一次怎么写。</p>
          <div class="step-select" aria-label="批改能力演示">
            <button v-for="(step, index) in steps" :key="step.title" type="button" :class="{ active: activeStep === index }" :aria-pressed="activeStep === index" @click="activeStep = index"><el-icon><component :is="step.icon" /></el-icon><span>{{ step.title }}</span><el-icon class="step-arrow"><ArrowRight /></el-icon></button>
          </div>
        </div>
        <article class="coaching-canvas" aria-live="polite">
          <div class="canvas-top"><span>{{ currentStep.tag }}</span><small>INTERACTIVE DEMO</small></div>
          <h3>{{ currentStep.subtitle }}</h3>
          <div class="example-source"><span>{{ currentStep.beforeLabel }}</span><p>{{ currentStep.before }}</p></div>
          <div class="transformation-label"><el-icon><ArrowRight /></el-icon><span>AI 教练的拆解</span></div>
          <div class="example-result"><span><el-icon><CircleCheck /></el-icon>{{ currentStep.afterLabel }}</span><p>{{ currentStep.after }}</p></div>
          <div class="reason-line"><b>为什么这样写</b><p>{{ currentStep.reason }}</p></div>
          <span class="canvas-footnote">示例仅用于说明批改方式，实际报告依据你的题目和作答生成。</span>
        </article>
      </div>
    </section>

    <section class="closing home-width">
      <div><p class="eyebrow">YOUR PROGRESS STARTS HERE</p><h2>下一次进步，<span>从这一题开始。</span></h2></div>
      <button class="action-primary" type="button" @click="openPath('/papers')">进入真题库<el-icon><ArrowRight /></el-icon></button>
    </section>
    <footer class="home-footer home-width"><strong>PolicyQuest <span>认真备考，也可以很酷。</span></strong><button type="button" @click="openPath('/history')">我的练习历史<el-icon><TopRight /></el-icon></button><small>AI 辅助训练 · 评分仅作学习参考</small></footer>
  </main>
</template>

<style scoped>
.quest-home{--ink:#142033;--blue:#2558f4;--muted:#647083;background:#f4f6f8;color:var(--ink);font-family:'Inter','Noto Sans SC',sans-serif;overflow:hidden}
.quest-home *{box-sizing:border-box}
.quest-home button,.quest-home a{-webkit-tap-highlight-color:transparent}
.quest-home button{font-family:inherit;cursor:pointer}
.quest-home button:focus-visible,.quest-home a:focus-visible{outline:3px solid #2558f4;outline-offset:5px}
.home-width{width:min(1280px,calc(100% - 112px));margin-inline:auto}
.hero{position:relative;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:92px auto 76px;min-height:790px;column-gap:18px}
.hero-brand{grid-column:1;display:flex;align-items:center;gap:12px;width:fit-content}
.brand-symbol{position:relative;font-size:19px;letter-spacing:-1px;font-weight:850;display:grid;place-items:center;width:45px;height:45px;background:var(--ink);color:white;border-radius:14px}
.brand-symbol>span{width:8px;height:8px;background:#cffb59;border-radius:50%;position:absolute;right:-2px;top:-2px;border:2px solid #f4f6f8}
.hero-brand>strong{font-size:19px;letter-spacing:-.6px;font-weight:750}
.hero-brand>strong>span{display:block;font-size:10px;letter-spacing:2px;font-weight:500;color:var(--muted);margin-top:1px}
.account-link{justify-self:end;align-self:center;display:flex;align-items:center;gap:12px;font-size:13px;background:none;border:0;color:var(--ink);padding:12px 0}
.hero-copy{grid-column:1;grid-row:2;align-self:center;position:relative;z-index:2;padding-bottom:30px}
.eyebrow{display:flex;align-items:center;gap:9px;font-size:10px;letter-spacing:1.7px;font-weight:700;margin:0 0 26px;color:var(--muted)}
.status-dot{width:6px;height:6px;border-radius:50%;background:#2558f4;box-shadow:0 0 0 4px #2558f410}
.hero h1{margin:0;font-size:clamp(44px,4.3vw,66px);line-height:1.3;letter-spacing:-3px;font-weight:850;white-space:nowrap}
.blue-word{color:var(--blue)}
.word-dot{font-family:'Inter',sans-serif;color:var(--ink);margin-left:3px}
.hero-description{font-size:16px;line-height:1.95;letter-spacing:.3px;color:var(--muted);margin:26px 0 30px}
.hero-actions{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.action-primary{display:inline-flex;justify-content:center;align-items:center;gap:28px;background:var(--blue);border:1px solid var(--blue);color:#fff;font-size:14px;font-weight:650;min-height:55px;padding:0 23px;border-radius:12px;box-shadow:0 9px 22px #2558f418;transition:transform .2s,background .2s}
.action-primary:hover{background:#1845d4;transform:translateY(-3px)}
.action-primary .el-icon{font-size:19px}
.action-text{display:inline-flex;gap:12px;align-items:center;font-size:13px;border:0;background:none;color:var(--ink);padding:8px 0}
.play-icon{border:1px solid #cbd2db;border-radius:50%;display:grid;place-items:center;width:29px;height:29px;transform:rotate(35deg)}
.hero-proof{display:flex;gap:22px;margin-top:24px;font-size:11px;color:#737d8d;flex-wrap:wrap}
.hero-proof>span{display:flex;align-items:center;gap:5px}
.hero-proof .el-icon{color:#718a45}
.hero-visual{grid-column:2;grid-row:2;position:relative;min-width:0;min-height:610px;align-self:center}
.orbit-art{position:absolute;width:110%;max-width:none;height:auto;top:-28px;left:-8%;mix-blend-mode:darken;object-fit:contain;pointer-events:none;-webkit-mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent),linear-gradient(180deg,transparent,#000 10%,#000 84%,transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent),linear-gradient(180deg,transparent,#000 10%,#000 84%,transparent);mask-composite:intersect}
.visual-label{position:absolute;top:15px;right:2px;text-align:right}
.visual-label span{display:block;font-size:9px;letter-spacing:1.3px;color:#88929e}
.visual-label small{display:block;font-size:11px;margin-top:7px;color:#6c798d}
.floating-note{position:absolute;left:4%;top:44%;display:flex;align-items:center;gap:9px;background:#eff4e2;border:1px solid #d9e2c4;padding:13px 16px;border-radius:50px;box-shadow:0 8px 24px #14203308;font-size:11px;z-index:1;transform:rotate(-7deg)}
.floating-note .el-icon{font-size:19px;color:#52741d}
.preview-card{position:absolute;right:0;bottom:43px;width:318px;border:1px solid #fff;background:#ffffffeb;backdrop-filter:blur(24px);border-radius:21px;padding:20px 22px;box-shadow:0 22px 55px #203d6221;z-index:2}
.preview-top{display:flex;align-items:center;justify-content:space-between;font-size:9px;letter-spacing:1.5px}
.preview-top>span{display:flex;align-items:center;gap:7px;font-weight:750}
.preview-top i{height:6px;width:6px;border-radius:50%;background:#86b542}
.preview-top small{letter-spacing:.5px;font-size:9px;color:#8994a1}
.preview-tabs{display:flex;gap:4px;padding:4px;margin:16px 0 20px;border-radius:9px;background:#f0f3f7}
.preview-tabs button{flex:1;border:0;border-radius:6px;min-height:30px;background:none;color:#7a8697;font-size:11px}
.preview-tabs .selected{background:#fff;color:#2558f4;box-shadow:0 2px 6px #23355809;font-weight:650}
.preview-score{display:flex;justify-content:space-between;align-items:center}
.preview-score small{color:#778396;font-size:10px}
.preview-score p{margin:4px 0 0;display:flex;align-items:baseline;gap:7px}
.preview-score p strong{font-family:Inter,sans-serif;font-weight:650;font-size:53px;line-height:1.1;letter-spacing:-3px}
.preview-score p span{font-size:12px;color:#718099}
.preview-stat{display:grid;gap:6px;border-left:1px solid #e9edf2;padding-left:21px}
.preview-stat>strong{font-size:18px;font-weight:650}
.preview-stat>span{display:flex;align-items:center;gap:8px;font-size:9px;color:#7e8a9b}
.preview-progress{height:4px;border-radius:8px;background:#edf0f4;margin-top:18px;overflow:hidden}
.preview-progress>span{display:block;width:80%;height:100%;background:#2558f4}
.preview-note{margin:12px 0 6px;font-size:11px;color:#5e6f86}
.demo-disclaimer{font-size:9px;color:#8a94a3}
.visual-caption{position:absolute;bottom:9px;right:1px;font-size:10px;color:#8591a0;letter-spacing:.3px}
.hero-bottom{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #dce1e6;gap:15px;color:#8a929d;font-size:10px;letter-spacing:.4px}
.hero-bottom a{display:flex;gap:14px;align-items:center;color:#47566d;font-size:11px}
.hero-bottom a span{font-size:21px}
.hero-bottom>span:last-child{font-size:8px;letter-spacing:1px}
.training-paths{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));padding:44px 0 62px;gap:0}
.path-item{text-align:left;background:none;border:0;border-right:1px solid #dce1e6;padding:0 32px;display:grid;gap:21px;color:var(--ink);min-width:0}
.path-item:first-child{padding-left:0}
.path-item:last-child{border:0;padding-right:0}
.path-top,.path-bottom{display:flex;justify-content:space-between;align-items:center;gap:12px}
.path-top small{font-size:10px;letter-spacing:.8px;color:#7d8795}
.path-top>.el-icon{font-size:27px;color:#2558f4}
.path-item.green .path-top>.el-icon{color:#648932}
.path-item.violet .path-top>.el-icon{color:#8175bd}
.path-title{font-weight:650;font-size:24px;letter-spacing:-.5px}
.path-bottom{font-size:11px;color:#83909f}
.path-arrow{display:grid;place-items:center;width:29px;height:29px;border:1px solid #d5dce4;border-radius:50%;color:#3c4c64;transition:background .2s,color .2s,transform .2s}
.path-item:hover .path-arrow{background:#2558f4;color:#fff;border-color:#2558f4;transform:translate(2px,-2px)}
.coaching-section{padding:76px 0 82px;background:#111d31;color:white}
.coaching-layout{display:grid;grid-template-columns:.8fr 1.2fr;gap:90px;align-items:center}
.coaching-copy .eyebrow{color:#99a8be}
.coaching-copy h2{font-size:39px;line-height:1.45;font-weight:650;letter-spacing:-1.6px;margin:0}
.coaching-copy h2 span{color:#d0f586}
.section-description{color:#9ba8bb;line-height:1.9;font-size:13px;margin:18px 0 30px}
.step-select{display:grid;gap:4px;max-width:300px}
.step-select button{display:flex;gap:13px;align-items:center;color:#9eabc0;border:0;border-left:2px solid transparent;background:transparent;padding:15px 17px;font-size:13px;border-radius:0 7px 7px 0;text-align:left;transition:background .2s}
.step-select button>.el-icon{font-size:18px}
.step-select button.active{border-left-color:#d0f586;color:#fff;background:#ffffff09}
.step-select button:hover{background:#ffffff09}
.step-select .step-arrow{margin-left:auto;font-size:15px;opacity:0}
.step-select .active .step-arrow{opacity:1;color:#d0f586}
.coaching-canvas{background:#1a2941;border:1px solid #ffffff14;border-radius:20px;padding:29px 32px;box-shadow:0 20px 50px #00000012;min-width:0;min-height:490px}
.canvas-top{display:flex;justify-content:space-between;gap:12px;align-items:center;color:#a3b7d3;font-size:10px;letter-spacing:.8px}
.canvas-top small{font-size:8px;letter-spacing:1.2px;color:#8495ae}
.coaching-canvas h3{font-size:18px;letter-spacing:-.3px;font-weight:500;margin:21px 0 23px}
.example-source{background:#111d3180;border-radius:11px;padding:17px 19px}
.example-source>span{font-size:10px;color:#8598b5}
.example-source p{font-size:13px;line-height:1.9;color:#bec9da;margin:9px 0 0}
.transformation-label{display:flex;align-items:center;gap:9px;font-size:9px;color:#90a3be;padding:13px 7px}
.transformation-label .el-icon{transform:rotate(90deg)}
.example-result{padding:17px 19px;border:1px solid #d0f58638;background:#d0f5860a;border-radius:11px}
.example-result>span{display:flex;align-items:center;gap:8px;font-size:10px;color:#d0f586}
.example-result p{margin:10px 0 0;font-size:14px;line-height:1.85;color:#eef4df}
.reason-line{display:grid;grid-template-columns:82px 1fr;gap:13px;margin-top:22px}
.reason-line b{font-size:10px;font-weight:500;color:#a6b6ce;padding-top:2px}
.reason-line p{font-size:11px;line-height:1.8;margin:0;color:#9baec8}
.canvas-footnote{display:block;margin-top:19px;font-size:9px;color:#798da9}
.closing{padding:71px 0 59px;display:flex;align-items:center;justify-content:space-between;gap:30px}
.closing .eyebrow{margin-bottom:15px}
.closing h2{font-size:29px;line-height:1.5;letter-spacing:-1px;font-weight:650;margin:0}
.closing h2 span{color:#7a879a}
.closing .action-primary{flex:none}
.home-footer{border-top:1px solid #dce1e6;padding:24px 0 28px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.home-footer strong{font-size:12px;letter-spacing:-.4px}
.home-footer strong span{font-weight:400;color:#929aa5;font-size:10px;letter-spacing:0;margin-left:14px}
.home-footer button{border:0;background:none;color:#657187;font-size:11px;display:flex;gap:9px;align-items:center}
.home-footer>small{color:#939eac;font-size:9px}
@media(min-width:1600px){.hero{min-height:850px}.hero-visual{min-height:650px}.orbit-art{top:-13px}.hero-copy{padding-bottom:52px}}
@media(max-width:1150px){.home-width{width:calc(100% - 72px)}.hero{min-height:750px}.hero h1{font-size:49px;letter-spacing:-2px}.hero-visual{min-height:570px}.preview-card{width:282px;padding:18px;bottom:38px}.floating-note{left:0;top:32%;font-size:10px}.hero-description{font-size:14px}.hero-actions{gap:17px}.action-primary{padding-inline:19px;font-size:13px;gap:19px}.action-text{font-size:11px}.coaching-layout{gap:45px}.coaching-copy h2{font-size:32px}.path-title{font-size:21px}.path-item{padding-inline:23px}.coaching-canvas{padding:25px}.reason-line{grid-template-columns:1fr;gap:7px}}
@media(max-width:820px){.home-width{width:calc(100% - 40px)}.hero{grid-template-columns:1fr;grid-template-rows:78px auto auto 60px;min-height:0}.hero-brand{grid-column:1;grid-row:1}.account-link{grid-column:1;grid-row:1;font-size:11px}.hero-copy{grid-column:1;grid-row:2;padding:38px 0 0;max-width:580px}.hero h1{font-size:clamp(41px,7.8vw,61px)}.hero-description{font-size:14px;margin-block:20px 23px}.hero-actions{gap:22px}.hero-visual{grid-column:1;grid-row:3;min-height:510px;width:min(520px,100%);justify-self:center}.orbit-art{width:95%;left:-3%;top:-18px}.visual-label{right:0;top:35px}.preview-card{width:270px;right:0;bottom:32px}.floating-note{top:44%;left:0}.visual-caption{font-size:9px;bottom:4px}.hero-bottom{grid-row:4}.hero-bottom>span:last-child{display:none}.hero-proof{margin-top:19px;font-size:10px;gap:15px}.training-paths{padding-block:30px 40px}.path-item{gap:16px;padding-inline:15px}.path-title{font-size:17px}.path-top small{font-size:9px}.path-top>.el-icon{font-size:21px}.path-bottom>span:first-child{font-size:10px;line-height:1.8;max-width:110px}.path-bottom{gap:6px}.path-arrow{flex:none;width:24px;height:24px}.coaching-section{padding-block:49px}.coaching-layout{grid-template-columns:1fr;gap:28px}.coaching-copy h2{font-size:34px}.coaching-copy h2 br{display:none}.coaching-copy .eyebrow{margin-bottom:16px}.section-description{margin:15px 0 23px}.section-description br{display:none}.step-select{display:flex;max-width:none;gap:5px}.step-select button{flex:1;padding:12px 8px;border-left:0;border-bottom:2px solid transparent;border-radius:7px 7px 0 0;gap:7px;font-size:11px;justify-content:center}.step-select button.active{border-bottom-color:#d0f586}.step-select .step-arrow{display:none}.step-select button>.el-icon{font-size:16px}.coaching-canvas{min-height:0}.closing{padding-block:44px;align-items:flex-start}.closing h2{font-size:23px}.closing h2 span{display:block}.home-footer{flex-wrap:wrap;gap:18px}.home-footer strong span{display:none}}
@media(max-width:480px){.hero-copy{padding-top:27px}.eyebrow{font-size:8px;letter-spacing:1.1px;margin-bottom:19px}.hero h1{font-size:43px;letter-spacing:-2.7px}.hero-description{font-size:13px}.hero-actions{gap:17px}.action-primary{min-height:50px;padding-inline:16px;gap:15px;font-size:12px}.action-text{font-size:10px;gap:8px}.play-icon{width:26px;height:26px}.hero-visual{min-height:490px}.orbit-art{width:112%;top:6px;left:-12%}.visual-label{top:27px}.visual-label span{font-size:7px}.visual-label small{font-size:9px}.preview-card{width:255px;bottom:30px}.floating-note{top:35%;padding:10px 12px;font-size:9px}.hero-bottom{font-size:8px}.hero-bottom a{font-size:9px}.training-paths{grid-template-columns:1fr;padding:0 0 22px}.path-item,.path-item:first-child,.path-item:last-child{border:0;border-bottom:1px solid #dce1e6;padding:21px 0;grid-template-columns:1fr auto;gap:11px 20px}.path-item:last-child{border:0}.path-top{grid-column:1/-1}.path-top>.el-icon{font-size:22px}.path-title{font-size:21px;align-self:center}.path-bottom>span:first-child{display:none}.path-arrow{width:31px;height:31px}.coaching-copy h2{font-size:29px;letter-spacing:-1.5px}.coaching-copy h2 br{display:block}.coaching-canvas{padding:22px 18px;border-radius:14px}.coaching-canvas h3{font-size:16px;line-height:1.6;margin-block:16px}.example-source,.example-result{padding:15px}.example-source p{font-size:12px}.example-result p{font-size:13px}.canvas-top{font-size:9px}.canvas-top small{font-size:7px}.reason-line p{font-size:10px}.canvas-footnote{font-size:8px;line-height:1.7}.closing{flex-direction:column;gap:25px}.closing h2{font-size:27px}.closing .eyebrow{font-size:8px}.home-footer>small{flex-basis:100%;font-size:8px}}
@media(prefers-reduced-motion:reduce){.quest-home *{scroll-behavior:auto!important;transition:none!important}}
</style>
