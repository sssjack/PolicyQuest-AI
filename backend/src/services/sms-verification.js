const crypto = require('crypto');
const { sequelize, SmsChallenge, SmsQuota } = require('../models');
const config = require('../config');
const provider = require('./sms-provider');
const TTL_SECONDS = 300;
const COOLDOWN_SECONDS = 60;

function fault(message, status = 400) { return Object.assign(new Error(message), { status }); }
function normalizePhone(value) {
  const phone = String(value || '').trim();
  if (!/^1[3-9]\d{9}$/.test(phone)) throw fault('请输入有效的中国大陆手机号');
  return phone;
}
function digest(phone, purpose, requestKey, code) {
  return crypto.createHmac('sha256', config.jwtSecret).update(`pq-sms:${phone}:${purpose}:${requestKey}:${code}`).digest('hex');
}

async function sendCode(phone, purpose, userId = null) {
  if (!provider.configured()) throw fault('短信服务暂不可用，请稍后重试', 503);
  const now = new Date();
  const day = new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10);
  await SmsQuota.findOrCreate({ where: { day }, defaults: { count: 0 } });
  await SmsChallenge.findOrCreate({ where: { phone } });
  const code = String(crypto.randomInt(100000, 1000000));
  const requestKey = crypto.randomUUID();
  await sequelize.transaction(async transaction => {
    const quota = await SmsQuota.findByPk(day, { transaction, lock: transaction.LOCK.UPDATE });
    const row = await SmsChallenge.findByPk(phone, { transaction, lock: transaction.LOCK.UPDATE });
    if (row.sent_at && now - row.sent_at < COOLDOWN_SECONDS * 1000) throw fault('发送过于频繁，请60秒后重试', 429);
    const count = row.day === day ? row.daily_count : 0;
    if (count >= 10 || quota.count >= Number(process.env.SMS_DAILY_LIMIT || 500)) throw fault('今日短信发送次数已达上限，请明天再试', 429);
    await quota.update({ count: quota.count + 1 }, { transaction });
    await row.update({ purpose, user_id: userId, request_key: requestKey, code_hash: null, state: 'sending', attempts: 0,
      sent_at: now, expires_at: new Date(now.getTime() + TTL_SECONDS * 1000), day, daily_count: count + 1 }, { transaction });
  });
  try {
    await provider.sendCode(phone, code);
    await SmsChallenge.update({ code_hash: digest(phone, purpose, requestKey, code), state: 'ready' }, {
      where: { phone, request_key: requestKey, state: 'sending' },
    });
    return { cooldownSeconds: COOLDOWN_SECONDS, expiresInSeconds: TTL_SECONDS };
  } catch {
    await SmsChallenge.update({ state: 'failed', code_hash: null }, { where: { phone, request_key: requestKey } });
    throw fault('验证码发送失败，请稍后重试', 503);
  }
}

// 核验成功后在同一事务中完成业务和消费验证码，防止重放、并发注册和跨用途使用。
async function withVerifiedCode(phone, purpose, code, operation, userId = null) {
  if (!/^\d{6}$/.test(String(code || ''))) throw fault('请输入6位短信验证码');
  const outcome = await sequelize.transaction(async transaction => {
    const row = await SmsChallenge.findByPk(phone, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row || row.state !== 'ready' || row.purpose !== purpose || String(row.user_id || '') !== String(userId || '')
      || !row.expires_at || row.expires_at <= new Date() || row.attempts >= 5 || !row.code_hash) {
      return { error: '验证码无效或已过期，请重新获取' };
    }
    const actual = digest(phone, purpose, row.request_key, String(code));
    if (!crypto.timingSafeEqual(Buffer.from(row.code_hash, 'hex'), Buffer.from(actual, 'hex'))) {
      const attempts = row.attempts + 1;
      await row.update({ attempts, ...(attempts >= 5 ? { state: 'locked', code_hash: null } : {}) }, { transaction });
      return { error: attempts >= 5 ? '验证码错误次数过多，请重新获取' : '验证码错误，请重新输入' };
    }
    const value = await operation(transaction);
    await row.update({ state: 'used', code_hash: null }, { transaction });
    return { value };
  });
  if (outcome.error) throw fault(outcome.error);
  return outcome.value;
}
module.exports = { sendCode, withVerifiedCode, normalizePhone, fault };
