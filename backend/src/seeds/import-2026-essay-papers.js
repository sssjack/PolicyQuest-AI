require('dotenv').config();

const { sequelize } = require('../models');
const { importRealPaperUrls } = require('./real-paper-importer');

const PAPER_URLS = [
  'https://www.aipta.com/article/10624.html',
  'https://www.aipta.com/article/10625.html',
  'https://www.aipta.com/article/10455.html',
];

async function main() {
  const result = await importRealPaperUrls(PAPER_URLS);
  console.log('[real-paper-import:2026-essay] completed', JSON.stringify(result, null, 2));
}

main()
  .catch(e => {
    console.error('[real-paper-import:2026-essay] failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
