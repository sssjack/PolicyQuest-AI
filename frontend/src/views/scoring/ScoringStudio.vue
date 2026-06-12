<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowLeft,
  Bell,
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
  { value: 'national', label: '历年国考', caption: '国家公务员' },
  { value: 'province', label: '地方省考', caption: '多省联考/省直' },
  { value: 'institution', label: '事业编', caption: '综合写作/结构化' },
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

const wordCount = computed(() => answer.value.trim().replace(/\s/g, '').length)
const answerPreview = computed(() => {
  const text = answer.value.trim().replace(/\s+/g, '')
  if (!text) return '提交作答后，系统会在这里标出你的核心表达，并提示哪些句子可以进一步优化。'
  return text.length > 108 ? `${text.slice(0, 108)}...` : text
})

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

function selectExam(exam: ExamType) {
  selectedExam.value = exam
  const first = questions.find(item => item.exam === exam && item.type === selectedType.value)
  if (first) selectedQuestionId.value = first.id
  evaluation.value = null
  errorMessage.value = ''
}

function selectType(type: PracticeType) {
  selectedType.value = type
  const first = questions.find(item => item.exam === selectedExam.value && item.type === type)
  if (first) selectedQuestionId.value = first.id
  answer.value = ''
  evaluation.value = null
  errorMessage.value = ''
}

function selectQuestion(id: number) {
  selectedQuestionId.value = id
  evaluation.value = null
  errorMessage.value = ''
}

function useTemplate() {
  answer.value = selectedQuestion.value.type === 'interview' ? sampleInterviewAnswer : sampleEssayAnswer
  evaluation.value = null
  errorMessage.value = ''
}

