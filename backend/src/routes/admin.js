const express = require('express');
const { Op, fn, col } = require('sequelize');
const {
  User, Question, Article, ArticleSource, PracticeSession, UserAnswer, AiTask,
  RealPaper, PaperMaterial, PaperQuestion, RealPaperAttempt, RealPaperAttemptAnswer,
  AiRequestLog, Feedback, Announcement, AnnouncementRead,
  sequelize, CreditLedger,
} = require('../models');
const { adminAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { changeCredits, creditView } = require('../services/credits');
const { requestAi } = require('../services/ai-request');

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
    const totalPapers = await RealPaper.count();
    const totalMaterials = await PaperMaterial.count();
    const totalPaperQuestions = await PaperQuestion.count();
    const totalAttempts = await RealPaperAttempt.count();
    const completedAttempts = await RealPaperAttempt.count({ where: { status: 'graded' } });
    const firstPaperUsers = await RealPaperAttempt.count({ where: { status: 'graded' }, distinct: true, col: 'user_id' });
    const aiTaskCount = await AiTask.count();
    const aiTokens = await AiTask.sum('token_usage') || 0;
    const aiCost = await AiTask.sum('cost') || 0;
    const failedAiTasks = await AiTask.count({ where: { status: 'failed' } });
    const failedAttempts = await RealPaperAttempt.count({ where: { status: 'failed' } });
    const lowScoreAttempts = await RealPaperAttempt.count({
      where: { status: 'graded', average_score: { [Op.lt]: 60 } },
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayUsers = await User.count({ where: { created_at: { [Op.gte]: today } } });
    const todayAnswers = await UserAnswer.count({ where: { created_at: { [Op.gte]: today } } });

    const trendStart = new Date();
    trendStart.setHours(0, 0, 0, 0);
    trendStart.setDate(trendStart.getDate() - 6);
    const [recentUsers, recentAttempts, recentAiTasks] = await Promise.all([
      User.findAll({ where: { created_at: { [Op.gte]: trendStart } }, attributes: ['created_at'], raw: true }),
      RealPaperAttempt.findAll({ where: { submitted_at: { [Op.gte]: trendStart } }, attributes: ['submitted_at', 'status'], raw: true }),
      AiTask.findAll({ where: { created_at: { [Op.gte]: trendStart } }, attributes: ['created_at', 'cost'], raw: true }),
    ]);
    const dayKey = value => {
      const date = new Date(value);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(trendStart);
      date.setDate(trendStart.getDate() + index);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const trend = days.map(day => ({
      day,
      users: recentUsers.filter(item => dayKey(item.created_at) === day).length,
      attempts: recentAttempts.filter(item => dayKey(item.submitted_at) === day).length,
      aiCost: recentAiTasks.filter(item => dayKey(item.created_at) === day)
        .reduce((sum, item) => sum + Number(item.cost || 0), 0),
    }));

    res.json({
      code: 200,
      data: {
        totalUsers, todayUsers, totalQuestions, approvedQuestions, pendingQuestions,
        totalArticles, totalSessions, totalAnswers, todayAnswers,
        totalPapers, totalMaterials, totalPaperQuestions, totalAttempts, completedAttempts,
        firstPaperUsers, aiTaskCount, aiTokens, aiCost, failedAiTasks, failedAttempts, lowScoreAttempts,
        trend,
        finance: {
          cashRevenue: null,
          creditConsumption: null,
          pendingEntitlements: null,
          refunds: null,
          serviceProfit: null,
          status: 'deferred_to_v2',
        },
      }
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取仪表盘数据失败' });
  }
});

router.get('/users/:id/summary', adminAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
    const [sessions, answers, attempts] = await Promise.all([
      PracticeSession.findAll({ where: { user_id: user.id }, order: [['started_at', 'DESC']], limit: 8, raw: true }),
      UserAnswer.count({ where: { user_id: user.id } }),
      RealPaperAttempt.findAll({ where: { user_id: user.id }, order: [['submitted_at', 'DESC']], limit: 8, raw: true }),
    ]);
    res.json({
      code: 200,
      data: {
        user,
        rights: { membership: null, trialQuota: Math.floor(user.credits / 10), points: user.credits, status: 'connected' },
        creditLedger: await CreditLedger.findAll({ where: { user_id: user.id }, order: [['id', 'DESC']], limit: 50 }),
        stats: { answers, sessions: sessions.length, attempts: attempts.length },
        sessions,
        attempts,
      },
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取用户详情失败' });
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

router.post('/users/:id/credits', adminAuth, async (req, res) => {
  const { delta, reason, requestId } = req.body || {};
  if (typeof reason !== 'string' || !reason.trim() || reason.trim().length > 200
      || typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) {
    return res.status(400).json({ code: 400, message: '请填写200字以内的调整原因和有效请求标识' });
  }
  try {
    const entry = await sequelize.transaction(transaction => changeCredits({ userId: req.params.id,
      delta, reason: reason.trim(), requestKey: `admin:${requestId}`, actorId: req.userId }, transaction));
    const user = await User.findByPk(req.params.id);
    return res.json({ code: 200, data: { ...creditView(user), entry }, message: '积分已调整' });
  } catch (error) {
    return res.status(error.status || 500).json({ code: error.status || 500, message: error.status ? error.message : '积分调整失败，请稍后重试' });
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

    const data = await requestAi({
      url: config.deepseek.apiUrl,
      apiKey: config.deepseek.apiKey,
      model: config.deepseek.model,
      maxTokens: 4000,
      purpose: 'admin_question_generation',
      userId: req.user.id,
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
    });
    let questions = [];
    try {
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) questions = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      await task.update({ status: 'failed', error_message: 'AI返回内容解析失败', completed_at: new Date() });
      return res.status(500).json({ code: 500, message: 'AI返回内容解析失败' });
    }

    const created = await Question.bulkCreate(questions.map(q => ({
        question_type: q.question_type || 'politics_single',
        exam_type: q.exam_type || 'national',
        stem: q.stem, options: q.options, answer: q.answer,
        analysis: q.analysis, difficulty: q.difficulty || difficulty,
        knowledge_points: q.knowledge_points || [],
        source_article_id: article_id || null,
        status: 'pending', quality_score: 0,
      })), { validate: true });

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

// --- Real paper and grading quality APIs ---
router.get('/papers', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, year, practice_type, status } = req.query;
    const where = {};
    if (keyword) where[Op.or] = [
      { title: { [Op.like]: `%${keyword}%` } },
      { region: { [Op.like]: `%${keyword}%` } },
      { paper_key: { [Op.like]: `%${keyword}%` } },
    ];
    if (year) where.year = Number(year);
    if (practice_type) where.practice_type = practice_type;
    if (status) where.status = status;
    const { count, rows } = await RealPaper.findAndCountAll({
      where,
      order: [['year', 'DESC'], ['id', 'DESC']],
      limit: Math.min(Number(pageSize) || 20, 100),
      offset: (Math.max(Number(page) || 1, 1) - 1) * (Math.min(Number(pageSize) || 20, 100)),
      raw: true,
    });
    const ids = rows.map(row => row.id);
    const [materialCounts, questionCounts] = await Promise.all([
      ids.length ? PaperMaterial.findAll({
        where: { paper_id: { [Op.in]: ids } }, attributes: ['paper_id', [fn('COUNT', col('id')), 'count']],
        group: ['paper_id'], raw: true,
      }) : [],
      ids.length ? PaperQuestion.findAll({
        where: { paper_id: { [Op.in]: ids } }, attributes: ['paper_id', [fn('COUNT', col('id')), 'count']],
        group: ['paper_id'], raw: true,
      }) : [],
    ]);
    const materialMap = Object.fromEntries(materialCounts.map(row => [row.paper_id, Number(row.count)]));
    const questionMap = Object.fromEntries(questionCounts.map(row => [row.paper_id, Number(row.count)]));
    res.json({
      code: 200,
      data: {
        total: count,
        page: Number(page),
        list: rows.map(row => ({ ...row, material_count: materialMap[row.id] || 0, question_count: questionMap[row.id] || 0 })),
      },
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取真题资料失败' });
  }
});

router.get('/attempts', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;
    const where = {};
    if (status) where.status = status;
    const userWhere = keyword ? { [Op.or]: [
      { username: { [Op.like]: `%${keyword}%` } },
      { email: { [Op.like]: `%${keyword}%` } },
      { nickname: { [Op.like]: `%${keyword}%` } },
    ] } : undefined;
    const size = Math.min(Number(pageSize) || 20, 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const { count, rows } = await RealPaperAttempt.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'username', 'nickname', 'email'], where: userWhere, required: Boolean(userWhere) },
        { model: RealPaper, attributes: ['id', 'title', 'region', 'year'] },
      ],
      order: [['submitted_at', 'DESC']],
      limit: size,
      offset: (currentPage - 1) * size,
    });
    res.json({ code: 200, data: { total: count, page: currentPage, list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取批改记录失败' });
  }
});

router.get('/quality', adminAuth, async (req, res) => {
  try {
    const [failedAttempts, pendingAnswers, lowScoreAnswers] = await Promise.all([
      RealPaperAttempt.count({ where: { status: 'failed' } }),
      RealPaperAttemptAnswer.count({ where: { status: { [Op.in]: ['pending', 'grading'] } } }),
      RealPaperAttemptAnswer.count({ where: { status: 'graded', score: { [Op.lt]: 40 } } }),
    ]);
    res.json({
      code: 200,
      data: {
        cards: [
          { key: 'appeal', label: '用户申诉', value: 0, status: 'deferred_to_v2', description: '申诉工单模型尚未接入' },
          { key: 'low_score', label: '异常低分待抽检', value: lowScoreAnswers, status: 'ready', description: '低于 40 分的单题批改' },
          { key: 'duplicate', label: '重复扣分线索', value: 0, status: 'deferred_to_v2', description: '重复扣分规则尚未接入' },
          { key: 'evidence', label: '证据错误', value: 0, status: 'deferred_to_v2', description: '证据核验工单模型尚未接入' },
        ],
        failedAttempts,
        pendingAnswers,
      },
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取质检数据失败' });
  }
});

router.get('/papers/:id', adminAuth, async (req, res) => {
  try {
    const paper = await RealPaper.findByPk(req.params.id, {
      include: [
        { model: PaperMaterial, separate: true, order: [['material_no', 'ASC']] },
        { model: PaperQuestion, separate: true, order: [['question_no', 'ASC']] },
      ],
    });
    if (!paper) return res.status(404).json({ code: 404, message: '真题不存在' });
    res.json({ code: 200, data: paper });
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取真题详情失败' });
  }
});

router.post('/papers', adminAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { materials = [], questions = [], ...paperData } = req.body;
    if (!String(paperData.paper_key || '').trim() || !String(paperData.title || '').trim()) {
      await transaction.rollback();
      return res.status(400).json({ code: 400, message: '真题编号和标题不能为空' });
    }
    const paper = await RealPaper.create({
      ...paperData,
      paper_key: String(paperData.paper_key).trim(),
      title: String(paperData.title).trim(),
      question_count: questions.length,
      imported_at: new Date(),
    }, { transaction });
    if (materials.length) {
      await PaperMaterial.bulkCreate(materials.map((item, index) => ({
        ...item,
        paper_id: paper.id,
        material_no: Number(item.material_no) || index + 1,
        word_count: Number(item.word_count) || String(item.content || '').replace(/\s/g, '').length,
      })), { transaction, validate: true });
    }
    if (questions.length) {
      await PaperQuestion.bulkCreate(questions.map((item, index) => ({
        ...item,
        paper_id: paper.id,
        question_no: Number(item.question_no) || index + 1,
      })), { transaction, validate: true });
    }
    await transaction.commit();
    res.status(201).json({ code: 201, message: '真题已创建', data: paper });
  } catch (error) {
    await transaction.rollback();
    const message = error.name === 'SequelizeUniqueConstraintError' ? '真题编号已存在' : '创建真题失败，请检查填写内容';
    res.status(400).json({ code: 400, message });
  }
});

router.put('/papers/:id', adminAuth, async (req, res) => {
  try {
    const paper = await RealPaper.findByPk(req.params.id);
    if (!paper) return res.status(404).json({ code: 404, message: '真题不存在' });
    const allowed = [
      'paper_key', 'practice_type', 'title', 'short_title', 'system', 'system_label', 'region', 'year',
      'category', 'paper_code', 'source_name', 'source_url', 'release_date', 'difficulty',
      'suggested_minutes', 'tags', 'weak_dimensions', 'status',
    ];
    const changes = Object.fromEntries(allowed.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
    await paper.update(changes);
    res.json({ code: 200, message: '真题信息已更新', data: paper });
  } catch (error) {
    const message = error.name === 'SequelizeUniqueConstraintError' ? '真题编号已存在' : '更新真题失败';
    res.status(400).json({ code: 400, message });
  }
});

router.delete('/papers/:id', adminAuth, async (req, res) => {
  try {
    const [count] = await RealPaper.update({ status: 'archived' }, { where: { id: req.params.id } });
    if (!count) return res.status(404).json({ code: 404, message: '真题不存在' });
    res.json({ code: 200, message: '真题已归档，可保留历史作答记录' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '归档真题失败' });
  }
});

router.post('/papers/:paperId/materials', adminAuth, async (req, res) => {
  try {
    const paper = await RealPaper.findByPk(req.params.paperId, { attributes: ['id'] });
    if (!paper) return res.status(404).json({ code: 404, message: '真题不存在' });
    const content = String(req.body.content || '');
    const material = await PaperMaterial.create({
      ...req.body,
      paper_id: paper.id,
      material_no: Number(req.body.material_no),
      word_count: Number(req.body.word_count) || content.replace(/\s/g, '').length,
    });
    res.status(201).json({ code: 201, message: '材料已新增', data: material });
  } catch (error) {
    res.status(400).json({ code: 400, message: '新增材料失败，请检查材料序号和内容' });
  }
});

router.put('/materials/:id', adminAuth, async (req, res) => {
  try {
    const material = await PaperMaterial.findByPk(req.params.id);
    if (!material) return res.status(404).json({ code: 404, message: '材料不存在' });
    const changes = { ...req.body };
    delete changes.id;
    delete changes.paper_id;
    if (changes.content !== undefined) changes.word_count = String(changes.content || '').replace(/\s/g, '').length;
    await material.update(changes);
    res.json({ code: 200, message: '材料已更新', data: material });
  } catch (error) {
    res.status(400).json({ code: 400, message: '更新材料失败' });
  }
});

router.delete('/materials/:id', adminAuth, async (req, res) => {
  try {
    const count = await PaperMaterial.destroy({ where: { id: req.params.id } });
    if (!count) return res.status(404).json({ code: 404, message: '材料不存在' });
    res.json({ code: 200, message: '材料已删除' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '删除材料失败' });
  }
});

router.post('/papers/:paperId/questions', adminAuth, async (req, res) => {
  try {
    const paper = await RealPaper.findByPk(req.params.paperId, { attributes: ['id'] });
    if (!paper) return res.status(404).json({ code: 404, message: '真题不存在' });
    const question = await PaperQuestion.create({ ...req.body, paper_id: paper.id });
    await RealPaper.update({ question_count: await PaperQuestion.count({ where: { paper_id: paper.id } }) }, { where: { id: paper.id } });
    res.status(201).json({ code: 201, message: '题目已新增', data: question });
  } catch (error) {
    res.status(400).json({ code: 400, message: '新增题目失败，请检查必填项' });
  }
});

router.put('/paper-questions/:id', adminAuth, async (req, res) => {
  try {
    const question = await PaperQuestion.findByPk(req.params.id);
    if (!question) return res.status(404).json({ code: 404, message: '题目不存在' });
    const changes = { ...req.body };
    delete changes.id;
    delete changes.paper_id;
    await question.update(changes);
    res.json({ code: 200, message: '题目已更新', data: question });
  } catch (error) {
    res.status(400).json({ code: 400, message: '更新题目失败' });
  }
});

router.delete('/paper-questions/:id', adminAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const question = await PaperQuestion.findByPk(req.params.id, { transaction });
    if (!question) {
      await transaction.rollback();
      return res.status(404).json({ code: 404, message: '题目不存在' });
    }
    const paperId = question.paper_id;
    await question.destroy({ transaction });
    const questionCount = await PaperQuestion.count({ where: { paper_id: paperId }, transaction });
    await RealPaper.update({ question_count: questionCount }, { where: { id: paperId }, transaction });
    await transaction.commit();
    res.json({ code: 200, message: '题目已删除' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ code: 500, message: '删除题目失败' });
  }
});

router.get('/practice-records', adminAuth, async (req, res) => {
  try {
    const recordType = req.query.recordType === 'session' ? 'session' : 'paper';
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);
    const status = String(req.query.status || '');
    const keyword = String(req.query.keyword || '').trim();
    const userWhere = keyword ? { [Op.or]: [
      { username: { [Op.like]: `%${keyword}%` } },
      { email: { [Op.like]: `%${keyword}%` } },
      { nickname: { [Op.like]: `%${keyword}%` } },
    ] } : undefined;
    const model = recordType === 'paper' ? RealPaperAttempt : PracticeSession;
    const where = status ? { status } : {};
    const order = recordType === 'paper' ? [['submitted_at', 'DESC']] : [['started_at', 'DESC']];
    const { count, rows } = await model.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'nickname', 'email'],
        where: userWhere,
        required: Boolean(userWhere),
      }],
      order,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    res.json({ code: 200, data: { total: count, page, recordType, list: rows } });
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取用户做题记录失败' });
  }
});

