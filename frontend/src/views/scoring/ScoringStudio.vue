<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Bell,
  Calendar,
  CircleCheck,
  Collection,
  DocumentChecked,
  EditPen,
  Finished,
  Grid,
  House,
  MagicStick,
  Medal,
  Menu,
  Notebook,
  Reading,
  Refresh,
  Search,
  Setting,
  Star,
  Timer,
  TrendCharts,
  User,
  Warning,
} from '@element-plus/icons-vue'
import { scoringApi } from '../../api'
import { useUserStore } from '../../store/user'

type ViewKey = 'dashboard' | 'library' | 'growth' | 'practice' | 'report'
type PracticeType = 'essay' | 'interview'
type ExamType = 'national' | 'province' | 'institution'
type MobilePracticeTab = 'prompt' | 'materials' | 'answer'

interface QuestionMaterial {
  title: string
  content: string
}

interface Question {
  id: number
  exam: ExamType
  year: string
  type: PracticeType
  title: string
  source: string
  duration: string
  difficulty: string
  wordLimit: number
  prompt: string
  materials: QuestionMaterial[]
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
  governmentReportLinks: QualityMaterial[]
  sampleEssay: string
}

const navItems = [
  { key: 'dashboard', label: '工作台', icon: Grid },
  { key: 'library', label: '题库', icon: Reading },
  { key: 'growth', label: '成长报告', icon: TrendCharts },
  { key: 'practice', label: '智能练习', icon: EditPen },
] as const

const mobileNavItems = [
  { key: 'dashboard', label: '工作台', icon: Grid },
  { key: 'library', label: '题库', icon: Reading },
  { key: 'growth', label: '成长', icon: TrendCharts },
  { key: 'practice', label: '练习', icon: EditPen },
] as const

const trackCards = [
  { exam: 'national' as ExamType, title: '国家公务员考试', desc: '行测、申论系统训练', count: '12,400+ 题', tone: 'blue' },
  { exam: 'province' as ExamType, title: '地方公务员', desc: '各省联考真题', count: '8,900+ 题', tone: 'teal' },
  { exam: 'institution' as ExamType, title: '事业单位', desc: '综合应用能力', count: '5,200+ 题', tone: 'rose' },
]

const recentPractices = [
  { title: '2023年国考副省级行测', type: '言语理解', date: '昨天', accuracy: 78, tone: 'blue' },
  { title: '2022年联考资料分析', type: '资料分析', date: '本周', accuracy: 100, tone: 'teal' },
  { title: '模拟考：逻辑判断 A 组', type: '判断推理', date: '3天前', accuracy: 30, tone: 'rose' },
]

const commandMetrics = [
  { label: '预测分数', value: '78.6', delta: '+4.2 / 30天', tone: 'blue' },
  { label: '薄弱项', value: '政策逻辑', delta: '准确率 -12%', tone: 'danger' },
  { label: '今日强度', value: '45 分钟', delta: '1 套申论 + 复盘', tone: 'teal' },
]

const weakFocusCards = [
  { title: '政策逻辑', reason: '分论点能成立，但论据和政策表达衔接不足。', action: '复习 3 个政策表达模板' },
  { title: '论证充分性', reason: '材料转化偏少，容易出现“空泛正确”。', action: '补 1 组材料提炼训练' },
]

const growthInsights = [
  { title: '为什么关注政策逻辑', desc: '最近三次申论训练中，政策逻辑维度平均下降 12%，主要失分在“政策高度”和“执行抓手”。', action: '进入政策逻辑专项' },
  { title: '为什么建议限时写作', desc: '作答字数达标，但平均完成时间比目标多 14 分钟，需要训练开头定调和分论点展开速度。', action: '开始 45 分钟限时练习' },
]

const heatCells = [
  1, 2, 4, 0, 1, 4, 0, 2, 3, 2, 2, 3,
  0, 3, 4, 1, 2, 2, 2, 2, 1, 0, 3, 4,
  3, 4, 4, 4, 4, 3, 4, 1, 4, 3, 3, 4,
  2, 0, 0, 1, 2, 4, 1, 0, 2, 3, 4, 3,
  1, 2, 3, 0, 3, 4, 2, 0, 1, 3, 3, 3,
]

const achievementCards = [
  { icon: Finished, title: '连续打卡 7 天', desc: '持之以恒，终有所成。', tone: 'teal' },
  { icon: Medal, title: '排名前 10%', desc: '第 42 次模拟试卷', tone: 'muted' },
  { icon: Star, title: '逻辑大师', desc: '100% 准确率', tone: 'blue' },
]

const questions: Question[] = [
  {
    id: 1,
    exam: 'province',
    year: '2024',
    type: 'essay',
    title: '关于推进城市公共文化空间高质量发展的思考',
    source: '2024 省考 A 卷',
    duration: '120 分钟',
    difficulty: '困难',
    wordLimit: 1200,
    prompt: '结合给定资料，以“推进城市公共文化空间高质量发展”为主题，自拟题目，写一篇文章。',
    materials: [
      {
        title: '给定资料 1',
        content:
          '近年来，随着经济社会快速发展和人民生活水平不断提高，公众对高品质精神文化生活的需求日益增长。城市公共文化空间作为承载文化记忆、传承城市文脉、服务公众文化生活的重要载体，正在从单一阅读空间转向复合型公共服务场景。',
      },
      {
        title: '给定资料 2',
        content:
          '某市在老旧小区改造中，创新性地引入“微空间”概念，将废弃锅炉房、边角空地改造为集阅读、休闲、交流于一体的社区文化客厅，吸引居民参与空间治理和活动策划。',
      },
      {
        title: '给定资料 3',
        content:
          '调研发现，部分公共文化空间仍存在供给同质化、运营缺乏持续性、数字化服务不足等问题。专家建议，应以群众需求为导向，推动公共文化服务从“有没有”向“好不好”转变。',
      },
    ],
    requirements: ['立意明确，观点正确', '思路清晰，语言流畅', '字数 1000-1200 字'],
    tags: ['申论写作', '公共文化', '民生服务'],
  },
  {
    id: 2,
    exam: 'national',
    year: '2025',
    type: 'essay',
    title: '数字经济在乡村振兴中的作用',
    source: '2025 国考申论预测',
    duration: '110 分钟',
    difficulty: '困难',
    wordLimit: 1000,
    prompt: '请结合给定资料，围绕“数字经济赋能乡村振兴”这一主题，谈谈当前面临的挑战并提出对策建议。',
    materials: [
      {
        title: '给定资料 1',
        content:
          'A 村通过建设电商平台和直播基地，推动山茶油、有机蜂蜜等农产品销量增长。但村里老年农户数字素养不足，参与度仍然不高。',
      },
      {
        title: '给定资料 2',
        content:
          'B 县开展智慧农业试点，利用物联网传感器和无人机技术降低用水与施肥成本，但初期投入较高，单个农户难以独立承担。',
      },
      {
        title: '给定资料 3',
        content:
          '专家指出，数字经济不应只是卖货工具，更应重塑乡村治理与公共服务，远程医疗、远程教育等仍是农村数字化建设中的短板。',
      },
    ],
    requirements: ['字数 800-1000 字', '条理清晰，逻辑严密', '对策具有针对性和可行性', '符合公务员公文写作规范'],
    tags: ['数字经济', '乡村振兴', '资料分析'],
  },
  {
    id: 3,
    exam: 'national',
    year: '2024',
    type: 'essay',
    title: '深化公职服务改革',
    source: '2024 国考副省级申论',
    duration: '120 分钟',
    difficulty: '中等',
    wordLimit: 1000,
    prompt: '围绕“深化公职服务改革”，结合材料谈谈如何提升公共服务效能与群众满意度。',
    materials: [
      {
        title: '给定资料 1',
        content:
          '某地政务大厅推行一窗受理、集成服务后，平均办理时间明显缩短，但部分群众反映线上平台入口过多、办事指引不够清晰。',
      },
      {
        title: '给定资料 2',
        content:
          '基层干部表示，改革既要减少重复填报和多头留痕，也要保留必要过程记录，方便责任追溯和经验复盘。',
      },
    ],
    requirements: ['观点明确', '结合材料', '论证充分', '建议 900-1000 字'],
    tags: ['公共服务', '基层减负', '数字政府'],
  },
  {
    id: 4,
    exam: 'province',
    year: '2024',
    type: 'interview',
    title: '基层减负与工作留痕如何平衡',
    source: '2024 省考结构化面试',
    duration: '3 分钟',
    difficulty: '困难',
    wordLimit: 500,
    prompt:
      '有干部认为基层减负后工作留痕少了，担心责任说不清；也有人认为留痕过多会影响干事效率。请谈谈你的看法。',
    materials: [
      {
        title: '背景材料',
        content:
          '基层治理中，台账多、报表多、重复检查等现象一度影响干部抓落实。推进基层减负，关键不是不要管理，而是提升管理质效。',
      },
    ],
    requirements: ['观点辩证', '身份意识明确', '提出制度化建议', '表达自然流畅'],
    tags: ['结构化面试', '基层治理', '综合分析'],
  },
]

