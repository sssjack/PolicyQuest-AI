export type PracticeType = 'essay' | 'interview'

export interface MaterialBlock {
  id: string
  title: string
  summary: string
  content: string
  wordCount: number
}

export interface PaperQuestion {
  id: string
  title: string
  prompt: string
  score: number
  wordLimit: number
  suggestedMinutes: number
  requirements: string[]
  dimensions: string[]
  sampleAnswer: string
}

export interface RealPaper {
  id: string
  type: PracticeType
  title: string
  shortTitle: string
  system: string
  systemLabel: string
  region: string
  year: number
  category: string
  paperCode: string
  releaseDate: string
  difficulty: string
  suggestedMinutes: number
  questionCount: number
  tags: string[]
  weakDimensions: string[]
  materials: MaterialBlock[]
  questions: PaperQuestion[]
}

export interface ScoreDimension {
  name: string
  score: number
  comment?: string
}

export interface EvaluationResult {
  score: number
  level: string
  summary: string
  dimensions: ScoreDimension[]
  advantages: string[]
  disadvantages: string[]
  suggestions: string[]
  qualityMaterials: Array<{ title: string; content: string; usage: string }>
  governmentReportLinks: Array<{ title: string; content: string; usage: string }>
  sampleEssay: string
}

export interface PracticeRecord {
  id: string
  paperId: string
  paperTitle: string
  type: PracticeType
  questionId: string
  questionTitle: string
  answer: string
  score: number
  durationSeconds: number
  submittedAt: string
  dimensions: ScoreDimension[]
  evaluation: EvaluationResult
}

const RECORD_KEY = 'policyquest_real_practice_records'

export const examSystems = [
  { value: 'all', label: '全部系统', count: 1868 },
  { value: 'national', label: '国考', count: 328 },
  { value: 'shandong', label: '山东省考', count: 726 },
  { value: 'jiangsu', label: '江苏省考', count: 586 },
  { value: 'guangdong', label: '广东省考', count: 512 },
  { value: 'zhejiang', label: '浙江省考', count: 442 },
  { value: 'institution', label: '事业单位', count: 368 },
  { value: 'tax', label: '税务系统', count: 254 },
]

export const years = [2026, 2025, 2024, 2023]

export const essayDimensions = ['综合分析', '提出对策', '申发论述', '文章写作', '贯彻执行']
export const interviewDimensions = ['审题准确', '逻辑层次', '岗位匹配', '应变处置', '表达感染']

