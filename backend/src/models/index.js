const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  nickname: { type: DataTypes.STRING(50), defaultValue: '' },
  avatar: { type: DataTypes.TEXT('medium'), defaultValue: '' },
  role: { type: DataTypes.ENUM('user', 'admin', 'super_admin'), defaultValue: 'user' },
  exam_target: { type: DataTypes.STRING(50), defaultValue: '' },
  province: { type: DataTypes.STRING(20), defaultValue: '' },
  status: { type: DataTypes.ENUM('active', 'banned', 'inactive'), defaultValue: 'active' },
  last_login_at: { type: DataTypes.DATE },
  total_questions: { type: DataTypes.INTEGER, defaultValue: 0 },
  correct_count: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'users' });

const ArticleSource = sequelize.define('ArticleSource', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  source_type: { type: DataTypes.ENUM('rss', 'web', 'api', 'manual'), defaultValue: 'web' },
  base_url: { type: DataTypes.STRING(500) },
  crawl_type: { type: DataTypes.STRING(50), defaultValue: 'auto' },
  enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  crawl_interval: { type: DataTypes.INTEGER, defaultValue: 3600 },
  last_crawl_at: { type: DataTypes.DATE },
  article_count: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'article_sources' });

const Article = sequelize.define('Article', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  source_id: { type: DataTypes.INTEGER },
  title: { type: DataTypes.STRING(500), allowNull: false },
  url: { type: DataTypes.STRING(1000) },
  publish_time: { type: DataTypes.DATE },
  author: { type: DataTypes.STRING(100) },
  content: { type: DataTypes.TEXT('long') },
  summary: { type: DataTypes.TEXT },
  content_hash: { type: DataTypes.STRING(64) },
  tags: { type: DataTypes.JSON },
  category: { type: DataTypes.STRING(50) },
  region: { type: DataTypes.STRING(50) },
  status: { type: DataTypes.ENUM('pending', 'processed', 'failed', 'archived'), defaultValue: 'pending' },
  question_count: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'articles' });

const Question = sequelize.define('Question', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  question_type: {
    type: DataTypes.ENUM(
      'verbal_main_idea', 'verbal_intent', 'verbal_detail', 'verbal_title',
      'verbal_order', 'verbal_connection', 'verbal_fill', 'verbal_word',
      'politics_single', 'politics_multi', 'politics_judge', 'politics_fill',
      'politics_short', 'politics_policy', 'politics_current', 'politics_document',
      'interview_analysis', 'interview_organize', 'interview_emergency',
      'interview_interpersonal', 'interview_simulate', 'interview_position',
      'interview_policy', 'interview_tax', 'interview_grassroots', 'interview_youth'
    ),
    allowNull: false
  },
  exam_type: { type: DataTypes.ENUM('national', 'provincial', 'institution', 'tax', 'selection'), defaultValue: 'national' },
  stem: { type: DataTypes.TEXT, allowNull: false },
  options: { type: DataTypes.JSON },
  answer: { type: DataTypes.TEXT, allowNull: false },
  analysis: { type: DataTypes.TEXT },
  difficulty: { type: DataTypes.ENUM('easy', 'medium', 'hard'), defaultValue: 'medium' },
  knowledge_points: { type: DataTypes.JSON },
  source_article_id: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'archived'), defaultValue: 'pending' },
  quality_score: { type: DataTypes.FLOAT, defaultValue: 0 },
  usage_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  correct_rate: { type: DataTypes.FLOAT, defaultValue: 0 },
}, { tableName: 'questions' });

const RealPaper = sequelize.define('RealPaper', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paper_key: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  practice_type: { type: DataTypes.ENUM('essay', 'interview'), allowNull: false },
  title: { type: DataTypes.STRING(500), allowNull: false },
  short_title: { type: DataTypes.STRING(200) },
  system: { type: DataTypes.STRING(50), defaultValue: 'provincial' },
  system_label: { type: DataTypes.STRING(100), defaultValue: '省考' },
  region: { type: DataTypes.STRING(100), defaultValue: '全国' },
  year: { type: DataTypes.INTEGER, allowNull: false },
  category: { type: DataTypes.STRING(120), defaultValue: '' },
  paper_code: { type: DataTypes.STRING(120), defaultValue: '' },
  source_name: { type: DataTypes.STRING(100), defaultValue: '' },
  source_url: { type: DataTypes.STRING(1000), allowNull: false },
  release_date: { type: DataTypes.STRING(30), defaultValue: '' },
  difficulty: { type: DataTypes.STRING(30), defaultValue: '中等' },
  suggested_minutes: { type: DataTypes.INTEGER, defaultValue: 30 },
  question_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  tags: { type: DataTypes.JSON },
  weak_dimensions: { type: DataTypes.JSON },
  status: { type: DataTypes.ENUM('approved', 'archived'), defaultValue: 'approved' },
  imported_at: { type: DataTypes.DATE },
}, {
  tableName: 'real_papers',
  indexes: [
    { fields: ['practice_type', 'year'] },
    { fields: ['system', 'year'] },
  ],
});