const sampleEssayAnswer =
  '城市公共文化空间高质量发展，既是公共文化服务体系完善的重要内容，也是提升城市治理温度的现实路径。首先，要坚持需求导向，让空间更贴近群众。公共文化空间不能只追求硬件美观，更要围绕居民阅读、交流、学习、休闲等真实需求优化功能布局。其次，要坚持共建共享，让空间更具有生命力。通过社区议事、志愿服务、社会组织参与等方式，把群众从使用者转变为空间治理的参与者。再次，要坚持数字赋能，让服务更精准高效。依托线上预约、活动发布、资源推荐等功能，提升公共文化供给与群众需求的匹配度。总之，公共文化空间一头连着城市品质，一头连着群众生活。只有把服务做到群众身边、把文化融入日常生活，才能不断增强人民群众的文化获得感和城市归属感。'

const sampleInterviewAnswer =
  '各位考官，我认为基层减负和必要留痕并不矛盾，关键在于把握“减无效负担、留关键记录”的原则。首先，要明确留痕边界。对于重复报表、形式主义截图、层层转发记录，应坚决压减；对于决策依据、群众诉求办理、风险隐患处置等关键环节，应规范留存。其次，要优化留痕方式。通过统一平台、一次采集、多方共享，减少基层重复填报，让数据多跑路、干部少折腾。再次，要完善评价机制。不能简单以材料厚薄衡量工作成效，而要看群众满意度、问题解决率和治理实效。总之，基层减负不是放松责任，而是让干部从无效事务中解放出来，把更多精力用在服务群众和抓落实上。'

const activeView = ref<ViewKey>('dashboard')
const activeMobilePracticeTab = ref<MobilePracticeTab>('prompt')
const selectedQuestionId = ref(1)
const answer = ref('')
const loading = ref(false)
const errorMessage = ref('')
const evaluation = ref<Evaluation | null>(null)
const dashboardSearch = ref('')
const scoreCircumference = 301.59
const router = useRouter()
const userStore = useUserStore()

const selectedQuestion = computed(() => questions.find(item => item.id === selectedQuestionId.value) || questions[0])
const currentUserName = computed(() => userStore.user?.nickname || userStore.user?.username || '同学')
const wordCount = computed(() => answer.value.trim().replace(/\s/g, '').length)
const targetWordLimit = computed(() => selectedQuestion.value.wordLimit)
const progressPercent = computed(() => Math.min(100, Math.round((wordCount.value / targetWordLimit.value) * 100)))
const reportReady = computed(() => Boolean(evaluation.value))
const scoreRingStyle = computed(() => {
  const score = evaluation.value?.score ?? 0
  return {
    strokeDasharray: `${scoreCircumference}`,
    strokeDashoffset: `${scoreCircumference - (score / 100) * scoreCircumference}`,
  }
})

const scoreTone = computed(() => {
  const score = evaluation.value?.score ?? 0
  if (score >= 88) return 'excellent'
  if (score >= 78) return 'good'
  if (score >= 65) return 'normal'
  return 'weak'
})

const groupedLibrary = computed(() => [
  questions.find(item => item.id === 3),
  questions.find(item => item.id === 1),
  questions.find(item => item.id === 4),
].filter(Boolean) as Question[])

function goView(view: ViewKey) {
  activeView.value = view
  if (view === 'practice') activeMobilePracticeTab.value = 'prompt'
}

function startQuestion(question: Question) {
  selectedQuestionId.value = question.id
  errorMessage.value = ''
  activeMobilePracticeTab.value = 'prompt'
  activeView.value = 'practice'
}

function logout() {
  userStore.logout()
  router.push('/login')
}

function useTemplate() {
  answer.value = selectedQuestion.value.type === 'interview' ? sampleInterviewAnswer : sampleEssayAnswer
  errorMessage.value = ''
}

function saveDraft() {
  sessionStorage.setItem(`policyquest_draft_${selectedQuestion.value.id}`, answer.value)
  errorMessage.value = '草稿已保存在本机浏览器。'
}

function resetPractice() {
  answer.value = ''
  errorMessage.value = ''
  evaluation.value = null
  activeView.value = 'practice'
}

