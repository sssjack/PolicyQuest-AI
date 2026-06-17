const http = require('http');
const https = require('https');
const crypto = require('crypto');
const cheerio = require('cheerio');
const { sequelize, RealPaper, PaperMaterial, PaperQuestion } = require('../models');

const SITEMAP_URL = 'https://www.aipta.com/sitemap.xml';
const SOURCE_NAME = '爱真题';
const DEFAULT_TARGET_QUESTIONS = 560;
const DEFAULT_MIN_ESSAY_QUESTIONS = 100;
const DEFAULT_MIN_INTERVIEW_QUESTIONS = 400;
const DEFAULT_MAX_SOURCE_PAGES = 2200;
const DEFAULT_MIN_YEAR = 2021;
const CONCURRENCY = 4;

const ESSAY_DIMENSIONS = ['综合分析', '提出对策', '申发论述', '文章写作', '贯彻执行'];
const INTERVIEW_DIMENSIONS = ['审题准确', '逻辑层次', '岗位匹配', '应变处置', '表达感染'];

const REGION_PATTERNS = [
  '北京', '上海', '天津', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽',
  '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西',
  '甘肃', '青海', '内蒙古', '广西', '西藏', '宁夏', '新疆',
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchText(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'PolicyQuestBot/1.0 (+http://www.clockwise.asia/PolicyQuest; educational source import)',
      },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).href;
        res.resume();
        fetchText(nextUrl, timeoutMs).then(resolve, reject);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('request timeout')));
    req.on('error', reject);
  });
}

async function fetchWithRetry(url, timeoutMs = 15000, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetchText(url, timeoutMs);
    } catch (e) {
      lastError = e;
      await sleep(300 * (i + 1));
    }
  }
  throw lastError;
}

function cleanText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function compactTitle(value) {
  return cleanText(value).replace(/\s+/g, '');
}

function hashKey(value) {
  return crypto.createHash('sha1').update(value).digest('hex');
}

function extractArticle(html) {
  const $ = cheerio.load(html);
  const title = compactTitle($('h1').first().text()) || compactTitle($('title').text().replace(/-爱真题.*/, ''));
  const date = cleanText($('.info-meta span').first().text()).match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
  const body = $('.info-body').first();
  const paragraphs = body.find('p')
    .map((_, p) => cleanText($(p).text()))
    .get()
    .filter(Boolean)
    .filter(text => text !== '。。。' && text !== '……');

  return { title, date, paragraphs };
}

function parseYear(title, fallbackDate) {
  const titleYear = Number.parseInt(title.match(/20\d{2}/)?.[0] || '', 10);
  if (Number.isFinite(titleYear)) {
    return titleYear;
  }

  const dateYear = Number.parseInt(String(fallbackDate).slice(0, 4), 10);
  return Number.isFinite(dateYear) ? dateYear : new Date().getFullYear();
}

function detectSystem(title) {
  if (/税务/.test(title)) {
    return { system: 'tax', systemLabel: '税务系统', region: '全国' };
  }
  if (/国考|国家公务员/.test(title)) {
    return { system: 'national', systemLabel: '国考', region: '全国' };
  }
  if (/事业单位/.test(title)) {
    return { system: 'institution', systemLabel: '事业单位', region: detectRegion(title) };
  }
  return { system: 'provincial', systemLabel: '省考', region: detectRegion(title) };
}

function detectRegion(title) {
  const match = REGION_PATTERNS.find(region => title.includes(region));
  return match || '全国';
}

function detectCategory(title, type) {
  const bracket = title.match(/[（(]([^（）()]{1,30})[）)]/)?.[1];
  if (bracket) {
    return bracket;
  }
  if (title.includes('行政执法')) {
    return '行政执法';
  }
  if (title.includes('县乡')) {
    return '县乡卷';
  }
  if (title.includes('省市')) {
    return '省市卷';
  }
  return type === 'essay' ? '申论' : '结构化';
}

function buildTags(title, type, systemLabel, region, category) {
  const tags = [type === 'essay' ? '申论' : '面试', systemLabel, region, category];
  if (title.includes('公安')) {
    tags.push('公安岗');
  }
  if (title.includes('执法')) {
    tags.push('执法岗');
  }
  if (title.includes('乡镇') || title.includes('县乡')) {
    tags.push('基层岗');
  }
  return [...new Set(tags.filter(Boolean))];
}

