<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CircleCheck,
  Collection,
  DataAnalysis,
  DocumentChecked,
  EditPen,
  MagicStick,
  Microphone,
  Reading,
  Refresh,
  TrendCharts,
  User,
  Warning,
} from '@element-plus/icons-vue'
import { scoringApi } from '../../api'

type PracticeType = 'essay' | 'interview'
type ExamType = 'national' | 'province' | 'institution'

interface Question {
  id: number
  exam: ExamType
  year: string
  type: PracticeType
  title: string
  source: string
  duration: string
  difficulty: string
  prompt: string
  requirements: string[]
  tags: string[]
}

interface Dimension {
  name: string
  score: number
  comment: string
}

interface QualityMaterial {
  title: string
  content: string
  usage: string
}

interface Evaluation {
  score: number
  level: string
  summary: string
  dimensions: Dimension[]
  advantages: string[]
  disadvantages: string[]
  suggestions: string[]
  qualityMaterials: QualityMaterial[]
  sampleEssay: string
}

const questions: Question[] = [
  {
    id: 1,
    exam: 'national',
    year: '2025',
    type: 'essay',
    title: '数字政府如何提升基层治理效能',
    source: '2025 国考副省级申论',
    duration: '45 分钟',
    difficulty: '中等',
    prompt:
      '给定资料围绕某地推进“一网统管”、社区协同治理、数据共享中的基层负担等问题展开。请结合材料，概括数字政府建设中应处理好的几组关系，并提出对策建议。',
    requirements: ['观点明确，紧扣材料', '结构完整，条理清晰', '对策具有可操作性', '建议 900-1100 字'],
    tags: ['数字政府', '基层治理', '申论大作文'],
  },
  {
    id: 2,
    exam: 'province',
    year: '2024',
    type: 'essay',
    title: '青年干部如何在基层一线担当作为',
    source: '2024 浙江省考申论',
    duration: '40 分钟',
    difficulty: '偏难',
    prompt:
      '材料反映了基层青年干部在产业振兴、矛盾调解、公共服务中的实践。请围绕“在基层一线锤炼过硬本领”写一篇议论文。',
    requirements: ['立意准确', '论证充分', '结合基层实际', '建议 800-1000 字'],
    tags: ['青年干部', '基层实践', '议论文'],
  },
  {
    id: 3,
    exam: 'institution',
    year: '2023',
    type: 'essay',
    title: '公共服务如何兼顾效率与温度',
    source: '2023 事业单位综合写作',
    duration: '35 分钟',
    difficulty: '中等',
    prompt:
      '材料涉及政务大厅适老化服务、线上办理便利化和特殊群体帮办代办。请结合实际，谈谈公共服务如何在提效的同时保留温度。',
    requirements: ['问题意识清晰', '论点有层次', '体现服务意识', '建议 700-900 字'],
    tags: ['公共服务', '适老化', '民生'],
  },
  {
    id: 4,
    exam: 'national',
    year: '2024',
    type: 'interview',
    title: '基层减负与工作留痕如何平衡',
    source: '2024 国考结构化面试',
    duration: '3 分钟',
    difficulty: '偏难',
    prompt:
      '有干部认为基层减负后工作留痕少了，担心责任说不清；也有人认为留痕过多会影响干事效率。请谈谈你的看法。',
    requirements: ['观点辩证', '身份意识明确', '提出制度化建议', '表达自然流畅'],
    tags: ['基层减负', '工作留痕', '综合分析'],
  },
  {
    id: 5,
    exam: 'province',
    year: '2025',
    type: 'interview',
    title: '乡村旅游旺季出现游客投诉怎么办',
    source: '2025 省考面试预测题',
    duration: '3 分钟',
    difficulty: '中等',
    prompt:
      '某村发展乡村旅游，旺季出现停车混乱、排队时间长、民宿价格争议等投诉。你作为镇政府工作人员，会如何处理？',
    requirements: ['先回应群众诉求', '分类处置问题', '兼顾经营主体', '形成长效机制'],
    tags: ['应急处置', '乡村振兴', '群众工作'],
  },
  {
    id: 6,
    exam: 'institution',
    year: '2023',
    type: 'interview',
    title: '群众反映窗口办事慢，你怎么处理',
    source: '2023 事业编结构化面试',
    duration: '3 分钟',
    difficulty: '中等',
    prompt:
      '政务服务大厅有群众反映窗口排队时间长、办理速度慢，现场情绪比较激动。你作为窗口负责人，会如何处理？',
    requirements: ['先稳定现场', '查明原因', '提出整改', '体现服务意识'],
    tags: ['窗口服务', '应急沟通', '服务意识'],
  },
]

