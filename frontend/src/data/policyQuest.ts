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

export interface FavoritePaper {
  id: string
  paperId: string
  paperTitle: string
  type: PracticeType
  systemLabel: string
  category: string
  year: number
  suggestedMinutes: number
  questionCount: number
  favoritedAt: string
}

const RECORD_KEY = 'policyquest_real_practice_records'
const DRAFT_KEY = 'policyquest_real_practice_drafts'
const FAVORITE_KEY = 'policyquest_real_paper_favorites'

export const essayDimensions = ['审题立意', '要点提炼', '材料运用', '结构逻辑', '对策可行', '文字表达']
export const interviewDimensions = ['审题理解', '综合分析', '逻辑表达', '岗位匹配', '应变处置', '语言规范']

export function normalizeScoreDimensionName(value: unknown) {
  const name = String(value || '')
  if (name === '举止表达' || name === '表达感染') return '语言规范'
  return name
}

const essayRubricWeights: Record<string, number> = {
  审题立意: 20,
  要点提炼: 25,
  材料运用: 20,
  结构逻辑: 15,
  对策可行: 10,
  文字表达: 10,
}

const interviewRubricWeights: Record<string, number> = {
  审题理解: 15,
  综合分析: 20,
  逻辑表达: 20,
  岗位匹配: 15,
  应变处置: 15,
  语言规范: 15,
}

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

function hitCount(text: string, words: string[]) {
  return words.filter(word => text.includes(word)).length
}

function scoreFromSignals(base: number, signals: number[], min = 25, max = 92) {
  return clampScore(base + signals.reduce((sum, value) => sum + value, 0), min, max)
}

function weightedDimensionScore(dimensions: ScoreDimension[], type: PracticeType) {
  const weights = type === 'interview' ? interviewRubricWeights : essayRubricWeights
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0)
  return clampScore(
    dimensions.reduce((sum, item) => sum + item.score * (weights[normalizeScoreDimensionName(item.name)] || 0), 0) / totalWeight,
    0,
    100,
  )
}

function buildLocalDimensionScores(answer: string, question: PaperQuestion, paper: RealPaper): ScoreDimension[] {
  const text = answer.trim()
  const isInterview = paper.type === 'interview'
  const targetLength = isInterview ? 450 : Math.max(600, Math.min(question.wordLimit || 900, 1200))
  const lengthRatio = Math.min(text.length / targetLength, 1)
  const structureHits = hitCount(text, ['第一', '第二', '第三', '首先', '其次', '再次', '最后', '一方面', '另一方面', '因此', '总之', '一是', '二是', '三是'])
  const policyHits = hitCount(text, ['以人民为中心', '人民至上', '高质量发展', '基层治理', '数字政府', '法治政府', '群众获得感', '营商环境', '乡村振兴', '共同富裕', '新质生产力'])
  const actionHits = hitCount(text, ['机制', '制度', '清单', '台账', '平台', '监督', '培训', '落实', '闭环', '考核', '反馈', '协同', '问责', '评估'])
  const publicRoleHits = hitCount(text, ['群众', '人民', '服务', '责任', '担当', '依法', '纪律', '组织', '沟通', '协调', '汇报'])
  const problemHits = hitCount(text, ['问题', '原因', '影响', '矛盾', '风险', '短板', '不足', '根源'])
  const prompt = `${question.title}${question.prompt}${question.requirements.join('')}`
  const materialKeywords = Array.from(new Set(prompt.match(/[\u4e00-\u9fa5]{2,6}/g) || []))
    .filter(word => !['什么', '如何', '根据', '材料', '要求', '作答', '问题'].includes(word))
    .slice(0, 12)
  const materialHits = materialKeywords.filter(word => text.includes(word)).length
  const tooShortPenalty = text.length < (isInterview ? 180 : 350) ? -12 : 0

  if (isInterview) {
    return [
      { name: '审题理解', score: scoreFromSignals(38, [lengthRatio * 16, structureHits * 2, problemHits * 4, tooShortPenalty]), comment: '是否准确识别问题情境、身份定位、矛盾焦点和作答任务。' },
      { name: '综合分析', score: scoreFromSignals(36, [lengthRatio * 12, problemHits * 4, policyHits * 3, structureHits * 2, tooShortPenalty]), comment: '是否能辩证分析原因、影响、本质和价值取向。' },
      { name: '逻辑表达', score: scoreFromSignals(40, [lengthRatio * 12, structureHits * 4, hitCount(text, ['首先', '其次', '最后', '同时']) * 2, tooShortPenalty]), comment: '是否层次清楚、表达流畅、过渡自然、重点突出。' },
      { name: '岗位匹配', score: scoreFromSignals(37, [publicRoleHits * 3, policyHits * 3, hitCount(text, ['我会', '作为', '岗位', '职责']) * 3, tooShortPenalty]), comment: '是否体现公职人员意识、群众立场、规矩意识和担当精神。' },
      { name: '应变处置', score: scoreFromSignals(36, [actionHits * 3, hitCount(text, ['现场', '安抚', '核实', '汇报', '跟进', '复盘']) * 4, structureHits * 2, tooShortPenalty]), comment: '是否能稳现场、抓重点、分步骤解决，并形成长效机制。' },
      { name: '语言规范', score: scoreFromSignals(42, [lengthRatio * 10, policyHits * 2, structureHits * 2, hitCount(text, ['空话', '套话', '差不多', '应该吧']) * -4, tooShortPenalty]), comment: '是否语言准确、简洁、自然，少空话套话，适合面试现场口述。' },
    ]
  }

  return [
    { name: '审题立意', score: scoreFromSignals(38, [lengthRatio * 14, problemHits * 3, materialHits * 2, tooShortPenalty]), comment: '是否准确把握题干任务、作答对象、身份立场和中心主旨。' },
    { name: '要点提炼', score: scoreFromSignals(35, [lengthRatio * 12, materialHits * 4, problemHits * 2, tooShortPenalty]), comment: '是否覆盖材料核心信息，概括是否准确、全面、有层次。' },
    { name: '材料运用', score: scoreFromSignals(34, [materialHits * 4, policyHits * 2, problemHits * 2, tooShortPenalty]), comment: '是否把材料信息转化为分析、论证和对策，而不是简单摘抄。' },
    { name: '结构逻辑', score: scoreFromSignals(40, [lengthRatio * 10, structureHits * 4, hitCount(text, ['总之', '因此', '综上']) * 2, tooShortPenalty]), comment: '是否总分清晰、层次递进、段落安排符合阅卷习惯。' },
    { name: '对策可行', score: scoreFromSignals(36, [actionHits * 3, hitCount(text, ['主体', '流程', '保障', '监督', '评价']) * 3, policyHits * 2, tooShortPenalty]), comment: '对策是否具备主体、动作、机制、保障和效果。' },
    { name: '文字表达', score: scoreFromSignals(42, [lengthRatio * 10, policyHits * 2, structureHits * 2, tooShortPenalty]), comment: '语言是否规范、简洁、准确，有无口语化、空泛化和病句。' },
  ]
}