function isSectionHeading(text, section) {
  const compact = cleanText(text).replace(/\s+/g, '').replace(/[:：]$/, '');
  if (section === 'material') {
    return /^([一二三四五六七八九十]+、)?给定(?:资料|材料)$/.test(compact);
  }
  if (section === 'question') {
    return /^([一二三四五六七八九十]+、)?作答要求$/.test(compact);
  }
  return false;
}

function findSectionIndex(paragraphs, section) {
  return paragraphs.findIndex(text => isSectionHeading(text, section));
}

function getEssayMaterials(paragraphs) {
  const materialStart = findSectionIndex(paragraphs, 'material');
  const questionStart = findSectionIndex(paragraphs, 'question');
  const source = questionStart > 0
    ? paragraphs.slice(materialStart >= 0 ? materialStart + 1 : 0, questionStart)
    : [];
  const materials = [];
  let current = null;

  for (const text of source) {
    const match = text.match(/^材料\s*([一二三四五六七八九十\d]+)\s*$/)
      || text.match(/^给定(?:资料|材料)\s*([一二三四五六七八九十\d]+)\s*$/);
    if (match) {
      if (current) {
        materials.push(current);
      }
      current = { title: `材料${match[1]}`, lines: [] };
      continue;
    }
    if (!current) {
      current = { title: '材料1', lines: [] };
    }
    current.lines.push(text);
  }

  if (current) {
    materials.push(current);
  }

  return materials
    .map((item, index) => {
      const content = item.lines.join('\n\n');
      return {
        materialNo: index + 1,
        title: item.title,
        summary: item.lines[0] ? item.lines[0].slice(0, 120) : item.title,
        content,
        wordCount: content.replace(/\s/g, '').length,
      };
    })
    .filter(item => item.content.length > 0);
}

function isQuestionLine(text) {
  return /^\d+[.．、]\s*/.test(text) || /^第[一二三四五六七八九十\d]+题[：:]?/.test(text);
}

function stripQuestionPrefix(text) {
  return text
    .replace(/^\d+[.．、]\s*/, '')
    .replace(/^第[一二三四五六七八九十\d]+题[：:]?\s*/, '')
    .trim();
}

function getQuestionSections(paragraphs) {
  const questionStart = findSectionIndex(paragraphs, 'question');
  const answerStart = paragraphs.findIndex(text => /(参考答案|答案解析|解析与参考答案|审题重点)/.test(text));
  const end = answerStart > questionStart ? answerStart : paragraphs.length;
  const source = questionStart >= 0 ? paragraphs.slice(questionStart + 1, end) : paragraphs.slice(0, end);
  const sections = [];
  let current = null;

  for (const text of source) {
    if (isQuestionLine(text)) {
      if (current) {
        sections.push(current);
      }
      current = { prompt: stripQuestionPrefix(text), requirements: [] };
      continue;
    }
    if (current) {
      current.requirements.push(text);
    }
  }
  if (current) {
    sections.push(current);
  }

  return sections.filter(item => item.prompt.length >= 8);
}

function detectEssayQuestionType(prompt) {
  if (/写一篇|自拟题目|自选角度|文章|作文/.test(prompt)) {
    return 'essay_article';
  }
  if (/建议|对策|措施|解决|提出/.test(prompt)) {
    return 'essay_solution';
  }
  if (/报告|简报|短评|发言|讲话|倡议|通知|提纲|情况/.test(prompt)) {
    return 'essay_implementation';
  }
  if (/理解|分析|谈谈|为什么|原因|看法/.test(prompt)) {
    return 'essay_analysis';
  }
  return 'essay_summary';
}

function detectInterviewQuestionType(prompt, title) {
  if (/现场模拟|情景模拟|请模拟|劝说|请你沟通/.test(prompt)) {
    return 'interview_simulate';
  }
  if (/同事|领导|下属|关系|不配合|误解|矛盾|沟通/.test(prompt)) {
    return 'interview_interpersonal';
  }
  if (/组织|开展|活动|调研|宣传|培训|座谈|会议|接待|方案|筹备/.test(prompt)) {
    return 'interview_organize';
  }
  if (/突然|投诉|曝光|舆情|冲突|事故|紧急|应急|怎么办|处理/.test(prompt)) {
    return 'interview_emergency';
  }
  if (/岗位|报考|职业规划|公务员|基层成长|青年干部|年轻干部/.test(prompt)) {
    return 'interview_position';
  }
  if (/税务|纳税|办税|税收/.test(prompt) || /税务/.test(title)) {
    return 'interview_tax';
  }
  if (/基层|社区|乡村|群众|村民|治理/.test(prompt)) {
    return 'interview_grassroots';
  }
  if (/政策|落实|推行|实施|制度/.test(prompt)) {
    return 'interview_policy';
  }
  return 'interview_analysis';
}