const examOptions = [
  { value: 'national', label: '历年国考', caption: '国家公务员考试', count: '452', icon: '国' },
  { value: 'province', label: '地方省考', caption: '联考/省直/市县', count: '1208', icon: '省' },
  { value: 'institution', label: '事业编', caption: '综合写作/结构化', count: '890', icon: '事' },
] as const

const typeOptions = [
  { value: 'essay', label: '申论', icon: EditPen },
  { value: 'interview', label: '面试', icon: Microphone },
] as const

const sampleEssayAnswer =
  '第一，数字政府建设要处理好“技术赋能”和“群众体验”的关系。技术只是治理工具，最终要回到群众办事是否更便捷、基层响应是否更高效上来。平台建设不能停留在系统上线和数据汇聚，而要以事项办理时长、群众满意度、基层负担变化作为评价标准。\n\n第二，要处理好“数据共享”和“安全边界”的关系。打通部门壁垒能够提升协同效率，但也要完善数据授权、分级分类和责任追溯机制，防止数据滥用、重复采集和多头填报。\n\n第三，要处理好“线上平台”和“线下服务”的关系。对于老年人、残障人士等群体，应保留必要窗口和帮办代办服务，避免数字鸿沟影响公共服务公平。只有让数据多跑路、群众少跑腿、基层少负担，数字政府才能真正转化为治理效能。'

const sampleInterviewAnswer =
  '各位考官，我会从现场回应、问题排查、整改提升三个方面处理。首先，对群众反映的问题表示理解，安排专人引导等候群众，说明当前办理进度，优先帮助老年人、残障人士等特殊群体，避免情绪进一步扩大。\n\n其次，立即调取窗口排队数据，了解是人员不足、系统故障，还是流程设置不合理导致效率低。能现场解决的，及时增开窗口、协调后台人员支援；涉及材料流转、一次性告知不到位的，形成问题清单限时整改。\n\n最后，建立常态化监测机制，把群众等待时间、一次办结率、满意度纳入窗口服务评价，通过预约分流、岗位培训、流程再造持续优化服务。窗口虽小，却连着民心，只有把小事办实，才能提升群众获得感。'

const selectedExam = ref<ExamType>('national')
const selectedType = ref<PracticeType>('essay')
const selectedQuestionId = ref(1)
const answer = ref('')
const loading = ref(false)
const errorMessage = ref('')
const evaluation = ref<Evaluation | null>(null)

const filteredQuestions = computed(() =>
  questions.filter(item => item.exam === selectedExam.value && item.type === selectedType.value)
)

const selectedQuestion = computed(() => {
  const matched = filteredQuestions.value.find(item => item.id === selectedQuestionId.value)
  return matched || filteredQuestions.value[0] || questions[0]
})

const selectedExamMeta = computed(() => examOptions.find(item => item.value === selectedExam.value) || examOptions[0])
const wordCount = computed(() => answer.value.trim().replace(/\s/g, '').length)
const scoreCircumference = 301.59

const scoreRingStyle = computed(() => {
  const score = evaluation.value?.score ?? 0
  return {
    strokeDasharray: `${scoreCircumference}`,
    strokeDashoffset: `${scoreCircumference - (score / 100) * scoreCircumference}`,
  }
})

const scoreTone = computed(() => {
  if (!evaluation.value) return 'pending'
  if (evaluation.value.score >= 88) return 'excellent'
  if (evaluation.value.score >= 75) return 'good'
  if (evaluation.value.score >= 60) return 'normal'
  return 'weak'
})

