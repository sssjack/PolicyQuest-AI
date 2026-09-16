import { normalizeScoreDimensionName, type PracticeRecord, type PracticeType } from './policyQuest'

export interface AbilityNode {
  id: string
  name: string
  score: number | null
  count: number
  children?: AbilityNode[]
}

export const essayTypeNames: Record<string, string> = {
  summary: '归纳概括', analysis: '综合分析', solution: '提出对策', implementation: '贯彻执行', article: '大作文',
}

// Positive scores have ten levels (half a star per level); zero and no samples earn no stars.
export function starLevel(score: number | null | undefined): number {
  if (score == null || !Number.isFinite(score) || score <= 0) return 0
  return Math.max(1, Math.min(10, Math.round(score / 10)))
}

interface Dimension { name: string; score?: number; percent?: number; maxScore?: number }
interface Report {
  score?: number; percentScore?: number; maxScore?: number; reportVersion?: string; kind?: string
  dimensions?: Dimension[]
}
export interface AbilityAttempt {
  type: PracticeType
  answers?: Array<{ status: string; score?: number; report?: Report | null; evaluation?: Report | null; dimensions?: Dimension[] }>
}
interface Sample { type: PracticeType; score: number; kind?: string; dimensions: Array<{ name: string; score: number }> }

function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) }
function clamp(score: number) { return Math.max(0, Math.min(100, score)) }
function sample(type: PracticeType, report: Report, dimensions: Dimension[] = [], fallback?: number): Sample | null {
  const score = report.percentScore ?? (finite(report.score) ? report.score / (report.maxScore || 100) * 100 : fallback)
  if (!finite(score)) return null
  return {
    type, score: clamp(score), kind: report.kind,
    dimensions: (report.dimensions || dimensions).flatMap(d => {
      const value = d.percent ?? (finite(d.score) ? d.score / (d.maxScore || 100) * 100 : undefined)
      return finite(value) ? [{ name: normalizeScoreDimensionName(d.name), score: clamp(value) }] : []
    }),
  }
}

function dimensionNodes(samples: Sample[], prefix: string): AbilityNode[] {
  const groups = new Map<string, number[]>()
  for (const row of samples) for (const d of row.dimensions) {
    const scores = groups.get(d.name) || []
    scores.push(d.score)
    groups.set(d.name, scores)
  }
  return [...groups].map(([name, scores]) => ({ id: `${prefix}:${name}`, name, score: mean(scores), count: scores.length }))
}
function mean(scores: number[]) { return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null }

export function buildAbilityTree(records: PracticeRecord[], attempts: AbilityAttempt[]): AbilityNode[] {
  const samples: Sample[] = []
  // Locally saved records and server attempts are separate practice flows.
  for (const record of records) {
    const row = sample(record.type, record.evaluation, record.dimensions, record.score)
    if (row) samples.push(row)
  }
  for (const attempt of attempts) for (const answer of attempt.answers || []) {
    if (answer.status !== 'graded') continue
    const row = sample(attempt.type, answer.report || answer.evaluation || {}, answer.dimensions, answer.score)
    if (row) samples.push(row)
  }
  return (['essay', 'interview'] as const).map(type => {
    const rows = samples.filter(s => s.type === type)
    const node: AbilityNode = { id: type, name: type === 'essay' ? '申论' : '面试', score: mean(rows.map(r => r.score)), count: rows.length }
    if (type === 'interview') node.children = dimensionNodes(rows, type)
    else {
      const groups = new Map<string, Sample[]>()
      for (const row of rows) {
        const kind = row.kind || 'general'
        groups.set(kind, [...(groups.get(kind) || []), row])
      }
      node.children = [...groups].map(([kind, items]) => ({
        id: `${type}:${kind}`, name: essayTypeNames[kind] || '综合能力',
        score: mean(items.map(r => r.score)), count: items.length, children: dimensionNodes(items, `${type}:${kind}`),
      }))
    }
    return node
  })
}

export function abilityLeaves(nodes: AbilityNode[]): AbilityNode[] {
  return nodes.flatMap(n => n.children?.length ? abilityLeaves(n.children) : n.score === null ? [] : [n])
}
