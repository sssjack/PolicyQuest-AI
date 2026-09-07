require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sequelize } = require('../models');
const { parsePaper, savePaper } = require('./real-paper-importer');

// 清单只保存来源和核验信息；题干、材料从已核验的公开试卷缓存中读取。
async function loadBank(cacheDir, manifest) {
  const papers = [];
  for (const source of manifest.papers) {
    const html = fs.readFileSync(path.join(cacheDir, source.file), 'utf8');
    const digest = crypto.createHash('sha256').update(html).digest('hex');
    if (digest !== source.sha256) throw new Error(`来源缓存校验失败：${source.url}`);
    const paper = parsePaper(source.url, html);
    if (!paper || paper.questions.length !== source.questionCount || paper.questions.some((q, i) => q.score !== source.scores[i])) throw new Error(`题目数量或原题分值发生变化：${source.url}`);
    if (paper.materials.length !== source.materialCount) throw new Error(`材料分段发生变化：${source.url}`);
    paper.sourceName = '爱真题公开整理（非官方评分细则）';
    if (source.subjectiveOnly) paper.tags.push('仅收录主观题');
    papers.push(paper);
  }
  return papers;
}

async function main() {
  const cacheDir = process.argv[2];
  if (!cacheDir) throw new Error('用法：node src/seeds/import-essay-bank.js <已核验HTML缓存目录> [--dry-run]');
  const manifest = require('./essay-sources-2022-2026.json');
  const papers = await loadBank(cacheDir, manifest);
  if (!process.argv.includes('--dry-run')) {
    await sequelize.authenticate();
    for (let start = 0; start < papers.length; start += 4) {
      await Promise.all(papers.slice(start, start + 4).map(savePaper));
      console.log(`Imported ${Math.min(start + 4, papers.length)}/${papers.length} papers`);
    }
  }
  console.log(JSON.stringify({ dryRun: process.argv.includes('--dry-run'), papers: papers.length, questions: papers.reduce((sum, p) => sum + p.questions.length, 0) }));
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => sequelize.close());
module.exports = { loadBank };