function clampScore(value: number, min = 0, max = 100) {
  if (Number.isNaN(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

function scoreStyle(score: number) {
  return { width: `${clampScore(score)}%` }
}

function inferScore() {
  const text = answer.value.trim()
  const target = selectedQuestion.value.type === 'interview' ? 360 : 900
  const lengthScore = Math.min(wordCount.value / target, 1) * 18
  const structureHits = ['第一', '第二', '第三', '首先', '其次', '再次', '最后', '一方面', '另一方面', '总之', '因此']
    .filter(word => text.includes(word)).length
  const policyHits = ['以人民为中心', '高质量发展', '数字政府', '新质生产力', '民生', '公共服务', '基层治理', '减负']
    .filter(word => text.includes(word)).length
  const actionHits = ['机制', '清单', '平台', '监督', '培训', '落实', '闭环', '考核', '反馈', '优化']
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
      '你的回答逻辑基础较稳，能够回应题目主要矛盾，但在政策细节、材料转化和论证力度上仍有提升空间。',
    dimensions: isInterview
      ? [
          { name: '审题准确', score: clampScore(score + 5), comment: '能抓住题中“减负”和“留痕”的关系，没有简单站队。' },
          { name: '逻辑层次', score: clampScore(score), comment: '有基本分层，但每层之间的递进关系还可以更明显。' },
          { name: '机关表达', score: clampScore(score - 3), comment: '已有规范表达，建议增加“清单化、闭环化、数字化”等工作语言。' },
          { name: '处置可行', score: clampScore(score + 1), comment: '建议方向正确，仍需明确责任主体和执行抓手。' },
        ]
      : [
          { name: '政策逻辑', score: clampScore(score + 4), comment: '能够围绕公共服务和高质量发展展开，立意比较稳。' },
          { name: '语言表达', score: clampScore(score + 1), comment: '表述较通顺，但部分句子略口语化，可进一步压缩。' },
          { name: '论据充分性', score: clampScore(score - 8), comment: '材料和政府工作报告中的政策表述引用不足，说服力还可以增强。' },
          { name: '对策可行性', score: clampScore(score - 2), comment: '对策方向明确，但执行主体、机制和评价标准不够细。' },
        ],
    advantages: [
      '能够直接回应题目主题，作答没有偏离材料主线。',
      '段落之间有明显分层，阅卷者可以较快识别答题框架。',
      '已经具备问题导向和对策意识，不是单纯空泛表态。',
    ],
    disadvantages: [
      '政策引用还偏少，缺少与政府工作报告中“发展新质生产力、保障和改善民生、提升治理效能”等表述的自然衔接。',
      '部分对策还停留在原则层面，没有讲清由谁做、怎么做、做到什么程度。',
      isInterview ? '身份代入和现场感略弱，结尾可以更有服务群众的温度。' : '分论点之间的递进关系不够清晰，结尾升华力度不足。',
    ],
    suggestions: [
      '开头先给出明确判断，再用三到四个分论点承接材料问题。',
      '每条对策写成“主体 + 动作 + 机制 + 效果”的句式。',
      '结合政府工作报告中关于高质量发展、民生保障、数字政府、基层治理的表述，提高答案的政策高度。',
      '结尾回扣人民群众获得感、治理效能或干部担当，形成完整收束。',
    ],
    qualityMaterials: [
      {
        title: '以人民为中心',
        content: '把群众满意不满意作为检验公共服务成效的重要标准，让改革成果更多更公平惠及人民群众。',
        usage: '适用于公共服务、民生保障、基层治理类题目。',
      },
      {
        title: '闭环治理',
        content: '建立问题收集、分类交办、限时整改、结果反馈、跟踪问效的闭环机制。',
        usage: '适用于窗口服务、基层治理、应急处置类题目。',
      },
    ],
    governmentReportLinks: [
      {
        title: '高质量发展',
        content: '可将“推动高质量发展”转化为公共服务领域的供给升级、效率提升和公平可及。',
        usage: '用于文章总论点或分论点开头，提升政策高度。',
      },
      {
        title: '保障和改善民生',
        content: '把文化、教育、医疗、养老等公共服务写成增进民生福祉的具体路径。',
        usage: '用于公共文化、政务服务、乡村振兴等材料题。',
      },
      {
        title: '数字政府建设',
        content: '强调数据共享、流程再造、线上线下协同，避免数字化变成新的基层负担。',
        usage: '用于数字经济、基层减负、营商环境类题目。',
      },
    ],
    sampleEssay:
      selectedQuestion.value.type === 'interview'
        ? sampleInterviewAnswer
        : '以高质量公共文化空间涵养城市温度。公共文化空间一端连接城市发展品质，一端连接人民群众精神文化生活。推进其高质量发展，必须坚持以人民为中心，把政府工作报告中关于保障和改善民生、完善公共服务、推动高质量发展的要求转化为可感可及的治理实践。首先，要以需求牵引供给升级。公共文化空间不能只停留在建馆舍、摆书架，而要围绕群众阅读、学习、交流、亲子活动等多元需求，推动功能复合和服务精准。其次，要以共建共享激活空间活力。通过居民议事、志愿服务、社会组织运营等方式，让群众参与空间设计、活动策划和日常维护，形成人人参与、人人享有的治理格局。再次，要以数字赋能提升服务效能。依托线上预约、资源推荐、活动发布和数据分析，推动公共文化资源均衡配置，同时保留线下兜底服务，照顾老年人等群体需求。总之，公共文化空间的价值不只在建筑本身，更在于它能否回应群众期待、承载城市记忆、滋养公共生活。只有让文化服务嵌入日常、走近群众，城市发展才更有品质，也更有温度。',
  }
}

function normalizeEvaluation(raw: any): Evaluation {
  const fallback = localEvaluation()
  const dimensions = Array.isArray(raw?.dimensions) ? raw.dimensions : fallback.dimensions
  const materials = Array.isArray(raw?.qualityMaterials) ? raw.qualityMaterials : fallback.qualityMaterials
  const reportLinks = Array.isArray(raw?.governmentReportLinks)
    ? raw.governmentReportLinks
    : Array.isArray(raw?.governmentReportConnections)
      ? raw.governmentReportConnections
      : fallback.governmentReportLinks

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
    governmentReportLinks: reportLinks.map((item: any, index: number) => ({
      title: String(item?.title || fallback.governmentReportLinks[index]?.title || '政府工作报告要点'),
      content: String(item?.content || fallback.governmentReportLinks[index]?.content || ''),
      usage: String(item?.usage || fallback.governmentReportLinks[index]?.usage || ''),
    })),
    sampleEssay: String(raw?.sampleEssay || raw?.modelEssay || fallback.sampleEssay),
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
    errorMessage.value = res?.message || ''
  } catch {
    evaluation.value = localEvaluation()
    errorMessage.value = 'AI 服务暂未连接，已生成本地示例评估报告。'
  } finally {
    loading.value = false
    activeView.value = 'report'
  }
}
</script>

<template>
  <main class="pq-app">
    <aside class="desktop-sidebar">
      <a class="brand" href="#/">
        <span class="brand-mark">PQ</span>
        <span>
          <strong>PolicyQuest</strong>
          <small>精英备考</small>
        </span>
      </a>

      <nav class="side-nav" aria-label="主导航">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="side-link"
          :class="{ active: activeView === item.key }"
          type="button"
          @click="goView(item.key)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <button class="mock-button" type="button" @click="startQuestion(questions[0])">开始今日训练</button>

      <footer class="side-footer">
        <button type="button"><el-icon><CircleCheck /></el-icon><span>帮助与支持</span></button>
        <button type="button"><el-icon><Warning /></el-icon><span>隐私条款</span></button>
      </footer>
    </aside>

    <section class="app-shell">
      <header class="topbar">
        <button class="icon-button mobile-only" type="button" aria-label="打开菜单">
          <el-icon><Menu /></el-icon>
        </button>
        <div class="top-tabs">
          <button :class="{ active: activeView === 'dashboard' }" type="button" @click="goView('dashboard')">工作台</button>
          <button :class="{ active: activeView === 'library' }" type="button" @click="goView('library')">题库</button>
          <button :class="{ active: activeView === 'growth' }" type="button" @click="goView('growth')">成长报告</button>
        </div>
        <strong class="mobile-title">PolicyQuest</strong>
        <div class="top-actions">
          <button class="icon-button" type="button" aria-label="通知"><el-icon><Bell /></el-icon></button>
          <button class="icon-button" type="button" aria-label="设置"><el-icon><Setting /></el-icon></button>
          <button class="avatar-button" type="button" :aria-label="`退出 ${currentUserName} 的账号`" @click="logout"><el-icon><User /></el-icon></button>
        </div>
      </header>

      <template v-if="activeView === 'dashboard'">
        <section class="dashboard-view">
          <section class="hero-card">
            <div class="hero-command-copy">
              <span class="ai-kicker">AI 学习指挥舱</span>
              <h1>{{ currentUserName }}，今天先补政策逻辑，再完成一套申论模拟</h1>
              <p>系统根据最近训练记录判断：你的作答结构稳定，但政策表达和材料转化正在拖慢提分效率。</p>
              <div class="hero-command-actions">
                <button class="primary-button" type="button" @click="startQuestion(selectedQuestion)">开始今日训练</button>
                <button class="soft-button" type="button" @click="goView('growth')">查看提分原因</button>
              </div>
            </div>
            <div class="command-panel">
              <article v-for="item in commandMetrics" :key="item.label" :class="item.tone">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
                <small>{{ item.delta }}</small>
              </article>
            </div>
          </section>

          <section class="search-strip">
            <label class="search-box">
              <el-icon><Search /></el-icon>
              <input v-model="dashboardSearch" type="search" placeholder="搜索试卷、考点或关键词..." />
              <button type="button" @click="goView('library')">搜索</button>
            </label>
            <div class="ai-signal">
              <strong>今日薄弱项</strong>
              <span>政策逻辑 · 论据充分性 · 限时表达</span>
            </div>
          </section>

          <section class="section-block">
            <div class="section-heading">
              <div>
                <h2>目标赛道</h2>
                <p>选择训练方向，AI 会把题目、评分和复盘串成一条提分路径。</p>
              </div>
            </div>
            <div class="track-grid">
              <button
                v-for="item in trackCards"
                :key="item.exam"
                class="track-card"
                :class="item.tone"
                type="button"
                @click="startQuestion(questions.find(q => q.exam === item.exam) || questions[0])"
              >
                <span class="track-icon"><el-icon><House /></el-icon></span>
                <strong>{{ item.title }}</strong>
                <small>{{ item.desc }}</small>
                <em>{{ item.count }}</em>
              </button>
            </div>
          </section>

          <section class="dashboard-grid">
            <article class="card recent-card">
              <div class="card-head">
                <h2>最近练习</h2>
                <button type="button" @click="goView('library')">查看全部</button>
              </div>
              <div class="recent-list">
                <div v-for="item in recentPractices" :key="item.title" class="recent-row">
                  <div>
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.type }} · {{ item.date }}</span>
                  </div>
                  <em>{{ item.accuracy }}%</em>
                  <div class="progress-track">
                    <i :class="item.tone" :style="{ width: `${item.accuracy}%` }"></i>
                  </div>
                </div>
              </div>
            </article>

            <aside class="card growth-card">
              <h2><el-icon><TrendCharts /></el-icon>成长数据</h2>
              <div class="growth-metric">
                <span>累计刷题数</span>
                <strong>3,492</strong>
              </div>
              <div class="growth-metric soft">
                <span>AI 预测分数趋势</span>
                <strong>+4.2 分</strong>
              </div>
              <button class="inline-action" type="button" @click="goView('growth')">查看为什么</button>
            </aside>
          </section>

          <section class="weak-focus-grid">
            <article v-for="item in weakFocusCards" :key="item.title" class="weak-focus-card">
              <span>AI 诊断</span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.reason }}</p>
              <button type="button" @click="goView('growth')">{{ item.action }}</button>
            </article>
          </section>
        </section>
      </template>

      <template v-else-if="activeView === 'library'">
        <section class="library-view">
          <div class="page-title-row">
            <div>
              <h1>题库</h1>
              <p>精选历年真题与高质量模拟卷。</p>
            </div>
            <div class="filter-row">
              <button type="button">全部地区</button>
              <button type="button">2024年</button>
              <button type="button">行测</button>
            </div>
          </div>

          <section class="mobile-growth-summary">
            <h2>学习成长</h2>
            <p>你的努力都在这里</p>
            <article class="card heat-card compact">
              <h3>学习热力图（本月）</h3>
              <div class="heat-grid compact-grid">
                <span v-for="(cell, index) in heatCells.slice(0, 14)" :key="index" :class="`level-${cell}`"></span>
              </div>
            </article>
          </section>

          <div class="topic-card-list">
            <article v-for="item in groupedLibrary" :key="item.id" class="topic-card">
              <div class="topic-top">
                <span>{{ item.year }}</span>
                <button type="button" aria-label="收藏"><el-icon><Star /></el-icon></button>
              </div>
              <h2>{{ item.title }}</h2>
              <p>{{ item.source }}</p>
              <div class="tag-row">
                <span>{{ item.type === 'essay' ? '申论' : '面试' }}</span>
                <span>笔试</span>
                <span><el-icon><Timer /></el-icon>{{ item.duration }}</span>
              </div>
              <footer>
                <span v-if="item.id === 4" class="done">已完成</span>
                <button type="button" @click="startQuestion(item)">{{ item.id === 4 ? '查看解析' : '开始练习' }}</button>
              </footer>
            </article>
          </div>
        </section>
      </template>

      <template v-else-if="activeView === 'growth'">
        <section class="growth-view">
          <div class="page-title-row">
            <div>
              <h1>成长报告</h1>
              <p>不只看数据，也解释为什么掉分，以及下一步怎么练。</p>
            </div>
            <button class="date-button" type="button"><el-icon><Calendar /></el-icon>最近30天</button>
          </div>

          <section class="growth-explain-strip">
            <article v-for="item in growthInsights" :key="item.title">
              <span>AI 原因解释</span>
              <h2>{{ item.title }}</h2>
              <p>{{ item.desc }}</p>
              <button type="button" @click="startQuestion(selectedQuestion)">{{ item.action }}</button>
            </article>
          </section>

          <div class="growth-top-grid">
            <article class="card heat-card">
              <div class="card-head">
                <h2>学习状态热力图</h2>
                <span>超过 15% 的用户</span>
              </div>
              <div class="heat-grid">
                <span v-for="(cell, index) in heatCells" :key="index" :class="`level-${cell}`"></span>
              </div>
              <div class="heat-legend"><span>较少</span><i></i><i></i><i></i><i></i><span>较多</span></div>
            </article>

            <aside class="attention-card">
              <h2><el-icon><Warning /></el-icon>急需关注</h2>
              <div class="attention-item">
                <strong>政策逻辑</strong>
                <p>最近三次模拟考试中，该项准确率下降了 12%。原因是分论点能写出，但“政策依据 + 执行抓手”不足。</p>
                <button type="button" @click="startQuestion(questions[0])">复习相关考点</button>
              </div>
              <div class="attention-item">
                <strong>数量关系</strong>
                <p>每道题平均耗时超出目标设定 45 秒。建议先做限时训练，减少开头和分论点犹豫。</p>
                <button type="button" @click="startQuestion(questions[3])">开始限时练习</button>
              </div>
            </aside>
          </div>

          <section class="card achievements-card">
            <h2>最近成就</h2>
            <div class="achievement-grid">
              <article v-for="item in achievementCards" :key="item.title" :class="item.tone">
                <span><el-icon><component :is="item.icon" /></el-icon></span>
                <strong>{{ item.title }}</strong>
                <small>{{ item.desc }}</small>
              </article>
            </div>
          </section>

          <section class="library-mini">
            <div class="section-heading">
              <div>
                <h2>精选题库</h2>
                <p>收录历年真题与高质量模拟卷。</p>
              </div>
              <div class="filter-row">
                <button type="button">全部地区</button>
                <button type="button">全部年份</button>
                <button type="button">全部题型</button>
              </div>
            </div>
            <div class="topic-card-list small">
              <article v-for="item in groupedLibrary" :key="item.id" class="topic-card">
                <div class="topic-top"><span>{{ item.year }}</span><button type="button"><el-icon><Star /></el-icon></button></div>
                <h2>{{ item.title }}</h2>
                <p>{{ item.source }}</p>
                <footer><span>1.25万次练习</span><button type="button" @click="startQuestion(item)">开始练习</button></footer>
              </article>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="activeView === 'practice'">
        <section class="practice-view">
          <header class="practice-header">
            <button class="back-button" type="button" @click="goView('library')"><el-icon><ArrowLeft /></el-icon></button>
            <strong>申论练习</strong>
            <span class="timer-pill"><el-icon><Timer /></el-icon>119:50</span>
          </header>

          <div class="mobile-practice-tabs" aria-label="移动端练习分段">
            <button
              type="button"
              :class="{ active: activeMobilePracticeTab === 'prompt' }"
              @click="activeMobilePracticeTab = 'prompt'"
            >
              题目
            </button>
            <button
              type="button"
              :class="{ active: activeMobilePracticeTab === 'materials' }"
              @click="activeMobilePracticeTab = 'materials'"
            >
              材料
            </button>
            <button
              type="button"
              :class="{ active: activeMobilePracticeTab === 'answer' }"
              @click="activeMobilePracticeTab = 'answer'"
            >
              作答
            </button>
          </div>

          <div class="practice-layout">
            <section class="materials-panel">
              <div class="prompt-section" :class="{ 'mobile-hidden': activeMobilePracticeTab !== 'prompt' }">
                <div class="practice-meta">
                  <span>{{ selectedQuestion.year }} {{ selectedQuestion.source }}</span>
                  <span class="danger">难度：{{ selectedQuestion.difficulty }}</span>
                </div>
                <h1>{{ selectedQuestion.title }}</h1>
                <div class="requirement-card">
                  <strong>问题：</strong>
                  <span>{{ selectedQuestion.prompt }}</span>
                  <ul>
                    <li v-for="item in selectedQuestion.requirements" :key="item">{{ item }}</li>
                  </ul>
                </div>
              </div>

              <div class="materials-section" :class="{ 'mobile-hidden': activeMobilePracticeTab !== 'materials' }">
                <h3>背景材料</h3>
                <article v-for="material in selectedQuestion.materials" :key="material.title" class="material-card">
                  <div><el-icon><DocumentChecked /></el-icon><strong>{{ material.title }}</strong></div>
                  <p>{{ material.content }}</p>
                  <button type="button" @click="activeMobilePracticeTab = 'answer'">读完去作答</button>
                </article>
              </div>
            </section>

            <section class="editor-panel" :class="{ 'mobile-hidden': activeMobilePracticeTab !== 'answer' }">
              <div class="editor-toolbar">
                <button type="button">B</button>
                <button type="button"><el-icon><Notebook /></el-icon></button>
                <button type="button"><el-icon><Finished /></el-icon></button>
                <button type="button" aria-label="插入示范" @click="useTemplate"><el-icon><Refresh /></el-icon></button>
                <span><el-icon><Timer /></el-icon>42:54</span>
              </div>

              <label class="answer-area">
                <span>我的作答 <em>{{ wordCount }} / {{ targetWordLimit }} 字</em></span>
                <textarea v-model="answer" placeholder="在此输入您的文章内容..." />
              </label>

              <div class="word-progress"><i :style="{ width: `${progressPercent}%` }"></i></div>

              <footer class="editor-actions">
                <button class="soft-button" type="button" @click="saveDraft">
                  <el-icon><DocumentChecked /></el-icon>保存草稿
                </button>
                <button class="primary-button" type="button" :disabled="loading" @click="evaluate">
                  <el-icon><MagicStick /></el-icon>{{ loading ? 'AI 正在评阅...' : 'AI 智能批改' }}
                </button>
              </footer>
              <p v-if="errorMessage" class="form-message">{{ errorMessage }}</p>
            </section>
          </div>
        </section>
      </template>

      <template v-else>
        <section class="report-view">
          <header class="report-header">
            <div>
              <span class="status-pill">{{ reportReady ? '评阅已完成' : '等待评阅' }}</span>
              <h1>深度评阅：{{ selectedQuestion.title }}</h1>
              <p>提交日期：2026年6月12日</p>
            </div>
            <div>
              <button class="soft-button" type="button" @click="goView('dashboard')"><el-icon><ArrowLeft /></el-icon>返回工作台</button>
              <button class="primary-button" type="button" @click="resetPractice"><el-icon><Refresh /></el-icon>根据建议重练</button>
            </div>
          </header>

          <section v-if="!evaluation" class="empty-report card">
            <h2>还没有评估报告</h2>
            <p>请先完成一次作答并点击 AI 智能批改。</p>
            <button class="primary-button" type="button" @click="goView('practice')">去作答</button>
          </section>

          <template v-else>
            <div class="report-summary-grid">
              <article class="score-card card" :class="scoreTone">
                <h2>综合得分</h2>
                <div class="score-ring">
                  <svg viewBox="0 0 120 120" role="img" aria-label="综合得分">
                    <circle class="ring-track" cx="60" cy="60" r="48" />
                    <circle class="ring-value" cx="60" cy="60" r="48" :style="scoreRingStyle" />
                  </svg>
                  <div><strong>{{ evaluation.score }}</strong><span>/ 100</span></div>
                </div>
                <p>{{ evaluation.summary }}</p>
              </article>

              <article class="dimension-card card">
                <h2>维度分析</h2>
                <div v-for="item in evaluation.dimensions" :key="item.name" class="dimension-row">
                  <div><strong>{{ item.name }}</strong><span>{{ item.score }}%</span></div>
                  <div class="progress-track"><i :style="scoreStyle(item.score)"></i></div>
                  <p>{{ item.comment }}</p>
                </div>
              </article>
            </div>

            <div class="analysis-grid">
              <article class="card answer-card">
                <h2><el-icon><DocumentChecked /></el-icon>您的作答</h2>
                <p>{{ answer || '暂无作答内容。' }}</p>
              </article>

              <article class="card advice-card">
                <h2><el-icon><MagicStick /></el-icon>AI 优化建议</h2>
                <div class="advice-block danger">
                  <strong>缺点</strong>
                  <p v-for="item in evaluation.disadvantages" :key="item">{{ item }}</p>
                </div>
                <div class="advice-block success">
                  <strong>优点</strong>
                  <p v-for="item in evaluation.advantages" :key="item">{{ item }}</p>
                </div>
              </article>
            </div>

            <section class="detail-report-grid">
              <article class="detail-card card">
                <h2><el-icon><CircleCheck /></el-icon>具体改进建议</h2>
                <ul>
                  <li v-for="item in evaluation.suggestions" :key="item">{{ item }}</li>
                </ul>
              </article>

              <article class="detail-card card">
                <h2><el-icon><Collection /></el-icon>结合政府工作报告</h2>
                <div v-for="item in evaluation.governmentReportLinks" :key="item.title" class="material-mini">
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.content }}</p>
                  <small>{{ item.usage }}</small>
                </div>
              </article>

              <article class="detail-card card sample-card">
                <h2><el-icon><Reading /></el-icon>参考范文</h2>
                <p>{{ evaluation.sampleEssay }}</p>
              </article>
            </section>
          </template>
        </section>
      </template>
    </section>

    <nav class="mobile-bottom-nav" aria-label="移动端导航">
      <button
        v-for="item in mobileNavItems"
        :key="item.key"
        class="mobile-nav-button"
        :class="{ active: activeView === item.key }"
        type="button"
        @click="goView(item.key)"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </button>
    </nav>
  </main>