export const realPapers: RealPaper[] = [
  {
    id: 'essay-shandong-2026-a',
    type: 'essay',
    title: '2026山东省考申论真题（A类）',
    shortTitle: '山东省考申论 A类',
    system: 'shandong',
    systemLabel: '山东省考',
    region: '山东',
    year: 2026,
    category: 'A类（综合管理）',
    paperCode: 'S2026001',
    releaseDate: '2025.05.20',
    difficulty: '中等偏上',
    suggestedMinutes: 180,
    questionCount: 5,
    tags: ['申论', '数字政府', '基层治理'],
    weakDimensions: ['提出对策', '贯彻执行'],
    materials: [
      {
        id: 'm1',
        title: '材料一',
        summary: '社会治理与公共服务创新实践',
        wordCount: 1200,
        content:
          '近年来，山东省持续推进数字政府建设，政务服务效能显著提升。济南市在全省率先建成“一网通办”平台，企业开办时间由原来的5个工作日压缩至1个工作日以内；青岛市推出“政策计算器”，实现惠企政策精准匹配；烟台市通过“数据多跑路，群众少跑腿”，推动更多事项“一窗受理、并行办理”。',
      },
      {
        id: 'm2',
        title: '材料二',
        summary: '数字经济发展与产业转型',
        wordCount: 1100,
        content:
          '调研中也发现一些问题。一是部分基层单位数字化基础薄弱，设备老旧、系统不联通，导致数据“孤岛”现象普遍。二是部分干部数字素养不足，对新系统、新工具不会用、不愿用，存在“重建轻用”问题。三是群众对数字化服务的获得感仍有差距，老年人、农民等群体在使用智能终端时存在困难，线下服务与线上服务衔接不够顺畅。',
      },
      {
        id: 'm3',
        title: '材料三',
        summary: '城市更新与青年发展',
        wordCount: 1000,
        content:
          '专家指出，数字政府建设不是简单把业务搬到线上，而是治理流程、服务理念和组织方式的系统重塑。要坚持以人民为中心，把群众是否满意、企业是否便利、基层是否减负作为检验标准，推动数字化从“能用”向“好用、爱用、管用”转变。',
      },
    ],
    questions: [
      {
        id: 'q1',
        title: '概括当前山东省数字政府建设中存在的主要问题',
        prompt: '根据“给定资料1-3”，概括当前山东省数字政府建设中存在的主要问题。',
        score: 20,
        wordLimit: 300,
        suggestedMinutes: 25,
        requirements: ['全面、准确、简明', '分条作答', '不超过300字'],
        dimensions: ['综合分析', '提出对策', '贯彻执行'],
        sampleAnswer:
          '当前数字政府建设主要存在三方面问题：一是基础支撑不够均衡，部分基层单位设备老旧、系统不联通，数据共享不足，影响协同治理效率。二是干部数字素养有待提升，对新系统、新工具不会用、不愿用，存在“重建轻用”现象。三是服务体验仍需优化，老年人、农民等群体使用智能终端存在困难，线上线下服务衔接不够顺畅，群众获得感仍有差距。',
      },
      {
        id: 'q2',
        title: '提出提升数字政府服务质效的对策',
        prompt: '结合资料，围绕“让数字政府更好用、更管用”，提出具体对策。',
        score: 30,
        wordLimit: 500,
        suggestedMinutes: 35,
        requirements: ['对策具体可行', '有执行主体和工作机制', '不超过500字'],
        dimensions: ['提出对策', '贯彻执行', '文章写作'],
        sampleAnswer:
          '要提升数字政府服务质效，应从四方面发力：第一，夯实基础底座，推动部门系统互联互通，完善统一数据目录和授权共享机制，减少重复采集。第二，提升干部能力，通过岗位培训、实操演练和考核评价，解决不会用、不善用问题。第三，优化服务体验，围绕企业和群众高频事项重塑流程，推广一表申请、一窗受理、一次办成。第四，守住兜底服务，保留必要线下窗口和帮办代办服务，帮助老年人等群体跨越数字门槛。',
      },
      {
        id: 'q3',
        title: '以“数字政府建设的温度与效能”为题写一篇文章',
        prompt: '参考给定资料，以“数字政府建设的温度与效能”为题，自选角度，写一篇议论文。',
        score: 50,
        wordLimit: 1000,
        suggestedMinutes: 90,
        requirements: ['观点鲜明', '结构完整', '联系实际', '900-1100字'],
        dimensions: ['综合分析', '申发论述', '文章写作'],
        sampleAnswer:
          '数字政府建设的温度与效能，既体现在数据流转更顺畅、办事效率更高，也体现在群众体验更便利、公共服务更公平。推进数字政府建设，首先要坚持人民立场，把群众满意度作为衡量标准，让技术服务于人而不是让人迁就技术。其次要坚持协同治理，通过数据共享、流程再造和部门联动，打破信息壁垒，提升治理效能。再次要坚持包容普惠，保留线下兜底服务，帮助老年人、农民等群体跨越数字鸿沟。只有让数据多跑路、群众少跑腿、基层少负担，数字政府才能真正成为提升治理能力和增进民生福祉的重要支撑。',
      },
    ],
  },
  {
    id: 'essay-national-2025-city',
    type: 'essay',
    title: '2025国考申论真题（地市级）',
    shortTitle: '国考申论 地市级',
    system: 'national',
    systemLabel: '国考',
    region: '全国',
    year: 2025,
    category: '地市级',
    paperCode: 'G2025001',
    releaseDate: '2024.11.30',
    difficulty: '中等偏上',
    suggestedMinutes: 180,
    questionCount: 5,
    tags: ['申论', '公共服务', '城市治理'],
    weakDimensions: ['综合分析', '文章写作'],
    materials: [
      {
        id: 'm1',
        title: '材料一',
        summary: '社区公共文化空间建设',
        wordCount: 1180,
        content:
          '某市在老旧小区改造中引入“微空间”理念，将闲置锅炉房、边角空地改造成集阅读、议事、休闲于一体的社区文化客厅，吸引居民参与空间治理和活动策划。',
      },
      {
        id: 'm2',
        title: '材料二',
        summary: '城市治理中的群众参与',
        wordCount: 980,
        content:
          '基层干部反映，过去公共空间建设容易出现“政府建、群众看”的问题。如今通过居民议事会、志愿服务队和社会组织参与，项目更贴近真实需求，运营也更可持续。',
      },
      {
        id: 'm3',
        title: '材料三',
        summary: '公共服务高质量发展',
        wordCount: 1020,
        content:
          '专家认为，公共服务既要解决“有没有”，更要解决“好不好”。要以需求为导向，推动服务供给从标准化向精细化、从单向投入向共建共享转变。',
      },
    ],
    questions: [
      {
        id: 'q1',
        title: '分析社区文化客厅受到欢迎的原因',
        prompt: '根据给定资料，分析社区文化客厅受到居民欢迎的原因。',
        score: 20,
        wordLimit: 350,
        suggestedMinutes: 25,
        requirements: ['紧扣材料', '分析清楚', '分条作答'],
        dimensions: ['综合分析', '贯彻执行'],
        sampleAnswer:
          '社区文化客厅受到欢迎，原因在于：一是空间利用贴近需求，把闲置资源改造成居民可感可及的公共空间；二是功能复合，兼具阅读、议事、休闲等多种场景，满足不同群体需要；三是治理方式转变，居民从使用者变为参与者，提高了认同感和归属感；四是运营更可持续，引入志愿者和社会组织，避免建成后无人管、活动少的问题。',
      },
      {
        id: 'q2',
        title: '围绕公共文化空间高质量发展提出建议',
        prompt: '结合资料，就推进城市公共文化空间高质量发展提出建议。',
        score: 30,
        wordLimit: 500,
        suggestedMinutes: 35,
        requirements: ['建议具体', '条理清晰', '具有可操作性'],
        dimensions: ['提出对策', '贯彻执行', '文章写作'],
        sampleAnswer:
          '推进公共文化空间高质量发展，应坚持需求导向，充分调研居民阅读、议事、活动等真实需求，避免同质化建设；坚持共建共享，通过居民议事、志愿服务和社会组织参与，形成多元运营机制；坚持数字赋能，建立活动预约、资源发布和反馈评价平台，提高服务匹配度；坚持长效保障，完善经费、人员、考核和维护机制，让公共文化空间持续有活力。',
      },
    ],
  },
  {
    id: 'essay-jiangsu-2024-a',
    type: 'essay',
    title: '2024江苏省考申论真题（A类）',
    shortTitle: '江苏省考申论 A类',
    system: 'jiangsu',
    systemLabel: '江苏省考',
    region: '江苏',
    year: 2024,
    category: 'A类',
    paperCode: 'J2024001',
    releaseDate: '2024.03.16',
    difficulty: '中等',
    suggestedMinutes: 150,
    questionCount: 4,
    tags: ['申论', '营商环境', '基层减负'],
    weakDimensions: ['提出对策', '申发论述'],
    materials: [
      {
        id: 'm1',
        title: '材料一',
        summary: '营商环境改革',
        wordCount: 940,
        content:
          '某地推进“一件事一次办”改革，把企业开办、用工登记、社保办理等事项整合为一个流程，企业群众办事时间明显缩短。',
      },
      {
        id: 'm2',
        title: '材料二',
        summary: '基层减负与治理效能',
        wordCount: 900,
        content:
          '基层干部表示，减负不是放松管理，而是减少重复报表、层层留痕和形式主义检查，把更多时间用于服务企业、走访群众和解决问题。',
      },
    ],
    questions: [
      {
        id: 'q1',
        title: '归纳“一件事一次办”改革的积极意义',
        prompt: '请归纳“一件事一次办”改革对优化营商环境的积极意义。',
        score: 20,
        wordLimit: 300,
        suggestedMinutes: 25,
        requirements: ['全面准确', '语言简洁'],
        dimensions: ['综合分析', '贯彻执行'],
        sampleAnswer:
          '“一件事一次办”改革有利于重塑政务流程，减少企业群众多头跑、重复交材料的问题；有利于推动部门协同和数据共享，提高行政效率；有利于降低制度性交易成本，增强企业获得感；也有利于倒逼政府服务理念转变，推动营商环境持续优化。',
      },
    ],
  },
  {
    id: 'interview-shandong-jinan-2025',
    type: 'interview',
    title: '2025山东省考济南历城区面试真题',
    shortTitle: '济南历城区面试',
    system: 'shandong',
    systemLabel: '山东省考',
    region: '济南历城区',
    year: 2025,
    category: '结构化',
    paperCode: 'S20250401',
    releaseDate: '2025.04.10',
    difficulty: '中等偏上',
    suggestedMinutes: 20,
    questionCount: 3,
    tags: ['面试', '基层治理', '应急应变'],
    weakDimensions: ['应变处置', '表达感染'],
    materials: [
      {
        id: 'm1',
        title: '背景材料',
        summary: '基层窗口服务与群众沟通',
        wordCount: 360,
        content:
          '某街道便民服务中心近期业务量上升，部分群众反映排队时间长、线上预约不熟悉。街道准备优化窗口服务流程，提升群众满意度。',
      },
    ],
    questions: [
      {
        id: 'q1',
        title: '窗口服务群众排队时间长，你怎么办',
        prompt: '如果你是街道工作人员，面对群众反映窗口排队时间长、线上预约不会用，你会怎么办？',
        score: 100,
        wordLimit: 500,
        suggestedMinutes: 7,
        requirements: ['先稳现场', '再查原因', '提出长效机制'],
        dimensions: ['审题准确', '逻辑层次', '应变处置'],
        sampleAnswer:
          '我会坚持先稳现场、再查原因、后建机制。首先，及时向群众说明情况，安排人员维持秩序，对老年人、残障人士等群体提供帮办服务。其次，排查业务量、窗口开放、系统运行和预约引导情况，能现场优化的立即增开窗口、分流办理。最后，建立预约指导、错峰办理、志愿帮办和满意度反馈机制，让窗口服务既有效率也有温度。',
      },
      {
        id: 'q2',
        title: '如何看待青年干部到基层锻炼',
        prompt: '有人说青年干部到基层是成长捷径，也有人说基层工作琐碎难出成绩。请谈谈你的看法。',
        score: 100,
        wordLimit: 500,
        suggestedMinutes: 7,
        requirements: ['观点辩证', '结合岗位', '表达积极担当'],
        dimensions: ['审题准确', '岗位匹配', '表达感染'],
        sampleAnswer:
          '基层不是捷径，也不是负担，而是青年干部了解群众、增长本领的重要课堂。基层工作看似琐碎，却直接连接群众急难愁盼，最能检验责任心、沟通力和执行力。青年干部要在基层把小事做实、把难事办妥，在服务群众中磨炼作风，在解决问题中提升能力。',
      },
    ],
  },
  {
    id: 'interview-tax-national-2025',
    type: 'interview',
    title: '2025国考税务系统面试真题',
    shortTitle: '国考税务面试',
    system: 'tax',
    systemLabel: '税务系统',
    region: '全国',
    year: 2025,
    category: '结构化小组',
    paperCode: 'G2025TAX01',
    releaseDate: '2024.12.18',
    difficulty: '中等',
    suggestedMinutes: 20,
    questionCount: 4,
    tags: ['面试', '税务', '结构化小组'],
    weakDimensions: ['岗位匹配', '逻辑层次'],
    materials: [
      {
        id: 'm1',
        title: '背景材料',
        summary: '便民办税春风行动',
        wordCount: 320,
        content:
          '某地税务部门开展便民办税服务，推动涉税事项网上办、掌上办、一次办，同时保留线下辅导窗口帮助小微企业和老年纳税人。',
      },
    ],
    questions: [
      {
        id: 'q1',
        title: '数字办税如何兼顾效率与公平',
        prompt: '请谈谈数字办税服务如何兼顾效率提升与群体公平。',
        score: 100,
        wordLimit: 500,
        suggestedMinutes: 7,
        requirements: ['联系税务岗位', '兼顾线上线下', '提出具体措施'],
        dimensions: ['审题准确', '岗位匹配', '提出对策'],
        sampleAnswer:
          '数字办税既要让数据多跑路，也要避免纳税人被技术门槛挡在门外。一方面，要优化网上办、掌上办流程，减少重复填报，提升办税效率；另一方面，要保留线下辅导窗口和热线服务，为小微企业、老年纳税人提供帮办代办。还要通过数据分析发现高频堵点，持续改进服务流程。',
      },
    ],
  },
]