function restartPractice() {
  answer.value = ''
  evaluation.value = null
  errorMessage.value = ''
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
  } catch (error: any) {
    evaluation.value = localEvaluation()
    errorMessage.value = 'AI 服务暂未连接，已生成本地示例评分报告。'
    revealReport()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="policyquest-page">
    <header class="mobile-app-bar">
      <button class="icon-button" type="button" aria-label="返回">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <h1>AI Exam Coach</h1>
      <button class="icon-button" type="button" aria-label="消息">
        <el-icon><Bell /></el-icon>
      </button>
    </header>

    <header class="desktop-topbar">
      <a class="brand" href="#/">
        <span class="brand-mark">PQ</span>
        <span>
          <strong>PolicyQuest</strong>
          <small>AI Exam Coach</small>
        </span>
      </a>
      <nav class="desktop-nav" aria-label="主导航">
        <a href="#library">真题选择</a>
        <a href="#answer">作答区</a>
        <a href="#report">评阅报告</a>
        <a href="#materials">素材与范文</a>
      </nav>
      <div class="user-pill">
        <el-icon><User /></el-icon>
        <span>AI Coach</span>
      </div>
    </header>

    <div class="page-shell">
      <section class="workspace-head">
        <div>
          <p class="eyebrow">PolicyQuest AI Exam Coach</p>
          <h2>国考、省考、事业编申论/面试真题，一次完成作答、评分、指导、建议和示范答案。</h2>
        </div>
        <div class="head-metrics" aria-label="产品指标">
          <span><strong>3</strong>考试来源</span>
          <span><strong>2</strong>作答模式</span>
          <span><strong>5</strong>维评分</span>
        </div>
      </section>

      <section class="practice-grid">
        <aside id="library" class="library-panel surface-card">
          <div class="panel-title">
            <el-icon><Reading /></el-icon>
            <span>题库筛选</span>
          </div>

          <div class="segmented-block">
            <p>考试类型</p>
            <button
              v-for="item in examOptions"
              :key="item.value"
              class="choice-row"
              :class="{ active: selectedExam === item.value }"
              type="button"
              @click="selectExam(item.value)"
            >
              <span>{{ item.label }}</span>
              <small>{{ item.caption }}</small>
            </button>
          </div>

          <div class="segmented-block">
            <p>训练题型</p>
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
          </div>

          <div class="question-stack">
            <article
              v-for="item in filteredQuestions"
              :key="item.id"
              class="question-item"
              :class="{ selected: selectedQuestionId === item.id }"
              @click="selectQuestion(item.id)"
            >
              <div class="question-meta">
                <span>{{ item.year }}</span>
                <span>{{ item.duration }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.source }} · {{ item.difficulty }}</p>
            </article>
          </div>
        </aside>

        <section id="answer" class="answer-panel surface-card">
          <div class="answer-head">
            <div>
              <p class="eyebrow">{{ selectedQuestion.source }}</p>
              <h1>{{ selectedQuestion.title }}</h1>
            </div>
            <button class="soft-button" type="button" @click="useTemplate">
              <el-icon><Refresh /></el-icon>
              填入示范
            </button>
          </div>

          <p class="prompt-text">{{ selectedQuestion.prompt }}</p>

          <div class="requirement-list">
            <span v-for="item in selectedQuestion.requirements" :key="item">{{ item }}</span>
          </div>

          <div class="tag-list">
            <span v-for="item in selectedQuestion.tags" :key="item">{{ item }}</span>
          </div>

          <label class="answer-editor">
            <span>我的作答</span>
            <textarea
              v-model="answer"
              placeholder="在这里输入你的申论作文或面试作答。提交后，PolicyQuest 会从总分、分项维度、优缺点、提分建议、优质素材和示范答案进行完整评阅。"
            />
          </label>

          <div class="submit-row">
            <div class="count-line">
              <strong>{{ wordCount }}</strong>
              <span>字</span>
              <em v-if="errorMessage">{{ errorMessage }}</em>
            </div>
            <button class="primary-action" type="button" :disabled="loading" @click="evaluate">
              <el-icon><MagicStick /></el-icon>
              {{ loading ? 'AI 评阅中...' : '提交 AI 评阅' }}
            </button>
          </div>
        </section>

        <aside id="report" class="report-column">
          <section class="score-card surface-card" :class="scoreTone">
            <p class="eyebrow">AI Score</p>
            <div class="score-layout">
              <div class="score-ring" aria-label="总分">
                <svg viewBox="0 0 120 120" role="img">
                  <circle class="ring-track" cx="60" cy="60" r="48" />
                  <circle class="ring-value" cx="60" cy="60" r="48" :style="scoreRingStyle" />
                </svg>
                <div class="score-number">
                  <strong>{{ evaluation?.score ?? '--' }}</strong>
                  <span>总分</span>
                </div>
              </div>
              <div class="score-copy">
                <h2>{{ evaluation?.level ?? '待评阅' }}</h2>
                <p>
                  {{
                    evaluation?.summary ??
                    '提交作答后，这里会生成总评、分项评分和清晰的提分路径。'
                  }}
                </p>
              </div>
            </div>
          </section>

          <section class="dimension-card surface-card">
            <div class="panel-title">
              <el-icon><DataAnalysis /></el-icon>
              <span>维度分析</span>
            </div>
            <template v-if="evaluation">
              <div v-for="item in evaluation.dimensions" :key="item.name" class="dimension-row">
                <div>
                  <strong>{{ item.name }}</strong>
                  <span>{{ item.score }}/100</span>
                </div>
                <div class="progress-track">
                  <i :style="scoreStyle(item.score)"></i>
                </div>
                <p>{{ item.comment }}</p>
              </div>
            </template>
            <div v-else class="empty-note">
              <el-icon><TrendCharts /></el-icon>
              <p>维度评分会在评阅完成后展示。</p>
            </div>
          </section>

          <section class="suggestion-card surface-card">
            <div class="panel-title">
              <el-icon><DocumentChecked /></el-icon>
              <span>Coach 提分建议</span>
            </div>
            <template v-if="evaluation">
              <ul class="check-list">
                <li v-for="item in evaluation.suggestions" :key="item">
                  <el-icon><CircleCheck /></el-icon>
                  <span>{{ item }}</span>
                </li>
              </ul>
              <button class="secondary-action" type="button" @click="restartPractice">重新练习此题</button>
            </template>
            <div v-else class="empty-note">
              <el-icon><Collection /></el-icon>
              <p>建议会聚焦结构、论证、政策表达和语言规范。</p>
            </div>
          </section>
        </aside>
      </section>

      <section v-if="evaluation" class="report-detail">
        <article class="analysis-card surface-card">
          <div class="panel-title">
            <el-icon><EditPen /></el-icon>
            <span>您的回答分析</span>
          </div>
          <p>
            <mark>{{ answerPreview }}</mark>
          </p>
        </article>

        <article class="detail-card surface-card positive">
          <div class="panel-title">
            <el-icon><CircleCheck /></el-icon>
            <span>优点</span>
          </div>
          <ul>
            <li v-for="item in evaluation.advantages" :key="item">{{ item }}</li>
          </ul>
        </article>

        <article class="detail-card surface-card negative">
          <div class="panel-title">
            <el-icon><Warning /></el-icon>
            <span>缺点</span>
          </div>
          <ul>
            <li v-for="item in evaluation.disadvantages" :key="item">{{ item }}</li>
          </ul>
        </article>

        <article id="materials" class="materials-card surface-card">
          <div class="panel-title">
            <el-icon><Reading /></el-icon>
            <span>优质素材</span>
          </div>
          <div class="material-grid">
            <section v-for="item in evaluation.qualityMaterials" :key="item.title" class="material-item">
              <strong>{{ item.title }}</strong>
              <p>{{ item.content }}</p>
              <small>{{ item.usage }}</small>
            </section>
          </div>
        </article>

        <article class="sample-card surface-card">
          <div class="panel-title">
            <el-icon><MagicStick /></el-icon>
            <span>示范范文</span>
          </div>
          <p>{{ evaluation.sampleEssay }}</p>
        </article>
      </section>
    </div>
  </main>
