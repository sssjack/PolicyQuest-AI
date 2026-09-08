const express = require('express');
const { Op } = require('sequelize');
const { Announcement, AnnouncementRead, Feedback } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

function activeAnnouncementWhere() {
  const now = new Date();
  return {
    status: 'published',
    published_at: { [Op.lte]: now },
    [Op.or]: [
      { expires_at: null },
      { expires_at: { [Op.gt]: now } },
    ],
  };
}

router.get('/notifications', auth, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50);
    const where = activeAnnouncementWhere();
    const { count, rows } = await Announcement.findAndCountAll({
      where,
      include: [{
        model: AnnouncementRead,
        where: { user_id: req.userId },
        required: false,
        attributes: ['read_at'],
      }],
      order: [['published_at', 'DESC'], ['id', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      distinct: true,
    });
    const readCount = await AnnouncementRead.count({
      where: { user_id: req.userId },
      include: [{ model: Announcement, where, required: true }],
    });
    const list = rows.map(row => {
      const item = row.toJSON();
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.announcement_type,
        publishedAt: item.published_at,
        read: Boolean(item.AnnouncementReads?.length),
      };
    });
    res.json({ code: 200, data: { total: count, unread: Math.max(count - readCount, 0), page, list } });
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取消息通知失败，请稍后重试' });
  }
});

router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      where: { id: req.params.id, ...activeAnnouncementWhere() },
      attributes: ['id'],
    });
    if (!announcement) return res.status(404).json({ code: 404, message: '通知不存在或已下线' });
    await AnnouncementRead.findOrCreate({
      where: { announcement_id: announcement.id, user_id: req.userId },
      defaults: { announcement_id: announcement.id, user_id: req.userId, read_at: new Date() },
    });
    res.json({ code: 200, message: '已标记为已读' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '更新通知状态失败，请稍后重试' });
  }
});

router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      where: activeAnnouncementWhere(),
      attributes: ['id'],
      raw: true,
    });
    const announcementIds = announcements.map(item => item.id);
    if (announcementIds.length) {
      const existing = await AnnouncementRead.findAll({
        where: { user_id: req.userId, announcement_id: { [Op.in]: announcementIds } },
        attributes: ['announcement_id'],
        raw: true,
      });
      const existingIds = new Set(existing.map(item => item.announcement_id));
      const unreadIds = announcementIds.filter(id => !existingIds.has(id));
      if (unreadIds.length) {
        await AnnouncementRead.bulkCreate(unreadIds.map(announcementId => ({
          announcement_id: announcementId,
          user_id: req.userId,
          read_at: new Date(),
        })), { ignoreDuplicates: true });
      }
    }
    res.json({ code: 200, message: '全部通知已标记为已读' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '批量更新通知状态失败，请稍后重试' });
  }
});

router.get('/feedbacks', auth, async (req, res) => {
  try {
    const rows = await Feedback.findAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json({ code: 200, data: rows });
  } catch (error) {
    res.status(500).json({ code: 500, message: '获取反馈记录失败，请稍后重试' });
  }
});

router.post('/feedbacks', auth, async (req, res) => {
  try {
    const content = String(req.body.content || '').trim();
    const category = ['suggestion', 'bug', 'content', 'other'].includes(req.body.category)
      ? req.body.category
      : 'suggestion';
    const contact = String(req.body.contact || '').trim();
    if (content.length < 10 || content.length > 2000) {
      return res.status(400).json({ code: 400, message: '反馈内容请输入10至2000个字' });
    }
    if (contact.length > 120) return res.status(400).json({ code: 400, message: '联系方式不能超过120个字符' });
    const feedback = await Feedback.create({ user_id: req.userId, category, content, contact });
    res.status(201).json({ code: 201, message: '反馈已提交，我们会尽快查看', data: feedback });
  } catch (error) {
    res.status(500).json({ code: 500, message: '提交反馈失败，请稍后重试' });
  }
});

module.exports = router;