function parseScore(prompt, fallback) {
  const score = Number.parseInt(prompt.match(/[（(]?(\d{1,3})分[）)]?/)?.[1] || '', 10);
  return Number.isFinite(score) ? score : fallback;
}

function parseWordLimit(prompt, requirements, fallback) {
  const text = [prompt, ...requirements].join('\n');
  const direct = text.match(/不超过\s*(\d{2,4})\s*字|(\d{2,4})\s*字以内/);
  if (direct) {
    return Number.parseInt(direct[1] || direct[2], 10);
  }
  const range = text.match(/(\d{2,4})\s*[—～~-]\s*(\d{2,4})\s*字/);
  if (range) {
    return Number.parseInt(range[2], 10);
  }
  return fallback;
}

function buildQuestionTitle(prompt, no) {
  return cleanText(prompt)
    .replace(/[。！？；;].*$/, '')
    .slice(0, 48) || `第${no}题`;
}

function getEssayQuestions(paragraphs) {
  return getQuestionSections(paragraphs).map((section, index) => {
    const questionType = detectEssayQuestionType(section.prompt);
    return {
      questionNo: index + 1,
      questionType,
      title: buildQuestionTitle(section.prompt, index + 1),
      prompt: section.prompt,
      score: parseScore(section.prompt, questionType === 'essay_article' ? 35 : 20),
      wordLimit: parseWordLimit(section.prompt, section.requirements, questionType === 'essay_article' ? 1200 : 500),
      suggestedMinutes: questionType === 'essay_article' ? 70 : 25,
      requirements: section.requirements.length ? section.requirements : ['紧扣材料', '条理清晰', '按题干要求作答'],
      dimensions: questionType === 'essay_article'
        ? ['综合分析', '申发论述', '文章写作']
        : ['综合分析', '提出对策', '贯彻执行'],
      sampleAnswer: '本题为历年真题入库题，请结合给定材料与作答要求完成作答。AI 评阅会根据你的答案生成诊断建议。',
    };
  });
}

function getInterviewQuestions(paragraphs, title) {
  const topicStart = paragraphs.findIndex(text => text === '题目' || /^题目[:：]?$/.test(text));
  const answerStart = paragraphs.findIndex(text => /(第1题解析|第1题参考答案|审题重点|解析与参考答案)/.test(text));
  const start = topicStart >= 0 ? topicStart + 1 : 0;
  const end = answerStart > start ? answerStart : paragraphs.length;
  const source = paragraphs.slice(start, end);
  const sections = [];
  let current = null;

  for (const text of source) {
    if (/^第\d+题[：:]?$/.test(text) || /^\d+[.．、]\s*/.test(text)) {
      if (current) {
        sections.push(current);
      }
      current = { prompt: '' };
      const stripped = stripQuestionPrefix(text);
      if (stripped) {
        current.prompt = stripped;
      }
      continue;
    }
    if (current && !current.prompt) {
      current.prompt = text;
      continue;
    }
    if (current && current.prompt) {
      current.prompt = `${current.prompt}\n${text}`;
    }
  }
  if (current) {
    sections.push(current);
  }

  return sections
    .map((section, index) => {
      const prompt = cleanText(section.prompt);
      const questionType = detectInterviewQuestionType(prompt, title);
      return {
        questionNo: index + 1,
        questionType,
        title: buildQuestionTitle(prompt, index + 1),
        prompt,
        score: 100,
        wordLimit: 600,
        suggestedMinutes: 7,
        requirements: ['观点明确', '层次清晰', '结合岗位身份作答'],
        dimensions: INTERVIEW_DIMENSIONS,
        sampleAnswer: '本题为历年面试真题入库题，请按结构化面试口径作答。AI 评阅会给出表达、逻辑和岗位匹配建议。',
      };
    })
    .filter(item => item.prompt.length >= 8);
}

function getInterviewMaterials(paragraphs) {
  const topicStart = paragraphs.findIndex(text => text === '题目' || /^题目[:：]?$/.test(text));
  const lines = topicStart > 0 ? paragraphs.slice(0, topicStart) : paragraphs.slice(0, 2);
  const content = lines.join('\n\n') || '结构化面试真题。请仔细看题，认真准备，回答问题要抓住要点，把握好时间。';
  return [{
    materialNo: 1,
    title: '面试说明',
    summary: '结构化面试题目背景与作答说明',
    content,
    wordCount: content.replace(/\s/g, '').length,
  }];
}

