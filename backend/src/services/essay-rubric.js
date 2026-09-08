const crypto = require('crypto');
const { buildGradingResult } = require('./essay-annotations');

const VERSION = 'essay-v2';
const SMALL_RUBRICS = [
  ['要点踩中', 50], ['概括准确', 15], ['内容全面', 10],
  ['分类逻辑', 10], ['规范简洁', 10], ['格式字数身份', 5],
];
const ARTICLE_RUBRICS = [
  ['立意', 25], ['扣题', 15], ['内容', 10], ['论证', 20],
  ['结构', 15], ['语言', 10], ['标题与形式', 5],
];
const ERROR_TAGS = [
  '遗漏要点', '概括层级低', '照抄材料', '分类交叉', '观点重复', '对策不对应',
  '主体错位', '口语冗长', '逻辑层级混乱', '超字数', '格式不符', '偏题',
  '论证不足', '分论点重复', '材料误读', '原因遗漏', '结论不完整',
];
const round = n => Math.round((Number(n) || 0) * 10) / 10;
const compact = value => String(value || '').normalize('NFKC').replace(/\s/g, '');
const countWords = value => Array.from(String(value || '').replace(/\s/g, '')).length;
const text = value => typeof value === 'string' ? value.trim() : '';
const list = value => Array.isArray(value) ? value : [];

function questionKind(question = {}) {
  const prompt = String(question.prompt || '');
  if (/写一篇[\s\S]{0,40}(文章|议论文)|自拟(题目|标题)[\s\S]{0,80}(文章|议论文)|撰写[\s\S]{0,20}议论文/.test(prompt)) return 'article';
  if (/讲话稿|发言稿|汇报提纲|宣传稿|倡议书|建议书|工作简报|调研报告|情况报告|短评|编者按|通知|公开信|草拟[\s\S]{0,30}条例|撰写[\s\S]{0,20}提纲|拟写|起草|宣传报道稿/.test(prompt)) return 'implementation';
  if (/概括|归纳|总结/.test(prompt) && !/提出[\s\S]{0,15}(对策|建议)/.test(prompt)) return 'summary';
  if (/提出[\s\S]{0,25}(对策|建议|措施)|解决[\s\S]{0,20}(问题|建议)/.test(prompt)) return 'solution';
  if (/分析|理解|为什么|谈谈|解释/.test(prompt)) return 'analysis';
  const kind = String(question.question_type || question.questionType || '').replace('essay_', '');
  return ['article', 'implementation', 'solution', 'analysis', 'summary'].includes(kind) ? kind : 'summary';
}

function allocate(total, weights) {
  const units = Math.round(total * 10);
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => units * w / sum);
  const result = raw.map(Math.floor);
  const order = raw.map((n, i) => ({ i, remainder: n - result[i] })).sort((a, b) => b.remainder - a.remainder);
  const remaining = units - result.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i += 1) result[order[i].i] += 1;
  return result.map(n => n / 10);
}

function prepareQuestion(question, materials = []) {
  const maxScore = Number(question.score);
  if (!Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 100) throw new Error('原题分值缺失或无效，请先核验题库分值');
  const wordLimit = Number(question.word_limit || question.wordLimit) || 0;
  const kind = questionKind(question);
  const range = `${question.prompt || ''} ${list(question.requirements).join(' ')}`.normalize('NFKC').match(/(\d{3,4})\s*[-—–~～至到]\s*(\d{3,4})\s*字|不少于\s*(\d{3,4})\s*字/);
  const minWords = range ? Number(range[1] || range[3]) : (kind === 'article' && wordLimit ? Math.floor(wordLimit * 0.8) : 0);
  const rubric = kind === 'article' ? ARTICLE_RUBRICS : SMALL_RUBRICS;
  const caps = allocate(maxScore, rubric.map(row => row[1]));
  const sourceMaterials = materials.map((m, i) => ({
    id: `M${m.material_no || i + 1}`, title: m.title || `材料${i + 1}`,
    content: text(m.content), sourceUrl: m.source_url || m.sourceUrl || '',
  })).filter(m => m.content);
  sourceMaterials.forEach(m => { m.paragraphs = m.content.split(/\n+/).map(text).filter(Boolean).map((content, i) => ({ id: `${m.id}.P${i + 1}`, text: content })); });
  if (!sourceMaterials.length) throw new Error('缺少给定材料，无法进行有依据的申论批改');
  if (sourceMaterials.reduce((n, m) => n + m.content.length, 0) > 90000) throw new Error('材料过长，请先核验试卷材料分段');
  return { kind, maxScore, wordLimit, minWords, title: question.title, prompt: question.prompt,
    requirements: list(question.requirements), sourceUrl: question.source_url || question.sourceUrl || '',
    dimensions: rubric.map(([name, weight], i) => ({ name, weight, maxScore: caps[i] })), materials: sourceMaterials };
}

