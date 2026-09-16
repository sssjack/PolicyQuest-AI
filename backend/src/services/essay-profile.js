const { Op } = require('sequelize');
const { RealPaperAttemptAnswer, RealPaper, PaperQuestion } = require('../models');
const { round } = require('./essay-rubric');

async function essayProfile(userId) {
  const rows = await RealPaperAttemptAnswer.findAll({ where: { user_id: userId, status: 'graded' }, attributes: ['id', 'paper_id', 'question_id', 'question_title', 'attempt_id', 'graded_at', 'report'], order: [['graded_at', 'DESC']], limit: 500 });
  const samples = rows.filter(row => row.report?.reportVersion === 'essay-v2');
  const tags = new Map(), types = new Map(), dimensions = new Map();
  let points = 0, hits = 0, misses = 0, incorrect = 0, words = 0, over = 0, limits = 0;
  const mistakes = [];
  for (const row of samples) {
    const r = row.report;
    points += r.coverage.total; hits += r.coverage.covered + r.coverage.partial * 0.5; misses += r.coverage.missing; incorrect += r.coverage.incorrect;
    words += r.wordAnalysis.wordCount; over += r.wordAnalysis.overLimit; limits += r.wordAnalysis.wordLimit;
    const group = types.get(r.kind) || { kind: r.kind, count: 0, total: 0, dimensions: new Map() };
    group.count += 1; group.total += r.percentScore; types.set(r.kind, group);
    for (const d of r.dimensions) {
      const key = `${r.kind === 'article' ? '作文' : '小题'}·${d.name}`;
      const stat = dimensions.get(key) || { name: key, count: 0, total: 0 };
      stat.count += 1; stat.total += d.percent; dimensions.set(key, stat);
      const typeDimension = group.dimensions.get(d.name) || { name: d.name, count: 0, total: 0 };
      typeDimension.count += 1; typeDimension.total += d.percent; group.dimensions.set(d.name, typeDimension);
    }
    for (const tag of new Set(r.diagnoses.map(d => d.tag))) tags.set(tag, (tags.get(tag) || 0) + 1);
    if (r.coverage.missing || r.diagnoses.length) mistakes.push({ answerId: row.id, attemptId: row.attempt_id, paperId: row.paper_id, questionId: row.question_id,
      title: row.question_title, score: r.score, maxScore: r.maxScore, tags: [...new Set(r.diagnoses.map(d => d.tag))], missing: r.coverage.missing,
      training: r.training, gradedAt: row.graded_at });
  }
  const byType = [...types.values()].map(t => ({ kind: t.kind, count: t.count, scoreRate: round(t.total / t.count),
    dimensions: [...t.dimensions.values()].map(d => ({ name: d.name, count: d.count, scoreRate: round(d.total / d.count) })) }));
  const weakest = [...byType].sort((a, b) => a.scoreRate - b.scoreRate)[0];
  const recommendations = weakest ? await PaperQuestion.findAll({
    where: { question_type: `essay_${weakest.kind}`, status: 'approved', id: { [Op.notIn]: samples.map(s => s.question_id) } },
    attributes: ['id', 'paper_id', 'title', 'score', 'word_limit', 'question_type'],
    include: [{ model: RealPaper, attributes: ['id', 'title', 'year', 'region'], where: { status: 'approved', practice_type: 'essay' } }],
    order: [[RealPaper, 'year', 'DESC'], ['id', 'DESC']], limit: 5,
  }) : [];
  return {
    sampleCount: samples.length, windowNote: '统计最近500条已批改答案中的新版申论报告；旧版模板报告不参与诊断指标。',
    hitRate: points ? round(hits / points * 100) : null, omissionRate: points ? round(misses / points * 100) : null,
    correctPointRate: points ? round((points - misses - incorrect) / points * 100) : null,
    averageWords: samples.length ? Math.round(words / samples.length) : null, overLimitRate: limits ? round(over / limits * 100) : null,
    commonErrors: [...tags].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count),
    dimensions: [...dimensions.values()].map(d => ({ name: d.name, count: d.count, scoreRate: round(d.total / d.count) })), byType,
    trend: [...samples].reverse().map(row => ({ answerId: row.id, date: row.graded_at, scoreRate: row.report.percentScore, kind: row.report.kind,
      hitRate: row.report.coverage.hitRate, omissionRate: round(row.report.coverage.missing / row.report.coverage.total * 100) })),
    mistakes, recommendations: recommendations.map(q => ({ questionId: q.id, paperId: q.paper_id, title: q.title, paperTitle: q.RealPaper.title, maxScore: q.score, wordLimit: q.word_limit, kind: weakest.kind })),
  };
}

module.exports = { essayProfile };