const PaperMaterial = sequelize.define('PaperMaterial', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paper_id: { type: DataTypes.INTEGER, allowNull: false },
  material_no: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(120), allowNull: false },
  summary: { type: DataTypes.STRING(500), defaultValue: '' },
  content: { type: DataTypes.TEXT('long') },
  word_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  source_url: { type: DataTypes.STRING(1000), defaultValue: '' },
}, {
  tableName: 'paper_materials',
  indexes: [{ fields: ['paper_id', 'material_no'] }],
});

const PaperQuestion = sequelize.define('PaperQuestion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paper_id: { type: DataTypes.INTEGER, allowNull: false },
  question_no: { type: DataTypes.INTEGER, allowNull: false },
  question_type: { type: DataTypes.STRING(60), allowNull: false },
  title: { type: DataTypes.STRING(500), allowNull: false },
  prompt: { type: DataTypes.TEXT('long'), allowNull: false },
  score: { type: DataTypes.INTEGER, defaultValue: 100 },
  word_limit: { type: DataTypes.INTEGER, defaultValue: 500 },
  suggested_minutes: { type: DataTypes.INTEGER, defaultValue: 7 },
  requirements: { type: DataTypes.JSON },
  dimensions: { type: DataTypes.JSON },
  sample_answer: { type: DataTypes.TEXT('long') },
  source_url: { type: DataTypes.STRING(1000), defaultValue: '' },
  status: { type: DataTypes.ENUM('approved', 'archived'), defaultValue: 'approved' },
}, {
  tableName: 'paper_questions',
  indexes: [{ fields: ['paper_id', 'question_no'] }],
});

const RealPaperAttempt = sequelize.define('RealPaperAttempt', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  paper_id: { type: DataTypes.INTEGER, allowNull: false },
  practice_type: { type: DataTypes.ENUM('essay', 'interview'), allowNull: false },
  paper_title: { type: DataTypes.STRING(500), allowNull: false },
  status: { type: DataTypes.ENUM('grading', 'graded', 'failed'), defaultValue: 'grading' },
  total_questions: { type: DataTypes.INTEGER, defaultValue: 0 },
  answered_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  graded_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  average_score: { type: DataTypes.FLOAT, defaultValue: 0 },
  total_duration: { type: DataTypes.INTEGER, defaultValue: 0 },
  submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  completed_at: { type: DataTypes.DATE },
  error_message: { type: DataTypes.TEXT },
}, {
  tableName: 'real_paper_attempts',
  indexes: [
    { fields: ['user_id', 'status'] },
    { fields: ['paper_id'] },
    { fields: ['submitted_at'] },
  ],
});

const RealPaperAttemptAnswer = sequelize.define('RealPaperAttemptAnswer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  attempt_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  paper_id: { type: DataTypes.INTEGER, allowNull: false },
  question_id: { type: DataTypes.INTEGER, allowNull: false },
  question_no: { type: DataTypes.INTEGER, allowNull: false },
  question_title: { type: DataTypes.STRING(500), allowNull: false },
  question_prompt: { type: DataTypes.TEXT('long'), allowNull: false },
  user_answer: { type: DataTypes.TEXT('long'), allowNull: false },
  duration: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('pending', 'grading', 'graded', 'failed'), defaultValue: 'pending' },
  score: { type: DataTypes.FLOAT, defaultValue: 0 },
  level: { type: DataTypes.STRING(30), defaultValue: '' },
  dimensions: { type: DataTypes.JSON },
  evaluation: { type: DataTypes.JSON },
  report: { type: DataTypes.JSON },
  error_message: { type: DataTypes.TEXT },
  graded_at: { type: DataTypes.DATE },
}, {
  tableName: 'real_paper_attempt_answers',
  indexes: [
    { fields: ['attempt_id', 'question_no'] },
    { fields: ['user_id', 'paper_id'] },
    { fields: ['status'] },
  ],
});

const PracticeSession = sequelize.define('PracticeSession', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  session_type: { type: DataTypes.ENUM('quick', 'special', 'hot_topic', 'wrong', 'mock', 'daily', 'sprint'), defaultValue: 'quick' },
  config: { type: DataTypes.JSON },
  total_questions: { type: DataTypes.INTEGER, defaultValue: 0 },
  answered_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  correct_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  accuracy: { type: DataTypes.FLOAT, defaultValue: 0 },
  total_duration: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('in_progress', 'completed', 'abandoned'), defaultValue: 'in_progress' },
  started_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  submitted_at: { type: DataTypes.DATE },
}, { tableName: 'practice_sessions' });

