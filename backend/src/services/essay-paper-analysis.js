const crypto = require('crypto');
const { round, ERROR_TAGS } = require('./essay-rubric');

const VERSION = 'essay-paper-v1';
const KINDS = { summary: '归纳概括', analysis: '综合分析', solution: '问题与对策', implementation: '应用文', article: '大作文' };
const ABILITIES = [
  ['material', '材料理解', ['概括准确', '扣题']],
  ['extraction', '要点提取', ['要点踩中']],
  ['classification', '归纳分类', ['分类逻辑']],
  ['generalization', '概括表达', ['概括准确']],
  ['solution', '对策能力', ['概括准确', '分类逻辑'], ['solution']],
  ['implementation', '应用文能力', ['格式字数身份', '分类逻辑'], ['implementation']],
  ['thesis', '文章立意', ['立意'], ['article']],
  ['argumentation', '论证能力', ['论证'], ['article']],
  ['organization', '结构组织', ['分类逻辑', '结构']],
  ['language', '语言表达', ['规范简洁', '语言']],
];
const level = rate => rate >= 85 ? { grade: 'A', label: '优秀' } : rate >= 75 ? { grade: 'B+', label: '良好' }
  : rate >= 65 ? { grade: 'B', label: '中等偏上' } : rate >= 60 ? { grade: 'C+', label: '基础待巩固' } : { grade: 'C', label: '需要专项提升' };
const arr = value => Array.isArray(value) ? value : [];
const plain = row => row.toJSON ? row.toJSON() : row;

