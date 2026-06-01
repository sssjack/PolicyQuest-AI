const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { UserAnswer, PracticeSession, Question, WrongQuestion, User } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', auth, async (req, res) => {
  try {
    const user = req.user;
    const totalSessions = await PracticeSession.count({ where: { user_id: req.userId, status: 'completed' } });
    const recentSessions = await PracticeSession.findAll({
      where: { user_id: req.userId, status: 'completed' },
      order: [['created_at', 'DESC']], limit: 7,
      attributes: ['id', 'accuracy', 'total_questions', 'correct_count', 'total_duration', 'created_at'],
    });
    const wrongCount = await WrongQuestion.count({ where: { user_id: req.userId, is_mastered: false } });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAnswers = await UserAnswer.count({ where: { user_id: req.userId, created_at: { [Op.gte]: today } } });
    const todayCorrect = await UserAnswer.count({ where: { user_id: req.userId, created_at: { [Op.gte]: today }, is_correct: true } });

    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAnswers = await UserAnswer.count({ where: { user_id: req.userId, created_at: { [Op.gte]: weekAgo } } });

    const categoryStats = {};
    const categories = {
      verbal: ['verbal_main_idea', 'verbal_intent', 'verbal_detail', 'verbal_title', 'verbal_order', 'verbal_connection', 'verbal_fill', 'verbal_word'],
      politics: ['politics_single', 'politics_multi', 'politics_judge', 'politics_fill', 'politics_short', 'politics_policy', 'politics_current', 'politics_document'],
      interview: ['interview_analysis', 'interview_organize', 'interview_emergency', 'interview_interpersonal', 'interview_simulate', 'interview_position', 'interview_policy', 'interview_tax', 'interview_grassroots', 'interview_youth'],
    };
    for (const [cat, types] of Object.entries(categories)) {
      const total = await UserAnswer.count({
        where: { user_id: req.userId },
        include: [{ model: Question, where: { question_type: { [Op.in]: types } }, attributes: [] }],
      });
      const correct = await UserAnswer.count({
        where: { user_id: req.userId, is_correct: true },
        include: [{ model: Question, where: { question_type: { [Op.in]: types } }, attributes: [] }],
      });
      categoryStats[cat] = { total, correct, accuracy: total > 0 ? (correct / total * 100).toFixed(1) : '0.0' };
    }

    res.json({
      code: 200,
      data: {
        total_questions: user.total_questions,
        correct_count: user.correct_count,
        accuracy: user.total_questions > 0 ? (user.correct_count / user.total_questions * 100).toFixed(1) : '0.0',
        total_sessions: totalSessions,
        wrong_count: wrongCount,
        today: { total: todayAnswers, correct: todayCorrect, accuracy: todayAnswers > 0 ? (todayCorrect / todayAnswers * 100).toFixed(1) : '0.0' },
        week_total: weekAnswers,
        recent_sessions: recentSessions,
        category_stats: categoryStats,
      }
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取统计失败', error: e.message });
  }
});

module.exports = router;