function fingerprint(context) {
  return crypto.createHash('sha256').update(JSON.stringify({ version: VERSION, context })).digest('hex');
}

function evidence(quote, materialId, context, evidenceIds = []) {
  const value = text(quote);
  const material = context.materials.find(m => m.id === materialId);
  if (value && material && compact(material.content).includes(compact(value))) return { materialId, materialTitle: material.title, quote: value, sourceUrl: material.sourceUrl };
  const paragraphs = list(evidenceIds).map(id => material?.paragraphs.find(p => p.id === id));
  if (paragraphs.length && paragraphs.every(Boolean)) return { materialId, materialTitle: material.title, quote: paragraphs.map(p => p.text).join('\n'), evidenceIds, sourceUrl: material.sourceUrl };
  throw new Error(`批改材料引用未通过原文校验：${materialId}。请用该材料提供的真实段落id填写evidenceIds，quote可留空`);
}

function normalizeReference(raw, context) {
  if (!raw || !text(raw.taskAnalysis)) throw new Error('缺少题干任务分析');
  const points = list(raw.points);
  if (!points.length || points.length > 30) throw new Error('参考要点数量无效');
  const pointCaps = allocate(context.kind === 'article' ? 0 : context.dimensions[0].maxScore, points.map(p => Math.max(1, Number(p.importance) || 1)));
  return {
    taskAnalysis: text(raw.taskAnalysis), sourceLabel: 'AI依据给定材料提炼的参考要点（非官方评分细则）',
    points: points.map((p, i) => {
      if (!text(p.point) || !text(p.explanation)) throw new Error('参考要点缺少概括或提炼说明');
      return { id: `P${i + 1}`, point: text(p.point), explanation: text(p.explanation),
        category: text(p.category), maxScore: pointCaps[i], evidence: evidence(p.quote, p.materialId, context, p.evidenceIds || (p.paragraphId ? [p.paragraphId] : [])) };
    }),
    outline: list(raw.outline).map(text).filter(Boolean),
  };
}

function splitSentences(answer) {
  return (String(answer).match(/[^。！？；\n]+[。！？；]?|[^\n]+$/g) || [])
    .map(value => value.trim()).filter(Boolean).map((value, i) => ({ id: `S${i + 1}`, text: value }));
}

function requireText(value, name) {
  if (!text(value)) throw new Error(`批改报告缺少${name}`);
  return text(value);
}

function groundedOriginal(value, ids, sentences, answer) {
  const original = text(value);
  if (original && compact(answer).includes(compact(original))) return original;
  const selected = list(ids).map(id => sentences.find(s => s.id === id));
  if (selected.length && selected.every(Boolean)) return selected.map(s => s.text).join('\n');
  if (['全文', '全篇', '整篇', '整篇文章'].includes(original)) return answer;
  const fragments = original.split(/[／/]|\n|[…]{2,}|\.{3,}/).map(text).filter(Boolean);
  if (fragments.length > 1 && fragments.every(fragment => compact(answer).includes(compact(fragment)))) return fragments.map((fragment, i) => `【原文片段${i + 1}】${fragment}`).join('\n');
  throw new Error('诊断引用的考生原文不存在，请改用准确的sentenceIds');
}

function normalizeAnswers(items, context) {
  return ['safe', 'improved', 'compressed'].map(kind => {
    const item = list(items).find(r => r.kind === kind);
    return normalizeAnswer(item, context, kind);
  });
}

function normalizeAnswer(item, context, kind) {
    if (!item) throw new Error('缺少三个版本的参考答案');
    const content = requireText(item.content, '完整参考答案');
    const wordCount = countWords(content);
    if (context.wordLimit && wordCount > context.wordLimit) throw new Error(`${kind}参考答案${wordCount}字，超过原题字数上限${context.wordLimit}`);
    if (kind !== 'compressed' && wordCount < context.minWords) throw new Error(`${kind}完整参考答案不足${context.minWords}字，目前${wordCount}字`);
    const breakdown = list(item.breakdown).map(part => ({ text: requireText(part.text, '拆解内容'), reason: requireText(part.reason, '拆解原因'), pointIds: list(part.pointIds) }));
    if (!breakdown.length) throw new Error('参考答案缺少逐段拆解');
    return { kind, label: { safe: '考场稳妥版', improved: '高分优化版', compressed: context.kind === 'article' ? '压缩提纲版（非完整考场作文）' : '极限压缩版' }[kind],
      content, wordCount, thinking: requireText(item.thinking, '参考答案组织思路'), tradeoff: requireText(item.tradeoff, '版本取舍说明'), breakdown };
}

