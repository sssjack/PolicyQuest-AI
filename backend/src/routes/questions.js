const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { Question, Article, UserAnswer } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

const QUESTION_CATEGORIES = {
  verbal: ['verbal_main_idea', 'verbal_intent', 'verbal_detail', 'verbal_title', 'verbal_order', 'verbal_connection', 'verbal_fill', 'verbal_word'],
  politics: ['politics_single', 'politics_multi', 'politics_judge', 'politics_fill', 'politics_short', 'politics_policy', 'politics_current', 'politics_document'],
  interview: ['interview_analysis', 'interview_organize', 'interview_emergency', 'interview_interpersonal', 'interview_simulate', 'interview_position', 'interview_policy', 'interview_tax', 'interview_grassroots', 'interview_youth'],
};

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, category, question_type, difficulty, exam_type, status = 'approved' } = req.query;
    const where = { status };
    if (category && QUESTION_CATEGORIES[category]) where.question_type = { [Op.in]: QUESTION_CATEGORIES[category] };
    if (question_type) where.question_type = question_type;
    if (difficulty) where.difficulty = difficulty;
    if (exam_type) where.exam_type = exam_type;

    const { count, rows } = await Question.findAndCountAll({
      where, limit: +pageSize, offset: (+page - 1) * +pageSize,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['answer', 'analysis'] },
      include: [{ model: Article, attributes: ['id', 'title', 'url'] }],
    });
    res.json({ code: 200, data: { total: count, page: +page, pageSize: +pageSize, list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取题目列表失败', error: e.message });
  }
});

router.get('/random', auth, async (req, res) => {
  try {
    const { count = 10, category, difficulty, exam_type } = req.query;
    const where = { status: 'approved' };
    if (category && QUESTION_CATEGORIES[category]) where.question_type = { [Op.in]: QUESTION_CATEGORIES[category] };
    if (difficulty) where.difficulty = difficulty;
    if (exam_type) where.exam_type = exam_type;

    const questions = await Question.findAll({
      where, order: literal('RAND()'), limit: Math.min(+count, 50),
      include: [{ model: Article, attributes: ['id', 'title', 'url'] }],
    });
    res.json({ code: 200, data: questions });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取随机题目失败', error: e.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const total = await Question.count({ where: { status: 'approved' } });
    const byCategory = {};
    for (const [cat, types] of Object.entries(QUESTION_CATEGORIES)) {
      byCategory[cat] = await Question.count({ where: { status: 'approved', question_type: { [Op.in]: types } } });
    }
    const byDifficulty = {
      easy: await Question.count({ where: { status: 'approved', difficulty: 'easy' } }),
      medium: await Question.count({ where: { status: 'approved', difficulty: 'medium' } }),
      hard: await Question.count({ where: { status: 'approved', difficulty: 'hard' } }),
    };
    res.json({ code: 200, data: { total, byCategory, byDifficulty } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取统计失败' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const q = await Question.findByPk(req.params.id, {
      include: [{ model: Article, attributes: ['id', 'title', 'url', 'summary'] }],
    });
    if (!q) return res.status(404).json({ code: 404, message: '题目不存在' });
    res.json({ code: 200, data: q });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取题目失败' });
  }
});

module.exports = router;
