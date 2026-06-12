const RssParser = require('rss-parser');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { Article, ArticleSource, sequelize } = require('../models');
const { Op } = require('sequelize');

const rssParser = new RssParser({
  timeout: 15000,
  headers: { 'User-Agent': 'PolicyQuestBot/1.0 (+http://www.clockwise.asia/PolicyQuest; educational research)' },
});

const RSS_SOURCES = [
  { name: '人民日报', url: 'http://www.people.com.cn/rss/politics.xml', category: '新闻报道' },
  { name: '人民日报评论', url: 'http://www.people.com.cn/rss/opinion.xml', category: '评论文章' },
  { name: '新华网时政', url: 'http://www.news.cn/politics/xhszrss.xml', category: '新闻报道' },
  { name: '新华网评论', url: 'http://www.news.cn/comments/xhplrss.xml', category: '评论文章' },
  { name: '求是网', url: 'http://www.qstheory.cn/rss/qsrss.xml', category: '政策解读' },
  { name: '光明日报', url: 'https://www.gmw.cn/rss/politics.xml', category: '新闻报道' },
];

const WEB_SOURCES = [
  {
    name: '中国政府网-政策', base_url: 'http://www.gov.cn/zhengce/zuixin.htm',
    category: '政策文件',
    parse: ($) => {
      const items = [];
      $('ul.news_box li, .news_box .list li, .list_02 li').each((_, el) => {
        const a = $(el).find('a');
        const title = a.text().trim();
        let href = a.attr('href') || '';
        if (href && !href.startsWith('http')) href = 'http://www.gov.cn' + href;
        const dateText = $(el).find('span, .date').text().trim();
        if (title && href) items.push({ title, url: href, date: dateText });
      });
      return items;
    }
  },
  {
    name: '中国政府网-解读', base_url: 'http://www.gov.cn/zhengce/jiedu.htm',
    category: '政策解读',
    parse: ($) => {
      const items = [];
      $('ul.news_box li, .news_box .list li, .list_02 li').each((_, el) => {
        const a = $(el).find('a');
        const title = a.text().trim();
        let href = a.attr('href') || '';
        if (href && !href.startsWith('http')) href = 'http://www.gov.cn' + href;
        if (title && href) items.push({ title, url: href });
      });
      return items;
    }
  },
];

function contentHash(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex');
}

function parseDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  const m = String(raw).match(/(\d{4})[-\/年.](\d{1,2})[-\/月.](\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return null;
}

function isCurrentYear(d) {
  if (!d) return true;
  return d.getFullYear() === new Date().getFullYear();
}

function extractMainContent(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, .nav, .header, .footer, .sidebar, .ad, .comment, iframe, noscript').remove();
  const selectors = ['article', '.article-content', '.content', '.article_body', '.article', '#content', '.text_con', '.text_show', '.pages_content', '.TRS_Editor'];
  for (const sel of selectors) {
    const el = $(sel);
    if (el.length && el.text().trim().length > 100) {
      return el.text().replace(/\s+/g, ' ').trim();
    }
  }
  return $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);
}

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const resp = await fetch(url, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PolicyQuestBot/1.0; +http://www.clockwise.asia/PolicyQuest)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buf = await resp.buffer();
      let text = buf.toString('utf-8');
      if (text.includes('charset=gb2312') || text.includes('charset=gbk') || text.includes('charset=GB2312')) {
        const iconv = require('iconv-lite');
        text = iconv.decode(buf, 'gbk');
      }
      return text;
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

async function crawlRssSources() {
  const results = { success: 0, failed: 0, skipped: 0, articles: [] };

  for (const src of RSS_SOURCES) {
    try {
      console.log(`[Crawler] Fetching RSS: ${src.name} -> ${src.url}`);
      const feed = await rssParser.parseURL(src.url);
      const dbSource = await ArticleSource.findOne({ where: { name: src.name.replace(/评论|时政/g, '').trim() } });
      const sourceId = dbSource ? dbSource.id : 1;

      for (const item of (feed.items || []).slice(0, 15)) {
        try {
          const title = (item.title || '').trim();
          if (!title || title.length < 5) continue;

          const hash = contentHash(title);
          const exists = await Article.findOne({ where: { content_hash: hash } });
          if (exists) { results.skipped++; continue; }

          let content = item.contentSnippet || item.content || '';
          let fullContent = '';
          if (item.link) {
            try {
              const html = await fetchWithRetry(item.link);
              fullContent = extractMainContent(html);
            } catch (e) { /* use RSS content */ }
          }

          const articleContent = fullContent.length > content.length ? fullContent : content;
          if (articleContent.length < 50) { results.skipped++; continue; }

          const pubDate = parseDate(item.pubDate) || new Date();
          if (!isCurrentYear(pubDate)) { results.skipped++; continue; }

          const article = await Article.create({
            source_id: sourceId,
            title,
            url: item.link || '',
            publish_time: pubDate,
            author: item.creator || item.author || src.name,
            content: articleContent.substring(0, 20000),
            summary: articleContent.substring(0, 300),
            content_hash: hash,
            category: src.category,
            region: '全国',
            tags: [],
            status: 'pending',
          });

          results.articles.push({ id: article.id, title });
          results.success++;
          await new Promise(r => setTimeout(r, 1500));
        } catch (e) {
          console.error(`[Crawler] Article error: ${e.message}`);
          results.failed++;
        }
      }

      if (dbSource) await dbSource.update({ last_crawl_at: new Date() });
    } catch (e) {
      console.error(`[Crawler] RSS source error (${src.name}): ${e.message}`);
      results.failed++;
    }
  }

  return results;
}

async function crawlWebSources() {
  const results = { success: 0, failed: 0, skipped: 0, articles: [] };

  for (const src of WEB_SOURCES) {
    try {
      console.log(`[Crawler] Fetching Web: ${src.name} -> ${src.base_url}`);
      const html = await fetchWithRetry(src.base_url);
      const $ = cheerio.load(html);
      const items = src.parse($);

      const dbSource = await ArticleSource.findOne({ where: { name: { [Op.like]: '%政府网%' } } });
      const sourceId = dbSource ? dbSource.id : 1;

      for (const item of items.slice(0, 10)) {
        try {
          const title = item.title.trim();
          if (!title || title.length < 5) continue;

          const hash = contentHash(title);
          const exists = await Article.findOne({ where: { content_hash: hash } });
          if (exists) { results.skipped++; continue; }

          let content = '';
          if (item.url) {
            try {
              const pageHtml = await fetchWithRetry(item.url);
              content = extractMainContent(pageHtml);
            } catch (e) { /* skip */ }
          }
          if (content.length < 50) { results.skipped++; continue; }

          const pubDate = parseDate(item.date) || new Date();
          if (!isCurrentYear(pubDate)) { results.skipped++; continue; }

          const article = await Article.create({
            source_id: sourceId,
            title,
            url: item.url || '',
            publish_time: pubDate,
            content: content.substring(0, 20000),
            summary: content.substring(0, 300),
            content_hash: hash,
            category: src.category,
            region: '全国',
            tags: [],
            status: 'pending',
          });

          results.articles.push({ id: article.id, title });
          results.success++;
          await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
          results.failed++;
        }
      }
    } catch (e) {
      console.error(`[Crawler] Web source error (${src.name}): ${e.message}`);
      results.failed++;
    }
  }

  return results;
}

async function crawlAll() {
  console.log('[Crawler] Starting full crawl cycle...');
  const startTime = Date.now();

  const rssResults = await crawlRssSources();
  const webResults = await crawlWebSources();

  const total = {
    success: rssResults.success + webResults.success,
    failed: rssResults.failed + webResults.failed,
    skipped: rssResults.skipped + webResults.skipped,
    articles: [...rssResults.articles, ...webResults.articles],
    duration: Date.now() - startTime,
  };

  console.log(`[Crawler] Crawl complete: ${total.success} new, ${total.skipped} skipped, ${total.failed} failed (${(total.duration / 1000).toFixed(1)}s)`);
  return total;
}

module.exports = { crawlAll, crawlRssSources, crawlWebSources };