function aggregate(attemptRow, answerRows) {
  const attempt = plain(attemptRow), answers = answerRows.map(plain).sort((a, b) => a.question_no - b.question_no);
  if (attempt.practice_type !== 'essay' || attempt.status !== 'graded' || !answers.length || answers.length !== attempt.total_questions
    || answers.some(a => a.status !== 'graded')) throw new Error('全部题目批改完成后才能生成整卷报告');
  if (answers.some(a => a.report?.reportVersion !== 'essay-v2')) throw new Error('本卷包含旧版百分制报告，请先按原题分值重新批改');
  if (new Set(answers.map(a => a.question_no)).size !== answers.length) throw new Error('本卷题号重复，请核验练习记录');
  const questions = answers.map(a => {
    const r = a.report;
    if (!(r.maxScore > 0) || !Number.isFinite(r.score) || r.score < 0 || r.score > r.maxScore
      || Math.abs(r.score - Number(a.score)) > 0.11 || Math.abs(r.maxScore - Number(a.max_score)) > 0.11
      || !arr(r.dimensions).length || r.dimensions.some(d => !Number.isFinite(d.score) || !Number.isFinite(d.maxScore) || d.maxScore <= 0 || d.score < 0 || d.score > d.maxScore)
      || Math.abs(arr(r.dimensions).reduce((s, d) => s + Number(d.score), 0) - r.score) > 0.11) throw new Error('单题分值校验失败，请检查原题批改结果');
    return { questionNo: a.question_no, questionId: a.question_id, answerId: a.id, title: a.question_title,
      kind: r.kind, type: KINDS[r.kind] || '申论', score: r.score, maxScore: r.maxScore, scoreRate: round(r.score / r.maxScore * 100),
      loss: round(r.maxScore - r.score), level: level(r.score / r.maxScore * 100).label, summary: r.summary,
      dimensions: r.dimensions, diagnoses: arr(r.diagnoses).map((d, i) => ({ id: `Q${a.question_no}.D${i + 1}`, ...d })),
      coverage: r.kind === 'article' ? null : r.coverage, wordAnalysis: r.wordAnalysis,
      duration: Number(a.duration) || 0, training: r.training };
  });
  const totalScore = round(questions.reduce((s, q) => s + q.score, 0));
  const maxScore = round(questions.reduce((s, q) => s + q.maxScore, 0));
  const scoreRate = round(totalScore / maxScore * 100);
  const abilities = ABILITIES.map(([id, name, names, kinds]) => {
    const evidence = questions.filter(q => !kinds || kinds.includes(q.kind)).flatMap(q => q.dimensions
      .filter(d => names.includes(d.name) && d.maxScore > 0).map(d => ({ questionNo: q.questionNo, dimension: d.name,
        score: d.score, maxScore: d.maxScore, reason: d.reason })));
    const cap = evidence.reduce((s, d) => s + d.maxScore, 0);
    const score = cap ? round(evidence.reduce((s, d) => s + d.score, 0) / cap * 10) : null;
    return { id, name, score, grade: score === null ? '—' : level(score * 10).grade, evidence,
      method: cap ? `依据${names.join('、')}分项按满分加权折算；属于关联能力观察指标` : '本卷未考查或缺少可用评分依据' };
  });
  const tags = new Map();
  for (const q of questions) {
    const seen = new Set();
    for (const d of q.diagnoses) {
      const key = `${d.tag}:${String(d.original).replace(/\s/g, '')}:${d.problem}`;
      if (!ERROR_TAGS.includes(d.tag) || seen.has(key)) continue;
      seen.add(key);
      const item = tags.get(d.tag) || { tag: d.tag, count: 0, questions: [], evidence: [] };
      item.count += 1;
      if (!item.questions.includes(q.questionNo)) item.questions.push(q.questionNo);
      item.evidence.push({ questionNo: q.questionNo, ...d });
      tags.set(d.tag, item);
    }
  }
  const errors = [...tags.values()].sort((a, b) => b.questions.length - a.questions.length || b.count - a.count);
  const ranked = abilities.filter(a => a.score !== null).sort((a, b) => b.score - a.score);
  const get = id => abilities.find(a => a.id === id)?.score;
  let persona = '均衡发展型';
  if (scoreRate >= 85) persona = '高分冲刺型';
  else if (scoreRate < 60) persona = '基础巩固型';
  else if (get('extraction') >= 7 && get('generalization') < get('extraction') - 0.5) persona = '材料型';
  else if (ranked[0]?.id === 'language') persona = '表达型';
  else if (['organization', 'classification'].includes(ranked[0]?.id)) persona = '逻辑型';
  else if (['argumentation', 'thesis'].includes(ranked[0]?.id)) persona = '作文型';
  const groups = Object.values(questions.reduce((out, q) => {
    const g = out[q.kind] || { type: q.type, score: 0, maxScore: 0, count: 0 };
    g.score += q.score; g.maxScore += q.maxScore; g.count++; out[q.kind] = g; return out;
  }, {})).map(g => ({ ...g, rate: round(g.score / g.maxScore * 100) })).sort((a, b) => b.rate - a.rate);
  const points = questions.filter(q => q.coverage);
  const pointTotal = points.reduce((s, q) => s + q.coverage.total, 0);
  const words = questions.reduce((s, q) => s + (q.wordAnalysis?.wordCount || 0), 0);
  const duration = questions.reduce((s, q) => s + q.duration, 0);
  return { version: VERSION, attemptId: attempt.id, paperId: attempt.paper_id, title: attempt.paper_title,
    submittedAt: attempt.submitted_at, totalScore, maxScore, scoreRate, ...level(scoreRate), questions, abilities, errors,
    commonErrors: errors.filter(e => e.questions.length > 1).slice(0, 3),
    strengths: ranked.filter(a => a.score >= 7).slice(0, 3), weaknesses: [...ranked].reverse().slice(0, 3), persona,
    bestType: groups[0], largestLoss: [...questions].sort((a, b) => b.loss - a.loss)[0],
    metrics: { words, duration, wordsPerMinute: duration > 0 ? round(words / duration * 60) : null,
      hitRate: pointTotal ? round(points.reduce((s, q) => s + q.coverage.covered + q.coverage.partial * 0.5, 0) / pointTotal * 100) : null,
      omissionRate: pointTotal ? round(points.reduce((s, q) => s + q.coverage.missing, 0) / pointTotal * 100) : null,
      smallRate: groups.filter(g => g.type !== '大作文').reduce((s, g) => s + g.maxScore, 0) ? round(questions.filter(q => q.kind !== 'article').reduce((s, q) => s + q.score, 0) / questions.filter(q => q.kind !== 'article').reduce((s, q) => s + q.maxScore, 0) * 100) : null,
      articleRate: groups.find(g => g.type === '大作文')?.rate ?? null },
    fingerprint: crypto.createHash('sha256').update(JSON.stringify(answers.map(a => [a.id, a.report, a.duration]))).digest('hex'),
    notes: ['按本题组实际题数与满分合计，部分来源题组可能不是完整官方试卷。', '能力分是单题教学评分的关联映射，不是新增官方评分；不同能力可能引用同一分项。',
      '能力类型是本套作答的学习提示，不是固定人格或职业判断。', '无同条件考生样本，不生成排名；训练增分为练习目标，不是成绩承诺。'] };
}

