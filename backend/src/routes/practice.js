const express = require('express');
const { Op, literal } = require('sequelize');
const { PracticeSession, UserAnswer, Question, User, WrongQuestion, sequelize } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

const QUESTION_CATEGORIES = {
  verbal: ['verbal_main_idea', 'verbal_intent', 'verbal_detail', 'verbal_title', 'verbal_order', 'verbal_connection', 'verbal_fill', 'verbal_word'],
  politics: ['politics_single', 'politics_multi', 'politics_judge', 'politics_fill', 'politics_short', 'politics_policy', 'politics_current', 'politics_document'],
  interview: ['interview_analysis', 'interview_organize', 'interview_emergency', 'interview_interpersonal', 'interview_simulate', 'interview_position', 'interview_policy', 'interview_tax', 'interview_grassroots', 'interview_youth'],
};

router.post('/start', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { session_type = 'quick', count = 10, category, difficulty, exam_type, timed = false, time_limit } = req.body;
    const where = { status: 'approved' };
    if (category && QUESTION_CATEGORIES[category]) where.question_type = { [Op.in]: QUESTION_CATEGORIES[category] };
    if (difficulty) where.difficulty = difficulty;
    if (exam_type) where.exam_type = exam_type;

    let questions;
    if (session_type === 'wrong') {
      const wrongIds = await WrongQuestion.findAll({
        where: { user_id: req.userId, is_mastered: false },
        attributes: ['question_id'], limit: Math.min(+count, 50),
        order: [['wrong_count', 'DESC']],
      });
      questions = await Question.findAll({
        where: { id: { [Op.in]: wrongIds.map(w => w.question_id) } },
      });
    } else {
      questions = await Question.findAll({
        where, order: literal('RAND()'), limit: Math.min(+count, 50),
      });
    }

    if (questions.length === 0) {
      await t.rollback();
      return res.status(400).json({ code: 400, message: '没有找到符合条件的题目' });
    }

    const session = await PracticeSession.create({
      user_id: req.userId, session_type,
      config: { category, difficulty, exam_type, timed, time_limit },
      total_questions: questions.length, started_at: new Date(),
    }, { transaction: t });

    await t.commit();
    const safeQuestions = questions.map(q => ({
      id: q.id, question_type: q.question_type, exam_type: q.exam_type,
      stem: q.stem, options: q.options, difficulty: q.difficulty, knowledge_points: q.knowledge_points,
    }));
    res.json({ code: 200, data: { session_id: session.id, questions: safeQuestions, total: questions.length } });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ code: 500, message: '开始练习失败', error: e.message });
  }
});

router.post('/:sessionId/answer', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { question_id, user_answer, duration = 0 } = req.body;
    const session = await PracticeSession.findOne({ where: { id: req.params.sessionId, user_id: req.userId } });
    if (!session) { await t.rollback(); return res.status(404).json({ code: 404, message: '练习不存在' }); }
    if (session.status !== 'in_progress') { await t.rollback(); return res.status(400).json({ code: 400, message: '练习已结束' }); }

    const question = await Question.findByPk(question_id);
    if (!question) { await t.rollback(); return res.status(404).json({ code: 404, message: '题目不存在' }); }

    const isInterview = question.question_type.startsWith('interview_');
    let is_correct = false;
    let score = 0;

    if (!isInterview) {
      is_correct = String(user_answer).trim().toUpperCase() === String(question.answer).trim().toUpperCase();
      score = is_correct ? 1 : 0;
    }

    const answer = await UserAnswer.create({
      user_id: req.userId, session_id: session.id, question_id,
      user_answer: String(user_answer), is_correct, score, duration,
    }, { transaction: t });

    await session.increment({ answered_count: 1, correct_count: is_correct ? 1 : 0, total_duration: duration }, { transaction: t });
    await User.increment({ total_questions: 1, correct_count: is_correct ? 1 : 0 }, { where: { id: req.userId }, transaction: t });

    if (!is_correct && !isInterview) {
      const [wrong] = await WrongQuestion.findOrCreate({
        where: { user_id: req.userId, question_id },
        defaults: { user_id: req.userId, question_id, wrong_count: 1, last_wrong_at: new Date() },
        transaction: t,
      });
      if (!wrong.isNewRecord) {
        await wrong.increment('wrong_count', { transaction: t });
        await wrong.update({ last_wrong_at: new Date(), is_mastered: false }, { transaction: t });
      }
    }

    await t.commit();
    res.json({
      code: 200,
      data: {
        is_correct, score, answer: question.answer, analysis: question.analysis,
        knowledge_points: question.knowledge_points,
      }
    });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ code: 500, message: '提交答案失败', error: e.message });
  }
});

router.post('/:sessionId/submit', auth, async (req, res) => {
  try {
    const session = await PracticeSession.findOne({ where: { id: req.params.sessionId, user_id: req.userId } });
    if (!session) return res.status(404).json({ code: 404, message: '练习不存在' });

    await session.reload();
    const accuracy = session.answered_count > 0 ? (session.correct_count / session.answered_count * 100) : 0;
    await session.update({ status: 'completed', accuracy, submitted_at: new Date() });

    const answers = await UserAnswer.findAll({
      where: { session_id: session.id },
      include: [{ model: Question, attributes: ['id', 'stem', 'options', 'answer', 'analysis', 'question_type', 'difficulty', 'knowledge_points'] }],
    });

    res.json({
      code: 200,
      data: {
        session: {
          id: session.id, total_questions: session.total_questions,
          answered_count: session.answered_count, correct_count: session.correct_count,
          accuracy: accuracy.toFixed(1), total_duration: session.total_duration,
        },
        answers,
      }
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '提交练习失败', error: e.message });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { count, rows } = await PracticeSession.findAndCountAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
      limit: +pageSize, offset: (+page - 1) * +pageSize,
    });
    res.json({ code: 200, data: { total: count, page: +page, list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取历史失败' });
  }
});

module.exports = router;