export function findPaper(paperId: string) {
  return realPapers.find(paper => paper.id === paperId)
}

export function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function clampScore(value: number, min = 45, max = 96) {
  if (Number.isNaN(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

function scoreLevel(score: number) {
  if (score >= 88) return '优秀'
  if (score >= 78) return '良好'
  if (score >= 65) return '中等'
  return '待提升'
}

export function fallbackEvaluation(answer: string, question: PaperQuestion, paper: RealPaper): EvaluationResult {
  const text = answer.trim()
  const targetLength = paper.type === 'interview' ? 360 : Math.min(question.wordLimit, 900)
  const lengthScore = Math.min(text.length / targetLength, 1) * 18
  const structureHits = ['第一', '第二', '第三', '首先', '其次', '再次', '最后', '一方面', '另一方面', '因此', '总之'].filter(word =>
    text.includes(word),
  ).length
  const policyHits = ['以人民为中心', '高质量发展', '基层治理', '数字政府', '公共服务', '民生', '减负', '协同', '闭环'].filter(word =>
    text.includes(word),
  ).length
  const actionHits = ['机制', '清单', '平台', '监督', '培训', '落实', '反馈', '考核', '优化', '流程'].filter(word =>
    text.includes(word),
  ).length
  const score = clampScore(53 + lengthScore + structureHits * 3 + policyHits * 2 + actionHits * 2)
  const dimensionNames = paper.type === 'interview' ? interviewDimensions : essayDimensions

  const dimensions = dimensionNames.map((name, index) => ({
    name,
    score: clampScore(score + [4, 0, -5, -2, 2][index], 42, 96),
    comment:
      index === 0
        ? '能回应题目核心要求，但还可以进一步提炼关键词。'
        : index === 1
          ? '有基本分层意识，建议让每一层的递进关系更清楚。'
          : index === 2
            ? '论证和材料转化仍是主要提分空间。'
            : index === 3
              ? '表达较通顺，建议压缩口语化表述并增强规范性。'
              : '已有执行意识，后续可补充主体、机制和评价标准。',
  }))

  return {
    score,
    level: scoreLevel(score),
    summary: `本题作答方向基本正确，能够围绕“${question.title}”展开，具备一定结构意识。主要提分点在于增加材料转化、政策表达和可执行细节。`,
    dimensions,
    advantages: [
      '能够直接回应题干，不容易跑题。',
      '作答中有分层意识，阅卷者能较快识别答题框架。',
      '已经提出若干解决方向，体现了解决问题的意识。',
    ],
    disadvantages: [
      '部分观点停留在概括层面，缺少具体执行主体和操作步骤。',
      '材料关键词与政策表达结合不够充分，答案的考试辨识度可以继续提升。',
      paper.type === 'interview' ? '临场身份感和交流感还可以更强。' : '分论点之间的递进关系不够明显，结尾升华略弱。',
    ],
    suggestions: [
      '开头先用一句话明确判断，再用三到四个分论点展开。',
      '每条对策尽量写成“主体 + 动作 + 机制 + 效果”的完整句式。',
      '补充“以人民为中心、基层减负、闭环治理、协同联动”等政策表达。',
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
    ],
    governmentReportLinks: [
      {
        title: '推动高质量发展',
        content: '可把题目中的公共服务、产业升级、基层治理等内容，落到高质量发展的现实路径中。',
        usage: '适合放在开头立意或分论点总领句，提升政策站位。',
      },
      {
        title: '保障和改善民生',
        content: '把具体工作写成增进民生福祉、提升群众获得感的抓手。',
        usage: '适合公共服务、基层治理、乡村振兴等题型。',
      },
    ],
    sampleEssay: question.sampleAnswer,
  }
}

export function readPracticeRecords(): PracticeRecord[] {
  try {
    const value = localStorage.getItem(RECORD_KEY)
    if (!value) return []
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePracticeRecord(record: PracticeRecord) {
  const records = readPracticeRecords()
  const nextRecords = [record, ...records].slice(0, 80)
  localStorage.setItem(RECORD_KEY, JSON.stringify(nextRecords))
}

export function aggregateDimensions(records: PracticeRecord[]) {
  const source = records.length
    ? records.flatMap(record => record.dimensions)
    : [...essayDimensions, ...interviewDimensions].map((name, index) => ({ name, score: 62 + (index % 5) * 3 }))

  const buckets = new Map<string, number[]>()
  source.forEach(item => {
    const scores = buckets.get(item.name) || []
    scores.push(item.score)
    buckets.set(item.name, scores)
  })

  return Array.from(buckets.entries()).map(([name, scores]) => ({
    name,
    score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
  }))
}

export function averageScore(records: PracticeRecord[]) {
  if (!records.length) return 0
  return Math.round(records.reduce((sum, record) => sum + record.score, 0) / records.length)
}
