const express = require('express');
const { Op } = require('sequelize');
const { Article, ArticleSource } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, category, keyword } = req.query;
    const currentYear = new Date().getFullYear();
    const where = {
      status: 'processed',
      publish_time: { [Op.gte]: new Date(`${currentYear}-01-01`) },
    };
    if (category) where.category = category;
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };

    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [{ model: ArticleSource, attributes: ['id', 'name', 'base_url'] }],
      attributes: ['id', 'title', 'url', 'publish_time', 'author', 'summary', 'tags', 'category', 'region', 'question_count', 'created_at'],
      order: [['publish_time', 'DESC'], ['created_at', 'DESC']],
      limit: +pageSize,
      offset: (+page - 1) * +pageSize,
    });
    res.json({ code: 200, data: { total: count, page: +page, list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取文章列表失败' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [{ model: ArticleSource, attributes: ['id', 'name', 'base_url'] }],
    });
    if (!article) return res.status(404).json({ code: 404, message: '文章不存在' });
    res.json({ code: 200, data: article });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取文章详情失败' });
  }
});

module.exports = router;
