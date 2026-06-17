require('dotenv').config();

const { sequelize } = require('../models');
const { importRealPaperUrls } = require('./real-paper-importer');

const PAPER_URLS = [
  'https://www.aipta.com/article/10613.html',
  'https://www.aipta.com/article/10614.html',
  'https://www.aipta.com/article/10612.html',
  'https://www.aipta.com/article/10611.html',
  'https://www.aipta.com/article/10621.html',
  'https://www.aipta.com/article/10622.html',
  'https://www.aipta.com/article/10623.html',
];

async function main() {
  const result = await importRealPaperUrls(PAPER_URLS);
  console.log('[real-paper-import:2026-provincial-essay] completed', JSON.stringify(result, null, 2));
}

main()
  .catch(e => {
    console.error('[real-paper-import:2026-provincial-essay] failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