</template>

<style scoped>
.policyquest-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #f4f7ff 46%, #ffffff 100%);
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

.mobile-app-bar {
  position: fixed;
  inset: 0 0 auto;
  z-index: 30;
  display: none;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(194, 198, 216, 0.6);
  background: rgba(248, 249, 255, 0.92);
  backdrop-filter: blur(16px);
}

.mobile-app-bar h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.icon-button {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 20px;
  background: transparent;
  color: #0b1c30;
}

.icon-button:hover {
  background: #eff4ff;
}

.desktop-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 28px;
  height: 76px;
  padding: 0 max(32px, calc((100vw - 1380px) / 2));
  border-bottom: 1px solid rgba(194, 198, 216, 0.5);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #0050cb;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font-size: 17px;
}

.brand small {
  margin-top: 2px;
  color: #424656;
  font-size: 12px;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.desktop-nav a {
  padding: 10px 14px;
  border-radius: 999px;
  color: #424656;
  font-size: 14px;
  text-decoration: none;
}

.desktop-nav a:hover {
  background: #eff4ff;
  color: #0050cb;
}

.user-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #c2c6d8;
  border-radius: 999px;
  background: #ffffff;
  color: #0b1c30;
  font-size: 14px;
}

.page-shell {
  width: min(1380px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 26px 0 64px;
}

.workspace-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 22px 24px;
  border: 1px solid #d7ddf0;
  border-radius: 16px;
  background: #ffffff;
}

.eyebrow {
  margin: 0 0 8px;
  color: #0050cb;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.workspace-head h2 {
  max-width: 760px;
  margin: 0;
  font-size: 28px;
  line-height: 1.24;
}

.head-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(84px, 1fr));
  gap: 10px;
}

.head-metrics span {
  display: grid;
  gap: 2px;
  min-width: 96px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #eff4ff;
  color: #424656;
  font-size: 13px;
}

.head-metrics strong {
  color: #006a61;
  font-size: 24px;
}

.practice-grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 390px;
  gap: 18px;
  align-items: start;
}

.surface-card {
  border: 1px solid #d7ddf0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(19, 42, 74, 0.06);
}

.library-panel,
.answer-panel,
.score-card,
.dimension-card,
.suggestion-card,
.analysis-card,
.detail-card,
.materials-card,
.sample-card {
  padding: 22px;
}

.library-panel,
.report-column {
  position: sticky;
  top: 96px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #0b1c30;
  font-size: 17px;
  font-weight: 800;
}