</template>

<style scoped>
.pq-app {
  min-height: 100vh;
  background: #f8f9ff;
  color: #0b1c30;
  font-family: Inter, "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif;
  letter-spacing: 0;
}

button,
input,
textarea {
  font: inherit;
  letter-spacing: 0;
}

button {
  cursor: pointer;
}

.desktop-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  width: 252px;
  padding: 32px 20px;
  border-right: 1px solid #e1e7f6;
  background: #ffffff;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: #0b66ff;
  color: #ffffff;
  font-weight: 900;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  color: #0758d8;
  font-size: 18px;
}

.brand small {
  margin-top: 3px;
  color: #33425c;
  font-size: 12px;
  font-weight: 700;
}

.side-nav {
  display: grid;
  gap: 14px;
  margin-top: 58px;
}

.side-link {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 0 18px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #253246;
  font-size: 14px;
  font-weight: 800;
}

.side-link.active,
.side-link:hover {
  background: #0b66ff;
  color: #ffffff;
}

.mock-button {
  min-height: 48px;
  margin: auto 8px 38px;
  border: 0;
  border-radius: 8px;
  background: #0758d8;
  color: #ffffff;
  font-weight: 900;
}

.side-footer {
  display: grid;
  gap: 20px;
  padding: 22px 16px 0;
  border-top: 1px solid #edf1f8;
}

