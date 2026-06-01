const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ code: 401, message: '请先登录' });
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findByPk(decoded.id);
    if (!user || user.status !== 'active') return res.status(401).json({ code: 401, message: '用户不存在或已被禁用' });
    req.user = user;
    req.userId = user.id;
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
};

const adminAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '无管理权限' });
    }
    next();
  });
};

module.exports = { auth, adminAuth };
