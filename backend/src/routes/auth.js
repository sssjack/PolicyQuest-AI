const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const { Op } = require('sequelize');
const config = require('../config');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const { IMAGE_EXTENSIONS, putObject } = require('../services/oss-storage');

const router = express.Router();
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_SIZE },
});

function detectImageMime(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return '';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  const gifHeader = buffer.subarray(0, 6).toString('ascii');
  if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') return 'image/gif';
  return '';
}

function normalizeMime(value) {
  return String(value || '').split(';')[0].trim().toLowerCase();
}

function uploadAvatarFile(req, res, next) {
  avatarUpload.single('avatar')(req, res, error => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ code: 413, message: '头像图片请控制在 2MB 以内' });
    }
    return res.status(400).json({ code: 400, message: '头像上传失败', error: error.message });
  });
}

router.post('/register', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const nickname = String(req.body.nickname || '').trim();
    const exam_target = String(req.body.exam_target || '').trim();
    const province = String(req.body.province || '').trim();
    if (!username || !email || !password) {
      return res.status(400).json({ code: 400, message: '用户名、邮箱和密码为必填项' });
    }
    if (username.length < 3 || username.length > 24) {
      return res.status(400).json({ code: 400, message: '用户名需为 3-24 个字符' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ code: 400, message: '请输入有效邮箱' });
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, message: '密码至少 6 位' });
    }
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(400).json({ code: 400, message: '用户名已存在' });
    const existEmail = await User.findOne({ where: { email } });
    if (existEmail) return res.status(400).json({ code: 400, message: '邮箱已注册' });

    const hashedPw = await bcrypt.hash(password, 12);
    const user = await User.create({
      username, email, password: hashedPw,
      nickname: nickname || username,
      exam_target: exam_target || '',
      province: province || '',
    });
    const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({
      code: 200, message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          role: user.role,
          avatar: user.avatar,
          exam_target: user.exam_target,
          province: user.province,
        }
      }
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '注册失败', error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const account = String(req.body.username || req.body.account || '').trim();
    const password = String(req.body.password || '');
    if (!account || !password) return res.status(400).json({ code: 400, message: '请输入用户名/邮箱和密码' });
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: account },
          { email: account.toLowerCase() },
        ],
      },
    });
    if (!user) return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    if (user.status === 'banned') return res.status(403).json({ code: 403, message: '账号已被禁用' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ code: 400, message: '用户名或密码错误' });

    await user.update({ last_login_at: new Date() });
    const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({
      code: 200, message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          role: user.role,
          avatar: user.avatar,
          exam_target: user.exam_target,
          province: user.province,
        }
      }
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '登录失败', error: e.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  const user = req.user;
  res.json({
    code: 200,
    data: {
      id: user.id, username: user.username, email: user.email, nickname: user.nickname,
      role: user.role, avatar: user.avatar, exam_target: user.exam_target, province: user.province,
      total_questions: user.total_questions, correct_count: user.correct_count,
      accuracy: user.total_questions > 0 ? (user.correct_count / user.total_questions * 100).toFixed(1) : '0.0',
      created_at: user.created_at
    }
  });
});

router.post('/avatar', auth, uploadAvatarFile, async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer || file.buffer.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择头像图片' });
    }

    const detectedMime = detectImageMime(file.buffer);
    const declaredMime = normalizeMime(file.mimetype);
    if (!detectedMime || !IMAGE_EXTENSIONS[detectedMime]) {
      return res.status(400).json({ code: 400, message: '头像仅支持 JPG、PNG、WebP 或 GIF 图片' });
    }
    if (declaredMime && declaredMime !== 'application/octet-stream' && declaredMime !== detectedMime) {
      return res.status(400).json({ code: 400, message: '头像图片类型与文件内容不一致' });
    }

    const ext = IMAGE_EXTENSIONS[detectedMime];
    const random = crypto.randomBytes(8).toString('hex');
    const storageKey = `avatars/${req.user.id}/${Date.now()}-${random}.${ext}`;
    const stored = await putObject({
      storageKey,
      buffer: file.buffer,
      contentType: detectedMime,
    });

    await req.user.update({ avatar: stored.url });
    return res.json({
      code: 200,
      message: '头像上传成功',
      data: {
        avatar: stored.url,
        storageKey: stored.storageKey,
      },
    });
  } catch (e) {
    return res.status(500).json({ code: 500, message: '头像上传到 OSS 失败', error: e.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const nickname = String(req.body.nickname || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const avatar = String(req.body.avatar || '').trim();
    const exam_target = String(req.body.exam_target || '').trim();
    const province = String(req.body.province || '').trim();

    if (!nickname) {
      return res.status(400).json({ code: 400, message: '昵称不能为空' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ code: 400, message: '请输入有效邮箱' });
    }
    if (avatar.startsWith('data:')) {
      return res.status(400).json({ code: 400, message: '请先上传头像到 OSS 后再保存' });
    }

    const emailOwner = await User.findOne({
      where: {
        email,
        id: { [Op.ne]: req.user.id },
      },
    });
    if (emailOwner) {
      return res.status(400).json({ code: 400, message: '该邮箱已被其他账号绑定' });
    }

    await req.user.update({ nickname, email, avatar, exam_target, province });
    res.json({
      code: 200,
      message: '更新成功',
      data: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        nickname: req.user.nickname,
        role: req.user.role,
        avatar: req.user.avatar,
        exam_target: req.user.exam_target,
        province: req.user.province,
      },
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: '更新失败', error: e.message });
  }
});

module.exports = router;