function parsePaper(url, html) {
  const article = extractArticle(html);
  if (!article.title || article.paragraphs.length === 0) {
    return null;
  }
  const isEssay = article.title.includes('申论真题');
  const isInterview = article.title.includes('面试真题');
  if (!isEssay && !isInterview) {
    return null;
  }
  if (/(模拟|预测|技巧|公告|名单|职位|下载|汇总)/.test(article.title)) {
    return null;
  }

  const type = isEssay ? 'essay' : 'interview';
  const year = parseYear(article.title, article.date);
  const systemInfo = detectSystem(article.title);
  const category = detectCategory(article.title, type);
  const materials = type === 'essay' ? getEssayMaterials(article.paragraphs) : getInterviewMaterials(article.paragraphs);
  const questions = type === 'essay'
    ? getEssayQuestions(article.paragraphs)
    : getInterviewQuestions(article.paragraphs, article.title);

  if (type === 'essay' && materials.length === 0) {
    return null;
  }
  if (questions.length === 0) {
    return null;
  }

  const tags = buildTags(article.title, type, systemInfo.systemLabel, systemInfo.region, category);
  return {
    paperKey: hashKey(url),
    practiceType: type,
    title: article.title,
    shortTitle: article.title
      .replace(/真题及答案解析/g, '真题')
      .replace(/公务员/g, '')
      .slice(0, 80),
    system: systemInfo.system,
    systemLabel: systemInfo.systemLabel,
    region: systemInfo.region,
    year,
    category,
    paperCode: `${type === 'essay' ? 'SL' : 'MS'}-${year}-${hashKey(url).slice(0, 8).toUpperCase()}`,
    sourceName: SOURCE_NAME,
    sourceUrl: url,
    releaseDate: article.date || String(year),
    difficulty: year >= 2024 ? '中等偏上' : '中等',
    suggestedMinutes: type === 'essay' ? 150 : Math.max(15, questions.length * 7),
    questionCount: questions.length,
    tags,
    weakDimensions: type === 'essay' ? ['提出对策', '贯彻执行'] : ['逻辑层次', '应变处置'],
    materials,
    questions,
  };
}

async function loadSitemapUrls() {
  const xml = await fetchWithRetry(SITEMAP_URL, 20000, 5);
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map(match => match[1])
    .filter(url => url.includes('/article/'));
}

