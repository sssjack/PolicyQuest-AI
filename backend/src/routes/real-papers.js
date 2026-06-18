const express = require('express');
const { Op } = require('sequelize');
const {
  RealPaper,
  PaperMaterial,
  PaperQuestion,
  RealPaperAttempt,
  RealPaperAttemptAnswer,
} = require('../models');
const { auth } = require('../middleware/auth');
const { gradeAttempt } = require('../services/real-paper-grading');

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
    level: answer.level,
    dimensions: answer.dimensions || [],
    evaluation: answer.evaluation || null,
    report: answer.report || null,
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
    totalDuration: attempt.total_duration,
    submittedAt: attempt.submitted_at,
    completedAt: attempt.completed_at,
    errorMessage: attempt.error_message,
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
      include: [{
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

    return res.json({ code: 200, data: mapAttempt(attempt, true) });
  } catch (e) {
    return res.status(500).json({ code: 500, message: '获取练习报告失败', error: e.message });
  }
});

router.post('/attempts', auth, async (req, res) => {
  try {
    const { paperId, answers = [], totalDuration = 0 } = req.body || {};
    if (!paperId) {
      return res.status(400).json({ code: 400, message: '缺少真题 ID' });
    }

    const paper = await RealPaper.findOne({
      where: { id: paperId, status: 'approved' },
      attributes: PAPER_ATTRIBUTES,
      include: [{
        model: PaperQuestion,
        attributes: QUESTION_ATTRIBUTES,
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

    const answerMap = new Map((Array.isArray(answers) ? answers : []).map(item => [String(item.questionId), item]));
    const missing = questions.filter(question => !String(answerMap.get(String(question.id))?.answer || '').trim());
    if (missing.length) {
      return res.status(400).json({ code: 400, message: '请先填写本卷所有题目后再提交' });
    }

    const attempt = await RealPaperAttempt.create({
      user_id: req.userId,
      paper_id: paper.id,
      practice_type: paper.practice_type,
      paper_title: paper.title,
      status: 'grading',
      total_questions: questions.length,
      answered_count: questions.length,
      graded_count: 0,
      average_score: 0,
      total_duration: Math.max(0, Number(totalDuration) || 0),
      submitted_at: new Date(),
    });

    await RealPaperAttemptAnswer.bulkCreate(questions.map(question => {
      const answerPayload = answerMap.get(String(question.id)) || {};
      return {
        attempt_id: attempt.id,
        user_id: req.userId,
        paper_id: paper.id,
        question_id: question.id,
        question_no: question.question_no,
        question_title: question.title,
        question_prompt: question.prompt,
        user_answer: String(answerPayload.answer || '').trim(),
        duration: Math.max(0, Number(answerPayload.duration) || 0),
        status: 'pending',
      };
    }));

    setImmediate(() => {
      gradeAttempt(attempt.id).catch(error => {
        void RealPaperAttempt.update(
          { status: 'failed', error_message: error.message },
          { where: { id: attempt.id } },
        ).catch(() => undefined);
      });
    });

    return res.status(201).json({ code: 201, data: mapAttempt(attempt) });
  } catch (e) {
    return res.status(500).json({ code: 500, message: '提交真题试卷失败', error: e.message });
  }
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
