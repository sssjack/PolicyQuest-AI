const express = require('express');
const { Op } = require('sequelize');
const { UserNote } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

function clampText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function sanitizeContent(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => clampText(item, 30)).filter(Boolean).slice(0, 8);
}

function mapNote(row) {
  const note = row.toJSON ? row.toJSON() : row;
  return {
    id: note.id,
    title: note.title || '',
    content: note.content || '',
    plainText: note.plain_text || '',
    sourceType: note.source_type || 'practice',
    sourceTitle: note.source_title || '',
    sourcePath: note.source_path || '',
    paperId: note.paper_id,
    questionId: note.question_id,
    attemptId: note.attempt_id,
    attemptAnswerId: note.attempt_answer_id,
    tags: note.tags || [],
    readingMode: note.reading_mode || 'paper',
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(req.query.pageSize, 10) || 50, 1), 200);
    const { count, rows } = await UserNote.findAndCountAll({
      where: { user_id: req.userId },
      order: [['updated_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    res.json({ code: 200, data: { total: count, page, list: rows.map(mapNote) } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '获取笔记失败' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const plainText = clampText(req.body.plainText || req.body.plain_text || req.body.content, 20000);
    const content = sanitizeContent(req.body.content || plainText);
    if (!plainText && !content.replace(/<[^>]+>/g, '').trim()) {
      return res.status(400).json({ code: 400, message: '笔记内容不能为空' });
    }

    const title = clampText(req.body.title || plainText.slice(0, 28) || '划词笔记', 200);
    const note = await UserNote.create({
      user_id: req.userId,
      title,
      content,
      plain_text: plainText || content.replace(/<[^>]+>/g, '').trim(),
      source_type: clampText(req.body.sourceType || req.body.source_type || 'practice', 40),
      source_title: clampText(req.body.sourceTitle || req.body.source_title || '', 500),
      source_path: clampText(req.body.sourcePath || req.body.source_path || '', 500),
      paper_id: req.body.paperId || req.body.paper_id || null,
      question_id: req.body.questionId || req.body.question_id || null,
      attempt_id: req.body.attemptId || req.body.attempt_id || null,
      attempt_answer_id: req.body.attemptAnswerId || req.body.attempt_answer_id || null,
      tags: normalizeTags(req.body.tags),
      reading_mode: ['paper', 'green', 'plain'].includes(req.body.readingMode || req.body.reading_mode)
        ? (req.body.readingMode || req.body.reading_mode)
        : 'paper',
    });

    res.json({ code: 200, message: '笔记已保存', data: mapNote(note) });
  } catch (e) {
    res.status(500).json({ code: 500, message: '保存笔记失败' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const note = await UserNote.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!note) return res.status(404).json({ code: 404, message: '笔记不存在' });

    const next = {};
    if (req.body.title !== undefined) next.title = clampText(req.body.title, 200);
    if (req.body.content !== undefined) {
      next.content = sanitizeContent(req.body.content);
      next.plain_text = clampText(req.body.plainText || next.content.replace(/<[^>]+>/g, '').trim(), 20000);
    }
    if (req.body.sourceTitle !== undefined) next.source_title = clampText(req.body.sourceTitle, 500);
    if (req.body.sourcePath !== undefined) next.source_path = clampText(req.body.sourcePath, 500);
    if (req.body.tags !== undefined) next.tags = normalizeTags(req.body.tags);
    if (req.body.readingMode !== undefined && ['paper', 'green', 'plain'].includes(req.body.readingMode)) {
      next.reading_mode = req.body.readingMode;
    }

    await note.update(next);
    res.json({ code: 200, message: '笔记已更新', data: mapNote(note) });
  } catch (e) {
    res.status(500).json({ code: 500, message: '更新笔记失败' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await UserNote.destroy({ where: { id: req.params.id, user_id: req.userId } });
    res.json({ code: 200, message: '笔记已删除' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '删除笔记失败' });
  }
});

router.post('/batch-delete', auth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ code: 400, message: '请选择要删除的笔记' });

    const deleted = await UserNote.destroy({
      where: {
        user_id: req.userId,
        id: { [Op.in]: ids },
      },
    });
    res.json({ code: 200, message: '笔记已删除', data: { deleted } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '批量删除失败' });
  }
});

module.exports = router;