function clampScore(value: number, min = 0, max = 100) {
  if (Number.isNaN(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

function scoreStyle(score: number) {
  return { width: `${clampScore(score)}%` }
}

function resetReport() {
  evaluation.value = null
  errorMessage.value = ''
}

function selectExam(exam: ExamType) {
  selectedExam.value = exam
  const first = questions.find(item => item.exam === exam && item.type === selectedType.value)
  if (first) selectedQuestionId.value = first.id
  resetReport()
}

function selectType(type: PracticeType) {
  selectedType.value = type
  const first = questions.find(item => item.exam === selectedExam.value && item.type === type)
  if (first) selectedQuestionId.value = first.id
  answer.value = ''
  resetReport()
}

function selectQuestion(id: number) {
  selectedQuestionId.value = id
  resetReport()
}

function useTemplate() {
  answer.value = selectedQuestion.value.type === 'interview' ? sampleInterviewAnswer : sampleEssayAnswer
  resetReport()
}

function restartPractice() {
  answer.value = ''
  resetReport()
}

function revealReport() {
  if (typeof window === 'undefined') return
  if (!window.matchMedia('(max-width: 1180px)').matches) return
  window.setTimeout(() => {
    document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 80)
}

function inferScore() {
  const text = answer.value.trim()
  const target = selectedQuestion.value.type === 'interview' ? 360 : 900
  const lengthScore = Math.min(wordCount.value / target, 1) * 18
  const structureHits = ['第一', '第二', '第三', '首先', '其次', '再次', '最后', '一方面', '另一方面', '总之', '因此']
    .filter(word => text.includes(word)).length
  const policyHits = ['以人民为中心', '基层治理', '高质量发展', '数字政府', '协同治理', '法治', '民生', '服务', '减负']
    .filter(word => text.includes(word)).length
  const actionHits = ['机制', '制度', '清单', '平台', '监督', '培训', '落实', '闭环', '考核', '反馈', '优化']
    .filter(word => text.includes(word)).length
  return clampScore(52 + lengthScore + structureHits * 3 + policyHits * 2 + actionHits * 2, 45, 95)
}

function localEvaluation(): Evaluation {
  const score = inferScore()
  const isInterview = selectedQuestion.value.type === 'interview'

  return {
    score,
    level: score >= 88 ? '优秀' : score >= 78 ? '良好' : score >= 65 ? '中等' : '待提升',
    summary:
      '本次作答方向基本准确，能够回应题目核心问题，并具备一定结构意识。后续可继续强化政策表达、材料转化和对策可操作性，让答案更接近高分阅卷标准。',
    dimensions: isInterview
      ? [
          { name: '审题准确', score: clampScore(score + 5), comment: '能够回应现场矛盾和身份职责，基本没有偏题。' },
          { name: '逻辑层次', score: clampScore(score), comment: '处理顺序较清楚，过渡语还可以更自然。' },
          { name: '机关表达', score: clampScore(score - 4), comment: '表达稳妥，可继续补充规范化工作语言。' },
          { name: '处置可行', score: clampScore(score + 2), comment: '现场处理较完整，长效机制还可以更具体。' },
          { name: '临场感染力', score: clampScore(score - 2), comment: '语气平实，结尾可增强担当感和服务意识。' },
        ]
      : [
          { name: '审题准确', score: clampScore(score + 4), comment: '能抓住题干要求，回应材料主题。' },
          { name: '结构完整', score: clampScore(score + 1), comment: '分段清晰，具备总分意识。' },
          { name: '论证深度', score: clampScore(score - 5), comment: '部分观点仍偏概括，例证和分析可以继续展开。' },
          { name: '政策表达', score: clampScore(score - 4), comment: '政策词有体现，但官方表述还可以更准确。' },
          { name: '语言规范', score: clampScore(score + 2), comment: '语言通顺，可进一步压缩重复表达。' },
        ],
    advantages: [
      '能够围绕题目核心问题展开，作答方向较稳。',
      '段落层次比较清楚，阅卷者可以快速抓住答题脉络。',
      '已经有对策意识，能把问题导向解决路径。',
    ],
    disadvantages: [
      '部分对策还停留在原则层面，缺少执行主体、操作步骤和评价标准。',
      '材料关键词与政策表达结合还不够紧，考试辨识度可以继续提升。',
      isInterview ? '身份代入和现场感还可加强，结尾的服务温度略弱。' : '分论点之间的递进关系还不够明显，结尾升华略弱。',
    ],
    suggestions: [
      '开头先用一句话明确判断，再用三到四个并列分论点展开。',
      '每条对策尽量写成“主体 + 动作 + 机制 + 效果”的完整句式。',
      '加入一到两个高频政策表达，例如“以人民为中心”“基层减负”“闭环治理”“协同联动”。',
      '结尾回扣治理效能、群众获得感或干部担当，形成完整收束。',
    ],
    qualityMaterials: [
      {
        title: '以人民为中心',
        content: '把群众满意度作为检验工作成效的重要标准，让治理成果更多更公平惠及人民群众。',
        usage: '适合用于申论结尾、面试表态和政务服务类题目。',
      },
      {
        title: '闭环治理',
        content: '建立问题收集、分类交办、限时整改、结果反馈、跟踪问效的闭环机制。',
        usage: '适合用于基层治理、窗口服务、应急处置类题目。',
      },
      {
        title: '数字赋能不是数字负担',
        content: '推动数据多跑路、群众少跑腿，同时防止重复填报、多头留痕增加基层负担。',
        usage: '适合用于数字政府、基层减负、营商环境类题目。',
      },
    ],
    sampleEssay: isInterview
      ? sampleInterviewAnswer
      : '数字政府建设既要追求治理效率，也要守住公共服务的公平底线。首先，要处理好技术赋能与群众体验的关系。平台建设不能停留在系统上线和数据汇聚，而要以群众办事是否更便捷、基层响应是否更高效作为评价标准。其次，要处理好数据共享与安全边界的关系。通过统一数据目录、授权清单和审计追踪机制，推动跨部门协同，同时保护个人信息和公共数据安全。再次，要处理好线上服务与线下兜底的关系。面对老年人、残障人士等群体，应保留必要窗口和帮办代办服务，避免数字鸿沟影响公共服务公平。总之，数字政府不是简单的技术工程，而是治理方式的系统重塑。只有让数据多跑路、群众少跑腿、基层少负担，才能真正把技术优势转化为治理效能和民生温度。',
  }
}

function normalizeEvaluation(raw: any): Evaluation {
  const fallback = localEvaluation()
  const materials = Array.isArray(raw?.qualityMaterials) ? raw.qualityMaterials : fallback.qualityMaterials
  const dimensions = Array.isArray(raw?.dimensions) ? raw.dimensions : fallback.dimensions

  return {
    score: clampScore(Number(raw?.score ?? fallback.score)),
    level: String(raw?.level || fallback.level),
    summary: String(raw?.summary || fallback.summary),
    dimensions: dimensions.map((item: any, index: number) => ({
      name: String(item?.name || fallback.dimensions[index]?.name || '评分维度'),
      score: clampScore(Number(item?.score ?? fallback.dimensions[index]?.score ?? fallback.score)),
      comment: String(item?.comment || fallback.dimensions[index]?.comment || '该维度仍有提升空间。'),
    })),
    advantages: Array.isArray(raw?.advantages) ? raw.advantages.map(String) : fallback.advantages,
    disadvantages: Array.isArray(raw?.disadvantages) ? raw.disadvantages.map(String) : fallback.disadvantages,
    suggestions: Array.isArray(raw?.suggestions) ? raw.suggestions.map(String) : fallback.suggestions,
    qualityMaterials: materials.map((item: any, index: number) => ({
      title: String(item?.title || fallback.qualityMaterials[index]?.title || '高频素材'),
      content: String(item?.content || fallback.qualityMaterials[index]?.content || ''),
      usage: String(item?.usage || fallback.qualityMaterials[index]?.usage || ''),
    })),
    sampleEssay: String(raw?.sampleEssay || fallback.sampleEssay),
  }
}

async function evaluate() {
  errorMessage.value = ''
  if (wordCount.value < 20) {
    errorMessage.value = '请先输入至少 20 个字的作答内容。'
    return
  }

  loading.value = true
  try {
    const res: any = await scoringApi.evaluate({
      type: selectedQuestion.value.type,
      question: selectedQuestion.value,
      answer: answer.value,
    })
    evaluation.value = normalizeEvaluation(res?.data ?? res)
    if (res?.message) errorMessage.value = res.message
    revealReport()
  } catch {
    evaluation.value = localEvaluation()
    errorMessage.value = 'AI 服务暂未连接，已生成本地示例评分报告。'
    revealReport()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="coach-page">
    <aside class="side-nav" aria-label="PolicyQuest 导航">
      <a class="brand" href="#/">
        <span class="brand-mark">PQ</span>
        <span>
          <strong>PolicyQuest</strong>
          <small>AI Exam Coach</small>
        </span>
      </a>

      <nav class="side-links">
        <a class="active" href="#answer"><el-icon><EditPen /></el-icon><span>AI评阅</span></a>
        <a href="#library"><el-icon><Reading /></el-icon><span>真题库</span></a>
        <a href="#report"><el-icon><DataAnalysis /></el-icon><span>评分报告</span></a>
        <a href="#sample"><el-icon><DocumentChecked /></el-icon><span>示范答案</span></a>
      </nav>

      <section class="side-card">
        <p>今日训练</p>
        <strong>{{ selectedExamMeta.label }} · {{ selectedType === 'essay' ? '申论' : '面试' }}</strong>
        <span>{{ selectedQuestion.duration }} · {{ selectedQuestion.difficulty }}</span>
      </section>
    </aside>

    <section class="coach-main">
      <header class="top-bar">
        <div>
          <p class="eyebrow">PolicyQuest AI Exam Coach</p>
          <h1>申论与面试真题 AI 精评工作台</h1>
        </div>
        <div class="profile-pill">
          <el-icon><User /></el-icon>
          <span>Coach Mode</span>
        </div>
      </header>

      <section class="hero-panel">
        <div>
          <span class="status-chip">Evaluation Ready</span>
          <h2>选择国考、省考、事业编真题，输入自己的答案，获得评分、指导、建议和示范。</h2>
          <p>系统会按真实阅卷逻辑输出总分、分项维度、优缺点、提分路径、优质素材和一版可直接学习的示范答案。</p>
        </div>
        <div class="hero-metrics">
          <span><strong>3</strong>考试来源</span>
          <span><strong>2</strong>作答模式</span>
          <span><strong>AI</strong>即时评阅</span>
        </div>
      </section>

      <section id="library" class="exam-grid" aria-label="考试类型">
        <button
          v-for="item in examOptions"
          :key="item.value"
          class="exam-card"
          :class="{ active: selectedExam === item.value }"
          type="button"
          @click="selectExam(item.value)"
        >
          <span class="exam-icon">{{ item.icon }}</span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.caption }}</small>
          <em>{{ item.count }} 套题</em>
        </button>
      </section>

      <section class="workspace-grid">
        <aside class="question-panel panel">
          <div class="panel-head">
            <div>
              <p class="eyebrow">Question Bank</p>
              <h2>真题选择</h2>
            </div>
          </div>

          <div class="type-switch">
            <button
              v-for="item in typeOptions"
              :key="item.value"
              class="type-button"
              :class="{ active: selectedType === item.value }"
              type="button"
              @click="selectType(item.value)"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              {{ item.label }}
            </button>
          </div>

          <div class="question-list">
            <article
              v-for="item in filteredQuestions"
              :key="item.id"
              class="question-item"
              :class="{ active: selectedQuestionId === item.id }"
              @click="selectQuestion(item.id)"
            >
              <div>
                <span>{{ item.year }}</span>
                <span>{{ item.duration }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.source }} · {{ item.difficulty }}</p>
            </article>
          </div>
        </aside>

        <section id="answer" class="answer-panel panel">
          <div class="answer-head">
            <div>
              <p class="eyebrow">{{ selectedQuestion.source }}</p>
              <h2>{{ selectedQuestion.title }}</h2>
            </div>
            <button class="secondary-button" type="button" @click="useTemplate">
              <el-icon><Refresh /></el-icon>
              插入示范
            </button>
          </div>

          <p class="prompt-text">{{ selectedQuestion.prompt }}</p>

          <div class="tag-row">
            <span v-for="item in selectedQuestion.requirements" :key="item">{{ item }}</span>
          </div>
          <div class="topic-row">
            <span v-for="item in selectedQuestion.tags" :key="item">{{ item }}</span>
          </div>

          <label class="answer-editor">
            <span>我的作答</span>
            <textarea
              v-model="answer"
              placeholder="请输入你的申论作文或面试作答。建议按真实考试状态完成后再提交评阅。"
            />
          </label>

          <div class="submit-row">
            <div class="count-line">
              <strong>{{ wordCount }}</strong>
              <span>字</span>
              <em v-if="errorMessage">{{ errorMessage }}</em>
            </div>
            <button class="primary-button" type="button" :disabled="loading" @click="evaluate">
              <el-icon><MagicStick /></el-icon>
              {{ loading ? 'AI 正在评阅...' : '提交 AI 评阅' }}
            </button>
          </div>
        </section>

        <aside id="report" class="report-panel">
          <section class="score-card panel" :class="scoreTone">
            <p class="eyebrow">Overall Score</p>
            <div class="score-layout">
              <div class="score-ring">
                <svg viewBox="0 0 120 120" role="img" aria-label="总分">
                  <circle class="ring-track" cx="60" cy="60" r="48" />
                  <circle class="ring-value" cx="60" cy="60" r="48" :style="scoreRingStyle" />
                </svg>
                <div class="score-number">
                  <strong>{{ evaluation?.score ?? '--' }}</strong>
                  <span>/100</span>
                </div>
              </div>
              <div>
                <h2>{{ evaluation?.level ?? '待评阅' }}</h2>
                <p>{{ evaluation?.summary ?? '提交作答后，这里会生成总评、分项评分和提分路径。' }}</p>
              </div>
            </div>
          </section>

          <section class="panel mini-panel">
            <div class="panel-title">
              <el-icon><TrendCharts /></el-icon>
              <span>维度分析</span>
            </div>
            <template v-if="evaluation">
              <div v-for="item in evaluation.dimensions" :key="item.name" class="dimension-row">
                <div><strong>{{ item.name }}</strong><span>{{ item.score }}/100</span></div>
                <div class="progress-track"><i :style="scoreStyle(item.score)"></i></div>
                <p>{{ item.comment }}</p>
              </div>
            </template>
            <p v-else class="empty-note">评阅完成后展示审题、结构、论证、表达等维度。</p>
          </section>

          <section class="panel mini-panel">
            <div class="panel-title">
              <el-icon><Collection /></el-icon>
              <span>Coach 建议</span>
            </div>
            <ul v-if="evaluation" class="check-list">
              <li v-for="item in evaluation.suggestions" :key="item">
                <el-icon><CircleCheck /></el-icon>
                <span>{{ item }}</span>
              </li>
            </ul>
            <p v-else class="empty-note">提交后生成可执行的改写建议。</p>
          </section>
        </aside>
      </section>

      <section v-if="evaluation" id="sample" class="detail-grid">
        <article class="detail-card positive">
          <div class="panel-title"><el-icon><CircleCheck /></el-icon><span>优点</span></div>
          <ul><li v-for="item in evaluation.advantages" :key="item">{{ item }}</li></ul>
        </article>

        <article class="detail-card negative">
          <div class="panel-title"><el-icon><Warning /></el-icon><span>缺点</span></div>
          <ul><li v-for="item in evaluation.disadvantages" :key="item">{{ item }}</li></ul>
        </article>

        <article class="detail-card materials">
          <div class="panel-title"><el-icon><Reading /></el-icon><span>优质素材</span></div>
          <div class="material-grid">
            <section v-for="item in evaluation.qualityMaterials" :key="item.title">
              <strong>{{ item.title }}</strong>
              <p>{{ item.content }}</p>
              <small>{{ item.usage }}</small>
            </section>
          </div>
        </article>

        <article class="detail-card sample">
          <div class="panel-title"><el-icon><DocumentChecked /></el-icon><span>示范答案</span></div>
          <p>{{ evaluation.sampleEssay }}</p>
          <button class="secondary-button" type="button" @click="restartPractice">重新练习此题</button>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.coach-page {
  min-height: 100vh;
  background: #f8f9ff;
  color: #0b1c30;
  font-family: "Plus Jakarta Sans", Inter, "Noto Sans SC", system-ui, sans-serif;
  letter-spacing: 0;
}

button,
textarea {
  font: inherit;
  letter-spacing: 0;
}

button {
  cursor: pointer;
}

.side-nav {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  width: 260px;
  padding: 24px 16px;
  border-right: 1px solid rgba(194, 198, 216, 0.46);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(20px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: #0066ff;
  color: #ffffff;
  font-weight: 900;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  color: #0050cb;
  font-size: 18px;
}

.brand small {
  margin-top: 2px;
  color: #424656;
  font-size: 12px;
}

.side-links {
  display: grid;
  gap: 8px;
  margin-top: 48px;
}

.side-links a {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 16px;
  color: #424656;
  text-decoration: none;
  font-size: 14px;
  font-weight: 800;
}

.side-links a.active,
.side-links a:hover {
  background: #0066ff;
  color: #ffffff;
}

.side-card {
  display: grid;
  gap: 8px;
  margin-top: auto;
  padding: 18px;
  border: 1px solid #d7ddf0;
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff, #eff4ff);
}

.side-card p,
.side-card span {
  margin: 0;
  color: #727687;
  font-size: 12px;
}

.side-card strong {
  color: #0b1c30;
  line-height: 1.45;
}

.coach-main {
  min-height: 100vh;
  margin-left: 260px;
  padding: 28px min(36px, 3vw) 64px;
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: -28px calc(min(36px, 3vw) * -1) 24px;
  padding: 18px min(36px, 3vw);
  border-bottom: 1px solid rgba(194, 198, 216, 0.46);
  background: rgba(248, 249, 255, 0.86);
  backdrop-filter: blur(20px);
}

.top-bar h1 {
  margin: 3px 0 0;
  font-size: 24px;
  line-height: 1.25;
}

.eyebrow {
  margin: 0;
  color: #0050cb;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.profile-pill,
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.profile-pill {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid #c2c6d8;
  background: #ffffff;
}

.status-chip {
  min-height: 30px;
  padding: 0 12px;
  background: rgba(0, 106, 97, 0.12);
  color: #006a61;
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 28px;
  align-items: center;
  padding: 32px;
  border: 1px solid rgba(194, 198, 216, 0.5);
  border-radius: 16px;
  background:
    radial-gradient(circle at 100% 0%, rgba(134, 242, 228, 0.25), transparent 30%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(239, 244, 255, 0.88));
  box-shadow: 0 16px 44px rgba(19, 42, 74, 0.06);
}

.hero-panel h2 {
  max-width: 850px;
  margin: 14px 0 12px;
  font-size: 32px;
  line-height: 1.25;
}

.hero-panel p {
  max-width: 760px;
  margin: 0;
  color: #424656;
  font-size: 17px;
  line-height: 1.75;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hero-metrics span {
  display: grid;
  gap: 4px;
  min-height: 82px;
  place-content: center;
  border-radius: 16px;
  background: #ffffff;
  color: #424656;
  text-align: center;
  box-shadow: 0 8px 24px rgba(19, 42, 74, 0.05);
}

.hero-metrics strong {
  color: #0050cb;
  font-size: 26px;
}

.exam-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.exam-card {
  display: grid;
  justify-items: start;
  gap: 7px;
  min-height: 150px;
  padding: 22px;
  border: 1px solid #d7ddf0;
  border-radius: 16px;
  background: #ffffff;
  color: #0b1c30;
  text-align: left;
  box-shadow: 0 10px 30px rgba(19, 42, 74, 0.05);
}

.exam-card:hover,
.exam-card.active {
  border-color: rgba(0, 102, 255, 0.42);
  background: #eff4ff;
}

.exam-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #0050cb;
  color: #ffffff;
  font-weight: 900;
}

.exam-card strong {
  font-size: 18px;
}

.exam-card small {
  color: #424656;
}

.exam-card em {
  margin-top: 4px;
  color: #006a61;
  font-style: normal;
  font-size: 13px;
  font-weight: 900;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 390px;
  gap: 18px;
  align-items: start;
  margin-top: 18px;
}

.panel,
.detail-card {
  border: 1px solid #d7ddf0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(19, 42, 74, 0.055);
}

.question-panel,
.answer-panel,
.score-card,
.mini-panel,
.detail-card {
  padding: 22px;
}

.question-panel,
.report-panel {
  position: sticky;
  top: 92px;
}

.panel-head,
.answer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.panel-head h2,
.answer-head h2 {
  margin: 5px 0 0;
  font-size: 22px;
  line-height: 1.35;
}

.type-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-top: 18px;
  padding: 4px;
  border-radius: 14px;
  background: #eff4ff;
}

.type-button,
.secondary-button,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 12px;
  font-weight: 900;
}

.type-button {
  height: 42px;
  background: transparent;
  color: #424656;
}

.type-button.active {
  background: #0050cb;
  color: #ffffff;
}

.question-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.question-item {
  padding: 14px;
  border: 1px solid #dfe5f6;
  border-radius: 14px;
  background: #ffffff;
  transition: 0.18s ease;
}

.question-item:hover,
.question-item.active {
  border-color: #006a61;
  background: #ebfffc;
}

.question-item div {
  display: flex;
  justify-content: space-between;
  color: #727687;
  font-size: 12px;
  font-weight: 800;
}

.question-item h3 {
  margin: 10px 0 6px;
  font-size: 15px;
  line-height: 1.45;
}

.question-item p {
  margin: 0;
  color: #424656;
  font-size: 12px;
}

.secondary-button {
  min-height: 40px;
  padding: 0 14px;
  background: #eff4ff;
  color: #0050cb;
}

.prompt-text {
  margin: 18px 0 0;
  padding: 16px;
  border-radius: 14px;
  background: #eff4ff;
  color: #253246;
  line-height: 1.8;
}

.tag-row,
.topic-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-row {
  margin-top: 16px;
}

.topic-row {
  margin-top: 10px;
}

.tag-row span,
.topic-row span {
  min-height: 30px;
  padding: 6px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.tag-row span {
  background: #e8fbf7;
  color: #006a61;
}

.topic-row span {
  background: #fff2f6;
  color: #b40036;
}

.answer-editor {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.answer-editor span {
  font-size: 14px;
  font-weight: 900;
}

.answer-editor textarea {
  width: 100%;
  min-height: 430px;
  padding: 18px;
  resize: vertical;
  border: 1px solid #c2c6d8;
  border-radius: 16px;
  outline: none;
  background: #fbfcff;
  color: #0b1c30;
  font-size: 16px;
  line-height: 1.85;
}

.answer-editor textarea:focus {
  border-color: #0050cb;
  box-shadow: 0 0 0 4px rgba(0, 80, 203, 0.1);
}

.submit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.count-line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  color: #727687;
}

.count-line strong {
  color: #006a61;
  font-size: 24px;
}

.count-line em {
  color: #b40036;
  font-style: normal;
  font-weight: 800;
}

.primary-button {
  min-height: 48px;
  padding: 0 20px;
  background: #0050cb;
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(0, 80, 203, 0.18);
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.report-panel {
  display: grid;
  gap: 14px;
}

.score-layout {
  display: grid;
  grid-template-columns: 126px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  margin-top: 12px;
}

.score-ring {
  position: relative;
  width: 126px;
  height: 126px;
}

.score-ring svg {
  display: block;
  width: 126px;
  height: 126px;
  transform: rotate(-90deg);
}

.ring-track,
.ring-value {
  fill: none;
  stroke-width: 12;
}

.ring-track {
  stroke: #eff4ff;
}

.ring-value {
  stroke: #0050cb;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.35s ease;
}

.score-card.excellent .ring-value,
.score-card.good .ring-value {
  stroke: #006a61;
}

.score-card.normal .ring-value {
  stroke: #d88a00;
}

.score-card.weak .ring-value {
  stroke: #b40036;
}

.score-number {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
}

.score-number strong {
  font-size: 34px;
  line-height: 1;
}

.score-number span {
  color: #727687;
  font-size: 12px;
  font-weight: 900;
}

.score-layout h2 {
  margin: 0 0 8px;
  font-size: 22px;
}

.score-layout p {
  margin: 0;
  color: #424656;
  font-size: 14px;
  line-height: 1.65;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 14px;
  color: #0b1c30;
  font-weight: 900;
}

.panel-title .el-icon {
  color: #0050cb;
}

.dimension-row + .dimension-row {
  margin-top: 14px;
}

.dimension-row > div:first-child {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.dimension-row > div:first-child span {
  color: #0050cb;
  font-weight: 900;
}

.progress-track {
  height: 8px;
  margin: 8px 0;
  overflow: hidden;
  border-radius: 999px;
  background: #eff4ff;
}

.progress-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #006a61, #0050cb);
}

.dimension-row p,
.empty-note {
  margin: 0;
  color: #727687;
  font-size: 13px;
  line-height: 1.6;
}

.check-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.check-list li {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 8px;
  color: #424656;
  font-size: 14px;
  line-height: 1.6;
}

.check-list .el-icon {
  margin-top: 2px;
  color: #006a61;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.detail-card ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 18px;
  color: #424656;
  line-height: 1.7;
}

.detail-card.positive .panel-title .el-icon {
  color: #006a61;
}

.detail-card.negative .panel-title .el-icon {
  color: #b40036;
}

.materials,
.sample {
  grid-column: span 2;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.material-grid section {
  padding: 16px;
  border: 1px solid #dfe5f6;
  border-radius: 14px;
  background: #fbfcff;
}

.material-grid strong {
  font-size: 16px;
}

.material-grid p {
  margin: 10px 0;
  color: #424656;
  line-height: 1.7;
}

.material-grid small {
  color: #0050cb;
  line-height: 1.6;
}

.sample p {
  margin: 0 0 18px;
  color: #253246;
  font-size: 16px;
  line-height: 1.95;
}

@media (max-width: 1320px) {
  .workspace-grid {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .report-panel {
    grid-column: 1 / -1;
    position: static;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .score-card {
    grid-column: span 1;
  }
}

@media (max-width: 980px) {
  .side-nav {
    display: none;
  }

  .coach-main {
    margin-left: 0;
    padding: 18px 14px 42px;
  }

  .top-bar {
    margin: -18px -14px 16px;
    padding: 14px;
  }

  .top-bar h1 {
    font-size: 20px;
  }

  .profile-pill {
    display: none;
  }

  .hero-panel,
  .workspace-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .hero-metrics,
  .exam-grid,
  .report-panel,
  .material-grid {
    grid-template-columns: 1fr;
  }

  .question-panel,
  .report-panel {
    position: static;
  }

  .materials,
  .sample {
    grid-column: auto;
  }
}

@media (max-width: 640px) {
  .hero-panel {
    padding: 22px;
  }

  .hero-panel h2 {
    font-size: 24px;
  }

  .submit-row,
  .answer-head {
    align-items: stretch;
    flex-direction: column;
  }

  .answer-editor textarea {
    min-height: 340px;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }

  .score-layout {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
}
</style>