.side-footer button {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: #33425c;
  font-size: 13px;
  font-weight: 700;
}

.app-shell {
  min-height: 100vh;
  margin-left: 252px;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  height: 80px;
  padding: 0 40px;
  border-bottom: 1px solid #e1e7f6;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.top-tabs {
  display: flex;
  align-items: center;
  gap: 34px;
}

.top-tabs button {
  position: relative;
  min-height: 44px;
  border: 0;
  background: transparent;
  color: #4b5568;
  font-size: 14px;
  font-weight: 900;
}

.top-tabs button.active {
  color: #0758d8;
}

.top-tabs button.active::after {
  position: absolute;
  right: 8px;
  bottom: 4px;
  left: 8px;
  height: 3px;
  border-radius: 999px;
  background: #0b66ff;
  content: "";
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 18px;
}

.icon-button,
.avatar-button,
.back-button {
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: #4b5568;
}

.icon-button {
  width: 36px;
  height: 36px;
  font-size: 20px;
}

.avatar-button {
  width: 42px;
  height: 42px;
  border: 3px solid #dbeafe;
  border-radius: 999px;
  background: #d8f3ef;
  color: #0a6b63;
}

.mobile-only,
.mobile-title,
.mobile-bottom-nav,
.mobile-growth-summary {
  display: none;
}