.panel-title .el-icon {
  color: #0050cb;
}

.segmented-block + .segmented-block,
.question-stack {
  margin-top: 22px;
}

.segmented-block p {
  margin: 0 0 10px;
  color: #424656;
  font-size: 13px;
  font-weight: 700;
}

.choice-row {
  display: grid;
  width: 100%;
  gap: 3px;
  padding: 13px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: #0b1c30;
  text-align: left;
}

.choice-row + .choice-row {
  margin-top: 8px;
}

.choice-row span {
  font-size: 15px;
  font-weight: 800;
}

.choice-row small {
  color: #777b8c;
  font-size: 12px;
}

.choice-row.active {
  border-color: #0050cb;
  background: #eff4ff;
}

.type-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 4px;
  border-radius: 12px;
  background: #eff4ff;
}

.type-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 42px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #424656;
  font-size: 14px;
  font-weight: 800;
}

.type-button.active {
  background: #0050cb;
  color: #ffffff;
}

.question-stack {
  display: grid;
  gap: 10px;
}

.question-item {
  padding: 14px;
  border: 1px solid #dfe5f6;
  border-radius: 12px;
  background: #ffffff;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.question-item:hover {
  transform: translateY(-1px);
  border-color: #8ca8e8;
}

.question-item.selected {
  border-color: #006a61;
  background: #ebfffc;
}

.question-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #777b8c;
  font-size: 12px;
  font-weight: 700;
}

.question-item h3 {
  margin: 10px 0 8px;
  font-size: 15px;
  line-height: 1.45;
}

.question-item p {
  margin: 0;
  color: #424656;
  font-size: 12px;
  line-height: 1.5;
}

.answer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.answer-head h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.25;
}

.soft-button,
.primary-action,
.secondary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 12px;
  font-weight: 800;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.soft-button {
  height: 42px;
  padding: 0 16px;
  background: #eff4ff;
  color: #0050cb;
}

.soft-button:hover,
.primary-action:hover,
.secondary-action:hover {
  transform: translateY(-1px);
}

.prompt-text {
  margin: 18px 0 0;
  padding: 16px;
  border-radius: 12px;
  background: #eff4ff;
  color: #253246;
  line-height: 1.8;
}

.requirement-list,
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.requirement-list {
  margin-top: 16px;
}

.tag-list {
  margin-top: 10px;
}

.requirement-list span,
.tag-list span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.requirement-list span {
  background: #e8fbf7;
  color: #006a61;
}

.tag-list span {
  background: #fff2f6;
  color: #b40036;
}

.answer-editor {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.answer-editor span {
  color: #0b1c30;
  font-size: 14px;
  font-weight: 800;
}

.answer-editor textarea {
  width: 100%;
  min-height: 420px;
  padding: 18px;
  resize: vertical;
  border: 1px solid #c2c6d8;
  border-radius: 16px;
  outline: none;
  background: #fbfcff;
  color: #0b1c30;
  font-size: 16px;
  line-height: 1.88;
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
  gap: 5px;
  color: #777b8c;
  font-size: 13px;
}

.count-line strong {
  color: #006a61;
  font-size: 22px;
}

.count-line em {
  margin-left: 8px;
  color: #b40036;
  font-style: normal;
  font-weight: 700;
}

.primary-action {
  min-width: 160px;
  height: 48px;
  padding: 0 20px;
  background: #0050cb;
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(0, 80, 203, 0.18);
}

.primary-action:disabled {
  cursor: wait;
  opacity: 0.72;
}

.report-column {
  display: grid;
  gap: 14px;
  scroll-margin-top: 86px;
}

.score-card {
  overflow: hidden;
}

.score-layout {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}

.score-ring {
  position: relative;
  width: 132px;
  height: 132px;
}

.score-ring svg {
  display: block;
  width: 132px;
  height: 132px;
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
  transition: stroke-dashoffset 0.4s ease;
}

.score-card.excellent .ring-value {
  stroke: #006a61;
}

.score-card.good .ring-value {
  stroke: #0050cb;
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
  font-size: 40px;
  line-height: 1;
}

.score-number span {
  margin-top: 6px;
  color: #777b8c;
  font-size: 12px;
  font-weight: 800;
}

.score-copy h2 {
  margin: 0 0 8px;
  font-size: 24px;
}

.score-copy p {
  margin: 0;
  color: #424656;
  font-size: 14px;
  line-height: 1.65;
}

.dimension-row + .dimension-row {
  margin-top: 14px;
}

.dimension-row > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #0b1c30;
  font-size: 14px;
}

