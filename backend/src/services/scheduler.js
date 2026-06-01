const cron = require('node-cron');
const { crawlAll } = require('./crawler');
const { processPendingArticles } = require('./processor');

let crawlRunning = false;
let processRunning = false;
let lastCrawlResult = null;
let lastProcessResult = null;
let lastCrawlTime = null;
let lastProcessTime = null;

async function runCrawlCycle() {
  if (crawlRunning) { console.log('[Scheduler] Crawl already running, skip'); return; }
  crawlRunning = true;
  try {
    lastCrawlResult = await crawlAll();
    lastCrawlTime = new Date();
  } catch (e) {
    console.error('[Scheduler] Crawl cycle error:', e.message);
    lastCrawlResult = { error: e.message };
  } finally {
    crawlRunning = false;
  }
}

async function runProcessCycle() {
  if (processRunning) { console.log('[Scheduler] Process already running, skip'); return; }
  processRunning = true;
  try {
    lastProcessResult = await processPendingArticles(3);
    lastProcessTime = new Date();
  } catch (e) {
    console.error('[Scheduler] Process cycle error:', e.message);
    lastProcessResult = { error: e.message };
  } finally {
    processRunning = false;
  }
}

function startScheduler() {
  cron.schedule('0 */4 * * *', () => {
    console.log('[Scheduler] Triggered: crawl cycle');
    runCrawlCycle();
  });

  cron.schedule('30 */4 * * *', () => {
    console.log('[Scheduler] Triggered: process cycle');
    runProcessCycle();
  });

  console.log('[Scheduler] Started: crawl every 4h at :00, process at :30');
}

function getSchedulerStatus() {
  return {
    crawl: { running: crawlRunning, lastResult: lastCrawlResult, lastTime: lastCrawlTime },
    process: { running: processRunning, lastResult: lastProcessResult, lastTime: lastProcessTime },
  };
}

module.exports = { startScheduler, runCrawlCycle, runProcessCycle, getSchedulerStatus };