router.get('/practice-records/:recordType/:id', adminAuth, async (req, res) => {
  try {
    if (req.params.recordType === 'session') {
      const session = await PracticeSession.findByPk(req.params.id, {
        include: [
          { model: User, attributes: ['id', 'username', 'nickname', 'email'] },
          {
            model: UserAnswer,
            include: [{
              model: Question,
              attributes: ['id', 'stem', 'options', 'answer', 'analysis', 'question_type', 'difficulty'],
            }],
          },
        ],
      });
      if (!session) return res.status(404).json({ code: 404, message: '做题记录不存在' });
      return res.json({ code: 200, data: { recordType: 'session', record: session } });
    }
    const attempt = await RealPaperAttempt.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'username', 'nickname', 'email'] },
        { model: RealPaper, attributes: ['id', 'title', 'region', 'year'] },
        { model: RealPaperAttemptAnswer, separate: true, order: [['question_no', 'ASC']] },
      ],
    });
    if (!attempt) return res.status(404).json({ code: 404, message: '做题记录不存在' });
    res.json({ code: 200, data: { recordType: 'paper', record: attempt } });
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取做题详情失败' });
  }
});

router.get('/ai-request-logs', adminAuth, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.purpose) where.purpose = req.query.purpose;
    const { count, rows } = await AiRequestLog.findAndCountAll({
      where,
      attributes: { exclude: ['request_body', 'response_body'] },
      include: [{ model: User, attributes: ['id', 'username', 'nickname'] }],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    res.json({ code: 200, data: { total: count, page, list: rows } });
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取AI请求日志失败' });
  }
});