.dimension-row > div:first-child span {
  color: #0050cb;
  font-weight: 800;
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

.dimension-row p {
  margin: 0;
  color: #777b8c;
  font-size: 13px;
  line-height: 1.55;
}

.check-list {
  display: grid;
  gap: 12px;
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

.secondary-action {
  width: 100%;
  height: 44px;
  margin-top: 16px;
  background: #86f2e4;
  color: #063f39;
}

.empty-note {
  display: grid;
  place-items: center;
  min-height: 144px;
  text-align: center;
  color: #777b8c;
}

.empty-note .el-icon {
  margin-bottom: 8px;
  color: #0050cb;
  font-size: 26px;
}

.empty-note p {
  max-width: 220px;
  margin: 0;
  line-height: 1.6;
}

.report-detail {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.analysis-card,
.detail-card {
  grid-column: span 2;
}

.analysis-card p {
  margin: 0;
  color: #424656;
  line-height: 1.8;
}

.analysis-card mark {
  padding: 2px 3px;
  border-radius: 4px;
  background: linear-gradient(transparent 58%, rgba(216, 41, 76, 0.18) 0);
  color: inherit;
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

.materials-card,
.sample-card {
  grid-column: span 6;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.material-item {
  padding: 16px;
  border: 1px solid #dfe5f6;
  border-radius: 12px;
  background: #fbfcff;
}

.material-item strong {
  color: #0b1c30;
  font-size: 16px;
}

.material-item p {
  margin: 10px 0;
  color: #424656;
  line-height: 1.7;
}

.material-item small {
  color: #0050cb;
  line-height: 1.6;
}

.sample-card p {
  margin: 0;
  color: #253246;
  font-size: 16px;
  line-height: 1.95;
}

@media (max-width: 1180px) {
  .desktop-topbar {
    display: none;
  }

  .mobile-app-bar {
    display: flex;
  }

  .page-shell {
    width: min(100% - 24px, 680px);
    padding-top: 92px;
  }

  .workspace-head {
    display: grid;
    padding: 20px;
    border-radius: 16px;
  }

  .workspace-head h2 {
    font-size: 22px;
  }

  .head-metrics {
    grid-template-columns: repeat(3, 1fr);
  }

  .practice-grid {
    grid-template-columns: 1fr;
  }

  .library-panel,
  .report-column {
    position: static;
  }

  .report-column {
    order: -1;
  }

  .answer-panel {
    order: 2;
  }

  .library-panel {
    order: 1;
  }

  .report-detail {
    grid-template-columns: 1fr;
  }

  .analysis-card,
  .detail-card,
  .materials-card,
  .sample-card {
    grid-column: auto;
  }

  .material-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .page-shell {
    width: 100%;
    padding: 88px 14px 36px;
  }

  .workspace-head {
    display: none;
  }

  .surface-card {
    border-radius: 16px;
  }

  .library-panel,
  .answer-panel,
  .score-card,
  .dimension-card,
  .suggestion-card,
  .analysis-card,
  .detail-card,
  .materials-card,
  .sample-card {
    padding: 18px;
  }

  .practice-grid,
  .report-column,
  .report-detail {
    gap: 14px;
  }

  .score-layout {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .score-ring,
  .score-ring svg {
    width: 154px;
    height: 154px;
  }

  .answer-head,
  .submit-row {
    align-items: stretch;
    flex-direction: column;
  }

  .answer-head h1 {
    font-size: 24px;
  }

  .answer-editor textarea {
    min-height: 330px;
    border-radius: 16px;
  }

  .primary-action {
    width: 100%;
  }

  .count-line {
    flex-wrap: wrap;
  }
}
</style>
