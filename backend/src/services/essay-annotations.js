// 所有位置均为原始答案的 UTF-16 半开区间，与浏览器 String.slice 一致。
const list = value => Array.isArray(value) ? value : [];
const text = value => typeof value === 'string' ? value.trim() : '';
const round = value => Math.round(value * 10) / 10;
const DIMENSIONS = {
  '要点踩中': 'completeness', '概括准确': 'accuracy', '内容全面': 'coverage',
  '分类逻辑': 'logic', '规范简洁': 'expression', '格式字数身份': 'format',
  '立意': 'thesis', '扣题': 'relevance', '内容': 'content', '论证': 'argumentation',
  '结构': 'structure', '语言': 'expression', '标题与形式': 'format',
};
const ERROR_LABELS = { missed_point: '要点遗漏或不完整', expression: '表达不够准确简洁', logic: '逻辑关系不清', structure: '结构层次不清', accuracy: '材料理解或概括不准', format: '作答规范不足', relevance: '任务回应不足', hit: '命中要点' };

function answerParagraphs(answer) {
  return Array.from(answer.matchAll(/[^\r\n]+/g)).filter(match => match[0].trim()).map((match, index) => ({
    paragraphIndex: index, text: match[0], startOffset: match.index, endOffset: match.index + match[0].length,
  }));
}

function resolveAnchor(answer, candidate) {
  const quote = text(candidate.quote);
  if (!quote || candidate.scope === 'global' || candidate.errorType === 'missed_point' && candidate.partialPoint !== true
    || /全文|全篇|整体|没有写|未写|遗漏|缺少.*层次/.test(text(candidate.title))) return null;
  const paragraphs = answerParagraphs(answer);
  const hasParagraph = candidate.paragraphIndex !== undefined && candidate.paragraphIndex !== null;
  if (hasParagraph && (!Number.isInteger(candidate.paragraphIndex) || !paragraphs[candidate.paragraphIndex])) return null;
  const search = hasParagraph ? [paragraphs[candidate.paragraphIndex]] : paragraphs;
  const matches = [];
  for (const paragraph of search) {
    let offset = paragraph.text.indexOf(quote);
    while (offset !== -1) {
      matches.push({ quote, paragraphIndex: paragraph.paragraphIndex,
        startOffset: paragraph.startOffset + offset, endOffset: paragraph.startOffset + offset + quote.length });
      offset = paragraph.text.indexOf(quote, offset + 1);
    }
  }
  // 重复原文不能靠“取第一个”猜测；不做模糊匹配、空白压缩或标点替换。
  return matches.length === 1 ? matches[0] : null;
}

function errorType(tag) {
  if (/遗漏|不完整/.test(tag)) return 'missed_point';
  if (/结构|分论点/.test(tag)) return 'structure';
  if (/逻辑|分类|层级/.test(tag)) return 'logic';
  if (/格式|字数|身份|主体/.test(tag)) return 'format';
  if (/偏题|对策不对应/.test(tag)) return 'relevance';
  if (/口语|冗长|重复|照抄/.test(tag)) return 'expression';
  return 'accuracy';
}

function dimensionFor(type, dimensions) {
  const preferred = {
    missed_point: ['completeness', 'content'], hit: ['completeness', 'content'],
    accuracy: ['accuracy', 'argumentation'], expression: ['expression'],
    logic: ['logic', 'argumentation'], structure: ['structure', 'logic'],
    format: ['format'], relevance: ['relevance', 'coverage'],
  }[type] || [];
  return preferred.find(id => dimensions.some(d => d.id === id)) || null;
}

function legacyCandidates(report) {
  const candidates = list(report.diagnoses).map(d => ({
    quote: d.original, errorType: errorType(d.tag), title: d.problem, comment: d.reason,
    suggestion: d.rewrite, explanation: d.explanation,
    scope: /遗漏|结构|层级|分论点|超字数/.test(d.tag) || /全文|整体|全篇/.test(d.original) ? 'global' : 'local',
  }));
  // 保留未被主要诊断覆盖的句级问题；有效句不逐句生成批注。
  for (const sentence of list(report.sentenceReviews).filter(s => s.classification !== 'effective')) {
    if (candidates.some(c => c.quote && (c.quote.includes(sentence.text) || sentence.text.includes(c.quote)))) continue;
    candidates.push({ quote: sentence.text, errorType: sentence.classification === 'error' ? 'accuracy' : 'expression',
      title: sentence.issue, comment: sentence.reason, suggestion: sentence.rewrite,
      rubricPointId: sentence.relatedPointIds?.length === 1 ? sentence.relatedPointIds[0] : null });
  }
  return candidates;
}

