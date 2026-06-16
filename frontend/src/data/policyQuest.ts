export type PracticeType = 'essay' | 'interview'

export interface MaterialBlock {
  id: string
  title: string
  summary: string
  content: string
  wordCount: number
  sourceUrl?: string
}

export interface PaperQuestion {
  id: string
  questionType?: string
  title: string
  prompt: string
  score: number
  wordLimit: number
  suggestedMinutes: number
  requirements: string[]
  dimensions: string[]
  sampleAnswer: string
  sourceUrl?: string
}

export interface RealPaper {
  id: string
  paperKey?: string
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
  sourceName?: string
  sourceUrl?: string
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

export interface PracticeDraft {
  id: string
  paperId: string
  paperTitle: string
  type: PracticeType
  currentIndex: number
  activeMaterialId: string
  answers: Record<string, string>
  evaluations: Record<string, EvaluationResult>
  questionTimers: Record<string, number>
  totalSeconds: number
  updatedAt: string
}

export interface PracticeHistoryItem {
  id: string
  paperId: string
  paperTitle: string
  type: PracticeType
  status: 'draft' | 'completed'
  questionCount: number
  answeredCount: number
  averageScore: number
  durationSeconds: number
  updatedAt: string
}

const RECORD_KEY = 'policyquest_real_practice_records'
const DRAFT_KEY = 'policyquest_real_practice_drafts'

export const essayDimensions = ['综合分析', '提出对策', '申发论述', '文章写作', '贯彻执行']
export const interviewDimensions = ['审题准确', '逻辑层次', '岗位匹配', '应变处置', '表达感染']

export function mapBackendPaper(item: any): RealPaper {
  return {
    id: String(item.id),
    paperKey: item.paperKey,
    type: item.type === 'interview' ? 'interview' : 'essay',
    title: String(item.title || ''),
    shortTitle: String(item.shortTitle || item.title || ''),
    system: String(item.system || 'provincial'),
    systemLabel: String(item.systemLabel || '省考'),
    region: String(item.region || '全国'),
    year: Number(item.year) || new Date().getFullYear(),
    category: String(item.category || ''),
    paperCode: String(item.paperCode || ''),
    releaseDate: String(item.releaseDate || ''),
    difficulty: String(item.difficulty || '中等'),
    suggestedMinutes: Number(item.suggestedMinutes) || (item.type === 'interview' ? 20 : 150),
    questionCount: Number(item.questionCount) || (Array.isArray(item.questions) ? item.questions.length : 0),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    weakDimensions: Array.isArray(item.weakDimensions) ? item.weakDimensions.map(String) : [],
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    materials: Array.isArray(item.materials)
      ? item.materials.map((material: any) => ({
          id: String(material.id),
          title: String(material.title || ''),
          summary: String(material.summary || ''),
          content: String(material.content || ''),
          wordCount: Number(material.wordCount) || 0,
          sourceUrl: material.sourceUrl,
        }))
      : [],
    questions: Array.isArray(item.questions)
      ? item.questions.map((question: any) => ({
          id: String(question.id),
          questionType: question.questionType,
          title: String(question.title || ''),
          prompt: String(question.prompt || ''),
          score: Number(question.score) || 100,
          wordLimit: Number(question.wordLimit) || 500,
          suggestedMinutes: Number(question.suggestedMinutes) || 7,
          requirements: Array.isArray(question.requirements) ? question.requirements.map(String) : [],
          dimensions: Array.isArray(question.dimensions) ? question.dimensions.map(String) : [],
          sampleAnswer: String(question.sampleAnswer || ''),
          sourceUrl: question.sourceUrl,
        }))
      : [],
  }
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

export function readPracticeDrafts(): PracticeDraft[] {
  try {
    const value = localStorage.getItem(DRAFT_KEY)
    if (!value) return []
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePracticeDraft(draft: PracticeDraft) {
  const drafts = readPracticeDrafts().filter(item => item.paperId !== draft.paperId)
  const nextDrafts = [draft, ...drafts].slice(0, 40)
  localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDrafts))
}

export function removePracticeDraft(paperId: string) {
  const drafts = readPracticeDrafts().filter(item => item.paperId !== paperId)
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
}

export function buildPracticeHistory(records = readPracticeRecords(), drafts = readPracticeDrafts()): PracticeHistoryItem[] {
  const completed = Array.from(
    records.reduce((buckets, record) => {
      const list = buckets.get(record.paperId) || []
      list.push(record)
      buckets.set(record.paperId, list)
      return buckets
    }, new Map<string, PracticeRecord[]>()),
  ).map(([paperId, items]) => {
    const latest = items.slice().sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))[0]
    return {
      id: `completed-${paperId}`,
      paperId,
      paperTitle: latest.paperTitle,
      type: latest.type,
      status: 'completed' as const,
      questionCount: items.length,
      answeredCount: items.length,
      averageScore: averageScore(items),
      durationSeconds: items.reduce((sum, item) => sum + item.durationSeconds, 0),
      updatedAt: latest.submittedAt,
    }
  })

  const draftItems = drafts.map(draft => ({
    id: draft.id,
    paperId: draft.paperId,
    paperTitle: draft.paperTitle,
    type: draft.type,
    status: 'draft' as const,
    questionCount: Math.max(Object.keys(draft.answers).length, Object.keys(draft.evaluations).length),
    answeredCount: Object.values(draft.answers).filter(answer => answer.trim().length > 0).length,
    averageScore: averageScoreFromEvaluations(Object.values(draft.evaluations)),
    durationSeconds: draft.totalSeconds,
    updatedAt: draft.updatedAt,
  }))

  return [...draftItems, ...completed].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

function averageScoreFromEvaluations(evaluations: EvaluationResult[]) {
  if (!evaluations.length) return 0
  return Math.round(evaluations.reduce((sum, item) => sum + item.score, 0) / evaluations.length)
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