async function collectPapers(options = {}) {
  const minYear = Number.parseInt(options.minYear || DEFAULT_MIN_YEAR, 10);
  const targetQuestions = Number.parseInt(options.targetQuestions || DEFAULT_TARGET_QUESTIONS, 10);
  const minEssayQuestions = Number.parseInt(options.minEssayQuestions || DEFAULT_MIN_ESSAY_QUESTIONS, 10);
  const minInterviewQuestions = Number.parseInt(options.minInterviewQuestions || DEFAULT_MIN_INTERVIEW_QUESTIONS, 10);
  const maxSourcePages = Number.parseInt(options.maxSourcePages || DEFAULT_MAX_SOURCE_PAGES, 10);
  const urls = (await loadSitemapUrls()).slice(0, maxSourcePages);
  const papers = [];
  let scanned = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < urls.length && !hasEnoughQuestions(papers, targetQuestions, minEssayQuestions, minInterviewQuestions)) {
      const url = urls[cursor];
      cursor += 1;
      try {
        const html = await fetchWithRetry(url, 12000, 2);
        const paper = parsePaper(url, html);
        if (paper && paper.year >= minYear) {
          papers.push(paper);
        }
      } catch (e) {
        // Source pages can be intermittently unavailable; skip and continue.
      } finally {
        scanned += 1;
        if (scanned % 100 === 0) {
          const counts = countQuestionsByType(papers);
          console.log(
            `[real-paper-import] scanned=${scanned}, papers=${papers.length}, questions=${counts.total}, `
            + `essay=${counts.essay}, interview=${counts.interview}`,
          );
        }
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return papers.sort((a, b) => b.year - a.year || b.questionCount - a.questionCount);
}

function countQuestions(papers) {
  return papers.reduce((sum, paper) => sum + paper.questions.length, 0);
}

function countQuestionsByType(papers) {
  return papers.reduce((summary, paper) => {
    const count = paper.questions.length;
    summary.total += count;
    if (paper.practiceType === 'essay') {
      summary.essay += count;
    } else if (paper.practiceType === 'interview') {
      summary.interview += count;
    }
    return summary;
  }, { total: 0, essay: 0, interview: 0 });
}

function hasEnoughQuestions(papers, targetQuestions, minEssayQuestions, minInterviewQuestions) {
  const counts = countQuestionsByType(papers);
  return counts.total >= targetQuestions
    && counts.essay >= minEssayQuestions
    && counts.interview >= minInterviewQuestions;
}

async function savePaper(paperData) {
  return sequelize.transaction(async transaction => {
    const [paper] = await RealPaper.findOrCreate({
      where: { paper_key: paperData.paperKey },
      defaults: {
        paper_key: paperData.paperKey,
        practice_type: paperData.practiceType,
        title: paperData.title,
        short_title: paperData.shortTitle,
        system: paperData.system,
        system_label: paperData.systemLabel,
        region: paperData.region,
        year: paperData.year,
        category: paperData.category,
        paper_code: paperData.paperCode,
        source_name: paperData.sourceName,
        source_url: paperData.sourceUrl,
        release_date: paperData.releaseDate,
        difficulty: paperData.difficulty,
        suggested_minutes: paperData.suggestedMinutes,
        question_count: paperData.questionCount,
        tags: paperData.tags,
        weak_dimensions: paperData.weakDimensions,
        status: 'approved',
        imported_at: new Date(),
      },
      transaction,
    });

    await paper.update({
      practice_type: paperData.practiceType,
      title: paperData.title,
      short_title: paperData.shortTitle,
      system: paperData.system,
      system_label: paperData.systemLabel,
      region: paperData.region,
      year: paperData.year,
      category: paperData.category,
      paper_code: paperData.paperCode,
      source_name: paperData.sourceName,
      source_url: paperData.sourceUrl,
      release_date: paperData.releaseDate,
      difficulty: paperData.difficulty,
      suggested_minutes: paperData.suggestedMinutes,
      question_count: paperData.questionCount,
      tags: paperData.tags,
      weak_dimensions: paperData.weakDimensions,
      status: 'approved',
      imported_at: new Date(),
    }, { transaction });

    await PaperMaterial.destroy({ where: { paper_id: paper.id }, transaction });
    await PaperQuestion.destroy({ where: { paper_id: paper.id }, transaction });

    await PaperMaterial.bulkCreate(paperData.materials.map(material => ({
      paper_id: paper.id,
      material_no: material.materialNo,
      title: material.title,
      summary: material.summary,
      content: material.content,
      word_count: material.wordCount,
      source_url: paperData.sourceUrl,
    })), { transaction });

    await PaperQuestion.bulkCreate(paperData.questions.map(question => ({
      paper_id: paper.id,
      question_no: question.questionNo,
      question_type: question.questionType,
      title: question.title,
      prompt: question.prompt,
      score: question.score,
      word_limit: question.wordLimit,
      suggested_minutes: question.suggestedMinutes,
      requirements: question.requirements,
      dimensions: question.dimensions,
      sample_answer: question.sampleAnswer,
      source_url: paperData.sourceUrl,
      status: 'approved',
    })), { transaction });

    return paper.id;
  });
}

async function importRealPapers(options = {}) {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const papers = await collectPapers(options);
  let imported = 0;
  for (const paper of papers) {
    await savePaper(paper);
    imported += 1;
    if (imported % 25 === 0) {
      console.log(`[real-paper-import] imported=${imported}/${papers.length}`);
    }
  }

  const [paperCount, questionCount] = await Promise.all([
    RealPaper.count({ where: { status: 'approved' } }),
    PaperQuestion.count(),
  ]);

  return {
    importedPapers: imported,
    importedQuestions: countQuestions(papers),
    totalPapers: paperCount,
    totalQuestions: questionCount,
  };
}

async function importRealPaperUrls(urls = []) {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const papers = [];
  for (const url of urls) {
    const html = await fetchWithRetry(url, 15000, 3);
    const paper = parsePaper(url, html);
    if (!paper) {
      throw new Error(`Unable to parse real paper source: ${url}`);
    }
    papers.push(paper);
  }

  let imported = 0;
  for (const paper of papers) {
    await savePaper(paper);
    imported += 1;
  }

  const [paperCount, questionCount] = await Promise.all([
    RealPaper.count({ where: { status: 'approved' } }),
    PaperQuestion.count(),
  ]);

  return {
    importedPapers: imported,
    importedQuestions: countQuestions(papers),
    totalPapers: paperCount,
    totalQuestions: questionCount,
    papers: papers.map(paper => ({
      title: paper.title,
      year: paper.year,
      category: paper.category,
      questions: paper.questions.length,
      sourceUrl: paper.sourceUrl,
    })),
  };
}

module.exports = {
  importRealPapers,
  importRealPaperUrls,
  collectPapers,
  parsePaper,
};
