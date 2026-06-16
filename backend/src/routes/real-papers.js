const express = require('express');
const { Op } = require('sequelize');
const { RealPaper, PaperMaterial, PaperQuestion } = require('../models');
const { auth } = require('../middleware/auth');

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
