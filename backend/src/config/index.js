require('dotenv').config();

const apiyiBaseUrl = process.env.APIYI_BASE_URL || process.env.LLM_BASE_URL;
const llm = {
  provider: process.env.LLM_PROVIDER || 'apiyi',
  baseUrl: apiyiBaseUrl,
  apiUrl:
    process.env.APIYI_API_URL ||
    process.env.LLM_API_URL ||
    process.env.DEEPSEEK_API_URL ||
    (apiyiBaseUrl ? `${apiyiBaseUrl.replace(/\/$/, '')}/chat/completions` : undefined),
  apiKey:
    process.env.APIYI_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.DEEPSEEK_API_KEY,
  model: process.env.APIYI_MODEL || process.env.LLM_MODEL || process.env.DEEPSEEK_MODEL || 'gpt-5.4-thinking-all',
};

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'policyquest',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    pool: { max: 20, min: 5, acquire: 30000, idle: 10000 }
  },
  llm,
  deepseek: llm,
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000'
};