.dashboard-view,
.library-view,
.growth-view,
.practice-view,
.report-view {
  width: min(1120px, calc(100vw - 320px));
  margin: 0 auto;
  padding: 38px 0 64px;
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(280px, 0.82fr);
  align-items: stretch;
  gap: 28px;
  min-height: 292px;
  padding: 34px;
  border: 1px solid #dfe6f5;
  border-radius: 20px;
  background:
    linear-gradient(90deg, rgba(0, 213, 255, 0.08) 1px, transparent 1px),
    linear-gradient(135deg, #f8faff, #eef5ff 58%, #e8fbff);
  background-size: 42px 42px, auto;
  box-shadow: 0 20px 52px rgba(19, 42, 74, 0.08);
}

.hero-command-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.ai-kicker {
  display: inline-flex;
  width: fit-content;
  min-height: 30px;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(0, 184, 217, 0.14);
  color: #00758a;
  font-size: 12px;
  font-weight: 900;
}

.hero-command-copy h1 {
  margin: 14px 0 0;
  max-width: 680px;
  color: #07182f;
  font-size: 38px;
  line-height: 1.18;
}

.hero-command-copy p {
  max-width: 640px;
  margin: 16px 0 0;
  color: #526071;
  font-size: 16px;
  line-height: 1.75;
}

.hero-command-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.command-panel {
  display: grid;
  gap: 12px;
}

.command-panel article {
  display: grid;
  gap: 6px;
  padding: 18px;
  border: 1px solid rgba(207, 216, 234, 0.86);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 12px 30px rgba(7, 88, 216, 0.07);
}

.command-panel span {
  color: #586474;
  font-size: 12px;
  font-weight: 900;
}

.command-panel strong {
  color: #0758d8;
  font-size: 28px;
}

.command-panel small {
  color: #00796f;
  font-weight: 800;
}

.command-panel .danger strong,
.command-panel .danger small {
  color: #b20f38;
}

.command-panel .teal strong,
.command-panel .teal small {
  color: #00796f;
}

.search-strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.ai-signal {
  display: grid;
  gap: 4px;
  min-width: 280px;
  padding: 14px 16px;
  border: 1px solid rgba(0, 184, 217, 0.2);
  border-radius: 14px;
  background: #f0fcff;
}

.ai-signal strong {
  color: #00758a;
  font-size: 13px;
}

.ai-signal span {
  color: #586474;
  font-size: 12px;
  font-weight: 800;
}

.search-box {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 82px;
  align-items: center;
  width: min(560px, 100%);
  height: 48px;
  padding: 0 8px 0 16px;
  border: 1px solid #cfd8ea;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(12, 33, 66, 0.06);
}

.search-box input {
  min-width: 0;
  border: 0;
  outline: none;
  color: #0b1c30;
}

.search-box button,
.primary-button {
  border: 0;
  background: #0758d8;
  color: #ffffff;
  font-weight: 900;
}

.search-box button {
  height: 34px;
  border-radius: 7px;
  font-size: 13px;
}

.section-block {
  margin-top: 36px;
}

.section-heading,
.card-head,
.page-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.section-heading h2,
.card h2,
.page-title-row h1 {
  margin: 0;
  color: #07182f;
}

.section-heading p,
.page-title-row p {
  margin: 8px 0 0;
  color: #586474;
}

.track-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 22px;
}

.track-card,
.card,
.topic-card,
.material-card,
.requirement-card {
  border: 1px solid #dfe6f5;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(19, 42, 74, 0.06);
}

.track-card {
  display: grid;
  justify-items: center;
  min-height: 204px;
  padding: 26px;
  border-radius: 10px;
  color: #07182f;
}

.track-icon {
  display: grid;
  place-items: center;
  width: 74px;
  height: 74px;
  border-radius: 999px;
  background: #e6efff;
  color: #0b66ff;
  font-size: 28px;
}

.track-card.teal .track-icon {
  background: #e8fbf7;
  color: #08766c;
}

.track-card.rose .track-icon {
  background: #fff2f5;
  color: #c81e4a;
}

.track-card strong {
  margin-top: 12px;
  font-size: 19px;
}

.track-card small {
  color: #586474;
}

.track-card em {
  margin-top: 8px;
  padding: 7px 14px;
  border-radius: 999px;
  background: #dbeafe;
  color: #0758d8;
  font-style: normal;
  font-size: 13px;
  font-weight: 900;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 28px;
  margin-top: 36px;
}

.card {
  border-radius: 12px;
  padding: 24px;
}

.card-head button,
.filter-row button,
.topic-card footer button {
  border: 0;
  background: transparent;
  color: #0758d8;
  font-size: 13px;
  font-weight: 900;
}

.recent-list {
  display: grid;
  gap: 24px;
  margin-top: 28px;
}

.recent-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px 18px;
}

.recent-row strong,
.recent-row span {
  display: block;
}

.recent-row span {
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
}

.recent-row em {
  color: #08766c;
  font-style: normal;
  font-weight: 900;
}

.progress-track {
  grid-column: 1 / -1;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #dce9ff;
}

.progress-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #0758d8;
}

.progress-track i.teal {
  background: #00796f;
}

.progress-track i.rose {
  background: #d8294c;
}

.growth-card {
  display: grid;
  gap: 20px;
  background: linear-gradient(145deg, #eef5ff, #f8fbff);
}

.growth-card h2 {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 20px;
}

.growth-metric {
  display: grid;
  gap: 8px;
  padding: 20px;
  border-radius: 10px;
  background: #ffffff;
}

.growth-metric span {
  color: #586474;
  font-size: 13px;
  font-weight: 800;
}

.growth-metric strong {
  color: #0758d8;
  font-size: 32px;
}

.growth-metric.soft strong {
  color: #07182f;
  font-size: 22px;
}

.inline-action,
.weak-focus-card button,
.growth-explain-strip button {
  justify-self: start;
  border: 0;
  background: transparent;
  color: #0758d8;
  font-weight: 900;
}

.weak-focus-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 28px;
}

.weak-focus-card,
.growth-explain-strip article {
  display: grid;
  gap: 10px;
  padding: 22px;
  border: 1px solid rgba(0, 184, 217, 0.2);
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff, #f0fcff);
  box-shadow: 0 12px 32px rgba(19, 42, 74, 0.06);
}

.weak-focus-card span,
.growth-explain-strip span {
  color: #00758a;
  font-size: 12px;
  font-weight: 900;
}

.weak-focus-card h3,
.growth-explain-strip h2 {
  margin: 0;
  color: #07182f;
}

.weak-focus-card p,
.growth-explain-strip p {
  margin: 0;
  color: #586474;
  line-height: 1.7;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-row button,
.date-button {
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid #d6deed;
  border-radius: 8px;
  background: #ffffff;
  color: #253246;
}

.topic-card-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-top: 28px;
}

.topic-card-list.small {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.topic-card {
  display: grid;
  gap: 14px;
  min-height: 230px;
  padding: 24px;
  border-radius: 12px;
}

.topic-top,
.topic-card footer,
.tag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.topic-top span {
  padding: 6px 12px;
  border-radius: 999px;
  background: #e6efff;
  color: #0758d8;
  font-size: 12px;
  font-weight: 900;
}

.topic-top button {
  border: 0;
  background: transparent;
  color: #9aa6bd;
  font-size: 22px;
}

.topic-card h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.35;
}

.topic-card p {
  margin: 0;
  color: #586474;
}

.tag-row {
  justify-content: flex-start;
  flex-wrap: wrap;
}

.tag-row span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #e6efff;
  color: #33425c;
  font-size: 12px;
  font-weight: 900;
}

.topic-card footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid #edf1f8;
}

.topic-card footer span {
  color: #586474;
  font-size: 13px;
  font-weight: 800;
}

.topic-card footer span.done {
  color: #08766c;
}

.growth-top-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 318px;
  gap: 24px;
  margin-top: 28px;
}

.growth-explain-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 28px;
}

.heat-card .card-head span {
  padding: 7px 12px;
  border-radius: 999px;
  background: #d9f5ef;
  color: #08766c;
  font-size: 12px;
  font-weight: 900;
}

.heat-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 5px;
  margin-top: 24px;
}

.heat-grid span {
  aspect-ratio: 1.42;
  border-radius: 3px;
  background: #e7eefc;
}

.heat-grid .level-1 {
  background: #cfe0fb;
}

.heat-grid .level-2 {
  background: #a9c4f2;
}

.heat-grid .level-3 {
  background: #5d91e8;
}

.heat-grid .level-4 {
  background: #0758d8;
}

