const express = require('express');
const { Op, literal } = require('sequelize');
const { WrongQuestion, Question, Favorite, Article } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/wrong', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, order } = req.query;
    const where = { user_id: req.userId, is_mastered: false };
    const include = [{
      model: Question,
      attributes: ['id', 'stem', 'options', 'answer', 'analysis', 'question_type', 'difficulty', 'source_article_id'],
      include: [{ model: Article, attributes: ['id', 'title', 'url'] }],
    }];

    let orderClause;
    if (order === 'random') orderClause = literal('RAND()');
    else if (order === 'chronological') orderClause = [['last_wrong_at', 'DESC']];
    else orderClause = [['wrong_count', 'DESC'], ['last_wrong_at', 'DESC']];

    const { count, rows } = await WrongQuestion.findAndCountAll({
      where, include, order: orderClause,
      limit: +pageSize, offset: (+page - 1) * +pageSize,
    });
    res.json({ code: 200, data: { total: count, page: +page, list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取错题本失败' });
  }
});

router.put('/wrong/:id/master', auth, async (req, res) => {
  try {
    const wrong = await WrongQuestion.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!wrong) return res.status(404).json({ code: 404, message: '错题记录不存在' });
    await wrong.update({ is_mastered: true });
    res.json({ code: 200, message: '已标记掌握' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '操作失败' });
  }
});

router.delete('/wrong/:id', auth, async (req, res) => {
  try {
    await WrongQuestion.destroy({ where: { id: req.params.id, user_id: req.userId } });
    res.json({ code: 200, message: '已删除' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

router.get('/favorites', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const { count, rows } = await Favorite.findAndCountAll({
      where: { user_id: req.userId },
      include: [{ model: Question, attributes: ['id', 'stem', 'options', 'question_type', 'difficulty'] }],
      order: [['created_at', 'DESC']],
      limit: +pageSize, offset: (+page - 1) * +pageSize,
    });
    res.json({ code: 200, data: { total: count, page: +page, list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取收藏失败' });
  }
});

router.post('/favorites/:questionId', auth, async (req, res) => {
  try {
    const [fav, created] = await Favorite.findOrCreate({
      where: { user_id: req.userId, question_id: req.params.questionId },
    });
    if (!created) await fav.destroy();
    res.json({ code: 200, message: created ? '已收藏' : '已取消收藏' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '操作失败' });
  }
});

module.exports = router;