function buildTrainingPlan(report, dimensions, annotations, items, points) {
  // 统计诊断而非显示片段，评分点关联的重复描述只计一次；得分批注不算失分。
  const evidence = [...annotations, ...items].filter(item => item.errorType !== 'hit' && item.isIssue !== false);
  const unique = new Map();
  for (const item of evidence) {
    const key = `${item.errorType}:${item.rubricPointId || item.issueKey || item.id}`;
    if (!unique.has(key)) unique.set(key, item);
  }
  const distribution = Object.fromEntries(Object.keys(ERROR_LABELS).filter(key => key !== 'hit').map(key => [key, 0]));
  for (const item of unique.values()) distribution[item.errorType] += 1;
  const ranked = Object.entries(distribution).sort((a, b) => b[1] - a[1] ||
    (dimensions.find(d => d.id === dimensionFor(a[0], dimensions))?.percent ?? 100) -
    (dimensions.find(d => d.id === dimensionFor(b[0], dimensions))?.percent ?? 100));
  const primaryType = ranked[0]?.[1] ? ranked[0][0] : null;
  const related = evidence.filter(item => item.errorType === primaryType);
  const relatedPoints = points.filter(p => related.some(item => item.rubricPointId === p.id));
  const examples = related.filter(item => item.suggestion).slice(0, 3).map(item => ({
    evidenceId: item.id, original: item.quote || '原答案未写出或属于整体问题', improved: item.suggestion,
    explanation: item.comment,
  }));
  const focus = relatedPoints.map(p => p.point).join('；') || related[0]?.title || '';
  const methods = {
    missed_point: ['按作答任务逐段检索材料，把主体、动作、对象和限定条件分别圈出。', '遮住参考答案，用自己的话补写下列遗漏或不完整内容，再逐项与材料核对。'],
    expression: ['对照下列原句，删掉重复铺陈，保留主体、核心动作和必要限定词。', '先独立改写，再与老师示例比较；标出删减文字，检查原意和有效信息是否保留。'],
    logic: ['将本题的相关信息分别标成原因、表现、结果或措施，检查是否混在同一层级。', '重排相关句子的顺序，并写出它们之间的关系；对照老师示例说明调整理由。'],
    structure: ['按题干任务给现有各段标注功能，找出缺少、重复或交叉的层次。', '依据老师建议的结构重列本题提纲，再重写一个最弱段落。'],
    accuracy: ['回到下列评分点的材料原文，逐项核对概括的对象、范围和限定条件。', '独立重写对应原句，用材料证据解释每一个关键词为什么保留。'],
    format: ['将题干中的身份、对象、文种和字数要求列成核对表，与当前作答逐项比较。', '按本题老师指出的规范问题重写相关内容，再检查字数与格式。'],
    relevance: ['用一句话重新写出本题要求完成的任务，并标出原答案偏离任务的内容。', '围绕本题任务改写下列内容，逐句说明它回答了题干的哪一项要求。'],
  };
  const weakest = [...dimensions].sort((a, b) => a.percent - b.percent)[0];
  return {
    primaryWeakness: primaryType ? ERROR_LABELS[primaryType] : '巩固已命中的要点与表达',
    primaryErrorType: primaryType, errorTypeDistribution: distribution,
    reason: primaryType ? `本次共识别${distribution[primaryType]}项${ERROR_LABELS[primaryType]}问题，是出现最多的失分类型之一。${weakest ? `${weakest.name}得分${weakest.score}/${weakest.maxScore}，同时作为能力复盘依据。` : ''}` : '本次没有可确认的失分诊断，按已命中的评分点进行限时复述与自查。',
    dimensionScores: dimensions.map(d => ({ dimensionId: d.id, score: d.score, maxScore: d.maxScore })),
    evidenceAnnotationIds: related.filter(item => item.id.startsWith('A')).map(item => item.id),
    evidenceSupplementIds: related.filter(item => item.id.startsWith('T')).map(item => item.id),
    rubricPointIds: relatedPoints.map(p => p.id), missingPoints: points.filter(p => p.status === 'missing').map(p => p.id),
    improvementMethod: primaryType ? methods[primaryType][0] : '遮住参考答案，依据题干任务复述已命中的要点。',
    trainingMethods: [{ target: primaryType ? ERROR_LABELS[primaryType] : '保持要点完整', questionType: report.kind,
      count: 3, exercise: primaryType ? `${methods[primaryType][1]}\n本题练习内容：${focus}` : `限时重答本题，逐项复核：${points.filter(p => p.status === 'covered').map(p => p.point).join('；')}`,
      successCriteria: primaryType ? `完成${related.length}处证据的核对与修改，保留材料原意，并满足本题字数要求。` : '要点覆盖和字数符合本题要求。' }],
    examples,
    checklist: [...relatedPoints.map(p => `是否准确写出“${p.point}”及其必要限定条件？`),
      ...related.filter(item => !item.rubricPointId).slice(0, 4).map(item => `是否已检查并解决：${item.title}？`),
      `是否符合本题${report.wordAnalysis?.wordLimit ? `${report.wordAnalysis.wordLimit}字以内的` : '题干中的'}作答要求？`],
  };
}