router.get('/ai-request-logs/:id', adminAuth, async (req, res) => {
  try {
    const log = await AiRequestLog.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'username', 'nickname'] }],
    });
    if (!log) return res.status(404).json({ code: 404, message: 'AI请求日志不存在' });
    res.json({ code: 200, data: log });
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取AI请求日志详情失败' });
  }
});

router.get('/feedbacks', adminAuth, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);
    const where = req.query.status ? { status: req.query.status } : {};
    const { count, rows } = await Feedback.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'username', 'nickname', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    res.json({ code: 200, data: { total: count, page, list: rows } });
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取用户反馈失败' });
  }
});

router.put('/feedbacks/:id', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) return res.status(404).json({ code: 404, message: '反馈不存在' });
    const status = ['pending', 'processing', 'resolved', 'closed'].includes(req.body.status)
      ? req.body.status
      : feedback.status;
    await feedback.update({
      status,
      admin_reply: String(req.body.admin_reply || '').trim() || null,
      handled_by: req.user.id,
      handled_at: new Date(),
    });
    res.json({ code: 200, message: '反馈处理结果已保存', data: feedback });
  } catch (error) {
    res.status(500).json({ code: 500, message: '更新反馈失败' });
  }
});

router.get('/announcements', adminAuth, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);
    const where = req.query.status ? { status: req.query.status } : {};
    const { count, rows } = await Announcement.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    res.json({ code: 200, data: { total: count, page, list: rows } });
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取公告列表失败' });
  }
});

