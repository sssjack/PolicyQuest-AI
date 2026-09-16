const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { User, CreditLedger } = require('../models');
const config = require('../config');
const { auth } = require('../middleware/auth');
const { INITIAL_CREDITS, creditView } = require('../services/credits');
const sms = require('../services/sms-verification');
const router = express.Router();
const sendLimit = rateLimit({ windowMs: 15 * 60000, max: 8, message: { code: 429, message: '验证码请求较多，请稍后再试' } });
const verifyLimit = rateLimit({ windowMs: 15 * 60000, max: 20, message: { code: 429, message: '操作过于频繁，请稍后再试' } });

function handle(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (error) {
      const duplicate = error.name === 'SequelizeUniqueConstraintError';
      const status = error.status || (duplicate ? 409 : 500);
      res.status(status).json({ code: status, message: error.status ? error.message : duplicate ? '手机号已被使用，请登录或更换手机号' : '操作失败，请稍后重试' });
    }
  };
}
function passwordValue(value) {
  const password = String(value || '');
  if (password.length < 8 || password.length > 64 || Buffer.byteLength(password, 'utf8') > 72) {
    throw sms.fault('密码需8–64位，中文等多字节字符合计不超过72字节');
  }
  return password;
}
function accountView(user) {
  return { ...creditView(user), id: user.id, username: user.username, email: user.email, phone: user.phone,
    nickname: user.nickname, role: user.role, avatar: user.avatar, exam_target: user.exam_target, province: user.province };
}

router.post('/sms-code', sendLimit, handle(async (req, res) => {
  const phone = sms.normalizePhone(req.body.phone);
  const purpose = String(req.body.purpose || '');
  if (!['register', 'reset'].includes(purpose)) throw sms.fault('验证码用途无效');
  const user = await User.findOne({ where: { phone } });
  if (purpose === 'register' && user) throw sms.fault('手机号已注册，请直接登录', 409);
  if (purpose === 'reset' && (!user || user.status !== 'active')) {
    return res.json({ code: 200, message: '若手机号已注册，验证码将发送至该手机', data: { cooldownSeconds: 60, expiresInSeconds: 300 } });
  }
  const data = await sms.sendCode(phone, purpose);
  return res.json({ code: 200, message: purpose === 'reset' ? '若手机号已注册，验证码将发送至该手机' : '验证码已发送', data });
}));

router.post('/register', verifyLimit, handle(async (req, res) => {
  const phone = sms.normalizePhone(req.body.phone);
  const password = passwordValue(req.body.password);
  const hashed = await bcrypt.hash(password, 12);
  const user = await sms.withVerifiedCode(phone, 'register', req.body.code, async transaction => {
    if (await User.findOne({ where: { phone }, transaction })) throw sms.fault('手机号已注册，请直接登录', 409);
    const created = await User.create({ phone, email: null, username: `pq_${crypto.randomBytes(8).toString('hex')}`,
      password: hashed, nickname: `同学${phone.slice(-4)}`, credits: INITIAL_CREDITS, role: 'user' }, { transaction });
    await CreditLedger.create({ user_id: created.id, delta: INITIAL_CREDITS, balance: INITIAL_CREDITS,
      reason: '注册赠送：可完成10套真题', request_key: 'registration' }, { transaction });
    return created;
  });
  const token = jwt.sign({ id: user.id, role: user.role, tv: user.token_version }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  res.json({ code: 200, message: '注册成功', data: { token, user: accountView(user) } });
}));

router.post('/reset-password', verifyLimit, handle(async (req, res) => {
  const phone = sms.normalizePhone(req.body.phone);
  const password = passwordValue(req.body.password);
  const hashed = await bcrypt.hash(password, 12);
  await sms.withVerifiedCode(phone, 'reset', req.body.code, async transaction => {
    const user = await User.findOne({ where: { phone }, transaction, lock: transaction.LOCK.UPDATE });
    if (!user || user.status !== 'active') throw sms.fault('验证码无效或账号不可用');
    await user.update({ password: hashed, token_version: Number(user.token_version || 0) + 1 }, { transaction });
  });
  res.json({ code: 200, message: '密码已重置，请使用新密码登录' });
}));

async function checkBinding(req) {
  const phone = sms.normalizePhone(req.body.phone);
  if (req.user.phone) throw sms.fault('账号已绑定手机号');
  if (!await bcrypt.compare(String(req.body.password || ''), req.user.password)) throw sms.fault('当前密码不正确');
  if (await User.findOne({ where: { phone } })) throw sms.fault('手机号已被其他账号绑定', 409);
  return phone;
}
router.post('/phone/code', auth, sendLimit, handle(async (req, res) => {
  const phone = await checkBinding(req);
  res.json({ code: 200, message: '验证码已发送', data: await sms.sendCode(phone, 'bind', req.userId) });
}));
router.post('/phone', auth, verifyLimit, handle(async (req, res) => {
  const phone = await checkBinding(req);
  await sms.withVerifiedCode(phone, 'bind', req.body.code, async transaction => {
    const user = await User.findByPk(req.userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (user.phone || user.password !== req.user.password || user.token_version !== req.user.token_version) throw sms.fault('账号信息已变化，请重新登录');
    await user.update({ phone }, { transaction });
  }, req.userId);
  res.json({ code: 200, message: '手机号绑定成功' });
}));
module.exports = router;