function targetPlan(data, target = round(data.maxScore * 0.75)) {
  if (typeof target !== 'number' || !Number.isFinite(target) || target < 0 || target > data.maxScore) throw new Error(`目标分应为0—${data.maxScore}之间的数字`);
  // 把现有失分的约三分之一作为下一轮练习预算，不让AI编造可保证的增分。
  const rows = data.questions.map(q => { const gain = round(q.loss * 0.35); return { questionNo: q.questionNo, current: q.score,
    target: round(q.score + gain), gain, maxScore: q.maxScore }; });
  const potential = round(rows.reduce((s, q) => s + q.gain, 0));
  return { target: round(target), gap: round(Math.max(0, target - data.totalScore)), reached: data.totalScore >= target,
    potential, rows, method: '下一轮练习目标按各题剩余失分的35%估算，逐题不超过满分；该预算不代表AI预测或保证增分。' };
}

function historySummary(reports) {
  const items = reports.slice(-10);
  const split = Math.floor(items.length / 2), earlier = items.slice(0, split), later = items.slice(split);
  const tags = [...new Set(items.flatMap(r => r.errors.map(e => e.tag)))];
  const avgTag = (group, tag) => group.reduce((s, r) => s + (r.errors.find(e => e.tag === tag)?.count || 0), 0) / group.length;
  const errorTrends = tags.map(tag => {
    const before = earlier.length ? round(avgTag(earlier, tag)) : null;
    const after = later.length ? round(avgTag(later, tag)) : null;
    return { tag, count: items.reduce((s, r) => s + (r.errors.find(e => e.tag === tag)?.count || 0), 0), before, after,
      trend: items.length < 4 ? '样本不足' : after > before ? '上升' : after < before ? '下降' : '持平' };
  }).sort((a, b) => b.count - a.count);
  const metricTrends = ['smallRate', 'articleRate', 'hitRate', 'omissionRate', 'wordsPerMinute'].map(key => {
    const mean = group => { const nums = group.map(r => r.metrics[key]).filter(v => v !== null); return nums.length ? round(nums.reduce((s, v) => s + v, 0) / nums.length) : null; };
    const before = mean(earlier), after = mean(later);
    return { key, before, after, trend: items.length < 4 || before === null || after === null ? '样本不足' : after > before ? '上升' : after < before ? '下降' : '持平' };
  });
  return { count: items.length, recent: items.map(r => ({ attemptId: r.attemptId, title: r.title, submittedAt: r.submittedAt,
    totalScore: r.totalScore, maxScore: r.maxScore, scoreRate: r.scoreRate, grade: r.grade, metrics: r.metrics })), errorTrends, metricTrends,
    note: '最近10套全部完成的新版申论记录；同一套重批只算一次。趋势比较前后两组的每套均值，少于4套不判断趋势；不同题组难度未校准，得分率仅供观察。错误次数按去重后的诊断条目计，不等于扣分次数。' };
}

module.exports = { VERSION, aggregate, targetPlan, historySummary, level };
