const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { sequelize } = require('./models');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', limiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/practice', require('./routes/practice'));
app.use('/api/wrongbook', require('./routes/wrongbook'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/scoring', require('./routes/scoring'));
app.use('/api/real-papers', require('./routes/real-papers'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ alter: true });
    console.log('Database synced');

    const { seedData } = require('./seeds/initial');
    await seedData();

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`PolicyQuest API running on port ${config.port}`);

      if (config.crawlerSchedulerEnabled) {
        const { startScheduler } = require('./services/scheduler');
        startScheduler();
      } else {
        console.log('Crawler scheduler disabled for PolicyQuest AI Exam Coach');
      }
    });
  } catch (e) {
    console.error('Failed to start:', e);
    process.exit(1);
  }
}

start();

module.exports = app;
