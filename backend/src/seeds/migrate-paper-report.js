require('dotenv').config();
const { DataTypes } = require('sequelize');
const { sequelize } = require('../models');

async function migrate() {
  const qi = sequelize.getQueryInterface();
  const columns = await qi.describeTable('real_paper_attempts');
  const additions = {
    paper_report: { type: DataTypes.JSON, allowNull: true },
    paper_report_status: { type: DataTypes.ENUM('pending', 'generating', 'ready', 'failed'), defaultValue: 'pending' },
    paper_report_error: { type: DataTypes.TEXT, allowNull: true },
    paper_report_token: { type: DataTypes.STRING(32), allowNull: true },
    target_score: { type: DataTypes.FLOAT, allowNull: true },
  };
  for (const [name, definition] of Object.entries(additions)) {
    if (!columns[name]) await qi.addColumn('real_paper_attempts', name, definition);
  }
  console.log('Essay paper report schema ready');
}
if (require.main === module) migrate().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => sequelize.close());
module.exports = { migrate };
