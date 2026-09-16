const { DataTypes } = require('sequelize');
const { sequelize, SmsChallenge, SmsQuota } = require('../models');

async function migrate() {
  const query = sequelize.getQueryInterface();
  const columns = await query.describeTable('users');
  // 旧版本反复sync(alter)曾生成username_2/email_2等重复唯一索引，占满MySQL的64索引上限。
  // 仅在原始同列完整唯一索引存在时删除其同定义副本，保留唯一性约束。
  const existing = await query.showIndex('users');
  const duplicates = existing.filter(index => {
    const match = /^(username|email)_\d+$/.exec(index.name);
    if (!match || !index.unique || index.fields.length !== 1 || index.fields[0].attribute !== match[1] || index.fields[0].length) return false;
    return existing.some(original => original.name === match[1] && original.unique && original.fields.length === 1
      && original.fields[0].attribute === match[1] && !original.fields[0].length);
  });
  if (duplicates.length) {
    const clauses = duplicates.map(index => `DROP INDEX ${query.queryGenerator.quoteIdentifier(index.name)}`);
    await sequelize.query(`ALTER TABLE users ${clauses.join(', ')}`);
    console.log(`已合并${duplicates.length}个重复唯一索引`);
  }
  if (!columns.phone) await query.addColumn('users', 'phone', { type: DataTypes.STRING(11), allowNull: true });
  const indexes = await query.showIndex('users');
  if (!indexes.some(index => index.unique && index.fields.length === 1 && index.fields[0].attribute === 'phone')) {
    await query.addIndex('users', ['phone'], { name: 'users_phone_unique', unique: true });
  }
  if (!columns.token_version) await query.addColumn('users', 'token_version', {
    type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
  });
  if (!columns.email.allowNull) await query.changeColumn('users', 'email', { type: DataTypes.STRING(100), allowNull: true });
  await SmsChallenge.sync();
  await SmsQuota.sync();
  console.log('手机号及验证码表迁移完成；保留旧账号和积分');
}
if (require.main === module) migrate().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => sequelize.close());
module.exports = { migrate };