.heat-legend {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 7px;
  margin-top: 16px;
  color: #586474;
  font-size: 12px;
}

.heat-legend i {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: #a9c4f2;
}

.attention-card {
  display: grid;
  gap: 16px;
  padding: 24px;
  border: 1px solid #f1c9d2;
  border-radius: 12px;
  background: #fff7fa;
}

.attention-card h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

.attention-card > div {
  padding: 18px;
  border-left: 4px solid #d8294c;
  border-radius: 8px;
  background: #ffffff;
}

.attention-card p {
  color: #586474;
  line-height: 1.6;
}

.attention-card button {
  border: 0;
  background: transparent;
  color: #0758d8;
  font-weight: 900;
}

.achievements-card {
  margin-top: 32px;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.achievement-grid article {
  display: grid;
  justify-items: center;
  gap: 10px;
  min-height: 150px;
  padding: 22px;
  border-radius: 10px;
  background: #ffffff;
}

.achievement-grid span {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: #e6efff;
  color: #0758d8;
  font-size: 26px;
}

.achievement-grid .teal span {
  background: #d9f5ef;
  color: #08766c;
}

.achievement-grid .muted span {
  background: #eef1f5;
  color: #8b94a3;
}

.achievement-grid strong {
  font-size: 16px;
}

.achievement-grid small {
  color: #586474;
}

.library-mini {
  margin-top: 42px;
  padding-top: 32px;
  border-top: 1px solid #e1e7f6;
}

.practice-view {
  width: min(1200px, calc(100vw - 300px));
}

.practice-header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  min-height: 62px;
  margin-bottom: 20px;
}

.mobile-practice-tabs {
  display: none;
}

.back-button {
  width: 44px;
  height: 44px;
  font-size: 24px;
}

.practice-header strong {
  color: #0758d8;
  text-align: center;
  font-size: 24px;
}

.timer-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  background: #dbeafe;
  color: #0758d8;
  font-size: 18px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.practice-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 1fr);
  min-height: calc(100vh - 182px);
  border: 1px solid #e1e7f6;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

.materials-panel,
.editor-panel {
  padding: 32px 42px;
}

.materials-panel {
  border-right: 1px solid #e7ecf5;
}

.practice-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.practice-meta span {
  padding: 7px 14px;
  border-radius: 999px;
  background: #dbeafe;
  color: #0758d8;
  font-size: 13px;
  font-weight: 900;
}

.practice-meta .danger {
  background: #ffe1e7;
  color: #b20f38;
}

.prompt-section h1 {
  margin: 22px 0 36px;
  font-size: 30px;
  line-height: 1.35;
}

.materials-section h3 {
  margin: 28px 0 16px;
}

.material-card {
  display: grid;
  gap: 16px;
  margin-top: 18px;
  padding: 26px;
  border-radius: 12px;
}

.material-card div {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #08766c;
  font-size: 22px;
}

.material-card p,
.requirement-card,
.answer-card p,
.detail-card p {
  color: #4b5568;
  line-height: 1.85;
}

.material-card button {
  justify-self: center;
  border: 0;
  background: transparent;
  color: #0758d8;
  font-weight: 900;
}

.requirement-card {
  padding: 24px;
  border-left: 5px solid #0758d8;
  border-radius: 12px;
  background: #eaf2ff;
}

.requirement-card ul {
  margin: 16px 0 0;
  padding-left: 22px;
}

.editor-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto auto;
  gap: 18px;
}

.editor-toolbar {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 0 16px;
  border: 1px solid #e1e7f6;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(19, 42, 74, 0.06);
}

.editor-toolbar button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #33425c;
  font-weight: 900;
}

.editor-toolbar span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-left: 12px;
  border-left: 1px solid #e1e7f6;
  color: #0758d8;
  font-weight: 900;
}

.answer-area {
  display: grid;
  gap: 12px;
  min-height: 0;
}

.answer-area span {
  display: flex;
  justify-content: space-between;
  color: #253246;
  font-weight: 900;
}

.answer-area em {
  color: #6b7280;
  font-style: normal;
}

.answer-area textarea {
  width: 100%;
  min-height: 520px;
  height: 100%;
  padding: 24px;
  resize: vertical;
  border: 1px solid #cad3e3;
  border-radius: 12px;
  outline: none;
  color: #0b1c30;
  font-size: 18px;
  line-height: 1.9;
}

.answer-area textarea:focus {
  border-color: #0758d8;
  box-shadow: 0 0 0 4px rgba(7, 88, 216, 0.1);
}

.word-progress {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #e6efff;
}

.word-progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #0758d8;
}

.editor-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.soft-button,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  gap: 8px;
  padding: 0 18px;
  border: 0;
  border-radius: 10px;
  font-weight: 900;
}

.soft-button {
  background: #dbeafe;
  color: #0758d8;
}

.form-message {
  margin: 0;
  color: #b20f38;
  font-weight: 800;
}

.report-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.report-header h1 {
  margin: 18px 0 8px;
  font-size: 42px;
  line-height: 1.2;
}

.report-header p {
  margin: 0;
  color: #586474;
  font-size: 16px;
}

.report-header > div:last-child {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  background: #dbeafe;
  color: #0758d8;
  font-size: 13px;
  font-weight: 900;
}

.empty-report {
  display: grid;
  place-items: center;
  gap: 14px;
  min-height: 320px;
  margin-top: 28px;
  text-align: center;
}

.empty-report p {
  color: #586474;
}

.report-summary-grid,
.analysis-grid,
.detail-report-grid {
  display: grid;
  gap: 24px;
  margin-top: 32px;
}

.report-summary-grid {
  grid-template-columns: 360px minmax(0, 1fr);
}