function buildGradingResult(report, answer, raw = {}) {
  if (!report || report.reportVersion !== 'essay-v2') return report;
  if (report.gradingResultVersion === 'annotations-v1' && report.originalAnswer === answer) return report;
  const originalAnswer = typeof answer === 'string' ? answer : '';
  const dimensions = list(report.dimensions).map((d, i) => ({ ...d, id: DIMENSIONS[d.name] || `dimension-${i + 1}`, annotationIds: [], supplementIds: [] }));
  const points = list(report.pointAnalysis).map(p => ({ ...p, rubricPointId: p.id, annotationIds: [], supplementIds: [] }));
  const annotations = [], items = [], seen = new Map();
  const native = Array.isArray(raw.annotations);
  const candidates = native ? raw.annotations.filter(c => c && typeof c === 'object' && !Array.isArray(c)) : legacyCandidates(report);
  // 全部要点均保留判定与材料依据，完全没写的点永远进入老师补充。
  for (const point of points) {
    const existing = candidates.find(c => c.rubricPointId === point.id &&
      (c.dimensionId === dimensionFor('hit', dimensions) || !c.dimensionId && ['accuracy', 'hit', 'missed_point'].includes(c.errorType)));
    if (existing && point.status !== 'missing') continue;
    candidates.push({ quote: point.userQuote, scope: point.status === 'missing' ? 'global' : 'local',
      errorType: point.status === 'covered' ? 'hit' : point.status === 'incorrect' ? 'accuracy' : point.status === 'missing' ? 'missed_point' : 'accuracy',
      title: point.status === 'covered' ? `命中：${point.point}` : `${point.status === 'missing' ? '遗漏' : '需完善'}：${point.point}`,
      comment: point.reason, suggestion: point.rewrite, rubricPointId: point.id,
      dimensionId: dimensionFor('hit', dimensions) });
  }
  for (const supplement of list(raw.teacherSupplement?.items)) candidates.push({ ...supplement, scope: 'global' });
  candidates.sort((a, b) => Number(a.errorType === 'hit') - Number(b.errorType === 'hit'));
  const limit = Math.min(12, Math.max(5, Math.ceil(originalAnswer.length / 120)));
  for (const candidate of candidates) {
    const point = points.find(p => p.id === candidate.rubricPointId);
    const partialPoint = point?.status === 'partial' && ['accuracy', 'missed_point', 'hit'].includes(candidate.errorType)
      && (!candidate.dimensionId || candidate.dimensionId === dimensionFor('hit', dimensions));
    const type = point?.status === 'missing' || partialPoint ? 'missed_point' : point && point.status !== 'covered' && candidate.errorType === 'hit' ? 'accuracy'
      : Object.hasOwn(ERROR_LABELS, candidate.errorType) ? candidate.errorType : 'accuracy';
    const title = text(candidate.title) || ERROR_LABELS[type];
    const comment = text(candidate.comment) || text(candidate.reason);
    if (!comment) continue;
    const dimensionId = dimensions.some(d => d.id === candidate.dimensionId) ? candidate.dimensionId : dimensionFor(type, dimensions);
    const anchor = resolveAnchor(originalAnswer, { ...candidate, errorType: type, partialPoint });
    if (type === 'hit' && (!anchor || annotations.length >= limit || annotations.filter(a => a.errorType === 'hit').length >= 2)) continue;
    const key = `${point?.id || ''}:${type}:${type === 'missed_point' && point ? point.status : anchor ? `${anchor.startOffset}:${anchor.endOffset}` : text(candidate.quote)}:${point ? '' : title}`;
    if (seen.has(key)) continue;
    const item = { id: '', dimensionId, dimension: dimensionId, rubricPointId: point?.id || null,
      errorType: type, title, comment, suggestion: text(candidate.suggestion), explanation: text(candidate.explanation),
      isIssue: type !== 'hit', issueKey: point?.id || `${type}:${text(candidate.quote) || title}`,
      evidence: point?.evidence || null, scoreImpact: null };
    // 同一评分点仅由一条诊断说明分值；批注分值是评分点说明，不再次扣分。
    const previousPoint = point && [...annotations, ...items].some(row => row.rubricPointId === point.id && row.scoreImpact);
    if (point && report.kind !== 'article' && !previousPoint && dimensionId === dimensionFor('hit', dimensions)
      && ['accuracy', 'missed_point', 'hit'].includes(type)) item.scoreImpact = {
      earned: point.score, maxScore: point.maxScore, lost: round(point.maxScore - point.score), basis: 'rubric_point',
    };
    if (anchor && annotations.length < limit && (type !== 'hit' || annotations.filter(a => a.errorType === 'hit').length < 2)) {
      Object.assign(item, anchor, { id: `A${annotations.length + 1}` });
      annotations.push(item);
    } else {
      Object.assign(item, { id: `T${items.length + 1}`, quote: anchor?.quote || '',
        placementReason: candidate.scope === 'global' || type === 'missed_point' ? 'global' : anchor ? 'density' : 'unresolved' });
      items.push(item);
    }
    seen.set(key, item.id);
  }
  // 新协议未覆盖的旧诊断保留在补充中，不以旧句子编号强造新锚点。
  if (native) {
    for (const diagnosis of list(report.diagnoses)) {
      if ([...annotations, ...items].some(item => item.title === diagnosis.problem || item.comment === diagnosis.reason)) continue;
      const type = errorType(diagnosis.tag);
      items.push({ id: `T${items.length + 1}`, dimensionId: dimensionFor(type, dimensions), rubricPointId: null, quote: '',
        errorType: type, title: diagnosis.problem, comment: diagnosis.reason, suggestion: diagnosis.rewrite,
        explanation: diagnosis.explanation, isIssue: true, issueKey: `${type}:${diagnosis.original}`, placementReason: 'global' });
    }
  }
  annotations.sort((a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset);
  annotations.forEach((annotation, index) => { annotation.id = `A${index + 1}`; });
  for (const dimension of dimensions) {
    dimension.annotationIds = annotations.filter(a => a.dimensionId === dimension.id && a.isIssue).map(a => a.id);
    dimension.supplementIds = items.filter(t => t.dimensionId === dimension.id && t.isIssue).map(t => t.id);
    if (dimension.score < dimension.maxScore && !dimension.annotationIds.length && !dimension.supplementIds.length) {
      const id = `T${items.length + 1}`;
      const type = { completeness: 'missed_point', coverage: 'relevance', accuracy: 'accuracy', logic: 'logic',
        expression: 'expression', format: 'format', thesis: 'relevance', relevance: 'relevance', content: 'accuracy',
        argumentation: 'logic', structure: 'structure' }[dimension.id] || 'accuracy';
      items.push({ id, dimensionId: dimension.id, rubricPointId: null, quote: '', errorType: type, isIssue: true, dimensionOnly: true,
        title: `${dimension.name} · 维度评价`, comment: dimension.reason, suggestion: '', placementReason: 'global' });
      dimension.supplementIds.push(id);
    }
  }
  for (const point of points) {
    point.annotationIds = annotations.filter(a => a.rubricPointId === point.id).map(a => a.id);
    point.supplementIds = items.filter(t => t.rubricPointId === point.id).map(t => t.id);
    point.sourceAnchor = point.status === 'missing' ? null : resolveAnchor(originalAnswer, { quote: point.userQuote });
  }
  const trainingPlan = buildTrainingPlan(report, dimensions, annotations, items, points);
  const legacyTags = { missed_point: '遗漏要点', expression: '口语冗长', logic: '逻辑层级混乱', structure: '逻辑层级混乱', accuracy: '材料误读', format: '格式不符', relevance: '偏题' };
  const diagnoses = native ? [...annotations, ...items].filter(item => item.isIssue).map(item => ({
    tag: legacyTags[item.errorType], original: item.quote || '', problem: item.title,
    reason: item.comment, rewrite: item.suggestion, explanation: item.explanation || item.comment,
    annotationId: item.id.startsWith('A') ? item.id : null, supplementId: item.id.startsWith('T') ? item.id : null,
  })) : report.diagnoses;
  return { ...report, gradingResultVersion: 'annotations-v1', originalAnswer, dimensions,
    diagnoses, training: trainingPlan.trainingMethods,
    scoreSummary: { score: report.score, maxScore: report.maxScore, level: report.level, summary: report.summary },
    annotations, teacherSupplement: { items, structure: report.structure, wordAnalysis: report.wordAnalysis,
      solutionAnalysis: report.solutionAnalysis, implementationAnalysis: report.implementationAnalysis, articleAnalysis: report.articleAnalysis },
    answerAnalysis: { questionAnalysis: { taskAnalysis: report.reference?.taskAnalysis, requirements: raw.questionRequirements || [] },
      taskBreakdown: report.reference?.outline || [], rubricPoints: points,
      materialBreakdown: points.map(p => ({ rubricPointId: p.id, evidence: p.evidence, explanation: p.explanation })),
      referenceAnswer: report.sampleAnswer, referenceAnswers: report.referenceAnswers },
    trainingPlan,
  };
}

module.exports = { buildGradingResult, resolveAnchor, answerParagraphs, DIMENSIONS };