function normalizeReport(raw, context, reference, answer) {
  if (!raw || typeof raw !== 'object') throw new Error('AI未返回有效报告');
  const sentences = splitSentences(answer);
  const rawPoints = list(raw.pointAnalysis);
  const pointAnalysis = reference.points.map(point => {
    const item = rawPoints.find(p => p.pointId === point.id);
    if (!item) throw new Error(`缺少${point.id}的采点分析`);
    const status = ['covered', 'partial', 'missing', 'incorrect'].includes(item.status) ? item.status : null;
    if (!status) throw new Error('采点状态无效');
    let quote = '';
    if (status !== 'missing') {
      try { quote = groundedOriginal(item.userQuote, item.sentenceIds || (item.sentenceId ? [item.sentenceId] : []), sentences, answer); }
      catch { throw new Error(`${point.id}采点分析引用的考生原文不存在，请填写准确的sentenceIds；不得拼接或改写原文`); }
    }
    const earned = status === 'covered' ? point.maxScore : status === 'partial' ? round(point.maxScore * 0.5) : 0;
    return { ...point, status, userQuote: status === 'missing' ? '' : quote, score: earned,
      reason: requireText(item.reason, '采点判定原因'), rewrite: requireText(item.rewrite, '该要点的具体改写') };
  });
  const dimensions = context.dimensions.map((dimension, i) => {
    const item = list(raw.dimensions).find(d => d.name === dimension.name);
    if (!item || !Number.isFinite(Number(item.score))) throw new Error(`缺少${dimension.name}评分`);
    const score = context.kind !== 'article' && i === 0
      ? round(pointAnalysis.reduce((sum, p) => sum + p.score, 0)) : round(Number(item.score));
    if (score < 0 || score > dimension.maxScore) throw new Error('维度得分超出本题分值');
    return { ...dimension, score, percent: round(score / dimension.maxScore * 100), reason: requireText(item.reason, '维度评分依据') };
  });
  const score = round(dimensions.reduce((sum, d) => sum + d.score, 0));
  const reviews = list(raw.sentenceReviews);
  const sentenceReviews = sentences.map(sentence => {
    const item = reviews.find(r => r.sentenceId === sentence.id);
    if (!item) throw new Error(`缺少${sentence.id}的逐句批注，标题句也必须覆盖；必须返回全部${sentences.length}个S编号`);
    const classification = item.classification === 'partial' ? 'mixed' : item.classification;
    if (!['effective', 'mixed', 'redundant', 'background', 'irrelevant', 'error'].includes(classification)) throw new Error(`${sentence.id}的classification只能是effective、mixed、redundant、background、irrelevant、error其中一个英文值`);
    return { ...sentence, classification, issue: requireText(item.issue, '逐句诊断'),
      rewrite: requireText(item.rewrite, '逐句改写'), reason: requireText(item.reason, '改写理由'),
      relatedPointIds: list(item.relatedPointIds).filter(id => reference.points.some(p => p.id === id)) };
  });
  const diagnoses = list(raw.diagnoses).map(item => {
    const globalIssue = item.scope === 'global' || /遗漏|结构|层级|分论点|超字数/.test(item.tag);
    const original = globalIssue ? '' : groundedOriginal(item.original, item.sentenceIds || (item.sentenceId ? [item.sentenceId] : []), sentences, answer);
    return { tag: ERROR_TAGS.includes(item.tag) ? item.tag : '材料误读', original,
      problem: requireText(item.problem, '具体问题'), reason: requireText(item.reason, '失分原因'),
      rewrite: requireText(item.rewrite, '完整替换表达'), explanation: requireText(item.explanation, '这样改的原因') };
  });
  const referenceAnswers = normalizeAnswers(raw.referenceAnswers, context);
  const wordCount = countWords(answer);
  const countCategory = category => sentenceReviews.filter(s => s.classification === category).reduce((sum, s) => sum + countWords(s.text), 0);
  const covered = pointAnalysis.filter(p => p.status === 'covered').length;
  const partial = pointAnalysis.filter(p => p.status === 'partial').length;
  const mixed = countCategory('mixed');
  const effective = countCategory('effective') + Math.round(mixed / 2);
  const repeated = countCategory('redundant');
  const percentScore = round(score / context.maxScore * 100);
  const summary = typeof raw.summary === 'string' ? raw.summary : Object.entries(raw.summary || {})
    .filter(([key]) => !/score|rank|percent|分数|排名/i.test(key))
    .flatMap(([, value]) => typeof value === 'string' ? [value] : Array.isArray(value) ? value.filter(v => typeof v === 'string') : []).join('；');
  const level = percentScore >= 85 ? '优秀' : percentScore >= 70 ? '良好' : percentScore >= 60 ? '中等' : '待提升';
  const spread = Math.max(1, Math.round(context.maxScore * 0.08));
  const structure = raw.structure || {};
  const article = context.kind === 'article' ? raw.articleAnalysis : null;
  if (context.kind === 'article' && (!article || !list(article.paragraphs).length || !list(article.checks).length)) throw new Error('缺少大作文专项诊断');
  if (context.kind === 'solution' && !list(raw.solutionAnalysis).length) throw new Error('缺少问题—原因—对策对应分析');
  if (context.kind === 'implementation' && !text(raw.implementationAnalysis?.diagnosis)) throw new Error('缺少公文身份格式诊断');
  if (percentScore < 85 && !diagnoses.length && !list(raw.annotations).length && !list(raw.teacherSupplement?.items).length) throw new Error('失分答案缺少具体诊断与改写');
  if (!list(structure.outline).length) throw new Error('缺少具体结构拆分');
  const training = list(raw.training).map(t => ({ target: requireText(t.target, '训练目标'),
    questionType: ['summary', 'analysis', 'solution', 'implementation', 'article'].includes(t.questionType) ? t.questionType : context.kind,
    count: Math.max(1, Math.min(10, Math.round(Number(t.count) || 3))), exercise: requireText(t.exercise, '训练操作'), successCriteria: requireText(t.successCriteria, '训练验收标准') }));
  if (!training.length) throw new Error('缺少后续训练建议');
  return buildGradingResult({
    reportVersion: VERSION, reportType: 'essay', gradingSource: 'ai', kind: context.kind,
    score, maxScore: context.maxScore, percentScore, level, summary: requireText(summary, '总评'),
    scoreInterval: { low: Math.max(0, Math.floor(score - spread)), high: Math.min(context.maxScore, Math.ceil(score + spread)),
      label: '参考估分区间', note: '围绕中心估分按题目满分约8%（至少1分）给出波动范围，未经真人阅卷校准，不是统计置信区间。' },
    ranking: { available: false, note: '暂无同题同条件的真实排名样本，以水平判断代替排名。' },
    rubricNote: '教学评阅量表，非官方评分细则。小题采点：覆盖得该点全分、部分覆盖得一半、遗漏或错误得0分；其他维度不重复扣同一遗漏。大作文按七维量表评阅。',
    dimensions, reference, pointAnalysis, diagnoses, sentenceReviews,
    structure: { detected: requireText(structure.detected, '原答案结构'), recommended: requireText(structure.recommended, '建议结构'),
      analysis: requireText(structure.analysis, '结构与层级分析'),
      outline: list(structure.outline).map(part => ({ title: requireText(part.title, '结构节点'), detail: requireText(part.detail, '节点展开') })),
      relations: list(structure.relations).map(r => ({ from: text(r.from), to: text(r.to), relation: text(r.relation), issue: text(r.issue), fix: text(r.fix) })) },
    solutionAnalysis: list(raw.solutionAnalysis), implementationAnalysis: raw.implementationAnalysis || null,
    articleAnalysis: article, referenceAnswers, sampleAnswer: referenceAnswers[1].content,
    wordAnalysis: { wordCount, wordLimit: context.wordLimit, minWords: context.minWords, underMinimum: Math.max(0, context.minWords - wordCount), overLimit: context.wordLimit ? Math.max(0, wordCount - context.wordLimit) : 0,
      effectiveWords: effective, mixedWords: mixed, redundantWords: repeated, backgroundWords: countCategory('background'), irrelevantWords: countCategory('irrelevant'), errorWords: countCategory('error'),
      effectiveRatio: wordCount ? round(effective / wordCount * 100) : 0, redundantRatio: wordCount ? round(repeated / wordCount * 100) : 0,
      pointsPer100Words: wordCount ? round((covered + partial) / wordCount * 100) : 0,
      method: '按非空白字符计数，标点计入；AI逐句分类，部分有效句暂按一半字数计入有效信息，因此比例仅为估算，不等同官方阅卷规则。' },
    coverage: { total: pointAnalysis.length, covered, partial, missing: pointAnalysis.filter(p => p.status === 'missing').length,
      incorrect: pointAnalysis.filter(p => p.status === 'incorrect').length, hitRate: round((covered + partial * 0.5) / pointAnalysis.length * 100) },
    training, limitations: ['文本提交可检查标题、段落、错字及字数，无法评判手写字迹和真实卷面。', '参考答案为AI生成的教学示例，不是官方唯一答案。'],
  }, answer, { ...raw, questionRequirements: context.requirements });
}

module.exports = { VERSION, SMALL_RUBRICS, ARTICLE_RUBRICS, ERROR_TAGS, round, countWords, questionKind, allocate, prepareQuestion, fingerprint, normalizeReference, splitSentences, normalizeReport, normalizeAnswers, normalizeAnswer };