.analysis-grid {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.detail-report-grid {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.score-card {
  display: grid;
  justify-items: center;
  text-align: center;
}

.score-ring {
  position: relative;
  width: 196px;
  height: 196px;
  margin: 18px 0;
}

.score-ring svg {
  width: 196px;
  height: 196px;
  transform: rotate(-90deg);
}

.ring-track,
.ring-value {
  fill: none;
  stroke-width: 12;
}

.ring-track {
  stroke: #e6efff;
}

.ring-value {
  stroke: #0758d8;
  stroke-linecap: round;
}

.score-card.good .ring-value,
.score-card.excellent .ring-value {
  stroke: #08766c;
}

.score-card.normal .ring-value {
  stroke: #d88a00;
}

.score-card.weak .ring-value {
  stroke: #d8294c;
}

.score-ring div {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
}

.score-ring strong {
  color: #0758d8;
  font-size: 52px;
  line-height: 1;
}

.score-ring span {
  color: #586474;
  font-weight: 900;
}

.score-card p {
  max-width: 260px;
  color: #586474;
  line-height: 1.7;
}

.dimension-card h2,
.answer-card h2,
.advice-card h2,
.detail-card h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.dimension-row + .dimension-row {
  margin-top: 16px;
}

.dimension-row > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.dimension-row span {
  color: #0758d8;
  font-weight: 900;
}

.dimension-row p {
  margin: 8px 0 0;
  color: #586474;
  font-size: 13px;
}

.answer-card p {
  min-height: 220px;
  padding: 18px;
  border-radius: 10px;
  background: #fbfcff;
}

.advice-card {
  background: #eef5ff;
}

.advice-block {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-left: 4px solid #0758d8;
  border-radius: 10px;
  background: #ffffff;
}

.advice-block + .advice-block {
  margin-top: 16px;
}

.advice-block.danger {
  border-left-color: #d8294c;
}

.advice-block.success {
  border-left-color: #08766c;
}

.advice-block p {
  margin: 0;
  color: #4b5568;
  line-height: 1.7;
}

.detail-card ul {
  display: grid;
  gap: 12px;
  margin: 0;
  padding-left: 22px;
  color: #4b5568;
  line-height: 1.7;
}

.material-mini {
  padding: 16px;
  border: 1px solid #dfe6f5;
  border-radius: 10px;
  background: #fbfcff;
}

.material-mini + .material-mini {
  margin-top: 12px;
}

.material-mini strong {
  color: #0758d8;
}

.material-mini p {
  margin: 8px 0;
}

.material-mini small {
  color: #08766c;
  line-height: 1.6;
}

.sample-card {
  grid-column: 1 / -1;
}

.sample-card p {
  font-size: 16px;
}

@media (max-width: 980px) {
  .desktop-sidebar,
  .top-tabs {
    display: none;
  }

  .pq-app {
    background: #f8f9ff;
  }

  .app-shell {
    margin-left: 0;
    padding-bottom: calc(104px + env(safe-area-inset-bottom));
  }

  .topbar {
    grid-template-columns: 44px minmax(0, 1fr) auto;
    height: 82px;
    padding: 0 20px;
  }

  .mobile-only,
  .mobile-title,
  .mobile-bottom-nav {
    display: grid;
  }

  .mobile-title {
    justify-self: center;
    color: #0758d8;
    font-size: 22px;
  }

  .top-actions {
    gap: 10px;
  }

  .top-actions .icon-button {
    display: none;
  }

  .dashboard-view,
  .library-view,
  .growth-view,
  .practice-view,
  .report-view {
    width: min(100vw - 32px, 620px);
    padding: 28px 0 120px;
  }

  .hero-card {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 22px;
    border-radius: 18px;
    text-align: left;
  }

  .hero-command-copy h1 {
    font-size: 26px;
  }

  .hero-command-copy p {
    font-size: 14px;
  }

  .command-panel {
    grid-template-columns: 1fr;
  }

  .command-panel article {
    padding: 16px;
  }

  .search-strip,
  .weak-focus-grid,
  .growth-explain-strip {
    grid-template-columns: 1fr;
  }

  .ai-signal {
    min-width: 0;
  }

  .search-box {
    width: 100%;
    height: 42px;
    border-radius: 10px;
  }

  .search-box button {
    display: none;
  }

  .section-block {
    margin-top: 32px;
  }

  .section-heading h2,
  .page-title-row h1 {
    font-size: 24px;
  }

  .track-grid,
  .dashboard-grid,
  .topic-card-list,
  .topic-card-list.small,
  .growth-top-grid,
  .achievement-grid,
  .practice-layout,
  .report-summary-grid,
  .analysis-grid,
  .detail-report-grid {
    grid-template-columns: 1fr;
  }

  .track-grid {
    gap: 16px;
  }

  .track-card {
    grid-template-columns: 58px minmax(0, 1fr) auto;
    align-items: center;
    justify-items: start;
    min-height: 86px;
    padding: 16px;
  }

  .track-icon {
    grid-row: span 3;
    width: 52px;
    height: 52px;
    font-size: 22px;
  }

  .track-card strong {
    margin: 0;
    font-size: 18px;
  }

  .track-card em {
    grid-row: 1 / span 2;
    grid-column: 3;
    align-self: start;
    margin: 0;
  }

  .recent-card {
    overflow: hidden;
  }

  .recent-list {
    grid-auto-flow: column;
    grid-auto-columns: minmax(210px, 1fr);
    overflow-x: auto;
  }

  .growth-card {
    margin-top: 8px;
  }

  .mobile-growth-summary {
    display: grid;
    gap: 14px;
    margin-bottom: 28px;
  }

  .mobile-growth-summary h2 {
    margin: 0;
    font-size: 30px;
  }

  .mobile-growth-summary p {
    margin: 0;
    color: #586474;
    font-size: 20px;
  }

  .compact {
    margin-top: 18px;
  }

  .compact-grid {
    grid-template-columns: repeat(7, 1fr);
  }

  .page-title-row {
    display: grid;
  }

  .filter-row {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .filter-row button {
    border-radius: 999px;
    white-space: nowrap;
  }

  .topic-card {
    min-height: 0;
    padding: 26px;
    border-radius: 16px;
  }

  .topic-card h2 {
    font-size: 26px;
  }

  .growth-view > .page-title-row {
    display: none;
  }

  .growth-top-grid {
    display: grid;
  }

  .achievements-card {
    margin-top: 0;
  }

  .library-mini {
    margin-top: 28px;
    padding-top: 24px;
  }

  .practice-header {
    position: sticky;
    top: 82px;
    z-index: 16;
    margin: 0 -16px 22px;
    padding: 0 16px 18px;
    border-bottom: 1px solid #e1e7f6;
    background: rgba(248, 249, 255, 0.96);
    backdrop-filter: blur(16px);
  }

  .practice-header strong {
    font-size: 22px;
  }

  .timer-pill {
    min-height: 38px;
    padding: 0 12px;
    font-size: 15px;
  }

  .practice-layout {
    border: 0;
    overflow: visible;
    background: transparent;
  }

  .mobile-practice-tabs {
    position: sticky;
    top: 144px;
    z-index: 15;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin: -12px -4px 18px;
    padding: 6px;
    border: 1px solid #d7e3f6;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 12px 30px rgba(19, 42, 74, 0.08);
    backdrop-filter: blur(18px);
  }

  .mobile-practice-tabs button {
    min-height: 40px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: #526071;
    font-weight: 900;
  }

  .mobile-practice-tabs button.active {
    background: #0758d8;
    color: #ffffff;
    box-shadow: 0 10px 24px rgba(7, 88, 216, 0.2);
  }

  .mobile-hidden {
    display: none !important;
  }

  .materials-panel,
  .editor-panel {
    padding: 0;
  }

  .materials-panel {
    border-right: 0;
  }

  .prompt-section h1 {
    font-size: 26px;
  }

  .material-card,
  .requirement-card {
    border-radius: 14px;
    padding: 24px;
  }

  .editor-panel {
    margin-top: 34px;
  }

  .editor-toolbar {
    display: none;
  }

  .answer-area textarea {
    min-height: 360px;
    border-radius: 14px;
    font-size: 16px;
  }

  .editor-actions {
    position: fixed;
    right: 16px;
    bottom: calc(86px + env(safe-area-inset-bottom));
    left: 16px;
    z-index: 42;
    margin: 0;
    padding: 18px 16px;
    border: 1px solid #d7e3f6;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 18px 46px rgba(19, 42, 74, 0.15);
    backdrop-filter: blur(18px);
  }

  .report-header {
    display: grid;
  }

  .report-header h1 {
    font-size: 28px;
  }

  .report-header > div:last-child {
    display: none;
  }

  .score-card {
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  .score-ring {
    width: 220px;
    height: 220px;
  }

  .score-ring svg {
    width: 220px;
    height: 220px;
  }

  .score-ring strong {
    font-size: 64px;
  }

  .score-card p {
    max-width: 100%;
    font-size: 20px;
  }

  .dimension-card,
  .answer-card,
  .advice-card,
  .detail-card {
    border-radius: 16px;
  }

  .sample-card {
    grid-column: auto;
  }

  .mobile-bottom-nav {
    position: fixed;
    inset: auto 0 0;
    z-index: 40;
    grid-template-columns: repeat(4, 1fr);
    min-height: calc(76px + env(safe-area-inset-bottom));
    padding: 8px 18px calc(8px + env(safe-area-inset-bottom));
    border-top: 1px solid #e1e7f6;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 -12px 30px rgba(19, 42, 74, 0.08);
    backdrop-filter: blur(18px);
  }

  .mobile-nav-button {
    display: grid;
    place-items: center;
    gap: 4px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: #4b5568;
    font-size: 12px;
    font-weight: 900;
  }

  .mobile-nav-button .el-icon {
    font-size: 23px;
  }

  .mobile-nav-button.active {
    background: #0b66ff;
    color: #ffffff;
  }
}

@media (max-width: 560px) {
  .topbar {
    padding: 0 16px;
  }

  .top-actions .avatar-button {
    width: 38px;
    height: 38px;
  }

  .track-card {
    grid-template-columns: 58px minmax(0, 1fr);
  }

  .track-card em {
    grid-row: auto;
    grid-column: 2;
  }

  .editor-actions {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .soft-button,
  .primary-button {
    min-height: 52px;
    padding: 0 12px;
    font-size: 14px;
  }
}
</style>
