const express = require('express');
const { Op, fn, col } = require('sequelize');
const { User, Question, Article, ArticleSource, PracticeSession, UserAnswer, AiTask, sequelize } = require('../models');
const { adminAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalQuestions = await Question.count();
    const approvedQuestions = await Question.count({ where: { status: 'approved' } });
    const pendingQuestions = await Question.count({ where: { status: 'pending' } });
    const totalArticles = await Article.count();
    const totalSessions = await PracticeSession.count();
    const totalAnswers = await UserAnswer.count();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayUsers = await User.count({ where: { created_at: { [Op.gte]: today } } });
    const todayAnswers = await UserAnswer.count({ where: { created_at: { [Op.gte]: today } } });

    res.json({
      code: 200,
      data: {
        totalUsers, todayUsers, totalQuestions, approvedQuestions, pendingQuestions,
        totalArticles, totalSessions, totalAnswers, todayAnswers,
      }
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取仪表盘数据失败' });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, role, status } = req.query;
    const where = {};
    if (keyword) where[Op.or] = [
      { username: { [Op.like]: `%${keyword}%` } },
      { email: { [Op.like]: `%${keyword}%` } },
      { nickname: { [Op.like]: `%${keyword}%` } },
    ];
    if (role) where.role = role;
    if (status) where.status = status;

    const { count, rows } = await User.findAndCountAll({
      where, attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: +pageSize, offset: (+page - 1) * +pageSize,
    });
    res.json({ code: 200, data: { total: count, page: +page, list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取用户列表失败' });
  }
});

router.put('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await User.update({ status }, { where: { id: req.params.id } });
    res.json({ code: 200, message: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

router.get('/questions', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, question_type, difficulty } = req.query;
    const where = {};
    if (status) where.status = status;
    if (question_type) where.question_type = question_type;
    if (difficulty) where.difficulty = difficulty;

    const { count, rows } = await Question.findAndCountAll({
      where, order: [['created_at', 'DESC']],
      limit: +pageSize, offset: (+page - 1) * +pageSize,
      include: [{ model: Article, attributes: ['id', 'title'] }],
    });
    res.json({ code: 200, data: { total: count, page: +page, list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取题目列表失败' });
  }
});

router.put('/questions/:id', adminAuth, async (req, res) => {
  try {
    const { stem, options, answer, analysis, difficulty, status, knowledge_points, question_type } = req.body;
    await Question.update(
      { stem, options, answer, analysis, difficulty, status, knowledge_points, question_type },
      { where: { id: req.params.id } }
    );
    res.json({ code: 200, message: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

router.post('/questions', adminAuth, async (req, res) => {
  try {
    const q = await Question.create(req.body);
    res.json({ code: 200, data: q, message: '创建成功' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '创建失败', error: e.message });
  }
});

router.delete('/questions/:id', adminAuth, async (req, res) => {
  try {
    await Question.destroy({ where: { id: req.params.id } });
    res.json({ code: 200, message: '删除成功' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

router.put('/questions/:id/approve', adminAuth, async (req, res) => {
  try {
    await Question.update({ status: 'approved' }, { where: { id: req.params.id } });
    res.json({ code: 200, message: '审核通过' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '审核失败' });
  }
});

router.put('/questions/:id/reject', adminAuth, async (req, res) => {
  try {
    await Question.update({ status: 'rejected' }, { where: { id: req.params.id } });
    res.json({ code: 200, message: '已驳回' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '操作失败' });
  }
});

router.post('/questions/batch-approve', adminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    await Question.update({ status: 'approved' }, { where: { id: { [Op.in]: ids } } });
    res.json({ code: 200, message: `已批量审核 ${ids.length} 道题目` });
  } catch (e) {
    res.status(500).json({ code: 500, message: '批量审核失败' });
  }
});

router.get('/articles', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;
    const where = {};
    if (status) where.status = status;
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };
    const { count, rows } = await Article.findAndCountAll({
      where, order: [['created_at', 'DESC']],
      limit: +pageSize, offset: (+page - 1) * +pageSize,
      include: [{ model: ArticleSource, attributes: ['id', 'name'] }],
    });
    res.json({ code: 200, data: { total: count, page: +page, list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取文章列表失败' });
  }
});

router.get('/sources', adminAuth, async (req, res) => {
  try {
    const sources = await ArticleSource.findAll({ order: [['created_at', 'DESC']] });
    res.json({ code: 200, data: sources });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取来源列表失败' });
  }
});

router.post('/sources', adminAuth, async (req, res) => {
  try {
    const source = await ArticleSource.create(req.body);
    res.json({ code: 200, data: source, message: '创建成功' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '创建失败' });
  }
});

router.get('/ai-tasks', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const where = {};
    if (status) where.status = status;
    const { count, rows } = await AiTask.findAndCountAll({
      where, order: [['created_at', 'DESC']],
      limit: +pageSize, offset: (+page - 1) * +pageSize,
    });
    res.json({ code: 200, data: { total: count, page: +page, list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取AI任务列表失败' });
  }
});

router.post('/ai/generate', adminAuth, async (req, res) => {
  try {
    const { article_id, question_types, count = 3, difficulty = 'medium' } = req.body;
    const config = require('../config');
    const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

    const task = await AiTask.create({
      task_type: 'generate_question', article_id,
      config: { question_types, count, difficulty },
      status: 'processing', started_at: new Date(), created_by: req.user.id,
    });

    let articleContent = '';
    if (article_id) {
      const article = await Article.findByPk(article_id);
      if (article) articleContent = article.content || article.summary || article.title;
    }

    const response = await fetch(config.deepseek.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.deepseek.apiKey}` },
      body: JSON.stringify({
        model: config.deepseek.model,
        messages: [
          { role: 'system', content: '你是一名资深公考教研老师，擅长根据时政文章生成高质量考试题目。请严格按JSON数组格式输出题目。' },
          { role: 'user', content: `请根据以下文章内容，生成 ${count} 道公考题目。
题型要求：${(question_types || ['politics_single']).join('、')}
难度：${difficulty}

文章内容：
${articleContent || '请生成与当前时政热点相关的通用练习题目，涵盖新质生产力、高质量发展、基层治理、数字政府等主题。'}

请严格按照以下JSON数组格式输出：
[
  {
    "question_type": "题型代码",
    "exam_type": "national",
    "stem": "题干内容",
    "options": {"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"},
    "answer": "正确答案字母",
    "analysis": "详细解析，包括正确答案为什么对，错误选项为什么错",
    "difficulty": "${difficulty}",
    "knowledge_points": ["考点1", "考点2"]
  }
]
只输出JSON数组，不要输出其他内容。` }
        ],
        temperature: 0.7, max_tokens: 4000,
      }),
    });

    const data = await response.json();
    let questions = [];
    try {
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) questions = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      await task.update({ status: 'failed', error_message: 'AI返回内容解析失败', completed_at: new Date() });
      return res.status(500).json({ code: 500, message: 'AI返回内容解析失败' });
    }

    const created = [];
    for (const q of questions) {
      const newQ = await Question.create({
        question_type: q.question_type || 'politics_single',
        exam_type: q.exam_type || 'national',
        stem: q.stem, options: q.options, answer: q.answer,
        analysis: q.analysis, difficulty: q.difficulty || difficulty,
        knowledge_points: q.knowledge_points || [],
        source_article_id: article_id || null,
        status: 'pending', quality_score: 0,
      });
      created.push(newQ);
    }

    const tokenUsage = data.usage?.total_tokens || 0;
    await task.update({
      status: 'completed', result: { question_ids: created.map(q => q.id), count: created.length },
      token_usage: tokenUsage, completed_at: new Date(),
    });

    res.json({ code: 200, message: `成功生成 ${created.length} 道题目`, data: { task_id: task.id, questions: created } });
  } catch (e) {
    res.status(500).json({ code: 500, message: 'AI出题失败', error: e.message });
  }
});

// --- Crawler APIs ---
const { runCrawlCycle, runProcessCycle, getSchedulerStatus } = require('../services/scheduler');
const { processArticle, generateQuestionsForArticle } = require('../services/processor');

router.get('/crawler/status', adminAuth, async (req, res) => {
  try {
    const status = getSchedulerStatus();
    const pendingArticles = await Article.count({ where: { status: 'pending' } });
    const processedArticles = await Article.count({ where: { status: 'processed' } });
    const totalArticles = await Article.count();
    const pendingQuestions = await Question.count({ where: { status: 'pending' } });
    res.json({
      code: 200,
      data: { ...status, articles: { total: totalArticles, pending: pendingArticles, processed: processedArticles }, pendingQuestions }
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取状态失败' });
  }
});

router.post('/crawler/crawl', adminAuth, async (req, res) => {
  res.json({ code: 200, message: '采集任务已启动，请稍后查看状态' });
  runCrawlCycle().catch(e => console.error('[API] Crawl error:', e.message));
});

router.post('/crawler/process', adminAuth, async (req, res) => {
  const { limit = 3 } = req.body;
  res.json({ code: 200, message: `处理任务已启动（${limit}篇），请稍后查看状态` });
  runProcessCycle().catch(e => console.error('[API] Process error:', e.message));
});

router.post('/crawler/process-article/:id', adminAuth, async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ code: 404, message: '文章不存在' });
    const analysis = await processArticle(article);
    if (analysis) {
      const questions = await generateQuestionsForArticle(article, req.body.count || 3);
      res.json({ code: 200, message: `已处理并生成 ${questions.length} 道题目`, data: { analysis, questions } });
    } else {
      res.json({ code: 200, message: '文章处理失败，无法生成题目' });
    }
  } catch (e) {
    res.status(500).json({ code: 500, message: '处理失败', error: e.message });
  }
});

module.exports = router;