const UserAnswer = sequelize.define('UserAnswer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  session_id: { type: DataTypes.INTEGER },
  question_id: { type: DataTypes.INTEGER, allowNull: false },
  user_answer: { type: DataTypes.TEXT },
  is_correct: { type: DataTypes.BOOLEAN },
  score: { type: DataTypes.FLOAT, defaultValue: 0 },
  duration: { type: DataTypes.INTEGER, defaultValue: 0 },
  ai_feedback: { type: DataTypes.TEXT },
}, { tableName: 'user_answers' });

const WrongQuestion = sequelize.define('WrongQuestion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  question_id: { type: DataTypes.INTEGER, allowNull: false },
  wrong_count: { type: DataTypes.INTEGER, defaultValue: 1 },
  last_wrong_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  error_reason: { type: DataTypes.STRING(50) },
  is_mastered: { type: DataTypes.BOOLEAN, defaultValue: false },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'wrong_questions' });

const Favorite = sequelize.define('Favorite', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  question_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'favorites' });

const AiTask = sequelize.define('AiTask', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  task_type: { type: DataTypes.ENUM('generate_question', 'score_interview', 'generate_report', 'process_article'), defaultValue: 'generate_question' },
  article_id: { type: DataTypes.INTEGER },
  config: { type: DataTypes.JSON },
  status: { type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'), defaultValue: 'pending' },
  result: { type: DataTypes.JSON },
  error_message: { type: DataTypes.TEXT },
  token_usage: { type: DataTypes.INTEGER, defaultValue: 0 },
  cost: { type: DataTypes.FLOAT, defaultValue: 0 },
  started_at: { type: DataTypes.DATE },
  completed_at: { type: DataTypes.DATE },
  created_by: { type: DataTypes.INTEGER },
}, { tableName: 'ai_tasks' });

// Associations
ArticleSource.hasMany(Article, { foreignKey: 'source_id' });
Article.belongsTo(ArticleSource, { foreignKey: 'source_id' });

Article.hasMany(Question, { foreignKey: 'source_article_id' });
Question.belongsTo(Article, { foreignKey: 'source_article_id' });

RealPaper.hasMany(PaperMaterial, { foreignKey: 'paper_id' });
PaperMaterial.belongsTo(RealPaper, { foreignKey: 'paper_id' });
RealPaper.hasMany(PaperQuestion, { foreignKey: 'paper_id' });
PaperQuestion.belongsTo(RealPaper, { foreignKey: 'paper_id' });

User.hasMany(RealPaperAttempt, { foreignKey: 'user_id' });
RealPaperAttempt.belongsTo(User, { foreignKey: 'user_id' });
RealPaper.hasMany(RealPaperAttempt, { foreignKey: 'paper_id' });
RealPaperAttempt.belongsTo(RealPaper, { foreignKey: 'paper_id' });
RealPaperAttempt.hasMany(RealPaperAttemptAnswer, { foreignKey: 'attempt_id' });
RealPaperAttemptAnswer.belongsTo(RealPaperAttempt, { foreignKey: 'attempt_id' });
PaperQuestion.hasMany(RealPaperAttemptAnswer, { foreignKey: 'question_id' });
RealPaperAttemptAnswer.belongsTo(PaperQuestion, { foreignKey: 'question_id' });

User.hasMany(PracticeSession, { foreignKey: 'user_id' });
PracticeSession.belongsTo(User, { foreignKey: 'user_id' });

PracticeSession.hasMany(UserAnswer, { foreignKey: 'session_id' });
UserAnswer.belongsTo(PracticeSession, { foreignKey: 'session_id' });

User.hasMany(UserAnswer, { foreignKey: 'user_id' });
UserAnswer.belongsTo(User, { foreignKey: 'user_id' });

Question.hasMany(UserAnswer, { foreignKey: 'question_id' });
UserAnswer.belongsTo(Question, { foreignKey: 'question_id' });

User.hasMany(WrongQuestion, { foreignKey: 'user_id' });
WrongQuestion.belongsTo(User, { foreignKey: 'user_id' });
Question.hasMany(WrongQuestion, { foreignKey: 'question_id' });
WrongQuestion.belongsTo(Question, { foreignKey: 'question_id' });

User.hasMany(Favorite, { foreignKey: 'user_id' });
Question.hasMany(Favorite, { foreignKey: 'question_id' });
Favorite.belongsTo(Question, { foreignKey: 'question_id' });

module.exports = {
  sequelize, User, ArticleSource, Article, Question,
  RealPaper, PaperMaterial, PaperQuestion, RealPaperAttempt, RealPaperAttemptAnswer,
  PracticeSession, UserAnswer, WrongQuestion, Favorite, AiTask
};
