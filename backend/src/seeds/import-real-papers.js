require('dotenv').config();

const { sequelize } = require('../models');
const { importRealPapers } = require('./real-paper-importer');

function readNumberEnv(name, defaultValue) {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) ? value : defaultValue;
}

async function main() {
  const result = await importRealPapers({
    targetQuestions: readNumberEnv('REAL_PAPER_TARGET_QUESTIONS', 560),
    minEssayQuestions: readNumberEnv('REAL_PAPER_MIN_ESSAY_QUESTIONS', 100),
    minInterviewQuestions: readNumberEnv('REAL_PAPER_MIN_INTERVIEW_QUESTIONS', 400),
    maxSourcePages: readNumberEnv('REAL_PAPER_MAX_SOURCE_PAGES', 2200),
    minYear: readNumberEnv('REAL_PAPER_MIN_YEAR', 2021),
  });

  console.log('[real-paper-import] completed', JSON.stringify(result, null, 2));
}

main()
  .catch(e => {
    console.error('[real-paper-import] failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
