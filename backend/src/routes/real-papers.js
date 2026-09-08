const express = require('express');
const crypto = require('crypto');
const { PAPER_COST, changeCredits, creditError } = require('../services/credits');
const { Op } = require('sequelize');
const {
  RealPaper,
  PaperMaterial,
  PaperQuestion,
  RealPaperAttempt,
  RealPaperAttemptAnswer,
  sequelize, User, CreditLedger,
} = require('../models');
const { auth } = require('../middleware/auth');
const { gradeAttempt } = require('../services/real-paper-grading');
const { buildGradingResult } = require('../services/essay-annotations');

const router = express.Router();

const PAPER_ATTRIBUTES = [
  'id', 'paper_key', 'practice_type', 'title', 'short_title', 'system', 'system_label',
  'region', 'year', 'category', 'paper_code', 'source_name', 'source_url', 'release_date',
  'difficulty', 'suggested_minutes', 'question_count', 'tags', 'weak_dimensions',
];

const MATERIAL_SUMMARY_ATTRIBUTES = ['id', 'paper_id', 'material_no', 'title', 'summary', 'word_count'];
const MATERIAL_DETAIL_ATTRIBUTES = [
  'id', 'paper_id', 'material_no', 'title', 'summary', 'content', 'word_count', 'source_url',
];
const QUESTION_ATTRIBUTES = [
  'id', 'paper_id', 'question_no', 'question_type', 'title', 'prompt', 'score', 'word_limit',
  'suggested_minutes', 'requirements', 'dimensions', 'sample_answer', 'source_url',
];

function parsePositiveInt(value, defaultValue, maxValue) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return Math.min(parsed, maxValue);
}

