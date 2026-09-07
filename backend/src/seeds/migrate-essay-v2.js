require('dotenv').config();
const { DataTypes } = require('sequelize');
const { sequelize, EssayReference } = require('../models');

async function migrate() {
  const qi = sequelize.getQueryInterface();
  const attempts = await qi.describeTable('real_paper_attempts');
  const answers = await qi.describeTable('real_paper_attempt_answers');
  if (!attempts.total_score) await qi.addColumn('real_paper_attempts', 'total_score', { type: DataTypes.FLOAT, defaultValue: 0 });
  if (!attempts.max_score) await qi.addColumn('real_paper_attempts', 'max_score', { type: DataTypes.FLOAT, defaultValue: 0 });
  if (!answers.max_score) await qi.addColumn('real_paper_attempt_answers', 'max_score', { type: DataTypes.FLOAT, defaultValue: 100 });
  if (!answers.question_snapshot) await qi.addColumn('real_paper_attempt_answers', 'question_snapshot', { type: DataTypes.JSON, allowNull: true });
  await EssayReference.sync();
  // 旧报告保留原百分制，不伪装成按原题满分重新评阅的报告。
  await sequelize.query(`UPDATE real_paper_attempts a JOIN (
    SELECT attempt_id, SUM(CASE WHEN status='graded' THEN score ELSE 0 END) AS earned,
    SUM(COALESCE(max_score,100)) AS cap FROM real_paper_attempt_answers GROUP BY attempt_id
  ) b ON a.id=b.attempt_id SET a.total_score=b.earned, a.max_score=b.cap WHERE a.max_score=0`);
  console.log('Essay v2 schema ready; legacy scores preserved.');
}

if (require.main === module) migrate().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => sequelize.close());
module.exports = { migrate };