export function fallbackEvaluation(answer: string, question: PaperQuestion, paper: RealPaper): EvaluationResult {
  const dimensions = buildLocalDimensionScores(answer, question, paper)
  const score = weightedDimensionScore(dimensions, paper.type)
  const isInterview = paper.type === 'interview'

  return {
    score,
    level: scoreLevel(score),
    summary: `本题围绕“${question.title}”作答，系统按${isInterview ? '结构化面试/事业编面试' : '申论'}真实阅卷维度综合评估为 ${score} 分。主要提分点在于${isInterview ? '身份定位、综合分析、处置步骤和语言规范' : '要点覆盖、材料转化、结构递进和对策落地'}。`,
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

export function readFavoritePapers(): FavoritePaper[] {
  try {
    const value = localStorage.getItem(FAVORITE_KEY)
    if (!value) return []
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function isFavoritePaper(paperId: string) {
  return readFavoritePapers().some(item => item.paperId === paperId)
}

export function toggleFavoritePaper(paper: RealPaper) {
  const favorites = readFavoritePapers()
  const exists = favorites.some(item => item.paperId === paper.id)
  if (exists) {
    localStorage.setItem(FAVORITE_KEY, JSON.stringify(favorites.filter(item => item.paperId !== paper.id)))
    return false
  }

  const favorite: FavoritePaper = {
    id: `favorite-${paper.id}`,
    paperId: paper.id,
    paperTitle: paper.title,
    type: paper.type,
    systemLabel: paper.systemLabel,
    category: paper.category,
    year: paper.year,
    suggestedMinutes: paper.suggestedMinutes,
    questionCount: paper.questionCount,
    favoritedAt: new Date().toISOString(),
  }
  localStorage.setItem(FAVORITE_KEY, JSON.stringify([favorite, ...favorites].slice(0, 200)))
  return true
}

export function removeFavoritePaper(paperId: string) {
  const favorites = readFavoritePapers().filter(item => item.paperId !== paperId)
  localStorage.setItem(FAVORITE_KEY, JSON.stringify(favorites))
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
  const source = records.flatMap(record => record.dimensions)
  if (!source.length) return []

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

