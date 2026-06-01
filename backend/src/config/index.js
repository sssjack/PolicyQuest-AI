require('dotenv').config();

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
  deepseek: {
    apiUrl: process.env.DEEPSEEK_API_URL,
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  },
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000'
};
