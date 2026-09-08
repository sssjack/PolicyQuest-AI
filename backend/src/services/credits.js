const { User, CreditLedger } = require('../models');

const PAPER_COST = 10;
const INITIAL_CREDITS = 100;
const MAX_CREDITS = 1000000;

function creditError(status, message) {
  return Object.assign(new Error(message), { status });
}

// 调整和扣费共用用户行锁，余额与账本在同一个事务中落库。
async function changeCredits({ userId, delta, reason, requestKey, actorId = null, referenceId = null }, transaction) {
  if (!Number.isSafeInteger(delta) || !delta || Math.abs(delta) > MAX_CREDITS) {
    throw creditError(400, '积分变动必须为非零整数，且不超过 1000000');
  }
  const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!user) throw creditError(404, '用户不存在');
  const previous = await CreditLedger.findOne({ where: { user_id: userId, request_key: requestKey }, transaction });
  if (previous) {
    if (previous.delta !== delta || previous.reason !== reason) throw creditError(409, '请求标识已用于其他积分操作，请刷新后重试');
    return previous;
  }
  const balance = user.credits + delta;
  if (balance < 0) throw creditError(402, `积分不足，本次需要 ${-delta} 积分，当前剩余 ${user.credits} 积分，请联系管理员调整`);
  if (balance > MAX_CREDITS) throw creditError(400, '调整后积分不得超过 1000000');
  await user.update({ credits: balance }, { transaction });
  return CreditLedger.create({ user_id: userId, delta, balance, reason, request_key: requestKey,
    actor_id: actorId, reference_id: referenceId }, { transaction });
}

function creditView(user) {
  return { credits: user.credits, paperCost: PAPER_COST, remainingPapers: Math.floor(user.credits / PAPER_COST) };
}

module.exports = { PAPER_COST, INITIAL_CREDITS, MAX_CREDITS, changeCredits, creditView, creditError };
