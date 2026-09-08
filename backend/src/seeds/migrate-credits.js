const { DataTypes } = require('sequelize');
const { sequelize, CreditLedger } = require('../models');

async function migrate() {
  const query = sequelize.getQueryInterface();
  const columns = await query.describeTable('users');
  if (!columns.credits) await query.addColumn('users', 'credits', {
    type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
  });
  await CreditLedger.sync();
  console.log('积分余额及账本迁移完成；已有用户余额保持不变');
}

if (require.main === module) migrate().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => sequelize.close());
module.exports = { migrate };
