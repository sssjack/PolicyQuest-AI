export interface Annotation {
  id: string
  dimensionId: string | null
  rubricPointId: string | null
  errorType: string
  title: string
  comment: string
  suggestion: string
  explanation?: string
  quote: string
  paragraphIndex: number
  startOffset: number
  endOffset: number
  isIssue: boolean
  scoreImpact?: { earned: number; maxScore: number; lost: number; basis: string } | null
  evidence?: { materialId: string; materialTitle: string; quote: string } | null
}

export interface TeacherSupplementItem extends Omit<Annotation, 'paragraphIndex' | 'startOffset' | 'endOffset'> {
  placementReason: 'global' | 'unresolved' | 'density'
}

export interface GradingResult {
  gradingResultVersion: 'annotations-v1'
  originalAnswer: string
  scoreSummary: { score: number; maxScore: number; level: string; summary: string }
  dimensions: Array<{ id: string; name: string; score: number; maxScore: number; percent: number; reason: string; annotationIds: string[]; supplementIds: string[] }>
  annotations: Annotation[]
  teacherSupplement: { items: TeacherSupplementItem[]; structure: unknown; wordAnalysis: unknown; solutionAnalysis: unknown[]; implementationAnalysis: unknown; articleAnalysis: unknown }
  answerAnalysis: {
    questionAnalysis: { taskAnalysis: string; requirements: string[] }
    taskBreakdown: string[]
    rubricPoints: Array<{ id: string; point: string; status: 'covered' | 'partial' | 'missing' | 'incorrect'; score: number; maxScore: number; annotationIds: string[]; supplementIds: string[] }>
    materialBreakdown: Array<{ rubricPointId: string; evidence: unknown; explanation: string }>
    referenceAnswer: string
    referenceAnswers: unknown[]
  }
  trainingPlan: {
    primaryWeakness: string
    primaryErrorType: string | null
    reason: string
    dimensionScores: Array<{ dimensionId: string; score: number; maxScore: number }>
    errorTypeDistribution: Record<string, number>
    evidenceAnnotationIds: string[]
    evidenceSupplementIds: string[]
    rubricPointIds: string[]
    missingPoints: string[]
    improvementMethod: string
    trainingMethods: Array<{ target: string; questionType: string; count: number; exercise: string; successCriteria: string }>
    examples: Array<{ evidenceId: string; original: string; improved: string; explanation: string }>
    checklist: string[]
  }
}

export const annotationLabels: Record<string, string> = {
  missed_point: '要点不完整', expression: '表达优化', logic: '逻辑关系', structure: '结构层次',
  accuracy: '理解与概括', format: '作答规范', relevance: '回应任务', hit: '命中要点',
}

export function annotationScore(item: Pick<Annotation, 'scoreImpact' | 'errorType'>) {
  if (!item.scoreImpact) return annotationLabels[item.errorType] || '老师评语'
  return item.scoreImpact.lost > 0 ? `−${item.scoreImpact.lost}分` : `+${item.scoreImpact.earned}分`
}