function buildWhere(query) {
  const where = { status: 'approved' };
  const { type, system, year, keyword } = query;
  if (query.region && query.region !== 'all') where.region = String(query.region);
  if (query.category && query.category !== 'all') where.category = String(query.category);

  if (['essay', 'interview'].includes(type)) {
    where.practice_type = type;
  }
  if (system && system !== 'all') {
    where.system = system;
  }
  if (year && year !== 'all') {
    const parsedYear = Number.parseInt(year, 10);
    if (Number.isFinite(parsedYear)) {
      where.year = parsedYear;
    }
  }
  if (keyword) {
    const pattern = `%${String(keyword).trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: pattern } },
      { region: { [Op.like]: pattern } },
      { category: { [Op.like]: pattern } },
      { system_label: { [Op.like]: pattern } },
    ];
  }

  return where;
}

function mapPaper(row, includeDetail = false) {
  const paper = row.toJSON();
  const materials = (paper.PaperMaterials || [])
    .sort((a, b) => a.material_no - b.material_no)
    .map(material => ({
      id: material.id,
      title: material.title,
      summary: material.summary,
      content: includeDetail ? material.content : undefined,
      wordCount: material.word_count,
      sourceUrl: material.source_url,
    }));
  const questions = (paper.PaperQuestions || [])
    .sort((a, b) => a.question_no - b.question_no)
    .map(question => ({
      id: question.id,
      questionNo: question.question_no,
      questionType: question.question_type,
      title: question.title,
      prompt: question.prompt,
      score: question.score,
      wordLimit: question.word_limit,
      suggestedMinutes: question.suggested_minutes,
      requirements: question.requirements || [],
      dimensions: question.dimensions || [],
      sampleAnswer: question.sample_answer || '',
      sourceUrl: question.source_url,
    }));

  return {
    id: paper.id,
    paperKey: paper.paper_key,
    type: paper.practice_type,
    title: paper.title,
    shortTitle: paper.short_title || paper.title,
    system: paper.system,
    systemLabel: paper.system_label,
    region: paper.region,
    year: paper.year,
    category: paper.category,
    paperCode: paper.paper_code,
    sourceName: paper.source_name,
    sourceUrl: paper.source_url,
    releaseDate: paper.release_date,
    difficulty: paper.difficulty,
    suggestedMinutes: paper.suggested_minutes,
    questionCount: paper.question_count,
    tags: paper.tags || [],
    weakDimensions: paper.weak_dimensions || [],
    materials,
    questions,
  };
}

function mapAttemptAnswer(row) {
  const answer = row.toJSON ? row.toJSON() : row;
  return {
    id: answer.id,
    attemptId: answer.attempt_id,
    paperId: answer.paper_id,
    questionId: answer.question_id,
    questionNo: answer.question_no,
    questionTitle: answer.question_title,
    questionPrompt: answer.question_prompt,
    answer: answer.user_answer,
    duration: answer.duration,
    status: answer.status,
    score: answer.score,
    maxScore: answer.max_score || 100,
    questionSnapshot: answer.question_snapshot || null,
    level: answer.level,
    dimensions: answer.dimensions || [],
    evaluation: answer.evaluation || null,
    report: buildGradingResult(answer.report, answer.user_answer) || null,
    errorMessage: answer.error_message,
    gradedAt: answer.graded_at,
  };
}

function mapAttempt(row, includeAnswers = false) {
  const attempt = row.toJSON ? row.toJSON() : row;
  const answers = (attempt.RealPaperAttemptAnswers || [])
    .sort((a, b) => a.question_no - b.question_no)
    .map(mapAttemptAnswer);

  return {
    id: attempt.id,
    paperId: attempt.paper_id,
    type: attempt.practice_type,
    paperTitle: attempt.paper_title,
    status: attempt.status,
    totalQuestions: attempt.total_questions,
    answeredCount: attempt.answered_count,
    gradedCount: attempt.graded_count,
    averageScore: attempt.average_score,
    totalScore: attempt.total_score || 0,
    maxScore: attempt.max_score || 0,
    totalDuration: attempt.total_duration,
    submittedAt: attempt.submitted_at,
    completedAt: attempt.completed_at,
    errorMessage: attempt.error_message,
    paperReportStatus: attempt.paper_report_status,
    answers: includeAnswers ? answers : undefined,
  };
}

router.get('/', auth, async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 100000);
    const pageSize = parsePositiveInt(req.query.pageSize, 60, 300);
    const where = buildWhere(req.query);

    const { count, rows } = await RealPaper.findAndCountAll({
      where,
      distinct: true,
      attributes: PAPER_ATTRIBUTES,
      include: [...(['summary', 'analysis', 'solution', 'implementation', 'article'].includes(req.query.questionType) ? [{ model: PaperQuestion, attributes: [], required: true, where: { question_type: `essay_${req.query.questionType}` } }] : []), {
        model: PaperMaterial,
        attributes: MATERIAL_SUMMARY_ATTRIBUTES,
        required: false,
        separate: true,
        order: [['material_no', 'ASC']],
      }],
      order: [
        ['year', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    res.json({
      code: 200,
      data: {
        total: count,
        page,
        pageSize,
        list: rows.map(row => mapPaper(row)),
      },
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取真题列表失败', error: e.message });
  }
});

router.get('/essay-profile', auth, async (req, res) => {
  try { res.json({ code: 200, data: await require('../services/essay-profile').essayProfile(req.userId) }); }
  catch (error) { res.status(500).json({ code: 500, message: '获取申论错误画像失败' }); }
});

router.get('/coverage', auth, async (req, res) => {
  const { REGION_PATTERNS } = require('../seeds/real-paper-importer');
  try {
    const papers = await RealPaper.findAll({ where: { practice_type: 'essay', status: 'approved', year: { [Op.between]: [2022, 2026] } }, attributes: ['id', 'year', 'region', 'category', 'source_url', 'title'] });
    res.json({ code: 200, data: { years: [2022, 2023, 2024, 2025, 2026], total: papers.length,
      rows: ['全国', ...REGION_PATTERNS].map(region => ({ region, years: [2022, 2023, 2024, 2025, 2026].map(year => ({ year,
        papers: papers.filter(p => p.region === region && p.year === year).map(p => ({ id: p.id, title: p.title, category: p.category, sourceUrl: p.source_url })) })) })),
      note: '待补充表示当前缺少可核验的来源，不表示该地区当年没有考试。统计收录题组，部分广东卷仅含主观题，详情有标签。副省级、地市级按国考分类，各省保留实际卷别。' } });
  } catch { res.status(500).json({ code: 500, message: '获取题库覆盖情况失败' }); }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const [essayPapers, interviewPapers, essayQuestions, interviewQuestions] = await Promise.all([
      RealPaper.count({ where: { status: 'approved', practice_type: 'essay' } }),
      RealPaper.count({ where: { status: 'approved', practice_type: 'interview' } }),
      PaperQuestion.count({
        include: [{
          model: RealPaper,
          attributes: [],
          where: { status: 'approved', practice_type: 'essay' },
          required: true,
        }],
      }),
      PaperQuestion.count({
        include: [{
          model: RealPaper,
          attributes: [],
          where: { status: 'approved', practice_type: 'interview' },
          required: true,
        }],
      }),
    ]);

    res.json({
      code: 200,
      data: {
        papers: { essay: essayPapers, interview: interviewPapers, total: essayPapers + interviewPapers },
        questions: {
          essay: essayQuestions,
          interview: interviewQuestions,
          total: essayQuestions + interviewQuestions,
        },
      },
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取真题统计失败', error: e.message });
  }
});

router.get('/attempts', auth, async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 100000);
    const pageSize = parsePositiveInt(req.query.pageSize, 40, 200);
    const where = { user_id: req.userId };

    if (['essay', 'interview'].includes(req.query.type)) {
      where.practice_type = req.query.type;
    }
    const includeAnswers = req.query.includeAnswers === '1';

    const { count, rows } = await RealPaperAttempt.findAndCountAll({
      where,
      include: includeAnswers ? [{
        model: RealPaperAttemptAnswer,
        required: false,
      }] : [],
      distinct: true,
      order: [['submitted_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return res.json({
      code: 200,
      data: {
        total: count,
        page,
        pageSize,
        list: rows.map(row => mapAttempt(row, includeAnswers)),
      },
    });
  } catch (e) {
    return res.status(500).json({ code: 500, message: '获取真题练习历史失败', error: e.message });
  }
});

router.get('/attempts/:id', auth, async (req, res) => {
  try {
    const attempt = await RealPaperAttempt.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [{
        model: RealPaperAttemptAnswer,
        required: false,
      }],
    });

    if (!attempt) {
      return res.status(404).json({ code: 404, message: '练习记录不存在' });
    }

    const data = mapAttempt(attempt, true);
    if (attempt.practice_type === 'essay') {
      const previous = await RealPaperAttemptAnswer.findAll({ where: { user_id: req.userId, status: 'graded',
        question_id: data.answers.map(a => a.questionId), graded_at: { [Op.lt]: attempt.submitted_at } },
        attributes: ['question_id', 'report'], order: [['graded_at', 'DESC']], limit: 500 });
      data.answers = data.answers.map(answer => ({ ...answer, previousRate: previous.find(row => row.question_id === answer.questionId && row.report?.reportVersion === 'essay-v2' && row.report.referenceFingerprint === answer.report?.referenceFingerprint)?.report.percentScore ?? null }));
    }
    return res.json({ code: 200, data });
  } catch (e) {
    return res.status(500).json({ code: 500, message: '获取练习报告失败', error: e.message });
  }
});

router.get('/paper-profile', auth, async (req, res) => {
  try { return res.json({ code: 200, data: await require('../services/essay-paper-report').loadHistory(req.userId) }); }
  catch { return res.status(500).json({ code: 500, message: '获取整卷能力档案失败' }); }
});

router.get('/attempts/:id/paper-report', auth, async (req, res) => {
  try {
    const attempt = await RealPaperAttempt.findOne({ where: { id: req.params.id, user_id: req.userId, practice_type: 'essay' } });
    if (!attempt) return res.status(404).json({ code: 404, message: '申论练习不存在' });
    return res.json({ code: 200, data: await require('../services/essay-paper-report').reportView(attempt) });
  } catch { return res.status(500).json({ code: 500, message: '获取整卷诊断报告失败' }); }
});

router.post('/attempts/:id/paper-report', auth, async (req, res) => {
  try {
    const attempt = await RealPaperAttempt.findOne({ where: { id: req.params.id, user_id: req.userId, practice_type: 'essay' } });
    if (!attempt) return res.status(404).json({ code: 404, message: '申论练习不存在' });
    if (attempt.status !== 'graded') return res.status(409).json({ code: 409, message: '请先完成全部单题批改' });
    const worker = require('../services/essay-paper-report');
    try { await worker.loadData(attempt); } catch (e) { return res.status(422).json({ code: 422, message: e.message }); }
    await RealPaperAttempt.update({ paper_report_status: 'pending', paper_report_error: null }, { where: { id: attempt.id, paper_report_status: 'failed', status: 'graded' } });
    worker.enqueuePaperReport(attempt.id);
    return res.status(202).json({ code: 202, message: '整卷诊断已安排生成，单题分数保持不变' });
  } catch { return res.status(500).json({ code: 500, message: '启动整卷诊断失败' }); }
});

router.put('/attempts/:id/paper-target', auth, async (req, res) => {
  try {
    const attempt = await RealPaperAttempt.findOne({ where: { id: req.params.id, user_id: req.userId, practice_type: 'essay', status: 'graded' } });
    if (!attempt?.paper_report?.structured) return res.status(404).json({ code: 404, message: '尚无可设置目标的整卷报告' });
    let goal;
    try { goal = require('../services/essay-paper-analysis').targetPlan(attempt.paper_report.structured, req.body?.target); }
    catch (e) { return res.status(400).json({ code: 400, message: e.message }); }
    if (req.body?.target === undefined) return res.status(400).json({ code: 400, message: '请填写目标分' });
    await attempt.update({ target_score: goal.target });
    return res.json({ code: 200, data: goal });
  } catch { return res.status(500).json({ code: 500, message: '保存目标分失败' }); }
});

router.post('/attempts', auth, async (req, res) => {
  try {
    const { paperId, answers = [], totalDuration = 0, requestId } = req.body || {};
    if (typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) return res.status(400).json({ code: 400, message: '提交标识无效，请刷新后重试，草稿会保留' });
    if (!paperId) {
      return res.status(400).json({ code: 400, message: '缺少真题 ID' });
    }

    const paper = await RealPaper.findOne({
      where: { id: paperId, status: 'approved' },
      attributes: PAPER_ATTRIBUTES,
      include: [{
        model: PaperQuestion,
        attributes: QUESTION_ATTRIBUTES,
        where: { status: 'approved' },
        required: false,
        separate: true,
        order: [['question_no', 'ASC']],
      }],
    });

    if (!paper) {
      return res.status(404).json({ code: 404, message: '真题不存在' });
    }
    const questions = (paper.PaperQuestions || []).sort((a, b) => a.question_no - b.question_no);
    if (!questions.length) {
      return res.status(400).json({ code: 400, message: '本卷暂无题目，无法提交' });
    }
    if (paper.practice_type === 'essay' && questions.some(q => !Number.isFinite(Number(q.score)) || Number(q.score) <= 0)) return res.status(422).json({ code: 422, message: '原题分值尚未核验，暂不能提交评分' });

    const answerMap = new Map((Array.isArray(answers) ? answers : []).map(item => [String(item.questionId), item]));
    const missing = questions.filter(question => !String(answerMap.get(String(question.id))?.answer || '').trim());
    if (missing.length) {
      return res.status(400).json({ code: 400, message: '请先填写本卷所有题目后再提交' });
    }

    const requestHash = crypto.createHash('sha256').update(JSON.stringify({ paperId: String(paper.id),
      answers: questions.map(q => [String(q.id), String(answerMap.get(String(q.id))?.answer || '').trim()]) })).digest('hex');
    let isNew = false;
    const attempt = await sequelize.transaction(async transaction => {
      // 同一用户串行扣费，并在网络重试时返回原作答，防止重复扣分和创建任务。
      await User.findByPk(req.userId, { transaction, lock: transaction.LOCK.UPDATE });
      const previous = await CreditLedger.findOne({ where: { user_id: req.userId, request_key: `paper:${requestId}` }, transaction });
      if (previous) {
        if (previous.request_hash !== requestHash) throw creditError(409, '提交内容已变化，请刷新后重新提交');
        return RealPaperAttempt.findByPk(previous.reference_id, { transaction });
      }
      const created = await RealPaperAttempt.create({
        user_id: req.userId,
        paper_id: paper.id,
        practice_type: paper.practice_type,
        paper_title: paper.title,
        status: 'grading',
        total_questions: questions.length,
        answered_count: questions.length,
        graded_count: 0,
        average_score: 0,
        max_score: questions.reduce((sum, q) => sum + Number(q.score || 100), 0),
        total_duration: Math.max(0, Number(totalDuration) || 0),
        submitted_at: new Date(),
      }, { transaction });

      await RealPaperAttemptAnswer.bulkCreate(questions.map(question => {
        const answerPayload = answerMap.get(String(question.id)) || {};
        return {
          attempt_id: created.id,
          user_id: req.userId,
          paper_id: paper.id,
          question_id: question.id,
          question_no: question.question_no,
          question_title: question.title,
          question_prompt: question.prompt,
          user_answer: String(answerPayload.answer || '').trim(),
          duration: Math.max(0, Number(answerPayload.duration) || 0),
          status: 'pending',
          max_score: Number(question.score),
          question_snapshot: question.toJSON(),
        };
      }), { transaction });
      const entry = await changeCredits({ userId: req.userId, delta: -PAPER_COST,
        reason: '真题整卷提交', requestKey: `paper:${requestId}`, referenceId: created.id }, transaction);
      await entry.update({ request_hash: requestHash }, { transaction });
      isNew = true;
      return created;
    });

    if (isNew) setImmediate(() => {
      gradeAttempt(attempt.id).catch(error => {
        void RealPaperAttempt.update(
          { status: 'failed', error_message: error.message },
          { where: { id: attempt.id } },
        ).catch(() => undefined);
      });
    });

    return res.status(201).json({ code: 201, data: mapAttempt(attempt) });
  } catch (e) {
    return res.status(e.status || 500).json({ code: e.status || 500, message: e.status ? e.message : '提交真题试卷失败，请稍后重试' });
  }
});

router.post('/attempts/:id/regrade', auth, async (req, res) => {
  try {
    const attempt = await RealPaperAttempt.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!attempt) return res.status(404).json({ code: 404, message: '练习不存在' });
    const claimed = await sequelize.transaction(async transaction => {
      const [count] = await RealPaperAttempt.update({ status: 'grading', error_message: null, paper_report: null, paper_report_status: 'pending', paper_report_token: null, paper_report_error: null, target_score: null }, { where: { id: attempt.id, user_id: req.userId, status: { [Op.ne]: 'grading' } }, transaction });
      if (count) await RealPaperAttemptAnswer.update({ status: 'pending', report: null, evaluation: null, score: null, error_message: null }, { where: { attempt_id: attempt.id, ...(attempt.status === 'failed' ? { status: { [Op.ne]: 'graded' } } : {}) }, transaction });
      return count;
    });
    if (!claimed) return res.status(409).json({ code: 409, message: '本卷正在批改，请等待完成' });
    setImmediate(() => { void gradeAttempt(attempt.id).catch(() => RealPaperAttempt.update({ status: 'failed', error_message: '批改中断，请重试' }, { where: { id: attempt.id } })).catch(() => undefined); });
    return res.json({ code: 200, message: '已重新提交批改' });
  } catch { return res.status(500).json({ code: 500, message: '重新批改失败' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const paper = await RealPaper.findOne({
      where: { id: req.params.id, status: 'approved' },
      attributes: PAPER_ATTRIBUTES,
      include: [
        {
          model: PaperMaterial,
          attributes: MATERIAL_DETAIL_ATTRIBUTES,
          required: false,
          separate: true,
          order: [['material_no', 'ASC']],
        },
        {
          model: PaperQuestion,
          attributes: QUESTION_ATTRIBUTES,
        where: { status: 'approved' },
          required: false,
          separate: true,
          order: [['question_no', 'ASC']],
        },
      ],
    });

    if (!paper) {
      return res.status(404).json({ code: 404, message: '真题不存在' });
    }

    return res.json({ code: 200, data: mapPaper(paper, true) });
  } catch (e) {
    return res.status(500).json({ code: 500, message: '获取真题详情失败', error: e.message });
  }
});

module.exports = router;
