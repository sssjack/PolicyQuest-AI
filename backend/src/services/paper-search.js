const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

const PAGE_SIZE = 10;
const MAX_KEYWORD_LENGTH = 100;

function searchError(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function parsePage(value) {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d{0,5}$/.test(value)) {
    throw searchError('页码无效，请重新搜索');
  }
  return Number(value);
}

function excerpt(value, keyword) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  const index = text.toLowerCase().indexOf(keyword.toLowerCase());
  const start = Math.max(0, index - 40);
  const end = start + 180;
  return `${start ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

// LOCATE 按用户输入的字面值做包含匹配，百分号、下划线不会变成通配符。
// 材料属于整卷，因此材料命中时返回该卷中可作答的题目。
const materialMatch = `m.paper_id = p.id AND (
  LOCATE(:keyword, m.title) > 0 OR LOCATE(:keyword, m.summary) > 0
  OR LOCATE(:keyword, m.content) > 0)`;
const fromWhere = `FROM paper_questions AS q
  INNER JOIN real_papers AS p ON p.id = q.paper_id
  WHERE p.status = 'approved' AND q.status = 'approved' AND p.practice_type = :type
  AND (LOCATE(:keyword, p.title) > 0 OR LOCATE(:keyword, p.short_title) > 0
    OR LOCATE(:keyword, q.title) > 0 OR LOCATE(:keyword, q.prompt) > 0
    OR EXISTS (SELECT 1 FROM paper_materials AS m WHERE ${materialMatch}))`;

async function searchGroup(keyword, type, requestedPage) {
  const replacements = { keyword, type };
  const [count] = await sequelize.query(`SELECT COUNT(*) AS total ${fromWhere}`, {
    replacements, type: QueryTypes.SELECT,
  });
  const total = Number(count.total);
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  if (!total) return { type, total, page, pageSize: PAGE_SIZE, list: [] };

  const rows = await sequelize.query(`SELECT q.id AS questionId, q.question_no AS questionNo,
    q.title, q.prompt, p.id AS paperId, p.title AS paperTitle, p.year, p.region,
    (SELECT CONCAT_WS(' ', m.title, m.summary, m.content) FROM paper_materials AS m
      WHERE ${materialMatch} ORDER BY m.material_no ASC, m.id ASC LIMIT 1) AS materialText
    ${fromWhere}
    ORDER BY p.year DESC, p.id DESC, q.question_no ASC, q.id ASC
    LIMIT :limit OFFSET :offset`, {
    replacements: { ...replacements, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
    type: QueryTypes.SELECT,
  });
  return {
    type, total, page, pageSize: PAGE_SIZE,
    list: rows.map(row => {
      const promptMatches = String(row.prompt || '').toLowerCase().includes(keyword.toLowerCase());
      const materialMatches = !promptMatches && Boolean(row.materialText);
      return {
        questionId: String(row.questionId), paperId: String(row.paperId),
        questionNo: row.questionNo, title: row.title, paperTitle: row.paperTitle,
        year: row.year, region: row.region, type,
        excerpt: excerpt(materialMatches ? row.materialText : row.prompt, keyword),
        excerptSource: materialMatches ? '材料正文' : '题干',
      };
    }),
  };
}

async function searchPapers(query) {
  if (typeof query.keyword !== 'string' || !query.keyword.trim()) {
    throw searchError('请输入搜索关键词');
  }
  const keyword = query.keyword.trim();
  if (keyword.length > MAX_KEYWORD_LENGTH) throw searchError('搜索关键词不能超过100个字符');
  const essayPage = parsePage(query.essayPage);
  const interviewPage = parsePage(query.interviewPage);
  const [essay, interview] = await Promise.all([
    searchGroup(keyword, 'essay', essayPage),
    searchGroup(keyword, 'interview', interviewPage),
  ]);
  return { keyword, total: essay.total + interview.total, groups: { essay, interview } };
}

module.exports = { searchPapers };