router.post('/announcements', adminAuth, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const content = String(req.body.content || '').trim();
    if (!title || !content) return res.status(400).json({ code: 400, message: '公告标题和内容不能为空' });
    const status = req.body.status === 'published' ? 'published' : 'draft';
    const announcement = await Announcement.create({
      title,
      content,
      announcement_type: ['notice', 'update', 'system'].includes(req.body.announcement_type)
        ? req.body.announcement_type
        : 'notice',
      status,
      published_at: status === 'published' ? new Date() : null,
      expires_at: req.body.expires_at || null,
      created_by: req.user.id,
    });
    res.status(201).json({ code: 201, message: status === 'published' ? '公告已发布' : '公告草稿已保存', data: announcement });
  } catch (error) {
    res.status(400).json({ code: 400, message: '创建公告失败，请检查填写内容' });
  }
});

router.put('/announcements/:id', adminAuth, async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ code: 404, message: '公告不存在' });
    const nextStatus = ['draft', 'published', 'archived'].includes(req.body.status)
      ? req.body.status
      : announcement.status;
    await announcement.update({
      title: String(req.body.title ?? announcement.title).trim(),
      content: String(req.body.content ?? announcement.content).trim(),
      announcement_type: ['notice', 'update', 'system'].includes(req.body.announcement_type)
        ? req.body.announcement_type
        : announcement.announcement_type,
      status: nextStatus,
      published_at: nextStatus === 'published' ? announcement.published_at || new Date() : announcement.published_at,
      expires_at: req.body.expires_at === undefined ? announcement.expires_at : req.body.expires_at || null,
    });
    res.json({ code: 200, message: '公告已更新', data: announcement });
  } catch (error) {
    res.status(400).json({ code: 400, message: '更新公告失败' });
  }
});

router.delete('/announcements/:id', adminAuth, async (req, res) => {
  try {
    const [count] = await Announcement.update({ status: 'archived' }, { where: { id: req.params.id } });
    if (!count) return res.status(404).json({ code: 404, message: '公告不存在' });
    res.json({ code: 200, message: '公告已归档' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '归档公告失败' });
  }
});

module.exports = router;
